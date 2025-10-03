// @ts-nocheck
// E2E (stubbed) - Perfil: carregar e salvar

function seedAuth() {
  cy.window().then((win) => {
    win.localStorage.setItem('siapee_tokens', JSON.stringify({ accessToken: 'test-access', refreshToken: 'test-refresh' }))
  })
  cy.intercept('GET', '**/api/users/me', { statusCode: 200, body: { id:'u1', name:'Ana', email:'ana@x.com', phone:'123', role:'TEACHER' } })
}

describe('Perfil', () => {
  it('carrega dados e salva alterações', () => {
    seedAuth()
    cy.intercept('PUT', '**/api/users/me', (req) => {
      expect(req.body).to.have.property('name', 'Ana Paula')
      expect(req.body).to.have.property('email', 'ana.paula@x.com')
      expect(req.body).to.have.property('phone', '(11) 1111-1111')
      req.reply({ statusCode:200, body: { ...req.body, id:'u1', role:'TEACHER' } })
    }).as('saveProfile')

    cy.visit('/perfil')
    // Campos: Nome, E-mail, Telefone (cada um em .input-edit-row)
  cy.contains('label', 'Nome de Usuário:').next('.input-edit-row').find('input').first().clear().type('Ana Paula')
  cy.contains('label', 'E-mail:').next('.input-edit-row').find('input').first().clear().type('ana.paula@x.com')
  cy.contains('label', 'Telefone:').next('.input-edit-row').find('input').first().clear().type('(11) 1111-1111')
    cy.contains('Salvar').click()
    cy.wait('@saveProfile')
  })
})
