// @ts-nocheck
// E2E - Avaliações (Desenvolvimento/Evolutivas)

describe('Avaliações', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'a', refreshToken: 'b' }))
    })
    cy.intercept('GET', '**/api/users/me', { statusCode: 200, body: { id:'t', name:'Prof', role:'TEACHER' } }).as('me')
    cy.intercept('GET', '**/api/classes', { statusCode:200, body:[{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] }).as('classes')
    cy.intercept('GET', '**/api/classes/c1', { statusCode:200, body:{ id:'c1', enrollments:[{ student:{ id:'s1', name:'Ana' } }] } }).as('class')
  })

  it('Desenvolvimento: salva texto', () => {
    cy.intercept('GET', '**/api/classes/c1/planning*', { statusCode:200, body:null }).as('loadDev')
    cy.intercept('PUT', '**/api/classes/c1/planning', (req) => {
      expect(req.body.kind).to.eq('INDIVIDUAL')
      expect(req.body.details).to.eq('dev:s1')
      req.reply({ statusCode:200, body:{ id:'p-dev' } })
    }).as('saveDev')

    cy.visit('/avaliacoes/desenvolvimento')
    cy.wait('@me')
    cy.get('select').first().select('Turma 1')
    cy.wait('@class')
    cy.wait('@loadDev')
    cy.get('textarea').type('Texto de desenvolvimento')
    cy.contains('Salvar').click()
    cy.wait('@saveDev')
  })

  it('Evolutivas: salva texto', () => {
    cy.intercept('GET', '**/api/classes/c1/planning*', { statusCode:200, body:null }).as('loadEvo')
    cy.intercept('PUT', '**/api/classes/c1/planning', (req) => {
      expect(req.body.kind).to.eq('INDIVIDUAL')
      expect(req.body.details).to.eq('evo:s1')
      req.reply({ statusCode:200, body:{ id:'p-evo' } })
    }).as('saveEvo')

    cy.visit('/avaliacoes/evolutivas')
    cy.wait('@me')
    cy.get('select').first().select('Turma 1')
    cy.wait('@class')
    cy.wait('@loadEvo')
    cy.get('textarea').type('Texto evolutivo')
    cy.contains('Salvar').click()
    cy.wait('@saveEvo')
  })
})
