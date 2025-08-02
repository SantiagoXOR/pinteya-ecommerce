// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE MODERNIZADO
// ===================================
// Implementación siguiendo mejores prácticas oficiales de Clerk v5

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// ===================================
// DEFINICIÓN DE RUTAS (SIMPLIFICADA)
// ===================================

// Rutas que requieren autenticación admin
const isAdminRoute = createRouteMatcher([
  '/api/admin(.*)',
  '/admin(.*)'
])

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
])

// ===================================
// MIDDLEWARE PRINCIPAL MODERNIZADO
// ===================================

export default clerkMiddleware(async (auth, req) => {
  // Redirección de /my-account a /admin (mantener compatibilidad)
  if (req.nextUrl.pathname.startsWith('/my-account')) {
    const adminUrl = new URL('/admin', req.url)
    return Response.redirect(adminUrl, 302)
  }

  // Proteger rutas admin con verificación automática de roles
  if (isAdminRoute(req)) {
    await auth.protect({ role: 'admin' })
  }

  // Proteger otras rutas autenticadas
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
