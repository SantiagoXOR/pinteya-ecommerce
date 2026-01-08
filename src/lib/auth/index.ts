/**
 * Authentication Module Index - Pinteya E-commerce
 * Punto de entrada centralizado para funcionalidades de autenticación
 * NextAuth.js v4 + Supabase integration
 */

// =====================================================
// CONFIGURACIÓN PRINCIPAL
// =====================================================
// En NextAuth v4, no hay 'handlers', 'signIn' o 'signOut' en el módulo principal
// signIn/signOut se usan desde 'next-auth/react' en componentes del cliente
export { auth, authOptions } from '../../auth'
export { default as NextAuthHandler } from '../../auth'

// =====================================================
// ADAPTADORES Y CONFIGURACIÓN
// =====================================================
export * from '../auth-adapter'

// =====================================================
// UTILIDADES DE AUTENTICACIÓN
// =====================================================
export * from '../user-helpers'

// =====================================================
// TIPOS Y INTERFACES
// =====================================================
export type { User, Session } from 'next-auth'
export type { JWT } from 'next-auth/jwt'
