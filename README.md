# SIAPEE

Sistema de Apoio Pedagógico para APAE – protótipo funcional com backend (Node/Express/Prisma) e frontend (React/Vite/TS).

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

## Telas implementadas nesta fase

As imagens do protótipo (vide pasta anexada) foram seguidas para montar a navegação e o layout. O que está pronto:

- Login (estilizado conforme protótipo) – `GET /api/auth/login`
- Solicitar cadastro (página pública) – envia para `POST /api/signup/request`
- Área logada com Topbar, Sidebar e Layout responsivo
  - Turmas – lista turmas e alunos matriculados
  - Registro de faltas – Diário/Observações/Históricos – criação automática do dia, marcação Presente/Ausente/Justificada e observações por aluno; histórico por período
  - Planejamento Anual – selecionar turma/disciplinas e salvar conteúdo (por disciplina)
  - Planejamento Semestral – estrutura equivalente ao Anual por semestre (por disciplina)
  - Planejamento Individual – funcional (por aluno e disciplina)
  - Perfil do usuário – visualização e edição de nome
  - Admin/Secretaria – aprovação de solicitações de cadastro

Outras telas implementadas nesta fase:

- Atividades – Matéria (CRUD completo)
- Atividades – Multidisciplinares (funcional, reutiliza a UI de Atividades)
- Avaliações – Desenvolvimento do Aluno (funcional, armazena via Planejamento Individual)
- Avaliações – Evolutivas (funcional, armazena via Planejamento Individual)
- Projetos – Matéria (funcional, reutiliza a UI de Atividades)
- Projetos – Multidisciplinares (funcional, reutiliza a UI de Atividades)

## Ajustes de Design realizados

- Barra superior (Topbar) unificada em 72px, degrade azul, menu de perfil com clique fora/Escape
- Sidebar agrupada por seções e links conforme o protótipo
- Correções no CSS (remoção de duplicidades, altura do layout corrigida para 72px, variáveis e cores)
- Componentes utilitários: `panel`, `card`, `table`, `btn` com estados
- Tela de Login reestilizada para casar com o mock
- Responsividade nas telas de Perfil e geral

## API (MVP + extras para substituir Argus)

- Auth
  - `POST /api/auth/login` – retorna `accessToken`, `refreshToken` e `user`
  - `POST /api/auth/refresh` – troca refresh por novo access
  - `POST /api/auth/logout` – invalida refresh
- Usuário
  - `GET /api/users/me`
  - `PUT /api/users/me` – alterar nome
- Cadastro (fluxo de aprovação)
  - `POST /api/signup/request`
  - `GET /api/signup/requests` (ADMIN/SECRETARY)
  - `POST /api/signup/requests/:id/decide` (ADMIN/SECRETARY)
- Turmas e planejamento/frequência
  - `GET /api/classes`
  - `GET /api/classes/:id`
  - `GET /api/classes/:id/teachers` — professores alocados na turma
  - `POST /api/classes/:id/teachers` (ADMIN/SECRETARIA) — atribuir professor e disciplinas
  - `DELETE /api/classes/:id/teachers/:teacherId` (ADMIN/SECRETARIA) — remover alocação
  - `GET /api/classes/:id/attendance?date=YYYY-MM-DD` – cria o dia se necessário
  - `PUT /api/attendance/days/:dayId/records` – salva lista de presenças
  - `GET /api/classes/:id/attendance/history?from=YYYY-MM-DD&to=YYYY-MM-DD` – histórico por período
  - `GET /api/attendance/days/:dayId/records` – registros do dia com turma/alunos
  - `PATCH /api/attendance/days/:dayId/records/:studentId` – editar status/observação do aluno
  - `GET /api/classes/:id/planning?kind=ANNUAL|SEMESTER_1|SEMESTER_2|INDIVIDUAL&discipline=...&details=...` – filtra por turma, tipo e, opcionalmente, disciplina e detalhes
    - Para Anual/Semestral: `discipline` define a disciplina; `details` pode ser usado para semestre (ex.: `1` ou `2`).
    - Para Individual: `discipline` define a disciplina; `details` define o escopo do registro individual (ex.: `alunoId` ou chaves prefixadas `dev:alunoId`/`evo:alunoId` para avaliações de Desenvolvimento/Evolutivas).
  - `PUT /api/classes/:id/planning` – salva planejamento
    - Corpo: `{ kind, title, content, discipline?, details?, lessonsPlanned? }`
  - `GET /api/classes/:id/activities` – listar atividades por turma
  - `POST /api/classes/:id/activities` – criar atividade
  - `PUT /api/activities/:activityId` – editar atividade
  - `DELETE /api/activities/:activityId` – excluir atividade
  - `GET /api/activities/:activityId/grades` – listar notas
  - `PUT /api/activities/:activityId/grades` – salvar notas em lote
  - `GET /api/difficulties` – listar dificuldades para categorização

