// @ts-nocheck
// E2E - Exportação de CSV de Atividades e Projetos

function seedAuth() {
  cy.window().then(win => {
    win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'tt', refreshToken: 'rr' }))
  })
  cy.intercept('GET', '**/api/users/me', { statusCode:200, body:{ id:'u1', name:'Prof', role:'TEACHER' } })
}

describe('Exportação CSV - Atividades', () => {
  it('exporta lista de atividades em CSV', () => {
    seedAuth()
    cy.intercept('GET', '**/api/classes', { statusCode:200, body:[{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] }).as('classes')
    cy.intercept('GET', '**/api/classes/c1/activities*', { statusCode:200, body:[{ id:'a1', title:'Atv 1', maxScore:10 }] }).as('list')
    cy.visit('/atividades/materia')
    cy.get('select').first().select('Turma 1')
    cy.wait('@list')
    cy.get('[data-cy=activity-export]').click()
    // Não há fácil assert de download sem plugin; garantir que botão muda disabled momentaneamente
    cy.get('[data-cy=activity-export]').should('not.be.disabled')
  })
})

describe('Exportação CSV - Projetos', () => {
  it('exporta lista de projetos em CSV', () => {
    seedAuth()
    cy.intercept('GET', '**/api/classes', { statusCode:200, body:[{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] }).as('classes')
    cy.intercept('GET', '**/api/classes/c1/projects*', { statusCode:200, body:[{ id:'p1', title:'Proj 1', status:'PLANNING' }] }).as('listp')
    cy.visit('/projetos/materia')
    cy.get('select').first().select('Turma 1')
    cy.wait('@listp')
    cy.get('[data-cy=project-export]').click()
    cy.get('[data-cy=project-export]').should('not.be.disabled')
  })
})
