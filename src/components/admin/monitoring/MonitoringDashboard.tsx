// ===================================
// PINTEYA E-COMMERCE - MONITORING DASHBOARD
// Dashboard para visualizar métricas de renderizado en tiempo real
// ===================================

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  useGlobalMonitoring, 
  MonitoringAlert, 
  RenderMetrics,
  exportMonitoringData,
  clearAllAlerts
} from '@/hooks/monitoring/useRenderMonitoring';
import { useMonitoringStats, useErrorReporting } from '@/providers/MonitoringProvider';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Download, 
  Eye, 
  MemoryStick, 
  RefreshCw, 
  Shield, 
  Trash2, 
  TrendingUp, 
  Zap 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';

// ===================================
// TIPOS
// ===================================

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  icon?: React.ReactNode;
}

interface AlertItemProps {
  alert: MonitoringAlert;
  onResolve: (alertId: string) => void;
}

// ===================================
// COMPONENTES AUXILIARES
// ===================================

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  description, 
  trend, 
  severity, 
  icon 
}) => {
  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-green-500 rotate-180" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card className={severity ? getSeverityColor(severity) : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center space-x-1">
          {icon}
          {trend && getTrendIcon(trend)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

const AlertItem: React.FC<AlertItemProps> = ({ alert, onResolve }) => {
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <Zap className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'memory': return <MemoryStick className="h-4 w-4" />;
      case 'render-loop': return <RefreshCw className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  return (
    <Alert className={`mb-3 ${alert.resolved ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-2">
          {getTypeIcon(alert.type)}
          <div className="flex-1">
            <AlertTitle className="flex items-center space-x-2">
              <span>{alert.componentName}</span>
              <Badge variant={getSeverityVariant(alert.severity)}>
                {alert.severity}
              </Badge>
              {alert.resolved && (
                <Badge variant="outline">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resuelto
                </Badge>
              )}
            </AlertTitle>
            <AlertDescription className="mt-1">
              {alert.message}
            </AlertDescription>
            <div className="text-xs text-muted-foreground mt-2">
              {new Date(alert.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        {!alert.resolved && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResolve(alert.id)}
          >
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
};

const ComponentMetricsTable: React.FC<{ metrics: Map<string, RenderMetrics> }> = ({ metrics }) => {
  const metricsArray = Array.from(metrics.entries());

  if (metricsArray.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay métricas de componentes disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {metricsArray.map(([componentName, metric]) => (
        <Card key={componentName}>
          <CardHeader>
            <CardTitle className="text-lg">{componentName}</CardTitle>
            <CardDescription>
              Última actualización: {new Date(metric.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium">Renders</p>
                <p className="text-2xl font-bold">{metric.renderCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Tiempo Promedio</p>
                <p className="text-2xl font-bold">
                  {metric.averageRenderTime.toFixed(2)}ms
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Renders Lentos</p>
                <p className="text-2xl font-bold text-orange-600">
                  {metric.slowRenders}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Errores</p>
                <p className="text-2xl font-bold text-red-600">
                  {metric.errorCount}
                </p>
              </div>
            </div>
            
            {metric.memoryUsage && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Uso de Memoria</span>
                  <span>{metric.memoryUsage.toFixed(2)} MB</span>
                </div>
                <Progress 
                  value={Math.min((metric.memoryUsage / 100) * 100, 100)} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const MonitoringDashboard: React.FC = () => {
  const { toast } = useToast();
  const {
    metrics,
    alerts,
    globalStats,
    clearAlerts,
    resolveAlert,
    exportData
  } = useGlobalMonitoring();
  
  // Integración con MonitoringProvider
  const { stats: proactiveStats, loading: proactiveLoading } = useMonitoringStats();
  const { reportError } = useErrorReporting();

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 segundos

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) {return;}

    const interval = setInterval(() => {
      // El hook ya se actualiza automáticamente
      // Este efecto es solo para forzar re-render si es necesario
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Handlers
  const handleExportData = () => {
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `monitoring-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Datos Exportados',
        description: 'Los datos de monitoreo se han descargado exitosamente.'
      });
    } catch (error) {
      // Reportar error al sistema proactivo
      reportError(error as Error, {
        source: 'monitoring_dashboard_export',
        severity: 'medium',
        context: { action: 'export_data' }
      });
      
      toast({
        title: 'Error al Exportar',
        description: 'No se pudieron exportar los datos de monitoreo.',
        variant: 'destructive'
      });
    }
  };

  const handleClearAlerts = () => {
    clearAlerts();
    toast({
      title: 'Alertas Limpiadas',
      description: 'Todas las alertas han sido eliminadas.'
    });
  };

  const handleResolveAlert = (alertId: string) => {
    resolveAlert(alertId);
    toast({
      title: 'Alerta Resuelta',
      description: 'La alerta ha sido marcada como resuelta.'
    });
  };

  // Calcular métricas derivadas
  const activeAlerts = alerts.filter(alert => !alert.resolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'critical');
  const averageRenderTime = globalStats.averageRenderTime;
  const performanceScore = Math.max(0, 100 - (averageRenderTime * 2) - (criticalAlerts.length * 10));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoreo de Renderizado</h1>
          <p className="text-muted-foreground">
            Monitoreo en tiempo real del rendimiento de componentes
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Pausar' : 'Reanudar'}
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={handleClearAlerts}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpiar Alertas
          </Button>
        </div>
      </div>

      {/* Métricas Globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Componentes Activos"
          value={globalStats.totalComponents}
          description="Componentes siendo monitoreados"
          icon={<Activity className="h-4 w-4" />}
        />
        <MetricCard
          title="Total Renders"
          value={globalStats.totalRenders.toLocaleString()}
          description="Renders totales registrados"
          icon={<RefreshCw className="h-4 w-4" />}
        />
        <MetricCard
          title="Tiempo Promedio"
          value={`${averageRenderTime.toFixed(2)}ms`}
          description="Tiempo promedio de renderizado"
          severity={averageRenderTime > 16 ? 'high' : averageRenderTime > 8 ? 'medium' : 'low'}
          icon={<Clock className="h-4 w-4" />}
        />
        <MetricCard
          title="Score de Performance"
          value={`${performanceScore.toFixed(0)}%`}
          description="Puntuación general del sistema"
          severity={performanceScore < 50 ? 'critical' : performanceScore < 70 ? 'high' : performanceScore < 85 ? 'medium' : 'low'}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Métricas del Sistema Proactivo */}
      {proactiveStats && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Sistema de Monitoreo Proactivo</h2>
            {proactiveLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Errores Detectados"
              value={proactiveStats.totalErrors.toString()}
              description="Errores capturados automáticamente"
              severity={proactiveStats.totalErrors > 10 ? 'high' : proactiveStats.totalErrors > 5 ? 'medium' : 'low'}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <MetricCard
              title="Uptime del Sistema"
              value={`${proactiveStats.uptime.toFixed(1)}%`}
              description="Disponibilidad del sistema"
              severity={proactiveStats.uptime < 95 ? 'critical' : proactiveStats.uptime < 98 ? 'medium' : 'low'}
              icon={<Activity className="h-4 w-4" />}
            />
            <MetricCard
              title="Tiempo de Respuesta"
              value={`${proactiveStats.responseTime}ms`}
              description="Tiempo promedio de respuesta"
              severity={proactiveStats.responseTime > 1000 ? 'high' : proactiveStats.responseTime > 500 ? 'medium' : 'low'}
              icon={<Clock className="h-4 w-4" />}
            />
            <MetricCard
              title="Memoria Utilizada"
              value={`${proactiveStats.memoryUsage}%`}
              description="Uso de memoria del sistema"
              severity={proactiveStats.memoryUsage > 85 ? 'critical' : proactiveStats.memoryUsage > 70 ? 'high' : 'low'}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>
        </div>
      )}

      {/* Alertas Críticas */}
      {criticalAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>¡Alertas Críticas Activas!</AlertTitle>
          <AlertDescription>
            Hay {criticalAlerts.length} alerta(s) crítica(s) que requieren atención inmediata.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="components">Componentes</TabsTrigger>
          <TabsTrigger value="alerts">
            Alertas
            {activeAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Score */}
            <Card>
              <CardHeader>
                <CardTitle>Score de Performance</CardTitle>
                <CardDescription>
                  Puntuación basada en tiempo de render y alertas críticas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2">
                      {performanceScore.toFixed(0)}%
                    </div>
                    <Progress value={performanceScore} className="h-3" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Tiempo Promedio</p>
                      <p className="text-muted-foreground">
                        {averageRenderTime.toFixed(2)}ms
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Alertas Críticas</p>
                      <p className="text-muted-foreground">
                        {criticalAlerts.length}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alertas Recientes */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas Recientes</CardTitle>
                <CardDescription>
                  Últimas 5 alertas del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {alerts.slice(0, 5).map(alert => (
                    <AlertItem
                      key={alert.id}
                      alert={alert}
                      onResolve={handleResolveAlert}
                    />
                  ))}
                  {alerts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay alertas registradas</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="components">
          <ComponentMetricsTable metrics={metrics} />
        </TabsContent>

        <TabsContent value="alerts">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Todas las Alertas ({alerts.length})
              </h3>
              <div className="flex space-x-2">
                <Badge variant="outline">
                  Activas: {activeAlerts.length}
                </Badge>
                <Badge variant="outline">
                  Resueltas: {alerts.length - activeAlerts.length}
                </Badge>
              </div>
            </div>
            
            <ScrollArea className="h-96">
              {alerts.map(alert => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onResolve={handleResolveAlert}
                />
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay alertas registradas</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringDashboard;









