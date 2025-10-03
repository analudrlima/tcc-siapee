import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { authenticate } from '../../middlewares/authenticate'

export const attendanceRouter = Router()

// Get or create day attendance and list records for a class date
attendanceRouter.get('/classes/:id/attendance', authenticate, async (req: Request, res: Response) => {
  const classId = req.params.id
  const dateStr = req.query.date as string
  if (!dateStr) return res.status(400).json({ error: 'date is required YYYY-MM-DD' })
  const date = new Date(dateStr + 'T00:00:00')
  let day = await prisma.attendanceDay.findUnique({ where: { classId_date: { classId, date } } })
  if (!day) {
    day = await prisma.attendanceDay.create({ data: { classId, date } })
  }
  const records = await prisma.attendanceRecord.findMany({ where: { attendanceDayId: day.id } })
  const klass = await prisma.class.findUnique({ where: { id: classId }, include: { enrollments: { include: { student: true } } } })
  res.json({ id: day.id, date: day.date, records, class: klass })
})

attendanceRouter.put('/attendance/days/:dayId/records', authenticate, async (req: Request, res: Response) => {
  const dayId = req.params.dayId
  const items = req.body as Array<{ studentId: string; status: 'PRESENT'|'ABSENT'|'LATE'|'JUSTIFIED'; observation?: string }>
  if (!Array.isArray(items)) return res.status(400).json({ error: 'array required' })
  for (const it of items) {
    await prisma.attendanceRecord.upsert({
      where: { attendanceDayId_studentId: { attendanceDayId: dayId, studentId: it.studentId } },
      update: { status: it.status, observation: it.observation },
      create: { attendanceDayId: dayId, studentId: it.studentId, status: it.status, observation: it.observation }
    })
  }
  res.status(204).send()
})

// Attendance history for a class within date range
attendanceRouter.get('/classes/:id/attendance/history', authenticate, async (req: Request, res: Response) => {
  const classId = req.params.id
  const fromStr = (req.query.from as string) || ''
  const toStr = (req.query.to as string) || ''
  const where: any = { classId }
  if (fromStr) where.date = { gte: new Date(fromStr + 'T00:00:00') }
  if (toStr) {
    const end = new Date(toStr + 'T23:59:59')
    where.date = where.date ? { ...where.date, lte: end } : { lte: end }
  }
  const days = await prisma.attendanceDay.findMany({
    where,
    orderBy: { date: 'asc' },
    include: { records: true }
  })
  res.json(days)
})

// Get all records for a day (with students)
attendanceRouter.get('/attendance/days/:dayId/records', authenticate, async (req: Request, res: Response) => {
  const dayId = req.params.dayId
  const day = await prisma.attendanceDay.findUnique({ where: { id: dayId } })
  if (!day) return res.status(404).json({ error: 'Day not found' })
  const records = await prisma.attendanceRecord.findMany({ where: { attendanceDayId: dayId } })
  const klass = await prisma.class.findUnique({ where: { id: day.classId }, include: { enrollments: { include: { student: true } } } })
  res.json({ day, records, class: klass })
})

// Patch single record (status/observation)
attendanceRouter.patch('/attendance/days/:dayId/records/:studentId', authenticate, async (req: Request, res: Response) => {
  const dayId = req.params.dayId
  const studentId = req.params.studentId
  const { status, observation } = req.body ?? {}
  const updated = await prisma.attendanceRecord.upsert({
    where: { attendanceDayId_studentId: { attendanceDayId: dayId, studentId } },
    update: { status, observation },
    create: { attendanceDayId: dayId, studentId, status: status ?? 'PRESENT', observation }
  })
  res.json(updated)
})
