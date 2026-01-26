// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// =====================================================
// API: OBTENER VAPID PUBLIC KEY
// Endpoint: GET /api/user/push/vapid-key
// Descripción: Retorna la VAPID public key para suscripciones push
// =====================================================

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY

    if (!publicKey) {
      return NextResponse.json(
        { error: 'VAPID public key no configurada' },
        { status: 500 }
      )
    }

    return NextResponse.json({ publicKey })
  } catch (error) {
    console.error('Error en GET /api/user/push/vapid-key:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
