import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { env } from './config/env';
import { router } from './routes';

import os from 'os';

export function createApp() {
  const app = express();
  
  app.use(cors({
    origin: (origin, callback) => {
      // Permitir requisições sem origem (como apps mobile ou curl)
      if (!origin) return callback(null, true);
      
      // Lista de origens permitidas
      const allowedOrigins = env.corsOrigin.split(',').map(o => o.trim());
      
      // Verifica se a origem está na lista, se é localhost ou se é um subdomínio vercel.app
      const isAllowed = allowedOrigins.includes(origin) 
        || env.corsOrigin === '*' 
        || origin.startsWith('http://localhost:') 
        || origin.startsWith('http://127.0.0.1:')
        || origin.endsWith('.vercel.app');

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json());

  // Ensure uploads directories exist and serve static files
  // Tenta usar local, se falhar usa /tmp (para Vercel)
  let uploadsRoot = path.resolve(process.cwd(), 'uploads');
  try {
    const avatarDir = path.join(uploadsRoot, 'avatars');
    const studentDir = path.join(uploadsRoot, 'students');
    fs.mkdirSync(avatarDir, { recursive: true });
    fs.mkdirSync(studentDir, { recursive: true });
  } catch {
    uploadsRoot = path.join(os.tmpdir(), 'uploads');
    try {
      fs.mkdirSync(path.join(uploadsRoot, 'avatars'), { recursive: true });
      fs.mkdirSync(path.join(uploadsRoot, 'students'), { recursive: true });
    } catch {}
  }
  
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
