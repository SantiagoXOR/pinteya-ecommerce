/**
 * Hook para manejar la selección de variantes
 * Extrae lógica compleja de selección basada en color, capacidad, finish
 * y selección de productos relacionados cuando no hay variante
 */

import { useState, useEffect, useRef } from 'react'
import { ProductVariant, findVariantByCapacity, getEffectivePrice } from '@/lib/api/product-variants'
import { ProductGroup, RelatedProduct, findProductByMeasure } from '@/lib/api/related-products'
import { findVariantBySelection, normalizeMeasure } from '../utils/variant-utils'

interface UseVariantSelectionOptions {
  variants: ProductVariant[]
  selectedColor: string
  selectedCapacity: string
  selectedFinish: string
  relatedProducts: ProductGroup | null
  hasInitialized: React.MutableRefObject<boolean>
  selectedVariant: ProductVariant | null
  setSelectedVariant: (variant: ProductVariant | null) => void
  setSelectedRelatedProduct: (product: RelatedProduct | null) => void
  smartColors?: any[] // Para logging
}

/**
 * Hook para manejar la selección de variantes
 */
export const useVariantSelection = ({
  variants,
  selectedColor,
  selectedCapacity,
  selectedFinish,
  relatedProducts,
  hasInitialized,
  selectedVariant,
  setSelectedVariant,
  setSelectedRelatedProduct,
  smartColors = [],
}: UseVariantSelectionOptions) => {
  // Seleccionar variante basada en color, capacidad y finish
  useEffect(() => {
    if (selectedCapacity && Array.isArray(variants) && variants.length > 0) {
      // Validar que selectedCapacity no sea string vacío
      if (!selectedCapacity.trim()) {
        console.log('ℹ️ selectedCapacity está vacío, saltando búsqueda de variante')
        return
      }
      
      // Usar la función reutilizada de variant-utils
      const variant = findVariantBySelection(
        variants,
        selectedColor,
        selectedCapacity,
        selectedFinish
      )
      
      setSelectedVariant(variant)
      
      // Al encontrar variante, limpiar producto relacionado para evitar confusión
      if (variant) {
        setSelectedRelatedProduct(null)
        console.log('✅ Variante encontrada:', {
          selectedCapacity,
          selectedColor,
          variantFound: {
            id: variant.id,
            measure: variant.measure,
            color_name: variant.color_name,
            price_list: variant.price_list,
            price_sale: variant.price_sale,
            stock: variant.stock,
          },
          effectivePrice: getEffectivePrice(variant),
        })
      } else {
        if (selectedCapacity && Array.isArray(variants) && variants.length > 0) {
          console.log('⚠️ No se encontró variante para capacidad:', selectedCapacity, 
            '- Disponibles:', variants.map(v => v.measure).filter((v, i, a) => a.indexOf(v) === i))
        }
      }
    }
  }, [selectedCapacity, selectedColor, selectedFinish, variants, setSelectedVariant, setSelectedRelatedProduct])

  // Seleccionar producto relacionado por capacidad cuando no hay variante para esa capacidad
  useEffect(() => {
    // Solo ejecutar después de la inicialización
    if (!hasInitialized.current) return
    
    if (
      selectedCapacity &&
      relatedProducts?.products &&
      relatedProducts.products.length > 0
    ) {
      // Reutilizar normalizeMeasure de ProductCard
      // Verificar si la variante actual corresponde a la capacidad seleccionada
      const variantMatchesCapacity = selectedVariant && 
        (selectedVariant.measure === selectedCapacity || 
         normalizeMeasure(selectedVariant.measure) === normalizeMeasure(selectedCapacity))
      
      // Solo buscar producto relacionado si NO hay variante para esta capacidad específica
      if (!variantMatchesCapacity) {
        const target = normalizeMeasure(selectedCapacity)

        // 1) Intento por medida declarada
        let prod = findProductByMeasure(relatedProducts.products, selectedCapacity)

        // 2) Fallback más estricto: solo comparar campos de medida declarados
        // Evita falsos positivos cuando el nombre del producto contiene otra capacidad
        if (!prod) {
          prod =
            relatedProducts.products.find(p => {
              const m1 = normalizeMeasure((p as any).measure)
              const m2 = normalizeMeasure((p as any).medida)
              return m1 === target || m2 === target
            }) || null
        }

        setSelectedRelatedProduct(prod || null)
        if (prod) {
          console.log('🔗 Producto relacionado por capacidad:', {
            selectedCapacity,
            productId: prod.id,
            measure: (prod as any).measure,
            stock: (prod as any).stock,
            price: (prod as any).discounted_price ?? (prod as any).price,
          })
        } else {
          console.log('🔎 Sin producto relacionado para capacidad:', selectedCapacity)
        }
      } else {
        // Si la variante coincide con la capacidad, limpiar producto relacionado
        setSelectedRelatedProduct(null)
        console.log('✅ Variante existente coincide con capacidad seleccionada')
      }
    }
  }, [selectedCapacity, relatedProducts?.products, selectedVariant, hasInitialized, setSelectedRelatedProduct])

  // Nota: La lógica de selectedWidth se maneja en el componente principal
  // porque requiere acceso a widthToPriceMap y otros estados específicos del modal
}

