/**
 * Hook personalizado para gestionar roles de usuario
 * Integra Clerk con el sistema de roles de Supabase
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';

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
  const { user, isLoaded } = useUser();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const syncUser = useCallback(async () => {
    if (!user || !isLoaded) return;

    try {
      setIsLoading(true);
      setError(null);

      const email = user.emailAddresses[0]?.emailAddress;
      if (!email) {
        console.warn('Email no disponible para sincronización');
        setError('Email no disponible');
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName: user.firstName,
          lastName: user.lastName,
          clerkUserId: user.id,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Error al sincronizar usuario (${response.status}): ${errorText}`);
        setError(`Error de sincronización (${response.status})`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUserProfile(data.user);
      } else {
        console.warn('Error en sincronización:', data.error);
        setError(data.error || 'Error de sincronización');
      }
    } catch (err) {
      // Manejo más suave de errores
      console.warn('Error syncing user:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error de conexión';
      setError(errorMessage);

      // No re-lanzar el error
    } finally {
      setIsLoading(false);
    }
  }, [user, isLoaded]);

  const fetchUserProfile = useCallback(async () => {
    if (!user || !isLoaded) return;

    try {
      setIsLoading(true);
      setError(null);

      const email = user.emailAddresses[0]?.emailAddress;
      if (!email) {
        console.warn('Email no disponible para el usuario');
        setError('Email no disponible');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/auth/sync-user?email=${encodeURIComponent(email)}`, {
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
  }, [user, isLoaded, syncUser]);

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
    if (isLoaded && user) {
      fetchUserProfile();
    } else if (isLoaded && !user) {
      setUserProfile(null);
      setIsLoading(false);
      setError(null);
    }
  }, [user, isLoaded, fetchUserProfile]);

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
