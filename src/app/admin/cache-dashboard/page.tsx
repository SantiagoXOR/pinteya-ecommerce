'use client';

// ===================================
// PINTEYA E-COMMERCE - CACHE DASHBOARD
// ===================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Download,
  Zap,
  Clock,
  BarChart3,
  Settings
} from 'lucide-react';

/**
 * Tipos para el dashboard
 */
interface CacheDashboardData {
  overview: {
    totalKeys: number;
    avgHitRate: number;
    avgResponseTime: number;
    activeAlerts: number;
    healthyLayers: number;
    totalLayers: number;
  };
  strategies: Array<{
    strategy: string;
    hitRate: number;
    avgResponseTime: number;
    totalRequests: number;
    successRate: number;
  }>;
  layers: Array<{
    layer: string;
    hitRate: number;
    avgLatency: number;
    totalRequests: number;
    healthStatus: 'healthy' | 'degraded' | 'unhealthy';
    entriesCount: number;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
    resolved: boolean;
  }>;
  trends: {
    hitRateTrend: number;
    responseTrend: number;
    volumeTrend: number;
    errorTrend: number;
  };
  topKeys: Array<{
    key: string;
    hits: number;
    misses: number;
    hitRate: number;
  }>;
  warmupTasks: Array<{
    id: string;
    name: string;
    status: 'running' | 'completed' | 'failed' | 'scheduled';
    lastRun: number;
    nextRun: number;
    successCount: number;
    errorCount: number;
  }>;
}

/**
 * Dashboard de Cache Administrativo
 */
