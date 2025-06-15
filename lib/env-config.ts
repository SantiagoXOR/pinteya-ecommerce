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
};

// ===================================
// CLERK CONFIGURATION
// ===================================
export const clerkConfig = {
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
  secretKey: process.env.CLERK_SECRET_KEY || '',
  signInUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/signin',
  signUpUrl: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/signup',
  afterSignInUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || '/',
  afterSignUpUrl: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || '/',
};

// ===================================
// MERCADOPAGO CONFIGURATION
// ===================================
export const mercadopagoConfig = {
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '',
  webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET || '',
};

// ===================================
// APPLICATION CONFIGURATION
// ===================================
export const appConfig = {
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001',
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// ===================================
// VALIDATION FUNCTIONS
// ===================================

/**
 * Verifica si Supabase está configurado correctamente
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseConfig.url && supabaseConfig.anonKey);
}

/**
 * Verifica si Clerk está configurado correctamente
 */
export function isClerkConfigured(): boolean {
  return !!(clerkConfig.publishableKey && clerkConfig.secretKey);
}

/**
 * Verifica si MercadoPago está configurado correctamente
 */
export function isMercadoPagoConfigured(): boolean {
  return !!(mercadopagoConfig.accessToken && mercadopagoConfig.publicKey);
}

/**
 * Verifica si todas las configuraciones están completas
 */
export function isFullyConfigured(): boolean {
  return isSupabaseConfigured() && isClerkConfigured() && isMercadoPagoConfigured();
}

/**
 * Obtiene la configuración de la base de datos
 */
export function getDatabaseConfig() {
  return {
    url: supabaseConfig.url,
    anonKey: supabaseConfig.anonKey,
    serviceRoleKey: supabaseConfig.serviceRoleKey,
  };
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
    afterSignInUrl: clerkConfig.afterSignInUrl,
    afterSignUpUrl: clerkConfig.afterSignUpUrl,
  };
}

/**
 * Obtiene la configuración de pagos
 */
export function getPaymentConfig() {
  return {
    accessToken: mercadopagoConfig.accessToken,
    publicKey: mercadopagoConfig.publicKey,
    webhookSecret: mercadopagoConfig.webhookSecret,
  };
}

// ===================================
// ENVIRONMENT VALIDATION
// ===================================

/**
 * Valida que las variables de entorno críticas estén configuradas
 */
export function validateEnvironment(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar Supabase
  if (!supabaseConfig.url) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  if (!supabaseConfig.anonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
  }

  // Validar Clerk (opcional en desarrollo)
  if (appConfig.isProduction) {
    if (!clerkConfig.publishableKey) {
      errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required in production');
    }
    if (!clerkConfig.secretKey) {
      errors.push('CLERK_SECRET_KEY is required in production');
    }
  }

  // Validar MercadoPago (opcional en desarrollo)
  if (appConfig.isProduction) {
    if (!mercadopagoConfig.accessToken) {
      errors.push('MERCADOPAGO_ACCESS_TOKEN is required in production');
    }
    if (!mercadopagoConfig.publicKey) {
      errors.push('NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY is required in production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// ===================================
// EXPORT DEFAULT CONFIG
// ===================================
export default {
  supabase: supabaseConfig,
  clerk: clerkConfig,
  mercadopago: mercadopagoConfig,
  app: appConfig,
  isSupabaseConfigured,
  isClerkConfigured,
  isMercadoPagoConfigured,
  isFullyConfigured,
  validateEnvironment,
};
