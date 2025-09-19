import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

function signAccessToken(userId: string) {
  const opts: SignOptions = { expiresIn: env.accessExpiresIn as unknown as number };
  return jwt.sign({ sub: userId }, env.jwtSecret as Secret, opts);
}
function signRefreshToken(userId: string) {
  const opts: SignOptions = { expiresIn: env.refreshExpiresIn as unknown as number };
  return jwt.sign({ sub: userId, type: 'refresh' }, env.jwtSecret as Secret, opts);
}

authRouter.post('/login', async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
  const { email, password } = parse.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);

  const refreshExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt: refreshExp } });

  return res.json({ accessToken, refreshToken, user: { id: user.id, name: user.name, role: user.role } });
});

const refreshSchema = z.object({ refreshToken: z.string() });
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const parse = refreshSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: 'Invalid payload' });
  const { refreshToken } = parse.data;

  const dbToken = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!dbToken || !dbToken.valid || dbToken.expiresAt < new Date()) return res.status(401).json({ error: 'Invalid token' });

  try {
    const payload = jwt.verify(refreshToken, env.jwtSecret as Secret) as { sub: string };
    const accessToken = signAccessToken(payload.sub);
    return res.json({ accessToken });
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

authRouter.post('/logout', async (req: Request, res: Response) => {
  const token = req.body?.refreshToken as string | undefined;
  if (token) {
    await prisma.refreshToken.updateMany({ where: { token }, data: { valid: false } });
  }
  return res.status(204).send();
});
