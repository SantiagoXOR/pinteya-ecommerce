'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// Tipos para configuración de seguridad
export interface SecuritySettings {
  id: string;
  user_id: string;
  two_factor_enabled: boolean;
  login_alerts: boolean;
  suspicious_activity_alerts: boolean;
  new_device_alerts: boolean;
  password_change_alerts: boolean;
  trusted_devices_only: boolean;
  session_timeout: number; // en minutos
  max_concurrent_sessions: number;
  created_at: string;
  updated_at: string;
}

export interface SecurityAlert {
  id: string;
  user_id: string;
  type: 'login' | 'suspicious_activity' | 'new_device' | 'password_change' | 'session_timeout';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  is_resolved: boolean;
  created_at: string;
}

interface SecurityStats {
  activeSessions: number;
  unresolvedAlerts: number;
  lastSuspiciousActivity: string | null;
  uniqueDevicesLast30Days: number;
}

interface SecurityResponse {
  success: boolean;
  settings: SecuritySettings;
  alerts: SecurityAlert[];
  stats: SecurityStats;
}

interface UseSecuritySettingsReturn {
  // Estado
  settings: SecuritySettings | null;
  alerts: SecurityAlert[];
  stats: SecurityStats | null;
  isLoading: boolean;
  error: string | null;
  
  // Funciones
  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<SecuritySettings>) => Promise<boolean>;
  refreshSettings: () => Promise<void>;
  
  // Funciones específicas
  toggleTwoFactor: () => Promise<boolean>;
  updateAlertSettings: (alertSettings: {
    login_alerts?: boolean;
    suspicious_activity_alerts?: boolean;
    new_device_alerts?: boolean;
    password_change_alerts?: boolean;
  }) => Promise<boolean>;
  updateSessionSettings: (sessionSettings: {
    session_timeout?: number;
    max_concurrent_sessions?: number;
    trusted_devices_only?: boolean;
  }) => Promise<boolean>;
}

export function useSecuritySettings(): UseSecuritySettingsReturn {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener configuración de seguridad
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/security', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener configuración de seguridad');
      }

      const data: SecurityResponse = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        setAlerts(data.alerts);
        setStats(data.stats);
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      toast.error('Error al cargar configuración de seguridad: ' + errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Función para actualizar configuración
  const updateSettings = useCallback(async (updates: Partial<SecuritySettings>): Promise<boolean> => {
    if (!settings) return false;

    try {
      const response = await fetch('/api/user/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar configuración');
      }

      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        toast.success('Configuración de seguridad actualizada');
        return true;
      } else {
        throw new Error(data.error || 'Error al actualizar configuración');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      toast.error('Error al actualizar configuración: ' + errorMessage);
      return false;
    }
  }, [settings]);

  // Función para refrescar configuración
  const refreshSettings = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  // Función específica para toggle 2FA
  const toggleTwoFactor = useCallback(async (): Promise<boolean> => {
    if (!settings) return false;

    const newValue = !settings.two_factor_enabled;
    const success = await updateSettings({ two_factor_enabled: newValue });
    
    if (success) {
      toast.success(
        newValue 
          ? 'Autenticación de dos factores activada' 
          : 'Autenticación de dos factores desactivada'
      );
    }
    
    return success;
  }, [settings, updateSettings]);

  // Función para actualizar configuración de alertas
  const updateAlertSettings = useCallback(async (alertSettings: {
    login_alerts?: boolean;
    suspicious_activity_alerts?: boolean;
    new_device_alerts?: boolean;
    password_change_alerts?: boolean;
  }): Promise<boolean> => {
    const success = await updateSettings(alertSettings);
    
    if (success) {
      toast.success('Configuración de alertas actualizada');
    }
    
    return success;
  }, [updateSettings]);

  // Función para actualizar configuración de sesiones
  const updateSessionSettings = useCallback(async (sessionSettings: {
    session_timeout?: number;
    max_concurrent_sessions?: number;
    trusted_devices_only?: boolean;
  }): Promise<boolean> => {
    const success = await updateSettings(sessionSettings);
    
    if (success) {
      toast.success('Configuración de sesiones actualizada');
    }
    
    return success;
  }, [updateSettings]);

  // Cargar configuración al montar el componente
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    // Estado
    settings,
    alerts,
    stats,
    isLoading,
    error,
    
    // Funciones
    fetchSettings,
    updateSettings,
    refreshSettings,
    
    // Funciones específicas
    toggleTwoFactor,
    updateAlertSettings,
    updateSessionSettings,
  };
}

