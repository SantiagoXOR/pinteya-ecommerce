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
const isAdminRoute = createRouteMatcher(['/api/admin(.*)']);

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
    try {
      // Verificar autenticación y rol admin
      const { userId, sessionClaims, sessionId } = await auth();

      if (!userId) {
        console.warn(`[MIDDLEWARE] Acceso denegado a ruta admin: ${pathname} - Usuario no autenticado`);
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

      // Verificar rol de administrador en publicMetadata (FIXED)
      const userRole = sessionClaims?.publicMetadata?.role as string;
      console.log(`[MIDDLEWARE] DEBUG - sessionClaims:`, JSON.stringify(sessionClaims, null, 2));
      console.log(`[MIDDLEWARE] DEBUG - publicMetadata:`, JSON.stringify(sessionClaims?.publicMetadata, null, 2));
      console.log(`[MIDDLEWARE] DEBUG - userRole:`, userRole);
      if (userRole !== 'admin' && userRole !== 'moderator') {
        console.warn(`[MIDDLEWARE] Acceso denegado a ruta admin: ${pathname} - Usuario ${userId} con rol: ${userRole}`);
        return NextResponse.json(
          {
            error: 'Acceso denegado - Se requiere rol de administrador',
            code: 'INSUFFICIENT_PERMISSIONS'
          },
          { status: 403 }
        );
      }

      console.log(`[MIDDLEWARE] Acceso autorizado a ruta admin: ${pathname} - Usuario ${userId} con rol: ${userRole}`);
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
