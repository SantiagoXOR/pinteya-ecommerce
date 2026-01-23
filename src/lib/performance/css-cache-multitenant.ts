/**
 * MULTITENANT: Sistema de Cache de CSS
 * Fase 4: Optimización Performance Lighthouse
 * 
 * Cache compartido para CSS base, cache específico por tenant para CSS de temas
 */

import { enterpriseCacheSystem, ENTERPRISE_CACHE_CONFIGS } from '@/lib/optimization/enterprise-cache-system'

/**
 * MULTITENANT: Obtener CSS crítico del tenant con cache
 * 
 * @param tenantId - ID del tenant
 * @param tenantConfig - Configuración del tenant (colores, etc.)
 * @returns CSS crítico inline con variables del tenant
 */
export async function getCachedCriticalCSS(
  tenantId: string,
  tenantConfig: {
    primaryColor: string
    primaryDark: string
    accentColor: string
    headerBgColor: string
    gradientStart: string
    gradientEnd: string
  }
): Promise<string> {
  // MULTITENANT: Generar clave de cache basada en tenant y hash de colores
  const configHash = `${tenantConfig.primaryColor}-${tenantConfig.primaryDark}-${tenantConfig.accentColor}`
  const cacheKey = `css:tenant:${tenantId}:critical:${configHash}`

  // MULTITENANT: Intentar obtener del cache
  const cached = await enterpriseCacheSystem.get<string>(
    cacheKey,
    ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA // Reutilizar config de analytics
  )

  if (cached) {
    return cached
  }

  // MULTITENANT: Generar CSS crítico con variables del tenant
  const criticalCSS = generateTenantCriticalCSS(tenantConfig)

  // MULTITENANT: Cachear el CSS (TTL: 1 hora - invalidar cuando tenant cambia colores)
  await enterpriseCacheSystem.set(
    cacheKey,
    criticalCSS,
    {
      ...ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA,
      ttl: 3600, // 1 hora
    }
  )

  return criticalCSS
}

/**
 * MULTITENANT: Generar CSS crítico con variables del tenant
 */
function generateTenantCriticalCSS(tenantConfig: {
  primaryColor: string
  primaryDark: string
  accentColor: string
  headerBgColor: string
  gradientStart: string
  gradientEnd: string
}): string {
  return `
    :root {
      --tenant-primary: ${tenantConfig.primaryColor};
      --tenant-primary-dark: ${tenantConfig.primaryDark};
      --tenant-accent: ${tenantConfig.accentColor};
      --tenant-header-bg: ${tenantConfig.headerBgColor};
      --tenant-gradient-start: ${tenantConfig.gradientStart};
      --tenant-gradient-end: ${tenantConfig.gradientEnd};
    }
  `.trim()
}

/**
 * MULTITENANT: Obtener hash de CSS compartido (base, componentes UI)
 * 
 * @param cssHash - Hash del contenido CSS (generado por build)
 * @returns URL o contenido del CSS compartido con cache
 */
export async function getCachedSharedCSS(cssHash: string): Promise<string | null> {
  const cacheKey = `css:shared:${cssHash}`

  // MULTITENANT: Intentar obtener del cache (TTL largo: 1 año)
  const cached = await enterpriseCacheSystem.get<string>(
    cacheKey,
    {
      ...ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA,
      ttl: 31536000, // 1 año
    }
  )

  return cached
}

/**
 * MULTITENANT: Cachear CSS compartido
 */
export async function setCachedSharedCSS(cssHash: string, cssContent: string): Promise<void> {
  const cacheKey = `css:shared:${cssHash}`

  await enterpriseCacheSystem.set(
    cacheKey,
    cssContent,
    {
      ...ENTERPRISE_CACHE_CONFIGS.ANALYTICS_DATA,
      ttl: 31536000, // 1 año
    }
  )
}

/**
 * MULTITENANT: Invalidar cache de CSS de un tenant específico
 */
export async function invalidateTenantCSSCache(tenantId: string): Promise<void> {
  const pattern = `css:tenant:${tenantId}:*`
  await enterpriseCacheSystem.invalidate(pattern, 'manual')
}

/**
 * MULTITENANT: Invalidar cache de CSS compartido (solo en caso de actualización mayor)
 */
export async function invalidateSharedCSSCache(): Promise<void> {
  const pattern = `css:shared:*`
  await enterpriseCacheSystem.invalidate(pattern, 'manual')
}

/**
 * MULTITENANT: Generar preload tags para CSS crítico compartido
 */
export function generateCSSPreloadTags(cssPaths: string[]): Array<{
  rel: string
  as: string
  href: string
  crossOrigin?: string
}> {
  return cssPaths.map(path => ({
    rel: 'preload',
    as: 'style',
    href: path,
    crossOrigin: 'anonymous',
  }))
}
