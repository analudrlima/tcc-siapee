import { Router, Request, Response } from 'express'
import { authenticate } from '../../middlewares/authenticate'
import { authorize } from '../../middlewares/authorize'
import { prisma } from '../../lib/prisma'

export const gendersRouter = Router()

// List genders
gendersRouter.get('/genders', authenticate, async (_req: Request, res: Response) => {
  const list = await prisma.gender.findMany({ orderBy: { description: 'asc' } })
  res.json(list)
})

// Create gender
// Create gender (ADMIN/SECRETARY)
gendersRouter.post('/genders', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const { description } = req.body ?? {}
  if (!description || typeof description !== 'string') return res.status(400).json({ error: 'description required' })
  const created = await prisma.gender.create({ data: { description } })
  res.status(201).json(created)
})

// Update gender
// Update gender (ADMIN/SECRETARY)
gendersRouter.put('/genders/:id', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const { description } = req.body ?? {}
  const updated = await prisma.gender.update({ where: { id: req.params.id }, data: { description } })
  res.json(updated)
})

// Delete gender
// Delete gender (ADMIN/SECRETARY)
gendersRouter.delete('/genders/:id', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  await prisma.gender.delete({ where: { id: req.params.id } })
  res.status(204).send()
})