- Projetos
  - `GET /api/classes/:id/projects` — listar
  - `POST /api/classes/:id/projects` — criar
  - `PUT /api/projects/:projectId` — atualizar
  - `DELETE /api/projects/:projectId` — excluir
  - `GET /api/projects/:projectId/milestones` — marcos
  - `POST /api/projects/:projectId/milestones` — criar marco
  - `PUT /api/projects/:projectId/milestones/:milestoneId` — atualizar marco
  - `DELETE /api/projects/:projectId/milestones/:milestoneId` — excluir marco

- Relatórios (exportação CSV)
  - `GET /api/reports/attendance.csv?classId=...&from=YYYY-MM-DD&to=YYYY-MM-DD`
  - `GET /api/reports/grades.csv?classId=...`

- Operações/Resiliência
  - `GET /api/health` — status da API e conexão com o banco
  - `POST /api/admin/rollover/preview` — prévia de criação das turmas do próximo ano (copia nomes/códigos/disciplinas)
  - `POST /api/admin/rollover/commit` — cria turmas do próximo ano (sem matrículas)

## O que falta / Próximos Passos

Funcionalidades:

- Consolidados de Faltas (pivot/totais) e exportações em PDF
- Observações avançadas por aluno/data (relatórios e filtros)
- Anexos em Atividades/Projetos (storage S3/Azure Blob)
- Perfil: upload de foto e endereço/telefone completos
- RBAC fino por papel (Admin/Secretaria/Professor) com políticas por disciplina/turma
- Melhorar seed e migrações Prisma conforme DER completo
- Portal da família (visualização de presenças e notas)
- Auditoria navegável (filtros por entidade/usuário/período)

Design/UX:

- Polir tabelas e formulários (validações e feedbacks)
- Tema escuro opcional
- Acessibilidade (foco visível, atalhos, ARIA)

DevOps:

- Pipeline de CI para lint/build/test
- Opcional: silenciar aviso ESM do Cypress renomeando `cypress.config.ts` para `cypress.config.mts`
- Backups programados do Postgres (pg_dump) e restauração

## Testes automatizados

### Backend (Vitest + Supertest)

- Rodar na pasta `siapee_server`:
  - `npm test` — executa a suíte com mocks do Prisma/JWT/Bcrypt.
- Cobertura atual (33 testes): autenticação, usuários, turmas, frequência (diário/histórico/dia/patch), planejamento (ANUAL/SEMESTRAL/INDIVIDUAL com filtros `discipline` e `details`) e atividades (CRUD/grades), além do fluxo de cadastro.

### Frontend E2E (Cypress)

- Requisitos: Vite dev rodando em `http://localhost:5173`.
- Rodar na pasta `siapee_front`:
  - `npm run cypress:open` — abre a UI do Cypress.
  - `npm run cypress:run` — executa em linha de comando.
- Especificações cobertas:
  - `attendance.cy.ts`: Diário/Observações/Históricos — valida inclusive que o PUT envia um array conforme a API.
  - `planning.cy.ts`: Planejamento Anual/Semestral por disciplina e semestre.
  - `individual.cy.ts`: Planejamento Individual por aluno e disciplina.
  - `avaliacoes.cy.ts`: Avaliações de Desenvolvimento/Evolutivas via Planejamento Individual (`details` prefixados `dev:`/`evo:`).
  - `activities.cy.ts`: Atividades por turma (listar/criar/excluir + notas).
  - `atividades_multi.cy.ts`: Atividades Multidisciplinares (reutilização da UI de Atividades).
  - `projetos.cy.ts`: Projetos (Matéria/Multidisciplinares) reutilizando a UI de Atividades.
- As chamadas à API são simuladas com `cy.intercept`, e tokens falsos são definidos no `localStorage` (`siapee_tokens`) para passar pelo `ProtectedRoute`. Para rotas idênticas em sequência, os intercepts são registrados de forma encadeada para evitar flakiness.

---

Para dúvidas ou ajustes do setup, consulte os arquivos `.env.example` e `docker-compose.yml`.
