// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE MODERNIZADO (VERSIÓN CORREGIDA)
// ===================================
// Implementación siguiendo mejores prácticas oficiales de Clerk v5
// CORREGIDO: Compatible con configuración actual de roles

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// ===================================
// DEFINICIÓN DE RUTAS
// ===================================

// Rutas que requieren autenticación admin
const isAdminRoute = createRouteMatcher([
  '/api/admin(.*)',
  '/admin(.*)'
]);

// Rutas públicas que NO requieren autenticación
const isPublicRoute = createRouteMatcher([
  '/',
  '/shop(.*)',
  '/search(.*)',
  '/product(.*)',
  '/category(.*)',
  '/about',
  '/contact',
  '/signin(.*)',
  '/signup(.*)',
  '/sso-callback(.*)',
  // REMOVIDO: '/my-account(.*)' - Ahora será ruta protegida
  // APIs públicas
  '/api/products(.*)',
  '/api/categories(.*)',
  '/api/test(.*)',
  '/api/payments/create-preference',
  '/api/payments/webhook',
  '/api/payments/status',
  '/api/auth/webhook',
  '/api/webhooks(.*)',
  '/api/debug(.*)',
  '/api/analytics(.*)'
]);

// ===================================
// MIDDLEWARE PRINCIPAL MODERNIZADO (CORREGIDO)
// ===================================

export default clerkMiddleware(async (auth, req) => {
  // Redirección de /my-account a /admin (mantener compatibilidad)
  if (req.nextUrl.pathname.startsWith('/my-account')) {
    const adminUrl = new URL('/admin', req.url)
    return Response.redirect(adminUrl, 302)
  }

  // CORREGIDO: Para rutas admin, verificar autenticación Y roles manualmente
  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth()

    // Verificar que el usuario esté autenticado
    if (!userId) {
      // Redirigir a signin si no está autenticado
      const signInUrl = new URL('/signin', req.url)
      return Response.redirect(signInUrl, 302)
    }

    // Verificar rol admin en metadata
    const publicRole = sessionClaims?.publicMetadata?.role as string
    const privateRole = sessionClaims?.privateMetadata?.role as string
    const isAdmin = publicRole === 'admin' || privateRole === 'admin'

    if (!isAdmin) {
      // Redirigir a homepage si no es admin
      const homeUrl = new URL('/', req.url)
      return Response.redirect(homeUrl, 302)
    }

    // Si es admin, permitir acceso
    return
  }

  // Para otras rutas protegidas, solo verificar autenticación básica
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

// ===================================
// CONFIGURACIÓN DEL MATCHER (SIMPLIFICADA)
// ===================================

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
