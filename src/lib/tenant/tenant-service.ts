// =====================================================
// TENANT SERVICE
// Descripción: Servicio para detección y gestión de tenants
// Uso: Server-side (Server Components, Route Handlers)
// =====================================================

import { cache } from 'react'
import { headers } from 'next/headers'
import { createAdminClient } from './get-admin-client'
import type { TenantConfig, TenantPublicConfig, TenantDBRow } from './types'

// ============================================================================
// CONSTANTES
// ============================================================================

const DEFAULT_TENANT_SLUG = 'pinteya'
const PLATFORM_DOMAIN = 'pintureriadigital.com'

// Colores por defecto (Pinteya)
const DEFAULT_COLORS = {
  primaryColor: '#f27a1d',
  primaryDark: '#bd4811',
  primaryLight: '#f9be78',
  secondaryColor: '#007638', // ⚡ FIX: Verde correcto para Pinteya
  accentColor: '#ffd549', // ⚡ FIX: Amarillo correcto para banner de Pinteya
  backgroundGradientStart: '#000000',
  backgroundGradientEnd: '#eb6313',
  // ⚡ FIX: Blaze Orange (#ea5a17) para header de Pinteya, no el naranja oscuro
  headerBgColor: '#ea5a17',
}

// ============================================================================
// MAPPERS
// ============================================================================

/**
 * Convierte los datos de la DB al formato TenantConfig
 */
function mapDBRowToTenantConfig(row: TenantDBRow): TenantConfig {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    
    subdomain: row.subdomain,
    customDomain: row.custom_domain,
    
    logoUrl: row.logo_url,
    logoDarkUrl: row.logo_dark_url,
    faviconUrl: row.favicon_url,
    
    primaryColor: row.primary_color || DEFAULT_COLORS.primaryColor,
    primaryDark: row.primary_dark || DEFAULT_COLORS.primaryDark,
    primaryLight: row.primary_light || DEFAULT_COLORS.primaryLight,
    secondaryColor: row.secondary_color || DEFAULT_COLORS.secondaryColor,
    accentColor: row.accent_color || DEFAULT_COLORS.accentColor,
    backgroundGradientStart: row.background_gradient_start || DEFAULT_COLORS.backgroundGradientStart,
    backgroundGradientEnd: row.background_gradient_end || DEFAULT_COLORS.backgroundGradientEnd,
    headerBgColor: row.header_bg_color || DEFAULT_COLORS.headerBgColor,
    
    scrollingBannerLocationText: row.scrolling_banner_location_text,
    scrollingBannerShippingText: row.scrolling_banner_shipping_text,
    scrollingBannerLocationBgColor: row.scrolling_banner_location_bg_color,
    scrollingBannerShippingBgColor: row.scrolling_banner_shipping_bg_color,
    
    themeConfig: row.theme_config || { borderRadius: '0.5rem', fontFamily: 'Plus Jakarta Sans' },
    
    ga4MeasurementId: row.ga4_measurement_id,
    ga4PropertyId: row.ga4_property_id,
    googleMerchantId: row.google_merchant_id,
    googleSiteVerification: row.google_site_verification,
    
    metaPixelId: row.meta_pixel_id,
    metaAccessToken: row.meta_access_token,
    metaAdAccountId: row.meta_ad_account_id,
    metaCatalogId: row.meta_catalog_id,
    
    mercadopagoAccessToken: row.mercadopago_access_token,
    mercadopagoPublicKey: row.mercadopago_public_key,
    mercadopagoWebhookSecret: row.mercadopago_webhook_secret,
    
    resendApiKey: row.resend_api_key,
    fromEmail: row.from_email,
    supportEmail: row.support_email,
    
    whatsappNumber: row.whatsapp_number,
    whatsappMessageTemplate: row.whatsapp_message_template,
    
    siteTitle: row.site_title,
    siteDescription: row.site_description,
    siteKeywords: row.site_keywords || [],
    ogImageUrl: row.og_image_url,
    
    socialLinks: row.social_links || { facebook: null, instagram: null, twitter: null, youtube: null },
    
    contactPhone: row.contact_phone,
    contactAddress: row.contact_address,
    contactCity: row.contact_city,
    contactProvince: row.contact_province,
    contactPostalCode: row.contact_postal_code,
    contactCountry: row.contact_country || 'Argentina',
    
    currency: row.currency || 'ARS',
    timezone: row.timezone || 'America/Argentina/Buenos_Aires',
    locale: row.locale || 'es_AR',
    
    businessHours: row.business_hours || {},
    
    isActive: row.is_active,
  }
}

/**
 * Extrae solo datos públicos del TenantConfig (sin secrets)
 */
