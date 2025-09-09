// =====================================================
// COMPONENTE: REAL TIME DASHBOARD ENTERPRISE
// Descripción: Dashboard integrado con mapas, WebSockets y tracking live
// Basado en: MapLibre GL JS + WebSockets + React + TanStack Query
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Map as MapIcon, 
  Activity, 
  Bell, 
  Zap, 
  Package, 
  Truck,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Maximize2,
  RefreshCw
} from 'lucide-react';
import { LogisticsMap } from './LogisticsMap';
import { TrackingTimeline } from './TrackingTimeline';
import { LogisticsAlerts } from './LogisticsAlerts';
import { GeofenceManager } from './GeofenceManager';
import { useLogisticsDashboard } from '@/hooks/admin/useLogisticsDashboard';
import { useLogisticsWebSocket, useLogisticsAlerts } from '@/hooks/admin/useLogisticsWebSocket';
import { useShipments } from '@/hooks/admin/useShipments';
import { cn } from '@/lib/utils';

// =====================================================
// INTERFACES
// =====================================================

interface RealTimeDashboardProps {
  className?: string;
}

interface LiveMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function RealTimeDashboard({ className }: RealTimeDashboardProps) {
  const [selectedShipment, setSelectedShipment] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Hooks de datos
  const { 
    data: dashboardData, 
    isLoading: dashboardLoading, 
    refetch: refetchDashboard 
  } = useLogisticsDashboard();
  
  const { 
    data: shipmentsData, 
    isLoading: shipmentsLoading 
  } = useShipments({ 
    limit: 50, 
    order_by: 'created_at', 
    order_direction: 'desc' 
  });
  
  // WebSocket tiempo real
  const {
    isConnected,
    connectionState,
    lastTrackingUpdate,
    connect,
    disconnect
  } = useLogisticsWebSocket({
    enabled: true,
    autoConnect: true,
    showNotifications: true,
    simulateInDevelopment: false // Deshabilitado para evitar notificaciones persistentes
  });
  
  // Alertas tiempo real
  const {
    alerts,
    criticalAlerts,
    unreadAlerts,
    clearAlerts
  } = useLogisticsAlerts();
  
  // =====================================================
  // MÉTRICAS EN TIEMPO REAL
  // =====================================================
  
  const liveMetrics: LiveMetric[] = [
    {
      label: 'Envíos Activos',
      value: dashboardData?.stats.in_transit_shipments || 0,
      change: 5.2,
      trend: 'up',
      icon: Truck,
      color: 'text-blue-600'
    },
    {
      label: 'En Reparto',
      value: dashboardData?.stats.pending_shipments || 0,
      change: -2.1,
      trend: 'down',
      icon: Package,
      color: 'text-orange-600'
    },
    {
      label: 'Entregados Hoy',
      value: dashboardData?.stats.delivered_shipments || 0,
      change: 12.5,
      trend: 'up',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      label: 'Alertas Críticas',
      value: criticalAlerts.length,
      change: 0,
      trend: 'stable',
      icon: AlertTriangle,
      color: 'text-red-600'
    }
  ];
  
  // =====================================================
  // EFECTOS
  // =====================================================
  
  useEffect(() => {
    // Refrescar dashboard cuando llegan actualizaciones
    if (lastTrackingUpdate) {
      refetchDashboard();
    }
  }, [lastTrackingUpdate, refetchDashboard]);
  
  // =====================================================
  // HANDLERS
  // =====================================================
  
  const handleShipmentSelect = (shipment: any) => {
    setSelectedShipment(shipment);
    setActiveTab('tracking');
  };
  
