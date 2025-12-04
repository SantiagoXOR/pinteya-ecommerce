#!/usr/bin/env node

/**
 * Script para configurar testing de accesibilidad automatizado
 * Configura axe-core con Storybook para testing a11y
 */

const fs = require('fs')
const path = require('path')

console.log('🔧 Configurando testing de accesibilidad automatizado...\n')

// 1. Verificar que axe-core esté instalado
const packageJsonPath = path.join(process.cwd(), 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

const requiredDeps = ['@storybook/addon-a11y', '@axe-core/playwright', 'axe-core']

const missingDeps = requiredDeps.filter(
  dep => !packageJson.devDependencies?.[dep] && !packageJson.dependencies?.[dep]
)

if (missingDeps.length > 0) {
  console.log('❌ Dependencias faltantes para testing de accesibilidad:')
  missingDeps.forEach(dep => console.log(`   - ${dep}`))
  console.log('\n💡 Instala las dependencias con:')
  console.log(`   npm install --save-dev ${missingDeps.join(' ')}\n`)
  process.exit(1)
}

// 2. Verificar configuración de Storybook
const storybookMainPath = path.join(process.cwd(), '.storybook', 'main.ts')
if (fs.existsSync(storybookMainPath)) {
  const storybookMain = fs.readFileSync(storybookMainPath, 'utf8')

  if (!storybookMain.includes('@storybook/addon-a11y')) {
    console.log('⚠️  El addon de accesibilidad no está configurado en Storybook')
    console.log('💡 Agrega "@storybook/addon-a11y" a los addons en .storybook/main.ts\n')
  } else {
    console.log('✅ Addon de accesibilidad configurado en Storybook')
  }
}

// 3. Crear configuración de testing a11y para Playwright
const a11yTestConfig = `// Configuración de testing de accesibilidad con Playwright
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Inyectar axe-core en cada página
    await injectAxe(page);
  });

  test('Homepage accessibility', async ({ page }) => {
    await page.goto('/');
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('Shop page accessibility', async ({ page }) => {
    await page.goto('/shop');
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('Product detail accessibility', async ({ page }) => {
    await page.goto('/products/1');
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('Checkout accessibility', async ({ page }) => {
    // Simular carrito con productos
    await page.goto('/');
    await page.click('[data-testid="add-to-cart"]');
    await page.goto('/checkout');
    
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });
});
`

const a11yTestPath = path.join(process.cwd(), 'tests', 'accessibility.spec.ts')
const testsDir = path.dirname(a11yTestPath)

if (!fs.existsSync(testsDir)) {
  fs.mkdirSync(testsDir, { recursive: true })
}

fs.writeFileSync(a11yTestPath, a11yTestConfig)
console.log('✅ Configuración de testing a11y creada en tests/accessibility.spec.ts')

// 4. Crear configuración de axe para Storybook
const axeStorybookConfig = `// Configuración de axe-core para Storybook
export const parameters = {
  a11y: {
    // Configuración global de axe
    config: {
      rules: [
        {
          // Deshabilitar reglas específicas si es necesario
          id: 'color-contrast',
          enabled: true,
        },
        {
          id: 'landmark-one-main',
          enabled: true,
        },
      ],
    },
    // Opciones de axe
    options: {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      },
    },
    // Elementos a ignorar
    disable: [],
    // Manual para revisar manualmente
    manual: true,
  },
};
`

const storybookPreviewPath = path.join(process.cwd(), '.storybook', 'preview.ts')
if (fs.existsSync(storybookPreviewPath)) {
  const previewContent = fs.readFileSync(storybookPreviewPath, 'utf8')

  if (!previewContent.includes('a11y:')) {
    console.log('⚠️  Configuración de a11y no encontrada en .storybook/preview.ts')
    console.log('💡 Agrega la configuración de axe manualmente\n')
  } else {
    console.log('✅ Configuración de a11y encontrada en Storybook')
  }
}

// 5. Crear script de testing a11y
const a11yScript = `#!/usr/bin/env node

/**
 * Script para ejecutar tests de accesibilidad
 */

const { execSync } = require('child_process');

console.log('🔍 Ejecutando tests de accesibilidad...');

try {
  // Tests de accesibilidad con Playwright
  console.log('\\n📋 Tests de accesibilidad en páginas principales...');
  execSync('npx playwright test tests/accessibility.spec.ts', { stdio: 'inherit' });
  
  // Tests de accesibilidad en Storybook
  console.log('\\n📚 Tests de accesibilidad en componentes (Storybook)...');
  execSync('npm run storybook:test -- --a11y', { stdio: 'inherit' });
  
  console.log('\\n✅ Todos los tests de accesibilidad completados');
  
} catch (error) {
  console.error('\\n❌ Error en tests de accesibilidad:', error.message);
  process.exit(1);
}
`

const a11yScriptPath = path.join(process.cwd(), 'scripts', 'run-a11y-tests.js')
fs.writeFileSync(a11yScriptPath, a11yScript)
fs.chmodSync(a11yScriptPath, '755')
console.log('✅ Script de testing a11y creado en scripts/run-a11y-tests.js')

// 6. Actualizar package.json con nuevos scripts
const newScripts = {
  'test:a11y': 'node scripts/run-a11y-tests.js',
  'test:a11y:pages': 'playwright test tests/accessibility.spec.ts',
  'test:a11y:components': 'test-storybook --url=http://localhost:6006 --a11y',
}

let packageJsonUpdated = false
Object.entries(newScripts).forEach(([script, command]) => {
  if (!packageJson.scripts[script]) {
    packageJson.scripts[script] = command
    packageJsonUpdated = true
  }
})

if (packageJsonUpdated) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
  console.log('✅ Scripts de testing a11y agregados a package.json')
}

console.log('\n🎉 Configuración de testing de accesibilidad completada!')
console.log('\n📋 Comandos disponibles:')
console.log('   npm run test:a11y           - Ejecutar todos los tests a11y')
console.log('   npm run test:a11y:pages     - Tests a11y en páginas')
console.log('   npm run test:a11y:components - Tests a11y en componentes')
console.log('\n💡 Recuerda configurar el addon @storybook/addon-a11y en Storybook')
