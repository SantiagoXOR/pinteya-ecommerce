/**
 * Página de rutas asignadas para drivers
 * Lista todas las rutas disponibles y permite iniciar navegación
 */

'use client';


// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Package,
  Play,
  CheckCircle,
  AlertCircle,
  Route,
  Calendar
} from 'lucide-react';
import { useDriver } from '@/contexts/DriverContext';
import { cn } from '@/lib/core/utils';
import Link from 'next/link';

export default function DriverRoutesPage() {
  const { state, startRoute } = useDriver();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planned': return 'Planificada';
      case 'active': return 'Activa';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  const filteredRoutes = state.assignedRoutes.filter(route => {
    const routeDate = new Date(route.created_at || '').toISOString().split('T')[0];
    return routeDate === selectedDate;
  });

  const activeRoute = state.currentRoute;
  const plannedRoutes = filteredRoutes.filter(route => route.status === 'planned');
  const completedRoutes = filteredRoutes.filter(route => route.status === 'completed');

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      {/* Header con selector de fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Mis Rutas
          </CardTitle>
          <CardDescription>
            Gestiona tus rutas asignadas y navegación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas del día */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {plannedRoutes.length}
            </div>
            <div className="text-xs text-gray-600">Planificadas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {activeRoute ? 1 : 0}
            </div>
            <div className="text-xs text-gray-600">Activa</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {completedRoutes.length}
            </div>
            <div className="text-xs text-gray-600">Completadas</div>
          </CardContent>
        </Card>
      </div>

      {/* Ruta activa */}
      {activeRoute && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-green-900">
                Ruta Activa
              </CardTitle>
              <Badge className="bg-green-600">En Progreso</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-green-900">{activeRoute.name}</h3>
              <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <span>{activeRoute.shipments.length} entregas</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Route className="h-4 w-4 text-green-600" />
                  <span>{activeRoute.total_distance} km</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span>{Math.round(activeRoute.estimated_time / 60)}h {activeRoute.estimated_time % 60}m</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>{activeRoute.optimization_score}% eficiencia</span>
                </div>
              </div>
            </div>

            <Link href={`/driver/route/${activeRoute.id}`}>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Navigation className="mr-2 h-4 w-4" />
                Continuar Navegación
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Rutas planificadas */}
      {plannedRoutes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Rutas Planificadas ({plannedRoutes.length})
          </h2>
          
          {plannedRoutes.map((route) => (
            <Card key={route.id} className="border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{route.name}</h3>
                    <Badge className={getStatusColor(route.status)}>
                      {getStatusText(route.status)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => startRoute(route.id)}
                    disabled={!state.isOnline || !!activeRoute}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Iniciar
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>{route.shipments.length} entregas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Route className="h-4 w-4" />
                    <span>{route.total_distance} km</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{Math.round(route.estimated_time / 60)}h {route.estimated_time % 60}m</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{route.optimization_score}% eficiencia</span>
                  </div>
                </div>

                {/* Vista previa de entregas */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Primeras entregas:</p>
                  <div className="space-y-1">
                    {route.shipments.slice(0, 2).map((shipment, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="truncate">
                          {shipment.customer_name} - {shipment.destination?.address}
                        </span>
                      </div>
                    ))}
                    {route.shipments.length > 2 && (
                      <p className="text-xs text-gray-400">
                        +{route.shipments.length - 2} entregas más
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rutas completadas */}
      {completedRoutes.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Rutas Completadas ({completedRoutes.length})
          </h2>
          
          {completedRoutes.map((route) => (
            <Card key={route.id} className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-700">{route.name}</h3>
                    <Badge className={getStatusColor(route.status)}>
                      {getStatusText(route.status)}
                    </Badge>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Package className="h-4 w-4" />
                    <span>{route.shipments.length} entregas</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Route className="h-4 w-4" />
                    <span>{route.total_distance} km</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{Math.round(route.estimated_time / 60)}h {route.estimated_time % 60}m</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>{route.optimization_score}% eficiencia</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estado sin rutas */}
      {filteredRoutes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">
              No hay rutas para esta fecha
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Selecciona otra fecha o mantente en línea para recibir nuevas asignaciones
            </p>
            {!state.isOnline && (
              <Button onClick={() => state.goOnline()}>
                <Play className="mr-2 h-4 w-4" />
                Conectarse
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}









