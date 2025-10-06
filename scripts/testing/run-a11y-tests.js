#!/usr/bin/env node

/**
 * Script para ejecutar tests de accesibilidad
 */

const { execSync } = require('child_process')

console.log('🔍 Ejecutando tests de accesibilidad...')

try {
  // Tests de accesibilidad con Playwright
  console.log('\n📋 Tests de accesibilidad en páginas principales...')
  execSync('npx playwright test tests/accessibility.spec.ts', { stdio: 'inherit' })

  // Tests de accesibilidad en Storybook
  console.log('\n📚 Tests de accesibilidad en componentes (Storybook)...')
  execSync('npm run storybook:test -- --a11y', { stdio: 'inherit' })

  console.log('\n✅ Todos los tests de accesibilidad completados')
} catch (error) {
  console.error('\n❌ Error en tests de accesibilidad:', error.message)
  process.exit(1)
}
