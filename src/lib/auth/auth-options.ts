// =====================================================
// AUTH OPTIONS: NEXTAUTH CONFIGURATION
// Descripción: Configuración centralizada de NextAuth.js
// Basado en: NextAuth.js v5 + Google OAuth + JWT Strategy
// =====================================================

import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Tipos específicos para NextAuth
interface UserWithRole {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string;
}

interface SessionWithRole {
  user: UserWithRole;
  expires: string;
}

export const authOptions: NextAuthOptions = {
  // Configuración de providers
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
    }),
  ],

  // Configuración de páginas personalizadas
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  // Configuración de callbacks
  callbacks: {
    // Callback de sesión - JWT strategy
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      
      // Agregar rol de administrador para usuarios específicos
      if (session.user.email === 'santiago@xor.com.ar') {
        (session as SessionWithRole).user.role = 'admin';
      }

      return session;
    },

    // Callback de JWT
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        
        // Agregar rol de administrador para usuarios específicos
        if (user.email === 'santiago@xor.com.ar') {
          token.role = 'admin';
        }
      }
      return token;
    },

    // Callback de autorización
    async signIn({ user, account, profile }) {
      // Permitir todos los sign-ins por ahora
      return true;
    },
  },

  // Configuración de eventos
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`[NextAuth] Usuario autenticado: ${user.email}`);
      
      if (isNewUser) {
        console.log(`[NextAuth] Nuevo usuario registrado: ${user.email}`);
      }
    },
    
    async signOut({ session, token }) {
      console.log(`[NextAuth] Usuario desconectado`);
    },
  },

  // Configuración de sesión con JWT
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // 24 horas
  },

  // Configuración de JWT
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  // Configuración de debug
  debug: process.env.NODE_ENV === "development",

  // Configuración de trusted hosts
  trustHost: true,

  // Configuración de cookies para producción
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // Configuración de secret
  secret: process.env.NEXTAUTH_SECRET,
};









