// ===================================
// PINTEYA E-COMMERCE - CONFIGURACIÓN CLERK
// ===================================

import { auth, currentUser } from '@clerk/nextjs/server';
import { User, UserJSON } from '@clerk/nextjs/server';
import { supabaseAdmin } from './supabase';

// ===================================
// FUNCIONES DE AUTENTICACIÓN
// ===================================

/**
 * Obtiene el usuario autenticado actual
 * @returns Promise<User | null>
 */
export async function getAuthUser(): Promise<User | null> {
  try {
    const user = await currentUser();
    return user;
  } catch (error) {
    console.error('Error obteniendo usuario autenticado:', error);
    return null;
  }
}

/**
 * Obtiene el ID del usuario autenticado
 * @returns string | null
 */
export function getAuthUserId(): string | null {
  try {
    const { userId } = auth();
    return userId;
  } catch (error) {
    console.error('Error obteniendo ID de usuario:', error);
    return null;
  }
}

/**
 * Verifica si el usuario está autenticado
 * @returns boolean
 */
export function isUserAuthenticated(): boolean {
  try {
    const { userId } = auth();
    return !!userId;
  } catch {
    return false;
  }
}

// ===================================
// SINCRONIZACIÓN CON SUPABASE
// ===================================

interface ClerkUser {
  id: string;
  email_addresses: {
    email_address: string;
    id: string;
    verification: {
      status: string;
      strategy: string;
    };
  }[];
  first_name: string | null;
  last_name: string | null;
  created_at: number;
  updated_at: number;
}

/**
 * Sincroniza un usuario de Clerk con Supabase
 * @param clerkUser - Usuario de Clerk
 * @returns Promise<void>
 */
export async function syncUserWithSupabase(clerkUser: ClerkUser): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Cliente administrativo de Supabase no disponible');
  }

  try {
    const userData = {
      clerk_id: clerkUser.id,
      email: clerkUser.email_addresses[0]?.email_address || '',
      name: `${clerkUser.first_name || ''} ${clerkUser.last_name || ''}`.trim() || null,
    };

    // Intentar insertar o actualizar el usuario
    const { error } = await supabaseAdmin
      .from('users')
      .upsert(userData, {
        onConflict: 'clerk_id',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error('Error sincronizando usuario con Supabase:', error);
      throw error;
    }

    console.log('Usuario sincronizado exitosamente:', userData.email);
  } catch (error) {
    console.error('Error en sincronización de usuario:', error);
    throw error;
  }
}

/**
 * Obtiene los datos del usuario desde Supabase usando el ID de Clerk
 * @param clerkId - ID del usuario en Clerk
 * @returns Promise<any>
 */
export async function getUserFromSupabase(clerkId: string) {
  if (!supabaseAdmin) {
    throw new Error('Cliente administrativo de Supabase no disponible');
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
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
 * Elimina un usuario de Supabase usando el ID de Clerk
 * @param clerkUserId - ID del usuario en Clerk
 * @returns Promise<void>
 */
export async function deleteUserFromSupabase(clerkUserId: string): Promise<void> {
  if (!supabaseAdmin) {
    throw new Error('Cliente administrativo de Supabase no disponible');
  }

  try {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('clerk_id', clerkUserId);

    if (error) {
      console.error('Error eliminando usuario de Supabase:', error);
      throw error;
    }

    console.log('Usuario eliminado exitosamente de Supabase:', clerkUserId);
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
  '/my-account',
  '/my-account/(.*)',
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
  clerkId: string;
}
