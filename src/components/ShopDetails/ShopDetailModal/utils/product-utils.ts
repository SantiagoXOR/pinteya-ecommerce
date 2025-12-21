/**
 * Utilidades para manejo de productos en ShopDetailModal
 * Reutiliza getColorHexFromName de ProductCard para evitar duplicación
 */

import { getColorHexFromName } from '@/components/ui/product-card-commercial/utils/color-utils'
import { ProductVariant } from '@/lib/api/product-variants'
import { ProductGroup } from '@/lib/api/related-products'
import { ProductWithCategory } from '@/types/api'
import { ColorOption, PAINT_COLORS } from '@/components/ui/advanced-color-picker'
import { getColorHex } from '@/utils/product-utils'


/**
 * Detecta la unidad de capacidad efectiva (litros, kg, metros, unidades)
 */
export const detectCapacityUnit = (
  productData: ProductWithCategory | null,
  selectedCapacity: string,
  variants: ProductVariant[],
  relatedProducts: ProductGroup | null,
  productType: { capacityUnit: 'litros' | 'kg' | 'metros' | 'unidades' }
): 'litros' | 'kg' | 'metros' | 'unidades' => {
  const medidaRaw = ((productData as any)?.medida || (productData as any)?.measure || '')
    .toString()
    .trim()

  const nameText = (productData?.name || '').toString()

  const hasKgSignal =
    (!!medidaRaw && /(\b|\s)(kg|kilo|kilos)(\b|\s)/i.test(medidaRaw)) ||
    (nameText && /\b\d+\s?(kg|kilos?)\b/i.test(nameText)) ||
    (selectedCapacity && /kg/i.test(selectedCapacity))

  const hasLSignal =
    (!!medidaRaw && /\b\d+\s?(l|lt|lts|litro|litros)\b/i.test(medidaRaw)) ||
    (nameText && /\b\d+\s?(l|lt|lts|litro|litros)\b/i.test(nameText)) ||
    (selectedCapacity && /l$/i.test(selectedCapacity))

  // Analizar medidas de productos relacionados y variantes para detectar unidad dominante
  let relatedKg = 0,
    relatedL = 0
  try {
    if (relatedProducts?.products) {
      for (const p of relatedProducts.products) {
        const m = ((p as any).measure || (p as any).medida || '').toString()
        if (/\b\d+\s?(kg|kilos?)\b/i.test(m)) relatedKg++
        if (/\b\d+\s?(l|lt|lts|litro|litros)\b/i.test(m) || /l$/i.test(m)) relatedL++
      }
    }
  } catch {}

  let variantsKg = 0,
    variantsL = 0
  try {
    if (Array.isArray(variants) && variants.length > 0) {
      for (const v of variants as any[]) {
        const m = (v?.measure || '').toString()
        if (/\b\d+\s?(kg|kilos?)\b/i.test(m)) variantsKg++
        if (/\b\d+\s?(l|lt|lts|litro|litros)\b/i.test(m) || /l$/i.test(m)) variantsL++
      }
    }
  } catch {}

  // Regla principal: priorizar la unidad del tipo de producto.
  // Si el tipo es 'litros', solo cambiar a 'kg' cuando NO haya señales de litros
  // y sí haya señales consistentes de KG en todas las fuentes.
  if (productType.capacityUnit === 'litros') {
    if (hasLSignal || relatedL > 0 || variantsL > 0) return 'litros' as const
    if (!hasLSignal && (hasKgSignal || relatedKg > 0 || variantsKg > 0) && relatedL === 0 && variantsL === 0) {
      return 'kg' as const
    }
    return 'litros' as const
  }

  // Si el tipo es 'kg', mantener salvo señales fuertes de litros y cero de kg
  if (productType.capacityUnit === 'kg') {
    if ((hasLSignal || relatedL > 0 || variantsL > 0) && !hasKgSignal && relatedKg === 0 && variantsKg === 0) {
      return 'litros' as const
    }
    return 'kg' as const
  }

  // Otros tipos: respetar tipo por defecto
  return productType.capacityUnit
}

/**
 * Extrae colores disponibles desde variantes
 * Reutiliza getColorHexFromName de ProductCard
 */
