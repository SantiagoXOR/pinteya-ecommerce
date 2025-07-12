// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE COMPATIBLE CON SSG
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from './middleware/security';

/**
 * Middleware híbrido que evita problemas con SSG
 * Incluye medidas de seguridad mejoradas
 */
export default function middleware(request: NextRequest) {
  // Aplicar middleware de seguridad primero
  const securityResponse = securityMiddleware(request);
  if (securityResponse) {
    return securityResponse;
  }
  const { pathname } = request.nextUrl;

  // Permitir todas las rutas estáticas y de Next.js
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

// Configuración del matcher mínima para Vercel
export const config = {
  matcher: [
    // Solo procesar rutas que no sean archivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|robots.txt|sitemap.xml).*)',
  ],
};
