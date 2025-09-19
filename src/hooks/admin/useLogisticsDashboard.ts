// =====================================================
// HOOK: LOGISTICS DASHBOARD ENTERPRISE
// Descripción: Hook para dashboard de logística con métricas tiempo real
// Basado en: Patrones WooCommerce Activity Panels + TanStack Query
// =====================================================

'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { 
  LogisticsDashboardResponse,
  UseLogisticsDashboardReturn 
} from '@/types/logistics';

// =====================================================
// CONFIGURACIÓN DE QUERY
// =====================================================

const QUERY_KEY = ['admin', 'logistics', 'dashboard'];
const REFETCH_INTERVAL = 30000; // 30 segundos
const STALE_TIME = 20000; // 20 segundos

// =====================================================
// FUNCIÓN DE FETCH
// =====================================================

async function fetchLogisticsDashboard(): Promise<LogisticsDashboardResponse['data']> {
  const response = await fetch('/api/admin/logistics/dashboard', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store'
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.data;
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useLogisticsDashboard(options?: {
  enabled?: boolean;
  refetchInterval?: number;
  onError?: (error: Error) => void;
}): UseLogisticsDashboardReturn {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const {
    data,
    isLoading,
    error,
    refetch: queryRefetch,
    isRefetching
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchLogisticsDashboard,
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? REFETCH_INTERVAL,
    staleTime: STALE_TIME,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: options?.onError
  });
  
  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================
  
  const refetch = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await queryRefetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [queryRefetch]);
  
  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEY });
  }, [queryClient]);
  
  const updateCache = useCallback((updater: (oldData: LogisticsDashboardResponse['data'] | undefined) => LogisticsDashboardResponse['data']) => {
    queryClient.setQueryData(QUERY_KEY, updater);
  }, [queryClient]);
  
  // =====================================================
  // MÉTRICAS DERIVADAS
  // =====================================================
  
  const derivedMetrics = data ? {
    // Tasa de envíos activos
    active_shipments_rate: data.stats.total_shipments > 0 
      ? ((data.stats.in_transit_shipments + data.stats.pending_shipments) / data.stats.total_shipments) * 100 
      : 0,
    
    // Tasa de excepciones
    exception_rate: data.stats.total_shipments > 0 
      ? (data.stats.exception_shipments / data.stats.total_shipments) * 100 
      : 0,
    
    // Costo promedio por envío
    average_shipping_cost: data.stats.total_shipments > 0 
      ? data.stats.total_shipping_cost / data.stats.total_shipments 
      : 0,
    
    // Tendencia de envíos (últimos 7 días vs anteriores)
    shipments_trend: data.performance_metrics.length >= 14 ? (() => {
      const last7Days = data.performance_metrics.slice(-7);
      const previous7Days = data.performance_metrics.slice(-14, -7);
      
      const last7Total = last7Days.reduce((acc, day) => acc + day.shipments_count, 0);
      const previous7Total = previous7Days.reduce((acc, day) => acc + day.shipments_count, 0);
      
      return previous7Total > 0 
        ? ((last7Total - previous7Total) / previous7Total) * 100 
        : 0;
    })() : 0,
    
    // Mejor courier por performance
    best_performing_courier: data.carrier_performance.length > 0 
      ? data.carrier_performance.reduce((best, current) => 
          current.on_time_rate > best.on_time_rate ? current : best
        )
      : null
  } : null;
  
  // =====================================================
  // ALERTAS CRÍTICAS
  // =====================================================
  
  const criticalAlerts = data?.alerts.filter(alert => alert.type === 'error') || [];
  const warningAlerts = data?.alerts.filter(alert => alert.type === 'warning') || [];
  
  // =====================================================
  // ESTADO DE SALUD DEL SISTEMA
  // =====================================================
  
  const systemHealth = data ? {
    status: (() => {
      if (criticalAlerts.length > 0) {return 'critical';}
      if (warningAlerts.length > 3) {return 'warning';}
      if (data.stats.on_time_delivery_rate < 80) {return 'warning';}
      return 'healthy';
    })(),
    score: Math.round(
      (data.stats.on_time_delivery_rate * 0.4) + 
      ((100 - (derivedMetrics?.exception_rate || 0)) * 0.3) +
      (data.stats.active_couriers > 0 ? 20 : 0) +
      (criticalAlerts.length === 0 ? 10 : 0)
    )
  } : null;
  
  return {
    // Datos principales
    data,
    isLoading: isLoading || isRefreshing,
    error: error as Error | null,
    refetch,
    
    // Estados adicionales
    isRefetching: isRefetching || isRefreshing,
    
    // Funciones de cache
    invalidateCache,
    updateCache,
    
    // Métricas derivadas
    derivedMetrics,
    
    // Alertas categorizadas
    criticalAlerts,
    warningAlerts,
    
    // Estado de salud
    systemHealth
  };
}

// =====================================================
// HOOK PARA MÉTRICAS EN TIEMPO REAL
// =====================================================

export function useLogisticsRealTimeMetrics() {
  const { data, refetch } = useLogisticsDashboard({
    refetchInterval: 10000 // 10 segundos para tiempo real
  });
  
  return {
    metrics: data?.stats,
    recentShipments: data?.recent_shipments,
    alerts: data?.alerts,
    refetch
  };
}

// =====================================================
// HOOK PARA PERFORMANCE DE COURIERS
// =====================================================

export function useCarrierPerformance() {
  const { data } = useLogisticsDashboard();
  
  const sortedCarriers = data?.carrier_performance.sort((a, b) => 
    b.on_time_rate - a.on_time_rate
  ) || [];
  
  const topPerformer = sortedCarriers[0];
  const worstPerformer = sortedCarriers[sortedCarriers.length - 1];
  
  return {
    carriers: sortedCarriers,
    topPerformer,
    worstPerformer,
    averageOnTimeRate: sortedCarriers.length > 0 
      ? sortedCarriers.reduce((acc, carrier) => acc + carrier.on_time_rate, 0) / sortedCarriers.length 
      : 0
  };
}

// =====================================================
// HOOK PARA ALERTAS
// =====================================================

export function useLogisticsAlerts() {
  const { data, refetch } = useLogisticsDashboard();
  
  const unreadAlerts = data?.alerts.filter(alert => !alert.is_read) || [];
  const criticalCount = unreadAlerts.filter(alert => alert.type === 'error').length;
  const warningCount = unreadAlerts.filter(alert => alert.type === 'warning').length;
  
  return {
    alerts: data?.alerts || [],
    unreadAlerts,
    criticalCount,
    warningCount,
    totalUnread: unreadAlerts.length,
    refetch
  };
}

// =====================================================
// TIPOS EXTENDIDOS PARA EL HOOK
// =====================================================

export interface UseLogisticsDashboardExtendedReturn extends UseLogisticsDashboardReturn {
  isRefetching: boolean;
  invalidateCache: () => void;
  updateCache: (updater: (oldData: LogisticsDashboardResponse['data'] | undefined) => LogisticsDashboardResponse['data']) => void;
  derivedMetrics: {
    active_shipments_rate: number;
    exception_rate: number;
    average_shipping_cost: number;
    shipments_trend: number;
    best_performing_courier: any;
  } | null;
  criticalAlerts: any[];
  warningAlerts: any[];
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    score: number;
  } | null;
}









