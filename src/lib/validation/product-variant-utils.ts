/**
 * Utilidades para validar y limpiar campos de productos con variantes
 * 
 * Regla de negocio: Cuando un producto tiene variantes activas, los siguientes
 * campos del producto principal deben ser NULL ya que se definen en las variantes:
 * - price
 * - discounted_price
 * - stock
 * - color
 * - medida
 * - terminaciones
 */

import { supabaseAdmin } from '@/lib/integrations/supabase'

/**
 * Campos que deben ser limpiados cuando un producto tiene variantes
 */
const VARIANT_EXCLUSIVE_FIELDS = [
  'price',
  'discounted_price',
  'stock',
  'color',
  'medida',
  'terminaciones',
] as const

type VariantExclusiveField = typeof VARIANT_EXCLUSIVE_FIELDS[number]

/**
 * Verifica si un producto tiene variantes activas
 * @param productId - ID del producto
 * @returns true si el producto tiene al menos una variante activa
 */
export async function hasActiveVariants(productId: number): Promise<boolean> {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .select('id')
      .eq('product_id', productId)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error checking for active variants:', error)
      return false
    }

    // Si data existe, significa que hay al menos una variante activa
    // Si data es null, no hay variantes activas
    return data !== null
  } catch (error) {
    console.error('Error in hasActiveVariants:', error)
    return false
  }
}

/**
 * Limpia campos inconsistentes de un objeto de datos de producto cuando tiene variantes
 * @param data - Datos del producto
 * @param hasVariants - Si el producto tiene variantes activas
 * @returns Datos limpios con campos inconsistentes establecidos a null
 */
export function cleanProductFieldsForVariants<T extends Record<string, any>>(
  data: T,
  hasVariants: boolean
): T {
  if (!hasVariants) {
    // Si no hay variantes, no hay que limpiar nada
    return data
  }

  const cleaned = { ...data }

  // Limpiar campos exclusivos de variantes
  for (const field of VARIANT_EXCLUSIVE_FIELDS) {
    if (field in cleaned) {
      // Establecer a null según el tipo
      if (field === 'terminaciones' && Array.isArray(cleaned[field])) {
        cleaned[field] = null as any
      } else if (field === 'price' || field === 'discounted_price') {
        cleaned[field] = null as any
      } else if (field === 'stock') {
        cleaned[field] = null as any
      } else if (field === 'color' || field === 'medida') {
        cleaned[field] = null as any
      } else {
        cleaned[field] = null as any
      }
    }
  }

  return cleaned
}

/**
 * Valida que los datos de producto no contengan campos inconsistentes cuando tiene variantes
 * @param data - Datos del producto a validar
 * @param hasVariants - Si el producto tiene variantes activas
 * @returns Objeto con validación y lista de errores
 */
export function validateProductDataForVariants(
  data: Record<string, any>,
  hasVariants: boolean
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!hasVariants) {
    // Si no hay variantes, no hay errores
    return { valid: true, errors: [] }
  }

  // Verificar cada campo exclusivo de variantes
  for (const field of VARIANT_EXCLUSIVE_FIELDS) {
    const value = data[field]

    // Verificar si el campo tiene un valor que debería ser null
    if (value !== null && value !== undefined) {
      // Validaciones específicas por tipo
      if (field === 'price' || field === 'discounted_price') {
        if (typeof value === 'number' && value > 0) {
          errors.push(
            `El campo ${field} no debe estar definido cuando el producto tiene variantes. Debe ser null.`
          )
        }
      } else if (field === 'stock') {
        if (typeof value === 'number' && value > 0) {
          errors.push(
            `El campo ${field} no debe estar definido cuando el producto tiene variantes. Debe ser null.`
          )
        }
      } else if (field === 'color' || field === 'medida') {
        if (typeof value === 'string' && value.trim() !== '') {
          errors.push(
            `El campo ${field} no debe estar definido cuando el producto tiene variantes. Debe ser null.`
          )
        }
      } else if (field === 'terminaciones') {
        if (Array.isArray(value) && value.length > 0) {
          errors.push(
            `El campo ${field} no debe estar definido cuando el producto tiene variantes. Debe ser null.`
          )
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Limpia automáticamente los campos de un producto basándose en si tiene variantes activas
 * @param productId - ID del producto (opcional, solo para verificar variantes)
 * @param data - Datos del producto a limpiar
 * @returns Datos limpios
 */
export async function cleanProductFieldsIfHasVariants<T extends Record<string, any>>(
  productId: number | undefined,
  data: T
): Promise<T> {
  if (!productId) {
    // Si no hay productId, asumimos que es un producto nuevo sin variantes
    return data
  }

  const hasVariants = await hasActiveVariants(productId)
  return cleanProductFieldsForVariants(data, hasVariants)
}

/**
 * Obtiene la lista de campos que deben ser limpiados cuando hay variantes
 */
export function getVariantExclusiveFields(): readonly VariantExclusiveField[] {
  return VARIANT_EXCLUSIVE_FIELDS
}
