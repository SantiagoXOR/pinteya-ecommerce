/**
 * Middleware de NextAuth.js para Pinteya E-commerce
 * Protege rutas administrativas y maneja autenticación
 * Optimizado para producción con logging mejorado
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { createErrorSuppressionMiddleware } from "@/lib/middleware/error-suppression"
import { createClient } from '@/lib/integrations/supabase/server'

export default auth(async (req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isProduction = process.env.NODE_ENV === 'production'

  // Aplicar supresión de errores
  const errorSuppressionMiddleware = createErrorSuppressionMiddleware();

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
  const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard')
  const isApiUserRoute = nextUrl.pathname.startsWith('/api/user')
  const isDriverRoute = nextUrl.pathname.startsWith('/driver') && !nextUrl.pathname.startsWith('/driver/login')
  const isApiDriverRoute = nextUrl.pathname.startsWith('/api/driver')

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

  // Verificación especial para rutas de drivers (solo si está autenticado)
  if ((isDriverRoute || isApiDriverRoute) && isLoggedIn) {
    // En desarrollo, permitir acceso sin verificación estricta de driver
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      console.log(`[NextAuth Middleware] BYPASS DRIVER AUTH - ${nextUrl.pathname}`)
    } else {
      // Verificar que el usuario sea un driver válido
      try {
        const supabase = await createClient();
        const { data: driver, error } = await supabase
          .from('drivers')
          .select('id, status')
          .eq('email', req.auth?.user?.email)
          .single();

        if (error || !driver) {
          console.log(`[NextAuth Middleware] Driver not found: ${nextUrl.pathname}`)
          if (isApiDriverRoute) {
            return new NextResponse(
              JSON.stringify({ error: 'Driver access denied', message: 'Not a valid driver' }),
              {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
              }
            )
          } else {
            return NextResponse.redirect(new URL('/access-denied', nextUrl.origin))
          }
        }
      } catch (error) {
        console.error('[NextAuth Middleware] Error verifying driver:', error)
        // En caso de error, permitir acceso en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.log(`[NextAuth Middleware] DEV MODE - Allowing driver access despite error`)
        } else {
          if (isApiDriverRoute) {
            return new NextResponse(
              JSON.stringify({ error: 'Internal error', message: 'Driver verification failed' }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              }
            )
          } else {
            return NextResponse.redirect(new URL('/driver/login', nextUrl.origin))
          }
        }
      }
    }
  }

  // Proteger rutas administrativas y de usuario
  if ((isAdminRoute || isApiAdminRoute || isDashboardRoute || isApiUserRoute || isDriverRoute || isApiDriverRoute) && !isLoggedIn) {
    console.log(`[NextAuth Middleware] Blocking unauthorized access: ${nextUrl.pathname}`)

    if (isApiAdminRoute || isApiUserRoute || isApiDriverRoute) {
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

  // Aplicar headers de supresión de errores a todas las respuestas
  const response = NextResponse.next();
  response.headers.set('X-Error-Suppression', 'enabled');
  response.headers.set('X-Network-Error-Handling', 'active');

  return response;
})

export const config = {
  matcher: [
    /*
     * Match specific paths that need protection:
     * - /admin/* (admin UI routes)
     * - /api/admin/* (admin API routes)
     * - /dashboard/* (user dashboard routes)
     * - /api/user/* (user API routes)
     * Exclude NextAuth.js routes and static files
     */
    "/admin/:path*",
    "/api/admin/:path*",
    "/dashboard/:path*",
    "/api/user/:path*",
    "/driver/:path*",
    "/api/driver/:path*",
  ],
}









