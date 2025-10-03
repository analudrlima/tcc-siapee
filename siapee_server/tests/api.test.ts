import request from 'supertest'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Create a shared prisma mock with needed methods (must be hoisted for vi.mock)
const hoisted = vi.hoisted(() => ({
  prismaMock: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    attendanceDay: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
    },
    attendanceRecord: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    planning: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    activity: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    activityGrade: {
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    signupRequest: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  } as any,
}))

// Mock prisma, jwt and bcrypt BEFORE importing app
vi.mock('../src/lib/prisma', () => ({ prisma: hoisted.prismaMock }))
vi.mock('jsonwebtoken', () => {
  return {
    default: {
      sign: vi.fn().mockReturnValue('signed-token'),
      verify: vi.fn().mockReturnValue({ sub: 'user-1' }),
    },
    sign: vi.fn().mockReturnValue('signed-token'),
    verify: vi.fn().mockReturnValue({ sub: 'user-1' }),
  }
})
vi.mock('bcryptjs', () => {
  return {
    default: {
      compare: vi.fn().mockResolvedValue(true),
      hash: vi.fn().mockResolvedValue('hashed'),
    },
    compare: vi.fn().mockResolvedValue(true),
    hash: vi.fn().mockResolvedValue('hashed'),
  }
})

import { createApp } from '../src/app'

function auth(headers?: Record<string,string>) { return { ...headers, Authorization: 'Bearer test-access' } }

beforeEach(() => {
  // Reset all mocks
  vi.clearAllMocks()
  for (const group of Object.values(hoisted.prismaMock)) {
    if (group && typeof group === 'object') {
      for (const k of Object.keys(group)) {
        if (typeof (group as any)[k]?.mockReset === 'function') {
          ;(group as any)[k].mockReset()
        }
      }
    }
  }
  process.env.JWT_SECRET = 'test-secret'
})

describe('Health', () => {
  const app = createApp()
  it('GET /health ok', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
  it('GET /api/health ok', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })
})

describe('Root', () => {
  const app = createApp()
  it('GET /api/ returns message', async () => {
    const res = await request(app).get('/api/')
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('SIAPEE API')
  })
})

describe('Auth', () => {
  const app = createApp()
  it('POST /api/auth/login success', async () => {
  hoisted.prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'A', password: 'hashed', role: 'TEACHER' })
    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com', password: 'secret123' })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
    expect(res.body.refreshToken).toBeTruthy()
  expect(hoisted.prismaMock.refreshToken.create).toHaveBeenCalled()
  })
  it('POST /api/auth/login invalid payload', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'bad', password: '1' })
    expect(res.status).toBe(400)
  })
  it('POST /api/auth/refresh ok', async () => {
  hoisted.prismaMock.refreshToken.findUnique.mockResolvedValue({ token: 'x', valid: true, expiresAt: new Date(Date.now()+10000) })
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'x' })
    expect(res.status).toBe(200)
    expect(res.body.accessToken).toBeTruthy()
  })
  it('POST /api/auth/logout 204', async () => {
    const res = await request(app).post('/api/auth/logout').send({ refreshToken: 'x' })
    expect(res.status).toBe(204)
  expect(hoisted.prismaMock.refreshToken.updateMany).toHaveBeenCalled()
  })
})

describe('Users', () => {
  const app = createApp()
  it('GET /api/users/me 401 when no auth', async () => {
    const res = await request(app).get('/api/users/me')
    expect(res.status).toBe(401)
  })
  it('GET /api/users/me ok', async () => {
  hoisted.prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Ana', email: 'a@a.com', role: 'TEACHER' })
    const res = await request(app).get('/api/users/me').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.name).toBe('Ana')
  })
  it('PUT /api/users/me ok', async () => {
  hoisted.prismaMock.user.update.mockResolvedValue({ id:'user-1', name:'Ana Paula', email:'a@a.com', role:'TEACHER', phone:'123' })
    const res = await request(app).put('/api/users/me').set(auth()).send({ name:'Ana Paula', phone:'123' })
    expect(res.status).toBe(200)
    expect(res.body.phone).toBe('123')
  })
})

describe('Classes', () => {
  const app = createApp()
  it('GET /api/classes list', async () => {
  hoisted.prismaMock.class.findMany.mockResolvedValue([{ id:'c1', name:'1A', code:'1A', year:2025 }])
    const res = await request(app).get('/api/classes').set(auth())
    expect(res.status).toBe(200)
    expect(res.body[0].name).toBe('1A')
  })
  it('GET /api/classes/:id 404 when not found', async () => {
  hoisted.prismaMock.class.findUnique.mockResolvedValue(null)
    const res = await request(app).get('/api/classes/unknown').set(auth())
    expect(res.status).toBe(404)
  })
  it('GET /api/classes/:id with enrollments', async () => {
  hoisted.prismaMock.class.findUnique.mockResolvedValue({ id:'c1', name:'1A', enrollments:[{ student:{ id:'s1', name:'Stu'} }] })
    const res = await request(app).get('/api/classes/c1').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.enrollments.length).toBe(1)
  })
})

