// ===================================
// PINTEYA E-COMMERCE - HOOK PARA PERFIL DE USUARIO
// ===================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useNotifications } from './useNotifications';

export interface UserProfile {
  id: string;
  clerk_id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  name: string;
  email: string;
  phone?: string;
}

export interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: UpdateProfileData) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  uploadAvatar: (file: File) => Promise<boolean>;
  deleteAvatar: () => Promise<boolean>;
}

export function useUserProfile(): UseUserProfileReturn {
  const { isSignedIn, isLoaded } = useAuth();
  const { notifyProfileChange, notifySecurityAlert } = useNotifications();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isSignedIn || !isLoaded) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener el perfil');
      }

      const data = await response.json();

      if (data.success && data.user) {
        setProfile(data.user);
      } else {
        throw new Error(data.error || 'Error al cargar el perfil');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error al obtener perfil:', err);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, isLoaded]);

  const updateProfile = useCallback(async (data: UpdateProfileData): Promise<boolean> => {
    if (!isSignedIn) {
      toast.error('Debes estar autenticado para actualizar tu perfil');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Guardar valores anteriores para notificaciones
      const oldEmail = profile?.email;
      const oldPhone = profile?.phone;

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar el perfil');
      }

      const result = await response.json();

      if (result.success && result.user) {
        setProfile(result.user);

        // Notificaciones básicas
        await notifyProfileChange('Perfil actualizado correctamente');

        // Notificaciones por email para cambios críticos
        if (data.email && data.email !== oldEmail) {
          await notifySecurityAlert(
            'Tu email ha sido actualizado. Revisa tu bandeja de entrada.',
            {
              type: 'profile_email_changed',
              oldValue: oldEmail,
              newValue: data.email,
            },
            { toastType: 'info', toastDuration: 6000 }
          );
        }

        if (data.phone && data.phone !== oldPhone) {
          await notifySecurityAlert(
            'Tu teléfono ha sido actualizado.',
            {
              type: 'profile_phone_changed',
              oldValue: oldPhone,
              newValue: data.phone,
            },
            { toastType: 'info', toastDuration: 4000 }
          );
        }

        return true;
      } else {
        throw new Error(result.error || 'Error al actualizar el perfil');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error al actualizar perfil:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, profile, notifyProfileChange, notifySecurityAlert]);

  const uploadAvatar = useCallback(async (file: File): Promise<boolean> => {
    if (!isSignedIn) {
      toast.error('Debes estar autenticado para subir un avatar');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el avatar');
      }

      const result = await response.json();

      if (result.success) {
        if (profile) {
          setProfile({
            ...profile,
            avatar_url: result.avatar_url,
            updated_at: new Date().toISOString(),
          });
        }
        toast.success('Avatar actualizado correctamente');
        return true;
      } else {
        throw new Error(result.error || 'Error al subir el avatar');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error al subir avatar:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, profile]);

  const deleteAvatar = useCallback(async (): Promise<boolean> => {
    if (!isSignedIn) {
      toast.error('Debes estar autenticado para eliminar tu avatar');
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el avatar');
      }

      const result = await response.json();

      if (result.success) {
        if (profile) {
          setProfile({
            ...profile,
            avatar_url: undefined,
            updated_at: new Date().toISOString(),
          });
        }
        toast.success('Avatar eliminado correctamente');
        return true;
      } else {
        throw new Error(result.error || 'Error al eliminar el avatar');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error al eliminar avatar:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, profile]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
    uploadAvatar,
    deleteAvatar,
  };
}









