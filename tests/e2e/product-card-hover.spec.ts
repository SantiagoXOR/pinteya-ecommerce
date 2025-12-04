import { test, expect, Page } from '@playwright/test'

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
const TARGET_URL = process.env.PLAYWRIGHT_TARGET_URL || `${BASE_URL}/demo/product-card`

async function waitForPageStable(page: Page) {
  await page.waitForLoadState('domcontentloaded')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
}

test.describe('ProductCard - microinteracciones en hover', () => {
  test('muestra efectos de hover (transform o quick actions visibles)', async ({
    page,
  }, testInfo) => {
    const projectName = testInfo.project.name

    // Los proyectos móviles no soportan hover; se omite esta validación.
    test.skip(/Mobile/i.test(projectName), 'Hover no aplica para proyectos móviles')

    console.log('🧪 Verificando microinteracciones de ProductCard al hacer hover')
    await page.goto(TARGET_URL)
    await waitForPageStable(page)

    // Intentar localizar primero CommercialProductCard (con más microinteracciones)
    let card = page.locator('[data-testid-commercial="commercial-product-card"]').first()
    let count = await card.count()

    if (count === 0) {
      // Fallback al ProductCard genérico
      card = page.locator('[data-testid="product-card"]').first()
      count = await card.count()
    }

    expect(count).toBeGreaterThan(0)

    // Asegurar visibilidad (en viewport)
    await card.scrollIntoViewIfNeeded()
    await expect(card).toBeVisible()

    // Capturar transform inicial
    const transformBefore = await card.evaluate(el => getComputedStyle(el as HTMLElement).transform)
    console.log('🔎 Transform inicial:', transformBefore)

    // Hover en la tarjeta
    await card.hover()

    // 1) Intentar quick actions visibles
    const quickAction = card.locator('button.w-8.h-8').first()
    let hasQuickActions = false
    try {
      await expect(quickAction).toBeVisible({ timeout: 1500 })
      hasQuickActions = true
    } catch {
      hasQuickActions = false
    }

    // 2) Si no hay quick actions, verificar cambio de transform con polling
    let hasTransformHover = false
    if (!hasQuickActions) {
      const result = await expect
        .poll(
          async () => await card.evaluate(el => getComputedStyle(el as HTMLElement).transform),
          {
            timeout: 1500,
            intervals: [100, 150, 200, 250, 300, 500],
          }
        )
        .not.toEqual(transformBefore)
        .catch(() => null)

      hasTransformHover = Boolean(result === undefined) // expect.poll lanza si falla; si no lanza, ya se validó.

      // Si no usamos expect.poll como valor de retorno, hacemos una segunda comprobación manual
      if (!hasTransformHover) {
        const transformAfter = await card.evaluate(
          el => getComputedStyle(el as HTMLElement).transform
        )
        console.log('🔎 Transform luego de hover:', transformAfter)
        hasTransformHover =
          !!transformAfter && transformAfter !== 'none' && transformAfter !== transformBefore
      }
    }

    const hasMicroInteractions = hasQuickActions || hasTransformHover

    // Guardar evidencia visual
    await card.screenshot({ path: 'tests/screenshots/product-card-hover.png' })

    // Afirmación final
    expect(hasMicroInteractions).toBeTruthy()
  })
})
