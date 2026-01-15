/**
 * Utilidades para manejo de aikon_id
 * 
 * Este módulo proporciona funciones para formatear, validar y parsear
 * códigos aikon_id que son números enteros de 6 dígitos (0-999999).
 */

/**
 * Formatea un número a string de 6 dígitos con ceros a la izquierda
 * 
 * @param aikonId - Número entero entre 0 y 999999
 * @returns String formateado con 6 dígitos (ej: 141 -> "000141")
 * @throws Error si el número está fuera del rango válido
 * 
 * @example
 * formatAikonId(141) // "000141"
 * formatAikonId(1) // "000001"
 * formatAikonId(999999) // "999999"
 */
export function formatAikonId(aikonId: number | null | undefined): string | null {
  if (aikonId === null || aikonId === undefined) {
    return null
  }

  if (!validateAikonIdRange(aikonId)) {
    throw new Error(`aikon_id debe estar en el rango 0-999999. Valor recibido: ${aikonId}`)
  }

  return aikonId.toString().padStart(6, '0')
}

/**
 * Parsea un string o número a integer válido
 * 
 * @param aikonId - String o número que representa un aikon_id
 * @returns Número entero válido o null si no se puede parsear
 * 
 * @example
 * parseAikonId("141") // 141
 * parseAikonId("000141") // 141
 * parseAikonId(141) // 141
 * parseAikonId("abc") // null
 */
export function parseAikonId(aikonId: string | number | null | undefined): number | null {
  if (aikonId === null || aikonId === undefined) {
    return null
  }

  // Si ya es un número, validar y retornar
  if (typeof aikonId === 'number') {
    return validateAikonIdRange(aikonId) ? aikonId : null
  }

  // Si es string, limpiar y convertir
  if (typeof aikonId === 'string') {
    // Eliminar espacios y caracteres no numéricos
    const cleaned = aikonId.trim().replace(/[^0-9]/g, '')
    
    if (cleaned === '') {
      return null
    }

    const parsed = parseInt(cleaned, 10)
    
    if (isNaN(parsed)) {
      return null
    }

    return validateAikonIdRange(parsed) ? parsed : null
  }

  return null
}

/**
 * Valida que un número esté en el rango válido (0-999999)
 * 
 * @param aikonId - Número a validar
 * @returns true si está en el rango válido, false en caso contrario
 * 
 * @example
 * validateAikonIdRange(141) // true
 * validateAikonIdRange(1000000) // false
 * validateAikonIdRange(-1) // false
 */
export function validateAikonIdRange(aikonId: number): boolean {
  return Number.isInteger(aikonId) && aikonId >= 0 && aikonId <= 999999
}

/**
 * Obtiene el aikon_id correcto según si el producto tiene variantes
 * 
 * @param product - Producto con posible aikon_id
 * @param variants - Array de variantes del producto
 * @returns El aikon_id del producto o de la variante predeterminada, o null
 * 
 * @example
 * getProductAikonId({ aikon_id: 141 }, []) // 141
 * getProductAikonId({ aikon_id: null }, [{ aikon_id: 142, is_default: true }]) // 142
 */
export function getProductAikonId(
  product: { aikon_id?: number | null },
  variants: Array<{ aikon_id: number; is_default?: boolean }> = []
): number | null {
  // Si el producto tiene aikon_id, usarlo
  if (product.aikon_id !== null && product.aikon_id !== undefined) {
    return product.aikon_id
  }

  // Si tiene variantes, usar el aikon_id de la variante predeterminada
  if (variants.length > 0) {
    const defaultVariant = variants.find(v => v.is_default) || variants[0]
    return defaultVariant?.aikon_id ?? null
  }

  return null
}

/**
 * Obtiene todos los aikon_id de las variantes
 * 
 * @param variants - Array de variantes
 * @returns Array de números aikon_id
 * 
 * @example
 * getAllVariantAikonIds([
 *   { aikon_id: 141, is_default: true },
 *   { aikon_id: 142, is_default: false }
 * ]) // [141, 142]
 */
export function getAllVariantAikonIds(
  variants: Array<{ aikon_id: number }> = []
): number[] {
  return variants
    .map(v => v.aikon_id)
    .filter((id): id is number => id !== null && id !== undefined)
}

/**
 * Valida que el producto tenga aikon_id si no tiene variantes
 * 
 * @param product - Producto a validar
 * @param variants - Array de variantes del producto
 * @returns true si es válido, false en caso contrario
 * 
 * @example
 * validateAikonIdRequired({ aikon_id: 141 }, []) // true
 * validateAikonIdRequired({ aikon_id: null }, []) // false
 * validateAikonIdRequired({ aikon_id: null }, [{ aikon_id: 141 }]) // true
 */
export function validateAikonIdRequired(
  product: { aikon_id?: number | null },
  variants: Array<{ aikon_id: number }> = []
): boolean {
  // Si tiene variantes, no es necesario que el producto tenga aikon_id
  if (variants.length > 0) {
    return true
  }

  // Si no tiene variantes, debe tener aikon_id
  return product.aikon_id !== null && product.aikon_id !== undefined
}

/**
 * Formatea un array de aikon_id a strings de 6 dígitos
 * 
 * @param aikonIds - Array de números aikon_id
 * @returns Array de strings formateados
 * 
 * @example
 * formatAikonIdArray([141, 142, 1]) // ["000141", "000142", "000001"]
 */
export function formatAikonIdArray(
  aikonIds: (number | null | undefined)[]
): string[] {
  return aikonIds
    .map(id => formatAikonId(id))
    .filter((formatted): formatted is string => formatted !== null)
}

/**
 * Obtiene el aikon_id formateado del producto o variantes
 * 
 * @param product - Producto con posible aikon_id
 * @param variants - Array de variantes del producto
 * @returns String formateado con 6 dígitos o null
 */
export function getProductAikonIdFormatted(
  product: { aikon_id?: number | null },
  variants: Array<{ aikon_id: number; is_default?: boolean }> = []
): string | null {
  const aikonId = getProductAikonId(product, variants)
  return formatAikonId(aikonId)
}

/**
 * Obtiene todos los aikon_id formateados de las variantes
 * 
 * @param variants - Array de variantes
 * @returns Array de strings formateados con 6 dígitos
 */
export function getAllVariantAikonIdsFormatted(
  variants: Array<{ aikon_id: number }> = []
): string[] {
  const aikonIds = getAllVariantAikonIds(variants)
  return formatAikonIdArray(aikonIds)
}
