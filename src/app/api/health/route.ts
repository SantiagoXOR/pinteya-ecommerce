// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// HEALTH CHECK ENDPOINT
// ===================================

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'pintureria-digital',
    version: '1.0.0',
  })
}
