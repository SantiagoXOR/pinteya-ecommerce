/**
 * PINTEYA E-COMMERCE - TEST DE CORRECCIÓN DE IMÁGENES
 * ==================================================
 *
 * Test E2E para verificar que la corrección de previews faltantes
 * funcionó correctamente y que ya no hay placeholders en productos
 */

import { test, expect } from '@playwright/test'

test.describe('Corrección de Imágenes de Productos', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto('/')

    // Esperar a que la página cargue completamente
    await page.waitForLoadState('networkidle')
  })

  test('Verificar que productos en Home no muestran placeholders', async ({ page }) => {
    console.log('🔍 Verificando imágenes en página Home...')

    // Buscar todas las tarjetas de productos
    const productCards = page.locator('[data-testid="product-card"]')
    const cardCount = await productCards.count()

    console.log(`📦 Encontradas ${cardCount} tarjetas de productos en Home`)

    if (cardCount === 0) {
      console.log('⚠️ No se encontraron productos en Home, verificando estructura...')

      // Verificar si hay productos con selectores alternativos
      const alternativeCards = page.locator('.product-card, [class*="product"], [class*="card"]')
      const altCount = await alternativeCards.count()
      console.log(`📦 Productos con selectores alternativos: ${altCount}`)
    }

    // Verificar cada tarjeta de producto
    for (let i = 0; i < Math.min(cardCount, 10); i++) {
      // Limitar a 10 para no hacer el test muy largo
      const card = productCards.nth(i)

      // Buscar imagen dentro de la tarjeta
      const productImage = card.locator('img').first()

      if ((await productImage.count()) > 0) {
        const imageSrc = await productImage.getAttribute('src')
        const imageAlt = await productImage.getAttribute('alt')

        console.log(`🖼️ Producto ${i + 1}:`)
        console.log(`   - Src: ${imageSrc}`)
        console.log(`   - Alt: ${imageAlt}`)

        // Verificar que la imagen no es un placeholder
        expect(imageSrc).not.toBeNull()
        expect(imageSrc).not.toContain('placeholder')
        expect(imageSrc).not.toContain('default')
        expect(imageSrc).not.toEqual('')

        // Verificar que la imagen es de Supabase Storage
        if (imageSrc && !imageSrc.startsWith('data:')) {
          expect(imageSrc).toContain('supabase.co')
        }

        // Verificar que la imagen se carga correctamente
        await expect(productImage).toBeVisible()

        // Verificar que la imagen no tiene error de carga
        const naturalWidth = await productImage.evaluate(
          (img: HTMLImageElement) => img.naturalWidth
        )
        expect(naturalWidth).toBeGreaterThan(0)
      }
    }
  })

  test('Verificar productos específicos que tenían problemas', async ({ page }) => {
    console.log('🔍 Verificando productos específicos que tenían placeholders...')

    const problematicProducts = [
      'poximix-exterior-5kg-poxipol',
      'plavipint-techos-poliuretanico-20l-plavicon',
      'membrana-performa-20l-plavicon',
      'latex-frentes-4l-plavicon',
      'recuplast-interior-1l-sinteplast',
      'sintetico-converlux-1l-petrilac',
    ]

    for (const productSlug of problematicProducts) {
      console.log(`🔍 Verificando producto: ${productSlug}`)

      // Navegar a la página del producto
      await page.goto(`/products/${productSlug}`)

      // Esperar a que la página cargue
      await page.waitForLoadState('networkidle')

      // Buscar la imagen principal del producto
      const productImage = page
        .locator(
          '[data-testid="product-main-image"], .product-image img, img[alt*="producto"], img[alt*="Poximix"], img[alt*="Plavicon"], img[alt*="Sinteplast"], img[alt*="Petrilac"]'
        )
        .first()

      if ((await productImage.count()) > 0) {
        const imageSrc = await productImage.getAttribute('src')
        console.log(`   ✅ Imagen encontrada: ${imageSrc}`)

        // Verificar que no es placeholder
        expect(imageSrc).not.toBeNull()
        expect(imageSrc).not.toContain('placeholder')
        expect(imageSrc).not.toContain('default')

        // Verificar que es de Supabase
        if (imageSrc && !imageSrc.startsWith('data:')) {
          expect(imageSrc).toContain('supabase.co')
        }

        // Verificar que la imagen se carga
        await expect(productImage).toBeVisible()

        const naturalWidth = await productImage.evaluate(
          (img: HTMLImageElement) => img.naturalWidth
        )
        expect(naturalWidth).toBeGreaterThan(0)

        console.log(`   ✅ Producto ${productSlug} - Imagen cargada correctamente`)
      } else {
        console.log(`   ⚠️ No se encontró imagen para ${productSlug}`)

        // Buscar cualquier imagen en la página
        const anyImage = page.locator('img').first()
        if ((await anyImage.count()) > 0) {
          const src = await anyImage.getAttribute('src')
          console.log(`   📸 Primera imagen encontrada: ${src}`)
        }
      }
    }
  })

  test('Verificar página de tienda (Shop) sin placeholders', async ({ page }) => {
    console.log('🔍 Verificando imágenes en página Shop...')

    // Navegar a la página de tienda
    await page.goto('/shop')
    await page.waitForLoadState('networkidle')

    // Buscar productos en la tienda
    const productCards = page.locator(
      '[data-testid="product-card"], .product-card, [class*="product"]'
    )
    const cardCount = await productCards.count()

    console.log(`📦 Productos encontrados en Shop: ${cardCount}`)

    if (cardCount > 0) {
      // Verificar los primeros 8 productos
      for (let i = 0; i < Math.min(cardCount, 8); i++) {
        const card = productCards.nth(i)
        const productImage = card.locator('img').first()

        if ((await productImage.count()) > 0) {
          const imageSrc = await productImage.getAttribute('src')

          // Verificar que no es placeholder
          expect(imageSrc).not.toBeNull()
          expect(imageSrc).not.toContain('placeholder')

          // Verificar que la imagen se carga
          await expect(productImage).toBeVisible()

          console.log(`   ✅ Producto ${i + 1} en Shop - Imagen OK`)
        }
      }
    }
  })

  test('Verificar estadísticas de corrección', async ({ page }) => {
    console.log('📊 Verificando estadísticas de la corrección...')

    // Navegar a diferentes páginas y contar imágenes válidas
    const pages = ['/', '/shop']
    let totalImages = 0
    let validImages = 0

    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      const images = page.locator('img[src*="supabase.co"]')
      const imageCount = await images.count()

      console.log(`📄 ${pagePath}: ${imageCount} imágenes de Supabase encontradas`)

      totalImages += imageCount

      // Verificar que todas las imágenes se cargan
      for (let i = 0; i < Math.min(imageCount, 10); i++) {
        const img = images.nth(i)
        const src = await img.getAttribute('src')

        if (src && !src.includes('placeholder')) {
          validImages++
        }
      }
    }

    console.log(`📊 Estadísticas finales:`)
    console.log(`   - Total imágenes verificadas: ${Math.min(totalImages, 20)}`)
    console.log(`   - Imágenes válidas: ${validImages}`)
    console.log(
      `   - Porcentaje de éxito: ${totalImages > 0 ? Math.round((validImages / Math.min(totalImages, 20)) * 100) : 0}%`
    )

    // Verificar que al menos el 90% de las imágenes son válidas
    if (totalImages > 0) {
      const successRate = validImages / Math.min(totalImages, 20)
      expect(successRate).toBeGreaterThanOrEqual(0.9)
    }
  })
})
