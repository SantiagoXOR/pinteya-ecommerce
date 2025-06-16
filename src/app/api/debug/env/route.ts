import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route para verificar variables de entorno (solo en desarrollo)
 * IMPORTANTE: Solo expone variables NEXT_PUBLIC_* por seguridad
 */
export async function GET(request: NextRequest) {
  try {
    // Solo permitir en desarrollo o con parámetro especial
    const { searchParams } = new URL(request.url);
    const debug = searchParams.get('debug');
    
    if (process.env.NODE_ENV === 'production' && debug !== 'pinteya2024') {
      return NextResponse.json(
        { error: 'Debug endpoint not available in production' },
        { status: 403 }
      );
    }

    // Variables públicas (seguras de exponer)
    const publicEnvVars = {
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || null,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || null,
      NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || null,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || null,
      NODE_ENV: process.env.NODE_ENV || null,
    };

    // Variables privadas (solo verificar si existen, no exponer valores)
    const privateEnvVars = {
      CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      MERCADOPAGO_ACCESS_TOKEN: !!process.env.MERCADOPAGO_ACCESS_TOKEN,
      MERCADOPAGO_CLIENT_ID: !!process.env.MERCADOPAGO_CLIENT_ID,
      MERCADOPAGO_CLIENT_SECRET: !!process.env.MERCADOPAGO_CLIENT_SECRET,
      MERCADOPAGO_WEBHOOK_SECRET: !!process.env.MERCADOPAGO_WEBHOOK_SECRET,
    };

    // Análisis de configuración
    const analysis = {
      clerk: {
        configured: !!(publicEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && privateEnvVars.CLERK_SECRET_KEY),
        publicKey: !!publicEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        secretKey: privateEnvVars.CLERK_SECRET_KEY,
        issues: []
      },
      supabase: {
        configured: !!(publicEnvVars.NEXT_PUBLIC_SUPABASE_URL && publicEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY && privateEnvVars.SUPABASE_SERVICE_ROLE_KEY),
        url: !!publicEnvVars.NEXT_PUBLIC_SUPABASE_URL,
        anonKey: !!publicEnvVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        serviceKey: privateEnvVars.SUPABASE_SERVICE_ROLE_KEY,
        issues: []
      },
      mercadopago: {
        configured: !!(publicEnvVars.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY && privateEnvVars.MERCADOPAGO_ACCESS_TOKEN),
        publicKey: !!publicEnvVars.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY,
        accessToken: privateEnvVars.MERCADOPAGO_ACCESS_TOKEN,
        clientId: privateEnvVars.MERCADOPAGO_CLIENT_ID,
        issues: []
      }
    };

    // Detectar problemas específicos
    if (!analysis.clerk.publicKey) {
      analysis.clerk.issues.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY no configurado');
    }
    if (!analysis.clerk.secretKey) {
      analysis.clerk.issues.push('CLERK_SECRET_KEY no configurado');
    }

    if (!analysis.supabase.url) {
      analysis.supabase.issues.push('NEXT_PUBLIC_SUPABASE_URL no configurado');
    }
    if (!analysis.supabase.anonKey) {
      analysis.supabase.issues.push('NEXT_PUBLIC_SUPABASE_ANON_KEY no configurado');
    }

    if (!analysis.mercadopago.publicKey) {
      analysis.mercadopago.issues.push('NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY no configurado');
    }
    if (!analysis.mercadopago.accessToken) {
      analysis.mercadopago.issues.push('MERCADOPAGO_ACCESS_TOKEN no configurado');
    }

    // Validar formato de claves
    if (publicEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      if (!publicEnvVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_')) {
        analysis.clerk.issues.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY no tiene formato válido (debe empezar con pk_)');
      }
    }

    if (publicEnvVars.NEXT_PUBLIC_SUPABASE_URL) {
      if (!publicEnvVars.NEXT_PUBLIC_SUPABASE_URL.includes('supabase.co')) {
        analysis.supabase.issues.push('NEXT_PUBLIC_SUPABASE_URL no parece ser una URL válida de Supabase');
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      publicVars: publicEnvVars,
      privateVarsStatus: privateEnvVars,
      analysis,
      summary: {
        totalIssues: analysis.clerk.issues.length + analysis.supabase.issues.length + analysis.mercadopago.issues.length,
        clerkReady: analysis.clerk.configured,
        supabaseReady: analysis.supabase.configured,
        mercadopagoReady: analysis.mercadopago.configured,
        allReady: analysis.clerk.configured && analysis.supabase.configured && analysis.mercadopago.configured
      }
    });

  } catch (error) {
    console.error('Error in debug env API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
