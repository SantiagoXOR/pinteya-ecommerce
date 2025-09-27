// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Simple API working',
    timestamp: new Date().toISOString(),
  })
}
