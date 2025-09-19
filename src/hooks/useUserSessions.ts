'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { analyzeSessionForAnomalies } from '@/lib/security/anomalyDetection';

// Tipos para sesiones
export interface UserSession {
  id: string;
  user_id: string;
  device_type: string;
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  location?: string;
  is_current: boolean;
  is_trusted?: boolean;
  last_activity: string;
  created_at: string;
  user_agent: string;
}

interface SessionsResponse {
  success: boolean;
  sessions: UserSession[];
  total: number;
}

interface UseUserSessionsReturn {
  // Estado
  sessions: UserSession[];
  isLoading: boolean;
  error: string | null;
  
  // Funciones
  fetchSessions: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<boolean>;
  revokeAllSessions: () => Promise<boolean>;
  trustDevice: (sessionId: string) => Promise<boolean>;
  refreshSessions: () => Promise<void>;
  
  // Estadísticas
  totalSessions: number;
  currentSession: UserSession | null;
  remoteSessions: UserSession[];
}

export function useUserSessions(): UseUserSessionsReturn {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener sesiones
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/sessions', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener sesiones');
      }

      const data: SessionsResponse = await response.json();
      
      if (data.success) {
        setSessions(data.sessions);
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error('Error al cargar sesiones: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para cerrar una sesión específica
  const revokeSession = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cerrar sesión');
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar estado local
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        toast.success('Sesión cerrada exitosamente');
        return true;
      } else {
        throw new Error(data.error || 'Error al cerrar sesión');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('Error al cerrar sesión: ' + errorMessage);
      return false;
    }
  }, []);

  // Función para cerrar todas las sesiones remotas
  const revokeAllSessions = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/user/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cerrar sesiones');
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar estado local - mantener solo la sesión actual
        setSessions(prev => prev.filter(session => session.is_current));
        toast.success('Todas las sesiones remotas han sido cerradas');
        return true;
      } else {
        throw new Error(data.error || 'Error al cerrar sesiones');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('Error al cerrar sesiones: ' + errorMessage);
      return false;
    }
  }, []);

  // Función para marcar dispositivo como confiable
  const trustDevice = useCallback(async (sessionId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/user/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          is_trusted: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al marcar dispositivo como confiable');
      }

      const data = await response.json();
      
      if (data.success) {
        // Actualizar estado local
        setSessions(prev => prev.map(session => 
          session.id === sessionId 
            ? { ...session, is_trusted: true }
            : session
        ));
        toast.success('Dispositivo marcado como confiable');
        return true;
      } else {
        throw new Error(data.error || 'Error al marcar dispositivo como confiable');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('Error al marcar dispositivo: ' + errorMessage);
      return false;
    }
  }, []);

  // Función para refrescar sesiones
  const refreshSessions = useCallback(async () => {
    await fetchSessions();
  }, [fetchSessions]);

  // Cargar sesiones al montar el componente
  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSessions();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchSessions]);

  // Calcular estadísticas
  const totalSessions = sessions.length;
  const currentSession = sessions.find(session => session.is_current) || null;
  const remoteSessions = sessions.filter(session => !session.is_current);

  return {
    // Estado
    sessions,
    isLoading,
    error,
    
    // Funciones
    fetchSessions,
    revokeSession,
    revokeAllSessions,
    trustDevice,
    refreshSessions,
    
    // Estadísticas
    totalSessions,
    currentSession,
    remoteSessions,
  };
}

// Hook auxiliar para registrar nueva sesión
export function useSessionRegistration() {
  const [isRegistered, setIsRegistered] = useState(false);

  const registerSession = useCallback(async () => {
    if (isRegistered) return;

    try {
      const response = await fetch('/api/user/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          register_current: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsRegistered(true);
        console.log('Sesión registrada:', data.session);

        // Analizar sesión para detectar anomalías
        if (data.session) {
          try {
            await analyzeSessionForAnomalies({
              userId: data.session.user_id,
              sessionId: data.session.id,
              ipAddress: data.session.ip_address,
              userAgent: data.session.user_agent,
              deviceType: data.session.device_type,
              location: data.session.location,
              timestamp: data.session.created_at,
            });
          } catch (anomalyError) {
            console.error('Error en análisis de anomalías:', anomalyError);
          }
        }
      }
    } catch (error) {
      console.error('Error al registrar sesión:', error);
    }
  }, [isRegistered]);

  // Registrar sesión al cargar la página
  useEffect(() => {
    registerSession();
  }, [registerSession]);

  return { registerSession, isRegistered };
}









