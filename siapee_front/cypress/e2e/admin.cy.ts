// @ts-nocheck
// E2E (stubbed) - Admin Solicitações: listar e aprovar

function seedAdmin() {
  cy.window().then((win) => {
    win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'test-access', refreshToken: 'test-refresh' }))
  })
  cy.intercept('GET', '**/api/users/me', { statusCode: 200, body: { id:'admin', name:'Admin', role:'ADMIN' } }).as('me')
}

describe('Admin - Solicitações de cadastro', () => {
  it('lista solicitações e aprova uma', () => {
  seedAdmin()
  // Intercept BEFORE visiting to catch initial load
  let approved = false
  cy.intercept('GET', '**/signup/requests*', (req) => {
    const body = [{ id:'sr1', name:'Prof A', email:'a@x.com', roleRequested:'TEACHER', status: approved ? 'APPROVED' : 'PENDING' }]
    req.reply({ statusCode: 200, body })
  }).as('list')
  cy.intercept('POST', '**/signup/requests/sr1/decide', (req) => {
    expect(req.body).to.have.property('approved', true)
    approved = true
    req.reply({ statusCode:200, body: { id:'sr1', status:'APPROVED' } })
  }).as('approveReq')

  cy.visit('/admin/solicitacoes')
  cy.wait('@me')
  cy.wait('@list')
  cy.contains('Aprovar').should('be.visible').click()
    cy.wait('@approveReq')
    cy.wait('@list')
    cy.contains('APPROVED').should('exist')
  })
})
