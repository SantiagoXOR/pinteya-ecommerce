import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { SupabaseAdapter } from './src/lib/integrations/supabase/supabase-adapter'
import { upsertUserProfile, getUserRole } from './src/lib/auth/role-service'

// Debugging de variables de entorno
console.log('🔍 Debugging NextAuth configuration:')
console.log(
  'NEXT_PUBLIC_SUPABASE_URL:',
  process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Defined' : '❌ Undefined'
)
console.log(
  'SUPABASE_SERVICE_ROLE_KEY:',
  process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Defined' : '❌ Undefined'
)

// Validación de variables de entorno requeridas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is missing')
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required but not defined')
}

if (!supabaseServiceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing')
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required but not defined')
}

console.log('✅ All environment variables are present')

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      // En el primer login, agregar userId
      if (account && user) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.userId = user.id
        // Limpiar el rol para forzar recarga
        delete token.role
      }

      // Obtener el rol del usuario desde Supabase user_profiles
      // Siempre recargar si no existe, es 'customer' (fallback), o se fuerza actualización
      if (token.userId && (!token.role || token.role === 'customer' || trigger === 'update')) {
        try {
          const role = await getUserRole(token.userId as string)
          token.role = role
          console.log(`[NextAuth] User role loaded: ${role} for user ${token.userId}`)
        } catch (error) {
          console.error('[NextAuth] Error loading user role:', error)
          // Solo usar 'customer' como fallback si realmente no hay perfil
          // No sobrescribir si ya hay un rol válido
          if (!token.role) {
            token.role = 'customer'
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.user.id = token.userId as string
        session.user.role = token.role as string || 'customer'
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Permitir el sign-in para todos los usuarios de Google
      if (account?.provider === 'google') {
        try {
          // Sincronizar/crear el perfil del usuario en user_profiles
          await upsertUserProfile({
            supabase_user_id: user.id,
            email: user.email!,
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
    async signOut({ session, token }) {
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
})

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
