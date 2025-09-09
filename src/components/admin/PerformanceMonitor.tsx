// ===================================
// PERFORMANCE MONITOR COMPONENT
// Componente para mostrar métricas de rendimiento en tiempo real
// ===================================

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  Globe, 
  RefreshCw, 
  Server, 
  TrendingUp, 
  Zap 
} from 'lucide-react';

// Tipos para las métricas
interface PerformanceMetrics {
  totalRequests: number;
  averageResponseTime: number;
  errorRate: number;
  slowestEndpoints: Array<{ path: string; avgTime: number }>;
  errorsByStatus: Record<number, number>;
}

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  timestamp: number;
}

interface MonitoringData {
  timestamp: string;
  timeWindow: number;
  timeWindowHuman: string;
  metrics: PerformanceMetrics;
  healthCheck: HealthCheck | null;
  meta: {
    generatedAt: number;
    version: string;
    environment: string;
  };
}

const PerformanceMonitor: React.FC = () => {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 segundos
  const [timeWindow, setTimeWindow] = useState(3600000); // 1 hora

  // Función para obtener métricas
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/performance/metrics?timeWindow=${timeWindow}&health=true`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching performance metrics:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, [timeWindow]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Efecto para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMetrics]);

  // Función para obtener el color del estado de salud
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Función para obtener el icono del estado de salud
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Función para formatear tiempo
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Cargando métricas de rendimiento...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error al cargar métricas</AlertTitle>
        <AlertDescription>
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2" 
            onClick={fetchMetrics}
          >
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertTitle>Sin datos</AlertTitle>
        <AlertDescription>
          No hay métricas de rendimiento disponibles.
        </AlertDescription>
      </Alert>
    );
  }

  const { metrics, healthCheck, meta } = data;

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Monitor de Rendimiento</h2>
          <p className="text-muted-foreground">
            Métricas de los últimos {data.timeWindowHuman} • Actualizado: {new Date(data.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-4 w-4 mr-2" />
            Auto-refresh
          </Button>
        </div>
      </div>

      {/* Estado de salud general */}
      {healthCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span className={getHealthColor(healthCheck.status)}>
                {getHealthIcon(healthCheck.status)}
              </span>
              <span>Estado del Sistema</span>
              <Badge 
                variant={healthCheck.status === 'healthy' ? 'default' : 'destructive'}
                className={healthCheck.status === 'healthy' ? 'bg-green-100 text-green-800' : ''}
              >
                {healthCheck.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Globe className={`h-4 w-4 ${healthCheck.checks.api ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm">API</span>
                <Badge variant={healthCheck.checks.api ? 'default' : 'destructive'} className="text-xs">
                  {healthCheck.checks.api ? 'OK' : 'ERROR'}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Database className={`h-4 w-4 ${healthCheck.checks.database ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm">Base de Datos</span>
                <Badge variant={healthCheck.checks.database ? 'default' : 'destructive'} className="text-xs">
                  {healthCheck.checks.database ? 'OK' : 'ERROR'}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Server className={`h-4 w-4 ${healthCheck.checks.memory ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm">Memoria</span>
                <Badge variant={healthCheck.checks.memory ? 'default' : 'destructive'} className="text-xs">
                  {healthCheck.checks.memory ? 'OK' : 'ERROR'}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className={`h-4 w-4 ${healthCheck.checks.performance ? 'text-green-600' : 'text-red-600'}`} />
                <span className="text-sm">Rendimiento</span>
                <Badge variant={healthCheck.checks.performance ? 'default' : 'destructive'} className="text-xs">
                  {healthCheck.checks.performance ? 'OK' : 'ERROR'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Requests</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              En los últimos {data.timeWindowHuman}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo de Respuesta Promedio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.averageResponseTime)}</div>
            <Progress 
              value={Math.min((metrics.averageResponseTime / 2000) * 100, 100)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Target: &lt; 2s
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
              {(metrics.errorRate * 100).toFixed(2)}%
            </div>
            <Progress 
              value={Math.min(metrics.errorRate * 100 * 20, 100)} 
              className="mt-2"
              // @ts-ignore
              indicatorClassName={metrics.errorRate > 0.05 ? 'bg-red-500' : 'bg-green-500'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Target: &lt; 5%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con detalles */}
      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="endpoints">Endpoints Más Lentos</TabsTrigger>
          <TabsTrigger value="errors">Errores por Código</TabsTrigger>
          <TabsTrigger value="system">Información del Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Endpoints con Mayor Tiempo de Respuesta</CardTitle>
              <CardDescription>
                Los 10 endpoints más lentos en el período seleccionado
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.slowestEndpoints.length > 0 ? (
                <div className="space-y-2">
                  {metrics.slowestEndpoints.map((endpoint, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">{endpoint.path}</span>
                      <Badge variant="outline">
                        {formatTime(endpoint.avgTime)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No hay datos de endpoints disponibles.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Errores HTTP</CardTitle>
              <CardDescription>
                Errores agrupados por código de estado HTTP
              </CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(metrics.errorsByStatus).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(metrics.errorsByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between p-2 border rounded">
                      <span className="font-mono text-sm">HTTP {status}</span>
                      <Badge variant="destructive">
                        {count} error{count !== 1 ? 'es' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No se registraron errores en este período. ¡Excelente!</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
              <CardDescription>
                Detalles técnicos del sistema de monitoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium">Entorno:</span>
                  <Badge className="ml-2">{meta.environment}</Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Versión:</span>
                  <Badge variant="outline" className="ml-2">{meta.version}</Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Generado:</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {new Date(meta.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Ventana de tiempo:</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    {data.timeWindowHuman}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PerformanceMonitor;