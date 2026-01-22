/**
 * Setup de Tests Multitenant
 * Configuración global de mocks y datos de prueba
 */

import { jest } from '@jest/globals'
import type { TenantConfig, TenantPublicConfig, TenantDBRow } from '@/lib/tenant/types'

// ============================================================================
// MOCKS - IMPORTANTE: Los mocks deben estar antes de cualquier import
// ============================================================================

// Mock de React cache (debe estar primero)
jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return {
    ...actual,
    cache: (fn: any) => fn, // cache simplemente retorna la función
  }
})

// No mockear @/lib/tenant: se usan overrides globales (__TENANT_TEST_*)
// en tests que necesitan getTenantConfig/getTenantPublicConfig/isAdminRequest.

// Mock de headers de Next.js - evitar request store
const mockHeadersGlobal = jest.fn()
jest.mock('next/headers', () => ({
  headers: mockHeadersGlobal,
}))

// Mock de Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createAdminClient: jest.fn(),
  createClient: jest.fn(),
}))

// ============================================================================
// DATOS DE PRUEBA
// ============================================================================

export const mockTenants: Record<string, TenantConfig> = {
  pinteya: {
    id: 'pinteya-uuid-1234',
    slug: 'pinteya',
    name: 'Pinteya',
    subdomain: 'pinteya',
    customDomain: 'www.pinteya.com',
    logoUrl: '/tenants/pinteya/logo.svg',
    logoDarkUrl: '/tenants/pinteya/logo-dark.svg',
    faviconUrl: '/tenants/pinteya/favicon.svg',
    primaryColor: '#f27a1d',
    primaryDark: '#bd4811',
    primaryLight: '#f9be78',
    secondaryColor: '#00f269',
    accentColor: '#f9a007',
    backgroundGradientStart: '#000000',
    backgroundGradientEnd: '#eb6313',
    headerBgColor: '#bd4811',
    themeConfig: {
      borderRadius: '0.5rem',
      fontFamily: 'Plus Jakarta Sans',
    },
    ga4MeasurementId: 'G-PINTEYA123',
    ga4PropertyId: '123456789',
    googleMerchantId: 'PINTEYA_MERCHANT',
    googleSiteVerification: null,
    metaPixelId: '123456789012345',
    metaAccessToken: 'pinteya-meta-token',
    metaAdAccountId: 'act_123456789',
    metaCatalogId: 'pinteya_catalog',
    mercadopagoAccessToken: 'pinteya-mp-token',
    mercadopagoPublicKey: 'pinteya-mp-public-key',
    mercadopagoWebhookSecret: 'pinteya-mp-secret',
    resendApiKey: 'pinteya-resend-key',
    fromEmail: 'Pinteya <noreply@pinteya.com>',
    supportEmail: 'soporte@pinteya.com',
    whatsappNumber: '5493516323002',
    whatsappMessageTemplate: 'Hola! Me interesa consultar sobre:',
    siteTitle: 'Pinteya - Tu Pinturería Online',
    siteDescription: 'Pinturería online especializada en productos de pintura profesional',
    siteKeywords: ['pinturería', 'pintura', 'online', 'Córdoba'],
    ogImageUrl: '/tenants/pinteya/og-image.png',
    socialLinks: {
      facebook: 'https://facebook.com/pinteya',
      instagram: 'https://instagram.com/pinteya',
      twitter: null,
      youtube: null,
    },
    contactPhone: '5493516323002',
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
  },
  pintemas: {
    id: 'pintemas-uuid-5678',
    slug: 'pintemas',
    name: 'Pintemas',
    subdomain: 'pintemas',
    customDomain: 'www.pintemas.com',
    logoUrl: '/tenants/pintemas/logo.svg',
    logoDarkUrl: '/tenants/pintemas/logo-dark.svg',
    faviconUrl: '/tenants/pintemas/favicon.svg',
    primaryColor: '#0066cc',
    primaryDark: '#004499',
    primaryLight: '#3399ff',
    secondaryColor: '#00cc66',
    accentColor: '#ff6600',
    backgroundGradientStart: '#001122',
    backgroundGradientEnd: '#0066cc',
    headerBgColor: '#004499',
    themeConfig: {
      borderRadius: '0.5rem',
      fontFamily: 'Plus Jakarta Sans',
    },
    ga4MeasurementId: 'G-PINTEMAS456',
    ga4PropertyId: '987654321',
    googleMerchantId: 'PINTEMAS_MERCHANT',
    googleSiteVerification: null,
    metaPixelId: '987654321098765',
    metaAccessToken: 'pintemas-meta-token',
    metaAdAccountId: 'act_987654321',
    metaCatalogId: 'pintemas_catalog',
    mercadopagoAccessToken: 'pintemas-mp-token',
    mercadopagoPublicKey: 'pintemas-mp-public-key',
    mercadopagoWebhookSecret: 'pintemas-mp-secret',
    resendApiKey: 'pintemas-resend-key',
    fromEmail: 'Pintemas <noreply@pintemas.com>',
    supportEmail: 'soporte@pintemas.com',
    whatsappNumber: '5493516323003',
    whatsappMessageTemplate: 'Hola! Me interesa consultar sobre:',
    siteTitle: 'Pintemas - Tu Pinturería Online',
    siteDescription: 'Pinturería online especializada en productos de pintura profesional',
    siteKeywords: ['pinturería', 'pintura', 'online', 'Córdoba'],
    ogImageUrl: '/tenants/pintemas/og-image.png',
    socialLinks: {
      facebook: 'https://facebook.com/pintemas',
      instagram: 'https://instagram.com/pintemas',
      twitter: null,
      youtube: null,
    },
    contactPhone: '5493516323003',
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
  },
}

