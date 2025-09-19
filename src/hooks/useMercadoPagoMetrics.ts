// ===================================
// PINTEYA E-COMMERCE - MERCADOPAGO METRICS HOOK
// ===================================

import { useState, useEffect, useCallback } from 'react';
import { logger, LogCategory } from '@/lib/enterprise/logger';

// Tipos para métricas de MercadoPago
export interface MercadoPagoMetrics {
  realTimeMetrics: {
    totalRequests: number;
    successRate: number;
    errorRate: number;
    averageResponseTime: number;
    rateLimitHits: number;
    retryAttempts: number;
  };
  endpointMetrics: {
    createPreference: EndpointMetric;
    webhook: EndpointMetric;
    paymentQuery: EndpointMetric;
  };
  systemHealth: {
    redisStatus: 'connected' | 'disconnected';
    lastUpdate: string;
    uptime: number;
  };
  alerts: Alert[];
}

export interface EndpointMetric {
  requests: number;
  successRate: number;
  averageResponseTime: number;
  errorCount: number;
  lastError?: string;
}

export interface Alert {
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
  endpoint?: string;
}

interface UseMetricsOptions {
  refreshInterval?: number; // en milisegundos
  autoRefresh?: boolean;
  onError?: (error: Error) => void;
  onAlert?: (alerts: Alert[]) => void;
}

interface UseMetricsReturn {
  metrics: MercadoPagoMetrics | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
  resetMetrics: () => Promise<void>;
}

/**
 * Hook para obtener y gestionar métricas de MercadoPago en tiempo real
 */
export function useMercadoPagoMetrics(options: UseMetricsOptions = {}): UseMetricsReturn {
  const {
    refreshInterval = 30000, // 30 segundos por defecto
    autoRefresh = true,
    onError,
    onAlert,
  } = options;

  const [metrics, setMetrics] = useState<MercadoPagoMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  /**
   * Función para obtener métricas del servidor
   */
  const fetchMetrics = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/mercadopago/metrics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }

      setMetrics(data.data);
      setLastUpdate(new Date());

      // Notificar alertas si hay callback
      if (onAlert && data.data.alerts.length > 0) {
        onAlert(data.data.alerts);
      }

      logger.info(LogCategory.API, 'MercadoPago metrics updated successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      logger.error(LogCategory.API, 'Error fetching MercadoPago metrics', err as Error);

      // Notificar error si hay callback
      if (onError) {
        onError(err as Error);
      }
    } finally {
      setIsLoading(false);
    }
  }, [onError, onAlert]);

  /**
   * Función para reiniciar métricas
   */
  const resetMetrics = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/mercadopago/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido');
      }

      // Refrescar métricas después del reset
      await fetchMetrics();

      logger.info(LogCategory.API, 'MercadoPago metrics reset successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      
      logger.error(LogCategory.API, 'Error resetting MercadoPago metrics', err as Error);

      if (onError) {
        onError(err as Error);
      }
    }
  }, [fetchMetrics, onError]);

  /**
   * Función pública para refrescar métricas manualmente
   */
  const refresh = useCallback(async (): Promise<void> => {
    await fetchMetrics();
  }, [fetchMetrics]);

  // Efecto para carga inicial
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Efecto para auto-refresh
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) {
      return;
    }

    const interval = setInterval(() => {
      fetchMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  // Efecto para limpiar error cuando se obtienen métricas exitosamente
  useEffect(() => {
    if (metrics && error) {
      setError(null);
    }
  }, [metrics, error]);

  return {
    metrics,
    isLoading,
    error,
    lastUpdate,
    refresh,
    resetMetrics,
  };
}

/**
 * Hook simplificado para métricas básicas
 */
export function useMercadoPagoBasicMetrics() {
  const { metrics, isLoading, error } = useMercadoPagoMetrics({
    refreshInterval: 60000, // 1 minuto
    autoRefresh: true,
  });

  return {
    totalRequests: metrics?.realTimeMetrics.totalRequests || 0,
    successRate: metrics?.realTimeMetrics.successRate || 0,
    errorRate: metrics?.realTimeMetrics.errorRate || 0,
    averageResponseTime: metrics?.realTimeMetrics.averageResponseTime || 0,
    isLoading,
    error,
  };
}

/**
 * Hook para alertas de MercadoPago
 */
export function useMercadoPagoAlerts() {
  const { metrics } = useMercadoPagoMetrics({
    refreshInterval: 15000, // 15 segundos para alertas
    autoRefresh: true,
  });

  const criticalAlerts = metrics?.alerts.filter(alert => alert.type === 'error') || [];
  const warningAlerts = metrics?.alerts.filter(alert => alert.type === 'warning') || [];
  const infoAlerts = metrics?.alerts.filter(alert => alert.type === 'info') || [];

  return {
    alerts: metrics?.alerts || [],
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    hasAlerts: (metrics?.alerts.length || 0) > 0,
    hasCriticalAlerts: criticalAlerts.length > 0,
  };
}









