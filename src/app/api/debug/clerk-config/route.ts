// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

/**
 * API para verificar la configuración actual de Clerk
 * Solo muestra información de diagnóstico, no claves completas
 */
export async function GET() {
  try {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    const secretKey = process.env.CLERK_SECRET_KEY
    const signInUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL
    const signUpUrl = process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL

    // Información de diagnóstico (sin exponer claves completas)
    const config = {
      publishableKey: {
        exists: !!publishableKey,
        type: publishableKey?.startsWith('pk_live_')
          ? 'PRODUCTION'
          : publishableKey?.startsWith('[STRIPE_PUBLIC_KEY_REMOVED]')
            ? 'DEVELOPMENT'
            : 'UNKNOWN',
        length: publishableKey?.length || 0,
        preview: publishableKey ? `${publishableKey.substring(0, 15)}...` : 'NO CONFIGURADA',
      },
      secretKey: {
        exists: !!secretKey,
        type: secretKey?.startsWith('sk_live_')
          ? 'PRODUCTION'
          : secretKey?.startsWith('[STRIPE_SECRET_KEY_REMOVED]')
            ? 'DEVELOPMENT'
            : 'UNKNOWN',
        length: secretKey?.length || 0,
        preview: secretKey ? `${secretKey.substring(0, 15)}...` : 'NO CONFIGURADA',
      },
      urls: {
        signIn: signInUrl || 'NO CONFIGURADA',
        signUp: signUpUrl || 'NO CONFIGURADA',
      },
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    }

    // Verificar consistencia
    const issues = []

    if (!publishableKey) {
      issues.push('❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY no configurada')
    }

    if (!secretKey) {
      issues.push('❌ CLERK_SECRET_KEY no configurada')
    }

    if (publishableKey && secretKey) {
      const pubType = publishableKey.startsWith('pk_live_') ? 'live' : 'test'
      const secType = secretKey.startsWith('sk_live_') ? 'live' : 'test'

      if (pubType !== secType) {
        issues.push('⚠️ Inconsistencia: publishable key y secret key son de tipos diferentes')
      }
    }

    if (config.publishableKey.type === 'PRODUCTION') {
      issues.push(
        'ℹ️ Usando claves de PRODUCCIÓN - verificar que el dominio esté autorizado en Clerk'
      )
    }

    return NextResponse.json({
      status: 'success',
      config,
      issues,
      recommendations: [
        'Si usas claves de producción, agrega pinteya-ecommerce.vercel.app a dominios autorizados en Clerk',
        'Si usas claves de desarrollo, funcionarán en cualquier dominio',
        'Verifica que las claves estén completas (no truncadas)',
        'Redeploy después de cambiar variables de entorno',
      ],
    })
  } catch (error) {
    console.error('Error verificando configuración de Clerk:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
