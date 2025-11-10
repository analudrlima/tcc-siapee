import { prisma } from './prisma'

type AuditParams = {
  userId?: string | null
  action: string
  entity: string
  entityId: string
  metadata?: any
}

export async function logAudit(p: AuditParams) {
  try {
    await (prisma as any).auditLog.create({
      data: {
        userId: p.userId ?? null,
        action: p.action,
        entity: p.entity,
        entityId: p.entityId,
        metadata: p.metadata ? (p.metadata as any) : undefined,
      }
    })
  } catch (e) {
    // swallow audit errors to not break main flow
    // eslint-disable-next-line no-console
    console.warn('audit log failed', e)
  }
}
