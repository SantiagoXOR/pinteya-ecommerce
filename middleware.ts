/**
 * Middleware de NextAuth.js para Pinteya E-commerce
 * Protege rutas administrativas y maneja autenticación
 * Optimizado para producción con logging mejorado
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { createErrorSuppressionMiddleware } from "@/lib/middleware/error-suppression"
import { performanceMonitoringMiddleware } from "@/middleware/performance-monitoring"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isProduction = process.env.NODE_ENV === 'production'
  const startTime = Date.now();

  // Aplicar supresión de errores
  const errorSuppressionMiddleware = createErrorSuppressionMiddleware();
  
  // Aplicar monitoring de performance (excepto para rutas de auth)
  if (!nextUrl.pathname.startsWith('/api/auth')) {
    try {
      performanceMonitoringMiddleware(req);
    } catch (error) {
      console.error('[Performance Monitoring] Error:', error);
    }
  }

  // BYPASS TEMPORAL PARA DESARROLLO
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    console.log(`[NextAuth Middleware] BYPASS AUTH ENABLED - ${nextUrl.pathname}`)
    const response = NextResponse.next();
    // Aplicar headers de supresión de errores
    response.headers.set('X-Error-Suppression', 'enabled');
    return response;
  }

  // Logging condicional (solo en desarrollo o para rutas críticas)
  if (!isProduction || nextUrl.pathname.startsWith('/admin') || nextUrl.pathname.startsWith('/api/admin')) {
    console.log(`[NextAuth Middleware] ${nextUrl.pathname} - Authenticated: ${isLoggedIn} - Env: ${process.env.NODE_ENV}`)
  }

  // Rutas que requieren autenticación
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isApiAdminRoute = nextUrl.pathname.startsWith('/api/admin')

  // Permitir rutas de autenticación NextAuth.js
  if (nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Permitir rutas públicas específicas
  const publicRoutes = [
    '/api/products',
    '/api/categories',
    '/api/brands',
    '/api/search',
    '/api/payments/webhook'
  ]

  if (publicRoutes.some(route => nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Proteger rutas administrativas
  if ((isAdminRoute || isApiAdminRoute) && !isLoggedIn) {
    console.log(`[NextAuth Middleware] Blocking unauthorized access: ${nextUrl.pathname}`)

    if (isApiAdminRoute) {
      // Para APIs, devolver 401
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    } else {
      // Para rutas UI, redirigir a login
      const signInUrl = new URL('/api/auth/signin', nextUrl.origin)
      signInUrl.searchParams.set('callbackUrl', nextUrl.href)
      return NextResponse.redirect(signInUrl)
    }
  }

  // Aplicar headers de supresión de errores y performance a todas las respuestas
  const response = NextResponse.next();
  response.headers.set('X-Error-Suppression', 'enabled');
  response.headers.set('X-Network-Error-Handling', 'active');
  
  // Headers de performance monitoring
  const responseTime = Date.now() - startTime;
  response.headers.set('X-Response-Time', `${responseTime}ms`);
  response.headers.set('X-Timestamp', new Date().toISOString());
  response.headers.set('X-Auth-Status', isLoggedIn ? 'authenticated' : 'anonymous');
  
  // Headers de seguridad adicionales
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  
  return response;
})

export const config = {
  matcher: [
    /*
     * Match specific paths that need protection:
     * - /admin/* (admin UI routes)
     * - /api/admin/* (admin API routes)
     * Exclude NextAuth.js routes and static files
     */
    "/admin/:path*",
    "/api/admin/:path*",
  ],
}