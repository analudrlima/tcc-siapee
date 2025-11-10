// @ts-nocheck
// Fluxo diário completo de um professor: presença, planejamento, atividades, projetos, avaliações, exportações e perfil

function seedAuth() {
  cy.window().then(win => {
    win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'abc', refreshToken: 'def' }))
  })
  cy.intercept('GET', '**/api/users/me', { statusCode:200, body:{ id:'u1', name:'Prof Teste', role:'TEACHER', email:'prof@teste.com' } })
}

describe('Fluxo Diário do Professor', () => {
  beforeEach(() => {
    seedAuth()
  })

  it('realiza fluxo completo', () => {
    // Listagem de turmas para várias telas
    cy.intercept('GET', '**/api/classes', { statusCode:200, body:[{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] }).as('classes')

    // 1. Presenças (diário)
    // Estrutura esperada: { id, records:[{studentId,status}], class:{ enrollments:[{student:{id,name}}] } }
    cy.intercept('GET', '**/api/classes/c1/attendance*', {
      statusCode:200,
      body:{
        id:'day1',
        records:[{ studentId:'s1', status:'ABSENT' },{ studentId:'s2', status:'PRESENT' }],
        class:{ enrollments:[{ student:{ id:'s1', name:'Aluno 1' } },{ student:{ id:'s2', name:'Aluno 2' } }] }
      }
    }).as('attList')
    cy.intercept('PUT', '**/api/attendance/days/day1/records', { statusCode:200, body:{ ok:true } }).as('attSave')
    cy.visit('/faltas')
    cy.wait('@classes')
    cy.get('select').first().select('Turma 1')
    cy.wait('@attList')
    // salva direto (status default para não marcados é PRESENT já gerado no componente)
    cy.contains('Salvar').click()
    cy.wait('@attSave')
    cy.contains('Presenças salvas')

    // 2. Planejamento Anual
    cy.intercept('GET', '**/api/classes/c1/planning*', (req) => {
      if (req.query.kind === 'ANNUAL') {
        req.reply({ statusCode:200, body:{ discipline:'Artes', lessonsPlanned: 20, content:'Conteúdo inicial' } })
      }
    }).as('annualLoad')
    cy.intercept('PUT', '**/api/classes/c1/planning', (req) => {
      if (req.body?.kind === 'ANNUAL') {
        req.reply({ statusCode:200, body:{ ok:true } })
      }
    }).as('annualSave')
  cy.visit('/planejamento/anual')
  cy.get('select').first().select('Turma 1')
  cy.wait('@annualLoad')
  cy.get('textarea').clear().type('Conteúdo atualizado anual')
  // Botão simplesmente "Salvar"
  cy.contains('Salvar').click()
    cy.wait('@annualSave')
    cy.contains('Planejamento anual salvo')

    // 3. Atividade simples
    let actCalls = 0
    cy.intercept('GET', '**/api/classes/c1/activities*', (req) => {
      actCalls++
      if (actCalls === 1) {
        req.reply({ statusCode:200, body:[] })
      } else {
        req.reply({ statusCode:200, body:[{ id:'a1', title:'Atv Rotina', maxScore:10, dueDate:null, discipline:'Artes' }] })
      }
    }).as('actsList')
    cy.intercept('POST', '**/api/classes/c1/activities', (req) => {
      expect(req.body.title).to.eq('Atv Rotina')
      req.reply({ statusCode:201, body:{ id:'a1', title:req.body.title, maxScore:10 } })
    }).as('actCreate')
    cy.visit('/atividades/materia')
    cy.get('select').first().select('Turma 1')
    cy.wait('@actsList') // first (empty)
    cy.get('[data-cy=activity-title]').type('Atv Rotina')
    cy.get('[data-cy=activity-max]').clear().type('10')
    cy.get('[data-cy=activity-add]').click()
    cy.wait('@actCreate')
    cy.contains('Atividade criada')
    cy.wait('@actsList') // second (with item)

  // Lista já é recarregada pelo próprio fluxo após criação

  // 4. Adicionar relato da atividade
  cy.intercept('GET', '**/api/activities/a1/elaborations', { statusCode:200, body:[] }).as('relatosInit')
  cy.intercept('POST', '**/api/activities/a1/elaborations', { statusCode:201, body:{ id:'e1', text:'Aluno participou ativamente.', createdAt:new Date().toISOString() } }).as('relatoAdd')
  cy.get('[data-cy=activity-relatos]').click()
  cy.wait('@relatosInit')
  cy.get('.card').find('textarea').first().type('Aluno participou ativamente.')
  cy.get('[data-cy=activity-elab-add]').click()
    cy.wait('@relatoAdd')
    cy.contains('Relato adicionado')

    // 5. Salvar notas da atividade
  cy.intercept('GET', '**/api/classes/c1', { statusCode:200, body:{ id:'c1', name:'Turma 1', code:'T1', year:2025, enrollments:[{ student:{ id:'s1', name:'Aluno 1'} }, { student:{ id:'s2', name:'Aluno 2'} }]} })
  cy.intercept('GET', '**/api/activities/a1/grades', { statusCode:200, body:[] })
  cy.intercept('PUT', '**/api/activities/a1/grades', { statusCode:200, body:{ ok:true } }).as('gradesSave')
  cy.get('[data-cy=activity-notas]').click()
  cy.get('[data-cy=activity-grades-save]').click()
    cy.wait('@gradesSave')
    cy.contains('Notas salvas')

    // 6. Projeto simples
  cy.intercept('GET', '**/api/classes/c1/projects*', { statusCode:200, body:[] }).as('projectsEmpty')
    cy.intercept('POST', '**/api/classes/c1/projects', (req) => {
      expect(req.body.title).to.eq('Projeto Rotina')
      req.reply({ statusCode:201, body:{ id:'p1', title:req.body.title } })
    }).as('projCreate')
    cy.visit('/projetos/materia')
    cy.get('select').first().select('Turma 1')
    cy.wait('@projectsEmpty')
    cy.get('[data-cy=project-title]').type('Projeto Rotina')
    cy.get('[data-cy=project-add]').click()
    cy.wait('@projCreate')
    cy.contains('Projeto criado')

    // 7. Avaliação desenvolvimento
    // /classes/:id and planning individual para avaliações
    cy.intercept('GET', '**/api/classes/c1', { statusCode:200, body:{ id:'c1', name:'Turma 1', code:'T1', year:2025, enrollments:[{ student:{ id:'s1', name:'Aluno 1'} }]} }).as('classDetail1')
    cy.intercept('GET', '**/api/classes/c1/planning*', (req) => {
      if (req.query.kind === 'INDIVIDUAL' && typeof req.query.details === 'string' && req.query.details.startsWith('dev:')) {
        req.reply({ statusCode:200, body:{ content:'Anterior' } })
      }
    }).as('devLoad')
    cy.intercept('PUT', '**/api/classes/c1/planning', (req) => {
      if (req.body?.details?.startsWith('dev:')) {
        req.reply({ statusCode:200, body:{ ok:true } })
      }
    }).as('devSave')
    cy.visit('/avaliacoes/desenvolvimento')
    cy.get('select').first().select('Turma 1')
    cy.wait('@devLoad')
    cy.get('textarea').clear().type('Texto desenvolvimento atualizado')
    cy.contains('Salvar').click()
    cy.wait('@devSave')
    cy.contains('Avaliação salva')

    // 8. Avaliação evolutiva
    cy.intercept('GET', '**/api/classes/c1', { statusCode:200, body:{ id:'c1', name:'Turma 1', code:'T1', year:2025, enrollments:[{ student:{ id:'s1', name:'Aluno 1'} }]} }).as('classDetail2')
    cy.intercept('GET', '**/api/classes/c1/planning*', (req) => {
      if (req.query.kind === 'INDIVIDUAL' && typeof req.query.details === 'string' && req.query.details.startsWith('evo:')) {
        req.reply({ statusCode:200, body:{ content:'Prev' } })
      }
    }).as('evoLoad')
    cy.intercept('PUT', '**/api/classes/c1/planning', (req) => {
      if (req.body?.details?.startsWith('evo:')) {
        req.reply({ statusCode:200, body:{ ok:true } })
      }
    }).as('evoSave')
    cy.visit('/avaliacoes/evolutivas')
    cy.get('select').first().select('Turma 1')
    cy.wait('@evoLoad')
    cy.get('textarea').clear().type('Evolução positiva notável')
    cy.contains('Salvar').click()
    cy.wait('@evoSave')
    cy.contains('Avaliação evolutiva salva')

    // 9. Exportações CSV (somente presença de botão & toast stub)
    cy.intercept('GET', '**/api/classes/c1', { statusCode:200, body:{ id:'c1', name:'Turma 1', code:'T1', year:2025, enrollments:[] } }).as('classDetail')
    cy.intercept('GET', '**/api/classes/c1/teachers', { statusCode:200, body:[] }).as('teachersList')
    cy.intercept('GET', '**/api/users', { statusCode:200, body:[] }).as('usersList')
    cy.intercept('GET', '**/api/reports/*.csv*', { statusCode:200, body:'id;valor' }).as('csvAny')
    cy.visit('/turmas')
    cy.wait('@classes')
    cy.get('[data-cy=turmas-class-select]').select('Turma 1')
    cy.wait('@classDetail')
    cy.get('[data-cy=csv-export]').first().click()
    cy.contains('Exportado com sucesso')

    // 10. Perfil
    cy.intercept('GET', '**/api/users/me', { statusCode:200, body:{ id:'u1', name:'Prof Teste', email:'prof@teste.com', role:'TEACHER' } }).as('profileLoad')
    cy.intercept('PUT', '**/api/users/me', { statusCode:200, body:{ id:'u1', name:'Prof Edit', email:'prof@teste.com', role:'TEACHER' } }).as('profileSave')
    cy.visit('/perfil')
    cy.wait('@profileLoad')
  cy.get('.profile-right-panel .input:enabled').first().clear().type('Prof Edit')
  cy.get('.profile-right-panel').contains('Salvar').click()
    cy.wait('@profileSave')
    // Assume toast present on save (existing spec already checks, included implicitly if wired)
  })
})
