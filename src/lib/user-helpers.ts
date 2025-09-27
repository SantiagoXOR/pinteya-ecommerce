// ===================================
// PINTEYA E-COMMERCE - HELPERS DE USUARIO
// ===================================

import { UserProfile } from '@/types/database'

/**
 * Obtiene el nombre completo del usuario
 */
export function getFullName(user: UserProfile): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  if (user.first_name) {
    return user.first_name
  }
  // Fallback al email
  return user.email.split('@')[0]
}

/**
 * Obtiene las iniciales del usuario
 */
export function getUserInitials(user: UserProfile): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase()
  }
  if (user.first_name) {
    return user.first_name[0].toUpperCase()
  }
  return user.email[0].toUpperCase()
}

/**
 * Verifica si el usuario es administrador
 */
export function isUserAdmin(user: UserProfile): boolean {
  return (
    user.metadata?.role === 'admin' ||
    user.role_id === 'admin' ||
    (user as any).user_roles?.role_name === 'admin'
  )
}

/**
 * Verifica si el usuario está activo
 */
export function isUserActive(user: UserProfile): boolean {
  return user.is_active === true
}

/**
 * Obtiene el rol del usuario
 */
export function getUserRole(user: UserProfile): string {
  if ((user as any).user_roles?.role_name) {
    return (user as any).user_roles.role_name
  }
  if (user.metadata?.role) {
    return user.metadata.role
  }
  return 'customer'
}

/**
 * Formatea la fecha de creación del usuario
 */
export function formatUserCreatedDate(user: UserProfile): string {
  return new Date(user.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Convierte un usuario legacy a UserProfile (para migración)
 */
export function convertLegacyUser(legacyUser: any): Partial<UserProfile> {
  return {
    id: legacyUser.id,
    email: legacyUser.email,
    first_name: legacyUser.name?.split(' ')[0] || null,
    last_name: legacyUser.name?.split(' ').slice(1).join(' ') || null,
    role_id: legacyUser.role || null,
    is_active: legacyUser.is_active ?? true,
    metadata: {
      migrated_from: 'legacy_user',
      migration_date: new Date().toISOString(),
      original_data: legacyUser,
    },
    created_at: legacyUser.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Crea un nuevo usuario desde NextAuth
 */
export function createUserFromNextAuth(authUser: any): Partial<UserProfile> {
  return {
    id: authUser.id,
    email: authUser.email,
    first_name: authUser.name?.split(' ')[0] || null,
    last_name: authUser.name?.split(' ').slice(1).join(' ') || null,
    role_id: null,
    is_active: true,
    metadata: {
      created_via: 'nextauth',
      provider: authUser.provider || 'unknown',
      created_at: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

/**
 * Valida si un email es válido
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Sanitiza el nombre del usuario
 */
export function sanitizeName(name: string): string {
  return name.trim().replace(/[<>]/g, '')
}

/**
 * Obtiene el avatar URL del usuario
 */
export function getUserAvatarUrl(user: UserProfile): string | null {
  if (user.metadata?.avatar_url) {
    return user.metadata.avatar_url
  }
  if (user.metadata?.image) {
    return user.metadata.image
  }
  return null
}

/**
 * Verifica si el usuario fue migrado de Clerk
 */
export function isMigratedFromClerk(user: UserProfile): boolean {
  return (
    user.metadata?.migrated_from === 'users_table' ||
    user.metadata?.clerk_migration_completed === true
  )
}

/**
 * Obtiene información de migración
 */
export function getMigrationInfo(user: UserProfile): {
  isMigrated: boolean
  source: string
  date: string | null
} {
  return {
    isMigrated: isMigratedFromClerk(user),
    source: user.metadata?.migrated_from || 'unknown',
    date: user.metadata?.migration_date || null,
  }
}
