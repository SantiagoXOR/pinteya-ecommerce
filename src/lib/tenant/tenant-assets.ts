// =====================================================
// TENANT ASSETS HELPER
// Descripción: Helper para obtener rutas de assets específicos por tenant
// Uso: Client-side y Server-side
// =====================================================

import type { TenantPublicConfig } from './types'

/**
 * Obtiene la ruta de un asset específico del tenant
 * Si el asset no existe para el tenant, retorna el fallback
 * 
 * @param tenant - Configuración del tenant (puede ser null)
 * @param assetPath - Ruta relativa del asset (ej: 'icons/icon-envio.svg', 'promo/help.webp')
 * @param fallback - Ruta de fallback si el asset del tenant no existe (opcional)
 * @returns Ruta completa del asset
 * 
 * @example
 * ```ts
 * const iconPath = getTenantAssetPath(tenant, 'icons/icon-envio.svg', '/images/icons/icon-envio.svg')
 * // Retorna: '/tenants/pinteya/icons/icon-envio.svg' o '/images/icons/icon-envio.svg' si no existe
 * ```
 */
export function getTenantAssetPath(
  tenant: TenantPublicConfig | null | undefined,
  assetPath: string,
  fallback?: string
): string {
  // Si no hay tenant, usar fallback o asset genérico
  if (!tenant || !tenant.slug) {
    return fallback || `/images/${assetPath}`
  }

  // Construir ruta del tenant: /tenants/{slug}/{assetPath}
  const tenantAssetPath = `/tenants/${tenant.slug}/${assetPath}`

  // Si hay fallback, retornar la ruta del tenant (el componente debe manejar el fallback si la imagen falla)
  // Si no hay fallback, retornar la ruta del tenant directamente
  return tenantAssetPath
}

/**
 * Obtiene múltiples rutas de assets del tenant
 * Útil para carruseles o listas de imágenes
 * 
 * @param tenant - Configuración del tenant
 * @param assetPaths - Array de rutas relativas de assets
 * @param fallbackPrefix - Prefijo para fallback (ej: '/images/hero/hero2/')
 * @returns Array de rutas completas de assets
 * 
 * @example
 * ```ts
 * const slides = getTenantAssetPaths(tenant, ['hero1.webp', 'hero2.webp', 'hero3.webp'], '/images/hero/hero2/')
 * ```
 */
export function getTenantAssetPaths(
  tenant: TenantPublicConfig | null | undefined,
  assetPaths: string[],
  fallbackPrefix?: string
): string[] {
  return assetPaths.map(assetPath => {
    const fallback = fallbackPrefix ? `${fallbackPrefix}${assetPath}` : undefined
    return getTenantAssetPath(tenant, assetPath, fallback)
  })
}

/**
 * Obtiene la ruta de un asset de promoción del tenant
 * Helper específico para assets de promoción (help, calculator, 30-off, etc.)
 * 
 * @param tenant - Configuración del tenant
 * @param promoAssetName - Nombre del asset de promoción (ej: 'help.webp', 'calculator.webp')
 * @param supabaseFallback - URL completa de Supabase como fallback (opcional)
 * @returns Ruta del asset o URL de Supabase
 */
export function getTenantPromoAsset(
  tenant: TenantPublicConfig | null | undefined,
  promoAssetName: string,
  supabaseFallback?: string
): string {
  const tenantPath = getTenantAssetPath(tenant, `promo/${promoAssetName}`)
  
  // Si hay fallback de Supabase, retornar la ruta del tenant
  // El componente debe manejar el error y usar el fallback si la imagen falla
  return tenantPath
}
