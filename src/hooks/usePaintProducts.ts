/**
 * Hook para obtener productos con colores para Paint Visualizer
 */

import { useState, useEffect } from 'react'
import { getProducts } from '@/lib/api/products'
import { ProductWithCategory } from '@/types/api'
import { getColorHexFromName } from '@/components/ui/product-card-commercial/utils/color-utils'
import { getProductImage } from '@/lib/utils/image-helpers'
import { PaintProduct, PaintColor } from '@/components/PaintVisualizer/types'

interface UsePaintProductsResult {
  products: PaintProduct[]
  isLoading: boolean
  error: Error | null
}

/**
 * Hook para obtener productos con colores disponibles
 * Extrae productos que tienen variantes con colores o color directo
 */
export function usePaintProducts(): UsePaintProductsResult {
  const [products, setProducts] = useState<PaintProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        setIsLoading(true)
        setError(null)

        // Obtener productos (limitamos a 100 para performance)
        const response = await getProducts({ limit: 100 })

        if (!response.success || !response.data) {
          throw new Error(response.message || 'Error al obtener productos')
        }

        // Procesar productos y extraer colores
        const paintProducts: PaintProduct[] = response.data
          .map((product: ProductWithCategory) => {
            const colorsMap = new Map<string, PaintColor>()

            // Extraer colores de variantes
            if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
              product.variants.forEach((variant: any) => {
                if (variant.color_name && variant.color_name.trim() !== '') {
                  const colorName = variant.color_name.trim()
                  const colorKey = colorName.toLowerCase()

                  if (!colorsMap.has(colorKey)) {
                    // Prioridad: color_hex de la variante > buscar en mapa > default
                    const colorHex =
                      variant.color_hex && variant.color_hex.trim() !== '' && variant.color_hex !== '#000000' && variant.color_hex !== '#FFFFFF'
                        ? variant.color_hex.trim()
                        : getColorHexFromName(colorName)

                    colorsMap.set(colorKey, {
                      name: colorName,
                      hex: colorHex,
                      variantId: variant.id,
                    })
                  }
                }
              })
            }

            // Si no hay variantes pero hay color directo en el producto
            if (colorsMap.size === 0 && product.color && product.color.trim() !== '') {
              const colorHex = getColorHexFromName(product.color.trim())
              colorsMap.set(product.color.toLowerCase(), {
                name: product.color.trim(),
                hex: colorHex,
              })
            }

            // Si hay colores, crear el producto para paint visualizer
            if (colorsMap.size > 0) {
              // Usar getProductImage para obtener la imagen correctamente
              const productImage = getProductImage(product.images, product) || product.image || undefined
              
              return {
                id: product.id,
                name: product.name || product.title || 'Producto sin nombre',
                brand: product.brand,
                image: productImage,
                colors: Array.from(colorsMap.values()),
              }
            }

            return null
          })
          .filter((product): product is PaintProduct => product !== null)

        setProducts(paintProducts)
      } catch (err) {
        console.error('Error en usePaintProducts:', err)
        setError(err instanceof Error ? err : new Error('Error desconocido'))
        setProducts([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [])

  return { products, isLoading, error }
}

