import { chromium, FullConfig } from '@playwright/test'
import { setupPersistentAuth } from './auth-setup'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Iniciando configuración global de Playwright...')

  // Verificar que el servidor esté corriendo
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000'

  try {
    const browser = await chromium.launch()
    const context = await browser.newContext()
    const page = await context.newPage()

    // Verificar que la aplicación esté disponible
    console.log('🌐 Verificando disponibilidad del servidor...')
    await page.goto(baseURL)
    await page.waitForSelector('body', { timeout: 10000 })

    console.log('✅ Servidor de desarrollo verificado y funcionando')

    // Configurar autenticación global para tests administrativos
    console.log('🔐 Configurando autenticación global...')
    try {
      await setupPersistentAuth(context)
      console.log('✅ Autenticación global configurada exitosamente')
    } catch (authError) {
      console.warn('⚠️ No se pudo configurar autenticación global:', authError.message)
      console.warn('⚠️ Los tests individuales manejarán su propia autenticación')
    }

    await browser.close()
  } catch (error) {
    console.error('❌ Error en la configuración global:', error)
    throw error
  }

  console.log('✅ Configuración global completada')
}

export default globalSetup
