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
  webhookSecret: process.env.CLERK_WEBHOOK_SECRET || '',
};

// ===================================
// MERCADOPAGO CONFIGURATION
// ===================================
export const mercadopagoConfig = {
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
  publicKey: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || '',
  clientId: process.env.MERCADOPAGO_CLIENT_ID || '',
  clientSecret: process.env.MERCADOPAGO_CLIENT_SECRET || '',
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
 * Obtiene el estado de configuración de todos los servicios
 */
export function getConfigurationStatus() {
  return {
    supabase: isSupabaseConfigured(),
    clerk: isClerkConfigured(),
    mercadopago: isMercadoPagoConfigured(),
    app: !!appConfig.url,
  };
}

/**
 * Valida la configuración crítica para el funcionamiento de la app
 */
export function validateCriticalConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!isSupabaseConfigured()) {
    errors.push('Supabase no está configurado correctamente');
  }
  
  if (!appConfig.url) {
    errors.push('URL de la aplicación no está configurada');
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
  getConfigurationStatus,
  validateCriticalConfig,
};
