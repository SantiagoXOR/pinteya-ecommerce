// =====================================================
// TENANT TYPES
// Descripción: Tipos TypeScript para el sistema multitenant
// =====================================================

/**
 * Configuración completa del tenant
 */
export interface TenantConfig {
  // Identificación
  id: string
  slug: string
  name: string
  
  // Dominios
  subdomain: string | null
  customDomain: string | null
  
  // Branding
  logoUrl: string | null
  logoDarkUrl: string | null
  logoSizeUrl: string | null
  faviconUrl: string | null
  
  // Colores
  primaryColor: string
  primaryDark: string
  primaryLight: string
  secondaryColor: string
  accentColor: string
  backgroundGradientStart: string
  backgroundGradientEnd: string
  headerBgColor: string
  
  // Configuración de tema extendida
  themeConfig: {
    borderRadius: string
    fontFamily: string
    [key: string]: string
  }
  
  // Google Analytics
  ga4MeasurementId: string | null
  ga4PropertyId: string | null
  googleMerchantId: string | null
  googleSiteVerification: string | null
  
  // Meta/Facebook
  metaPixelId: string | null
  metaAccessToken: string | null
  metaAdAccountId: string | null
  metaCatalogId: string | null
  
  // MercadoPago
  mercadopagoAccessToken: string | null
  mercadopagoPublicKey: string | null
  mercadopagoWebhookSecret: string | null
  
  // Email (Resend)
  resendApiKey: string | null
  fromEmail: string | null
  supportEmail: string | null
  
  // WhatsApp
  whatsappNumber: string | null
  whatsappMessageTemplate: string | null
  
  // SEO y Metadata
  siteTitle: string | null
  siteDescription: string | null
  siteKeywords: string[]
  ogImageUrl: string | null
  
  // Redes Sociales
  socialLinks: {
    facebook: string | null
    instagram: string | null
    twitter: string | null
    youtube: string | null
    [key: string]: string | null
  }
  
  // Información de contacto
  contactPhone: string | null
  contactAddress: string | null
  contactCity: string | null
  contactProvince: string | null
  contactPostalCode: string | null
  contactCountry: string
  
  // Configuración regional
  currency: string
  timezone: string
  locale: string
  
  // Horarios
  businessHours: {
    [day: string]: { open: string; close: string } | null
  }
  
  // Estado
  isActive: boolean
}

/**
 * Versión reducida para el cliente (sin datos sensibles)
 */
export interface TenantPublicConfig {
  id: string
  slug: string
  name: string
  
  // Dominios
  subdomain: string | null
  customDomain: string | null
  
  // Branding
  logoUrl: string | null
  logoDarkUrl: string | null
  /** Logo para header con mejor proporción de altura (ej. logosize.svg) */
  logoSizeUrl: string | null
  faviconUrl: string | null
  
  // Colores
  primaryColor: string
  primaryDark: string
  primaryLight: string
  secondaryColor: string
  accentColor: string
  backgroundGradientStart: string
  backgroundGradientEnd: string
  headerBgColor: string
  
  // ScrollingBanner configuración
  scrollingBannerLocationText: string | null
  scrollingBannerShippingText: string | null
  scrollingBannerLocationBgColor: string | null
  scrollingBannerShippingBgColor: string | null
  
  // Tema
  themeConfig: {
    borderRadius: string
    fontFamily: string
    [key: string]: string
  }
  
  // Analytics (solo IDs públicos)
  ga4MeasurementId: string | null
  metaPixelId: string | null
  
  // Verificación de sitio (Google Merchant / Search Console)
  googleSiteVerification: string | null
  
  // WhatsApp
  whatsappNumber: string | null
  whatsappMessageTemplate: string | null
  
  // SEO
  siteTitle: string | null
  siteDescription: string | null
  siteKeywords: string[]
  ogImageUrl: string | null
  
  // Redes Sociales
  socialLinks: {
    facebook: string | null
    instagram: string | null
    twitter: string | null
    youtube: string | null
    [key: string]: string | null
  }
  
  // Contacto
  contactPhone: string | null
  supportEmail: string | null
  contactAddress: string | null
  contactCity: string | null
  contactProvince: string | null
  
  // Regional
  currency: string
  locale: string
  
  // Horarios
  businessHours: {
    [day: string]: { open: string; close: string } | null
  }
}

/**
 * Datos del tenant desde la base de datos
 */
export interface TenantDBRow {
  id: string
  slug: string
  name: string
  subdomain: string | null
  custom_domain: string | null
  logo_url: string | null
  logo_dark_url: string | null
  logo_size_url: string | null
  favicon_url: string | null
  primary_color: string
  primary_dark: string
  primary_light: string
  secondary_color: string
  accent_color: string
  background_gradient_start: string
  background_gradient_end: string
  header_bg_color: string
  scrolling_banner_location_text: string | null
  scrolling_banner_shipping_text: string | null
  scrolling_banner_location_bg_color: string | null
  scrolling_banner_shipping_bg_color: string | null
  theme_config: Record<string, string>
  ga4_measurement_id: string | null
  ga4_property_id: string | null
  google_credentials_json: string | null
  google_merchant_id: string | null
  google_site_verification: string | null
  meta_pixel_id: string | null
  meta_access_token: string | null
  meta_ad_account_id: string | null
  meta_catalog_id: string | null
  mercadopago_access_token: string | null
  mercadopago_public_key: string | null
  mercadopago_webhook_secret: string | null
  resend_api_key: string | null
  from_email: string | null
  support_email: string | null
  whatsapp_number: string | null
  whatsapp_message_template: string | null
  site_title: string | null
  site_description: string | null
  site_keywords: string[] | null
  og_image_url: string | null
  social_links: Record<string, string | null>
  contact_phone: string | null
  contact_address: string | null
  contact_city: string | null
  contact_province: string | null
  contact_postal_code: string | null
  contact_country: string
  currency: string
  timezone: string
  locale: string
  business_hours: Record<string, { open: string; close: string } | null>
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Contexto del tenant para la aplicación
 */
export interface TenantContext {
  tenant: TenantPublicConfig
  isLoading: boolean
  error: Error | null
}
