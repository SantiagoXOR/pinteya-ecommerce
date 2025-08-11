import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// ✅ MIDDLEWARE CON SEGURIDAD RESTAURADA
// Protege rutas admin con autenticación Clerk

const isPublicRoute = createRouteMatcher([
  '/', '/shop(.*)', '/search(.*)', '/product(.*)', '/category(.*)',
  '/about', '/contact', '/signin(.*)', '/signup(.*)', '/sso-callback(.*)',
  '/api/products(.*)', '/api/categories(.*)', '/api/search(.*)', '/api/payments/webhook',
  '/api/auth/webhook', '/api/webhooks(.*)', '/api/debug(.*)', '/api/debug-clerk-session',
  '/clerk-status', '/debug-clerk', '/debug-auth', '/test-admin-access', '/debug-user', '/debug-simple',
  '/test-dashboard', '/test-admin-simple', '/api/test-admin-middleware'
  // ✅ SEGURIDAD RESTAURADA: '/admin(.*)' y '/api/admin(.*)' removidos de rutas públicas
])

export default clerkMiddleware(async (auth, req) => {
  console.log('🔍 [MIDDLEWARE] Request to:', req.nextUrl.pathname);

  // ✅ PROTECCIÓN RESTAURADA: Solo rutas públicas definidas arriba
  // Rutas admin requieren autenticación
  if (!isPublicRoute(req)) {
    console.log('[MIDDLEWARE] Protecting non-public route:', req.nextUrl.pathname);
    await auth.protect()
  }

  console.log('[MIDDLEWARE] Request allowed to proceed');
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
