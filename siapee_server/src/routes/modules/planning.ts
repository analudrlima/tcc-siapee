import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { authenticate } from '../../middlewares/authenticate'

export const planningRouter = Router()

planningRouter.get('/classes/:id/planning', authenticate, async (req: Request, res: Response) => {
  const classId = req.params.id
  const kind = ((req.query.kind as string) ?? 'ANNUAL') as any
  const p = await prisma.planning.findFirst({ where: { classId, kind } as any })
  res.json(p)
})

planningRouter.put('/classes/:id/planning', authenticate, async (req: Request, res: Response) => {
  const classId = req.params.id
  const { kind = 'ANNUAL', title, content, discipline, lessonsPlanned } = req.body ?? {}
  const existing = await prisma.planning.findFirst({ where: { classId, kind } as any })
  const baseData = { classId, kind: kind as any, title: title ?? 'Planejamento', content, discipline, lessonsPlanned }
  const saved = existing
    ? await prisma.planning.update({ where: { id: existing.id }, data: baseData as any })
    : await prisma.planning.create({ data: { ...baseData, date: new Date() } as any })
  res.json(saved)
})
