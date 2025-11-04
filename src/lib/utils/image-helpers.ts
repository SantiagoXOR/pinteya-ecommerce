// ===================================
// PINTEYA E-COMMERCE - HELPERS DE IMÁGENES
// ===================================

/**
 * Extrae la primera imagen válida de un producto, manejando múltiples formatos
 * @param images - Campo images del producto (puede ser array u objeto)
 * @returns URL de la primera imagen o placeholder
 */
export function getProductImage(images: any): string {
  if (!images) return '/images/products/placeholder.svg'
  
  // Caso 1: Array simple de strings ["url1", "url2"]
  if (Array.isArray(images)) {
    const firstImage = images[0]
    if (typeof firstImage === 'string' && firstImage.trim()) {
      return firstImage.trim()
    }
    // Array de objetos con url o image_url
    if (firstImage && typeof firstImage === 'object') {
      return firstImage.url || firstImage.image_url || '/images/products/placeholder.svg'
    }
    return '/images/products/placeholder.svg'
  }
  
  // Caso 2: Objeto con estructura {previews, thumbnails, main, gallery}
  if (typeof images === 'object') {
    const candidates = [
      images.previews?.[0],
      images.thumbnails?.[0],
      images.main,
      images.gallery?.[0]
    ]
    
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim()
      }
    }
  }
  
  return '/images/products/placeholder.svg'
}

/**
 * Valida y sanitiza una URL de imagen
 * También detecta y corrige URLs de Supabase malformadas
 * @param imageUrl - URL de imagen a validar
 * @returns URL válida o placeholder
 */
export function getValidImageUrl(imageUrl: string | undefined | null): string {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return '/images/products/placeholder.svg'
  }
  
  const trimmed = imageUrl.trim()
  
  // 🛡️ PROTECCIÓN: Detectar y corregir hostname incorrecto de Supabase
  // Este problema puede ocurrir por extensiones del navegador o errores de red
  const incorrectHostname = 'aaklgwkpb.supabase.co'
  const correctHostname = 'aakzspzfulgftqlgwkpb.supabase.co'
  
  if (trimmed.includes(incorrectHostname)) {
    const correctedUrl = trimmed.replace(incorrectHostname, correctHostname)
    
    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getValidImageUrl] URL malformada detectada y corregida:', {
        original: trimmed,
        corrected: correctedUrl,
        issue: 'hostname_truncado'
      })
    }
    
    return correctedUrl
  }
  
  // Verificar que sea una URL válida
  try {
    new URL(trimmed)
    return trimmed
  } catch {
    return '/images/products/placeholder.svg'
  }
}

