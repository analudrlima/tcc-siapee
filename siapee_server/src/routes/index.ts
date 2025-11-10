import { Router, Request, Response } from 'express';
import { authRouter } from './modules/auth';
import { signupRouter } from './modules/signup';
import { usersRouter } from './modules/users';
import { classesRouter } from './modules/classes';
import { attendanceRouter } from './modules/attendance';
import { planningRouter } from './modules/planning';
import { activitiesRouter } from './modules/activities';
import { projectsRouter } from './modules/projects';
import { studentsRouter } from './modules/students';
import { gendersRouter } from './modules/genders';
import { reportsRouter } from './modules/reports';
import { adminRouter } from './modules/admin';
import { prisma } from '../lib/prisma';

export const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'SIAPEE API' });
});

// Health & readiness endpoint (API root scope)
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // simple DB ping
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'up', timestamp: new Date().toISOString() })
  } catch (e) {
    res.status(503).json({ status: 'degraded', db: 'error', error: (e as any)?.message })
  }
});

router.use('/auth', authRouter);
router.use('/signup', signupRouter);
router.use('/users', usersRouter);
router.use('/classes', classesRouter);
router.use('/', attendanceRouter);
router.use('/', planningRouter);
router.use('/', activitiesRouter);
router.use('/', projectsRouter);
router.use('/', studentsRouter);
router.use('/', gendersRouter);
router.use('/', reportsRouter);
router.use('/', adminRouter);
