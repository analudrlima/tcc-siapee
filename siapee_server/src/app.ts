import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { env } from './config/env';
import { router } from './routes';

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
