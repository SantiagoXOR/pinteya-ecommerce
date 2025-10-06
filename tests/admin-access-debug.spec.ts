import { test, expect } from '@playwright/test'

/**
 * Test específico para diagnosticar problemas de acceso al admin
 * Simula el flujo completo de autenticación y acceso
 */

test.describe('Admin Access Debug', () => {
  test('Diagnosticar acceso al panel admin', async ({ page }) => {
    console.log('🔍 INICIANDO DIAGNÓSTICO DE ACCESO ADMIN')

    // Configurar timeouts más largos
    page.setDefaultTimeout(15000)

    try {
      // 1. NAVEGAR A LA HOMEPAGE
      console.log('📍 Paso 1: Navegando a homepage...')
      await page.goto('https://pinteya.com')
      await page.waitForLoadState('networkidle')

      // Tomar screenshot del estado inicial
      await page.screenshot({ path: 'debug-screenshots/01-homepage.png', fullPage: true })
      console.log('✅ Homepage cargada')

      // 2. VERIFICAR ESTADO DE AUTENTICACIÓN
      console.log('📍 Paso 2: Verificando estado de autenticación...')

      // Buscar botones de login/logout
      const loginButton = page.locator(
        'button:has-text("Iniciar"), a:has-text("Iniciar"), [data-testid="login"], .sign-in'
      )
      const userButton = page.locator(
        'button:has-text("Usuario"), .user-button, [data-testid="user-button"]'
      )

      const isLoggedIn = (await userButton.count()) > 0
      const hasLoginButton = (await loginButton.count()) > 0

      console.log(`🔐 Estado de autenticación: ${isLoggedIn ? 'Logueado' : 'No logueado'}`)
      console.log(`🔑 Botón de login visible: ${hasLoginButton}`)

      // 3. INTENTAR ACCESO DIRECTO AL ADMIN
      console.log('📍 Paso 3: Intentando acceso directo a /admin...')

      const adminResponse = await page.goto('https://pinteya.com/admin')
      console.log(`📊 Status de respuesta /admin: ${adminResponse?.status()}`)

      await page.waitForTimeout(3000)
      await page.screenshot({ path: 'debug-screenshots/02-admin-attempt.png', fullPage: true })

      const currentUrl = page.url()
      console.log(`🌐 URL actual después de navegar a /admin: ${currentUrl}`)

      // Verificar si fue redirigido
      if (currentUrl.includes('/admin')) {
        console.log('✅ Acceso al admin exitoso')
      } else if (currentUrl.includes('/sign-in') || currentUrl.includes('/login')) {
        console.log('🔄 Redirigido a login - necesita autenticación')
      } else {
        console.log('❌ Redirigido a otra página - acceso denegado')
      }

      // 4. PROBAR APIS DIRECTAMENTE
      console.log('📍 Paso 4: Probando APIs directamente...')

      // API de debug
      try {
        const debugResponse = await page.request.get('https://pinteya.com/api/debug-clerk-session')
        console.log(`🔍 Debug API status: ${debugResponse.status()}`)

        if (debugResponse.ok()) {
          const debugData = await debugResponse.json()
          console.log('🔍 Debug data:', JSON.stringify(debugData, null, 2))
        }
      } catch (error) {
        console.log('❌ Error en debug API:', error.message)
      }

      // API de admin
      try {
        const adminApiResponse = await page.request.get(
          'https://pinteya.com/api/admin/products/stats'
        )
        console.log(`🔒 Admin API status: ${adminApiResponse.status()}`)

        if (adminApiResponse.ok()) {
          const adminData = await adminApiResponse.json()
          console.log('📊 Admin API data:', JSON.stringify(adminData, null, 2))
        } else {
          const errorText = await adminApiResponse.text()
          console.log('❌ Admin API error:', errorText)
        }
      } catch (error) {
        console.log('❌ Error en admin API:', error.message)
      }

      // 5. VERIFICAR COOKIES Y STORAGE
      console.log('📍 Paso 5: Verificando cookies y storage...')

      const cookies = await page.context().cookies()
      const clerkCookies = cookies.filter(
        cookie =>
          cookie.name.includes('clerk') ||
          cookie.name.includes('session') ||
          cookie.name.includes('__session')
      )

      console.log(`🍪 Cookies de Clerk encontradas: ${clerkCookies.length}`)
      clerkCookies.forEach(cookie => {
        console.log(`   - ${cookie.name}: ${cookie.value.substring(0, 20)}...`)
      })

      // 6. VERIFICAR ELEMENTOS DE LA PÁGINA
      console.log('📍 Paso 6: Verificando elementos de la página...')

      const pageTitle = await page.title()
      console.log(`📄 Título de la página: ${pageTitle}`)

      // Buscar mensajes de error
      const errorMessages = await page
        .locator('.error, .alert-error, [role="alert"]')
        .allTextContents()
      if (errorMessages.length > 0) {
        console.log('❌ Mensajes de error encontrados:', errorMessages)
      }

      // Buscar indicadores de autenticación
      const authIndicators = await page
        .locator('[data-clerk-loaded], .clerk-loaded, .authenticated')
        .count()
      console.log(`🔐 Indicadores de Clerk cargado: ${authIndicators}`)

      // 7. INTENTAR FLUJO DE LOGIN SI ES NECESARIO
      if (!isLoggedIn && hasLoginButton) {
        console.log('📍 Paso 7: Intentando flujo de login...')

        try {
          await loginButton.first().click()
          await page.waitForTimeout(2000)
          await page.screenshot({ path: 'debug-screenshots/03-login-page.png', fullPage: true })

          const loginUrl = page.url()
          console.log(`🔑 URL de login: ${loginUrl}`)

          // Verificar si hay campos de login
          const emailField = page.locator('input[type="email"], input[name="email"], #email')
          const passwordField = page.locator(
            'input[type="password"], input[name="password"], #password'
          )

          const hasEmailField = (await emailField.count()) > 0
          const hasPasswordField = (await passwordField.count()) > 0

          console.log(`📧 Campo email presente: ${hasEmailField}`)
          console.log(`🔒 Campo password presente: ${hasPasswordField}`)
        } catch (error) {
          console.log('❌ Error en flujo de login:', error.message)
        }
      }

      // 8. RESUMEN FINAL
      console.log('\n📋 RESUMEN DEL DIAGNÓSTICO')
      console.log('==========================')
      console.log(`🌐 URL final: ${page.url()}`)
      console.log(`🔐 Estado de autenticación: ${isLoggedIn ? 'Logueado' : 'No logueado'}`)
      console.log(`🍪 Cookies de Clerk: ${clerkCookies.length}`)
      console.log(`📊 Acceso a /admin: ${currentUrl.includes('/admin') ? 'Exitoso' : 'Bloqueado'}`)

      // Tomar screenshot final
      await page.screenshot({ path: 'debug-screenshots/04-final-state.png', fullPage: true })

      console.log('\n📸 Screenshots guardados en debug-screenshots/')
      console.log('🔍 Revisa los logs arriba para identificar el problema específico')
    } catch (error) {
      console.error('❌ Error durante el diagnóstico:', error.message)
      await page.screenshot({ path: 'debug-screenshots/error-state.png', fullPage: true })
    }
  })

  test('Verificar configuración de Clerk', async ({ page }) => {
    console.log('🔧 VERIFICANDO CONFIGURACIÓN DE CLERK')

    try {
      await page.goto('https://pinteya.com')

      // Verificar que Clerk se carga correctamente
      await page.waitForFunction(
        () => {
          return window.Clerk !== undefined
        },
        { timeout: 10000 }
      )

      console.log('✅ Clerk se cargó correctamente')

      // Obtener información de configuración
      const clerkInfo = await page.evaluate(() => {
        return {
          clerkLoaded: !!window.Clerk,
          publishableKey: window.Clerk?.publishableKey?.substring(0, 20) + '...',
          environment: window.Clerk?.environment,
          user: window.Clerk?.user
            ? {
                id: window.Clerk.user.id,
                emailAddresses: window.Clerk.user.emailAddresses?.map(e => e.emailAddress),
                publicMetadata: window.Clerk.user.publicMetadata,
              }
            : null,
        }
      })

      console.log('🔍 Información de Clerk:', JSON.stringify(clerkInfo, null, 2))
    } catch (error) {
      console.error('❌ Error verificando Clerk:', error.message)
    }
  })
})
