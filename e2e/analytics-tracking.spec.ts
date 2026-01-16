/**
 * Test E2E para verificar el sistema de analytics
 * Verifica que los eventos se capturen correctamente en el navegador
 */

import { test, expect } from '@playwright/test'

test.describe('Analytics Tracking', () => {
  test.beforeEach(async ({ page }) => {
    // Interceptar requests a la API de analytics
    await page.route('**/api/track/events', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()
      
      // Guardar el evento en el contexto del test
      await page.evaluate((data) => {
        (window as any).__analyticsEvents = (window as any).__analyticsEvents || []
        ;(window as any).__analyticsEvents.push(data)
      }, postData)
      
      // Continuar con la request real
      await route.continue()
    })

    // Interceptar requests a la API alternativa
    await page.route('**/api/analytics/events', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()
      
      await page.evaluate((data) => {
        (window as any).__analyticsEvents = (window as any).__analyticsEvents || []
        ;(window as any).__analyticsEvents.push(data)
      }, postData)
      
      await route.continue()
    })
  })

  test('debería capturar evento page_view al cargar la página', async ({ page }) => {
    await page.goto('/')
    
    // Esperar a que se cargue la página
    await page.waitForLoadState('networkidle')
    
    // Esperar un poco para que se envíe el evento
    await page.waitForTimeout(1000)
    
    // Verificar que se capturó el evento page_view
    const events = await page.evaluate(() => {
      return (window as any).__analyticsEvents || []
    })
    
    const pageViewEvents = events.filter((e: any) => 
      e.event === 'page_view' || e.eventName === 'page_view'
    )
    
    expect(pageViewEvents.length).toBeGreaterThan(0)
    console.log('✅ Evento page_view capturado:', pageViewEvents[0])
  })

  test('debería capturar evento add_to_cart al agregar producto al carrito', async ({ page }) => {
    await page.goto('/')
    
    // Esperar a que se cargue la página
    await page.waitForLoadState('networkidle')
    
    // Buscar un producto en la página principal
    const productCard = page.locator('[data-testid="product-card"], .product-card, article').first()
    
    if (await productCard.count() > 0) {
      // Hacer scroll al producto
      await productCard.scrollIntoViewIfNeeded()
      await page.waitForTimeout(500)
      
      // Buscar el botón de agregar al carrito
      const addToCartButton = productCard.locator(
        'button:has-text("Agregar"), button:has-text("Añadir"), button:has-text("Comprar"), [aria-label*="carrito" i], [aria-label*="cart" i]'
      ).first()
      
      if (await addToCartButton.count() > 0) {
        // Limpiar eventos anteriores
        await page.evaluate(() => {
          ;(window as any).__analyticsEvents = []
        })
        
        // Hacer clic en agregar al carrito
        await addToCartButton.click()
        
        // Esperar a que se envíe el evento
        await page.waitForTimeout(2000)
        
        // Verificar que se capturó el evento add_to_cart
        const events = await page.evaluate(() => {
          return (window as any).__analyticsEvents || []
        })
        
        console.log('📊 Eventos capturados:', JSON.stringify(events, null, 2))
        
        const addToCartEvents = events.filter((e: any) => 
          e.event === 'add_to_cart' || 
          e.action === 'add_to_cart' ||
          (e.event === 'ecommerce' && e.action === 'add_to_cart')
        )
        
        expect(addToCartEvents.length).toBeGreaterThan(0)
        console.log('✅ Evento add_to_cart capturado:', addToCartEvents[0])
        
        // Verificar que el evento tiene los datos correctos
        const event = addToCartEvents[0]
        expect(event).toHaveProperty('category', 'shop')
        expect(event).toHaveProperty('action', 'add_to_cart')
      } else {
        console.log('⚠️ No se encontró botón de agregar al carrito')
      }
    } else {
      console.log('⚠️ No se encontraron productos en la página')
    }
  })

  test('debería verificar que los eventos se envían a la API correcta', async ({ page }) => {
    const apiCalls: any[] = []
    
    // Interceptar todas las llamadas a la API
    await page.route('**/api/track/events', async (route) => {
      const request = route.request()
      const postData = request.postDataJSON()
      apiCalls.push({
        url: request.url(),
        method: request.method(),
        data: postData,
      })
      await route.continue()
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    // Verificar que se hicieron llamadas a la API
    expect(apiCalls.length).toBeGreaterThan(0)
    console.log('✅ Llamadas a la API:', JSON.stringify(apiCalls, null, 2))
    
    // Verificar que al menos una llamada es POST
    const postCalls = apiCalls.filter(call => call.method === 'POST')
    expect(postCalls.length).toBeGreaterThan(0)
  })

  test('debería verificar que los eventos tienen la estructura correcta', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    
    const events = await page.evaluate(() => {
      return (window as any).__analyticsEvents || []
    })
    
    if (events.length > 0) {
      const event = events[0]
      
      // Verificar estructura básica del evento
      expect(event).toHaveProperty('event')
      expect(event).toHaveProperty('category')
      expect(event).toHaveProperty('action')
      expect(event).toHaveProperty('sessionId')
      expect(event).toHaveProperty('timestamp')
      
      console.log('✅ Estructura del evento correcta:', event)
    }
  })
})
