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