export const extractAvailableColors = (
  variants: ProductVariant[]
): ColorOption[] => {
  if (!variants || variants.length === 0) return []

  const variantNames = Array.from(
    new Set(
      variants
        .map(v => (v.color_name || '').toString().trim())
        .filter(Boolean)
    )
  )

  const toSlug = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/\s+/g, '-')
      .trim()

  const list: ColorOption[] = []
  for (const name of variantNames) {
    const slug = toSlug(name)
    const found = PAINT_COLORS.find(
      c => c.id === slug || c.name === slug || c.displayName.toLowerCase() === name.toLowerCase()
    )
    if (found) {
      if (!list.find(l => l.id === found.id)) list.push(found)
    } else {
      // Si no se encuentra en PAINT_COLORS, crear uno personalizado
      // Reutilizar getColorHexFromName de ProductCard
      const hexFromMap = getColorHexFromName(name) || getColorHex(name) || '#E5E7EB'
      list.push({
        id: slug,
        name: name.toLowerCase(),
        displayName: name,
        hex: hexFromMap,
        category: '',
        family: 'Personalizados',
        isPopular: false,
        description: `Color ${name}`
      })
    }
  }

  return list
}

/**
 * Extrae capacidades disponibles desde variantes
 */
export const extractAvailableCapacities = (
  variants: ProductVariant[]
): string[] => {
  if (!variants || variants.length === 0) return []

  const variantMeasures = variants
    .map(v => v.measure)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i) // unique

  if (variantMeasures.length === 0) return []

  // Normalizar a mayúsculas y ordenar
  return variantMeasures
    .map(c => c.toUpperCase())
    .sort((a, b) => parseInt(a) - parseInt(b))
}

/**
 * Extrae TODOS los finishes únicos desde variantes (sin filtrar por color)
 * Esto permite mostrar todas las opciones pero deshabilitar las no disponibles
 */
export const extractAvailableFinishes = (
  variants: ProductVariant[]
): string[] => {
  if (!variants || variants.length === 0) return []

  const finishes = variants
    .map(v => v.finish)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i) // unique

  return finishes as string[]
}

/**
 * Determina qué finishes están disponibles para un color específico
 * selectedColor puede ser un color.id (string) o un hex (string)
 * 
 * IMPORTANTE: Para productos impregnantes (excepto Sintético Converlux),
 * todos los colores tienen los mismos finishes disponibles.
 */
