import { Response, NextFunction } from 'express';
import { AuthRequest } from './authenticate';
import { prisma } from '../lib/prisma';

export function authorize(roles: Array<'ADMIN' | 'SECRETARY' | 'TEACHER'>) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(user.role as any)) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };
}
