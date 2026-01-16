/**
 * Endpoint para verificar si el bypass de autenticación está activo
 * Útil para componentes del cliente que necesitan saber si el bypass está habilitado
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const bypassAuth = process.env.BYPASS_AUTH === 'true'
  
  return NextResponse.json({
    bypassEnabled: bypassAuth,
  })
}