// Hook auxiliar para formatear alertas de seguridad
export function useSecurityAlerts() {
  const getSeverityColor = useCallback((severity: SecurityAlert['severity']) => {
    const colors = {
      low: 'text-blue-600 bg-blue-50',
      medium: 'text-yellow-600 bg-yellow-50',
      high: 'text-orange-600 bg-orange-50',
      critical: 'text-red-600 bg-red-50',
    };
    return colors[severity] || colors.low;
  }, []);

  const getSeverityIcon = useCallback((severity: SecurityAlert['severity']) => {
    const icons = {
      low: '🔵',
      medium: '🟡',
      high: '🟠',
      critical: '🔴',
    };
    return icons[severity] || icons.low;
  }, []);

  const formatAlertType = useCallback((type: SecurityAlert['type']) => {
    const typeMap = {
      login: 'Inicio de sesión',
      suspicious_activity: 'Actividad sospechosa',
      new_device: 'Nuevo dispositivo',
      password_change: 'Cambio de contraseña',
      session_timeout: 'Sesión expirada',
    };
    return typeMap[type] || type;
  }, []);

  return {
    getSeverityColor,
    getSeverityIcon,
    formatAlertType,
  };
}

// Hook para validaciones de seguridad
export function useSecurityValidation() {
  const validateSessionTimeout = useCallback((timeout: number): string | null => {
    if (timeout < 1) {
      return 'El timeout debe ser al menos 1 minuto';
    }
    if (timeout > 43200) { // 30 días
      return 'El timeout no puede ser mayor a 30 días (43200 minutos)';
    }
    return null;
  }, []);

  const validateMaxSessions = useCallback((maxSessions: number): string | null => {
    if (maxSessions < 1) {
      return 'Debe permitir al menos 1 sesión';
    }
    if (maxSessions > 20) {
      return 'No se pueden permitir más de 20 sesiones concurrentes';
    }
    return null;
  }, []);

  const getSecurityScore = useCallback((settings: SecuritySettings | null): number => {
    if (!settings) return 0;

    let score = 0;
    
    // 2FA vale 40 puntos
    if (settings.two_factor_enabled) score += 40;
    
    // Alertas valen 10 puntos cada una
    if (settings.login_alerts) score += 10;
    if (settings.suspicious_activity_alerts) score += 10;
    if (settings.new_device_alerts) score += 10;
    if (settings.password_change_alerts) score += 10;
    
    // Configuración de sesiones vale 20 puntos
    if (settings.session_timeout <= 1440) score += 10; // <= 1 día
    if (settings.max_concurrent_sessions <= 3) score += 10; // <= 3 sesiones
    
    return Math.min(score, 100);
  }, []);

  const getSecurityRecommendations = useCallback((settings: SecuritySettings | null): string[] => {
    if (!settings) return [];

    const recommendations: string[] = [];

    if (!settings.two_factor_enabled) {
      recommendations.push('Activa la autenticación de dos factores para mayor seguridad');
    }

    if (!settings.login_alerts) {
      recommendations.push('Activa las alertas de inicio de sesión');
    }

    if (!settings.new_device_alerts) {
      recommendations.push('Activa las alertas de nuevos dispositivos');
    }

    if (settings.session_timeout > 1440) {
      recommendations.push('Considera reducir el tiempo de sesión a menos de 24 horas');
    }

    if (settings.max_concurrent_sessions > 5) {
      recommendations.push('Considera limitar las sesiones concurrentes a 5 o menos');
    }

    return recommendations;
  }, []);

  return {
    validateSessionTimeout,
    validateMaxSessions,
    getSecurityScore,
    getSecurityRecommendations,
  };
}









