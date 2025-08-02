// ===================================
// PINTEYA E-COMMERCE - METRICS DASHBOARD
// ===================================

"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Zap,
  Shield,
  BarChart3
} from 'lucide-react';
import { MercadoPagoMetrics } from '@/lib/metrics';

interface Alert {
  type: string;
  severity: 'warning' | 'critical';
  endpoint: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: number;
}

interface MetricsResponse {
  success: boolean;
  data: {
    timeRange: string;
    metrics: MercadoPagoMetrics;
    timestamp: number;
    processingTime: number;
  };
}

interface AlertsResponse {
  success: boolean;
  data: {
    alerts: Alert[];
    timestamp: number;
    checkDuration: number;
  };
}

export default function MetricsDashboard() {
  const [metrics, setMetrics] = useState<MercadoPagoMetrics | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false); // 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN
  const [timeRange, setTimeRange] = useState(1); // horas

  // Cargar métricas
  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/metrics?hours=${timeRange}`);
      const data: MetricsResponse = await response.json();
      
      if (data.success) {
        setMetrics(data.data.metrics);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cargar alertas
  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_alerts' }),
      });
      const data: AlertsResponse = await response.json();
      
      if (data.success) {
        setAlerts(data.data.alerts);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadMetrics();
    loadAlerts();
  }, [timeRange]);

  // Auto-refresh cada 30 segundos
  // 🚫 TEMPORALMENTE DESHABILITADO PARA EVITAR RECURSIÓN EN APIS DE AUTH
  useEffect(() => {
    console.log('[METRICS_DASHBOARD] 🚫 Auto-refresh temporalmente deshabilitado para evitar recursión');
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadMetrics();
      loadAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, timeRange]);

  // Formatear números
  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Formatear tiempo
  const formatTime = (ms: number): string => {
    if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
    return `${ms.toFixed(0)}ms`;
  };

  // Formatear porcentaje
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Obtener color de estado
  const getStatusColor = (value: number, threshold: number, inverse: boolean = false): string => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Cargando métricas...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-lg text-gray-600">No se pudieron cargar las métricas</p>
        <Button onClick={loadMetrics} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  const totalRequests = metrics.payment_creation.requests.total + 
                       metrics.payment_queries.requests.total + 
                       metrics.webhook_processing.requests.total;

  const totalErrors = metrics.payment_creation.requests.error + 
                     metrics.payment_queries.requests.error + 
                     metrics.webhook_processing.requests.error;

  const overallErrorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Métricas</h1>
          <p className="text-gray-600">
            Monitoreo en tiempo real de APIs MercadoPago
            {lastUpdate && (
              <span className="ml-2 text-sm">
                • Última actualización: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Selector de rango temporal */}
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value={0.25}>Últimos 15 min</option>
            <option value={1}>Última hora</option>
            <option value={6}>Últimas 6 horas</option>
            <option value={24}>Últimas 24 horas</option>
          </select>

          {/* Toggle auto-refresh */}
          <Button
            variant={autoRefresh ? "secondary" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <Activity className="w-4 h-4 mr-2" />
            Auto-refresh
          </Button>

          {/* Refresh manual */}
          <Button onClick={loadMetrics} size="sm" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alertas Activas ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {alert.severity}
                    </Badge>
                    <span className="ml-3 text-sm">{alert.message}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metrics.overall_health.uptime_percentage.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Disponibilidad del sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests Totales</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalRequests)}</div>
            <p className="text-xs text-muted-foreground">
              En las últimas {timeRange}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Error</CardTitle>
            {overallErrorRate > 0.05 ? (
              <TrendingUp className="h-4 w-4 text-red-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(overallErrorRate, 0.05, true)}`}>
              {formatPercentage(overallErrorRate)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalErrors} errores de {totalRequests} requests
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Respuesta</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTime(metrics.overall_health.avg_response_time)}
            </div>
            <p className="text-xs text-muted-foreground">
              Promedio general
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Métricas por endpoint */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2 text-blue-600" />
              Creación de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total</p>
                <p className="font-semibold">{formatNumber(metrics.payment_creation.requests.total)}</p>
              </div>
              <div>
                <p className="text-gray-600">Éxito</p>
                <p className="font-semibold text-green-600">{formatNumber(metrics.payment_creation.requests.success)}</p>
              </div>
              <div>
                <p className="text-gray-600">Errores</p>
                <p className="font-semibold text-red-600">{formatNumber(metrics.payment_creation.requests.error)}</p>
              </div>
              <div>
                <p className="text-gray-600">Rate Limited</p>
                <p className="font-semibold text-yellow-600">{formatNumber(metrics.payment_creation.requests.rate_limited)}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Tiempo de Respuesta</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>P95: {formatTime(metrics.payment_creation.response_times.p95)}</div>
                <div>P99: {formatTime(metrics.payment_creation.response_times.p99)}</div>
                <div>Avg: {formatTime(metrics.payment_creation.response_times.avg)}</div>
                <div>Max: {formatTime(metrics.payment_creation.response_times.max)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
              Consultas de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total</p>
                <p className="font-semibold">{formatNumber(metrics.payment_queries.requests.total)}</p>
              </div>
              <div>
                <p className="text-gray-600">Éxito</p>
                <p className="font-semibold text-green-600">{formatNumber(metrics.payment_queries.requests.success)}</p>
              </div>
              <div>
                <p className="text-gray-600">Errores</p>
                <p className="font-semibold text-red-600">{formatNumber(metrics.payment_queries.requests.error)}</p>
              </div>
              <div>
                <p className="text-gray-600">Rate Limited</p>
                <p className="font-semibold text-yellow-600">{formatNumber(metrics.payment_queries.requests.rate_limited)}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Tiempo de Respuesta</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>P95: {formatTime(metrics.payment_queries.response_times.p95)}</div>
                <div>P99: {formatTime(metrics.payment_queries.response_times.p99)}</div>
                <div>Avg: {formatTime(metrics.payment_queries.response_times.avg)}</div>
                <div>Max: {formatTime(metrics.payment_queries.response_times.max)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhook Processing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="w-5 h-5 mr-2 text-purple-600" />
              Procesamiento Webhooks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Total</p>
                <p className="font-semibold">{formatNumber(metrics.webhook_processing.requests.total)}</p>
              </div>
              <div>
                <p className="text-gray-600">Éxito</p>
                <p className="font-semibold text-green-600">{formatNumber(metrics.webhook_processing.requests.success)}</p>
              </div>
              <div>
                <p className="text-gray-600">Errores</p>
                <p className="font-semibold text-red-600">{formatNumber(metrics.webhook_processing.requests.error)}</p>
              </div>
              <div>
                <p className="text-gray-600">Rate Limited</p>
                <p className="font-semibold text-yellow-600">{formatNumber(metrics.webhook_processing.requests.rate_limited)}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">Tiempo de Respuesta</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>P95: {formatTime(metrics.webhook_processing.response_times.p95)}</div>
                <div>P99: {formatTime(metrics.webhook_processing.response_times.p99)}</div>
                <div>Avg: {formatTime(metrics.webhook_processing.response_times.avg)}</div>
                <div>Max: {formatTime(metrics.webhook_processing.response_times.max)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
