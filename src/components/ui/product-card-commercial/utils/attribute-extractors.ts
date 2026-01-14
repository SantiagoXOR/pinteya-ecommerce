/**
 * Funciones compartidas para extraer atributos de variantes
 * Centraliza lógica común de extracción de colores, medidas y finishes
 */

import { getColorHexFromName } from './color-utils'
import { extractUniqueMeasures } from './measure-utils'
import type { ProductVariant, ColorData } from '../types'
import { PAINT_COLORS } from '@/components/ui/advanced-color-picker'

/**
 * Extrae colores únicos de las variantes
 */
export function extractUniqueColors(
  variants: ProductVariant[] | undefined | null,
  fallbackColor?: string | null,
  options?: {
    title?: string
  }
): ColorData[] {
  const { title } = options || {}
  
  if (!variants || variants.length === 0) {
    // Si no hay variantes pero hay color directo del producto, usarlo
    if (fallbackColor && fallbackColor.trim() !== '') {
      const colorName = fallbackColor.trim()
      const colorHex = getColorHexFromName(colorName)
      return [{ name: colorName, hex: colorHex }]
    }
    return []
  }

  const colorGroups = new Map<string, ColorData>()

  variants.forEach(v => {
    if (v.color_name && v.color_name.trim() !== '') {
      const colorName = v.color_name.trim()
      const colorKey = colorName.toLowerCase()

      if (!colorGroups.has(colorKey)) {
        let finalHex: string

        // Prioridad 1: usar color_hex de la variante si está disponible y es válido
        if (v.color_hex && v.color_hex.trim() !== '' && v.color_hex !== '#000000' && v.color_hex !== '#FFFFFF') {
          finalHex = v.color_hex.trim()
        } else {
          // Prioridad 2: buscar en PAINT_COLORS
          const existingColor = PAINT_COLORS.find(c =>
            c.name.toLowerCase() === colorName.toLowerCase() ||
            c.displayName.toLowerCase() === colorName.toLowerCase() ||
            c.id.toLowerCase() === colorName.toLowerCase()
          )

          if (existingColor) {
            finalHex = existingColor.hex
          } else {
            // Prioridad 3: usar el helper para convertir nombre a hex
            finalHex = getColorHexFromName(colorName)
          }
        }

        colorGroups.set(colorKey, {
          name: colorName,
          hex: finalHex,
          finish: v.finish || ''
        })
      }
    }
  })

  const result = Array.from(colorGroups.values())

  // Si no hay colores pero sí hay medidas, agregar "Incoloro" por defecto para otros productos
  // Solo si hay variantes con medidas, no si solo hay color directo
  if (result.length === 0 && variants && variants.length > 0 && variants.some(v => v.measure)) {
    return [{ name: 'Incoloro', hex: 'rgba(245, 245, 245, 0.85)' }]
  }

  return result
}

/**
 * Extrae medidas únicas de las variantes
 * Filtra medidas sin stock disponible
 */
export function extractUniqueMeasuresWithStock(
  variants: ProductVariant[] | undefined | null,
  fallbackMeasure?: string | null
): string[] {
  if (!variants || variants.length === 0) {
    // Si no hay variantes pero hay medida directa del producto, usarla
    if (fallbackMeasure && fallbackMeasure.trim()) {
      let cleanMeasure = fallbackMeasure.trim()
      // Limpiar medida si viene como string de array
      if (cleanMeasure.startsWith('[') && cleanMeasure.endsWith(']')) {
        try {
          const parsed = JSON.parse(cleanMeasure)
          cleanMeasure = Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : fallbackMeasure
        } catch {
          // Si falla el parse, usar la medida original
        }
      }
      return [cleanMeasure]
    }
    return []
  }

  // Extraer todas las medidas únicas primero
  const allMeasures = extractUniqueMeasures(variants)

  // Filtrar medidas que tienen al menos una variante con stock > 0
  // Siempre mostrar todas las medidas con stock disponible, sin importar color/finish seleccionado
  return allMeasures.filter(measure => {
    const matchingVariants = variants.filter(v => v.measure === measure)
    if (matchingVariants.length === 0) return false
    return matchingVariants.some(v => (v.stock ?? 0) > 0)
  })
}