export const getFinishesForColor = (
  variants: ProductVariant[],
  selectedColor: string | null | undefined,
  availableColors?: ColorOption[],
  productName?: string,
  productId?: number | string
): string[] => {
  if (!variants || variants.length === 0) return []

  // Detectar si es Sintético Converlux (tiene lógica especial)
  const isSinteticoConverlux = 
    productId === 34 || 
    productId === '34' || 
    (productName && productName.toLowerCase().includes('sintético converlux'))

  // Detectar si es un producto impregnante (Danzke, New House, etc.)
  const isImpregnante = productName && (
    productName.toLowerCase().includes('impregnante') ||
    productName.toLowerCase().includes('danzke') ||
    productName.toLowerCase().includes('new house')
  ) && !isSinteticoConverlux

  // Para impregnantes (excepto Sintético Converlux): todos los colores tienen los mismos finishes
  if (isImpregnante) {
    const allFinishes = variants
      .map(v => v.finish)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i) // unique
    return allFinishes as string[]
  }

  // Para Sintético Converlux: solo BLANCO y NEGRO tienen múltiples finishes
  if (isSinteticoConverlux && selectedColor && typeof selectedColor === 'string') {
    // Buscar el nombre del color seleccionado
    let targetHex: string | null = null
    let targetName: string | null = null
    
    if (availableColors && Array.isArray(availableColors) && availableColors.length > 0) {
      const foundColor = availableColors.find(c => c.id === selectedColor || c.hex === selectedColor)
      if (foundColor) {
        targetHex = foundColor.hex
        targetName = foundColor.displayName || foundColor.name
      }
    }
    
    if (!targetHex && typeof selectedColor === 'string' && selectedColor.startsWith('#')) {
      targetHex = selectedColor
    }

    const selectedColorName = variants.find(v => {
      if (targetHex) {
        const variantHex = v.color_hex || getColorHexFromName(v.color_name || '')
        return variantHex === targetHex
      }
      return false
    })?.color_name

    // Si el color es BLANCO o NEGRO, mostrar todos sus finishes disponibles
    if (selectedColorName && (selectedColorName.toUpperCase() === 'BLANCO' || selectedColorName.toUpperCase() === 'NEGRO')) {
      const finishesForColor = variants
        .filter(v => {
          const variantHex = v.color_hex || getColorHexFromName(v.color_name || '')
          return variantHex === targetHex
        })
        .map(v => v.finish)
        .filter((finish): finish is string => Boolean(finish))
      
      return Array.from(new Set(finishesForColor))
    } else {
      // Para otros colores, solo "Brillante" está disponible
      return ['Brillante']
    }
  }

  // Para otros productos: filtrar finishes por color seleccionado
  if (!selectedColor || typeof selectedColor !== 'string') {
    // Si no hay color seleccionado, devolver todos los finishes únicos
    const allFinishes = variants
      .map(v => v.finish)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i) // unique
    return allFinishes as string[]
  }

  // Intentar obtener el hex del color seleccionado
  let targetHex: string | null = null
  let targetName: string | null = null
  
  if (availableColors && Array.isArray(availableColors) && availableColors.length > 0) {
    const foundColor = availableColors.find(c => c.id === selectedColor || c.hex === selectedColor)
    if (foundColor) {
      targetHex = foundColor.hex
      targetName = foundColor.displayName || foundColor.name
    }
  }
  
  // Si no se encontró, tratar selectedColor como hex (solo si es un string válido que empieza con #)
  if (!targetHex && typeof selectedColor === 'string' && selectedColor.startsWith('#')) {
    targetHex = selectedColor
  }

  // Buscar variantes que coincidan con el color seleccionado
  const filteredVariants = variants.filter(v => {
    // Si tenemos hex objetivo, comparar
    if (targetHex) {
      // Comparación por hex directo de la variante
      if (v.color_hex === targetHex) return true
      
      // Comparación por hex derivado del nombre de la variante
      if (v.color_name) {
        const variantHex = getColorHexFromName(v.color_name)
        if (variantHex === targetHex) return true
      }
    }
    
    // Comparación por nombre del color (normalizado)
    if (v.color_name && targetName) {
      const variantName = v.color_name.trim().toUpperCase()
      const targetNameUpper = targetName.trim().toUpperCase()
      if (variantName === targetNameUpper) return true
    }
    
    // Comparación directa por nombre cuando selectedColor es un id conocido
    if (v.color_name) {
      const variantName = v.color_name.trim().toUpperCase()
      const selectedUpper = selectedColor.trim().toUpperCase()
      
      // Casos especiales para NEGRO y BLANCO
      if ((selectedUpper === 'NEGRO' || selectedUpper === 'BLACK' || selectedUpper.includes('negro')) && 
          (variantName === 'NEGRO' || variantName === 'BLACK')) {
        return true
      }
      if ((selectedUpper === 'BLANCO' || selectedUpper === 'WHITE' || selectedUpper.includes('blanco')) && 
          (variantName === 'BLANCO' || variantName === 'WHITE')) {
        return true
      }
      
      // Comparación por hex conocido
      if (targetHex) {
        // NEGRO
        if ((targetHex === '#000000' || targetHex.toLowerCase() === '#000000') && 
            (variantName === 'NEGRO' || variantName === 'BLACK')) {
          return true
        }
        // BLANCO
        if ((targetHex === '#F5F5F5' || targetHex === '#FFFFFF' || 
             targetHex.toLowerCase() === '#f5f5f5' || targetHex.toLowerCase() === '#ffffff') && 
            (variantName === 'BLANCO' || variantName === 'WHITE')) {
          return true
        }
      }
    }
    
    return false
  })

  const finishes = filteredVariants
    .map(v => v.finish)
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i) // unique

  return finishes as string[]
}

