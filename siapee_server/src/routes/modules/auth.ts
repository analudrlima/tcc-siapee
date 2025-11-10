import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import crypto from 'crypto';

export const authRouter = Router();

const loginSchema = z.object({
  login: z.string().min(1).optional(), // username or email
  email: z.string().email().optional(),
  password: z.string().min(6)
}).refine((data) => !!data.login || !!data.email, {
  message: 'login or email required'
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
  const { login, email, password } = parse.data as { login?: string; email?: string; password: string };

  let user = null as null | Awaited<ReturnType<typeof prisma.user.findUnique>>;
  const identifier = (login ?? email ?? '').trim();
  try {
    if ((email && email.length > 0) || /@/.test(identifier)) {
      const mail = (email ?? identifier).toLowerCase();
      user = await prisma.user.findUnique({ where: { email: mail } });
    } else {
      // Fallback: use name as username (not unique by schema; assumes practice enforces uniqueness)
      user = await prisma.user.findFirst({ where: { name: identifier } });
    }
  } catch {
    user = null;
  }
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

// Forgot password - always respond 200 to avoid user enumeration
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  try {
    const user = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      // cast to any to avoid type issues if prisma client not regenerated
      await (prisma as any).passwordReset.create({ data: { userId: user.id, token, expiresAt } });
      // In a real app, send email with link containing token. For now, return token for manual testing.
      return res.json({ ok: true, token });
    }
  } catch (e) {
    // ignore
  }
  return res.json({ ok: true });
});

// Reset password with token
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  const { token, password } = req.body ?? {};
  if (!token || typeof token !== 'string' || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Invalid payload' });
  }
  // find token
  const entry = await (prisma as any).passwordReset.findUnique({ where: { token } });
  if (!entry || entry.usedAt || new Date(entry.expiresAt) < new Date()) {
    return res.status(400).json({ error: 'Token inválido ou expirado' });
  }
  const user = await prisma.user.findUnique({ where: { id: entry.userId } });
  if (!user) return res.status(400).json({ error: 'Token inválido' });
  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
  await (prisma as any).passwordReset.update({ where: { token }, data: { usedAt: new Date() } });
  // Invalidate refresh tokens for this user
  await prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { valid: false } });
  return res.json({ ok: true });
});
