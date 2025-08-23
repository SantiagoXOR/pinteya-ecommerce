// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE CONSERVADOR (VERSIÓN ESTABLE)
// ===================================
// Implementación conservadora que mantiene la estructura original
// pero con mejoras mínimas y compatibilidad garantizada

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
  '/api/analytics(.*)'
]);

// Rutas que deben ser completamente excluidas del middleware
const isExcludedRoute = createRouteMatcher([
  '/api/auth/webhook',
  '/api/webhooks(.*)',
  '/api/webhooks/clerk'
]);

// ===================================
// MIDDLEWARE PRINCIPAL CONSERVADOR
// ===================================

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  // Redirección de /my-account a /admin (mantener compatibilidad)
  if (pathname.startsWith('/my-account')) {
    const adminUrl = new URL('/admin', request.url);
    return NextResponse.redirect(adminUrl, { status: 302 });
  }

  // Exclusión total para rutas que causan recursión
  if (isExcludedRoute(request)) {
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
    return NextResponse.next();
  }

  // ===================================
  // PROTECCIÓN DE RUTAS ADMIN (CONSERVADORA)
  // ===================================

  if (isAdminRoute(request)) {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    if (!session?.user) {
      return redirectToSignIn();
    }

    // Verificación robusta de roles con fallback a Clerk API
    const publicRole = sessionClaims?.publicMetadata?.role as string;
    const privateRole = sessionClaims?.privateMetadata?.role as string;

    let isAdmin = publicRole === 'admin' || privateRole === 'admin';

    // Si sessionClaims no tiene el rol, verificar directamente con Clerk
    if (!isAdmin) {
      try {
        const clerkClient = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY!
        });
        const clerkUser = await clerkClient.users.getUser(userId);
        const userPublicRole = clerkUser.publicMetadata?.role as string;
        const userPrivateRole = clerkUser.privateMetadata?.role as string;

        isAdmin = userPublicRole === 'admin' || userPrivateRole === 'admin';
      } catch (error) {
        console.error(`[MIDDLEWARE] Error verificando con Clerk API:`, error);
      }
    }

    if (!isAdmin) {
      // Redirigir a homepage
      return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
  }

  // ===================================
  // RUTAS PÚBLICAS Y OTRAS PROTEGIDAS
  // ===================================

  // Permitir rutas públicas sin verificación adicional
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Para otras rutas protegidas, verificar autenticación básica
  const { userId, redirectToSignIn } = await auth();
  if (!session?.user) {
    return redirectToSignIn();
  }

  return NextResponse.next();
});

// ===================================
// CONFIGURACIÓN DEL MATCHER (CONSERVADORA)
// ===================================

export const config = {
  matcher: [
    // Incluir todas las rutas excepto archivos estáticos Y rutas excluidas
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/auth/webhook|api/webhooks/clerk).*)',
    // Procesar rutas API EXCEPTO las que causan recursión
    '/(api|trpc)/((?!auth/webhook|webhooks/clerk).*)',
  ],
};
