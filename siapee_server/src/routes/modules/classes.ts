import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { authenticate } from '../../middlewares/authenticate'

export const classesRouter = Router()

// List classes
classesRouter.get('/', authenticate, async (_req: Request, res: Response) => {
  const classes = await prisma.class.findMany({ orderBy: { year: 'desc' } })
  res.json(classes)
})

// Get class with enrollments (students + optionally teachers later)
classesRouter.get('/:id', authenticate, async (req: Request, res: Response) => {
  const c = await prisma.class.findUnique({
    where: { id: req.params.id },
    include: { enrollments: { include: { student: true } } }
  })
  if (!c) return res.status(404).json({ error: 'Not found' })
  res.json(c)
})