function extractPublicConfig(config: TenantConfig): TenantPublicConfig {
  return {
    id: config.id,
    slug: config.slug,
    name: config.name,
    subdomain: config.subdomain,
    customDomain: config.customDomain,
    logoUrl: config.logoUrl,
    logoDarkUrl: config.logoDarkUrl,
    faviconUrl: config.faviconUrl,
    primaryColor: config.primaryColor,
    primaryDark: config.primaryDark,
    primaryLight: config.primaryLight,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
    backgroundGradientStart: config.backgroundGradientStart,
    backgroundGradientEnd: config.backgroundGradientEnd,
    headerBgColor: config.headerBgColor,
    scrollingBannerLocationText: config.scrollingBannerLocationText,
    scrollingBannerShippingText: config.scrollingBannerShippingText,
    scrollingBannerLocationBgColor: config.scrollingBannerLocationBgColor,
    scrollingBannerShippingBgColor: config.scrollingBannerShippingBgColor,
    themeConfig: config.themeConfig,
    ga4MeasurementId: config.ga4MeasurementId,
    metaPixelId: config.metaPixelId,
    whatsappNumber: config.whatsappNumber,
    whatsappMessageTemplate: config.whatsappMessageTemplate,
    siteTitle: config.siteTitle,
    siteDescription: config.siteDescription,
    siteKeywords: config.siteKeywords,
    ogImageUrl: config.ogImageUrl,
    socialLinks: config.socialLinks,
    contactPhone: config.contactPhone,
    supportEmail: config.supportEmail,
    contactAddress: config.contactAddress,
    contactCity: config.contactCity,
    contactProvince: config.contactProvince,
    currency: config.currency,
    locale: config.locale,
    businessHours: config.businessHours,
  }
}

// ============================================================================
// DETECCIÓN DE TENANT
// ============================================================================

/**
 * Detecta el slug del tenant a partir del hostname
 * 
 * Ejemplos:
 * - pinteya.pintureriadigital.com → 'pinteya'
 * - www.pinteya.com → busca por custom_domain
 * - localhost:3000 → 'pinteya' (default)
 * - En desarrollo: puede usar NEXT_PUBLIC_TENANT_SLUG para forzar un tenant
 */
function detectTenantFromHost(hostname: string): { subdomain: string | null; customDomain: string | null } {
  // Remover puerto si existe
  const host = hostname.split(':')[0]
  
  // ⚡ DESARROLLO: Permitir forzar tenant con variable de entorno
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_TENANT_SLUG) {
    const forcedSlug = process.env.NEXT_PUBLIC_TENANT_SLUG
    console.log(`[TenantService] 🔧 DESARROLLO: Forzando tenant desde NEXT_PUBLIC_TENANT_SLUG: ${forcedSlug}`)
    return { subdomain: forcedSlug, customDomain: null }
  }
  
  // Localhost → tenant por defecto
  if (host === 'localhost' || host === '127.0.0.1') {
    return { subdomain: DEFAULT_TENANT_SLUG, customDomain: null }
  }
  
  // *.pintureriadigital.com → extraer subdominio
  if (host.endsWith(`.${PLATFORM_DOMAIN}`)) {
    const subdomain = host.replace(`.${PLATFORM_DOMAIN}`, '')
    // Ignorar subdominios especiales
    if (subdomain === 'www' || subdomain === 'admin' || subdomain === 'api') {
      return { subdomain: DEFAULT_TENANT_SLUG, customDomain: null }
    }
    return { subdomain, customDomain: null }
  }
  
  // pintureriadigital.com sin subdominio → landing o default
  if (host === PLATFORM_DOMAIN || host === `www.${PLATFORM_DOMAIN}`) {
    return { subdomain: DEFAULT_TENANT_SLUG, customDomain: null }
  }
  
  // Dominio personalizado (ej: www.pinteya.com)
  return { subdomain: null, customDomain: host }
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Obtiene el tenant desde la base de datos por subdomain o custom_domain
 */
