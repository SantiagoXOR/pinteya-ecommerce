'use client';

// ===================================
// PINTEYA E-COMMERCE - REAL-TIME MONITORING DASHBOARD
// ===================================

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign, 
  Shield, 
  TrendingUp, 
  Users,
  RefreshCw,
  Pause,
  Play
} from 'lucide-react';

// Tipos para el dashboard
interface DashboardMetrics {
  performance: {
    responseTime: number;
    errorRate: number;
    throughput: number;
    uptime: number;
  };
  business: {
    totalRevenue: number;
    ordersToday: number;
    conversionRate: number;
    activeUsers: number;
  };
  security: {
    securityEvents: number;
    blockedRequests: number;
    authFailures: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  infrastructure: {
    circuitBreakerStatus: 'closed' | 'open' | 'half-open';
    cacheHitRate: number;
    databaseConnections: number;
    memoryUsage: number;
  };
}

interface ActiveAlert {
  id: string;
  level: 'info' | 'warning' | 'critical' | 'emergency';
  message: string;
  timestamp: string;
  metric: string;
  value: number;
  threshold: number;
}

interface MetricTrend {
  timestamp: string;
  value: number;
}

/**
 * Dashboard de Monitoreo en Tiempo Real Enterprise
 */
export default function RealTimeMonitoringDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [alerts, setAlerts] = useState<ActiveAlert[]>([]);
  const [trends, setTrends] = useState<Record<string, MetricTrend[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Configuración de auto-refresh
  const REFRESH_INTERVAL = 5000; // 5 segundos

  /**
   * Obtiene métricas del servidor
   */
  const fetchMetrics = useCallback(async () => {
    if (isPaused) return;

    try {
      setError(null);
      
      const response = await fetch('/api/admin/monitoring/metrics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setMetrics(data.data.metrics);
        setAlerts(data.data.alerts || []);
        setTrends(prev => ({
          ...prev,
          ...data.data.trends
        }));
        setLastUpdate(new Date());
      } else {
        throw new Error(data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [isPaused]);

  /**
   * Efecto para auto-refresh
   */
  useEffect(() => {
    fetchMetrics(); // Carga inicial

    const interval = setInterval(fetchMetrics, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchMetrics]);

  /**
   * Maneja pausa/reanudación del auto-refresh
   */
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  /**
   * Refresh manual
   */
  const handleManualRefresh = () => {
    setIsLoading(true);
    fetchMetrics();
  };

  /**
   * Obtiene color del badge según el nivel de alerta
   */
  const getAlertColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'destructive';
      case 'critical': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'default';
      default: return 'default';
    }
  };

  /**
   * Obtiene color del indicador de estado
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'text-green-500';
      case 'open': return 'text-red-500';
      case 'half-open': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  /**
   * Formatea números para display
   */
  const formatNumber = (num: number, decimals: number = 0) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  };

  /**
   * Formatea moneda
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  if (isLoading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Cargando métricas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Monitoreo</h1>
          <p className="text-muted-foreground">
            Métricas en tiempo real del sistema Pinteya E-commerce
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={togglePause}
            className="flex items-center space-x-1"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            <span>{isPaused ? 'Reanudar' : 'Pausar'}</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>
          
          {lastUpdate && (
            <div className="text-sm text-muted-foreground">
              Última actualización: {lastUpdate.toLocaleTimeString('es-AR')}
            </div>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error de Conexión</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Alertas Activas */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Alertas Activas ({alerts.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant={getAlertColor(alert.level)}>
                      {alert.level.toUpperCase()}
                    </Badge>
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.metric}: {formatNumber(alert.value, 2)} / {formatNumber(alert.threshold, 2)}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(alert.timestamp).toLocaleTimeString('es-AR')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas Principales */}
      {metrics && (
        <>
          {/* Performance Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(metrics.performance.responseTime)}ms</div>
                <p className="text-xs text-muted-foreground">
                  Promedio últimos 5 minutos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Error</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.performance.errorRate * 100, 2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Errores por solicitud
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(metrics.performance.throughput)}</div>
                <p className="text-xs text-muted-foreground">
                  Requests por minuto
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.performance.uptime * 100, 2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Disponibilidad del sistema
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Business Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Hoy</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.business.totalRevenue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ventas del día actual
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Órdenes Hoy</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(metrics.business.ordersToday)}</div>
                <p className="text-xs text-muted-foreground">
                  Pedidos completados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversión</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(metrics.business.conversionRate * 100, 1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Tasa de conversión
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(metrics.business.activeUsers)}</div>
                <p className="text-xs text-muted-foreground">
                  Últimos 15 minutos
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Security & Infrastructure */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Seguridad</span>
                </CardTitle>
                <CardDescription>Estado de seguridad del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Nivel de Riesgo</span>
                  <Badge variant={
                    metrics.security.riskLevel === 'low' ? 'default' :
                    metrics.security.riskLevel === 'medium' ? 'secondary' :
                    metrics.security.riskLevel === 'high' ? 'destructive' : 'destructive'
                  }>
                    {metrics.security.riskLevel.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Eventos de Seguridad</span>
                  <span className="font-bold">{formatNumber(metrics.security.securityEvents)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Requests Bloqueados</span>
                  <span className="font-bold">{formatNumber(metrics.security.blockedRequests)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Fallos de Auth</span>
                  <span className="font-bold">{formatNumber(metrics.security.authFailures)}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Infraestructura</span>
                </CardTitle>
                <CardDescription>Estado de los servicios</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Circuit Breaker</span>
                  <span className={`font-bold ${getStatusColor(metrics.infrastructure.circuitBreakerStatus)}`}>
                    {metrics.infrastructure.circuitBreakerStatus.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cache Hit Rate</span>
                  <span className="font-bold">
                    {formatNumber(metrics.infrastructure.cacheHitRate * 100, 1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>DB Connections</span>
                  <span className="font-bold">{formatNumber(metrics.infrastructure.databaseConnections)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Memory Usage</span>
                  <span className="font-bold">
                    {formatNumber(metrics.infrastructure.memoryUsage * 100, 1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
