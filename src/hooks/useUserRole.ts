/**
 * Hook personalizado para gestionar roles de usuario
 * Integra NextAuth.js con el sistema de roles de Supabase
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface UserRole {
  role_name: string;
  description: string;
  permissions: Record<string, any>;
}

export interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  role_id: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  user_roles: UserRole;
}

export interface UseUserRoleReturn {
  userProfile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: (permission: string[]) => boolean;
  hasAnyPermission: (permissions: string[][]) => boolean;
  hasAllPermissions: (permissions: string[][]) => boolean;
  canAccessAdminPanel: boolean;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isModerator: boolean;
  syncUser: () => Promise<void>;
  refetch: () => Promise<void>;
}

export const useUserRole = (): UseUserRoleReturn => {
  // 🚨 TEMPORAL: Hook simplificado sin autenticación durante migración
  // TODO: Restaurar funcionalidad completa cuando NextAuth esté configurado
  // const { user, isLoaded, isSignedIn } = useAuth();

  // 🚨 TEMPORAL: Estados simplificados sin autenticación
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🚨 TEMPORAL: Variables mock para evitar errores
  const user = null;
  const isLoaded = true;
  const isSignedIn = false;

  const syncUser = useCallback(async () => {
    if (!user?.email) {
      console.log('[useUserRole] No hay usuario autenticado para sincronizar');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

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
      });

      if (!response.ok) {
        throw new Error('Error al sincronizar usuario');
      }

      const userData = await response.json();
      setUserProfile(userData);

      console.log('[useUserRole] Usuario sincronizado exitosamente');
    } catch (err) {
      console.error('[useUserRole] Error al sincronizar usuario:', err);
      setError('Error al sincronizar usuario');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchUserProfile = useCallback(async () => {
    if (!user?.email) {
      console.log('[useUserRole] No hay usuario autenticado');
      setUserProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const email = user.email;
      if (!email) {
        console.warn('Email no disponible para el usuario');
        setError('Email no disponible');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/admin/users/profile?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        // Usuario no existe, intentar sincronizar
        await syncUser();
        return;
      }

      if (!response.ok) {
        // Manejo más específico de errores HTTP
        const errorText = await response.text();
        console.warn(`Error HTTP ${response.status}: ${errorText}`);

        // No lanzar error para errores de red, solo logear
        setError(`Error de conexión (${response.status})`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUserProfile(data.user);
      } else {
        console.warn('Error en respuesta del servidor:', data.error);
        setError(data.error || 'Error del servidor');
      }
    } catch (err) {
      // Manejo más suave de errores para no interrumpir la aplicación
      console.warn('Error fetching user profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);

      // No re-lanzar el error para evitar interrumpir otros componentes
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const hasPermission = (permissionPath: string[]): boolean => {
    if (!userProfile?.user_roles?.permissions) return false;

    let current = userProfile.user_roles.permissions;
    for (const path of permissionPath) {
      if (current[path] === undefined) return false;
      current = current[path];
    }

    // Manejar diferentes tipos de valores de permisos
    if (typeof current === 'boolean') {
      return current;
    }

    if (typeof current === 'string') {
      // Para permisos como "own", "own_limited", etc.
      return current !== 'false';
    }

    return Boolean(current);
  };

  const hasAnyPermission = (permissions: string[][]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[][]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Verificaciones de roles
  const isAdmin = userProfile?.user_roles?.role_name === 'admin';
  const isCustomer = userProfile?.user_roles?.role_name === 'customer';
  const isModerator = userProfile?.user_roles?.role_name === 'moderator';

  // Verificaciones de permisos específicos
  const canAccessAdminPanel = hasPermission(['admin_panel', 'access']);
  const canManageProducts = hasAnyPermission([
    ['products', 'create'],
    ['products', 'update'],
    ['products', 'delete']
  ]);
  const canManageOrders = hasAnyPermission([
    ['orders', 'create'],
    ['orders', 'update'],
    ['orders', 'delete']
  ]);
  const canManageUsers = hasAnyPermission([
    ['users', 'create'],
    ['users', 'update'],
    ['users', 'delete'],
    ['users', 'manage_roles']
  ]);
  const canViewAnalytics = hasPermission(['analytics', 'read']);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      console.log('[useUserRole] Usuario autenticado, obteniendo perfil...');
      fetchUserProfile();
    } else if (isLoaded && !isSignedIn) {
      console.log('[useUserRole] Usuario no autenticado');
      setUserProfile(null);
      setIsLoading(false);
      setError(null);
    }
  }, [isLoaded, isSignedIn, user, fetchUserProfile]);

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
  };
};
