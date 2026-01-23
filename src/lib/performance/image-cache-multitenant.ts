/**
 * MULTITENANT: Sistema de Cache de Imágenes
 * Fase 3: Optimización Performance Lighthouse
 * 
 * Cache compartido para imágenes de productos, cache específico por tenant para logos/hero
 */

import { enterpriseCacheSystem, ENTERPRISE_CACHE_CONFIGS } from '@/lib/optimization/enterprise-cache-system'

/**
 * MULTITENANT: Obtener URL de imagen optimizada con cache
 * 
 * @param imagePath - Ruta de la imagen
 * @param type - Tipo de imagen: 'product' (compartido) o 'tenant' (específico por tenant)
 * @param tenantId - ID del tenant (requerido para tipo 'tenant')
 * @param size - Tamaño de la imagen (opcional)
 * @returns URL de imagen optimizada
 */
export async function getCachedImageUrl(
  imagePath: string,
  type: 'product' | 'tenant',
  tenantId?: string,
  size?: string
): Promise<string> {
  // MULTITENANT: Generar clave de cache según tipo
  const cacheKey =
    type === 'product'
      ? `image:product:${imagePath}:${size || 'default'}`
      : `image:tenant:${tenantId || 'unknown'}:${imagePath}:${size || 'default'}`

  // MULTITENANT: Intentar obtener del cache
  const cached = await enterpriseCacheSystem.get<string>(
    cacheKey,
    ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA // Reutilizar config de analytics para imágenes
  )

  if (cached) {
    return cached
  }

  // MULTITENANT: Si no está en cache, generar URL optimizada
  // En producción, esto podría usar un servicio de optimización de imágenes
  const optimizedUrl = generateOptimizedImageUrl(imagePath, size)

  // MULTITENANT: Cachear la URL (TTL: 1 hora para tenant, 1 día para productos)
  const ttl = type === 'product' ? 86400 : 3600 // 1 día vs 1 hora
  await enterpriseCacheSystem.set(
    cacheKey,
    optimizedUrl,
    {
      ...ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA,
      ttl,
    }
  )

  return optimizedUrl
}

/**
 * MULTITENANT: Generar URL de imagen optimizada
 * En producción, esto podría usar Vercel Image Optimization o similar
 */
function generateOptimizedImageUrl(imagePath: string, size?: string): string {
  // Si ya es una URL completa, retornarla
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }

  // MULTITENANT: Para imágenes locales, Next.js Image Optimization las maneja automáticamente
  // Solo necesitamos retornar la ruta relativa
  return imagePath
}

/**
 * MULTITENANT: Invalidar cache de imágenes de un tenant específico
 */
export async function invalidateTenantImageCache(tenantId: string): Promise<void> {
  const pattern = `image:tenant:${tenantId}:*`
  await enterpriseCacheSystem.invalidate(pattern, 'manual')
}

/**
 * MULTITENANT: Invalidar cache de imagen de producto (compartido)
 */
export async function invalidateProductImageCache(productId: string | number): Promise<void> {
  const pattern = `image:product:*${productId}*`
  await enterpriseCacheSystem.invalidate(pattern, 'manual')
}

/**
 * MULTITENANT: Preload de imágenes críticas del tenant
 * Usar en <head> para preload de hero images
 */
export function generateImagePreloadTags(
  images: Array<{ src: string; type?: string; fetchPriority?: 'high' | 'low' | 'auto' }>
): Array<{ rel: string; as: string; href: string; fetchPriority?: string; type?: string }> {
  return images.map(image => ({
    rel: 'preload',
    as: 'image',
    href: image.src,
    fetchPriority: image.fetchPriority || 'auto',
    type: image.type || 'image/webp',
  }))
}
