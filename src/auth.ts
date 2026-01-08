import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { SupabaseAdapter } from './lib/integrations/supabase/supabase-adapter'
import { upsertUserProfile, getUserRole } from './lib/auth/role-service'

// Validación de variables de entorno requeridas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const googleClientId = process.env.AUTH_GOOGLE_ID
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET
// NextAuth v4 usa NEXTAUTH_URL
const nextAuthUrl = process.env.NEXTAUTH_URL
const nextAuthSecret = process.env.NEXTAUTH_SECRET

// Log de variables de entorno (sin exponer secretos)
console.log('[NextAuth v4 Init] Checking environment variables...')
console.log('[NextAuth v4 Init] AUTH_GOOGLE_ID:', googleClientId ? `✅ SET (${googleClientId.substring(0, 20)}...)` : '❌ NOT SET')
console.log('[NextAuth v4 Init] AUTH_GOOGLE_SECRET:', googleClientSecret ? `✅ SET (${googleClientSecret.substring(0, 10)}...)` : '❌ NOT SET')
console.log('[NextAuth v4 Init] NEXTAUTH_URL:', nextAuthUrl || 'NOT SET')
console.log('[NextAuth v4 Init] NEXTAUTH_SECRET:', nextAuthSecret ? '✅ SET' : '❌ NOT SET')

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required but not defined')
}

if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required but not defined')
}

if (!googleClientId) {
  throw new Error('AUTH_GOOGLE_ID is required but not defined. Please configure it in your environment variables.')
}

if (!googleClientSecret) {
  throw new Error('AUTH_GOOGLE_SECRET is required but not defined. Please configure it in your environment variables.')
}

if (!nextAuthSecret) {
  throw new Error('NEXTAUTH_SECRET is required')
}

if (!nextAuthUrl) {
  console.warn('[NextAuth v4] ⚠️ NEXTAUTH_URL is not defined. Using default URL. This may cause issues in production.')
}

// Verificar que el Client Secret no tenga espacios o caracteres extra
const cleanClientSecret = googleClientSecret.trim()
if (cleanClientSecret !== googleClientSecret) {
  console.warn('[NextAuth] ⚠️ AUTH_GOOGLE_SECRET tiene espacios al inicio/final. Limpiando...')
}

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  // Trust host para Vercel y producción
  trustHost: true,
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  }),
  providers: [
    GoogleProvider({
      clientId: googleClientId!,
      clientSecret: cleanClientSecret,
      authorization: {
        params: {
          prompt: 'select_account',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      console.log(`[NextAuth v4 JWT] Callback ejecutado - hasUser: ${!!user}, hasAccount: ${!!account}, hasTokenUserId: ${!!token.userId}`)
      
      // En el primer login, agregar userId
      if (account && user) {
        console.log(`[NextAuth v4 JWT] Primer login detectado para usuario: ${user.id} (${user.email})`)
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.userId = user.id
        // Limpiar el rol para forzar recarga
        delete token.role
        console.log(`[NextAuth v4 JWT] Token inicializado con userId: ${token.userId}`)
      }

      // Obtener el rol del usuario desde Supabase user_profiles
      if (token.userId) {
        try {
          console.log(`[NextAuth v4 JWT] Loading role for user ${token.userId} (current role: ${token.role || 'none'})`)
          const role = await getUserRole(token.userId as string)
          token.role = role
          console.log(`[NextAuth v4 JWT] ✅ User role loaded: ${role} for user ${token.userId}`)
        } catch (error) {
          console.error('[NextAuth v4 JWT] ❌ Error loading user role:', error)
          if (!token.role) {
            token.role = 'customer'
            console.log(`[NextAuth v4 JWT] ⚠️ Using fallback role: customer`)
          }
        }
      } else {
        console.log(`[NextAuth v4 JWT] ⚠️ No userId in token, skipping role load`)
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.user.id = token.userId as string
        const role = token.role as string || 'customer'
        session.user.role = role
        console.log(`[NextAuth v4 Session] Setting role: ${role} for user ${token.userId || 'unknown'}`)
      } else {
        console.log(`[NextAuth v4 Session] ⚠️ No token provided to session callback`)
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      const base: string = (nextAuthUrl || baseUrl || 'http://localhost:3000') as string
      
      if (url.includes('/api/auth/callback') || url === base || url === `${base}/`) {
        return `${base}/auth/callback`
      }
      
      if (url.startsWith('/')) {
        return `${base}${url}`
      }
      
      try {
        const urlObj = new URL(url)
        const baseObj = new URL(base)
        if (urlObj.origin === baseObj.origin) {
          return url
        }
      } catch {
        // Si la URL no es válida, continuar
      }
      
      return `${base}/auth/callback`
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        if (!user.email) {
          console.warn('[NextAuth] User email is missing, skipping profile sync')
          return true
        }
        const email: string = user.email as string
        try {
          await upsertUserProfile({
            supabase_user_id: user.id,
            email,
            first_name: user.name?.split(' ')[0] || null,
            last_name: user.name?.split(' ').slice(1).join(' ') || null,
          })
          console.log(`[NextAuth] User profile synced for: ${user.email}`)
        } catch (error) {
          console.error('[NextAuth] Error syncing user profile:', error)
          // No bloqueamos el login si falla la sincronización
        }
        return true
      }
      return false
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log('Usuario autenticado:', user.email)
    },
    async signOut() {
      console.log('Usuario desconectado')
    },
  },
  session: {
    strategy: 'jwt' as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  debug: process.env.NODE_ENV === 'development',
}

// Exportar handler para NextAuth v4
export default NextAuth(authOptions)

// Helper para compatibilidad con código existente que usa auth()
// En NextAuth v4, usamos getServerSession en lugar de auth()
import { getServerSession } from 'next-auth/next'
import { NextRequest } from 'next/server'

export async function auth(req?: NextRequest) {
  // Para uso en Server Components y API routes (sin request)
  if (!req) {
    const session = await getServerSession(authOptions)
    return session
  }
  
  // Si se pasa un request (middleware), usar getToken
  const { getToken } = await import('next-auth/jwt')
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return null
  
  return {
    user: {
      id: (token.userId as string) || token.sub,
      email: token.email as string,
      name: token.name as string,
      image: token.picture as string,
      role: (token.role as string) || 'customer',
    },
  }
}

// Tipos TypeScript para extender la sesión
declare module 'next-auth' {
  interface Session {
    accessToken?: string
    refreshToken?: string
    supabaseAccessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string
    userId?: string
    role?: string
    accessToken?: string
    refreshToken?: string
  }
}
