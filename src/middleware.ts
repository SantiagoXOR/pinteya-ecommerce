// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE COMPATIBLE CON SSG
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from './middleware/security';

/**
 * Middleware optimizado para performance
 * Validaciones mínimas para rutas críticas
 */
export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip inmediato para rutas estáticas (performance crítico)
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/_not-found' ||
    pathname.startsWith('/api/analytics') // Skip analytics para performance
  ) {
    return NextResponse.next();
  }

  // Aplicar middleware de seguridad solo para rutas críticas
  if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard')) {
    const securityResponse = securityMiddleware(request);
    if (securityResponse) {
      return securityResponse;
    }
  }

  // Rutas públicas que siempre están permitidas
  const publicRoutes = [
    '/',
    '/shop',
    '/search',
    '/product',
    '/category',
    '/about',
    '/contact',
    '/signin',
    '/signup',
    '/sso-callback',
    '/admin',
    '/test-env',
    '/debug-clerk',
    '/test-clerk',
  ];

  // Rutas de API que siempre están permitidas
  const publicApiRoutes = [
    '/api/products',
    '/api/categories',
    '/api/test',
    '/api/payments/create-preference',
    '/api/payments/webhook',
    '/api/payments/status',
    '/api/auth/webhook',
    '/api/debug',
  ];

  // Verificar si es ruta pública
  const isPublicRoute = publicRoutes.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  );

  const isPublicApiRoute = publicApiRoutes.some(route =>
    pathname.startsWith(route)
  );

  // Permitir rutas públicas
  if (isPublicRoute || isPublicApiRoute) {
    return NextResponse.next();
  }

  // Para rutas protegidas, verificar si Clerk está disponible
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Si no hay Clerk configurado, permitir acceso (modo desarrollo)
  if (!publishableKey) {
    return NextResponse.next();
  }

  // En producción con Clerk, la autenticación se maneja en el frontend
  // El middleware no bloquea para evitar problemas con SSG
  return NextResponse.next();
}

// Configuración del matcher optimizada para performance
export const config = {
  matcher: [
    // Matcher más específico para reducir overhead
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|robots.txt|sitemap.xml|api/analytics).*)',
    // Solo procesar rutas admin y dashboard para seguridad
    '/admin/:path*',
    '/dashboard/:path*'
  ],
};
