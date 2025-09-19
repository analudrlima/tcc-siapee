import dotenv from 'dotenv';
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3333),
  host: process.env.HOST ?? '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret',
  accessExpiresIn: process.env.ACCESS_EXPIRES_IN ?? '15m',
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN ?? '7d',
};
