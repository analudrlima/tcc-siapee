import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Missing authorization' });
  const [type, token] = header.split(' ');
  if (type !== 'Bearer' || !token) return res.status(401).json({ error: 'Invalid authorization' });
  try {
    const payload = jwt.verify(token, env.jwtSecret) as { sub: string };
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
