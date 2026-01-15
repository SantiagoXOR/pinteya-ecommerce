/**
 * Utilidades para manejo de slugs de productos
 * 
 * Este módulo proporciona funciones para limpiar, detectar y generar
 * slugs sin timestamps para productos.
 */

/**
 * Detecta si un slug tiene un sufijo de timestamp (13 dígitos)
 * 
 * @param slug - Slug a verificar
 * @returns true si el slug termina con patrón -{13 dígitos}
 * 
 * @example
 * hasTimestampSuffix('producto-1768256189784') // true
 * hasTimestampSuffix('producto-123') // false
 * hasTimestampSuffix('producto') // false
 */
export function hasTimestampSuffix(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false
  }
  
  // Patrón: guion seguido de exactamente 13 dígitos al final
  const timestampPattern = /-\d{13}$/
  return timestampPattern.test(slug)
}

/**
 * Limpia un slug eliminando el sufijo de timestamp si existe
 * 
 * @param slug - Slug a limpiar
 * @returns Slug sin timestamp
 * 
 * @example
 * cleanSlug('sellador-silicona-nuetra-s-500-1768256189784') // 'sellador-silicona-nuetra-s-500'
 * cleanSlug('producto-123') // 'producto-123' (no tiene timestamp, se mantiene)
 * cleanSlug('producto') // 'producto'
 */
export function cleanSlug(slug: string): string {
  if (!slug || typeof slug !== 'string') {
    return slug || ''
  }
  
  // Eliminar sufijo de timestamp si existe
  return slug.replace(/-\d{13}$/, '')
}

/**
 * Genera un slug limpio a partir del nombre del producto
 * 
 * @param name - Nombre del producto
 * @returns Slug limpio sin timestamp
 * 
 * @example
 * generateCleanSlug('Sellador Silicona Nuetra S-500') // 'sellador-silicona-nuetra-s-500'
 * generateCleanSlug('Producto #123') // 'producto-123'
 */
export function generateCleanSlug(name: string): string {
  if (!name || typeof name !== 'string') {
    return ''
  }
  
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Remover guiones múltiples
    .replace(/^-|-$/g, '') // Remover guiones al inicio y final
    .trim()
}

/**
 * Normaliza un slug: limpia timestamp si existe y genera uno nuevo si está vacío
 * 
 * @param slug - Slug actual (puede tener timestamp)
 * @param productName - Nombre del producto (para generar slug si está vacío)
 * @returns Slug normalizado
 * 
 * @example
 * normalizeSlug('producto-1768256189784', 'Producto') // 'producto'
 * normalizeSlug('', 'Producto Nuevo') // 'producto-nuevo'
 * normalizeSlug('producto-ok', 'Producto') // 'producto-ok'
 */
export function normalizeSlug(slug: string | null | undefined, productName?: string): string {
  // Si no hay slug pero hay nombre, generar uno
  if (!slug && productName) {
    return generateCleanSlug(productName)
  }
  
  // Si hay slug, limpiarlo
  if (slug) {
    return cleanSlug(slug)
  }
  
  return ''
}
