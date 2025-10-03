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

export const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'SIAPEE API' });
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
