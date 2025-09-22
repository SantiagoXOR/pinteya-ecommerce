/**
 * Authentication Module Index - Pinteya E-commerce
 * Punto de entrada centralizado para funcionalidades de autenticación
 * NextAuth.js v5 + Supabase integration
 */

// =====================================================
// CONFIGURACIÓN PRINCIPAL
// =====================================================
export { auth, signIn, signOut, handlers } from '../../auth';

// =====================================================
// ADAPTADORES Y CONFIGURACIÓN
// =====================================================
export * from '../auth-adapter';

// =====================================================
// UTILIDADES DE AUTENTICACIÓN
// =====================================================
export * from '../user-helpers';

// =====================================================
// TIPOS Y INTERFACES
// =====================================================
export type { User, Session } from 'next-auth';
export type { JWT } from 'next-auth/jwt';