  const handleToggleConnection = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };
  
  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const handleRefresh = () => {
    refetchDashboard();
  };
  
  if (dashboardLoading || shipmentsLoading) {
    return <DashboardSkeleton />;
  }
  
  return (
    <div className={cn(
      "space-y-6 p-6",
      isFullscreen && "fixed inset-0 z-50 bg-background overflow-auto",
      className
    )}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8" />
            Dashboard en Tiempo Real
          </h1>
          <p className="text-muted-foreground">
            Monitoreo live de logística con tracking GPS y alertas automáticas
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Estado de conexión */}
          <Badge 
            variant={isConnected ? "default" : "secondary"} 
            className="flex items-center gap-1"
          >
            {isConnected ? (
              <>
                <Zap className="w-3 h-3" />
                Tiempo Real
              </>
            ) : (
              <>
                <Clock className="w-3 h-3" />
                Desconectado
              </>
            )}
          </Badge>
          
          {/* Alertas */}
          {unreadAlerts.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Bell className="w-3 h-3" />
              {unreadAlerts.length} Alertas
            </Badge>
          )}
          
          {/* Controles */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleToggleConnection}
          >
            {isConnected ? 'Desconectar' : 'Conectar'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleFullscreen}
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Métricas en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {liveMetrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={cn(
                      "text-xs font-medium",
                      metric.trend === 'up' && "text-green-600",
                      metric.trend === 'down' && "text-red-600",
                      metric.trend === 'stable' && "text-gray-600"
                    )}>
                      {metric.trend === 'up' && '+'}
                      {metric.change}%
                    </span>
                    <span className="text-xs text-muted-foreground">vs ayer</span>
                  </div>
                </div>
                <metric.icon className={cn("w-8 h-8", metric.color)} />
              </div>
              
              {/* Indicador de tiempo real */}
              {isConnected && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Alertas críticas */}
      {criticalAlerts.length > 0 && (
        <LogisticsAlerts 
          alerts={criticalAlerts} 
          maxVisible={3}
          onDismiss={(alertId) => console.log('Dismiss alert:', alertId)}
        />
      )}
      
      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Mapa principal */}
        <div className="lg:col-span-2">
          <LogisticsMap
            shipments={shipmentsData?.data || []}
            selectedShipment={selectedShipment}
            onShipmentSelect={handleShipmentSelect}
            realTimeEnabled={isConnected}
            className="h-[600px]"
          />
        </div>
        
        {/* Panel lateral */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
              <TabsTrigger value="alerts">Alertas</TabsTrigger>
            </TabsList>
            
            {/* Tab: Resumen */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {shipmentsData?.data.slice(0, 5).map((shipment) => (
                      <div 
                        key={shipment.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleShipmentSelect(shipment)}
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          shipment.status === 'delivered' && "bg-green-500",
                          shipment.status === 'in_transit' && "bg-blue-500",
                          shipment.status === 'out_for_delivery' && "bg-orange-500",
                          shipment.status === 'exception' && "bg-red-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {shipment.shipment_number}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {shipment.delivery_address.city}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {shipment.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Estado de Conexión</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">WebSocket</span>
                      <Badge variant={isConnected ? "default" : "secondary"}>
                        {connectionState}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Última actualización</span>
                      <span className="text-xs text-muted-foreground">
                        {lastTrackingUpdate 
                          ? new Date(lastTrackingUpdate.timestamp).toLocaleTimeString()
                          : 'Sin datos'
                        }
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Alertas activas</span>
                      <span className="text-sm font-medium">
                        {alerts.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tab: Tracking */}
            <TabsContent value="tracking">
              {selectedShipment ? (
                <TrackingTimeline
                  shipmentId={selectedShipment.id}
                  realTime={isConnected}
                  compact={true}
                />
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Selecciona un envío en el mapa para ver su tracking
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Tab: Alertas */}
            <TabsContent value="alerts">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Alertas Activas</CardTitle>
                    {alerts.length > 0 && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearAlerts}
                      >
                        Limpiar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {alerts.slice(0, 10).map((alert, index) => (
                      <div 
                        key={index}
                        className="flex items-start gap-3 p-3 border rounded-lg"
                      >
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-2",
                          alert.severity === 'critical' && "bg-red-500",
                          alert.severity === 'high' && "bg-orange-500",
                          alert.severity === 'medium' && "bg-yellow-500",
                          alert.severity === 'low' && "bg-blue-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {alert.type}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {alert.message}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {alerts.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <p className="text-muted-foreground">
                          No hay alertas activas
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Panel de geofences (opcional) */}
      {activeTab === 'geofences' && (
        <GeofenceManager />
      )}
    </div>
  );
}

// =====================================================
// COMPONENTE SKELETON
// =====================================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-96 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
