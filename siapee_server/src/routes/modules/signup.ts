import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { authenticate, AuthRequest } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';

export const signupRouter = Router();

const requestSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  roleRequested: z.enum(['TEACHER', 'SECRETARY'])
});

// Usuários interessados solicitam cadastro
signupRouter.post('/request', async (req: Request, res: Response) => {
  const parse = requestSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
  const { name, email, roleRequested, password } = parse.data;
  const exists = await (prisma as any).signupRequest.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'Request already exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await (prisma as any).signupRequest.create({ data: { name, email, roleRequested, passwordHash } });
  return res.status(201).json(created);
});

// Secretaria/Admin listam e decidem
signupRouter.get('/requests', authenticate, authorize(['ADMIN', 'SECRETARY']), async (_req: Request, res: Response) => {
  const list = await (prisma as any).signupRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(list);
});

const decideSchema = z.object({
  approved: z.boolean(),
  reason: z.string().optional()
});

signupRouter.post('/requests/:id/decide', authenticate, authorize(['ADMIN', 'SECRETARY']), async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  const parse = decideSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
  const { approved, reason } = parse.data;

  const request = await (prisma as any).signupRequest.findUnique({ where: { id } });
  if (!request) return res.status(404).json({ error: 'Not found' });

  const status = approved ? 'APPROVED' : 'REJECTED';
  const updated = await (prisma as any).signupRequest.update({
    where: { id },
    data: {
      status: status as any,
      reason,
      decidedAt: new Date(),
      decidedById: req.userId
    }
  });

  // If approved, create the real User account using data from the request
  if (approved) {
    const existsUser = await prisma.user.findUnique({ where: { email: request.email } })
    if (!existsUser) {
      await prisma.user.create({ data: { name: request.name, email: request.email, password: request.passwordHash ?? await bcrypt.hash('changeme123', 10), role: request.roleRequested as any } })
    }
  }

  return res.json(updated);
});
