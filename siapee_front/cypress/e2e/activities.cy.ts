// @ts-nocheck
// E2E (stubbed) - Atividades por matéria: listar, criar, excluir

function seedAuth() {
  cy.window().then((win) => {
    win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'test-access', refreshToken: 'test-refresh' }))
  })
  cy.intercept('GET', '**/api/users/me', { statusCode: 200, body: { id:'u1', name:'Teste', role:'TEACHER' } })
}

describe('Atividades por matéria', () => {
  beforeEach(() => {
    seedAuth()
    cy.intercept('GET', '**/api/classes', { statusCode:200, body:[{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] })
  })

    it('lista, cria e exclui atividade', () => {
    // Lista inicial vazia
    cy.intercept('GET', '**/api/classes/c1/activities*', { statusCode:200, body: [] }).as('list1')

    cy.visit('/atividades/materia')
    cy.get('select').first().select('Turma 1')
    cy.wait('@list1')

    // Preparar criação
    cy.intercept('POST', '**/api/classes/c1/activities', (req) => {
      expect(req.body).to.have.property('title', 'Prova 1')
      expect(req.body).to.have.property('description', 'Cap 1')
      expect(req.body).to.have.property('maxScore')
      expect(req.body.maxScore).to.be.a('number')
      req.reply({ statusCode:201, body:{ id:'a1', classId:'c1', title:'Prova 1', dueDate: null, maxScore: 10 } })
    }).as('createAct')
  cy.intercept('GET', '**/api/classes/c1/activities*', { statusCode:200, body: [{ id:'a1', title:'Prova 1', dueDate:null, maxScore:10 }] }).as('list2')

      cy.get('[data-cy=activity-title]').type('Prova 1')
      cy.get('[data-cy=activity-description]').type('Cap 1')
      cy.get('[data-cy=activity-due]').clear() // optional date
      cy.get('[data-cy=activity-max]').clear().type('10')
      cy.get('[data-cy=activity-add]').click()
    cy.wait('@createAct')
    cy.wait('@list2')

    // Excluir
    cy.intercept('DELETE', '**/api/activities/a1', { statusCode:204, body: '' }).as('deleteAct')
  cy.intercept('GET', '**/api/classes/c1/activities*', { statusCode:200, body: [] }).as('list3')
      cy.get('[data-cy=activity-delete]').click()
    cy.wait('@deleteAct')
    cy.wait('@list3')
  })
})
