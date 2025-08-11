import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isAdminApiRoute = createRouteMatcher(['/api/admin(.*)'])
const isPublicRoute = createRouteMatcher([
  '/', '/shop(.*)', '/search(.*)', '/product(.*)', '/category(.*)',
  '/about', '/contact', '/signin(.*)', '/signup(.*)', '/sso-callback(.*)',
  '/api/products(.*)', '/api/categories(.*)', '/api/search(.*)', '/api/payments/webhook',
  '/api/auth/webhook', '/api/webhooks(.*)', '/api/debug(.*)',
  '/clerk-status', '/debug-clerk', '/debug-auth', '/test-admin-access', '/debug-user', '/debug-simple',
  '/test-dashboard',
])

export default clerkMiddleware(async (auth, req) => {
  // Proteger rutas admin con verificación de roles
  if (isAdminRoute(req) || isAdminApiRoute(req)) {
    try {
      const { userId, sessionClaims } = await auth.protect()

      if (!userId) {
        console.log('[MIDDLEWARE] No userId found, redirecting to signin')
        return NextResponse.redirect(new URL('/signin', req.url))
      }

      // Verificar rol de admin en sessionClaims
      const userRole = sessionClaims?.metadata?.role as string
      const isAdmin = userRole === 'admin'

      console.log('[MIDDLEWARE] Admin route access attempt:', {
        userId,
        userRole,
        isAdmin,
        path: req.nextUrl.pathname
      })

      if (!isAdmin) {
        console.log('[MIDDLEWARE] Access denied - not admin')
        if (isAdminApiRoute(req)) {
          // Para APIs, devolver 403
          return NextResponse.json(
            { error: 'Acceso denegado - Se requieren permisos de administrador' },
            { status: 403 }
          )
        } else {
          // Para páginas, redirigir a home
          return NextResponse.redirect(new URL('/', req.url))
        }
      }

      console.log('[MIDDLEWARE] Admin access granted')
    } catch (error) {
      console.error('[MIDDLEWARE] Error in admin protection:', error)
      if (isAdminApiRoute(req)) {
        return NextResponse.json(
          { error: 'Error de autenticación' },
          { status: 401 }
        )
      } else {
        return NextResponse.redirect(new URL('/signin', req.url))
      }
    }
  }

  // Proteger otras rutas autenticadas
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
