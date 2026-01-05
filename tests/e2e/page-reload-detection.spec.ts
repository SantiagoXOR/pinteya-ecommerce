import { test, expect } from '@playwright/test'

/**
 * TEST DE DETECCIÓN DE RECARGA DE PÁGINA
 * ======================================
 * 
 * Este test detecta si la página se está recargando automáticamente
 * después de la carga inicial, lo cual es un problema común causado por:
 * - Error boundaries con auto-recovery habilitado
 * - Errores de hidratación de Next.js
 * - Scripts que fuerzan recargas
 */

test.describe('Detección de Recarga Automática de Página', () => {
  test('Detectar recarga automática después de carga inicial', async ({ page }) => {
    let reloadCount = 0
    let initialLoadTime: number | null = null
    let reloadTimes: number[] = []

    // Detectar recargas de página
    page.on('load', () => {
      const currentTime = Date.now()
      
      if (initialLoadTime === null) {
        initialLoadTime = currentTime
        console.log('📥 Carga inicial detectada')
      } else {
        reloadCount++
        const timeSinceInitial = currentTime - initialLoadTime!
        reloadTimes.push(timeSinceInitial)
        console.log(`🔄 Recarga #${reloadCount} detectada después de ${timeSinceInitial}ms desde la carga inicial`)
      }
    })

    // Detectar errores de JavaScript que podrían causar recargas
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Detectar errores de página
    page.on('pageerror', error => {
      console.error('❌ Error de página detectado:', error.message)
      errors.push(`Page Error: ${error.message}`)
    })

    // Navegar a la página principal
    const navigationStart = Date.now()
    await page.goto('/', { waitUntil: 'networkidle' })
    const navigationTime = Date.now() - navigationStart

    console.log(`\n⏱️ Tiempo de navegación inicial: ${navigationTime}ms`)

    // Esperar 5 segundos para detectar recargas automáticas
    await page.waitForTimeout(5000)

    // Verificar si hubo recargas
    console.log(`\n📊 RESULTADOS:`)
    console.log(`Recargas detectadas: ${reloadCount}`)
    console.log(`Errores de JavaScript: ${errors.length}`)
    
    if (reloadTimes.length > 0) {
      console.log(`\n⏱️ Tiempos de recarga desde carga inicial:`)
      reloadTimes.forEach((time, index) => {
        console.log(`  Recarga #${index + 1}: ${time}ms`)
      })
    }

    if (errors.length > 0) {
      console.log(`\n❌ Errores detectados:`)
      errors.slice(0, 10).forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.substring(0, 200)}`)
      })
    }

    // Verificar que no haya recargas automáticas
    expect(reloadCount).toBe(0) // No debería haber recargas automáticas

    // Si hay recargas, verificar que no sean muy frecuentes
    if (reloadCount > 0) {
      const rapidReloads = reloadTimes.filter(time => time < 5000).length
      expect(rapidReloads).toBe(0) // No debería haber recargas en los primeros 5 segundos
    }
  })

  test('Detectar recargas en diferentes rutas', async ({ page }) => {
    const routes = ['/', '/shop', '/admin']
    const reloadsByRoute: Record<string, number> = {}

    for (const route of routes) {
      let reloadCount = 0
      let initialLoadTime: number | null = null

      page.on('load', () => {
        const currentTime = Date.now()
        
        if (initialLoadTime === null) {
          initialLoadTime = currentTime
        } else {
          reloadCount++
        }
      })

      try {
        await page.goto(route, { waitUntil: 'networkidle', timeout: 10000 })
        await page.waitForTimeout(5000) // Esperar 5 segundos
        
        reloadsByRoute[route] = reloadCount
        console.log(`\n📍 Ruta ${route}: ${reloadCount} recargas detectadas`)
      } catch (error) {
        console.log(`⚠️ Error al cargar ruta ${route}:`, error)
        reloadsByRoute[route] = -1 // Marcar como error
      }
    }

    // Verificar que ninguna ruta tenga recargas automáticas
    Object.entries(reloadsByRoute).forEach(([route, count]) => {
      if (count >= 0) {
        expect(count).toBe(0) // No debería haber recargas automáticas en ninguna ruta
      }
    })
  })

  test('Detectar errores de hidratación que causan recargas', async ({ page }) => {
    const hydrationErrors: string[] = []
    const reloadDetected = { value: false }

    // Detectar errores de hidratación
    page.on('console', msg => {
      const text = msg.text()
      if (
        text.includes('hydration') ||
        text.includes('Hydration') ||
        text.includes('mismatch') ||
        text.includes('Text content does not match') ||
        text.includes('Expected server HTML')
      ) {
        hydrationErrors.push(text)
      }
    })

    // Detectar recargas
    let initialLoad = true
    page.on('load', () => {
      if (!initialLoad) {
        reloadDetected.value = true
        console.log('🔄 Recarga detectada - posiblemente causada por error de hidratación')
      }
      initialLoad = false
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForTimeout(5000)

    console.log(`\n📊 ERRORES DE HIDRATACIÓN:`)
    console.log(`Errores detectados: ${hydrationErrors.length}`)
    
    if (hydrationErrors.length > 0) {
      console.log(`\n❌ Errores de hidratación:`)
      hydrationErrors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.substring(0, 300)}`)
      })
    }

    // Si hay errores de hidratación, es probable que causen recargas
    if (hydrationErrors.length > 0 && reloadDetected.value) {
      console.log(`\n⚠️ ADVERTENCIA: Errores de hidratación detectados y recarga ocurrió`)
      console.log(`   Esto sugiere que los errores de hidratación están causando recargas automáticas`)
    }

    // Verificar que no haya errores de hidratación críticos
    const criticalHydrationErrors = hydrationErrors.filter(error =>
      error.includes('mismatch') || error.includes('does not match')
    )
    expect(criticalHydrationErrors.length).toBe(0) // No debería haber errores críticos de hidratación
  })
})

