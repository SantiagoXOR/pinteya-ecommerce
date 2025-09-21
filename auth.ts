import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { SupabaseAdapter } from "./src/lib/integrations/supabase/supabase-adapter"

// Debugging de variables de entorno
console.log("🔍 Debugging NextAuth configuration:")
console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Defined" : "❌ Undefined")
console.log("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Defined" : "❌ Undefined")

// Validación de variables de entorno requeridas
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL is missing")
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is required but not defined")
}

if (!supabaseServiceRoleKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY is missing")
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is required but not defined")
}

console.log("✅ All environment variables are present")

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
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
        session.user.id = token.userId as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Permitir el sign-in para todos los usuarios de Google
      if (account?.provider === "google") {
        return true
      }
      return false
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log("Usuario autenticado:", user.email)
    },
    async signOut({ session, token }) {
      console.log("Usuario desconectado")
    },
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
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