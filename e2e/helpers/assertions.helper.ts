// ===================================
// ASSERTIONS HELPER
// Funciones auxiliares para assertions personalizados
// ===================================

import { Page, expect } from '@playwright/test'

/**
 * Verifica que un producto está en la lista
 */
export async function assertProductInList(page: Page, productName: string) {
  const productLocator = page.locator(`text=${productName}`).first()
  await expect(productLocator).toBeVisible()
  console.log(`✅ Producto encontrado en lista: ${productName}`)
}

/**
 * Verifica el contador de variantes de un producto
 */
export async function assertVariantCount(
  page: Page,
  productId: string,
  expectedCount: number
) {
  const selector = `[data-testid="variant-count-${productId}"]`
  const countLocator = page.locator(selector)
  
  await expect(countLocator).toContainText(expectedCount.toString(), {
    timeout: 5000,
  })
  
  console.log(`✅ Contador de variantes correcto: ${expectedCount}`)
}

/**
 * Verifica que una variante tiene el badge "Default"
 */
export async function assertVariantDefault(page: Page, variantId: string) {
  const defaultLocator = page.locator(
    `[data-testid="variant-${variantId}"] [data-testid="default-badge"]`
  )
  
  await expect(defaultLocator).toBeVisible()
  await expect(defaultLocator).toContainText('★ Default')
  
  console.log(`✅ Variante marcada como default: ${variantId}`)
}

/**
 * Verifica el estado activo/inactivo de una variante
 */
export async function assertVariantActive(
  page: Page,
  variantId: string,
  isActive: boolean
) {
  const variantLocator = page.locator(`[data-testid="variant-${variantId}"]`)
  
  if (isActive) {
    await expect(variantLocator).not.toHaveClass(/opacity-50/)
    console.log(`✅ Variante activa: ${variantId}`)
  } else {
    await expect(variantLocator).toHaveClass(/opacity-50/)
    console.log(`✅ Variante inactiva: ${variantId}`)
  }
}

/**
 * Verifica que un badge de estado existe y tiene el texto correcto
 */
export async function assertBadgeExists(
  page: Page,
  selector: string,
  expectedText: string
) {
  const badgeLocator = page.locator(selector)
  
  await expect(badgeLocator).toBeVisible()
  await expect(badgeLocator).toContainText(expectedText)
  
  console.log(`✅ Badge encontrado: ${expectedText}`)
}

/**
 * Verifica que un modal está abierto
 */
export async function assertModalOpen(page: Page) {
  const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]')
  await expect(modal).toBeVisible()
  console.log('✅ Modal abierto')
}

/**
 * Verifica que un modal está cerrado
 */
export async function assertModalClosed(page: Page) {
  const modal = page.locator('[role="dialog"], .modal, [data-testid="modal"]')
  await expect(modal).not.toBeVisible()
  console.log('✅ Modal cerrado')
}

/**
 * Verifica que una notificación de éxito apareció
 */
export async function assertSuccessNotification(page: Page) {
  await expect(page.locator('text=/éxito|success/i')).toBeVisible({ timeout: 3000 })
  console.log('✅ Notificación de éxito visible')
}

/**
 * Verifica que una notificación de error apareció
 */
export async function assertErrorNotification(page: Page) {
  await expect(page.locator('text=/error|falló|inválido/i')).toBeVisible({ timeout: 3000 })
  console.log('✅ Notificación de error visible')
}

/**
 * Verifica que el formulario muestra errores de validación
 */
export async function assertValidationErrors(page: Page, fieldNames: string[]) {
  for (const fieldName of fieldNames) {
    const errorLocator = page.locator(`[data-testid="${fieldName}-error"]`)
    await expect(errorLocator).toBeVisible()
    await expect(errorLocator).toHaveClass(/text-red/)
    console.log(`✅ Error de validación en campo: ${fieldName}`)
  }
}

/**
 * Verifica que una imagen está visible
 */
export async function assertImageVisible(page: Page, altText: string) {
  const imageLocator = page.locator(`img[alt="${altText}"]`)
  await expect(imageLocator).toBeVisible()
  console.log(`✅ Imagen visible: ${altText}`)
}

/**
 * Verifica que hay N variantes en la tabla
 */
export async function assertVariantsCountInTable(page: Page, expectedCount: number) {
  const variantRows = page.locator('[data-testid="variant-row"]')
  await expect(variantRows).toHaveCount(expectedCount)
  console.log(`✅ ${expectedCount} variantes en tabla`)
}

/**
 * Verifica que el chevron está en estado expandido (hacia abajo ↓)
 */
export async function assertVariantsExpanded(page: Page, productId: string) {
  const chevron = page.locator(
    `[data-testid="variant-count-${productId}"] svg[data-testid="chevron-down"]`
  )
  await expect(chevron).toBeVisible()
  console.log(`✅ Variantes expandidas para producto ${productId}`)
}

/**
 * Verifica que el chevron está en estado colapsado (hacia la derecha →)
 */
export async function assertVariantsCollapsed(page: Page, productId: string) {
  const chevron = page.locator(
    `[data-testid="variant-count-${productId}"] svg[data-testid="chevron-right"]`
  )
  await expect(chevron).toBeVisible()
  console.log(`✅ Variantes colapsadas para producto ${productId}`)
}

