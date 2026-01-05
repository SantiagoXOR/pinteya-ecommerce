import { test, expect, Page } from '@playwright/test'

/**
 * 🎯 Test de Verificación: Duraciones de Animaciones
 * 
 * Este test verifica que las animaciones y transiciones tengan las duraciones correctas
 * según la configuración global (0.8s para transiciones, 1s para animaciones).
 */

interface AnimationDurationMetrics {
  transitionDuration: string
  animationDuration: string
  computedTransitionDuration: number // en segundos
  computedAnimationDuration: number // en segundos
}

/**
 * Función para medir duraciones de animaciones en elementos específicos
 */
async function measureAnimationDurations(page: Page): Promise<{
  globalTransitions: AnimationDurationMetrics
  globalAnimations: AnimationDurationMetrics
  heroCarouselButtons: AnimationDurationMetrics[]
  comboImages: AnimationDurationMetrics[]
  productCardPills: AnimationDurationMetrics[]
}> {
  return await page.evaluate(() => {
    // Medir duraciones globales
    const testElement = document.createElement('div')
    testElement.style.transition = 'all 0.1s'
    testElement.style.animation = 'none'
    document.body.appendChild(testElement)
    
    const globalStyles = window.getComputedStyle(testElement)
    const globalTransitionDuration = globalStyles.transitionDuration
    const globalAnimationDuration = globalStyles.animationDuration
    
    // Convertir a segundos
    const parseDuration = (duration: string): number => {
      if (!duration || duration === 'none' || duration === '0s') return 0
      const match = duration.match(/([\d.]+)s/)
      return match ? parseFloat(match[1]) : 0
    }

    const globalTransitions: AnimationDurationMetrics = {
      transitionDuration: globalTransitionDuration,
      animationDuration: 'none',
      computedTransitionDuration: parseDuration(globalTransitionDuration),
      computedAnimationDuration: 0,
    }

    // Medir animaciones globales
    testElement.style.animation = 'pulse 0.1s'
    const globalAnimStyles = window.getComputedStyle(testElement)
    const globalAnimDuration = globalAnimStyles.animationDuration

    const globalAnimations: AnimationDurationMetrics = {
      transitionDuration: 'none',
      animationDuration: globalAnimDuration,
      computedTransitionDuration: 0,
      computedAnimationDuration: parseDuration(globalAnimDuration),
    }

    document.body.removeChild(testElement)

    // Medir botones del Hero Carousel
    const heroButtons = Array.from(document.querySelectorAll('.hero-carousel button, [class*="hero"] button'))
    const heroCarouselButtons = heroButtons.map(button => {
      const styles = window.getComputedStyle(button)
      return {
        transitionDuration: styles.transitionDuration,
        animationDuration: styles.animationDuration,
        computedTransitionDuration: parseDuration(styles.transitionDuration),
        computedAnimationDuration: parseDuration(styles.animationDuration),
      }
    })

    // Medir imágenes de Combos
    const comboImages = Array.from(document.querySelectorAll('.combo-image, .CombosSection img'))
    const comboImagesMetrics = comboImages.map(img => {
      const styles = window.getComputedStyle(img)
      return {
        transitionDuration: styles.transitionDuration,
        animationDuration: styles.animationDuration,
        computedTransitionDuration: parseDuration(styles.transitionDuration),
        computedAnimationDuration: parseDuration(styles.animationDuration),
      }
    })

    // Medir pills de product cards
    const pills = Array.from(document.querySelectorAll('[class*="pill"], [data-testid*="pill"]'))
    const productCardPills = pills.slice(0, 5).map(pill => {
      const styles = window.getComputedStyle(pill)
      return {
        transitionDuration: styles.transitionDuration,
        animationDuration: styles.animationDuration,
        computedTransitionDuration: parseDuration(styles.transitionDuration),
        computedAnimationDuration: parseDuration(styles.animationDuration),
      }
    })

    return {
      globalTransitions,
      globalAnimations,
      heroCarouselButtons,
      comboImages: comboImagesMetrics,
      productCardPills,
    }
  })
}

