// =====================================================
// PÁGINA: DASHBOARD DE LOGÍSTICA ENTERPRISE
// Ruta: /admin/logistics
// Descripción: Dashboard principal del módulo de logística
// Basado en: Patrones WooCommerce Activity Panels
// =====================================================

'use client';

import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  Truck,
  MapPin,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  RefreshCw,
  BarChart3,
  Users,
  Navigation
} from 'lucide-react';
import { useLogisticsDashboard } from '@/hooks/admin/useLogisticsDashboard';
import { LogisticsMetricsCards } from '@/components/admin/logistics/LogisticsMetricsCards';
import { ShipmentsList } from '@/components/admin/logistics/ShipmentsList';
import { LogisticsAlerts } from '@/components/admin/logistics/LogisticsAlerts';
import { PerformanceChart } from '@/components/admin/logistics/PerformanceChart';
import { CarrierPerformanceTable } from '@/components/admin/logistics/CarrierPerformanceTable';
import { CreateShipmentDialog } from '@/components/admin/logistics/CreateShipmentDialog';
import { GoogleMapsLogistics } from '@/components/admin/logistics/GoogleMapsLogistics';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function LogisticsDashboard() {
  const { 
    data, 
    isLoading, 
    error, 
    refetch,
    derivedMetrics,
    criticalAlerts,
    warningAlerts,
    systemHealth 
  } = useLogisticsDashboard();

  if (isLoading) {
    return <LogisticsDashboardSkeleton />;
  }

  if (error) {
    return (
      <ErrorBoundary 
        error={error} 
        onRetry={refetch}
        title="Error al cargar dashboard de logística"
      />
    );
  }

  if (!data) {
    return <EmptyDashboard />;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Logística</h1>
          <p className="text-muted-foreground">
            Gestión completa de envíos y tracking en tiempo real
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Estado de salud del sistema */}
          {systemHealth && (
            <Badge 
              variant={
                systemHealth.status === 'healthy' ? 'default' :
                systemHealth.status === 'warning' ? 'secondary' : 'destructive'
              }
              className="flex items-center gap-1"
            >
              {systemHealth.status === 'healthy' && <CheckCircle className="w-3 h-3" />}
              {systemHealth.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
              {systemHealth.status === 'critical' && <AlertTriangle className="w-3 h-3" />}
              Sistema {systemHealth.status === 'healthy' ? 'Saludable' : 
                      systemHealth.status === 'warning' ? 'Con Alertas' : 'Crítico'}
              <span className="ml-1">({systemHealth.score}/100)</span>
            </Badge>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </Button>
          
          <CreateShipmentDialog>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Crear Envío
            </Button>
          </CreateShipmentDialog>
        </div>
      </div>

      {/* Alertas críticas */}
      {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <LogisticsAlerts 
          alerts={[...criticalAlerts, ...warningAlerts]} 
          className="mb-6"
        />
      )}

      {/* Métricas principales */}
      <LogisticsMetricsCards 
        stats={data.stats} 
        derivedMetrics={derivedMetrics}
      />

      {/* Contenido principal en tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="maps" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Mapas
          </TabsTrigger>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Navigation className="w-4 h-4" />
            Rutas
          </TabsTrigger>
          <TabsTrigger value="shipments" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Envíos
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="carriers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Couriers
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Envíos recientes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Envíos Recientes
                </CardTitle>
                <CardDescription>
                  Últimos 10 envíos creados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShipmentsList 
                  shipments={data.recent_shipments}
                  compact={true}
                  showActions={false}
                />
              </CardContent>
            </Card>

            {/* Gráfico de performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Tendencia de Envíos
                </CardTitle>
                <CardDescription>
                  Últimos 30 días
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceChart 
                  data={data.performance_metrics}
                  height={300}
                />
              </CardContent>
            </Card>
          </div>

          {/* Métricas derivadas */}
          {derivedMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Envíos Activos
                      </p>
                      <p className="text-2xl font-bold">
                        {derivedMetrics.active_shipments_rate.toFixed(1)}%
                      </p>
                    </div>
                    <Truck className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Tasa de Excepciones
                      </p>
                      <p className="text-2xl font-bold">
                        {derivedMetrics.exception_rate.toFixed(1)}%
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Costo Promedio
                      </p>
                      <p className="text-2xl font-bold">
                        ${derivedMetrics.average_shipping_cost.toFixed(0)}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Tendencia
                      </p>
                      <p className="text-2xl font-bold">
                        {derivedMetrics.shipments_trend > 0 ? '+' : ''}
                        {derivedMetrics.shipments_trend.toFixed(1)}%
                      </p>
                    </div>
                    <BarChart3 className={`w-8 h-8 ${
                      derivedMetrics.shipments_trend > 0 ? 'text-green-500' : 'text-red-500'
                    }`} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab: Mapas */}
        <TabsContent value="maps">
          <Suspense fallback={<LoadingSkeleton className="h-96" />}>
            <GoogleMapsLogistics
              shipments={data.recent_shipments || []}
              enableRouteOptimization={true}
              enableRealTimeTracking={true}
              height="700px"
            />
          </Suspense>
        </TabsContent>

        {/* Tab: Rutas */}
        <TabsContent value="routes">
          <Suspense fallback={<LoadingSkeleton className="h-96" />}>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="w-5 h-5" />
                    Optimización de Rutas para Carriers Propios
                  </CardTitle>
                  <CardDescription>
                    Gestión inteligente de rutas diarias para maximizar eficiencia y reducir costos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GoogleMapsLogistics
                    shipments={data.recent_shipments || []}
                    enableRouteOptimization={true}
                    enableRealTimeTracking={true}
                    height="600px"
                  />
                </CardContent>
              </Card>
            </div>
          </Suspense>
        </TabsContent>

        {/* Tab: Envíos */}
        <TabsContent value="shipments">
          <Suspense fallback={<LoadingSkeleton />}>
            <ShipmentsList 
              shipments={data.recent_shipments}
              showFilters={true}
              showPagination={true}
            />
          </Suspense>
        </TabsContent>

        {/* Tab: Performance */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
              <CardDescription>
                Análisis detallado de performance de envíos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceChart 
                data={data.performance_metrics}
                height={400}
                showDetails={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Couriers */}
        <TabsContent value="carriers">
          <Card>
            <CardHeader>
              <CardTitle>Performance de Couriers</CardTitle>
              <CardDescription>
                Comparativa de rendimiento por proveedor de envío
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CarrierPerformanceTable 
                carriers={data.carrier_performance}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

function LogisticsDashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Package className="w-16 h-16 text-gray-400" />
      <h3 className="text-lg font-semibold">No hay datos de logística</h3>
      <p className="text-muted-foreground text-center max-w-md">
        Comienza creando tu primer envío para ver las métricas y estadísticas del dashboard.
      </p>
      <CreateShipmentDialog>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Crear Primer Envío
        </Button>
      </CreateShipmentDialog>
    </div>
  );
}









