import { Router, Request, Response } from 'express'
import { authenticate, AuthRequest } from '../../middlewares/authenticate'
import { prisma } from '../../lib/prisma'

export const projectsRouter = Router()

// List projects by class with optional filters
projectsRouter.get('/classes/:id/projects', authenticate, async (req: Request, res: Response) => {
  const classId = req.params.id
  const { status, type } = req.query as { status?: string; type?: string }
  const list = await (prisma as any).project.findMany({
    where: ({ classId, ...(status ? { status } : {}), ...(type ? { type } : {}) } as any),
    orderBy: [{ createdAt: 'desc' }] as any
  })
  res.json(list)
})

// Create project
projectsRouter.post('/classes/:id/projects', authenticate, async (req: AuthRequest, res: Response) => {
  const classId = req.params.id
  const { title, description, type, audience, startDate, endDate, attachments } = req.body ?? {}
  const created = await (prisma as any).project.create({
    data: ({ classId, ownerId: req.userId!, title, description, type, audience,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      attachments } as any)
  })
  res.status(201).json(created)
})

// Update project
projectsRouter.put('/projects/:projectId', authenticate, async (req: Request, res: Response) => {
  const { projectId } = req.params
  const { title, description, status, type, audience, startDate, endDate, attachments } = req.body ?? {}
  const updated = await (prisma as any).project.update({
    where: { id: projectId },
    data: ({ title, description, status, type, audience,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      attachments } as any)
  })
  res.json(updated)
})

// Delete project
projectsRouter.delete('/projects/:projectId', authenticate, async (req: Request, res: Response) => {
  const { projectId } = req.params
  await (prisma as any).project.delete({ where: { id: projectId } })
  res.status(204).send()
})

// Milestones
projectsRouter.get('/projects/:projectId/milestones', authenticate, async (req: Request, res: Response) => {
  const { projectId } = req.params
  const list = await (prisma as any).projectMilestone.findMany({ where: { projectId }, orderBy: { dueDate: 'asc' } })
  res.json(list)
})

projectsRouter.post('/projects/:projectId/milestones', authenticate, async (req: Request, res: Response) => {
  const { projectId } = req.params
  const { title, dueDate, notes } = req.body ?? {}
  const created = await (prisma as any).projectMilestone.create({ data: ({ projectId, title, dueDate: dueDate ? new Date(dueDate) : null, notes } as any) })
  res.status(201).json(created)
})

projectsRouter.put('/projects/:projectId/milestones/:milestoneId', authenticate, async (req: Request, res: Response) => {
  const { projectId, milestoneId } = req.params
  const { title, dueDate, notes, done } = req.body ?? {}
  const updated = await (prisma as any).projectMilestone.update({ where: { id: milestoneId }, data: ({ title, dueDate: dueDate ? new Date(dueDate) : null, notes, done } as any) })
  res.json(updated)
})

projectsRouter.delete('/projects/:projectId/milestones/:milestoneId', authenticate, async (req: Request, res: Response) => {
  const { milestoneId } = req.params
  await (prisma as any).projectMilestone.delete({ where: { id: milestoneId } })
  res.status(204).send()
})
