import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../middlewares/authenticate';
import { prisma } from '../../lib/prisma';

export const usersRouter = Router();

usersRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { id: true, name: true, email: true, role: true }
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
});

usersRouter.put('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const { name } = req.body ?? {}
  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: { name: name ?? undefined },
    select: { id: true, name: true, email: true, role: true }
  })
  res.json(updated)
})
