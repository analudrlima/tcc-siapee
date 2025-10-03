// @ts-nocheck
// Planning E2E (stubbed) - Anual e Semestral, com disciplina e semestre

function seedAuth() {
  cy.window().then((win) => {
    win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'test-access', refreshToken: 'test-refresh' }))
  })
  cy.intercept('GET', '**/api/users/me', { statusCode: 200, body: { id:'u1', name:'Teste', role:'TEACHER' } })
}

describe('Planejamento Anual', () => {
  beforeEach(() => {
    seedAuth()
    cy.intercept('GET', '**/api/classes', { statusCode:200, body:[{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] })
    cy.intercept('GET', '**/api/classes/c1/planning*', (req) => {
      const url = new URL(req.url)
      const discipline = url.searchParams.get('discipline') || 'Artes'
      req.reply({ id:'p1', classId:'c1', kind:'ANNUAL', discipline, content:'Conteúdo existente', lessonsPlanned: 12 })
    }).as('getAnnual')
    cy.intercept('PUT', '**/api/classes/c1/planning', (req) => {
      expect(req.body.kind).to.eq('ANNUAL')
      expect(req.body).to.have.property('discipline')
      req.reply({ statusCode:200, body: { id:'p1', ...req.body } })
    }).as('saveAnnual')
  })

  it('carrega, altera e salva planejamento anual por disciplina', () => {
    cy.visit('/planejamento')
    cy.contains('Planejamento').should('be.visible')
    cy.get('select').first().select('Turma 1')
    cy.wait('@getAnnual')
    cy.contains('Disciplina').parent().find('select').select('Português')
    cy.wait('@getAnnual')
    cy.get('textarea').clear().type('Novo conteúdo anual')
    cy.contains('Salvar').click()
    cy.wait('@saveAnnual')
  })
})

describe('Planejamento Semestral', () => {
  beforeEach(() => {
    seedAuth()
    cy.intercept('GET', '**/api/classes', { statusCode:200, body:[{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] })
    cy.intercept('GET', '**/api/classes/c1/planning*', (req) => {
      const url = new URL(req.url)
      const sem = url.searchParams.get('details') || '1'
      const discipline = url.searchParams.get('discipline') || 'Artes'
      req.reply({ id:'p2', classId:'c1', kind:'SEMESTER', details: sem, discipline, content:`Conteúdo ${sem}` })
    }).as('getSem')
    cy.intercept('PUT', '**/api/classes/c1/planning', (req) => {
      expect(req.body.kind).to.eq('SEMESTER')
      expect(req.body).to.have.property('details')
      expect(req.body).to.have.property('discipline')
      req.reply({ statusCode:200, body: { id:'p2', ...req.body } })
    }).as('saveSem')
  })

  it('altera semestre e disciplina e salva', () => {
    cy.visit('/planejamento')
    cy.contains('Semestral').click()
    cy.get('select').first().select('Turma 1')
    cy.wait('@getSem')
    cy.contains('Disciplina').parent().find('select').select('Matemática')
    cy.wait('@getSem')
    cy.contains('Semestre').parent().find('select').select('2º semestre')
    cy.wait('@getSem')
    cy.get('textarea').clear().type('Planejamento do 2º semestre')
    cy.contains('Salvar').click()
    cy.wait('@saveSem')
  })
})
