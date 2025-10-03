import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { authenticate, AuthRequest } from '../../middlewares/authenticate'

export const activitiesRouter = Router()

// list activities for a class
activitiesRouter.get('/classes/:id/activities', authenticate, async (req: Request, res: Response) => {
  const classId = req.params.id
  const { category, discipline } = req.query as { category?: string; discipline?: string }
  const list = await prisma.activity.findMany({
    where: ({ classId, ...(category ? { category } : {}), ...(discipline ? { discipline } : {}) } as any),
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' } as any].filter(Boolean) as any,
  } as any)
  res.json(list)
})

// create activity
activitiesRouter.post('/classes/:id/activities', authenticate, async (req: AuthRequest, res: Response) => {
  const classId = req.params.id
  const {
    title, description, dueDate, maxScore = 10,
    discipline, topic, methodology, explanation, content, indication, records, observations,
    difficultyId, category
  } = req.body ?? {}
  const created = await prisma.activity.create({
    data: ({
      classId,
      teacherId: req.userId!,
      title,
      description,
      dueDate: dueDate ? new Date(dueDate) : null as any,
      maxScore,
      discipline, topic, methodology, explanation, content, indication, records, observations,
      difficultyId: difficultyId ?? null,
      category,
    } as any)
  } as any)
  res.status(201).json(created)
})

// update activity
activitiesRouter.put('/activities/:activityId', authenticate, async (req: Request, res: Response) => {
  const { activityId } = req.params
  const {
    title, description, dueDate, maxScore,
    discipline, topic, methodology, explanation, content, indication, records, observations,
    difficultyId, category
  } = req.body ?? {}
  const updated = await prisma.activity.update({
    where: { id: activityId },
    data: ({
      title, description,
      dueDate: dueDate ? new Date(dueDate) : null as any,
      maxScore,
      discipline, topic, methodology, explanation, content, indication, records, observations,
      difficultyId: difficultyId ?? null,
      category,
    } as any)
  } as any)
  res.json(updated)
})

// delete activity
activitiesRouter.delete('/activities/:activityId', authenticate, async (req: Request, res: Response) => {
  const { activityId } = req.params
  await prisma.activity.delete({ where: { id: activityId } })
  res.status(204).send()
})

// minimal grades APIs
activitiesRouter.get('/activities/:activityId/grades', authenticate, async (req: Request, res: Response) => {
  const { activityId } = req.params
  const list = await prisma.activityGrade.findMany({ where: { activityId } })
  res.json(list)
})

activitiesRouter.put('/activities/:activityId/grades', authenticate, async (req: Request, res: Response) => {
  const { activityId } = req.params
  const items = Array.isArray(req.body) ? req.body as Array<{ studentId: string; score: number; feedback?: string }> : []
  for (const it of items) {
    await prisma.activityGrade.upsert({
      where: { activityId_studentId: { activityId, studentId: it.studentId } },
      update: { score: it.score, feedback: it.feedback },
      create: { activityId, studentId: it.studentId, score: it.score, feedback: it.feedback }
    })
  }
  res.status(204).send()
})

// Difficulty helpers
activitiesRouter.get('/difficulties', authenticate, async (_req: Request, res: Response) => {
  const list = await (prisma as any).difficulty.findMany({ orderBy: { type: 'asc' } })
  res.json(list)
})

// Elaborations (notes by teacher on an activity)
activitiesRouter.get('/activities/:activityId/elaborations', authenticate, async (req: AuthRequest, res: Response) => {
  const { activityId } = req.params
  const list = await (prisma as any).elaboration.findMany({ where: { activityId }, orderBy: { createdAt: 'desc' } })
  res.json(list)
})

activitiesRouter.post('/activities/:activityId/elaborations', authenticate, async (req: AuthRequest, res: Response) => {
  const { activityId } = req.params
  const { text } = req.body ?? {}
  const created = await (prisma as any).elaboration.create({ data: { activityId, userId: req.userId!, text } })
  res.status(201).json(created)
})
