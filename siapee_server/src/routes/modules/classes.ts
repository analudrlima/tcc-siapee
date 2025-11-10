import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { authenticate } from '../../middlewares/authenticate'
import { authorize } from '../../middlewares/authorize'
import { logAudit } from '../../lib/audit'

export const classesRouter = Router()

// List classes
classesRouter.get('/', authenticate, async (_req: Request, res: Response) => {
  const classes = await prisma.class.findMany({ orderBy: { year: 'desc' } })
  res.json(classes)
})

// Create class (ADMIN/SECRETARY)
classesRouter.post('/', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const { name, code, year, disciplines } = req.body ?? {}
  if (!name || !code || typeof year !== 'number') {
    return res.status(400).json({ error: 'name, code and year are required' })
  }
  const discs = Array.isArray(disciplines) ? (disciplines as any[]).filter(d => typeof d === 'string') : []
  try {
    const created = await prisma.class.create({ data: { name, code, year, ...(discs.length ? { disciplines: discs as any } : {}) } as any })
    logAudit({ action: 'CLASS_CREATE', entity: 'Class', entityId: created.id, metadata: { name, code, year }, userId: (req as any).userId })
    res.status(201).json(created)
  } catch (err: any) {
    // P2002 unique constraint failed on the fields: (`code`)
    if (err?.code === 'P2002') {
      return res.status(409).json({ error: 'Class code already exists' })
    }
    res.status(500).json({ error: 'Failed to create class' })
  }
})

// Update class (ADMIN/SECRETARY)
classesRouter.put('/:id', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const id = req.params.id
  const { name, code, year, disciplines } = req.body ?? {}
  const data: any = {}
  if (typeof name === 'string' && name.trim()) data.name = name.trim()
  if (typeof code === 'string' && code.trim()) data.code = code.trim()
  if (typeof year === 'number') data.year = year
  if (Array.isArray(disciplines)) data.disciplines = (disciplines as any[]).filter(d => typeof d === 'string')
  try {
    const updated = await prisma.class.update({ where: { id }, data })
    logAudit({ action: 'CLASS_UPDATE', entity: 'Class', entityId: updated.id, metadata: Object.keys(req.body || {}), userId: (req as any).userId })
    res.json(updated)
  } catch (err: any) {
    if (err?.code === 'P2025') return res.status(404).json({ error: 'Class not found' })
    if (err?.code === 'P2002') return res.status(409).json({ error: 'Class code already exists' })
    res.status(500).json({ error: 'Failed to update class' })
  }
})

// Get class with enrollments (students + optionally teachers later)
classesRouter.get('/:id', authenticate, async (req: Request, res: Response) => {
  const c = await prisma.class.findUnique({
    where: { id: req.params.id },
    include: { enrollments: { include: { student: true } } }
  })
  if (!c) return res.status(404).json({ error: 'Not found' })
  // normalize student photo urls to absolute
  const host = req.get('host')
  const proto = req.protocol
  const normalize = (url?: string | null) => url && url.startsWith('/uploads') ? `${proto}://${host}${url}` : url
  const mapped = {
    ...c,
    enrollments: c.enrollments.map(e => ({ ...e, student: { ...e.student, photoUrl: normalize(e.student.photoUrl as any) } }))
  }
  res.json(mapped)
})

// List students of a class (flattened)
classesRouter.get('/:id/students', authenticate, async (req: Request, res: Response) => {
  const c = await prisma.class.findUnique({
    where: { id: req.params.id },
    include: { enrollments: { include: { student: true } } }
  })
  if (!c) return res.status(404).json({ error: 'Not found' })
  const students = c.enrollments.map(e => ({ id: e.student.id, name: e.student.name, email: e.student.email, registryId: e.student.registryId }))
  res.json(students)
})

// Enroll a student into a class (ADMIN/SECRETARY)
classesRouter.post('/:id/enrollments', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const classId = req.params.id
  const { studentId } = req.body ?? {}
  if (!studentId) return res.status(400).json({ error: 'studentId required' })
  const klass = await prisma.class.findUnique({ where: { id: classId } })
  if (!klass) return res.status(404).json({ error: 'Class not found' })
  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student) return res.status(404).json({ error: 'Student not found' })
  const created = await prisma.enrollment.create({ data: { classId, studentId } })
  logAudit({ action: 'ENROLLMENT_CREATE', entity: 'Enrollment', entityId: created.id, metadata: { classId, studentId }, userId: (req as any).userId })
  res.status(201).json(created)
})

// Remove a student from a class (ADMIN/SECRETARY)
classesRouter.delete('/:id/enrollments/:enrollmentId', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const deleted = await prisma.enrollment.delete({ where: { id: req.params.enrollmentId } })
  logAudit({ action: 'ENROLLMENT_DELETE', entity: 'Enrollment', entityId: deleted.id, metadata: { classId: req.params.id }, userId: (req as any).userId })
  res.status(204).send()
})

// Delete a class (ADMIN/SECRETARY) – cascades to enrollments, attendance, planning, activities, projects
classesRouter.delete('/:id', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const id = req.params.id
  try {
    const deleted = await prisma.class.delete({ where: { id } })
    logAudit({ action: 'CLASS_DELETE', entity: 'Class', entityId: deleted.id, userId: (req as any).userId })
    res.status(204).send()
  } catch (err) {
    res.status(404).json({ error: 'Class not found' })
  }
})

// Teachers assignment per class
classesRouter.get('/:id/teachers', authenticate, async (req: Request, res: Response) => {
  const classId = req.params.id
  const list = await (prisma as any).teacherClass.findMany({ where: { classId }, include: { teacher: { select: { id: true, name: true, email: true } } } })
  res.json(list)
})

classesRouter.post('/:id/teachers', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const classId = req.params.id
  const { teacherId, disciplines } = req.body ?? {}
  if (!teacherId) return res.status(400).json({ error: 'teacherId required' })
  const discs = Array.isArray(disciplines) ? (disciplines as any[]).filter(d => typeof d === 'string') : []
  const created = await (prisma as any).teacherClass.upsert({
    where: { teacherId_classId: { teacherId, classId } },
    update: { disciplines: discs },
    create: { teacherId, classId, disciplines: discs }
  })
  logAudit({ action: 'CLASS_TEACHER_ASSIGN', entity: 'TeacherClass', entityId: created.id, metadata: { classId, teacherId, disciplines: discs }, userId: (req as any).userId })
  res.status(201).json(created)
})

classesRouter.delete('/:id/teachers/:teacherId', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const classId = req.params.id
  const teacherId = req.params.teacherId
  const existing = await (prisma as any).teacherClass.findUnique({ where: { teacherId_classId: { teacherId, classId } } })
  if (!existing) return res.status(404).json({ error: 'Assignment not found' })
  await (prisma as any).teacherClass.delete({ where: { id: existing.id } })
  logAudit({ action: 'CLASS_TEACHER_REMOVE', entity: 'TeacherClass', entityId: existing.id, metadata: { classId, teacherId }, userId: (req as any).userId })
  res.status(204).send()
})