async function fetchTenantFromDB(
  subdomain: string | null,
  customDomain: string | null
): Promise<TenantDBRow | null> {
  // ⚠️ REMOVIDO: Requests a 127.0.0.1:7242 causaban popup de acceso a red local en producción
  // Estos logs de debugging solo deben ejecutarse en desarrollo local, no en producción
  const supabase = createAdminClient()
  let query = supabase
    .from('tenants')
    .select('*')
    .eq('is_active', true)
  
  if (subdomain) {
    query = query.eq('subdomain', subdomain)
  } else if (customDomain) {
    // Buscar por coincidencia exacta
    // Si el dominio es www.pinteya.com.ar, también buscar www.pinteya.com
    // Si el dominio es www.pintemas.com.ar, también buscar www.pintemas.com
    // Esto permite que ambos dominios funcionen con el mismo tenant
    if (customDomain === 'www.pintemas.com.ar' || customDomain === 'pintemas.com.ar') {
      // Buscar por cualquiera de los dos dominios usando OR
      query = query.or('custom_domain.eq.www.pintemas.com,custom_domain.eq.www.pintemas.com.ar')
    } else if (customDomain === 'www.pintemas.com' || customDomain === 'pintemas.com') {
      // Buscar por www.pintemas.com (principal) o www.pintemas.com.ar
      query = query.or('custom_domain.eq.www.pintemas.com,custom_domain.eq.www.pintemas.com.ar')
    } else if (customDomain === 'www.pinteya.com.ar' || customDomain === 'pinteya.com.ar') {
      // Buscar por cualquiera de los dos dominios usando OR
      query = query.or('custom_domain.eq.www.pinteya.com,custom_domain.eq.www.pinteya.com.ar')
    } else if (customDomain === 'www.pinteya.com' || customDomain === 'pinteya.com') {
      // Buscar por www.pinteya.com (principal) o www.pinteya.com.ar
      query = query.or('custom_domain.eq.www.pinteya.com,custom_domain.eq.www.pinteya.com.ar')
    } else {
      query = query.eq('custom_domain', customDomain)
    }
  } else {
    // Fallback al tenant por defecto
    query = query.eq('slug', DEFAULT_TENANT_SLUG)
  }
  
  const { data, error } = await query.single()
  // ⚠️ REMOVIDO: Requests a 127.0.0.1:7242 causaban popup de acceso a red local en producción
  
  if (error || !data) {
    console.warn(`[TenantService] Tenant not found for subdomain=${subdomain}, customDomain=${customDomain}`)
    return null
  }
  
  return data as TenantDBRow
}

/**
 * Obtiene el tenant por defecto (fallback)
 */
async function fetchDefaultTenant(): Promise<TenantDBRow | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', DEFAULT_TENANT_SLUG)
    .single()
  
  if (error || !data) {
    console.error('[TenantService] Default tenant not found!')
    return null
  }
  
  return data as TenantDBRow
}

declare global {
  var __TENANT_TEST_GET_CONFIG__: (() => Promise<TenantConfig>) | undefined
  var __TENANT_TEST_GET_PUBLIC_CONFIG__: (() => Promise<TenantPublicConfig>) | undefined
  var __TENANT_TEST_IS_ADMIN_REQUEST__: (() => Promise<boolean>) | undefined
}

/**
 * Obtiene la configuración completa del tenant actual
 * Cacheado por request usando React cache()
 */
export const getTenantConfig = cache(async (): Promise<TenantConfig> => {
  if (process.env.NODE_ENV === 'test' && typeof globalThis.__TENANT_TEST_GET_CONFIG__ === 'function') {
    return globalThis.__TENANT_TEST_GET_CONFIG__()
  }
  const headersList = await headers()
  // Prioridad: header enviado por el cliente (permite en local usar el mismo tenant que la UI)
  const tenantSlugHeader = headersList.get('x-tenant-slug')
  if (tenantSlugHeader && tenantSlugHeader.trim()) {
    const config = await getTenantBySlug(tenantSlugHeader.trim())
    if (config) return config
  }
  // En desarrollo, override por env para simular un tenant sin cambiar el host
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_TENANT_SLUG) {
    const config = await getTenantBySlug(process.env.NEXT_PUBLIC_DEV_TENANT_SLUG)
    if (config) return config
  }
  // Obtener hostname del request
  const hostname = headersList.get('x-tenant-domain') 
    || headersList.get('host') 
    || 'localhost'
  
  // Detectar tenant
  const { subdomain, customDomain } = detectTenantFromHost(hostname)
  
  // Debug logging para verificar detección
  if (process.env.NODE_ENV === 'development') {
    console.log('[TenantService] Detecting tenant:', { hostname, subdomain, customDomain })
  }
  
  // Buscar en DB
  let tenantRow = await fetchTenantFromDB(subdomain, customDomain)
  
  // Debug logging para verificar resultado
  if (process.env.NODE_ENV === 'development') {
    console.log('[TenantService] Tenant found:', { 
      found: !!tenantRow, 
      slug: tenantRow?.slug, 
      name: tenantRow?.name 
    })
  }
  
  // Fallback al tenant por defecto
  if (!tenantRow) {
    tenantRow = await fetchDefaultTenant()
  }
  
  // Si aún no hay tenant, usar configuración hardcodeada
  if (!tenantRow) {
    console.error('[TenantService] No tenant available, using hardcoded defaults')
    return getHardcodedDefaultTenant()
  }
  
  return mapDBRowToTenantConfig(tenantRow)
})

