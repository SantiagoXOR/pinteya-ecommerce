/**
 * Endpoint de bypass de autenticación - SOLO DESARROLLO
 * Permite acceder al panel admin sin OAuth configurado
 * 
 * Uso: GET http://localhost:3000/api/dev/bypass-login
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Solo disponible en desarrollo
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Este endpoint solo está disponible en desarrollo' },
      { status: 403 }
    )
  }

  console.log('[DEV BYPASS] Creando sesión mock para santiago@xor.com.ar')

  // Redirigir directamente al admin
  // El middleware con BYPASS_AUTH=true permitirá el acceso
  return NextResponse.redirect(new URL('/admin', request.url))
}

