/**
 * Role Service - Gestión de Roles y Permisos
 * Servicio para consultar roles de usuarios desde Supabase user_profiles
 * Integrado con NextAuth.js
 */

import { createClient } from '@supabase/supabase-js'

// Cliente Supabase Admin (bypass RLS)
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase credentials are not configured')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export interface UserProfile {
  id: string
  supabase_user_id: string | null
  email: string
  first_name: string | null
  last_name: string | null
  role_id: number | null
  is_active: boolean
  is_verified: boolean
  role?: {
    role_name: string
    display_name: string
    permissions: Record<string, any>
  }
}

/**
 * Obtiene el perfil completo de un usuario desde user_profiles
 * @param userId - ID del usuario en la tabla users (NextAuth)
 * @returns UserProfile o null si no existe
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseAdmin()

    // Buscar el perfil del usuario con su rol
    const { data, error } = await supabase
      .from('user_profiles')
      .select(
        `
        id,
        supabase_user_id,
        email,
        first_name,
        last_name,
        role_id,
        is_active,
        is_verified,
        user_roles:role_id (
          role_name,
          display_name,
          permissions
        )
      `
      )
      .eq('supabase_user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.log('[Role Service] No profile found for user:', userId)
      return null
    }

    // Transformar el resultado
    const role = Array.isArray(data.user_roles) ? data.user_roles[0] : data.user_roles

    return {
      ...data,
      role: role || undefined,
    }
  } catch (error) {
    console.error('[Role Service] Error getting user profile:', error)
    return null
  }
}

/**
 * Obtiene el rol de un usuario
 * @param userId - ID del usuario en la tabla users (NextAuth)
 * @returns Nombre del rol ('admin', 'customer', etc.) o 'customer' por defecto
 */
export async function getUserRole(userId: string): Promise<string> {
  try {
    const profile = await getUserProfile(userId)

    if (!profile || !profile.role) {
      return 'customer' // Rol por defecto
    }

    return profile.role.role_name
  } catch (error) {
    console.error('[Role Service] Error getting user role:', error)
    return 'customer'
  }
}

/**
 * Verifica si un usuario es administrador
 * @param userId - ID del usuario en la tabla users (NextAuth)
 * @returns true si el usuario es admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const role = await getUserRole(userId)
    return role === 'admin'
  } catch (error) {
    console.error('[Role Service] Error checking if user is admin:', error)
    return false
  }
}

/**
 * Verifica si un usuario tiene un permiso específico
 * @param userId - ID del usuario en la tabla users (NextAuth)
 * @param permission - Permiso a verificar (ej: 'products.create', 'orders.read')
 * @returns true si el usuario tiene el permiso
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
  try {
    const profile = await getUserProfile(userId)

    if (!profile || !profile.role || !profile.role.permissions) {
      return false
    }

    // Parsear el permiso (ej: 'products.create' -> ['products', 'create'])
    const [resource, action] = permission.split('.')

    if (!resource || !action) {
      return false
    }

    const permissions = profile.role.permissions
    return permissions[resource]?.[action] === true
  } catch (error) {
    console.error('[Role Service] Error checking permission:', error)
    return false
  }
}

/**
 * Obtiene el perfil de un usuario por email
 * Útil para buscar usuarios antes de que se logueen
 * @param email - Email del usuario
 * @returns UserProfile o null si no existe
 */
export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('user_profiles')
      .select(
        `
        id,
        supabase_user_id,
        email,
        first_name,
        last_name,
        role_id,
        is_active,
        is_verified,
        user_roles:role_id (
          role_name,
          display_name,
          permissions
        )
      `
      )
      .eq('email', email)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      console.log('[Role Service] No profile found for email:', email)
      return null
    }

    const role = Array.isArray(data.user_roles) ? data.user_roles[0] : data.user_roles

    return {
      ...data,
      role: role || undefined,
    }
  } catch (error) {
    console.error('[Role Service] Error getting user profile by email:', error)
    return null
  }
}

/**
 * Crea o actualiza un perfil de usuario
 * Se usa cuando un usuario se loguea por primera vez
 * @param userData - Datos del usuario para crear/actualizar
 * @returns UserProfile creado o actualizado
 */
export async function upsertUserProfile(userData: {
  supabase_user_id: string
  email: string
  first_name?: string | null
  last_name?: string | null
}): Promise<UserProfile | null> {
  try {
    const supabase = getSupabaseAdmin()

    // Obtener el ID del rol 'customer' por defecto
    const { data: customerRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role_name', 'customer')
      .single()

    const roleId = customerRole?.id || null

    // Intentar hacer upsert del perfil
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert(
        {
          supabase_user_id: userData.supabase_user_id,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          role_id: roleId,
          is_active: true,
          is_verified: false,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'email',
          ignoreDuplicates: false,
        }
      )
      .select(
        `
        id,
        supabase_user_id,
        email,
        first_name,
        last_name,
        role_id,
        is_active,
        is_verified,
        user_roles:role_id (
          role_name,
          display_name,
          permissions
        )
      `
      )
      .single()

    if (error) {
      console.error('[Role Service] Error upserting user profile:', error)
      return null
    }

    const role = Array.isArray(data.user_roles) ? data.user_roles[0] : data.user_roles

    return {
      ...data,
      role: role || undefined,
    }
  } catch (error) {
    console.error('[Role Service] Error in upsertUserProfile:', error)
    return null
  }
}

