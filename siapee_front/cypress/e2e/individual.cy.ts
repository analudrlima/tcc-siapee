// @ts-nocheck
// E2E - Planejamento Individual

describe('Planejamento Individual', () => {
  it('seleciona turma/aluno e salva texto', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'a', refreshToken: 'b' }))
    })
    cy.intercept('GET', '**/api/users/me', { statusCode: 200, body: { id:'t', name:'Prof', role:'TEACHER' } }).as('me')
    cy.intercept('GET', '**/api/classes', { statusCode:200, body:[{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] }).as('classes')
    cy.intercept('GET', '**/api/classes/c1', { statusCode:200, body:{ id:'c1', enrollments:[{ student:{ id:'s1', name:'Ana' } }, { student:{ id:'s2', name:'Bruno' } }] } }).as('class')
    cy.intercept('GET', '**/api/classes/c1/planning*', { statusCode:200, body:null }).as('loadPlan')
    cy.intercept('PUT', '**/api/classes/c1/planning', (req) => {
      expect(req.body).to.have.property('kind','INDIVIDUAL')
      expect(req.body.details).to.eq('s1')
      expect(req.body).to.have.property('content')
      req.reply({ statusCode:200, body:{ id:'p1' } })
    }).as('savePlan')

    cy.visit('/planejamento/individual')
    cy.wait('@me')
    cy.get('select').first().select('Turma 1')
    cy.wait('@class')
    cy.wait('@loadPlan')
    cy.get('textarea').type('Plano individual do aluno Ana')
    cy.contains('Salvar').click()
    cy.wait('@savePlan')
  })
})
