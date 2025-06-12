// ===================================
// PINTEYA E-COMMERCE - MIDDLEWARE CLERK V5
// ===================================

import { authMiddleware } from '@clerk/nextjs/server';

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
    '/signin(.*)',
    '/signup(.*)',
    '/sso-callback(.*)',
  ],

  // Configuración adicional
  debug: process.env.NODE_ENV === 'development',
});

// Configuración del matcher para Clerk v5
export const config = {
  matcher: [
    // Incluir todas las rutas excepto archivos estáticos y _next
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Incluir siempre las rutas de API
    '/(api|trpc)(.*)',
  ],
};
