import { Router, Request, Response } from 'express'
import { authenticate, AuthRequest } from '../../middlewares/authenticate'
import { prisma } from '../../lib/prisma'
import { logAudit } from '../../lib/audit'

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
  logAudit({ userId: req.userId, action: 'PROJECT_CREATE', entity: 'Project', entityId: created.id, metadata: { classId } })
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
  logAudit({ action: 'PROJECT_UPDATE', entity: 'Project', entityId: updated.id })
})

// Delete project
projectsRouter.delete('/projects/:projectId', authenticate, async (req: Request, res: Response) => {
  const { projectId } = req.params
  const deleted = await (prisma as any).project.delete({ where: { id: projectId } })
  logAudit({ action: 'PROJECT_DELETE', entity: 'Project', entityId: deleted.id })
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
  logAudit({ action: 'MILESTONE_CREATE', entity: 'ProjectMilestone', entityId: created.id, metadata: { projectId } })
})

projectsRouter.put('/projects/:projectId/milestones/:milestoneId', authenticate, async (req: Request, res: Response) => {
  const { projectId, milestoneId } = req.params
  const { title, dueDate, notes, done } = req.body ?? {}
  const updated = await (prisma as any).projectMilestone.update({ where: { id: milestoneId }, data: ({ title, dueDate: dueDate ? new Date(dueDate) : null, notes, done } as any) })
  res.json(updated)
  logAudit({ action: 'MILESTONE_UPDATE', entity: 'ProjectMilestone', entityId: updated.id })
})

projectsRouter.delete('/projects/:projectId/milestones/:milestoneId', authenticate, async (req: Request, res: Response) => {
  const { milestoneId } = req.params
  const deleted = await (prisma as any).projectMilestone.delete({ where: { id: milestoneId } })
  logAudit({ action: 'MILESTONE_DELETE', entity: 'ProjectMilestone', entityId: deleted.id })
  res.status(204).send()
})
