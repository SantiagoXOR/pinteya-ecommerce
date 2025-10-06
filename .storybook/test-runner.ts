import type { TestRunnerConfig } from '@storybook/test-runner'
import { injectAxe, checkA11y, configureAxe } from 'axe-playwright'

const config: TestRunnerConfig = {
  setup() {
    // Configuración global antes de ejecutar tests
  },

  async preVisit(page) {
    // Inyectar axe-core para tests de accesibilidad
    await injectAxe(page)
  },

  async postVisit(page) {
    // Configurar axe para tests de accesibilidad
    await configureAxe(page, {
      rules: [
        // Reglas específicas para e-commerce
        { id: 'color-contrast', enabled: true },
        { id: 'focus-order-semantics', enabled: true },
        { id: 'keyboard-navigation', enabled: true },
        { id: 'aria-labels', enabled: true },
      ],
    })

    // Ejecutar tests de accesibilidad
    await checkA11y(page, '#storybook-root', {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    })
  },
}

export default config
