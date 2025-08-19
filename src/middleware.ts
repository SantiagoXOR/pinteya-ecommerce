import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

// ✅ MIDDLEWARE OPTIMIZADO: CSP específico para admin + protección Clerk
// Configuración enterprise-ready basada en mejores prácticas Next.js + Clerk

// ✅ ROUTE MATCHERS optimizados
const isPublicRoute = createRouteMatcher([
  '/', '/shop(.*)', '/search(.*)', '/product(.*)', '/category(.*)',
  '/about', '/contact', '/signin(.*)', '/signup(.*)', '/sso-callback(.*)',
  '/api/products(.*)', '/api/categories(.*)', '/api/search(.*)', '/api/payments/webhook',
  '/api/auth/webhook', '/api/webhooks(.*)', '/api/debug(.*)', '/api/debug-clerk-session',
  '/clerk-status', '/debug-clerk', '/debug-auth', '/test-admin-access', '/debug-user', '/debug-simple',
  '/test-dashboard', '/test-admin-simple', '/api/test-admin-middleware', '/test-auth-status',
  '/admin/page-simple'
  // ✅ AUTENTICACIÓN RESTAURADA: /admin removido - requiere autenticación
])

// ✅ RUTAS API ADMIN - Manejar autenticación interna en cada API
const isAdminApiRoute = createRouteMatcher(['/api/admin(.*)'])

const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, req: NextRequest) => {
  console.log('🔍 [MIDDLEWARE] Request to:', req.nextUrl.pathname);

  // ✅ CSP ESPECÍFICO PARA ADMIN - Basado en mejores prácticas Next.js
  const response = NextResponse.next()

  // ✅ PERMITIR APIs ADMIN - Manejan autenticación internamente
  if (isAdminApiRoute(req)) {
    console.log('🔧 [MIDDLEWARE] Admin API route - allowing through for internal auth:', req.nextUrl.pathname);
    return response
  }

  if (isAdminRoute(req)) {
    // Generar nonce único para cada request
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
    const isDev = process.env.NODE_ENV === 'development'

    // CSP optimizado para admin panel
    const cspHeader = `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : "'strict-dynamic'"};
      style-src 'self' 'nonce-${nonce}' 'unsafe-inline';
      img-src 'self' data: blob: *.vercel.app *.supabase.co;
      font-src 'self' data:;
      connect-src 'self' *.supabase.co *.clerk.accounts.dev *.clerk.dev *.vercel.app;
      frame-src 'self' *.clerk.accounts.dev *.clerk.dev;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    `.replace(/\s+/g, ' ').trim()

    response.headers.set('Content-Security-Policy', cspHeader)
    response.headers.set('X-Nonce', nonce)

    console.log('🛡️ [MIDDLEWARE] CSP aplicado para admin:', req.nextUrl.pathname);

    // Proteger ruta admin
    await auth.protect()
  } else if (!isPublicRoute(req)) {
    console.log('[MIDDLEWARE] Protecting non-public route:', req.nextUrl.pathname);
    await auth.protect()
  }

  console.log('[MIDDLEWARE] Request allowed to proceed');
  return response
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