/**
 * Extrae finishes únicos de las variantes
 */
export function extractUniqueFinishes(
  variants: ProductVariant[] | undefined | null
): string[] {
  if (!variants || variants.length === 0) return []

  const finishes = variants
    .map(v => v.finish)
    .filter((finish): finish is string => Boolean(finish))

  return Array.from(new Set(finishes))
}

/**
 * Filtra finishes disponibles según el color seleccionado
 */
export function filterFinishesForColor(
  variants: ProductVariant[] | undefined | null,
  selectedColor: string | undefined | null,
  allFinishes: string[],
  options?: {
    isImpregnante?: boolean
    isSinteticoConverlux?: boolean
    productName?: string
  }
): string[] {
  if (!variants || variants.length === 0) return []
  if (!selectedColor) return allFinishes

  const { isImpregnante = false, isSinteticoConverlux = false } = options || {}

  // Para impregnantes (excepto Sintético Converlux): todos los colores tienen los mismos finishes
  if (isImpregnante && !isSinteticoConverlux) {
    return allFinishes
  }

  // Para Sintético Converlux: solo BLANCO y NEGRO tienen múltiples finishes
  if (isSinteticoConverlux) {
    // Buscar el nombre del color seleccionado
    const selectedColorName = variants.find(v => {
      const variantColorHex = v.color_hex || getColorHexFromName(v.color_name || '')
      return variantColorHex === selectedColor
    })?.color_name

    // Si el color es BLANCO o NEGRO, mostrar todos sus finishes disponibles
    // Para otros colores, solo "Brillante" está disponible
    if (selectedColorName && (selectedColorName.toUpperCase() === 'BLANCO' || selectedColorName.toUpperCase() === 'NEGRO')) {
      const finishesForColor = variants
        .filter(v => {
          const variantColorHex = v.color_hex || getColorHexFromName(v.color_name || '')
          return variantColorHex === selectedColor
        })
        .map(v => v.finish)
        .filter((finish): finish is string => Boolean(finish))

      return Array.from(new Set(finishesForColor))
    } else {
      // Para otros colores, solo "Brillante" está disponible
      return ['Brillante']
    }
  }

  // Para otros productos, filtrar finishes disponibles para el color seleccionado
  const finishesForColor = variants
    .filter(v => {
      const variantColorHex = v.color_hex || getColorHexFromName(v.color_name || '')
      return variantColorHex === selectedColor
    })
    .map(v => v.finish)
    .filter((finish): finish is string => Boolean(finish))

  return Array.from(new Set(finishesForColor))
}

/**
 * Detecta si un producto debería tener selector de color
 * Productos como pinceles, lijas, etc. no deberían tener selector de color
 */
export function shouldHaveColorSelector(productName?: string): boolean {
  if (!productName) return true

  const productNameLower = productName.toLowerCase()
  const shouldNotHaveColor =
    productNameLower.includes('pincel') ||
    productNameLower.includes('brocha') ||
    productNameLower.includes('rodillo') ||
    productNameLower.includes('lija') ||
    productNameLower.includes('cinta') ||
    productNameLower.includes('papel') ||
    productNameLower.includes('poximix') ||
    productNameLower.includes('masilla') ||
    productNameLower.includes('enduido')

  return !shouldNotHaveColor
}

/**
 * Detecta si un producto es impregnante
 */
export function isImpregnanteProduct(productName?: string, productId?: number | string): boolean {
  if (!productName) return false

  const isSinteticoConverlux = productId === 34 || productId === '34' ||
    productName.toLowerCase().includes('sintético converlux')

  if (isSinteticoConverlux) return false

  return (
    productName.toLowerCase().includes('impregnante') ||
    productName.toLowerCase().includes('danzke') ||
    productName.toLowerCase().includes('new house')
  )
}

/**
 * Detecta si un producto es Sintético Converlux
 */
export function isSinteticoConverluxProduct(productName?: string, productId?: number | string): boolean {
  if (productId === 34 || productId === '34') return true
  if (productName && productName.toLowerCase().includes('sintético converlux')) return true
  return false
}
