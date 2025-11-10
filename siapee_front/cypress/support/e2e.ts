// Global Cypress support file
// Adds common intercepts to stabilize tests (avoid unexpected 401 refresh flow)

beforeEach(() => {
	// Stub refresh token endpoint so AuthContext retry doesn't yield 401
	cy.intercept('POST', '**/api/auth/refresh', {
		statusCode: 200,
		body: { accessToken: 'refreshed-token' }
	}).as('refresh')
})

// Optionally silence unexpected 401 errors we explicitly handle via intercepts
Cypress.on('uncaught:exception', (err) => {
	if (/Request failed with status code 401/.test(err.message)) {
		// returning false prevents Cypress from failing the test
		return false
	}
})
