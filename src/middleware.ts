// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE CON CLERK ACTIVADO
// ===================================

import { authMiddleware } from '@clerk/nextjs/server';

// Middleware de Clerk v5 con configuración optimizada para Vercel
export default authMiddleware({
  // Rutas públicas que NO requieren autenticación
  publicRoutes: [
    '/',
    '/shop',
    '/shop/(.*)',
    '/product/(.*)',
    '/category/(.*)',
    '/about',
    '/contact',
    '/api/products',
    '/api/categories',
    '/api/test',
    '/api/payments/create-preference',
    '/api/payments/webhook',
    '/api/payments/status',
    '/api/auth/webhook',
    '/signin(.*)',
    '/signup(.*)',
    '/sso-callback(.*)',
  ],

  // Configuración adicional para Vercel
  debug: false, // Desactivar debug en producción

  // Ignorar rutas que causan problemas en Vercel
  ignoredRoutes: [
    '/((?!api|trpc))(_next.*|.+\\.[\\w]+$)',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ],
});

// Configuración del matcher mínima para Vercel
export const config = {
  matcher: [
    // Solo procesar rutas que no sean archivos estáticos
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|robots.txt|sitemap.xml).*)',
  ],
};
