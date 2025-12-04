// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN DE VARIABLES DE ENTORNO
// ===================================

/**
 * Configuración centralizada de variables de entorno
 * Maneja valores por defecto y validaciones para evitar errores de build
 */

// ===================================
// SUPABASE CONFIGURATION
// ===================================
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aakzspzfulgftqlgwkpb.supabase.co',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
}

// ===================================
// CLERK CONFIGURATION
// ===================================
export const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  secretKey: process.env.CLERK_SECRET_KEY || '',
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/signin',
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/signup',
  // ✅ CORREGIDO: Usar fallbackRedirectUrl en lugar de afterSignInUrl/afterSignUpUrl
  fallbackRedirectUrl: process.env.NEXT_PUBLIC_CLERK_FALLBACK_REDIRECT_URL || '/admin',
  signInFallbackRedirectUrl:
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL || '/admin',
  signUpFallbackRedirectUrl:
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL || '/admin',
}

// ===================================
// MERCADOPAGO CONFIGURATION
// ===================================
export const mercadopagoConfig = {
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '',
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
}

// ===================================
// EMAIL CONFIGURATION (RESEND)
// ===================================
export const emailConfig = {
  resendApiKey: process.env.RESEND_API_KEY || '',
  fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@pinteya.com',
  supportEmail: process.env.RESEND_SUPPORT_EMAIL || 'soporte@pinteya.com',
}

// ===================================
// APPLICATION CONFIGURATION
// ===================================
export const appConfig = {
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://www.pinteya.com',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
}

// ===================================
// VALIDATION FUNCTIONS
// ===================================

/**
 * Verifica si Supabase está configurado correctamente
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseConfig.url && supabaseConfig.anonKey)
}

/**
 * Verifica si Clerk está configurado correctamente
 */
export function isClerkConfigured(): boolean {
  return !!(clerkConfig.publishableKey && clerkConfig.secretKey)
}

/**
 * Verifica si MercadoPago está configurado correctamente
 */
export function isMercadoPagoConfigured(): boolean {
  return !!(mercadopagoConfig.accessToken && mercadopagoConfig.publicKey)
}

/**
 * Verifica si el email está configurado correctamente
 */
export function isEmailConfigured(): boolean {
  return !!(emailConfig.resendApiKey && emailConfig.fromEmail)
}

/**
 * Verifica si todas las configuraciones están completas
 */
export function isFullyConfigured(): boolean {
  return (
    isSupabaseConfigured() &&
    isClerkConfigured() &&
    isMercadoPagoConfigured() &&
    isEmailConfigured()
  )
}

/**
 * Obtiene la configuración de la base de datos
 */
export function getDatabaseConfig() {
  return {
    url: supabaseConfig.url,
    anonKey: supabaseConfig.anonKey,
    serviceRoleKey: supabaseConfig.serviceRoleKey,
  }
}

/**
 * Obtiene la configuración de autenticación
 */
export function getAuthConfig() {
  return {
    publishableKey: clerkConfig.publishableKey,
    secretKey: clerkConfig.secretKey,
    signInUrl: clerkConfig.signInUrl,
    signUpUrl: clerkConfig.signUpUrl,
    // ✅ CORREGIDO: Usar nuevas props de Clerk v5
    fallbackRedirectUrl: clerkConfig.fallbackRedirectUrl,
    signInFallbackRedirectUrl: clerkConfig.signInFallbackRedirectUrl,
    signUpFallbackRedirectUrl: clerkConfig.signUpFallbackRedirectUrl,
  }
}

/**
 * Obtiene la configuración de email
 */
export function getEmailConfig() {
  return {
    resendApiKey: emailConfig.resendApiKey,
    fromEmail: emailConfig.fromEmail,
    supportEmail: emailConfig.supportEmail,
  }
}

/**
 * Obtiene la configuración de pagos
 */
export function getPaymentConfig() {
  return {
    accessToken: mercadopagoConfig.accessToken,
    publicKey: mercadopagoConfig.publicKey,
    webhookSecret: mercadopagoConfig.webhookSecret,
  }
}

// ===================================
// ENVIRONMENT VALIDATION
// ===================================

/**
 * Valida que las variables de entorno críticas estén configuradas
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Validar Supabase
  if (!supabaseConfig.url) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }
  if (!supabaseConfig.anonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  // Validar Clerk (opcional en desarrollo)
  if (appConfig.isProduction) {
    if (!clerkConfig.publishableKey) {
      errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required in production')
    }
    if (!clerkConfig.secretKey) {
      errors.push('CLERK_SECRET_KEY is required in production')
    }
  }

  // Validar MercadoPago (opcional en desarrollo)
  if (appConfig.isProduction) {
    if (!mercadopagoConfig.accessToken) {
      errors.push('MERCADOPAGO_ACCESS_TOKEN is required in production')
    }
    if (!mercadopagoConfig.publicKey) {
      errors.push('NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY is required in production')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// ===================================
// EXPORT DEFAULT CONFIG
// ===================================
export default {
  supabase: supabaseConfig,
  clerk: clerkConfig,
  mercadopago: mercadopagoConfig,
  email: emailConfig,
  app: appConfig,
  isSupabaseConfigured,
  isClerkConfigured,
  isMercadoPagoConfigured,
  isEmailConfigured,
  isFullyConfigured,
  validateEnvironment,
  getEmailConfig,
}
