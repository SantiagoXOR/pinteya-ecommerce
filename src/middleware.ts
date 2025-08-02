// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE CON REDIRECCIÓN INTELIGENTE
// ===================================
// Implementación basada en mejores prácticas de Clerk

import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

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
  '/my-account(.*)', // Permitir acceso a my-account para interceptar
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

// Rutas que requieren redirección inteligente después del login
const isMyAccountRoute = createRouteMatcher(['/my-account(.*)']);

// ===================================
// MIDDLEWARE PRINCIPAL CON CLERK
// ===================================

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  console.log(`[MIDDLEWARE] 🔍 PROCESANDO RUTA: ${pathname}`);

  // Skip inmediato para rutas estáticas (performance crítico)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/_not-found'
  ) {
    return NextResponse.next();
  }

  // Skip inmediato para webhooks (CRÍTICO para producción)
  if (pathname.startsWith('/api/webhooks/')) {
    console.log(`[MIDDLEWARE] Webhook detectado: ${pathname} - Permitiendo acceso directo`);
    return NextResponse.next();
  }

  // ===================================
  // REDIRECCIÓN INTELIGENTE BASADA EN ROLES
  // ===================================

  // Interceptar acceso a /my-account para redirección inteligente
  if (isMyAccountRoute(request)) {
    console.log(`[MIDDLEWARE] 🎯 INTERCEPTANDO MY-ACCOUNT: ${pathname}`);

    const { userId, sessionClaims } = await auth();

    if (userId) {
      const userRole = sessionClaims?.publicMetadata?.role as string;
      const privateRole = sessionClaims?.privateMetadata?.role as string;

      console.log(`[MIDDLEWARE] 🔍 USUARIO EN MY-ACCOUNT:`, {
        userId,
        publicRole: userRole,
        privateRole: privateRole
      });

      // Si es admin, redirigir a /admin
      if (userRole === 'admin' || privateRole === 'admin') {
        console.log(`[MIDDLEWARE] 🚀 ADMIN DETECTADO - REDIRIGIENDO A /admin`);
        return NextResponse.redirect(new URL('/admin', request.url));
      }

      console.log(`[MIDDLEWARE] ✅ Usuario normal - Permitiendo acceso a my-account`);
    }

    // Permitir acceso a my-account (para usuarios normales o no autenticados)
    return NextResponse.next();
  }

  // ===================================
  // PROTECCIÓN DE RUTAS ADMIN
  // ===================================

  // Proteger rutas admin
  if (isAdminRoute(request)) {
    console.log(`[MIDDLEWARE] 🔒 RUTA ADMIN DETECTADA: ${pathname}`);

    const { userId, sessionClaims, redirectToSignIn } = await auth();

    if (!userId) {
      console.warn(`[MIDDLEWARE] ❌ Usuario no autenticado - Redirigiendo a signin`);
      return redirectToSignIn();
    }

    const userRole = sessionClaims?.publicMetadata?.role as string;
    const privateRole = sessionClaims?.privateMetadata?.role as string;
    const hasAdminRole = userRole === 'admin' || privateRole === 'admin';

    if (!hasAdminRole) {
      console.warn(`[MIDDLEWARE] ❌ Usuario sin permisos admin - Redirigiendo a my-account`);
      return NextResponse.redirect(new URL('/my-account', request.url));
    }

    console.log(`[MIDDLEWARE] ✅ Acceso admin autorizado para ${userId}`);
    return NextResponse.next();
  }

  // ===================================
  // RUTAS PÚBLICAS Y PROTEGIDAS
  // ===================================

  // Permitir rutas públicas sin verificación adicional
  if (isPublicRoute(request)) {
    console.log(`[MIDDLEWARE] ✅ Ruta pública permitida: ${pathname}`);
    return NextResponse.next();
  }

  // Para otras rutas protegidas, verificar autenticación básica
  const { userId, redirectToSignIn } = await auth();
  if (!userId) {
    console.log(`[MIDDLEWARE] 🔒 Ruta protegida - Redirigiendo a signin: ${pathname}`);
    return redirectToSignIn();
  }

  console.log(`[MIDDLEWARE] ✅ Usuario autenticado - Permitiendo acceso: ${pathname}`);
  return NextResponse.next();
});

// ===================================
// CONFIGURACIÓN DEL MATCHER
// ===================================

export const config = {
  matcher: [
    // Incluir todas las rutas excepto archivos estáticos
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Siempre procesar rutas API
    '/(api|trpc)(.*)',
  ],
};
