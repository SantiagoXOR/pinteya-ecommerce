// =====================================================
// TENANT ASSETS HELPER
// Descripción: Helper para obtener URLs de assets desde Supabase Storage
// Uso: Client-side y Server-side
// =====================================================

import type { TenantPublicConfig } from './types'

const BUCKET_NAME = 'tenant-assets'

/**
 * Obtiene la URL de Supabase Storage para un asset del tenant
 * Si no hay tenant, retorna el fallback local
 * 
 * @param tenant - Configuración del tenant (puede ser null)
 * @param assetPath - Ruta relativa del asset (ej: 'icons/icon-envio.svg', 'promo/help.webp')
 * @param fallback - Ruta de fallback local si no hay tenant o Supabase falla (opcional)
 * @returns URL de Supabase Storage o fallback local
 * 
 * @example
 * ```ts
 * const iconPath = getTenantAssetPath(tenant, 'icons/icon-envio.svg', '/images/icons/icon-envio.svg')
 * // Retorna: URL de Supabase Storage o '/images/icons/icon-envio.svg' si no hay tenant
 * ```
 */
export function getTenantAssetPath(
  tenant: TenantPublicConfig | null | undefined,
  assetPath: string,
  fallback?: string
): string {
  // Si no hay tenant, usar fallback local o asset genérico
  if (!tenant || !tenant.slug) {
    return fallback || `/images/${assetPath}`
  }

  // Generar URL de Supabase Storage
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    // Si no hay URL de Supabase configurada, usar fallback local
    return fallback || `/tenants/${tenant.slug}/${assetPath}`
  }

  // Construir path para Supabase Storage: tenants/{slug}/{assetPath}
  const storagePath = `tenants/${tenant.slug}/${assetPath}`
  
  // URL pública de Supabase Storage
  const supabaseUrl_full = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${storagePath}`

  // Retornar URL de Supabase (el componente manejará fallback con onError si falla)
  return supabaseUrl_full
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
 * @returns Ruta del asset del tenant
 */
export function getTenantPromoAsset(
  tenant: TenantPublicConfig | null | undefined,
  promoAssetName: string,
  supabaseFallback?: string
): string {
  return getTenantAssetPath(tenant, `promo/${promoAssetName}`)
}

/**
 * Obtiene la URL de Supabase Storage para un asset de promoción y su fallback local.
 * Para usar en <img> con onError: (e) => { (e.target as HTMLImageElement).src = fallback }
 *
 * @param tenant - Configuración del tenant
 * @param promoAssetName - Nombre del asset (ej: 'help.webp', 'calculator.webp', '30-off.webp')
 * @param localFallback - Ruta local de fallback si Supabase falla
 * @returns { src, fallback }
 */
export function getTenantPromoAssetWithFallback(
  tenant: TenantPublicConfig | null | undefined,
  promoAssetName: string,
  localFallback: string
): { src: string; fallback: string } {
  // src será URL de Supabase Storage (o local si no hay tenant)
  const src = getTenantAssetPath(tenant, `promo/${promoAssetName}`, localFallback)
  
  // fallback será la ruta local
  const fallback = localFallback || `/tenants/${tenant?.slug || 'pinteya'}/promo/${promoAssetName}`
  
  return {
    src,
    fallback,
  }
}
