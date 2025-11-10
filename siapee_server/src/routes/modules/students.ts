import { Router, Request, Response } from 'express'
import { authenticate } from '../../middlewares/authenticate'
import { authorize } from '../../middlewares/authorize'
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
  // Ensure absolute photo urls
  const host = req.get('host')
  const proto = req.protocol
  const withAbsolute = list.map(s => {
    const photo = s.photoUrl && s.photoUrl.startsWith('/uploads') ? `${proto}://${host}${s.photoUrl}` : s.photoUrl
    return { ...s, photoUrl: photo }
  })
  res.json(withAbsolute)
})

studentsRouter.get('/students/:id', authenticate, async (req: Request, res: Response) => {
  const include = (req.query.include as string) || ''
  let includeRelations = {}
  if (include.includes('address')) includeRelations = { ...includeRelations, address: true }
  if (include.includes('gender')) includeRelations = { ...includeRelations, gender: true }

  const s = await prisma.student.findUnique({ where: { id: req.params.id }, include: Object.keys(includeRelations).length ? includeRelations : undefined })
  if (!s) return res.status(404).json({ error: 'Not found' })
  const host = req.get('host')
  const proto = req.protocol
  const photo = s.photoUrl && s.photoUrl.startsWith('/uploads') ? `${proto}://${host}${s.photoUrl}` : s.photoUrl
  res.json({ ...s, photoUrl: photo })
})

// List classes a student is enrolled in (with enrollment id)
studentsRouter.get('/students/:id/enrollments', authenticate, async (req: Request, res: Response) => {
  const sid = req.params.id
  const student = await prisma.student.findUnique({ where: { id: sid }, select: { id: true } })
  if (!student) return res.status(404).json({ error: 'Student not found' })
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: sid },
    include: { class: true }
  })
  // Return a compact payload useful for UI linking/unlinking
  const rows = enrollments.map(e => ({
    enrollmentId: e.id,
    class: { id: e.class.id, name: e.class.name, code: e.class.code, year: e.class.year }
  }))
  res.json(rows)
})

// Create student (ADMIN/SECRETARY)
studentsRouter.post('/students', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const { name, email, registryId, birthDate, phone, genderId, comorbidities, allergies, medications, observations, address } = req.body ?? {}
  if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name required' })

  let addressId: string | undefined = undefined
  if (address && typeof address === 'object') {
    const { street, number, complement, neighborhood, city, state, zipCode } = address as any
    if (street && number && neighborhood && city && state && zipCode) {
      const addr = await prisma.address.create({ data: { street, number: Number(number), complement: complement ?? null, neighborhood, city, state, zipCode } })
      addressId = addr.id
    }
  }

  const data: any = {
    name,
    email: email ?? null,
    registryId: registryId ?? null,
    birthDate: birthDate ? new Date(birthDate) : null,
    phone: phone ?? null,
    genderId: genderId ?? null,
    comorbidities: comorbidities ?? null,
    allergies: allergies ?? null,
    medications: medications ?? null,
    observations: observations ?? null,
    addressId: addressId ?? null
  }
  const created = await prisma.student.create({ data })
  res.status(201).json(created)
})

// Update student (ADMIN/SECRETARY)
studentsRouter.put('/students/:id', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  const { name, email, registryId, photoUrl, birthDate, phone, genderId, comorbidities, allergies, medications, observations, address } = req.body ?? {}
  const sid = req.params.id

  // handle address upsert if provided
  let addressId: string | null | undefined = undefined
  if (address && typeof address === 'object') {
    const existing = await prisma.student.findUnique({ where: { id: sid }, select: { addressId: true } })
    const { street, number, complement, neighborhood, city, state, zipCode } = address as any
    if (street && number && neighborhood && city && state && zipCode) {
      if (existing?.addressId) {
        await prisma.address.update({ where: { id: existing.addressId }, data: { street, number: Number(number), complement: complement ?? null, neighborhood, city, state, zipCode } })
        addressId = existing.addressId
      } else {
        const created = await prisma.address.create({ data: { street, number: Number(number), complement: complement ?? null, neighborhood, city, state, zipCode } })
        addressId = created.id
      }
    } else if (existing?.addressId && address.clear === true) {
      // if client wants to clear address
      await prisma.address.delete({ where: { id: existing.addressId } }).catch(()=>{})
      addressId = null
    }
  }

  const data: any = {
    name,
    email,
    registryId,
    photoUrl,
    birthDate: birthDate === undefined ? undefined : (birthDate ? new Date(birthDate) : null),
    phone,
    genderId,
    comorbidities,
    allergies,
    medications,
    observations,
    ...(addressId !== undefined ? { addressId } : {})
  }
  const updated = await prisma.student.update({ where: { id: sid }, data })
  res.json(updated)
})

// Delete student (ADMIN/SECRETARY)
studentsRouter.delete('/students/:id', authenticate, authorize(['ADMIN','SECRETARY']), async (req: Request, res: Response) => {
  await prisma.student.delete({ where: { id: req.params.id } })
  res.status(204).send()
})

// Photo upload
// Upload student photo (ADMIN/SECRETARY)
studentsRouter.post('/students/:id/photo', authenticate, authorize(['ADMIN','SECRETARY']), upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'File required' })
  const url = `/uploads/students/${req.file.filename}`
  const updated = await prisma.student.update({ where: { id: req.params.id }, data: { photoUrl: url } as any })
  const host = req.get('host')
  const proto = req.protocol
  res.json({ ...updated, photoUrl: `${proto}://${host}${url}` })
})
