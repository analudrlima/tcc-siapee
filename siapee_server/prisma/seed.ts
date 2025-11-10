/// <reference types="node" />
import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Wiping database...')
  // Cleanup in dependency-safe order
  await prisma.activityGrade.deleteMany()
  await (prisma as any).elaboration.deleteMany()
  await (prisma as any).projectMilestone.deleteMany()
  await (prisma as any).project.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.planning.deleteMany()
  await prisma.attendanceRecord.deleteMany()
  await prisma.attendanceDay.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.class.deleteMany()
  await prisma.student.deleteMany()
  await prisma.refreshToken.deleteMany()
  await (prisma as any).passwordReset.deleteMany()
  await prisma.user.deleteMany()
  await prisma.gender.deleteMany()
  await (prisma as any).difficulty.deleteMany()
  await prisma.address.deleteMany()

  console.log('Seeding base data...')
  // Gêneros
  const genders = await prisma.$transaction([
    prisma.gender.create({ data: { description: 'Masculino' } }),
    prisma.gender.create({ data: { description: 'Feminino' } }),
    prisma.gender.create({ data: { description: 'Outro' } }),
    prisma.gender.create({ data: { description: 'Prefiro não informar' } })
  ])

  // Dificuldades
  const diffs = ['Fácil','Médio','Difícil']
  const difficultyCreates: any[] = []
  for (const type of diffs) difficultyCreates.push((prisma as any).difficulty.create({ data: { type } }))
  const difficulties = await prisma.$transaction(difficultyCreates)
  const difficultyByType: Record<string,string> = Object.fromEntries(difficulties.map((d:any)=>[d.type,d.id]))

  // Usuários (Admin + Secretaria + Professores)
  const admin = await prisma.user.create({ data: { name: 'Secretaria (Admin)', email: 'admin@siapee.local', password: await bcrypt.hash('admin123',10), role: Role.ADMIN } })
  const secretaria = await prisma.user.create({ data: { name: 'Secretaria Municipal', email: 'secretaria@escola.local', password: await bcrypt.hash('secret123',10), role: Role.SECRETARY } })
  const teacherNames = [
    ['Ana Paula','ana@escola.local'],
    ['Carlos Silva','carlos@escola.local'],
    ['Mariana Santos','mariana.santos@escola.local'],
    ['Pedro Gomes','pedro.gomes@escola.local'],
    ['Luciana Almeida','luciana.almeida@escola.local'],
    ['Ricardo Oliveira','ricardo.oliveira@escola.local']
  ] as const
  const teachers = [] as typeof admin[]
  for (const [name,email] of teacherNames) {
    const t = await prisma.user.create({ data: { name, email, password: await bcrypt.hash('prof123',10), role: Role.TEACHER, avatarUrl: `https://avatar.local/${email.split('@')[0]}.png` } })
    teachers.push(t)
  }
  const [profAna, profCarlos] = teachers // keep references for existing activity logic

  // Turmas (disciplinas expandidas)
  const turmas = await prisma.$transaction([
    (prisma as any).class.create({ data: { name: '1º Ano A', code: '1A-2025', year: 2025, disciplines: ['Português','Matemática','Artes','Inglês','Educação Física'] } }),
    (prisma as any).class.create({ data: { name: '2º Ano B', code: '2B-2025', year: 2025, disciplines: ['Português','Matemática','Ciências','Artes','Inglês','Educação Física'] } }),
    (prisma as any).class.create({ data: { name: '5º Ano A', code: '5A-2025', year: 2025, disciplines: ['Português','Matemática','Geografia','História','Ciências','Inglês','Educação Física'] } }),
  ])

  // Alunos (30 - 10 por turma) com endereços
  const makeAddr = (i:number) => ({ street:`Rua ${i}`, number: 100+i, neighborhood:'Centro', city:'Boa Vista', state:'RR', zipCode: `69${String(i).padStart(2,'0')}0-000` })
  const studentBaseNames = [
    'João Pedro','Mariana Lima','Rafael Souza','Bianca Torres','Lucas Andrade','Sofia Martins','Enzo Oliveira','Laura Ferreira','Gustavo Ramos','Isabela Cardoso', // 1º Ano A (0-9)
    'Pedro Henrique','Manuela Costa','Thiago Mendes','Helena Duarte','Matheus Barros','Lívia Teixeira','Bruno Cavalcante','Gabriela Fonseca','André Silveira','Camila Nunes', // 2º Ano B (10-19)
    'Felipe Araujo','Larissa Monteiro','Daniel Figueiredo','Beatriz Pires','Caio Brito','Alice Santana','Vitor Moraes','Luana Bastos','Igor Freitas','Carolina Rocha' // 5º Ano A (20-29)
  ]
  const students = [] as any[]
  for (let i=0;i<studentBaseNames.length;i++) {
    const name = studentBaseNames[i]
    const registryId = 'ALU' + String(i+1).padStart(3,'0')
    const email = name.toLowerCase().split(' ').join('.') + '@aluno.local'
    const genderIdx = i % 2 === 0 ? 0 : 1
    const birthYear = 2015 - Math.floor(i/10) // just vary by turma group
    const birthMonth = (i % 12) + 1
    const birthDay = ((i % 27) + 1)
    const student = await (prisma as any).student.create({
      data: {
        name,
        email,
        registryId,
        birthDate: new Date(`${birthYear}-${String(birthMonth).padStart(2,'0')}-${String(birthDay).padStart(2,'0')}`),
        gender: { connect: { id: genders[genderIdx].id } },
        phone: `(95) 99999-${String(1000 + i).slice(-4)}`,
        address: { create: makeAddr(i+1) },
        comorbidities: i % 7 === 0 ? 'Asma leve' : undefined,
        allergies: i % 11 === 0 ? 'Alergia a lactose' : undefined,
        medications: i % 13 === 0 ? 'Uso ocasional de anti-histamínico' : undefined,
        observations: i % 5 === 0 ? 'Participação ativa em sala.' : 'Precisa incentivo em leitura.'
      }
    })
    students.push(student)
  }

  // Matrículas (10 alunos por turma)
  const enrollmentCreates = [] as any[]
  for (let i=0;i<students.length;i++) {
    const turmaIndex = Math.floor(i/10) // 0,1,2
    enrollmentCreates.push(prisma.enrollment.create({ data: { classId: turmas[turmaIndex].id, studentId: students[i].id } }))
  }
  await prisma.$transaction(enrollmentCreates)

  // Relações professor-turma (TeacherClass) com disciplinas atribuídas
  const teacherClassCreates: any[] = []
  turmas.forEach((t, idx) => {
    // Distribui 2 professores por turma com subconjunto de disciplinas
    const assignedTeachers = teachers.slice(idx, idx+2)
    assignedTeachers.forEach((teach, offset) => {
      const slice = t.disciplines.slice(offset, offset + 3)
      teacherClassCreates.push((prisma as any).teacherClass.create({ data: { teacherId: teach.id, classId: t.id, disciplines: slice } }))
    })
  })
  await prisma.$transaction(teacherClassCreates)

  // Pedidos de inscrição (SignupRequest) simulados
  const signupRequestsCreates: any[] = []
  signupRequestsCreates.push(prisma.signupRequest.create({ data: { name: 'Novo Professor 1', email: 'novo1@escola.local', roleRequested: Role.TEACHER, reason: 'Desejo contribuir com projetos multidisciplinares.' } }))
  signupRequestsCreates.push(prisma.signupRequest.create({ data: { name: 'Novo Professor 2', email: 'novo2@escola.local', roleRequested: Role.TEACHER, status: 'APPROVED', decidedById: admin.id, reason: 'Experiência em alfabetização.' } }))
  signupRequestsCreates.push(prisma.signupRequest.create({ data: { name: 'Candidato Rejeitado', email: 'rejeitado@escola.local', roleRequested: Role.TEACHER, status: 'REJECTED', decidedById: admin.id, reason: 'Documentação incompleta.' } }))
  const signupRequests = await prisma.$transaction(signupRequestsCreates)

  // Planejamentos enriquecidos
  const planningCreates: any[] = []
  // Anual + Semestre 1 + Semestre 2 por turma
  turmas.forEach((t, idx) => {
    planningCreates.push(prisma.planning.create({ data: { classId: t.id, kind: 'ANNUAL', date: new Date(`${t.year}-02-10`), title: `Planejamento Anual ${t.code}`, discipline: 'Português', content: 'Metas globais de leitura e escrita incluindo produção textual, interpretação, debates e projetos de leitura extensa. Ênfase em inclusão.', lessonsPlanned: 40 } }))
    planningCreates.push(prisma.planning.create({ data: { classId: t.id, kind: 'SEMESTER', details: '1', date: new Date(`${t.year}-03-05`), title: `Planejamento S1 ${t.code}`, discipline: 'Matemática', content: 'Operações fundamentais, problemas contextualizados, introdução a frações e resolução colaborativa de desafios lógicos.', lessonsPlanned: 20 } }))
    planningCreates.push(prisma.planning.create({ data: { classId: t.id, kind: 'SEMESTER', details: '2', date: new Date(`${t.year}-08-07`), title: `Planejamento S2 ${t.code}`, discipline: 'Ciências', content: 'Observação sistemática, pequenos experimentos, registros fotográficos e iniciação ao método científico com foco em sustentabilidade local.', lessonsPlanned: 22 } }))
  })
  // Plano individual para último aluno da turma
  planningCreates.push(prisma.planning.create({ data: { classId: turmas[0].id, kind: 'INDIVIDUAL', date: new Date(`${turmas[0].year}-04-15`), details: students[9].id, title: 'Plano Individual Leitura', discipline: 'Português', content: 'Refinamento de fluência, compreensão inferencial e produção criativa semanal com acompanhamento de progresso.' } }))
  planningCreates.push(prisma.planning.create({ data: { classId: turmas[1].id, kind: 'INDIVIDUAL', date: new Date(`${turmas[1].year}-05-12`), details: students[19].id, title: 'Plano Individual Matemática', discipline: 'Matemática', content: 'Fortalecer cálculo mental, estimativas rápidas, jogos de raciocínio e introdução progressiva a frações equivalentes.' } }))
  planningCreates.push(prisma.planning.create({ data: { classId: turmas[2].id, kind: 'INDIVIDUAL', date: new Date(`${turmas[2].year}-06-22`), details: students[29].id, title: 'Plano Individual Ciências', discipline: 'Ciências', content: 'Incentivar curiosidade investigativa com mini relatórios semanais, uso de microscópio simples e diário de observações ambientais.' } }))
  await prisma.$transaction(planningCreates)

  // Atividades enriquecidas por turma (3 cada) + notas para 5 alunos
  const allActivities: any[] = []
  const disciplinesPool = ['Português','Matemática','Ciências','Artes','Geografia']
  turmas.forEach((t, turmaIdx) => {
    for (let a=0;a<3;a++) {
      const teacher = teachers[(turmaIdx + a) % teachers.length]
      const discipline = disciplinesPool[(turmaIdx + a) % disciplinesPool.length]
      const difficultyId = a === 0 ? difficultyByType['Fácil'] : a === 1 ? difficultyByType['Médio'] : difficultyByType['Difícil']
      allActivities.push(prisma.activity.create({ data: {
        classId: t.id,
        teacherId: teacher.id,
        title: `Atividade ${a+1} ${t.code}`,
        description: `Descrição detalhada da atividade ${a+1} para turma ${t.code}. Objetivos específicos, critérios de avaliação e adaptações para inclusão.`,
        discipline,
        category: 'SUBJECT',
        maxScore: 10,
        content: 'Conteúdo trabalhado em sala com exercícios práticos e estudo dirigido.',
        methodology: 'Dinâmicas colaborativas, resolução de problemas em grupos e feedback formativo contínuo.',
        topic: 'Tema central interdisciplinar relacionado à realidade local.',
        explanation: 'Explicação ampliada sobre a importância da atividade para o desenvolvimento das competências gerais.',
        indication: 'Indicação de recursos adicionais (vídeos educativos, jogos online controlados, fichas de trabalho).',
        records: 'Registro de participação e engajamento coletado ao final de cada etapa.',
        observations: 'Observações sobre comportamento, interação social e necessidades de reforço.',
        difficultyId,
      }}))
    }
  })
  const createdActivities = await prisma.$transaction(allActivities)
  // Notas: primeiros 5 alunos de cada turma nas respectivas 3 atividades
  const gradeCreates: any[] = []
  turmas.forEach((t, turmaIdx) => {
    const turmaStudents = students.slice(turmaIdx*10, turmaIdx*10 + 10)
    const turmaActs = createdActivities.filter(a=>a.classId === t.id)
    turmaActs.forEach(act => {
      turmaStudents.slice(0,5).forEach((stu, i) => {
        gradeCreates.push(prisma.activityGrade.create({ data: { activityId: act.id, studentId: stu.id, score: 6 + (i*0.8), feedback: 'Participação adequada' } }))
      })
    })
  })
  await prisma.$transaction(gradeCreates)
  const totalGrades = gradeCreates.length

  // Projetos (1 por turma) + marcos
  const projectCreates: any[] = []
  turmas.forEach((t, turmaIdx) => {
    const owner = teachers[turmaIdx % teachers.length]
    projectCreates.push((prisma as any).project.create({ data: {
      classId: t.id,
      ownerId: owner.id,
      title: `Projeto ${t.code} Sustentabilidade`,
      description: 'Ações práticas e pesquisa sobre sustentabilidade escolar envolvendo reciclagem, economia de água e energia. Inclui engajamento da comunidade e feira de resultados.',
      type: turmaIdx === 2 ? 'MULTIDISCIPLINARY' : 'SUBJECT',
      status: 'PLANNING',
      audience: 'Comunidade Escolar',
      startDate: new Date(`${t.year}-03-01`),
      attachments: [
        { name: 'cronograma.pdf', url: 'https://files.local/cronograma.pdf' },
        { name: 'referencias.txt', url: 'https://files.local/referencias.txt' }
      ] as any
    }}))
  })
  const projects = await prisma.$transaction(projectCreates)
  const milestoneCreates: any[] = []
  projects.forEach((p, idx) => {
    milestoneCreates.push((prisma as any).projectMilestone.create({ data: { projectId: p.id, title: 'Definir escopo', dueDate: new Date(`${new Date().getFullYear()}-03-10`), notes: 'Reunião inicial e levantamento de ideias.' } }))
    milestoneCreates.push((prisma as any).projectMilestone.create({ data: { projectId: p.id, title: 'Recolher materiais', dueDate: new Date(`${new Date().getFullYear()}-04-05`), notes: 'Mapeamento de recursos reutilizáveis.' } }))
    milestoneCreates.push((prisma as any).projectMilestone.create({ data: { projectId: p.id, title: 'Apresentação final', dueDate: new Date(`${new Date().getFullYear()}-06-20`), notes: 'Evento com convidados externos.' } }))
  })
  await prisma.$transaction(milestoneCreates)

  // Faltas (3 dias por turma)
  const attendanceStatuses = ['PRESENT','ABSENT','LATE','JUSTIFIED'] as const
  const attendanceDayCreates: any[] = []
  turmas.forEach((t, turmaIdx) => {
    for (let d=0; d<3; d++) {
      attendanceDayCreates.push(prisma.attendanceDay.create({ data: { classId: t.id, date: new Date(Date.now() - d*86400000), notes: `Dia ${d+1} de acompanhamento com observações sobre participação, colaboração e atenção.` } }))
    }
  })
  const attendanceDays = await prisma.$transaction(attendanceDayCreates)
  const recordCreates: any[] = []
  attendanceDays.forEach(day => {
    const turmaIndex = turmas.findIndex(t=>t.id===day.classId)
    const turmaStudents = students.slice(turmaIndex*10, turmaIndex*10 + 5) // primeiros 5 para simplificar
    turmaStudents.forEach((stu,i) => {
      const status = attendanceStatuses[(i + day.date.getDate()) % attendanceStatuses.length]
      recordCreates.push(prisma.attendanceRecord.create({ data: { attendanceDayId: day.id, studentId: stu.id, status, observation: status==='ABSENT' ? 'Motivo não informado' : undefined } }))
    })
  })
  await prisma.$transaction(recordCreates)
  const totalAttendanceDays = attendanceDays.length
  const totalAttendanceRecords = recordCreates.length

  // Elaborações (notas de desenvolvimento) para primeiras 2 atividades de cada turma
  const elaborationCreates: any[] = []
  createdActivities.forEach(act => {
    if (act.title.includes('Atividade 1') || act.title.includes('Atividade 2')) {
      const teacherA = teachers[Math.floor(Math.random()*teachers.length)]
      const teacherB = teachers[Math.floor(Math.random()*teachers.length)]
      elaborationCreates.push((prisma as any).elaboration.create({ data: { activityId: act.id, userId: teacherA.id, text: 'Aluno demonstrou progresso na participação e compreensão, interagindo mais com colegas.' } }))
      elaborationCreates.push((prisma as any).elaboration.create({ data: { activityId: act.id, userId: teacherB.id, text: 'Necessita reforço em vocabulário específico; iniciou uso de glossário pessoal.' } }))
    }
  })
  await prisma.$transaction(elaborationCreates)

  // Audit logs simulando ações administrativas
  const auditCreates: any[] = []
  auditCreates.push((prisma as any).auditLog.create({ data: { userId: admin.id, action: 'SEED_INIT', entity: 'System', entityId: 'seed', metadata: { version: 2 } as any } }))
  teachers.slice(0,2).forEach(t => {
  auditCreates.push((prisma as any).auditLog.create({ data: { userId: admin.id, action: 'TEACHER_ASSIGNED', entity: 'TeacherClass', entityId: t.id, metadata: { teacher: t.email } as any } }))
  })
  auditCreates.push((prisma as any).auditLog.create({ data: { userId: admin.id, action: 'SIGNUP_REVIEW', entity: 'SignupRequest', entityId: signupRequests[1].id, metadata: { status: 'APPROVED' } as any } }))
  auditCreates.push((prisma as any).auditLog.create({ data: { userId: admin.id, action: 'SIGNUP_REVIEW', entity: 'SignupRequest', entityId: signupRequests[2].id, metadata: { status: 'REJECTED' } as any } }))
  await prisma.$transaction(auditCreates)

  console.log('Seed concluído:')
  console.log('- Usuários:', [admin.email, secretaria.email, ...teachers.map(t=>t.email)])
  console.log('- Turmas:', turmas.map(t=>`${t.name} (${t.code}) -> ${t.disciplines.length} disciplinas`).join('; '))
  console.log('- Total de Alunos:', students.length)
  console.log('- Alunos (primeiros 10):', students.slice(0,10).map(s=>`${s.name} (${s.registryId})`).join(', '))
  console.log('- Distribuição por turma:', {
    [turmas[0].code]: students.filter((_,i)=>i<10).length,
    [turmas[1].code]: students.filter((_,i)=>i>=10 && i<20).length,
    [turmas[2].code]: students.filter((_,i)=>i>=20 && i<30).length,
  })
  console.log('- Atividades criadas:', createdActivities.length)
  console.log('- Notas registradas:', totalGrades)
  console.log('- Projetos:', projects.length, 'Milestones:', milestoneCreates.length)
  console.log('- Dias de presença:', totalAttendanceDays, 'Registros:', totalAttendanceRecords)
  console.log('- Elaborações:', elaborationCreates.length)
  console.log('- Pedidos de inscrição:', signupRequests.length)
  console.log('- Relações professor-turma:', teacherClassCreates.length)
  console.log('- Logs de auditoria:', auditCreates.length)
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
