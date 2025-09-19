# SIAPEE - Setup inicial

Este repositório contém dois projetos:

- `siapee_server`: backend Node.js (Express + TypeScript + Prisma)
- `siapee_front`: frontend React (Vite + TypeScript)

## Requisitos

- Node.js 18+
- Docker e Docker Compose
- PowerShell (Windows)

## 1) Subir Postgres via Docker

```powershell
cd "c:\Users\Andre\Downloads\TCC ANA\novo codigo"
docker compose up -d
```

Banco disponível em `localhost:5432` (user: `postgres`, pass: `postgres`). PgAdmin em `http://localhost:8081` (login `admin@local` / `admin`).

## 2) Backend

```powershell
cd "c:\Users\Andre\Downloads\TCC ANA\novo codigo\siapee_server"
Copy-Item .env.example .env -Force
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

- API: `http://localhost:3333/api`
- Health check: `http://localhost:3333/health`
- Health API: `http://localhost:3333/api/health`
  
Credenciais iniciais (seed):

- Admin: `admin@siapee.local` / `admin123`

## 3) Frontend

```powershell
cd "c:\Users\Andre\Downloads\TCC ANA\novo codigo\siapee_front"
Copy-Item .env.example .env -Force
npm install
npm run dev
```

- App: `http://localhost:5173`

## Estrutura sugerida

- Auth (JWT + refresh tokens)
- Usuários (Admin, Professor)
- Turmas, Alunos, Matrículas
- Frequência (chamada por dia)
- Planejamento e Atividades
- Avaliações e Lançamento de notas
- Perfil do usuário, upload de avatar

## Próximos passos

- Implementar schema Prisma completo e migrações
- Criar rotas REST com validação
- Middlewares de autenticação e RBAC básico
- Páginas e componentes do frontend conforme protótipo
- Testes (unitário e integração)

```text
Estrutura MVP esperada:
- Login/Logout e refresh
- CRUD de turma, aluno e matrícula
- Marcação de frequência por data
- Cadastro de atividades e notas
```

---

Para dúvidas ou ajustes do setup, consulte os arquivos `.env.example` e o `docker-compose.yml`.
