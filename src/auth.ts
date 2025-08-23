/**
 * NextAuth.js v5 Configuration for Pinteya E-commerce
 * Integración con Supabase y Google OAuth
 */

import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

// Configuración de NextAuth.js v5
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Configuración de providers
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  // Usar JWT strategy en lugar de adaptador de base de datos
  // adapter: SupabaseAdapter({
  //   url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // }),

  // Configuración de páginas personalizadas
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },

  // Configuración de callbacks
  callbacks: {
    // Callback de sesión - JWT strategy simplificado
    async session({ session, token }) {
      // Agregar información adicional del usuario desde el token
      if (token.sub) {
        session.user.id = token.sub
      }

      return session
    },

    // Callback de JWT
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
        token.email = user.email
      }
      return token
    },

    // Callback de autorización
    async signIn({ user, account, profile }) {
      // Permitir todos los sign-ins por ahora
      // Aquí se pueden agregar validaciones adicionales
      return true
    },
  },

  // Configuración de eventos
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`[NextAuth] Usuario autenticado: ${user.email}`)
      
      // Si es un nuevo usuario, crear entrada en tabla pública
      if (isNewUser) {
        console.log(`[NextAuth] Nuevo usuario registrado: ${user.email}`)
      }
    },
    
    async signOut({ session, token }) {
      console.log(`[NextAuth] Usuario desconectado`)
    },
  },

  // Configuración de sesión con JWT
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // 24 horas
  },

  // Configuración de JWT para evitar problemas con Edge Runtime
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  // Configuración de debug
  debug: process.env.NODE_ENV === "development",
})

// Tipos TypeScript para extender la sesión
declare module "next-auth" {
  interface Session {
    supabaseAccessToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string
  }
}
