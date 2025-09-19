import express, { Request, Response } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { router } from './routes';

export function createApp() {
  const app = express();
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', env: env.nodeEnv });
  });
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', env: env.nodeEnv });
  });

  app.use('/api', router);
  return app;
}
