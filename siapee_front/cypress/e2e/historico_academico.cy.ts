// @ts-nocheck
// E2E (stubbed) - Histórico Acadêmico

function seedAuth() {
  cy.window().then((win) => {
    win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'test-access', refreshToken: 'test-refresh' }))
  })
  cy.intercept('GET', '**/api/users/me', { statusCode: 200, body: { id:'u1', name:'Teste', role:'TEACHER' } })
}

describe('Histórico Acadêmico', () => {
  beforeEach(() => {
    seedAuth()
    cy.intercept('GET', '**/api/classes', { statusCode:200, body:[{ id:'c1', name:'Turma 1', code:'T1', year:2025 }] })
    cy.intercept('GET', '**/api/difficulties', { statusCode:200, body:[] })
  })

  it('exibe histórico unificado de atividades, projetos e avaliações', () => {
    // Mocks para os dados
    const mockActivities = [
      { id: 'a1', title: 'Atividade 1', description: 'Desc A1', createdAt: '2025-03-10T10:00:00Z', discipline: 'Matemática', maxScore: 10 }
    ]
    const mockProjects = [
      { id: 'p1', title: 'Projeto 1', description: 'Desc P1', createdAt: '2025-04-15T10:00:00Z', type: 'SUBJECT' }
    ]
    const mockEvaluations = [
      { id: 'e1', title: 'Avaliação 1', content: 'Desc E1', date: '2025-05-20', discipline: 'Avaliação' }
    ]

    cy.intercept('GET', '**/api/classes/c1/activities*', { statusCode: 200, body: mockActivities }).as('getActivities')
    cy.intercept('GET', '**/api/classes/c1/projects*', { statusCode: 200, body: mockProjects }).as('getProjects')
    cy.intercept('GET', '**/api/classes/c1/plannings*', { statusCode: 200, body: mockEvaluations }).as('getEvaluations')

    // Navegar para a aba de histórico (via Atividades)
    cy.visit('/atividades')
    cy.contains('button', 'Histórico').click()

    // Selecionar turma
    cy.get('select').first().select('Turma 1')

    // Aguardar chamadas
    cy.wait('@getActivities')
    // O componente carrega todos os tipos se o filtro for 'todos' ou carrega sob demanda?
    // No código atual: loadHistorico carrega tudo se typeFilter for 'todos' (que é o padrão se type não for passado, mas aqui type="atividades")
    // Espera, no App.tsx: <HistoricoAcademico type="atividades" embed />
    // Então typeFilter inicial é 'atividades'.
    // Ele só chama getActivities inicialmente.

    // Verificar se Atividade aparece
    cy.contains('Atividade 1').scrollIntoView().should('be.visible')
    cy.contains('Desc A1').should('be.visible')

    // Mudar filtro para 'Todos' para ver o resto
    cy.get('select').eq(1).select('Todos')
    cy.wait('@getProjects')
    cy.wait('@getEvaluations')

    // Verificar Projeto
    cy.contains('Projeto 1').scrollIntoView().should('be.visible')
    cy.contains('Desc P1').should('be.visible')

    // Verificar Avaliação
    cy.contains('Avaliação 1').scrollIntoView().should('be.visible')
    cy.contains('Desc E1').should('be.visible')
  })

  it('filtra por período', () => {
    const mockActivities = [
      { id: 'a1', title: 'Atividade Março', createdAt: '2025-03-15T10:00:00Z', type: 'atividade' },
      { id: 'a2', title: 'Atividade Abril', createdAt: '2025-04-15T10:00:00Z', type: 'atividade' },
      { id: 'a3', title: 'Atividade Maio', createdAt: '2025-05-15T10:00:00Z', type: 'atividade' }
    ]

    cy.intercept('GET', '**/api/classes/c1/activities*', { statusCode: 200, body: mockActivities }).as('getActivities')

    cy.visit('/atividades')
    cy.contains('button', 'Histórico').click()
    cy.get('select').first().select('Turma 1')
    cy.wait('@getActivities')

    // Verificar que todos aparecem inicialmente
    cy.contains('Atividade Março').scrollIntoView().should('be.visible')
    cy.contains('Atividade Abril').should('be.visible')
    cy.contains('Atividade Maio').should('be.visible')

    // Aplicar filtro: Abril a Maio
    // Inputs de mês são type="month", formato YYYY-MM
    cy.get('input[type="month"]').eq(0).type('2025-04') // Início
    cy.get('input[type="month"]').eq(1).type('2025-05') // Fim
    cy.contains('button', 'Buscar').click()

    // Verificar filtragem
    cy.contains('Atividade Março').should('not.exist')
    cy.contains('Atividade Abril').scrollIntoView().should('be.visible')
    cy.contains('Atividade Maio').should('be.visible')
  })
})