/**
 * Extrae configuración pública de un tenant
 */
export function extractPublicConfig(config: TenantConfig): TenantPublicConfig {
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
    contactAddress: config.contactAddress,
    contactCity: config.contactCity,
    contactProvince: config.contactProvince,
    currency: config.currency,
    locale: config.locale,
    businessHours: config.businessHours,
  }
}

/**
 * Convierte TenantConfig a TenantDBRow para mocks de Supabase
 */
export function configToDBRow(config: TenantConfig): TenantDBRow {
  return {
    id: config.id,
    slug: config.slug,
    name: config.name,
    subdomain: config.subdomain,
    custom_domain: config.customDomain,
    logo_url: config.logoUrl,
    logo_dark_url: config.logoDarkUrl,
    favicon_url: config.faviconUrl,
    primary_color: config.primaryColor,
    primary_dark: config.primaryDark,
    primary_light: config.primaryLight,
    secondary_color: config.secondaryColor,
    accent_color: config.accentColor,
    background_gradient_start: config.backgroundGradientStart,
    background_gradient_end: config.backgroundGradientEnd,
    header_bg_color: config.headerBgColor,
    theme_config: config.themeConfig,
    ga4_measurement_id: config.ga4MeasurementId,
    ga4_property_id: config.ga4PropertyId,
    google_credentials_json: null,
    google_merchant_id: config.googleMerchantId,
    google_site_verification: config.googleSiteVerification,
    meta_pixel_id: config.metaPixelId,
    meta_access_token: config.metaAccessToken,
    meta_ad_account_id: config.metaAdAccountId,
    meta_catalog_id: config.metaCatalogId,
    mercadopago_access_token: config.mercadopagoAccessToken,
    mercadopago_public_key: config.mercadopagoPublicKey,
    mercadopago_webhook_secret: config.mercadopagoWebhookSecret,
    resend_api_key: config.resendApiKey,
    from_email: config.fromEmail,
    support_email: config.supportEmail,
    whatsapp_number: config.whatsappNumber,
    whatsapp_message_template: config.whatsappMessageTemplate,
    site_title: config.siteTitle,
    site_description: config.siteDescription,
    site_keywords: config.siteKeywords,
    og_image_url: config.ogImageUrl,
    social_links: config.socialLinks,
    contact_phone: config.contactPhone,
    contact_address: config.contactAddress,
    contact_city: config.contactCity,
    contact_province: config.contactProvince,
    contact_postal_code: config.contactPostalCode,
    contact_country: config.contactCountry,
    currency: config.currency,
    timezone: config.timezone,
    locale: config.locale,
    business_hours: config.businessHours,
    is_active: config.isActive,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}
