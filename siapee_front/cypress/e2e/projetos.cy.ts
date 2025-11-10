// @ts-nocheck
// E2E - Projetos (usa a mesma UI de Atividades por matéria)

describe('Projetos', () => {
  it('lista, cria e exclui projeto (reuso de atividades)', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'a', refreshToken: 'b' }))
    })
    cy.intercept('GET', '**/api/users/me', { statusCode:200, body:{ id:'t', name:'Prof', role:'TEACHER' } }).as('me')
    cy.intercept('GET', '**/api/classes', { statusCode:200, body:[{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] }).as('classes')
  cy.intercept('GET', '**/api/classes/c1/projects*', { statusCode:200, body:[{ id:'p1', title:'Projeto 1', status:'PLANNING' }] }).as('list')
    cy.intercept('POST', '**/api/classes/c1/projects', (req) => {
      expect(req.body.title).to.eq('Projeto Novo')
      req.reply({ statusCode:201, body:{ id:'p2', title:'Projeto Novo', status:'PLANNING' } })
    }).as('create')
  cy.intercept('DELETE', '**/api/projects/p2', { statusCode:204, body:{} }).as('delete')

    cy.visit('/projetos/materia')
    cy.wait('@me')
  cy.wait('@classes')
  cy.get('select').first().select('Turma 1')
  cy.wait('@list')
  // After initial list returned, register the next list to include the new item
  cy.intercept('GET', '**/api/classes/c1/projects*', { statusCode:200, body:[{ id:'p1', title:'Projeto 1', status:'PLANNING' }, { id:'p2', title:'Projeto Novo', status:'PLANNING' }] }).as('list2')
    cy.get('[data-cy=project-title]').type('Projeto Novo')
    cy.get('[data-cy=project-add]').click()
  cy.wait('@create')
  cy.wait('@list2')
  cy.contains('Projeto Novo').should('exist')
    cy.contains('Projeto Novo').parents('tr').within(() => {
      cy.contains('Excluir').click()
    })
    cy.wait('@delete')
  })
})
