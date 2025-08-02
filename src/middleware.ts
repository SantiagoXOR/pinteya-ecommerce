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

// 🚨 RUTAS QUE DEBEN SER COMPLETAMENTE EXCLUIDAS DEL MIDDLEWARE
// Estas rutas causan recursión si pasan por el middleware de Clerk
const isExcludedRoute = createRouteMatcher([
  '/api/auth/webhook',
  '/api/webhooks(.*)',
  '/api/webhooks/clerk' // ⚠️ CRÍTICO: Webhook activo de Clerk
]);

// Rutas que requieren autenticación básica (usuarios normales)
const isUserRoute = createRouteMatcher(['/my-account(.*)']);

// ===================================
// MIDDLEWARE PRINCIPAL CON CLERK
// ===================================

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  console.log(`[MIDDLEWARE] 🔍 PROCESANDO RUTA: ${pathname}`);

  // 🚨 EXCLUSIÓN TOTAL PARA RUTAS QUE CAUSAN RECURSIÓN
  // Estas rutas NO deben pasar por el middleware de Clerk bajo ninguna circunstancia
  if (isExcludedRoute(request)) {
    console.log(`[MIDDLEWARE] 🚫 RUTA EXCLUIDA COMPLETAMENTE: ${pathname} - Sin procesamiento Clerk`);
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
  // PROTECCIÓN DE RUTAS ADMIN CON VERIFICACIÓN DE ROLES
  // ===================================

  // ===================================
  // PROTECCIÓN DE RUTAS ADMIN
  // ===================================

  // Proteger rutas admin con verificación de roles mejorada
  if (isAdminRoute(request)) {
    console.log(`[MIDDLEWARE] 🔒 RUTA ADMIN DETECTADA: ${pathname}`);

    const { userId, sessionClaims, redirectToSignIn } = await auth();

    if (!userId) {
      console.warn(`[MIDDLEWARE] ❌ Usuario no autenticado - Redirigiendo a signin`);
      return redirectToSignIn();
    }

    // Verificar múltiples estructuras de metadata para compatibilidad
    const publicRole = sessionClaims?.publicMetadata?.role as string;
    const privateRole = sessionClaims?.privateMetadata?.role as string;
    const metadataRole = sessionClaims?.metadata?.role as string; // Estructura recomendada por Clerk

    const hasAdminRole = publicRole === 'admin' ||
                        privateRole === 'admin' ||
                        metadataRole === 'admin';

    console.log(`[MIDDLEWARE] 🔍 VERIFICACIÓN DE ROLES DETALLADA:`, {
      userId,
      publicRole,
      privateRole,
      metadataRole,
      hasAdminRole,
      sessionClaims: JSON.stringify(sessionClaims, null, 2)
    });

    if (!hasAdminRole) {
      console.warn(`[MIDDLEWARE] ❌ Usuario sin permisos admin - Acceso denegado`);
      // En lugar de redirigir a my-account (que causaba el ciclo), devolver 403
      return new NextResponse('Acceso denegado - Se requieren permisos de administrador', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    }

    console.log(`[MIDDLEWARE] ✅ Acceso admin autorizado para ${userId}`);
    return NextResponse.next();
  }

  // ===================================
  // PROTECCIÓN DE RUTAS DE USUARIO
  // ===================================

  // Proteger rutas de usuario (my-account) - requiere autenticación básica
  if (isUserRoute(request)) {
    console.log(`[MIDDLEWARE] 🔒 RUTA DE USUARIO DETECTADA: ${pathname}`);

    const { userId, sessionClaims, redirectToSignIn } = await auth();

    if (!userId) {
      console.warn(`[MIDDLEWARE] ❌ Usuario no autenticado - Redirigiendo a signin`);
      return redirectToSignIn();
    }

    // Verificar si es admin y redirigir a panel admin
    const publicRole = sessionClaims?.publicMetadata?.role as string;
    const privateRole = sessionClaims?.privateMetadata?.role as string;
    const metadataRole = sessionClaims?.metadata?.role as string;

    const isAdmin = publicRole === 'admin' ||
                   privateRole === 'admin' ||
                   metadataRole === 'admin';

    if (isAdmin) {
      console.log(`[MIDDLEWARE] 🚀 ADMIN DETECTADO EN RUTA DE USUARIO - REDIRIGIENDO A /admin`);
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    console.log(`[MIDDLEWARE] ✅ Usuario normal autenticado - Permitiendo acceso a ${pathname}`);
    return NextResponse.next();
  }

  // ===================================
  // RUTAS PÚBLICAS Y OTRAS PROTEGIDAS
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
    // Incluir todas las rutas excepto archivos estáticos Y rutas excluidas
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/auth/webhook|api/webhooks/clerk).*)',
    // Procesar rutas API EXCEPTO las que causan recursión (sintaxis corregida)
    '/(api|trpc)/((?!auth/webhook|webhooks/clerk).*)',
  ],
};
