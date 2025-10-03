import { Router, Request, Response } from 'express'
import { authenticate } from '../../middlewares/authenticate'
import { prisma } from '../../lib/prisma'
import { makeMulter } from '../../lib/upload'

export const studentsRouter = Router()
const upload = makeMulter('students')

// List students (basic filters later)
studentsRouter.get('/students', authenticate, async (req: Request, res: Response) => {
  const include = req.query.include as string
  let includeRelations = {}
  
  if (include) {
    if (include.includes('address')) includeRelations = { ...includeRelations, address: true }
    if (include.includes('gender')) includeRelations = { ...includeRelations, gender: true }
  }
  
  const list = await prisma.student.findMany({ 
    orderBy: { name: 'asc' },
    include: Object.keys(includeRelations).length > 0 ? includeRelations : undefined
  })
  res.json(list)
})

studentsRouter.get('/students/:id', authenticate, async (req: Request, res: Response) => {
  const s = await prisma.student.findUnique({ where: { id: req.params.id } })
  if (!s) return res.status(404).json({ error: 'Not found' })
  res.json(s)
})

studentsRouter.post('/students', authenticate, async (req: Request, res: Response) => {
  const { name, email, registryId } = req.body ?? {}
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name required' })
  const created = await prisma.student.create({ data: { name, email: email ?? null, registryId: registryId ?? null } as any })
  res.status(201).json(created)
})

studentsRouter.put('/students/:id', authenticate, async (req: Request, res: Response) => {
  const { name, email, registryId, photoUrl } = req.body ?? {}
  const updated = await prisma.student.update({ where: { id: req.params.id }, data: { name, email, registryId, photoUrl } as any })
  res.json(updated)
})

studentsRouter.delete('/students/:id', authenticate, async (req: Request, res: Response) => {
  await prisma.student.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

// Photo upload
studentsRouter.post('/students/:id/photo', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File required' })
  const url = `/uploads/students/${req.file.filename}`
  const updated = await prisma.student.update({ where: { id: req.params.id }, data: { photoUrl: url } as any })
  res.json(updated)
})
