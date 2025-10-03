import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { env } from './config/env';
import { router } from './routes';

export function createApp() {
  const app = express();
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  // Ensure uploads directories exist and serve static files
  const uploadsRoot = path.resolve(process.cwd(), 'uploads');
  const avatarDir = path.join(uploadsRoot, 'avatars');
  const studentDir = path.join(uploadsRoot, 'students');
  try {
    fs.mkdirSync(avatarDir, { recursive: true });
    fs.mkdirSync(studentDir, { recursive: true });
  } catch {}
  app.use('/uploads', express.static(uploadsRoot));

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', env: env.nodeEnv });
  });
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', env: env.nodeEnv });
  });

  app.use('/api', router);
  return app;
}
