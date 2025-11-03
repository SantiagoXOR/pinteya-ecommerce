// ===================================
// WAIT HELPER
// Funciones auxiliares para esperas inteligentes en tests
// ===================================

import { Page, expect } from '@playwright/test'

/**
 * Espera a que la tabla de productos cargue completamente
 */
export async function waitForTableLoad(page: Page, timeout = 10000) {
  // Esperar a que desaparezca skeleton/loading
  await page.waitForSelector('[data-testid="products-table"]', {
    state: 'visible',
    timeout,
  })
  
  // Esperar a que no haya skeleton loading visible
  const skeleton = page.locator('.animate-pulse, [data-testid="loading-skeleton"]')
  if (await skeleton.count() > 0) {
    await page.waitForSelector('.animate-pulse, [data-testid="loading-skeleton"]', {
      state: 'hidden',
      timeout,
    })
  }
  
  console.log('✅ Tabla de productos cargada')
}

/**
 * Espera a que las variantes se expandan y carguen
 */
export async function waitForVariantsExpand(
  page: Page,
  productId: string,
  timeout = 5000
) {
  // Esperar a que aparezca la fila expandible
  await page.waitForSelector(
    `[data-testid="expandable-variants-row-${productId}"]`,
    {
      state: 'visible',
      timeout,
    }
  )
  
  // Esperar a que aparezca la tabla de variantes
  await page.waitForSelector('[data-testid="variant-table"]', {
    state: 'visible',
    timeout,
  })
  
  // Esperar a que los datos se carguen (al menos una fila de variante)
  await page.waitForSelector('[data-testid="variant-row"]', {
    state: 'visible',
    timeout,
  })
  
  console.log(`✅ Variantes expandidas para producto ${productId}`)
}

/**
 * Espera a que aparezca una notificación (éxito o error)
 */
export async function waitForNotification(
  page: Page,
  type: 'success' | 'error' | 'info' = 'success',
  timeout = 5000
) {
  // Buscar texto de notificación
  const selectors = {
    success: 'text=/éxito|success|guardado|guardada/i',
    error: 'text=/error|falló|inválido/i',
    info: 'text=/info|información/i',
  }
  
  await page.waitForSelector(selectors[type], {
    state: 'visible',
    timeout,
  })
  
  console.log(`✅ Notificación ${type} apareció`)
}

/**
 * Espera a que se cierre el modal
 */
export async function waitForModalClose(page: Page, timeout = 5000) {
  // Esperar a que el modal desaparezca
  const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]')
  
  // Verificar que estaba visible
  const count = await modal.count()
  if (count > 0) {
    await modal.first().waitFor({ state: 'hidden', timeout })
  }
  
  console.log('✅ Modal cerrado')
}

/**
 * Espera a que los datos se sincronicen después de una operación
 */
export async function waitForDataSync(page: Page, timeout = 3000) {
  // Esperar a que no haya indicadores de loading
  await page.waitForLoadState('networkidle')
  
  // Esperar un pequeño delay adicional para asegurar sincronización
  await page.waitForTimeout(500)
  
  console.log('✅ Datos sincronizados')
}

/**
 * Espera a que una petición HTTP se complete
 */
export async function waitForAPIRequest(page: Page, endpoint: string, timeout = 10000) {
  await page.waitForResponse(
    (response) => response.url().includes(endpoint) && response.status() === 200,
    { timeout }
  )
  
  console.log(`✅ API request completada: ${endpoint}`)
}

/**
 * Espera a que un elemento tenga un texto específico
 */
export async function waitForTextContent(
  page: Page,
  selector: string,
  expectedText: string,
  timeout = 5000
) {
  await expect(page.locator(selector)).toContainText(expectedText, { timeout })
  console.log(`✅ Texto encontrado: "${expectedText}"`)
}

/**
 * Espera a que el contador de variantes se actualice
 */
export async function waitForVariantCountUpdate(
  page: Page,
  productId: string,
  expectedCount: number,
  timeout = 5000
) {
  const selector = `[data-testid="variant-count-${productId}"]`
  await page.waitForFunction(
    ({ selector, expectedCount }) => {
      const element = document.querySelector(selector)
      if (!element) return false
      const text = element.textContent || ''
      const count = parseInt(text.replace(/\D/g, '')) || 0
      return count === expectedCount
    },
    { selector, expectedCount },
    { timeout }
  )
  
  console.log(`✅ Contador actualizado: ${expectedCount}`)
}

/**
 * Espera a que un checkbox esté en un estado específico
 */
export async function waitForCheckboxState(
  page: Page,
  selector: string,
  checked: boolean,
  timeout = 5000
) {
  await page.waitForFunction(
    ({ selector, checked }) => {
      const checkbox = document.querySelector(selector) as HTMLInputElement
      if (!checkbox) return false
      return checkbox.checked === checked
    },
    { selector, checked },
    { timeout }
  )
  
  console.log(`✅ Checkbox ${checked ? 'marcado' : 'desmarcado'}`)
}

