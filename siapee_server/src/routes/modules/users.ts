import { Router, Response, Request } from 'express';
import { authenticate, AuthRequest } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { prisma } from '../../lib/prisma';
import { logAudit } from '../../lib/audit';
import { makeMulter } from '../../lib/upload';
import path from 'path';

export const usersRouter = Router();
const upload = makeMulter('avatars');

// Listar usuários (ADMIN e SECRETARY)
usersRouter.get('/', authenticate, authorize(['ADMIN','SECRETARY']), async (req: AuthRequest, res: Response) => {
  const list = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarUrl: true,
      phone: true,
      birthDate: true,
      createdAt: true,
    }
  })
  const host = req.get('host');
  const proto = (req as Request).protocol;
  const normalized = list.map(u => ({
    ...u,
    avatarUrl: u.avatarUrl && u.avatarUrl.startsWith('/uploads') ? `${proto}://${host}${u.avatarUrl}` : u.avatarUrl
  }))
  res.json(normalized)
})

usersRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true, 
      avatarUrl: true, 
      phone: true, 
      birthDate: true
    }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Ensure avatarUrl is absolute for frontend consumption
  const host = req.get('host');
  const proto = (req as Request).protocol;
  const absolute = user.avatarUrl && user.avatarUrl.startsWith('/uploads') ? `${proto}://${host}${user.avatarUrl}` : user.avatarUrl
  return res.json({ ...user, avatarUrl: absolute });
});

usersRouter.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, email, phone, birthDate, genderId } = req.body ?? {}
  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { 
      name: name ?? undefined, 
      email: email ?? undefined, 
      phone: phone ?? undefined,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      genderId: genderId ?? undefined
    },
    select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, birthDate: true }
  })
  logAudit({ userId: req.userId, action: 'USER_UPDATE', entity: 'User', entityId: updated.id, metadata: { fields: Object.keys(req.body || {}) } })
  res.json(updated)
})

// Upload avatar
usersRouter.post('/me/avatar', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File required' })
  const relative = `/uploads/avatars/${req.file.filename}`
  const updated = await prisma.user.update({ where: { id: req.userId }, data: { avatarUrl: relative }, select: { id:true, name:true, email:true, role:true, avatarUrl:true } })
  logAudit({ userId: req.userId, action: 'USER_AVATAR_UPLOAD', entity: 'User', entityId: updated.id })
  const host = req.get('host');
  const proto = (req as Request).protocol;
  res.json({ ...updated, avatarUrl: `${proto}://${host}${relative}` })
})

// Excluir usuário (ADMIN pode excluir qualquer um, SECRETARY não pode excluir ADMIN)
usersRouter.delete('/:id', authenticate, authorize(['ADMIN','SECRETARY']), async (req: AuthRequest, res: Response) => {
  const targetId = req.params.id
  if (!targetId) return res.status(400).json({ error: 'User id required' })
  // Não permitir autoexclusão
  if (req.userId === targetId) return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário' })

  const [current, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } }),
    prisma.user.findUnique({ where: { id: targetId }, select: { id:true, role:true } })
  ])
  if (!target) return res.status(404).json({ error: 'Usuário não encontrado' })
  if (!current) return res.status(401).json({ error: 'Unauthorized' })
  if (current.role === 'SECRETARY' && target.role === 'ADMIN') {
    return res.status(403).json({ error: 'Secretaria não pode excluir administradores' })
  }

  try {
    // Evitar FK para solicitações decididas (set null)
    await prisma.signupRequest.updateMany({ where: { decidedById: targetId }, data: { decidedById: null } })
    // Tentar excluir (Activities/Projects possuem onDelete Restrict)
    await prisma.user.delete({ where: { id: targetId } })
    logAudit({ userId: req.userId, action: 'USER_DELETE', entity: 'User', entityId: targetId })
    return res.status(204).send()
  } catch (e: any) {
    // P2003: Foreign key violation (ex.: tem atividades/projetos)
    if (e?.code === 'P2003' || e?.code === 'P2014') {
      return res.status(409).json({ error: 'Não é possível excluir: usuário possui vínculos (atividades/projetos ou registros relacionados)' })
    }
    return res.status(500).json({ error: 'Falha ao excluir usuário' })
  }
})