describe('Attendance', () => {
  const app = createApp()
  it('GET /api/classes/:id/attendance requires date', async () => {
    const res = await request(app).get('/api/classes/c1/attendance').set(auth())
    expect(res.status).toBe(400)
  })
  it('GET /api/classes/:id/attendance creates day if missing', async () => {
  hoisted.prismaMock.attendanceDay.findUnique.mockResolvedValueOnce(null)
  hoisted.prismaMock.attendanceDay.create.mockResolvedValueOnce({ id:'d1', classId:'c1', date:new Date('2025-09-19') })
  hoisted.prismaMock.attendanceRecord.findMany.mockResolvedValue([])
  hoisted.prismaMock.class.findUnique.mockResolvedValue({ id:'c1', enrollments:[] })
    const res = await request(app).get('/api/classes/c1/attendance?date=2025-09-19').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('d1')
  })
  it('PUT /api/attendance/days/:dayId/records upserts', async () => {
  hoisted.prismaMock.attendanceRecord.upsert.mockResolvedValue({})
    const items = [{ studentId:'s1', status:'PRESENT' }, { studentId:'s2', status:'ABSENT', observation:'Sick' }]
    const res = await request(app).put('/api/attendance/days/d1/records').set(auth()).send(items)
    expect(res.status).toBe(204)
  expect(hoisted.prismaMock.attendanceRecord.upsert).toHaveBeenCalledTimes(2)
  })
  it('GET /api/classes/:id/attendance/history returns list', async () => {
  hoisted.prismaMock.attendanceDay.findMany.mockResolvedValue([{ id:'d1', date:new Date('2025-09-01'), records:[] }])
    const res = await request(app).get('/api/classes/c1/attendance/history?from=2025-09-01&to=2025-09-30').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
  })
  it('GET /api/attendance/days/:dayId/records 404', async () => {
  hoisted.prismaMock.attendanceDay.findUnique.mockResolvedValue(null)
    const res = await request(app).get('/api/attendance/days/d404/records').set(auth())
    expect(res.status).toBe(404)
  })
  it('PATCH /api/attendance/days/:dayId/records/:studentId ok', async () => {
  hoisted.prismaMock.attendanceRecord.upsert.mockResolvedValue({ id:'r1', studentId:'s1', status:'JUSTIFIED' })
    const res = await request(app).patch('/api/attendance/days/d1/records/s1').set(auth()).send({ status:'JUSTIFIED', observation:'Doctor' })
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('JUSTIFIED')
  })
})

describe('Planning', () => {
  const app = createApp()
  it('GET /api/classes/:id/planning returns first', async () => {
  hoisted.prismaMock.planning.findFirst.mockResolvedValue({ id:'p1', classId:'c1', kind:'ANNUAL' })
    const res = await request(app).get('/api/classes/c1/planning?kind=ANNUAL').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('p1')
  })
  it('PUT /api/classes/:id/planning creates when missing', async () => {
  hoisted.prismaMock.planning.findFirst.mockResolvedValue(null)
  hoisted.prismaMock.planning.create.mockResolvedValue({ id:'p2', classId:'c1', kind:'SEMESTER', details:'1' })
    const res = await request(app).put('/api/classes/c1/planning').set(auth()).send({ kind:'SEMESTER', details:'1', title:'Sem 1' })
    expect(res.status).toBe(200)
    expect(res.body.id).toBe('p2')
  })

  it('GET planning respects discipline filter', async () => {
    // Should call prisma.planning.findFirst with where including { classId, kind, discipline }
    hoisted.prismaMock.planning.findFirst.mockResolvedValue({ id:'p3', classId:'c1', kind:'ANNUAL', discipline:'Artes' })
    const res = await request(app).get('/api/classes/c1/planning?kind=ANNUAL&discipline=Artes').set(auth())
    expect(res.status).toBe(200)
    expect(res.body.discipline).toBe('Artes')
    // Verify that the filter was used
    expect(hoisted.prismaMock.planning.findFirst).toHaveBeenCalledWith({ where: { classId:'c1', kind:'ANNUAL', discipline:'Artes' } })
  })

  it('PUT planning upserts per discipline and semester details', async () => {
    // First call: missing, so creates
    hoisted.prismaMock.planning.findFirst.mockResolvedValueOnce(null)
    hoisted.prismaMock.planning.create.mockResolvedValueOnce({ id:'p4', classId:'c1', kind:'SEMESTER', details:'2', discipline:'Matemática' })
    const createRes = await request(app)
      .put('/api/classes/c1/planning')
      .set(auth())
      .send({ kind:'SEMESTER', details:'2', title:'S2', discipline:'Matemática', content:'Conteúdo 2' })
    expect(createRes.status).toBe(200)
    expect(createRes.body.id).toBe('p4')

    // Second call: existing found, so updates
    hoisted.prismaMock.planning.findFirst.mockResolvedValueOnce({ id:'p4', classId:'c1', kind:'SEMESTER', details:'2', discipline:'Matemática' })
    hoisted.prismaMock.planning.update.mockResolvedValueOnce({ id:'p4', classId:'c1', kind:'SEMESTER', details:'2', discipline:'Matemática', content:'Atualizado' })
    const updateRes = await request(app)
      .put('/api/classes/c1/planning')
      .set(auth())
      .send({ kind:'SEMESTER', details:'2', title:'S2', discipline:'Matemática', content:'Atualizado' })
    expect(updateRes.status).toBe(200)
    expect(updateRes.body.content).toBe('Atualizado')
  })
})

