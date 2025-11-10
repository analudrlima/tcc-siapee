// @ts-nocheck
// E2E - Vinculação de docentes em Turmas

describe('Turmas - Vincular e remover docente', () => {
  it('adiciona e remove um docente com disciplinas', () => {
    // Seed auth
    cy.window().then(win => {
      win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'x', refreshToken: 'y' }))
    })
    cy.intercept('GET', '**/api/users/me', { statusCode:200, body:{ id:'u1', name:'Prof', role:'TEACHER' } })

    // Classes list
    cy.intercept('GET', '**/api/classes', { statusCode:200, body:[{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] }).as('classes')

    // Class details with enrollments
    cy.intercept('GET', '**/api/classes/c1', { statusCode:200, body:{ id:'c1', name:'Turma 1', code:'T1', year:2025, enrollments:[] } }).as('classDetail')

    // Initial teachers empty
    cy.intercept('GET', '**/api/classes/c1/teachers', { statusCode:200, body:[] }).as('teachers1')

    // All users request
    cy.intercept('GET', '**/api/users', { statusCode:200, body:[{ id:'t1', name:'Docente A', email:'a@x.com', role:'TEACHER' }] }).as('users')

    cy.visit('/turmas')
    cy.wait('@classes')
    cy.get('[data-cy=turmas-class-select]').select('Turma 1')
    cy.wait('@classDetail')
    cy.wait('@teachers1')
    cy.wait('@users')

    // Assign teacher
    cy.get('[data-cy=turmas-teacher-select]').select('Docente A')
    cy.get('[data-cy=turmas-disciplines-input]').type('Artes, Matemática')
    cy.intercept('POST', '**/api/classes/c1/teachers', (req) => {
      expect(req.body.teacherId).to.eq('t1')
      expect(req.body.disciplines).to.deep.eq(['Artes','Matemática'])
      req.reply({ statusCode:201, body:{ id:'assign1' } })
    }).as('assign')
    // After assign, refresh teachers list
    cy.intercept('GET', '**/api/classes/c1/teachers', { statusCode:200, body:[{ id:'assign1', teacher:{ id:'t1', name:'Docente A', email:'a@x.com' }, disciplines:['Artes','Matemática'] }] }).as('teachers2')
    cy.get('[data-cy=turmas-assign-button]').click()
    cy.wait('@assign')
    cy.wait('@teachers2')
    cy.contains('Docente A').should('exist')

    // Remove teacher
  cy.intercept('DELETE', '**/api/classes/c1/teachers/t1', { statusCode:204, body:{} }).as('remove')
  cy.intercept('GET', '**/api/classes/c1/teachers', { statusCode:200, body:[] }).as('teachers3')
  cy.get('[data-cy=turmas-teacher-card] [data-cy=turmas-remove-button]').click()
  cy.wait('@remove')
  cy.wait('@teachers3')
  cy.get('[data-cy=turmas-teacher-card]').should('not.exist')
  })
})
