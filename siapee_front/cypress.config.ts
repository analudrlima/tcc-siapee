import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
  // Base URL aligned with default Vite dev server port
  baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    video: false,
  },
})
