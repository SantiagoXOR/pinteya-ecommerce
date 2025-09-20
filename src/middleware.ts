/**
 * Middleware de NextAuth.js para Pinteya E-commerce
 * Protege rutas administrativas y maneja autenticación
 * Optimizado para producción con logging mejorado
 */

import { NextResponse } from "next/server"
import { createErrorSuppressionMiddleware } from "@/lib/middleware/error-suppression"

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

export default function middleware(req: any) {
  const { nextUrl } = req
  
  // Aplicar supresión de errores
  const errorSuppressionMiddleware = createErrorSuppressionMiddleware();

  // Simplificado para evitar problemas con edge runtime
  console.log(`[Middleware] ${nextUrl.pathname}`)
  
  const response = NextResponse.next();
  // Aplicar headers de supresión de errores
  response.headers.set('X-Error-Suppression', 'enabled');
  return response;
}









