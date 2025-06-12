// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE SIMPLE PARA VERCEL
// ===================================

import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware mínimo para Vercel - Sin dependencias de Clerk
 * Permite que todas las rutas funcionen sin problemas de autenticación
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir todas las rutas para evitar errores en Vercel
  // La autenticación se maneja en el frontend con Clerk

  // Log básico para debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Middleware - Procesando ruta:', pathname);
  }

  // Continuar con la request sin modificaciones
  return NextResponse.next();
}

// Configuración del matcher mínima para Vercel
export const config = {
  matcher: [
    // Solo procesar rutas que no sean archivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|robots.txt|sitemap.xml).*)',
  ],
};