export default function CacheDashboard() {
  const [data, setData] = useState<CacheDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'hour' | 'day' | 'week'>('day');

  /**
   * Carga datos del dashboard
   */
  const loadDashboardData = async () => {
    try {
      setRefreshing(true);
      
      // Simular llamadas a APIs (en implementación real, estas serían llamadas reales)
      const [overview, strategies, layers, alerts, trends, topKeys, warmupTasks] = await Promise.all([
        fetch('/api/cache/overview').then(r => r.json()).catch(() => mockOverview),
        fetch('/api/cache/strategies').then(r => r.json()).catch(() => mockStrategies),
        fetch('/api/cache/layers').then(r => r.json()).catch(() => mockLayers),
        fetch('/api/cache/alerts').then(r => r.json()).catch(() => mockAlerts),
        fetch(`/api/cache/trends?period=${selectedPeriod}`).then(r => r.json()).catch(() => mockTrends),
        fetch('/api/cache/top-keys').then(r => r.json()).catch(() => mockTopKeys),
        fetch('/api/cache/warmup-tasks').then(r => r.json()).catch(() => mockWarmupTasks)
      ]);

      setData({
        overview,
        strategies,
        layers,
        alerts,
        trends,
        topKeys,
        warmupTasks
      });
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /**
   * Efecto para cargar datos iniciales
   */
  useEffect(() => {
    loadDashboardData();
    
    // Actualizar cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  /**
   * Maneja limpieza de cache
   */
  const handleClearCache = async (layer?: string) => {
    try {
      const endpoint = layer ? `/api/cache/clear?layer=${layer}` : '/api/cache/clear';
      await fetch(endpoint, { method: 'POST' });
      await loadDashboardData();
    } catch (error) {
      console.error('Error limpiando cache:', error);
    }
  };

  /**
   * Maneja precalentamiento de cache
   */
  const handleWarmupCache = async (strategy?: string) => {
    try {
      const endpoint = strategy ? `/api/cache/warmup?strategy=${strategy}` : '/api/cache/warmup';
      await fetch(endpoint, { method: 'POST' });
      await loadDashboardData();
    } catch (error) {
      console.error('Error precalentando cache:', error);
    }
  };

  /**
   * Exporta reporte
   */
  const handleExportReport = async () => {
    try {
      const response = await fetch(`/api/cache/report?period=${selectedPeriod}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cache-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exportando reporte:', error);
    }
  };

  /**
   * Obtiene color de badge según severidad
   */
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  /**
   * Obtiene color de estado de salud
   */
  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  /**
   * Formatea números grandes
   */
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {return `${(num / 1000000).toFixed(1)}M`;}
    if (num >= 1000) {return `${(num / 1000).toFixed(1)}K`;}
    return num.toString();
  };

  /**
   * Formatea porcentajes
   */
  const formatPercentage = (num: number): string => {
    return `${(num * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Cargando dashboard de cache...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error cargando datos del dashboard. Por favor, intenta nuevamente.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Cache</h1>
          <p className="text-muted-foreground">
            Monitoreo y gestión del sistema de cache avanzado
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboardData()}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hit Rate Promedio</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.overview.avgHitRate)}</div>
            <Progress value={data.overview.avgHitRate * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo de Respuesta</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.overview.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground mt-2">
              Promedio de todas las capas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Keys Activas</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data.overview.totalKeys)}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Distribuidas en {data.overview.totalLayers} capas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estado del Sistema</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.overview.healthyLayers}/{data.overview.totalLayers}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.overview.activeAlerts} alertas activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Activas */}
      {data.alerts.filter(a => !a.resolved).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.alerts.filter(a => !a.resolved).slice(0, 5).map((alert) => (
                <Alert key={alert.id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {alert.type}
                        </span>
                      </div>
                      <AlertDescription>{alert.message}</AlertDescription>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principales */}
      <Tabs defaultValue="strategies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="strategies">Estrategias</TabsTrigger>
          <TabsTrigger value="layers">Capas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="warmup">Precalentamiento</TabsTrigger>
          <TabsTrigger value="management">Gestión</TabsTrigger>
        </TabsList>

        {/* Tab Estrategias */}
        <TabsContent value="strategies">
          <Card>
            <CardHeader>
              <CardTitle>Estrategias de Cache</CardTitle>
              <CardDescription>
                Performance de las diferentes estrategias implementadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.strategies.map((strategy) => (
                  <div key={strategy.strategy} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{strategy.strategy}</h4>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Hit Rate: {formatPercentage(strategy.hitRate)}</span>
                        <span>Respuesta: {strategy.avgResponseTime}ms</span>
                        <span>Requests: {formatNumber(strategy.totalRequests)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Progress value={strategy.hitRate * 100} className="w-24" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatPercentage(strategy.successRate)} éxito
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Capas */}
        <TabsContent value="layers">
          <Card>
            <CardHeader>
              <CardTitle>Capas de Cache</CardTitle>
              <CardDescription>
                Estado y performance de las capas multi-nivel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.layers.map((layer) => (
                  <div key={layer.layer} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{layer.layer}</h4>
                        <Badge className={getHealthColor(layer.healthStatus)}>
                          {layer.healthStatus}
                        </Badge>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Hit Rate: {formatPercentage(layer.hitRate)}</span>
                        <span>Latencia: {layer.avgLatency}ms</span>
                        <span>Entradas: {formatNumber(layer.entriesCount)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearCache(layer.layer)}
                      >
                        Limpiar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Analytics */}
        <TabsContent value="analytics">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tendencias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendencias ({selectedPeriod})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Hit Rate</span>
                    <span className={data.trends.hitRateTrend >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {data.trends.hitRateTrend >= 0 ? '+' : ''}{data.trends.hitRateTrend.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Tiempo de Respuesta</span>
                    <span className={data.trends.responseTrend <= 0 ? 'text-green-600' : 'text-red-600'}>
                      {data.trends.responseTrend >= 0 ? '+' : ''}{data.trends.responseTrend.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Volumen</span>
                    <span className={data.trends.volumeTrend >= 0 ? 'text-blue-600' : 'text-gray-600'}>
                      {data.trends.volumeTrend >= 0 ? '+' : ''}{data.trends.volumeTrend.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Errores</span>
                    <span className={data.trends.errorTrend <= 0 ? 'text-green-600' : 'text-red-600'}>
                      {data.trends.errorTrend >= 0 ? '+' : ''}{data.trends.errorTrend.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Keys */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Keys Más Activas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.topKeys.slice(0, 8).map((key, index) => (
                    <div key={key.key} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{key.key}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatNumber(key.hits)} hits, {formatNumber(key.misses)} misses
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">
                          {formatPercentage(key.hitRate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Precalentamiento */}
        <TabsContent value="warmup">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Tareas de Precalentamiento
                  </CardTitle>
                  <CardDescription>
                    Gestión de tareas de warmup de cache
                  </CardDescription>
                </div>
                <Button onClick={() => handleWarmupCache()}>
                  <Zap className="h-4 w-4 mr-2" />
                  Ejecutar Warmup
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.warmupTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{task.name}</h4>
                        <Badge variant={
                          task.status === 'completed' ? 'default' :
                          task.status === 'running' ? 'secondary' :
                          task.status === 'failed' ? 'destructive' : 'outline'
                        }>
                          {task.status}
                        </Badge>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Éxitos: {task.successCount}</span>
                        <span>Errores: {task.errorCount}</span>
                        <span>Última ejecución: {new Date(task.lastRun).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {task.nextRun > Date.now() && (
                        <p>Próxima: {new Date(task.nextRun).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Gestión */}
        <TabsContent value="management">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Acciones de Gestión
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleClearCache()}
                >
                  <Database className="h-4 w-4 mr-2" />
                  Limpiar Todo el Cache
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleWarmupCache('CRITICAL')}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Precalentar Cache Crítico
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={handleExportReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar Reporte Completo
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuración</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Período de Análisis</label>
                  <select 
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as any)}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="hour">Última Hora</option>
                    <option value="day">Último Día</option>
                    <option value="week">Última Semana</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ===================================
// DATOS MOCK PARA DESARROLLO
// ===================================

const mockOverview = {
  totalKeys: 1247,
  avgHitRate: 0.847,
  avgResponseTime: 23,
  activeAlerts: 2,
  healthyLayers: 3,
  totalLayers: 4
};

const mockStrategies = [
  { strategy: 'CACHE_FIRST', hitRate: 0.92, avgResponseTime: 15, totalRequests: 5420, successRate: 0.95 },
  { strategy: 'NETWORK_FIRST', hitRate: 0.78, avgResponseTime: 45, totalRequests: 2130, successRate: 0.89 },
  { strategy: 'STALE_WHILE_REVALIDATE', hitRate: 0.85, avgResponseTime: 28, totalRequests: 3240, successRate: 0.92 },
  { strategy: 'FASTEST', hitRate: 0.88, avgResponseTime: 22, totalRequests: 1890, successRate: 0.94 }
];

const mockLayers = [
  { layer: 'MEMORY', hitRate: 0.95, avgLatency: 2, totalRequests: 8420, healthStatus: 'healthy' as const, entriesCount: 1247 },
  { layer: 'REDIS', hitRate: 0.82, avgLatency: 8, totalRequests: 3240, healthStatus: 'healthy' as const, entriesCount: 892 },
  { layer: 'CDN', hitRate: 0.76, avgLatency: 45, totalRequests: 1890, healthStatus: 'degraded' as const, entriesCount: 456 },
  { layer: 'BROWSER', hitRate: 0.91, avgLatency: 1, totalRequests: 12450, healthStatus: 'healthy' as const, entriesCount: 2341 }
];

const mockAlerts = [
  { id: '1', type: 'performance', severity: 'medium' as const, message: 'Hit rate bajo en capa CDN', timestamp: Date.now() - 300000, resolved: false },
  { id: '2', type: 'capacity', severity: 'high' as const, message: 'Memoria cache al 85% de capacidad', timestamp: Date.now() - 600000, resolved: false }
];

const mockTrends = {
  hitRateTrend: 2.3,
  responseTrend: -5.1,
  volumeTrend: 12.7,
  errorTrend: -1.2
};

const mockTopKeys = [
  { key: 'products:popular', hits: 1247, misses: 123, hitRate: 0.91 },
  { key: 'categories:main', hits: 892, misses: 89, hitRate: 0.91 },
  { key: 'search:frequent', hits: 756, misses: 134, hitRate: 0.85 },
  { key: 'user:sessions', hits: 634, misses: 67, hitRate: 0.90 },
  { key: 'system:config', hits: 523, misses: 12, hitRate: 0.98 }
];

const mockWarmupTasks = [
  { id: '1', name: 'Productos Populares', status: 'completed' as const, lastRun: Date.now() - 1800000, nextRun: Date.now() + 1800000, successCount: 24, errorCount: 1 },
  { id: '2', name: 'Categorías Principales', status: 'scheduled' as const, lastRun: Date.now() - 3600000, nextRun: Date.now() + 3600000, successCount: 18, errorCount: 0 },
  { id: '3', name: 'Configuración Sistema', status: 'completed' as const, lastRun: Date.now() - 900000, nextRun: Date.now() + 2700000, successCount: 45, errorCount: 2 }
];









