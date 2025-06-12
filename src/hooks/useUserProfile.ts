// ===================================
// PINTEYA E-COMMERCE - HOOK PARA PERFIL DE USUARIO
// ===================================

import { useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  clerk_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => void;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener el perfil
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al obtener perfil');
      }

      if (data.success) {
        setProfile(data.user);
      } else {
        throw new Error('Error al obtener perfil');
      }
    } catch (err) {
      console.error('Error en useUserProfile:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar el perfil
  const updateProfile = async (updateData: Partial<UserProfile>): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar perfil');
      }

      if (data.success) {
        setProfile(data.user);
        return true;
      } else {
        throw new Error('Error al actualizar perfil');
      }
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    }
  };

  // Función para refrescar el perfil
  const refreshProfile = () => {
    fetchProfile();
  };

  // Cargar perfil al montar el componente
  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    error,
    updateProfile,
    refreshProfile,
  };
}
