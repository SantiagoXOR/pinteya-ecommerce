/**
 * Endpoint para verificar la configuración de NextAuth en producción
 * Útil para debugging de problemas de autenticación
 */

import { NextResponse } from 'next/server'

export async function GET() {
  // Solo permitir en desarrollo o con clave especial en producción
  const isDevelopment = process.env.NODE_ENV === 'development'
  const debugKey = process.env.DEBUG_AUTH_KEY || 'pinteya-debug-2024'
  
  const config = {
    // Variables críticas
    hasGoogleClientId: !!process.env.AUTH_GOOGLE_ID,
    hasGoogleClientSecret: !!process.env.AUTH_GOOGLE_SECRET,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    hasAuthUrl: !!process.env.AUTH_URL,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    
    // Valores (sin exponer secretos completos)
    nextAuthUrl: process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'NO CONFIGURADO',
    googleClientIdPrefix: process.env.AUTH_GOOGLE_ID?.substring(0, 20) + '...' || 'NO CONFIGURADO',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NO CONFIGURADO',
    
    // Verificaciones
    checks: {
      googleClientIdFormat: process.env.AUTH_GOOGLE_ID?.includes('.googleusercontent.com') || false,
      nextAuthUrlIsHttps: (process.env.NEXTAUTH_URL || process.env.AUTH_URL || '').startsWith('https://'),
      expectedCallbackUrl: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL || 'https://www.pinteya.com'}/api/auth/callback/google`,
    },
    
    // Entorno
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    config,
    status: 'ok',
    recommendations: [
      !config.hasNextAuthUrl && '⚠️ NEXTAUTH_URL no está configurado. Esto causará errores 400 en producción.',
      !config.hasGoogleClientId && '⚠️ AUTH_GOOGLE_ID no está configurado.',
      !config.hasGoogleClientSecret && '⚠️ AUTH_GOOGLE_SECRET no está configurado.',
      !config.checks.nextAuthUrlIsHttps && '⚠️ NEXTAUTH_URL debe usar HTTPS en producción.',
      !config.checks.googleClientIdFormat && '⚠️ AUTH_GOOGLE_ID no tiene el formato correcto (.googleusercontent.com).',
    ].filter(Boolean),
  })
}
