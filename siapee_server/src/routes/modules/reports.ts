import { Router, Request, Response } from 'express'
import { prisma } from '../../lib/prisma'
import { authenticate } from '../../middlewares/authenticate'

export const reportsRouter = Router()

function toCSV(rows: any[]): string {
  if (!rows.length) return ''
  const cols = Object.keys(rows[0])
  const escape = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return s.includes(',') || s.includes('\n') || s.includes('"') ? '"' + s.replace(/"/g,'""') + '"' : s
  }
  return [cols.join(','), ...rows.map(r => cols.map(c => escape(r[c])).join(','))].join('\n')
}

// Attendance CSV by class and period
reportsRouter.get('/reports/attendance.csv', authenticate, async (req: Request, res: Response) => {
  const { classId, from, to } = req.query as any
  if (!classId) return res.status(400).json({ error: 'classId required' })
  const where: any = { classId }
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from + 'T00:00:00')
    if (to) where.date.lte = new Date(to + 'T23:59:59')
  }
  const days = await prisma.attendanceDay.findMany({ where, include: { records: { include: { student: true } } }, orderBy: { date: 'asc' } })
  const rows: any[] = []
  for (const d of days) {
    for (const r of d.records) {
      rows.push({
        date: d.date.toISOString().slice(0,10),
        student: r.student.name,
        registryId: r.student.registryId,
        status: r.status,
        observation: r.observation ?? ''
      })
    }
  }
  const csv = toCSV(rows)
  res.setHeader('Content-Type','text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="attendance_${classId}.csv"`)
  res.send(csv)
})

// Grades CSV by class
reportsRouter.get('/reports/grades.csv', authenticate, async (req: Request, res: Response) => {
  const { classId } = req.query as any
  if (!classId) return res.status(400).json({ error: 'classId required' })
  const acts = await prisma.activity.findMany({ where: { classId }, include: { grades: { include: { student: true } } }, orderBy: { createdAt: 'asc' } })
  const rows: any[] = []
  for (const a of acts) {
    for (const g of a.grades) {
      rows.push({
        activity: a.title,
        discipline: a.discipline ?? '',
        student: g.student.name,
        registryId: g.student.registryId,
        score: g.score,
        feedback: g.feedback ?? ''
      })
    }
  }
  const csv = toCSV(rows)
  res.setHeader('Content-Type','text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="grades_${classId}.csv"`)
  res.send(csv)
})

// Planning CSV (all plannings for class)
reportsRouter.get('/reports/planning.csv', authenticate, async (req: Request, res: Response) => {
  const { classId } = req.query as any
  if (!classId) return res.status(400).json({ error: 'classId required' })
  const plannings = await prisma.planning.findMany({ where: { classId }, orderBy: { date:'desc' } })
  const rows = plannings.map(p => ({
    id: p.id,
    kind: p.kind,
    discipline: p.discipline ?? '',
    details: p.details ?? '',
    title: p.title,
    lessonsPlanned: p.lessonsPlanned ?? '',
    date: p.date ? p.date.toISOString().slice(0,10) : ''
  }))
  const csv = toCSV(rows)
  res.setHeader('Content-Type','text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="planning_${classId}.csv"`)
  res.send(csv)
})

// Projects CSV (projects + milestone counts)
reportsRouter.get('/reports/projects.csv', authenticate, async (req: Request, res: Response) => {
  const { classId } = req.query as any
  if (!classId) return res.status(400).json({ error: 'classId required' })
  const projects = await (prisma as any).project.findMany({ where: { classId }, include: { milestones: true }, orderBy: { createdAt:'desc' } })
  const rows = projects.map((p:any) => ({
    id: p.id,
    title: p.title,
    type: p.type,
    status: p.status,
    milestones: p.milestones.length,
    startDate: p.startDate ? p.startDate.toISOString().slice(0,10) : '',
    endDate: p.endDate ? p.endDate.toISOString().slice(0,10) : ''
  }))
  const csv = toCSV(rows)
  res.setHeader('Content-Type','text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="projects_${classId}.csv"`)
  res.send(csv)
})

// Audit CSV (filter by entity or user)
reportsRouter.get('/reports/audit.csv', authenticate, async (req: Request, res: Response) => {
  const { entity, userId, limit = '200' } = req.query as any
  const where: any = {}
  if (entity) where.entity = entity
  if (userId) where.userId = userId
  const take = Math.min(parseInt(limit,10)||200, 1000)
  const logs = await (prisma as any).auditLog.findMany({ where, orderBy: { createdAt:'desc' }, take })
  const rows = logs.map((l:any) => ({
    id: l.id,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    userId: l.userId || '',
    createdAt: l.createdAt.toISOString(),
    metadata: l.metadata ? JSON.stringify(l.metadata) : ''
  }))
  const csv = toCSV(rows)
  res.setHeader('Content-Type','text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="audit.csv"`)
  res.send(csv)
})
