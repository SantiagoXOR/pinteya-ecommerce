/**
 * NextAuth.js v5 Configuration for Pinteya E-commerce
 * Configuración optimizada para producción con Google OAuth
 * Migración completa desde Clerk a NextAuth.js
 */

import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    })
  ],

  // Configuración de páginas personalizadas
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  // Configuración de callbacks
  callbacks: {
    // Callback de JWT - Manejo de tokens
    async jwt({ token, user, account }) {
      // Si es un nuevo login, agregar información del usuario al token
      if (user) {
        token.sub = user.id
      }
      
      return token
    },

    // Callback de sesión - Información disponible en el cliente
    async session({ session, token }) {
      // Asegurar que el ID del usuario esté disponible en la sesión
      if (token?.sub) {
        session.user.id = token.sub
      }
      
      return session
    },

    // Callback de autorización simplificado
    async signIn({ user, account, profile }) {
      try {
        console.log(`[NextAuth] Usuario autenticado: ${user.email}`)
        return true
      } catch (error) {
        console.error(`[NextAuth] Error en signIn callback:`, error)
        return true // Permitir el login incluso si hay errores
      }
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

  // Configuración de sesión con JWT strategy para mejor compatibilidad
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // 24 horas
  },

  // Configuración de JWT para evitar problemas con Edge Runtime
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  // Configuración de debug
  debug: process.env.NODE_ENV === "development",

  // Configuración de trusted hosts para desarrollo y producción
  trustHost: true,

  // Configuración de cookies para producción
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // Configuración de secret para producción
  secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

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









