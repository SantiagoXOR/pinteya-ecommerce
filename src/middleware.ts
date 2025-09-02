/**
 * Middleware de NextAuth.js para Pinteya E-commerce
 * Protege rutas administrativas y maneja autenticación
 * Optimizado para producción con logging mejorado
 */

import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const isProduction = process.env.NODE_ENV === 'production'

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

  return NextResponse.next()
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
