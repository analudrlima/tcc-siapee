# SIAPEE API - rascunho (MVP)

Base URL: `http://localhost:3333/api`

## Auth

- POST `/auth/login` { email, password } -> { accessToken, refreshToken }
- POST `/auth/refresh` { refreshToken } -> { accessToken }
- POST `/auth/logout` -> 204

## Users (admin)

- GET `/users` -> lista
- POST `/users` -> cria professor/admin

## Classes

- GET `/classes`
- POST `/classes`
- GET `/classes/:id`
- PATCH `/classes/:id`
- DELETE `/classes/:id`

## Students

- GET `/students`
- POST `/students`
- GET `/students/:id`
- PATCH `/students/:id`
- DELETE `/students/:id`

## Enrollments

- POST `/classes/:id/enrollments` { studentId }
- DELETE `/classes/:id/enrollments/:enrollmentId`

## Attendance

- POST `/classes/:id/attendance/days` { date }
- GET `/classes/:id/attendance/days?from=&to=`
- PUT `/attendance/days/:dayId/records` [{ studentId, status, observation? }]

## Planning

- GET `/classes/:id/planning`
- POST `/classes/:id/planning`

## Activities & Grades

- GET `/classes/:id/activities`
- POST `/classes/:id/activities`
- PUT `/activities/:id/grades` [{ studentId, score, feedback? }]

---

Observações:

- Todas as rotas (exceto login/refresh) exigem `Authorization: Bearer <token>`.
- Respostas com paginação: `?page=&limit=` retornam `{ data, page, limit, total }`.