/**
 * Obtiene la configuración pública del tenant (para el cliente)
 */
export const getTenantPublicConfig = cache(async (): Promise<TenantPublicConfig> => {
  if (process.env.NODE_ENV === 'test' && typeof globalThis.__TENANT_TEST_GET_PUBLIC_CONFIG__ === 'function') {
    return globalThis.__TENANT_TEST_GET_PUBLIC_CONFIG__()
  }
  const config = await getTenantConfig()
  return extractPublicConfig(config)
})

/**
 * Obtiene un tenant específico por slug
 */
export async function getTenantBySlug(slug: string): Promise<TenantConfig | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return mapDBRowToTenantConfig(data as TenantDBRow)
}

/**
 * Obtiene un tenant específico por ID
 */
export async function getTenantById(id: string): Promise<TenantConfig | null> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error || !data) {
    return null
  }
  
  return mapDBRowToTenantConfig(data as TenantDBRow)
}

/**
 * Obtiene todos los tenants activos
 */
export async function getAllTenants(): Promise<TenantConfig[]> {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('is_active', true)
    .order('name')
  
  if (error || !data) {
    return []
  }
  
  return (data as TenantDBRow[]).map(mapDBRowToTenantConfig)
}

// ============================================================================
// FALLBACK HARDCODEADO
// ============================================================================

/**
 * Configuración por defecto hardcodeada (último recurso)
 */
function getHardcodedDefaultTenant(): TenantConfig {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    slug: 'pinteya',
    name: 'Pinteya',
    subdomain: 'pinteya',
    customDomain: 'www.pinteya.com',
    logoUrl: '/images/logo/LOGO POSITIVO.svg',
    logoDarkUrl: '/images/logo/LOGO NEGATIVO.svg',
    faviconUrl: '/favicon.svg',
    ...DEFAULT_COLORS,
    themeConfig: { borderRadius: '0.5rem', fontFamily: 'Plus Jakarta Sans' },
    ga4MeasurementId: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || null,
    ga4PropertyId: process.env.GA4_PROPERTY_ID || null,
    googleMerchantId: null,
    googleSiteVerification: null,
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || null,
    metaAccessToken: process.env.META_ACCESS_TOKEN || null,
    metaAdAccountId: process.env.META_AD_ACCOUNT_ID || null,
    metaCatalogId: null,
    mercadopagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || null,
    mercadopagoPublicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || null,
    mercadopagoWebhookSecret: null,
    resendApiKey: process.env.RESEND_API_KEY || null,
    fromEmail: 'Pinteya <noreply@pinteya.com>',
    supportEmail: 'soporte@pinteya.com',
    whatsappNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '5493513411796',
    whatsappMessageTemplate: 'Hola! Me interesa consultar sobre:',
    siteTitle: 'Pinteya - Tu Pinturería Online',
    siteDescription: 'Pinturería online especializada en productos de pintura profesional',
    siteKeywords: ['pinturería', 'pintura', 'online', 'Córdoba'],
    ogImageUrl: '/og-image.png',
    socialLinks: { facebook: null, instagram: null, twitter: null, youtube: null },
    contactPhone: '5493513411796',
    contactAddress: 'Córdoba, Argentina',
    contactCity: 'Córdoba',
    contactProvince: 'Córdoba',
    contactPostalCode: '5000',
    contactCountry: 'Argentina',
    currency: 'ARS',
    timezone: 'America/Argentina/Buenos_Aires',
    locale: 'es_AR',
    businessHours: {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '09:00', close: '13:00' },
      sunday: null,
    },
    isActive: true,
  }
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Construye la URL base para un tenant
 */
export function getTenantBaseUrl(tenant: TenantConfig | TenantPublicConfig): string {
  if (tenant.customDomain) {
    return `https://${tenant.customDomain}`
  }
  if (tenant.subdomain) {
    return `https://${tenant.subdomain}.${PLATFORM_DOMAIN}`
  }
  return `https://${PLATFORM_DOMAIN}`
}

/**
 * Verifica si el request actual es del admin central
 */
export async function isAdminRequest(): Promise<boolean> {
  if (process.env.NODE_ENV === 'test' && typeof globalThis.__TENANT_TEST_IS_ADMIN_REQUEST__ === 'function') {
    return globalThis.__TENANT_TEST_IS_ADMIN_REQUEST__()
  }
  const headersList = await headers()
  const hostname = headersList.get('host') || ''
  return hostname.startsWith('admin.')
}
