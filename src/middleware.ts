// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE MEJORADO CON CLERK
// ===================================
// DEBUG: Forzar recompilación - Fix publicMetadata

import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { securityMiddleware } from './middleware/security';
// Importaciones simplificadas para Edge Runtime
// No importar session-management que usa Redis

// ===================================
// DEFINICIÓN DE RUTAS
// ===================================

// Rutas que requieren autenticación admin
const isAdminRoute = createRouteMatcher([
  '/api/admin(.*)',
  '/admin(.*)'  // ← Agregar rutas admin del frontend
]);

// Rutas admin que NO requieren autenticación (para corrección de roles)
const isAdminExceptionRoute = createRouteMatcher(['/api/admin/fix-santiago-role(.*)']);

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
  '/test-env',
  '/debug-clerk',
  '/test-clerk',
  // APIs públicas
  '/api/products(.*)',
  '/api/categories(.*)',
  '/api/test(.*)',
  '/api/payments/create-preference',
  '/api/payments/webhook',
  '/api/payments/status',
  '/api/auth/webhook',
  '/api/webhooks(.*)', // Todos los webhooks (Clerk, MercadoPago, etc.)
  '/api/debug(.*)',
  '/api/analytics(.*)' // Skip analytics para performance
]);

// ===================================
// MIDDLEWARE PRINCIPAL CON CLERK
// ===================================

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

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

  // Aplicar middleware de seguridad para todas las rutas
  const securityResponse = securityMiddleware(request);
  if (securityResponse && securityResponse.status !== 200) {
    return securityResponse;
  }

  // Permitir rutas admin de excepción sin autenticación
  if (isAdminExceptionRoute(request)) {
    console.log(`[MIDDLEWARE] Permitiendo acceso sin auth a ruta de excepción: ${pathname}`);
    return NextResponse.next();
  }

  // Proteger rutas admin con Clerk y gestión de sesiones
  if (isAdminRoute(request)) {
    console.log(`[MIDDLEWARE] 🔍 RUTA ADMIN DETECTADA: ${pathname}`);
    try {
      // Verificar autenticación y rol admin
      const { userId, sessionClaims, sessionId } = await auth();

      console.log(`[MIDDLEWARE] 🔍 AUTH RESULT:`, {
        userId: userId || 'NULL',
        sessionId: sessionId || 'NULL',
        sessionClaims: sessionClaims ? JSON.stringify(sessionClaims, null, 2) : 'NULL'
      });

      if (!userId) {
        console.warn(`[MIDDLEWARE] ❌ Acceso denegado a ruta admin: ${pathname} - Usuario no autenticado`);
        return NextResponse.json(
          {
            error: 'Acceso denegado - Autenticación requerida',
            code: 'AUTH_REQUIRED'
          },
          { status: 401 }
        );
      }

      // Gestión básica de sesiones para rutas admin (sin Redis)
      if (sessionId) {
        console.log(`[MIDDLEWARE] Sesión activa para usuario ${userId}: ${sessionId}`);
        // En el middleware, solo verificamos que existe sessionId
        // La validación completa se hace en las APIs individuales
      }

      // Verificar rol de administrador en publicMetadata (FIXED + DEBUG)
      const userRole = sessionClaims?.publicMetadata?.role as string;
      const privateRole = sessionClaims?.privateMetadata?.role as string;
      console.log(`[MIDDLEWARE] Verificando acceso admin para ${pathname}:`);
      console.log(`[MIDDLEWARE] - Usuario: ${userId}`);
      console.log(`[MIDDLEWARE] - Rol público detectado: ${userRole || 'undefined'}`);
      console.log(`[MIDDLEWARE] - Rol privado detectado: ${privateRole || 'undefined'}`);
      console.log(`[MIDDLEWARE] - SessionClaims completo:`, JSON.stringify(sessionClaims, null, 2));

      // TEMPORAL: Verificar tanto public como private metadata para debug
      const hasAdminRole = (userRole === 'admin' || userRole === 'moderator') ||
                          (privateRole === 'admin' || privateRole === 'moderator');

      if (!hasAdminRole) {
        console.warn(`[MIDDLEWARE] Acceso denegado a ruta admin: ${pathname}`);
        console.warn(`[MIDDLEWARE] - Usuario: ${userId}`);
        console.warn(`[MIDDLEWARE] - Rol público: ${userRole || 'undefined'}`);
        console.warn(`[MIDDLEWARE] - Rol privado: ${privateRole || 'undefined'}`);
        console.warn(`[MIDDLEWARE] - Tiene admin role: ${hasAdminRole}`);

        // TEMPORAL: Para debug, permitir acceso si el usuario es santiago@xor.com.ar
        if (userId === 'user_30i3tqf6NUp8kpkwrMgVZBvogBD') {
          console.log(`[MIDDLEWARE] 🔧 DEBUG: Permitiendo acceso temporal para usuario admin conocido`);
          return NextResponse.next();
        }

        // Redirigir a /my-account en lugar de devolver JSON error
        const redirectUrl = new URL('/my-account', request.url);
        redirectUrl.searchParams.set('error', 'insufficient_permissions');
        redirectUrl.searchParams.set('message', 'Se requiere rol de administrador');

        console.log(`[MIDDLEWARE] Redirigiendo a: ${redirectUrl.toString()}`);
        return NextResponse.redirect(redirectUrl);
      }

      console.log(`[MIDDLEWARE] Acceso autorizado a ruta admin: ${pathname} - Usuario ${userId} con rol público: ${userRole}, rol privado: ${privateRole}`);
    } catch (error) {
      console.error('[MIDDLEWARE] Error en protección de ruta admin:', error);
      return NextResponse.json(
        {
          error: 'Error interno de autenticación',
          code: 'AUTH_ERROR'
        },
        { status: 500 }
      );
    }
  }

  // Permitir rutas públicas sin verificación adicional
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Para otras rutas protegidas, verificar autenticación básica con gestión de sesiones
  try {
    const { userId, sessionId } = await auth();
    if (!userId) {
      // Redirigir a signin para rutas protegidas no-admin
      const signInUrl = new URL('/signin', request.url);
      signInUrl.searchParams.set('redirect_url', request.url);
      return NextResponse.redirect(signInUrl);
    }

    // Gestión básica de sesiones para rutas protegidas (sin Redis)
    if (sessionId) {
      console.log(`[MIDDLEWARE] Sesión activa para usuario ${userId}: ${sessionId}`);
      // En el middleware, solo verificamos que existe sessionId
      // La validación completa se hace en las APIs individuales
    }
  } catch (error) {
    console.error('[MIDDLEWARE] Error en verificación de autenticación:', error);
    // En caso de error, permitir acceso (fail-open para evitar bloqueos)
    return NextResponse.next();
  }

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
