import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { currentUser } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isPublicRoute = createRouteMatcher([
  '/', '/shop(.*)', '/search(.*)', '/product(.*)', '/category(.*)',
  '/about', '/contact', '/signin(.*)', '/signup(.*)', '/sso-callback(.*)',
  '/api/products(.*)', '/api/categories(.*)', '/api/payments/webhook',
  '/api/auth/webhook', '/api/webhooks(.*)', '/api/debug(.*)',
  '/clerk-status', '/debug-clerk', '/debug-auth',
])

export default clerkMiddleware(async (auth, req) => {
  // Proteger rutas admin con verificación personalizada
  if (isAdminRoute(req)) {
    const { userId, sessionClaims } = await auth()

    if (!userId) {
      // Redirigir a login si no está autenticado
      const signInUrl = new URL('/signin', req.url)
      signInUrl.searchParams.set('redirect_url', req.url)
      return Response.redirect(signInUrl)
    }

    try {
      // Obtener información completa del usuario
      const user = await currentUser()

      // Verificar rol de admin en múltiples ubicaciones
      const hasAdminRole = sessionClaims?.metadata?.role === 'admin' ||
                          sessionClaims?.role === 'admin' ||
                          sessionClaims?.publicMetadata?.role === 'admin' ||
                          user?.publicMetadata?.role === 'admin' ||
                          user?.privateMetadata?.role === 'admin'

      console.log('🔍 [MIDDLEWARE] Verificación de admin:', {
        userId,
        sessionClaimsRole: sessionClaims?.role,
        sessionClaimsMetadataRole: sessionClaims?.metadata?.role,
        sessionClaimsPublicMetadataRole: sessionClaims?.publicMetadata?.role,
        userPublicMetadataRole: user?.publicMetadata?.role,
        userPrivateMetadataRole: user?.privateMetadata?.role,
        hasAdminRole
      })

      if (!hasAdminRole) {
        // Redirigir con mensaje de acceso denegado
        const deniedUrl = new URL('/', req.url)
        deniedUrl.searchParams.set('access_denied', 'admin_required')
        return Response.redirect(deniedUrl)
      }
    } catch (error) {
      console.error('❌ [MIDDLEWARE] Error verificando usuario:', error)
      // En caso de error, redirigir a home
      const deniedUrl = new URL('/', req.url)
      deniedUrl.searchParams.set('access_denied', 'verification_error')
      return Response.redirect(deniedUrl)
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
