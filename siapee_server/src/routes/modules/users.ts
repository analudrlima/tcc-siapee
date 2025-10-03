import { Router, Response, Request } from 'express';
import { authenticate, AuthRequest } from '../../middlewares/authenticate';
import { prisma } from '../../lib/prisma';
import { makeMulter } from '../../lib/upload';
import path from 'path';

export const usersRouter = Router();
const upload = makeMulter('avatars');

usersRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, role: true, avatarUrl: true }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  // Ensure avatarUrl is absolute for frontend consumption
  const host = req.get('host');
  const proto = (req as Request).protocol;
  const absolute = user.avatarUrl && user.avatarUrl.startsWith('/uploads') ? `${proto}://${host}${user.avatarUrl}` : user.avatarUrl
  return res.json({ ...user, avatarUrl: absolute });
});

usersRouter.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { name, email, phone } = req.body ?? {}
  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { name: name ?? undefined, email: email ?? undefined, phone: phone ?? undefined },
    select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true }
  })
  res.json(updated)
})

// Upload avatar
usersRouter.post('/me/avatar', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File required' })
  const relative = `/uploads/avatars/${req.file.filename}`
  const updated = await prisma.user.update({ where: { id: req.userId }, data: { avatarUrl: relative }, select: { id:true, name:true, email:true, role:true, avatarUrl:true } })
  const host = req.get('host');
  const proto = (req as Request).protocol;
  res.json({ ...updated, avatarUrl: `${proto}://${host}${relative}` })
})
