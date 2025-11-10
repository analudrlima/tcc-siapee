import { Router, Request, Response } from 'express'
import { authenticate } from '../../middlewares/authenticate'
import { authorize } from '../../middlewares/authorize'
import { prisma } from '../../lib/prisma'
import { logAudit } from '../../lib/audit'

export const adminRouter = Router()

// Preview rollover: clone classes into target year adjusting codes (suffix -YYYY)
adminRouter.post('/admin/rollover/preview', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const { fromYear, toYear } = req.body ?? {}
  const baseYear = Number(fromYear) || new Date().getFullYear()
  const targetYear = Number(toYear) || baseYear + 1
  const classes = await prisma.class.findMany({ where: { year: baseYear }, select: { id:true, name:true, code:true, year:true, disciplines: true } as any }) as any
  const preview = classes.map((c: any) => {
    const code = c.code.replace(/-\d{4}$/, `-${targetYear}`)
    return { name: c.name, code, year: targetYear, disciplines: c.disciplines }
  })
  res.json({ fromYear: baseYear, toYear: targetYear, count: preview.length, classes: preview })
})

// Commit rollover: create non-existing classes for next year (no enrollments)
adminRouter.post('/admin/rollover/commit', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const { fromYear, toYear } = req.body ?? {}
  const baseYear = Number(fromYear) || new Date().getFullYear()
  const targetYear = Number(toYear) || baseYear + 1
  const classes = await prisma.class.findMany({ where: { year: baseYear }, select: { id:true, name:true, code:true, year:true, disciplines: true } as any }) as any
  const results: any[] = []
  for (const c of classes) {
    const code = c.code.replace(/-\d{4}$/, `-${targetYear}`)
    const exists = await prisma.class.findUnique({ where: { code } })
    if (!exists) {
      const created = await prisma.class.create({ data: { name: c.name, code, year: targetYear, disciplines: c.disciplines as any } as any })
      results.push({ created: created.code })
      await logAudit({ userId: (req as any).userId, action: 'ROLLOVER_CLASS_CREATE', entity: 'Class', entityId: created.id, metadata: { from: c.code, to: created.code } })
    } else {
      results.push({ skipped: code })
    }
  }
  res.json({ created: results.filter(r => r.created).length, skipped: results.filter(r => r.skipped).length, details: results })
})
