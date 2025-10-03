// Attendance E2E (stubbed) - Diário, Observações, Históricos
// We stub API calls with cy.intercept to focus on frontend behavior

describe('Registro de Faltas - Diário', () => {
  beforeEach(() => {
    // Ensure ProtectedRoute passes by setting tokens
    cy.window().then((win) => {
      win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'test-access', refreshToken: 'test-refresh' }))
    })
    // Stub login auto state: intercept /users/me and allow access
    cy.intercept('GET', '**/api/users/me', {
      statusCode: 200,
      body: { id: 'u1', name: 'Teste', role: 'TEACHER' }
    }).as('me')

    // Classes list
    cy.intercept('GET', '**/api/classes', {
      statusCode: 200,
      body: [{ id: 'c1', name: 'Turma 1', code: 'T1', year: 2025 }]
    }).as('classes')

    // Attendance day create/list (GET)
    cy.intercept('GET', '**/api/classes/c1/attendance*', (req) => {
      const url = new URL(req.url)
      const date = url.searchParams.get('date') || '2025-09-19'
      req.reply({
        id: 'd1', date,
        class: { enrollments: [{ student: { id: 's1', name: 'Aluno 1' } }, { student: { id: 's2', name: 'Aluno 2' } }] },
        records: []
      })
    }).as('day')

    // Save PUT (array payload)
    cy.intercept('PUT', '**/api/attendance/days/d1/records', (req) => {
      expect(Array.isArray(req.body)).to.eq(true)
      // Should contain s1 and s2
      const body = req.body as any[]
      expect(body.some(x => x.studentId === 's1')).to.eq(true)
      expect(body.some(x => x.studentId === 's2')).to.eq(true)
      req.reply({ statusCode: 204, body: '' })
    }).as('saveRecords')
  })

  it('marca presenças/ausências e salva', () => {
    cy.visit('/faltas')
    cy.contains('Registro de faltas').should('be.visible')

    // Aba Diário já ativa por padrão
    cy.get('select').first().select('Turma 1') // turma
    cy.wait('@day')

    // Marcar s1 Ausente
    cy.get('tbody tr').eq(0).within(() => {
      cy.contains('label', 'Ausente').find('input[type="radio"]').check({ force: true })
    })

    cy.contains('Salvar').click()
    cy.wait('@saveRecords')
  })
})

describe('Registro de Faltas - Observações', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'test-access', refreshToken: 'test-refresh' }))
    })
    cy.intercept('GET', '**/api/users/me', { statusCode: 200, body: { id:'u1', name:'Teste', role:'TEACHER' } })
    cy.intercept('GET', '**/api/classes', { statusCode: 200, body: [{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] })
    cy.intercept('GET', '**/api/classes/c1/attendance*', {
      id: 'd1', date: '2025-09-19',
      class: { enrollments: [{ student: { id: 's1', name: 'Aluno 1' } }] },
      records: [{ studentId: 's1', status: 'PRESENT', observation: '' }]
    }).as('day')
    cy.intercept('PUT', '**/api/attendance/days/d1/records', (req) => {
      expect(Array.isArray(req.body)).to.eq(true)
      const body = req.body as any[]
      expect(body[0]).to.have.property('observation')
      req.reply({ statusCode: 204, body: '' })
    }).as('saveObs')
  })

  it('edita observações e salva', () => {
    cy.visit('/faltas')
    cy.contains('Observações').click()
    cy.get('select').first().select('Turma 1')
    cy.wait('@day')

    cy.get('tbody tr').eq(0).within(() => {
      cy.get('input').type('Chegou atrasado')
    })

    cy.contains('Salvar observações').click()
    cy.wait('@saveObs')
  })
})

describe('Registro de Faltas - Históricos', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'test-access', refreshToken: 'test-refresh' }))
    })
    cy.intercept('GET', '**/api/users/me', { statusCode: 200, body: { id:'u1', name:'Teste', role:'TEACHER' } })
    cy.intercept('GET', '**/api/classes', { statusCode: 200, body: [{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] })
    cy.intercept('GET', '**/api/classes/c1/attendance/history*', {
      statusCode: 200,
      body: [
        { id:'d1', date:'2025-09-01', records:[{ status:'PRESENT' }, { status:'ABSENT' }]},
        { id:'d2', date:'2025-09-02', records:[{ status:'PRESENT' }]},
      ]
    }).as('history')
  })

  it('busca históricos no período', () => {
    cy.visit('/faltas')
    cy.contains('Históricos').click()

    cy.get('select').first().select('Turma 1')
    cy.get('input[type="date"]').first().type('2025-09-01')
    cy.get('input[type="date"]').eq(1).type('2025-09-30')
    cy.contains('Buscar').click()

    cy.wait('@history')
    cy.contains('Presenças').should('exist')
    cy.get('tbody tr').should('have.length.at.least', 1)
  })
})
