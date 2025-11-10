// @ts-nocheck
// E2E - Atividades Multidisciplinares (reutiliza a tela de atividades)

describe('Atividades Multidisciplinares', () => {
  it('lista e cria atividade', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'a', refreshToken: 'b' }))
    })
    cy.intercept('GET', '**/api/users/me', { statusCode:200, body:{ id:'t', name:'Prof', role:'TEACHER' } }).as('me')
    cy.intercept('GET', '**/api/classes', { statusCode:200, body:[{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] }).as('classes')
  cy.intercept('GET', '**/api/classes/c1/activities*', { statusCode:200, body:[] }).as('list')
    cy.intercept('POST', '**/api/classes/c1/activities', (req) => {
      expect(req.body.title).to.eq('Atv Multi')
      req.reply({ statusCode:201, body:{ id:'m1', title:'Atv Multi', maxScore: 10 } })
    }).as('create')
  // Register the post-create list after initial list returns

    cy.visit('/atividades/multidisciplinares')
    cy.wait('@me')
  cy.wait('@classes')
  cy.get('select').first().select('Turma 1')
  cy.wait('@list')
  cy.intercept('GET', '**/api/classes/c1/activities*', { statusCode:200, body:[{ id:'m1', title:'Atv Multi', maxScore: 10 }] }).as('list2')
    cy.get('[data-cy=activity-title]').type('Atv Multi')
  cy.get('[data-cy=activity-add]').click()
  cy.wait('@create')
  cy.wait('@list2')
  cy.contains('Atv Multi').should('exist')
  })
})
