/**
 * Script manual para probar el sistema de drivers con Playwright
 */

const { chromium } = require('playwright')

async function testDriverSystem() {
  console.log('🚚 Iniciando prueba manual del sistema de drivers...')

  // Lanzar navegador
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000, // Ralentizar para ver las acciones
  })

  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // Tamaño móvil
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
  })

  const page = await context.newPage()

  try {
    console.log('📱 Navegando a la página de login de drivers...')
    await page.goto('http://localhost:3000/driver/login')

    console.log('⏳ Esperando que cargue la página...')
    await page.waitForTimeout(3000)

    console.log('📸 Tomando screenshot de la página de login...')
    await page.screenshot({ path: 'driver-login-test.png', fullPage: true })

    console.log('🔍 Verificando elementos de la página...')

    // Verificar que existe el formulario de login
    const loginForm = await page.locator('form').first()
    if (await loginForm.isVisible()) {
      console.log('✅ Formulario de login encontrado')
    } else {
      console.log('❌ Formulario de login no encontrado')
    }

    // Verificar campo de email
    const emailInput = await page.locator('input[type="email"]').first()
    if (await emailInput.isVisible()) {
      console.log('✅ Campo de email encontrado')

      console.log('📝 Llenando email de prueba...')
      await emailInput.fill('carlos@pinteya.com')

      console.log('📸 Screenshot después de llenar email...')
      await page.screenshot({ path: 'driver-login-filled.png', fullPage: true })
    } else {
      console.log('❌ Campo de email no encontrado')
    }

    // Verificar botón de submit
    const submitButton = await page.locator('button[type="submit"]').first()
    if (await submitButton.isVisible()) {
      console.log('✅ Botón de submit encontrado')
    } else {
      console.log('❌ Botón de submit no encontrado')
    }

    console.log('🔗 Probando navegación a otras páginas...')

    // Probar acceso directo al dashboard (debería redirigir)
    await page.goto('http://localhost:3000/driver/dashboard')
    await page.waitForTimeout(2000)

    console.log('📸 Screenshot del dashboard (o redirección)...')
    await page.screenshot({ path: 'driver-dashboard-test.png', fullPage: true })

    // Probar página principal
    console.log('🏠 Navegando a página principal...')
    await page.goto('http://localhost:3000')
    await page.waitForTimeout(2000)

    console.log('📸 Screenshot de página principal...')
    await page.screenshot({ path: 'homepage-test.png', fullPage: true })

    console.log('✅ Prueba manual completada exitosamente!')
    console.log('📁 Screenshots guardados:')
    console.log('   - driver-login-test.png')
    console.log('   - driver-login-filled.png')
    console.log('   - driver-dashboard-test.png')
    console.log('   - homepage-test.png')
  } catch (error) {
    console.error('❌ Error durante la prueba:', error.message)

    // Tomar screenshot del error
    await page.screenshot({ path: 'driver-test-error.png', fullPage: true })
    console.log('📸 Screenshot del error guardado: driver-test-error.png')
  }

  console.log('⏳ Manteniendo navegador abierto por 30 segundos para inspección manual...')
  await page.waitForTimeout(30000)

  await browser.close()
  console.log('🔚 Navegador cerrado. Prueba finalizada.')
}

// Ejecutar la prueba
testDriverSystem().catch(console.error)
