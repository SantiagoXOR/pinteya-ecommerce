// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN NEXTAUTH.JS
// ===================================
// 🚨 MIGRADO DE CLERK A NEXTAUTH.JS - 21/08/2025

import { auth } from '@/auth';
import { supabaseAdmin } from './supabase';

// ===================================
// FUNCIONES DE AUTENTICACIÓN
// ===================================

/**
 * Obtiene el usuario autenticado actual
 * @returns Promise<any | null>
 */
export async function getAuthUser(): Promise<any | null> {
  try {
    const session = await auth();
    return session?.user || null;
  } catch (error) {
    console.error('Error obteniendo usuario autenticado:', error);
    return null;
  }
}

/**
 * Obtiene el ID del usuario autenticado
 * @returns string | null
 */
export async function getAuthUserId(): Promise<string | null> {
  try {
    const session = await auth();
    return session?.user?.id || null;
  } catch (error) {
    console.error('Error obteniendo ID de usuario:', error);
    return null;
  }
}

/**
 * Verifica si el usuario está autenticado
 * @returns boolean
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    const session = await auth();
    return !!session?.user;
  } catch {
    return false;
  }
}

// ===================================
// SINCRONIZACIÓN CON SUPABASE
// ===================================
// 🚨 FUNCIONES TEMPORALMENTE DESHABILITADAS - Migración a NextAuth.js

interface NextAuthUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
}

/**
 * Sincroniza un usuario de NextAuth.js con Supabase
 * @param user - Usuario de NextAuth.js
 * @returns Promise<void>
 */
export async function syncUserWithSupabase(user: NextAuthUser): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Cliente administrativo de Supabase no disponible');
  }

  try {
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      updated_at: new Date().toISOString(),
    };

    // Intentar insertar o actualizar el usuario
    const { error } = await supabaseAdmin
      .from('users')
      .upsert(userData, {
        onConflict: 'id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error sincronizando usuario con Supabase:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error en sincronización de usuario:', error);
    throw error;
  }
}

/**
 * Obtiene los datos del usuario desde Supabase usando el ID de NextAuth
 * @param userId - ID del usuario en NextAuth
 * @returns Promise<any>
 */
export async function getUserFromSupabase(userId: string) {
  if (!supabaseAdmin) {
    throw new Error('Cliente administrativo de Supabase no disponible');
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error obteniendo usuario de Supabase:', error);
    return null;
  }
}

/**
 * Elimina un usuario de Supabase usando el ID de NextAuth
 * @param userId - ID del usuario en NextAuth
 * @returns Promise<void>
 */
export async function deleteUserFromSupabase(userId: string): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Cliente administrativo de Supabase no disponible');
  }

  try {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error eliminando usuario de Supabase:', error);
      throw error;
    }

  } catch (error) {
    console.error('Error en eliminación de usuario:', error);
    throw error;
  }
}

// ===================================
// MIDDLEWARE HELPERS
// ===================================

/**
 * Rutas públicas que no requieren autenticación
 */
export const publicRoutes = [
  '/',
  '/shop',
  '/shop/(.*)',
  '/products/(.*)',
  '/signin',
  '/signup',
  '/api/products',
  '/api/products/(.*)',
  '/api/categories',
  '/api/auth/webhook',
];

/**
 * Rutas que requieren autenticación
 */
export const protectedRoutes = [
  '/checkout',
  // ELIMINADO: '/my-account' y '/my-account/(.*)' - Ruta completamente removida del sistema
  '/orders',
  '/orders/(.*)',
  '/wishlist',
];

/**
 * Rutas de API que requieren autenticación
 */
export const protectedApiRoutes = [
  '/api/orders',
  '/api/orders/(.*)',
  '/api/user/(.*)',
  '/api/payments/(.*)',
];

// ===================================
// TIPOS
// ===================================
export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
}









