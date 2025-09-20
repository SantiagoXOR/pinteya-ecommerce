// =====================================================
// COMPONENTE: PANEL DE OPTIMIZACIÓN DE RUTAS
// Descripción: Gestión completa de rutas optimizadas
// Funcionalidades: Creación automática, asignación de drivers
// =====================================================

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Navigation, 
  Truck, 
  User, 
  Clock, 
  MapPin, 
  Package, 
  TrendingUp,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { useRouteOptimization } from '@/hooks/admin/useRouteOptimization';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';

// =====================================================
// INTERFACES
// =====================================================

interface RouteOptimizationPanelProps {
  shipments: any[];
  onRouteSelect?: (route: any) => void;
}

interface OptimizationSettings {
  max_shipments_per_route: number;
  max_distance_per_route: number;
  max_time_per_route: number;
  priority_weight: number;
  distance_weight: number;
  time_weight: number;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function RouteOptimizationPanel({ shipments, onRouteSelect }: RouteOptimizationPanelProps) {
  const {
    routes,
    drivers,
    routeStats,
    optimizationParams,
    isOptimizing,
    isLoadingRoutes,
    isLoadingDrivers,
    optimizeRoutes,
    setOptimizationParams,
    createRoute,
    assignDriver,
    isCreatingRoute,
    isAssigningDriver
  } = useRouteOptimization();

  // Estados locales
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRoute, setSelectedRoute] = useState<any>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [localSettings, setLocalSettings] = useState<OptimizationSettings>({
    max_shipments_per_route: optimizationParams.max_shipments_per_route || 15,
    max_distance_per_route: optimizationParams.max_distance_per_route || 50,
    max_time_per_route: optimizationParams.max_time_per_route || 480,
    priority_weight: optimizationParams.priority_weight || 0.3,
    distance_weight: optimizationParams.distance_weight || 0.4,
    time_weight: optimizationParams.time_weight || 0.3
  });

  // Filtrar rutas
  const filteredRoutes = useMemo(() => {
    return routes.filter(route => {
      const matchesSearch = searchTerm === '' || 
        route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.driver?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || route.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [routes, searchTerm, statusFilter]);

  // Drivers disponibles
  const availableDrivers = useMemo(() => {
    return drivers.filter(driver => driver.status === 'available');
  }, [drivers]);

  // Manejar optimización
  const handleOptimizeRoutes = async () => {
    try {
      const optimizedRoutes = await optimizeRoutes(shipments);
      
      // Crear rutas en la base de datos
      for (const route of optimizedRoutes) {
        await createRoute(route);
      }
    } catch (error) {
      console.error('Error al optimizar rutas:', error);
    }
  };

  // Manejar asignación de driver
  const handleAssignDriver = async (routeId: string, driverId: string) => {
    try {
      await assignDriver({ routeId, driverId });
    } catch (error) {
      console.error('Error al asignar driver:', error);
    }
  };

  // Aplicar configuración
  const handleApplySettings = () => {
    setOptimizationParams(localSettings);
    setShowSettings(false);
  };

  // Obtener color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned': return Clock;
      case 'active': return Play;
      case 'completed': return CheckCircle;
      default: return AlertTriangle;
    }
  };

  if (isLoadingRoutes) {
    return <LoadingSkeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Total Rutas</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{routeStats.totalRoutes}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Activas</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{routeStats.activeRoutes}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Envíos</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{routeStats.totalShipments}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">Score Promedio</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{routeStats.avgOptimizationScore}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Controles superiores */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar rutas o drivers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="planned">Planificadas</SelectItem>
              <SelectItem value="active">Activas</SelectItem>
              <SelectItem value="completed">Completadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Configuración
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configuración de Optimización</DialogTitle>
                <DialogDescription>
                  Ajusta los parámetros para la optimización de rutas
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Máx. envíos por ruta</label>
                  <Input
                    type="number"
                    value={localSettings.max_shipments_per_route}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      max_shipments_per_route: parseInt(e.target.value) || 15
                    }))}
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Máx. distancia (km)</label>
                  <Input
                    type="number"
                    value={localSettings.max_distance_per_route}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      max_distance_per_route: parseInt(e.target.value) || 50
                    }))}
                    min="10"
                    max="200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Máx. tiempo (min)</label>
                  <Input
                    type="number"
                    value={localSettings.max_time_per_route}
                    onChange={(e) => setLocalSettings(prev => ({
                      ...prev,
                      max_time_per_route: parseInt(e.target.value) || 480
                    }))}
                    min="60"
                    max="720"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleApplySettings} className="flex-1">
                    Aplicar
                  </Button>
                  <Button variant="outline" onClick={() => setShowSettings(false)} className="flex-1">
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button
            onClick={handleOptimizeRoutes}
            disabled={isOptimizing || isCreatingRoute}
            className="flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            {isOptimizing ? 'Optimizando...' : 'Optimizar Rutas'}
          </Button>
        </div>
      </div>

      {/* Lista de rutas */}
      <div className="space-y-4">
        {filteredRoutes.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <Navigation className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold">No hay rutas disponibles</h3>
                  <p className="text-gray-600 mt-2">
                    Haz clic en "Optimizar Rutas" para generar rutas automáticas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredRoutes.map((route) => {
            const StatusIcon = getStatusIcon(route.status);
            
            return (
              <Card key={route.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <StatusIcon className="w-5 h-5" />
                      <div>
                        <CardTitle className="text-lg">{route.name}</CardTitle>
                        <CardDescription>
                          {route.shipments?.length || 0} envíos • {route.total_distance} km • {route.estimated_time} min
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(route.status)}>
                        {route.status === 'planned' ? 'Planificada' :
                         route.status === 'active' ? 'Activa' : 'Completada'}
                      </Badge>
                      <Badge variant="outline">
                        Score: {route.optimization_score}%
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Envíos</p>
                      <p className="font-semibold">{route.shipments?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Distancia</p>
                      <p className="font-semibold">{route.total_distance} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tiempo</p>
                      <p className="font-semibold">{Math.round(route.estimated_time / 60)}h {route.estimated_time % 60}m</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Driver</p>
                      <p className="font-semibold">
                        {route.driver ? route.driver.name : 'Sin asignar'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Asignación de driver */}
                  {!route.driver && route.status === 'planned' && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Select
                        onValueChange={(driverId) => handleAssignDriver(route.id, driverId)}
                        disabled={isAssigningDriver}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Asignar driver..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableDrivers.map((driver) => (
                            <SelectItem key={driver.id} value={driver.id}>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                <span>{driver.name}</span>
                                <span className="text-sm text-gray-500">
                                  ({driver.vehicle_type} - {driver.license_plate})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Driver asignado */}
                  {route.driver && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <User className="w-4 h-4 text-green-600" />
                      <span className="text-sm">
                        <strong>{route.driver.name}</strong> - {route.driver.vehicle_type} ({route.driver.license_plate})
                      </span>
                      <Badge variant="outline" className="ml-auto">
                        {route.driver.status}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default RouteOptimizationPanel;









