import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isAdminApiRoute = createRouteMatcher(['/api/admin(.*)', '/api/test-admin-middleware'])
const isPublicRoute = createRouteMatcher([
  '/', '/shop(.*)', '/search(.*)', '/product(.*)', '/category(.*)',
  '/about', '/contact', '/signin(.*)', '/signup(.*)', '/sso-callback(.*)',
  '/api/products(.*)', '/api/categories(.*)', '/api/search(.*)', '/api/payments/webhook',
  '/api/auth/webhook', '/api/webhooks(.*)', '/api/debug(.*)', '/api/debug-clerk-session',
  '/clerk-status', '/debug-clerk', '/debug-auth', '/test-admin-access', '/debug-user', '/debug-simple',
  '/test-dashboard',
])

export default clerkMiddleware(async (auth, req) => {
  // 🚨 MODO DEBUG TEMPORAL - PERMITIR ACCESO MIENTRAS DIAGNOSTICAMOS
  const DEBUG_MODE = true; // Cambiar a false después del diagnóstico

  // Proteger rutas admin con verificación de roles
  if (isAdminRoute(req) || isAdminApiRoute(req)) {
    try {
      const { userId, sessionClaims } = await auth.protect()

      if (!userId) {
        console.log('[MIDDLEWARE] No userId found, redirecting to signin')
        return NextResponse.redirect(new URL('/signin', req.url))
      }

      // 🔍 LOGGING EXTENSIVO PARA DIAGNÓSTICO
      console.log('🔍 [MIDDLEWARE DEBUG] FULL DIAGNOSTIC INFO:', {
        timestamp: new Date().toISOString(),
        userId,
        path: req.nextUrl.pathname,
        sessionClaims: sessionClaims ? JSON.stringify(sessionClaims, null, 2) : 'null',
        sessionClaimsKeys: sessionClaims ? Object.keys(sessionClaims) : [],
        publicMetadata: sessionClaims?.publicMetadata,
        metadata: sessionClaims?.metadata,
        allPossibleRoleLocations: {
          'sessionClaims.publicMetadata.role': sessionClaims?.publicMetadata?.role,
          'sessionClaims.metadata.role': sessionClaims?.metadata?.role,
          'sessionClaims.role': sessionClaims?.role,
          'sessionClaims.public_metadata.role': sessionClaims?.public_metadata?.role,
          'sessionClaims.user_metadata.role': sessionClaims?.user_metadata?.role
        }
      });

      // Verificar rol de admin en sessionClaims (checking multiple possible locations)
      let userRole = sessionClaims?.publicMetadata?.role ||
                     sessionClaims?.metadata?.role ||
                     sessionClaims?.role as string
      let isAdmin = userRole === 'admin'

      console.log('[MIDDLEWARE] Role detection result:', {
        userRole,
        isAdmin,
        detectedFrom: userRole ? 'sessionClaims' : 'none'
      })

      // Fallback: If role not found in sessionClaims, check directly with Clerk API
      if (!isAdmin && userId) {
        try {
          console.log('[MIDDLEWARE] Checking Clerk API for role...')
          const user = await clerkClient.users.getUser(userId)
          const roleFromApi = user.publicMetadata?.role as string

          console.log('[MIDDLEWARE] Clerk API result:', {
            roleFromApi,
            userPublicMetadata: user.publicMetadata,
            userPrivateMetadata: user.privateMetadata,
            userUnsafeMetadata: user.unsafeMetadata
          })

          isAdmin = roleFromApi === 'admin'
          userRole = roleFromApi
        } catch (apiError) {
          console.error('[MIDDLEWARE] Clerk API fallback failed:', apiError)
        }
      }

      // 🚨 MODO DEBUG: PERMITIR ACCESO TEMPORALMENTE
      if (DEBUG_MODE) {
        console.log('🚨 [DEBUG MODE] Allowing admin access for diagnostic purposes')
        console.log('[MIDDLEWARE] Admin access granted (DEBUG MODE)')
        return; // Permitir acceso
      }

      // Verificación normal (cuando DEBUG_MODE = false)
      if (!isAdmin) {
        console.log('[MIDDLEWARE] Access denied - not admin')
        if (isAdminApiRoute(req)) {
          return NextResponse.json(
            { error: 'Acceso denegado - Se requieren permisos de administrador' },
            { status: 403 }
          )
        } else {
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
