/**
 * Hook personalizado para gestionar roles de usuario
 * Integra NextAuth.js con el sistema de roles de Supabase
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from './useAuth'

export interface UserRole {
  role_name: string
  description: string
  permissions: Record<string, any>
}

export interface UserProfile {
  id: string
  clerk_user_id: string
  email: string
  role_id: string
  first_name?: string
  last_name?: string
  is_active: boolean
  user_roles: UserRole
}

export interface UseUserRoleReturn {
  userProfile: UserProfile | null
  role: UserRole | null
  isLoading: boolean
  error: string | null
  hasPermission: (permission: string[]) => boolean
  hasAnyPermission: (permissions: string[][]) => boolean
  hasAllPermissions: (permissions: string[][]) => boolean
  canAccessAdminPanel: boolean
  canManageProducts: boolean
  canManageOrders: boolean
  canManageUsers: boolean
  canViewAnalytics: boolean
  isAdmin: boolean
  isCustomer: boolean
  isModerator: boolean
  syncUser: () => Promise<void>
  refetch: () => Promise<void>
}

export const useUserRole = (): UseUserRoleReturn => {
  // ✅ Usar NextAuth.js para obtener el usuario autenticado
  const { user, isLoaded, isSignedIn } = useAuth()

  // Estados para el perfil de usuario
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Ref para rastrear si hay una solicitud en curso y evitar llamadas duplicadas
  const isFetchingRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const lastFetchedEmailRef = useRef<string | null>(null)
  // Ref para mantener una referencia estable a syncUser
  const syncUserRef = useRef<((email?: string) => Promise<void>) | null>(null)

  const syncUser = useCallback(async () => {
    if (!user?.email) {
      console.log('[useUserRole] No hay usuario autenticado para sincronizar')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Buscar o crear usuario en Supabase
      const response = await fetch('/api/admin/users/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al sincronizar usuario')
      }

      const userData = await response.json()
      setUserProfile(userData)
      // Actualizar el ref después de sincronizar exitosamente
      lastFetchedEmailRef.current = user.email

      console.log('[useUserRole] Usuario sincronizado exitosamente')
    } catch (err) {
      console.error('[useUserRole] Error al sincronizar usuario:', err)
      setError('Error al sincronizar usuario')
      // NO resetear lastFetchedEmailRef para evitar loops
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
  }, [user])

  // Actualizar la referencia cada vez que syncUser cambia
  syncUserRef.current = syncUser

  const fetchUserProfile = useCallback(async (emailToFetch: string) => {
    if (!emailToFetch) {
      console.log('[useUserRole] No hay email proporcionado')
      setUserProfile(null)
      setIsLoading(false)
      isFetchingRef.current = false
      return
    }

    // Evitar múltiples llamadas simultáneas usando ref
    if (isFetchingRef.current) {
      console.log('[useUserRole] Ya hay una solicitud en curso, omitiendo...')
      return
    }

    // Evitar llamadas duplicadas para el mismo email
    if (lastFetchedEmailRef.current === emailToFetch) {
      console.log('[useUserRole] Ya se obtuvo el perfil para este email, omitiendo...')
      return
    }

    // Cancelar solicitud anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    try {
      isFetchingRef.current = true
      setIsLoading(true)
      setError(null)

      // Crear AbortController para poder cancelar la solicitud
      const abortController = new AbortController()
      abortControllerRef.current = abortController
      const timeoutId = setTimeout(() => abortController.abort(), 10000) // Timeout de 10 segundos

      try {
        const response = await fetch(`/api/admin/users/profile?email=${encodeURIComponent(emailToFetch)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: abortController.signal,
        })

        clearTimeout(timeoutId)

        // Verificar si la solicitud fue cancelada
        if (abortController.signal.aborted) {
          return
        }

        if (response.status === 404) {
          // Usuario no existe, intentar sincronizar
          // NO resetear lastFetchedEmailRef aquí para evitar loops
          if (syncUserRef.current) {
            await syncUserRef.current()
          }
          // Actualizar el ref solo después de sincronizar exitosamente
          lastFetchedEmailRef.current = emailToFetch
          return
        }

        if (!response.ok) {
          // Manejo más específico de errores HTTP
          const errorText = await response.text()
          console.warn(`Error HTTP ${response.status}: ${errorText}`)
          setError(`Error de conexión (${response.status})`)
          // NO resetear lastFetchedEmailRef para evitar loops infinitos
          // Solo marcar como cargado para este email (aunque falló)
          lastFetchedEmailRef.current = emailToFetch
          return
        }

        const data = await response.json()
        if (data.success) {
          setUserProfile(data.user)
          // Solo actualizar el ref cuando la solicitud es exitosa
          lastFetchedEmailRef.current = emailToFetch
        } else {
          console.warn('Error en respuesta del servidor:', data.error)
          setError(data.error || 'Error del servidor')
          // NO resetear, solo marcar como procesado para evitar loops
          lastFetchedEmailRef.current = emailToFetch
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        // Ignorar errores de cancelación
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.log('[useUserRole] Solicitud cancelada')
          // NO resetear el ref si fue cancelada, para evitar loops
          return
        }
        throw fetchError
      }
    } catch (err) {
      // Manejo más suave de errores para no interrumpir la aplicación
      console.warn('Error fetching user profile:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión'
      setError(errorMessage)
      // NO resetear lastFetchedEmailRef para evitar loops infinitos
      // Marcar como procesado para este email (aunque falló)
      lastFetchedEmailRef.current = emailToFetch
    } finally {
      setIsLoading(false)
      isFetchingRef.current = false
    }
    // No incluir syncUser en las dependencias, usar syncUserRef en su lugar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const hasPermission = (permissionPath: string[]): boolean => {
    if (!userProfile?.user_roles?.permissions) {
      return false
    }

    let current = userProfile.user_roles.permissions
    for (const path of permissionPath) {
      if (current[path] === undefined) {
        return false
      }
      current = current[path]
    }

    // Manejar diferentes tipos de valores de permisos
    if (typeof current === 'boolean') {
      return current
    }

    if (typeof current === 'string') {
      // Para permisos como "own", "own_limited", etc.
      return current !== 'false'
    }

    return Boolean(current)
  }

  const hasAnyPermission = (permissions: string[][]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: string[][]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  // Verificaciones de roles - Usar el rol de la sesión de NextAuth como fallback
  const sessionRole = (user as any)?.role || userProfile?.user_roles?.role_name
  const isAdmin = sessionRole === 'admin' || userProfile?.user_roles?.role_name === 'admin'
  const isCustomer = sessionRole === 'customer' || userProfile?.user_roles?.role_name === 'customer'
  const isModerator = sessionRole === 'moderator' || userProfile?.user_roles?.role_name === 'moderator'

  // Verificaciones de permisos específicos
  const canAccessAdminPanel = hasPermission(['admin_panel', 'access'])
  const canManageProducts = hasAnyPermission([
    ['products', 'create'],
    ['products', 'update'],
    ['products', 'delete'],
  ])
  const canManageOrders = hasAnyPermission([
    ['orders', 'create'],
    ['orders', 'update'],
    ['orders', 'delete'],
  ])
  const canManageUsers = hasAnyPermission([
    ['users', 'create'],
    ['users', 'update'],
    ['users', 'delete'],
    ['users', 'manage_roles'],
  ])
  const canViewAnalytics = hasPermission(['analytics', 'read'])

  useEffect(() => {
    // Solo intentar cargar el perfil si el usuario está autenticado y tiene email
    if (isLoaded && isSignedIn && user?.email) {
      const email = user.email
      
      // Evitar llamadas duplicadas si ya se está obteniendo el perfil para este email
      // O si ya se obtuvo el perfil para este email
      if (isFetchingRef.current) {
        return
      }

      // Solo hacer fetch si el email cambió (no se ha obtenido el perfil para este email)
      if (lastFetchedEmailRef.current === email) {
        return
      }

      // Evitar múltiples llamadas simultáneas usando un flag de referencia
      let cancelled = false

      const timeoutId = setTimeout(() => {
        // Verificar nuevamente antes de ejecutar (por si el componente se desmontó o cambió el email)
        if (!cancelled && !isFetchingRef.current && lastFetchedEmailRef.current !== email && user?.email === email) {
          console.log('[useUserRole] Usuario autenticado, obteniendo perfil...', email)
          fetchUserProfile(email)
        }
      }, 200) // Pequeño delay para evitar llamadas múltiples

      return () => {
        cancelled = true
        clearTimeout(timeoutId)
        // Cancelar solicitud pendiente al desmontar
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
      }
    } else if (isLoaded && !isSignedIn) {
      console.log('[useUserRole] Usuario no autenticado')
      setUserProfile(null)
      setIsLoading(false)
      setError(null)
      isFetchingRef.current = false
      // Solo resetear el ref cuando el usuario se desautentica
      lastFetchedEmailRef.current = null
      // Cancelar cualquier solicitud pendiente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user?.email, fetchUserProfile]) // Incluir fetchUserProfile ya que ahora es estable

  return {
    userProfile,
    role: userProfile?.user_roles || null,
    isLoading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessAdminPanel,
    canManageProducts,
    canManageOrders,
    canManageUsers,
    canViewAnalytics,
    isAdmin,
    isCustomer,
    isModerator,
    syncUser,
    refetch: fetchUserProfile,
  }
}
