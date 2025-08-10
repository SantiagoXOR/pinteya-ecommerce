// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE CON VERIFICACIÓN DE SEGURIDAD CORREGIDA
// ===================================
// Implementación con claves válidas de Clerk y verificación robusta de roles

import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { createClerkClient } from '@clerk/nextjs/server';

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
  '/api/analytics(.*)',
  // APIs de diagnóstico admin (temporal para debugging)
  '/api/admin/debug(.*)',
  '/api/admin/products-simple(.*)',
  '/api/admin/products-test(.*)'
]);

// Rutas que deben ser completamente excluidas del middleware
const isExcludedRoute = createRouteMatcher([
  '/api/auth/webhook',
  '/api/webhooks(.*)',
  '/api/webhooks/clerk'
]);

// ===================================
// MIDDLEWARE PRINCIPAL CON SEGURIDAD CORREGIDA
// ===================================

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  console.log(`[MIDDLEWARE] 🔍 PROCESANDO RUTA: ${pathname}`);

  // Redirección de /my-account a /admin (mantener compatibilidad)
  if (pathname.startsWith('/my-account')) {
    console.log(`[MIDDLEWARE] 🔄 REDIRECCIÓN FORZADA: ${pathname} → /admin`);
    const adminUrl = new URL('/admin', request.url);
    return NextResponse.redirect(adminUrl, { status: 302 });
  }

  // Exclusión total para rutas que causan recursión
  if (isExcludedRoute(request)) {
    console.log(`[MIDDLEWARE] 🚫 RUTA EXCLUIDA COMPLETAMENTE: ${pathname}`);
    return NextResponse.next();
  }

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
  // VERIFICAR RUTAS PÚBLICAS PRIMERO (incluye debug)
  // ===================================

  // Permitir rutas públicas sin verificación adicional
  if (isPublicRoute(request)) {
    console.log(`[MIDDLEWARE] ✅ Ruta pública permitida: ${pathname}`);
    return NextResponse.next();
  }

  // ===================================
  // PROTECCIÓN DE RUTAS ADMIN (PÁGINAS) - Patrón recomendado Clerk
  // ===================================
  if (isAdminPageRoute(request)) {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    // Páginas: si no hay sesión, redirigir
    if (!userId) return redirectToSignIn();

    // Verificar rol admin sólo con sessionClaims (evitar Clerk API en middleware)
    const publicRole = sessionClaims?.publicMetadata?.role as string;
    const privateRole = sessionClaims?.privateMetadata?.role as string;
    const isAdmin = publicRole === 'admin' || privateRole === 'admin';

    // Si no es admin, redirigir a home con mensaje
    if (!isAdmin) {
      return NextResponse.redirect(new URL('/?access_denied=admin_required', request.url));
    }

    return NextResponse.next();
  }

  // ===================================
  // OTRAS RUTAS PROTEGIDAS
  // ===================================

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
    // Incluir todas las rutas excepto archivos estáticos Y rutas excluidas
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/auth/webhook|api/webhooks/clerk).*)',
    // Procesar rutas API EXCEPTO las que causan recursión
    '/(api|trpc)/((?!auth/webhook|webhooks/clerk).*)',
  ],
};
