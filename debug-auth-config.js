// 🔧 Script de Debug para Configuración de Auth en Producción
// Ejecutar en Vercel Functions para verificar variables

export default function handler(req, res) {
  // Solo permitir en desarrollo o con clave especial
  const debugKey = req.query.debug_key;
  if (process.env.NODE_ENV === 'production' && debugKey !== 'pinteya-debug-2024') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const authConfig = {
    // Variables de entorno críticas
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Configurado' : '❌ Faltante',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || '❌ Faltante',
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ? '✅ Configurado' : '❌ Faltante',
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET ? '✅ Configurado' : '❌ Faltante',
    
    // Información del entorno
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_URL: process.env.VERCEL_URL,
    
    // URLs esperadas
    expectedCallbackUrl: `${process.env.NEXTAUTH_URL}/api/auth/callback/google`,
    currentHost: req.headers.host,
    
    // Verificaciones
    checks: {
      secretLength: process.env.NEXTAUTH_SECRET?.length || 0,
      urlMatch: process.env.NEXTAUTH_URL === 'https://pinteya.com',
      googleIdFormat: process.env.AUTH_GOOGLE_ID?.includes('.googleusercontent.com') || false,
    }
  };

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    config: authConfig,
    recommendations: [
      'Verificar que pinteya.com esté en Google Cloud Console',
      'Verificar redirect URI: https://pinteya.com/api/auth/callback/google',
      'Verificar que el CLIENT_ID termine en .googleusercontent.com',
      'Verificar que NEXTAUTH_SECRET tenga al menos 32 caracteres'
    ]
  });
}