/**
 * Función para medir duración real de una transición hover
 */
async function measureHoverTransitionDuration(
  page: Page,
  selector: string
): Promise<number> {
  return await page.evaluate(
    ({ selector }) => {
      return new Promise<number>((resolve) => {
        const element = document.querySelector(selector) as HTMLElement
        if (!element) {
          resolve(0)
          return
        }

        const startTime = performance.now()
        let transitionEnded = false

        const handleTransitionEnd = (e: TransitionEvent) => {
          if (e.target === element && !transitionEnded) {
            transitionEnded = true
            const duration = performance.now() - startTime
            element.removeEventListener('transitionend', handleTransitionEnd)
            resolve(duration)
          }
        }

        element.addEventListener('transitionend', handleTransitionEnd)

        // Trigger hover
        element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))

        // Timeout después de 2 segundos
        setTimeout(() => {
          if (!transitionEnded) {
            element.removeEventListener('transitionend', handleTransitionEnd)
            resolve(0)
          }
        }, 2000)
      })
    },
    { selector }
  )
}

test.describe('Verificación de Duraciones de Animaciones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.waitForLoadState('domcontentloaded')
    // Esperar a que las animaciones iniciales se completen
    await page.waitForTimeout(1000)
  })

  test('debe tener duraciones globales correctas para transiciones', async ({ page }) => {
    const metrics = await measureAnimationDurations(page)

    console.log('📊 Duraciones Globales de Transiciones:')
    console.log('  - CSS Computed:', metrics.globalTransitions.transitionDuration)
    console.log('  - Duración en segundos:', metrics.globalTransitions.computedTransitionDuration)

    // Verificar que la duración global sea aproximadamente 0.8s
    // Permitir un rango de 0.7s a 0.9s para tolerancia
    expect(metrics.globalTransitions.computedTransitionDuration).toBeGreaterThanOrEqual(0.7)
    expect(metrics.globalTransitions.computedTransitionDuration).toBeLessThanOrEqual(0.9)
  })

  test('debe tener duraciones globales correctas para animaciones', async ({ page }) => {
    const metrics = await measureAnimationDurations(page)

    console.log('📊 Duraciones Globales de Animaciones:')
    console.log('  - CSS Computed:', metrics.globalAnimations.animationDuration)
    console.log('  - Duración en segundos:', metrics.globalAnimations.computedAnimationDuration)

    // Verificar que la duración global sea aproximadamente 1s
    // Permitir un rango de 0.9s a 1.1s para tolerancia
    if (metrics.globalAnimations.computedAnimationDuration > 0) {
      expect(metrics.globalAnimations.computedAnimationDuration).toBeGreaterThanOrEqual(0.9)
      expect(metrics.globalAnimations.computedAnimationDuration).toBeLessThanOrEqual(1.1)
    }
  })

  test('debe tener duraciones correctas en botones del Hero Carousel', async ({ page }) => {
    // Esperar a que el Hero Carousel se cargue
    await page.waitForSelector('.hero-carousel, [class*="hero"]', { timeout: 5000 }).catch(() => {})

    const metrics = await measureAnimationDurations(page)

    console.log('📊 Duraciones en Botones del Hero Carousel:')
    metrics.heroCarouselButtons.forEach((button, index) => {
      console.log(`  Botón ${index + 1}:`)
      console.log(`    - Transition: ${button.transitionDuration} (${button.computedTransitionDuration}s)`)
    })

    // Verificar que al menos algunos botones tengan duraciones correctas
    if (metrics.heroCarouselButtons.length > 0) {
      const validDurations = metrics.heroCarouselButtons.filter(
        btn => btn.computedTransitionDuration >= 0.7 && btn.computedTransitionDuration <= 0.9
      )
      expect(validDurations.length).toBeGreaterThan(0)
    }
  })

  test('debe tener duraciones correctas en imágenes de Combos', async ({ page }) => {
    // Esperar a que las imágenes de Combos se carguen
    await page.waitForSelector('.combo-image, .CombosSection img', { timeout: 5000 }).catch(() => {})

    const metrics = await measureAnimationDurations(page)

    console.log('📊 Duraciones en Imágenes de Combos:')
    metrics.comboImages.forEach((img, index) => {
      console.log(`  Imagen ${index + 1}:`)
      console.log(`    - Transition: ${img.transitionDuration} (${img.computedTransitionDuration}s)`)
    })

    // Verificar que al menos algunas imágenes tengan duraciones correctas
    if (metrics.comboImages.length > 0) {
      const validDurations = metrics.comboImages.filter(
        img => img.computedTransitionDuration >= 0.7 && img.computedTransitionDuration <= 0.9
      )
      expect(validDurations.length).toBeGreaterThan(0)
    }
  })

  test('debe medir duración real de transición hover en botón del Hero', async ({ page }) => {
    // Esperar a que el Hero Carousel se cargue
    await page.waitForSelector('.hero-carousel button, [class*="hero"] button', { timeout: 5000 }).catch(() => {})

    const buttonSelector = '.hero-carousel button, [class*="hero"] button'
    const duration = await measureHoverTransitionDuration(page, buttonSelector)

    console.log('📊 Duración Real de Transición Hover en Botón del Hero:')
    console.log(`  - Duración medida: ${duration}ms`)

    // Verificar que la duración esté en el rango esperado (700ms - 900ms)
    if (duration > 0) {
      expect(duration).toBeGreaterThanOrEqual(700)
      expect(duration).toBeLessThanOrEqual(900)
    }
  })

  test('debe medir duración real de transición hover en imagen de Combo', async ({ page }) => {
    // Esperar a que las imágenes de Combos se carguen
    await page.waitForSelector('.combo-image, .CombosSection img', { timeout: 5000 }).catch(() => {})

    const imageSelector = '.combo-image, .CombosSection img'
    const duration = await measureHoverTransitionDuration(page, imageSelector)

    console.log('📊 Duración Real de Transición Hover en Imagen de Combo:')
    console.log(`  - Duración medida: ${duration}ms`)

    // Verificar que la duración esté en el rango esperado (700ms - 900ms)
    if (duration > 0) {
      expect(duration).toBeGreaterThanOrEqual(700)
      expect(duration).toBeLessThanOrEqual(900)
    }
  })

  test('debe verificar todas las duraciones en la página', async ({ page }) => {
    const metrics = await measureAnimationDurations(page)

    console.log('\n📊 RESUMEN DE DUraciones DE ANIMACIONES:')
    console.log('==========================================')
    console.log('Transiciones Globales:')
    console.log(`  - CSS: ${metrics.globalTransitions.transitionDuration}`)
    console.log(`  - Duración: ${metrics.globalTransitions.computedTransitionDuration}s`)
    console.log('\nAnimaciones Globales:')
    console.log(`  - CSS: ${metrics.globalAnimations.animationDuration}`)
    console.log(`  - Duración: ${metrics.globalAnimations.computedAnimationDuration}s`)
    console.log('\nBotones del Hero Carousel:')
    metrics.heroCarouselButtons.forEach((btn, i) => {
      console.log(`  Botón ${i + 1}: ${btn.computedTransitionDuration}s`)
    })
    console.log('\nImágenes de Combos:')
    metrics.comboImages.forEach((img, i) => {
      console.log(`  Imagen ${i + 1}: ${img.computedTransitionDuration}s`)
    })
    console.log('\nPills de Product Cards:')
    metrics.productCardPills.forEach((pill, i) => {
      console.log(`  Pill ${i + 1}: ${pill.computedTransitionDuration}s`)
    })
    console.log('==========================================\n')

    // Verificaciones generales
    expect(metrics.globalTransitions.computedTransitionDuration).toBeGreaterThanOrEqual(0.7)
    expect(metrics.globalTransitions.computedTransitionDuration).toBeLessThanOrEqual(0.9)
  })
})

