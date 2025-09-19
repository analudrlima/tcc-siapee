# Plano de Desenvolvimento

## MVP (Fase 1)

- Autenticação JWT + refresh
- Usuários (Admin/Professor) – CRUD básico (admin)
- Turmas – CRUD
- Alunos – CRUD
- Matrículas – vincular alunos às turmas
- Frequência – criar dia, marcar presença/ausência/atraso
- Planejamento – registrar tópicos por data
- Atividades – cadastro e notas por aluno
- Perfil do usuário – editar dados

## Qualidade e Segurança

- Lint + Typecheck CI
- Logs e tratamento de erros padronizado
- Validação com Zod/Joi nos endpoints
- Seeds e migrações versionadas

## Fase 2

- Relatórios (frequência, notas)
- Upload de avatar (S3/local)
- Esqueci/Reset de senha via e-mail
- Notificações por e-mail

## Fase 3

- Permissões mais granulares (RBAC)
- Auditoria de ações (tabela de logs)
- Internacionalização (pt-BR, en-US)
- Dashboard com métricas

## Observações

- Priorizar endpoints necessários às telas do protótipo.
- Reuniões de revisão a cada incremento para alinhar com o protótipo.
