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
 * Extrae finishes disponibles desde variantes
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

