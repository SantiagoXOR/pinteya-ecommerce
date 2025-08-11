import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isPublicRoute = createRouteMatcher([
  '/', '/shop(.*)', '/search(.*)', '/product(.*)', '/category(.*)',
  '/about', '/contact', '/signin(.*)', '/signup(.*)', '/sso-callback(.*)',
  '/api/products(.*)', '/api/categories(.*)', '/api/payments/webhook',
  '/api/auth/webhook', '/api/webhooks(.*)', '/api/debug(.*)',
  '/clerk-status', '/debug-clerk', '/debug-auth', '/test-admin-access', '/debug-user', '/debug-simple',
])

export default clerkMiddleware(async (auth, req) => {
  try {
    // Proteger rutas admin con verificación personalizada
    if (isAdminRoute(req)) {
      const { userId, sessionClaims } = await auth()

      if (!userId) {
        // Redirigir a login si no está autenticado
        const signInUrl = new URL('/signin', req.url)
        signInUrl.searchParams.set('redirect_url', req.url)
        return Response.redirect(signInUrl)
      }

      // Verificar rol de admin usando solo sessionClaims (compatible con middleware)
      const hasAdminRole = sessionClaims?.metadata?.role === 'admin' ||
                          sessionClaims?.role === 'admin' ||
                          sessionClaims?.publicMetadata?.role === 'admin'

      if (!hasAdminRole) {
        // Redirigir con mensaje de acceso denegado
        const deniedUrl = new URL('/', req.url)
        deniedUrl.searchParams.set('access_denied', 'admin_required')
        return Response.redirect(deniedUrl)
      }
    }

    // Proteger otras rutas autenticadas
    if (!isPublicRoute(req)) {
      await auth.protect()
    }
  } catch (error) {
    // En caso de error crítico, permitir acceso a rutas públicas pero bloquear admin
    if (isAdminRoute(req)) {
      const deniedUrl = new URL('/', req.url)
      deniedUrl.searchParams.set('access_denied', 'middleware_error')
      return Response.redirect(deniedUrl)
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
