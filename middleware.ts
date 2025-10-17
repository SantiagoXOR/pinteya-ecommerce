/**
 * Middleware de NextAuth.js para Pinteya E-commerce
 * Protege rutas administrativas y maneja autenticación
 * Optimizado para rendimiento y producción
 */

import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth(req => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isProduction = process.env.NODE_ENV === 'production'
  const startTime = Date.now()

  // BYPASS SOLO EN DESARROLLO CON VALIDACIÓN ESTRICTA
  if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
    // Verificar que existe archivo .env.local para evitar bypass accidental en producción
    try {
      const fs = require('fs')
      const path = require('path')
      const envLocalPath = path.join(process.cwd(), '.env.local')
      if (fs.existsSync(envLocalPath)) {
        console.log(`[NextAuth Middleware] BYPASS AUTH ENABLED - ${nextUrl.pathname}`)
        return NextResponse.next()
      }
    } catch (error) {
      console.warn('[NextAuth Middleware] No se pudo verificar .env.local, bypass deshabilitado')
    }
  }

  // Logging optimizado - Solo para rutas críticas o desarrollo
  if (
    !isProduction ||
    nextUrl.pathname.startsWith('/admin') ||
    nextUrl.pathname.startsWith('/api/admin')
  ) {
    console.log(`[NextAuth Middleware] ${nextUrl.pathname} - Auth: ${isLoggedIn}`)
  }

  // Permitir rutas de autenticación NextAuth.js
  if (nextUrl.pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Rutas públicas optimizadas
  const publicRoutes = [
    '/api/products',
    '/api/categories',
    '/api/brands',
    '/api/search',
    '/api/payments/webhook',
  ]

  if (publicRoutes.some(route => nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Proteger rutas administrativas, de usuario y driver
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isApiAdminRoute = nextUrl.pathname.startsWith('/api/admin')
  const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard')
  const isApiUserRoute = nextUrl.pathname.startsWith('/api/user')
  const isDriverRoute = nextUrl.pathname.startsWith('/driver')
  const isApiDriverRoute = nextUrl.pathname.startsWith('/api/driver')

  if ((isAdminRoute || isApiAdminRoute || isDashboardRoute || isApiUserRoute || isDriverRoute || isApiDriverRoute) && !isLoggedIn) {
    // Para rutas de admin, redirigir directamente al home
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/', nextUrl.origin))
    }
    
    if (isApiAdminRoute || isApiUserRoute || isApiDriverRoute) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    } else {
      const signInUrl = new URL('/api/auth/signin', nextUrl.origin)
      signInUrl.searchParams.set('callbackUrl', nextUrl.href)
      return NextResponse.redirect(signInUrl)
    }
  }

  // Verificar autorización admin
  if ((isAdminRoute || isApiAdminRoute) && isLoggedIn) {
    const userEmail = req.auth?.user?.email
    const isAdmin = userEmail === 'santiago@xor.com.ar'

    if (!isAdmin) {
      if (isApiAdminRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden', message: 'Admin access required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      } else {
        return NextResponse.redirect(new URL('/access-denied?type=admin', nextUrl.origin))
      }
    }
  }

  // Verificar autorización driver
  if ((isDriverRoute || isApiDriverRoute) && isLoggedIn) {
    const userEmail = req.auth?.user?.email
    const isDriver = userEmail === 'driver@pinteya.com' || userEmail === 'santiago@xor.com.ar'

    if (!isDriver) {
      if (isApiDriverRoute) {
        return new NextResponse(
          JSON.stringify({ error: 'Forbidden', message: 'Driver access required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      } else {
        return NextResponse.redirect(new URL('/access-denied?type=driver', nextUrl.origin))
      }
    }
  }

  // Headers optimizados de respuesta
  const response = NextResponse.next()
  const responseTime = Date.now() - startTime

  // Headers esenciales de seguridad
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')

  // Headers de monitoreo (solo en desarrollo)
  if (!isProduction) {
    response.headers.set('X-Response-Time', `${responseTime}ms`)
    response.headers.set('X-Auth-Status', isLoggedIn ? 'authenticated' : 'anonymous')
  }

  return response
})

export const config = {
  matcher: [
    /*
     * Match specific paths that need protection:
     * - /admin/* (admin UI routes)
     * - /api/admin/* (admin API routes)
     * - /dashboard/* (user dashboard routes)
     * - /api/user/* (user API routes)
     * - /driver/* (driver UI routes)
     * - /api/driver/* (driver API routes)
     * Exclude NextAuth.js routes and static files
     */
    '/admin/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*',
    '/api/user/:path*',
    '/driver/:path*',
    '/api/driver/:path*',
  ],
}