describe('Activities', () => {
  const app = createApp()
  it('GET /api/classes/:id/activities list', async () => {
  hoisted.prismaMock.activity.findMany.mockResolvedValue([{ id:'a1', title:'Tarefa', classId:'c1' }])
    const res = await request(app).get('/api/classes/c1/activities').set(auth())
    expect(res.status).toBe(200)
    expect(res.body[0].id).toBe('a1')
  })
  it('POST /api/classes/:id/activities create', async () => {
  hoisted.prismaMock.activity.create.mockResolvedValue({ id:'a2', title:'Nova', classId:'c1' })
    const res = await request(app).post('/api/classes/c1/activities').set(auth()).send({ title:'Nova' })
    expect(res.status).toBe(201)
    expect(res.body.id).toBe('a2')
  })
  it('PUT /api/activities/:activityId update', async () => {
  hoisted.prismaMock.activity.update.mockResolvedValue({ id:'a2', title:'Edit', classId:'c1' })
    const res = await request(app).put('/api/activities/a2').set(auth()).send({ title:'Edit' })
    expect(res.status).toBe(200)
    expect(res.body.title).toBe('Edit')
  })
  it('DELETE /api/activities/:activityId 204', async () => {
  hoisted.prismaMock.activity.delete.mockResolvedValue({})
    const res = await request(app).delete('/api/activities/a2').set(auth())
    expect(res.status).toBe(204)
  })
  it('GET /api/activities/:activityId/grades list', async () => {
  hoisted.prismaMock.activityGrade.findMany.mockResolvedValue([{ id:'g1', studentId:'s1', score:9 }])
    const res = await request(app).get('/api/activities/a2/grades').set(auth())
    expect(res.status).toBe(200)
    expect(res.body[0].id).toBe('g1')
  })
  it('PUT /api/activities/:activityId/grades saves', async () => {
  hoisted.prismaMock.activityGrade.upsert.mockResolvedValue({})
    const res = await request(app).put('/api/activities/a2/grades').set(auth()).send([{ studentId:'s1', score:8.5 }])
    expect(res.status).toBe(204)
  expect(hoisted.prismaMock.activityGrade.upsert).toHaveBeenCalledTimes(1)
  })
})

describe('Signup', () => {
  const app = createApp()
  it('POST /api/signup/request creates', async () => {
  hoisted.prismaMock.signupRequest.findUnique.mockResolvedValue(null)
  hoisted.prismaMock.signupRequest.create.mockResolvedValue({ id:'sr1' })
    const res = await request(app).post('/api/signup/request').send({ name:'Ana', email:'ana@x.com', password:'123456', roleRequested:'TEACHER' })
    expect(res.status).toBe(201)
  })
  it('POST /api/signup/request 409 when exists', async () => {
  hoisted.prismaMock.signupRequest.findUnique.mockResolvedValue({ id:'sr1' })
    const res = await request(app).post('/api/signup/request').send({ name:'Ana', email:'ana@x.com', password:'123456', roleRequested:'TEACHER' })
    expect(res.status).toBe(409)
  })
  it('GET /api/signup/requests requires role', async () => {
    // authorize will check prisma.user role and return 403 for TEACHER
  hoisted.prismaMock.user.findUnique.mockResolvedValue({ role: 'TEACHER' })
    const res = await request(app).get('/api/signup/requests').set(auth())
    expect(res.status).toBe(403)
  })
  it('POST /api/signup/requests/:id/decide approves and creates user', async () => {
  hoisted.prismaMock.user.findUnique.mockResolvedValueOnce({ role: 'ADMIN' }) // authorize
  hoisted.prismaMock.signupRequest.findUnique.mockResolvedValue({ id:'sr1', name:'Ana', email:'ana@x.com', roleRequested:'TEACHER', passwordHash:'hashed' })
  hoisted.prismaMock.signupRequest.update.mockResolvedValue({ id:'sr1', status:'APPROVED' })
  hoisted.prismaMock.user.findUnique.mockResolvedValueOnce(null) // existsUser
  hoisted.prismaMock.user.create.mockResolvedValue({ id:'user-2' })
    const res = await request(app).post('/api/signup/requests/sr1/decide').set(auth()).send({ approved:true })
    expect(res.status).toBe(200)
  expect(hoisted.prismaMock.user.create).toHaveBeenCalled()
  })
})
