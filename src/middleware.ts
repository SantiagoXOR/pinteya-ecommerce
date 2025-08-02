// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE CON REDIRECCIÓN INTELIGENTE
// ===================================
// Implementación basada en mejores prácticas de Clerk

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
// FUNCIÓN AUXILIAR PARA VERIFICAR ROLES
// ===================================

/**
 * Verifica si un usuario tiene rol admin usando múltiples métodos
 * Combina sessionClaims y cliente directo de Clerk para máxima compatibilidad
 */
async function isUserAdmin(userId: string, sessionClaims: any): Promise<{isAdmin: boolean, method: string, roleValue: string}> {
  try {
    // Método 1: Verificar sessionClaims (más rápido)
    const publicRole = sessionClaims?.publicMetadata?.role as string;
    const privateRole = sessionClaims?.privateMetadata?.role as string;
    const metadataRole = sessionClaims?.metadata?.role as string;

    if (publicRole === 'admin') {
      return { isAdmin: true, method: 'sessionClaims.publicMetadata', roleValue: publicRole };
    }
    if (privateRole === 'admin') {
      return { isAdmin: true, method: 'sessionClaims.privateMetadata', roleValue: privateRole };
    }
    if (metadataRole === 'admin') {
      return { isAdmin: true, method: 'sessionClaims.metadata', roleValue: metadataRole };
    }

    // Método 2: Verificar con cliente directo de Clerk (fallback)
    console.log(`[MIDDLEWARE] 🔄 SessionClaims no tiene rol admin, verificando con cliente directo...`);

    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY!
    });

    const clerkUser = await clerkClient.users.getUser(userId);

    const userPublicRole = clerkUser.publicMetadata?.role as string;
    const userPrivateRole = clerkUser.privateMetadata?.role as string;

    if (userPublicRole === 'admin') {
      return { isAdmin: true, method: 'clerkClient.publicMetadata', roleValue: userPublicRole };
    }
    if (userPrivateRole === 'admin') {
      return { isAdmin: true, method: 'clerkClient.privateMetadata', roleValue: userPrivateRole };
    }

    return { isAdmin: false, method: 'none', roleValue: 'none' };

  } catch (error) {
    console.error(`[MIDDLEWARE] ❌ Error verificando rol admin:`, error);
    return { isAdmin: false, method: 'error', roleValue: 'error' };
  }
}

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

    // Usar función auxiliar para verificación robusta de roles
    const adminCheck = await isUserAdmin(userId, sessionClaims);

    console.log(`[MIDDLEWARE] 🔍 VERIFICACIÓN ADMIN ROBUSTA:`, {
      userId,
      pathname,
      isAdmin: adminCheck.isAdmin,
      method: adminCheck.method,
      roleValue: adminCheck.roleValue,
      sessionClaimsExists: !!sessionClaims
    });

    if (!adminCheck.isAdmin) {
      console.error(`[MIDDLEWARE] ❌ ACCESO ADMIN DENEGADO:`, {
        userId,
        pathname,
        method: adminCheck.method,
        roleValue: adminCheck.roleValue,
        reason: 'No se encontró rol admin en ningún método de verificación'
      });

      // En lugar de redirigir a my-account (que causaba el ciclo), devolver 403
      return new NextResponse('Acceso denegado - Se requieren permisos de administrador', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      });
    }

    console.log(`[MIDDLEWARE] ✅ ACCESO ADMIN AUTORIZADO:`, {
      userId,
      pathname,
      method: adminCheck.method,
      roleValue: adminCheck.roleValue
    });
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

    // Usar función auxiliar para verificación robusta de roles
    const adminCheck = await isUserAdmin(userId, sessionClaims);

    console.log(`[MIDDLEWARE] 🔍 VERIFICACIÓN ADMIN EN RUTA USUARIO:`, {
      userId,
      pathname,
      isAdmin: adminCheck.isAdmin,
      method: adminCheck.method,
      roleValue: adminCheck.roleValue
    });

    if (adminCheck.isAdmin) {
      console.log(`[MIDDLEWARE] 🚀 ADMIN DETECTADO EN RUTA DE USUARIO - REDIRIGIENDO A /admin`, {
        userId,
        fromPath: pathname,
        toPath: '/admin',
        method: adminCheck.method,
        roleValue: adminCheck.roleValue
      });
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
