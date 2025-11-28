import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { SupabaseAdapter } from './lib/integrations/supabase/supabase-adapter'
import { upsertUserProfile, getUserRole } from './lib/auth/role-service'

// Validación de variables de entorno requeridas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required but not defined')
}

if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required but not defined')
}

const nextAuth = NextAuth({
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceRoleKey,
  }),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: 'select_account',
        },
      },
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account, trigger }) {
      console.log(`[NextAuth JWT] Callback ejecutado - trigger: ${trigger || 'auto'}, hasUser: ${!!user}, hasAccount: ${!!account}, hasTokenUserId: ${!!token.userId}`)
      
      // En el primer login, agregar userId
      if (account && user) {
        console.log(`[NextAuth JWT] Primer login detectado para usuario: ${user.id} (${user.email})`)
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.userId = user.id
        // Limpiar el rol para forzar recarga
        delete token.role
        console.log(`[NextAuth JWT] Token inicializado con userId: ${token.userId}`)
      }

      // Obtener el rol del usuario desde Supabase user_profiles
      // SIEMPRE recargar el rol si userId está presente para asegurar que esté actualizado
      // Esto es especialmente importante después de cambios en la base de datos
      if (token.userId) {
        try {
          console.log(`[NextAuth JWT] Loading role for user ${token.userId} (trigger: ${trigger || 'auto'}, current role: ${token.role || 'none'})`)
          const role = await getUserRole(token.userId as string)
          token.role = role
          console.log(`[NextAuth JWT] ✅ User role loaded: ${role} for user ${token.userId}`)
        } catch (error) {
          console.error('[NextAuth JWT] ❌ Error loading user role:', error)
          // Solo usar 'customer' como fallback si realmente no hay perfil
          if (!token.role) {
            token.role = 'customer'
            console.log(`[NextAuth JWT] ⚠️ Using fallback role: customer`)
          }
        }
      } else {
        console.log(`[NextAuth JWT] ⚠️ No userId in token, skipping role load`)
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
        console.log(`[NextAuth Session] Setting role: ${role} for user ${token.userId || 'unknown'}`)
      } else {
        console.log(`[NextAuth Session] ⚠️ No token provided to session callback`)
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Permitir el sign-in para todos los usuarios de Google
      if (account?.provider === 'google') {
        if (!user.email) {
          console.warn('[NextAuth] User email is missing, skipping profile sync')
          return true
        }
        // Ya verificamos que user.email no es null/undefined arriba
        // Extraer email con type assertion para evitar problemas de TypeScript
        // @ts-ignore - user.email es string después del check !user.email arriba
        const email: string = user.email as string
        try {
          // Sincronizar/crear el perfil del usuario en user_profiles
          // @ts-ignore - email es string después del check y type assertion
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
})

export const { auth, handlers, signIn, signOut } = nextAuth

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
