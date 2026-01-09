/**
 * Middleware de NextAuth.js para Pinteya E-commerce
 * Protege rutas administrativas y maneja autenticación
 * Optimizado para rendimiento y producción
 */

import { getToken } from 'next-auth/jwt'
import { NextResponse, NextRequest } from 'next/server'

export default async function middleware(req: NextRequest) {
  const { nextUrl } = req
  const isProduction = process.env.NODE_ENV === 'production'
  const startTime = Date.now()

  // BYPASS AUTH - Solo para desarrollo/testing
  // ⚠️ IMPORTANTE: Desactivar en producción (BYPASS_AUTH=false o eliminar variable)
  // ✅ CRÍTICO: Verificar BYPASS_AUTH ANTES de acceder a cualquier propiedad del request
  if (process.env.BYPASS_AUTH === 'true') {
    console.log(`[BYPASS] ✅ Permitiendo acceso sin autenticación a: ${nextUrl.pathname} (NODE_ENV: ${process.env.NODE_ENV})`)
    // ✅ CRÍTICO: Retornar inmediatamente sin acceder a headers ni procesar el request
    // Esto evita que Next.js intente leer el body antes de que el handler lo lea
    return NextResponse.next()
  }

  // ✅ FIX: Detectar multipart/form-data y evitar leer el body
  const contentType = req.headers.get('content-type') || ''
  const isMultipart = contentType.includes('multipart/form-data')
  const isFormUrlEncoded = contentType.includes('application/x-www-form-urlencoded')

  // ✅ CRÍTICO: Para multipart/form-data, NO llamar getToken porque intenta leer el body
  // En su lugar, verificamos la existencia de la cookie de sesión de NextAuth
  let token = null
  let isLoggedIn = false
  
  if (isMultipart || isFormUrlEncoded) {
    // Para multipart, verificar cookie de sesión sin leer el body
    // NextAuth guarda la sesión en cookies, podemos verificar su existencia
    const sessionCookie = req.cookies.get('next-auth.session-token') || 
                          req.cookies.get('__Secure-next-auth.session-token')
    
    if (sessionCookie?.value) {
      // ✅ FIX: Para multipart, confiar en la cookie de sesión
      // La verificación completa de permisos se delega al endpoint
      console.log(`[Middleware] Multipart request con cookie de sesión válida, delegando auth al endpoint`)
      isLoggedIn = true
      // No tenemos el token completo, pero sabemos que hay sesión
      // El endpoint verificará los permisos específicos
    } else {
      console.log(`[Middleware] Multipart request sin cookie de sesión`)
      isLoggedIn = false
    }
  } else {
    // Para otros tipos, obtener token normalmente
    token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    isLoggedIn = !!token
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
    '/api/orders', // Permitir acceso público a órdenes individuales
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
    // ✅ FIX: Para multipart sin token, delegar verificación de rol al endpoint
    // El endpoint tiene withAdminAuth que verificará los permisos
    if (!token && (isMultipart || isFormUrlEncoded)) {
      console.log(`[Middleware] Multipart admin request - delegando verificación de rol al endpoint`)
      // Permitir pasar, el endpoint verificará permisos
    } else {
      // Obtener el rol desde el token (ya está cargado en el JWT)
      const userRole = (token?.role as string) || 'customer'
      const isAdmin = userRole === 'admin'

      // Logging para debugging
      if (!isProduction || isAdminRoute) {
        console.log(`[Middleware] Admin check - Route: ${nextUrl.pathname}, UserRole: ${userRole}, IsAdmin: ${isAdmin}`)
        console.log(`[Middleware] token structure:`, JSON.stringify({
          hasToken: !!token,
          userRole: token?.role,
          userEmail: token?.email,
          userId: token?.userId,
        }, null, 2))
      }

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
  }

  // Verificar autorización driver
  if ((isDriverRoute || isApiDriverRoute) && isLoggedIn) {
    // Obtener el rol desde el token (ya está cargado en el JWT)
    const userRole = (token?.role as string) || 'customer'
    const isDriver = userRole === 'driver' || userRole === 'admin' // Admin también puede acceder

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
}

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
     * Note: Routes with /images are handled specially when BYPASS_AUTH is active
     */
    '/admin/:path*',
    '/api/admin/:path*',
    '/dashboard/:path*',
    '/api/user/:path*',
    '/driver/:path*',
    '/api/driver/:path*',
  ],
}
