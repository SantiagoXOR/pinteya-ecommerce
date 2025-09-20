// =====================================================
// COMPONENTE: VISUALIZACIÓN DE RUTAS EN GOOGLE MAPS
// Descripción: Renderizado de rutas optimizadas con Directions API
// Funcionalidades: Múltiples rutas, colores dinámicos, métricas
// =====================================================

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useMap } from '@vis.gl/react-google-maps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Route, 
  MapPin, 
  Clock, 
  Truck, 
  Eye, 
  EyeOff,
  Navigation,
  Zap,
  TrendingUp
} from 'lucide-react';

// =====================================================
// INTERFACES Y TIPOS
// =====================================================

interface Coordinates {
  lat: number;
  lng: number;
}

interface OptimizedRoute {
  id: string;
  name: string;
  shipments: any[];
  total_distance: number;
  estimated_time: number;
  driver?: any;
  status: 'planned' | 'active' | 'completed';
  start_location?: Coordinates;
  waypoints: Coordinates[];
  optimization_score: number;
}

interface RouteVisualizationProps {
  routes: OptimizedRoute[];
  selectedRouteId?: string;
  onRouteSelect?: (routeId: string) => void;
  showAllRoutes?: boolean;
}

interface DirectionsResult {
  routes: google.maps.DirectionsRoute[];
}

// =====================================================
// CONFIGURACIÓN DE COLORES
// =====================================================

const ROUTE_COLORS = [
  '#3B82F6', // Azul
  '#EF4444', // Rojo
  '#10B981', // Verde
  '#F59E0B', // Amarillo
  '#8B5CF6', // Púrpura
  '#06B6D4', // Cian
  '#F97316', // Naranja
  '#84CC16', // Lima
  '#EC4899', // Rosa
  '#6B7280'  // Gris
];

const STATUS_COLORS = {
  planned: '#3B82F6',
  active: '#10B981',
  completed: '#6B7280'
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function RouteVisualization({ 
  routes, 
  selectedRouteId, 
  onRouteSelect,
  showAllRoutes = false 
}: RouteVisualizationProps) {
  const map = useMap();
  const [directionsServices, setDirectionsServices] = useState<google.maps.DirectionsService[]>([]);
  const [directionsRenderers, setDirectionsRenderers] = useState<google.maps.DirectionsRenderer[]>([]);
  const [routeResults, setRouteResults] = useState<Map<string, DirectionsResult>>(new Map());
  const [visibleRoutes, setVisibleRoutes] = useState<Set<string>>(new Set());
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<string>('all');

  // Rutas a mostrar
  const displayRoutes = useMemo(() => {
    if (showAllRoutes) return routes;
    if (selectedRouteId) return routes.filter(r => r.id === selectedRouteId);
    return [];
  }, [routes, selectedRouteId, showAllRoutes]);

  // Inicializar servicios de Google Maps
  useEffect(() => {
    if (!map || !window.google) return;

    const services: google.maps.DirectionsService[] = [];
    const renderers: google.maps.DirectionsRenderer[] = [];

    displayRoutes.forEach((route, index) => {
      const service = new google.maps.DirectionsService();
      const renderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        suppressInfoWindows: false,
        polylineOptions: {
          strokeColor: STATUS_COLORS[route.status] || ROUTE_COLORS[index % ROUTE_COLORS.length],
          strokeWeight: route.status === 'active' ? 6 : 4,
          strokeOpacity: 0.8,
          zIndex: route.status === 'active' ? 1000 : 100
        },
        markerOptions: {
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: STATUS_COLORS[route.status] || ROUTE_COLORS[index % ROUTE_COLORS.length],
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        }
      });

      services.push(service);
      renderers.push(renderer);
    });

    setDirectionsServices(services);
    setDirectionsRenderers(renderers);

    // Cleanup
    return () => {
      renderers.forEach(renderer => renderer.setMap(null));
    };
  }, [map, displayRoutes]);

  // Calcular rutas con Directions API
  const calculateRoutes = useCallback(async () => {
    if (!map || directionsServices.length === 0) return;

    setIsCalculating(true);
    const newResults = new Map<string, DirectionsResult>();

    try {
      for (let i = 0; i < displayRoutes.length; i++) {
        const route = displayRoutes[i];
        const service = directionsServices[i];
        const renderer = directionsRenderers[i];

        if (route.waypoints.length < 2) continue;

        // Configurar request para Directions API
        const origin = route.waypoints[0];
        const destination = route.waypoints[route.waypoints.length - 1];
        const waypoints = route.waypoints.slice(1, -1).map(point => ({
          location: new google.maps.LatLng(point.lat, point.lng),
          stopover: true
        }));

        const request: google.maps.DirectionsRequest = {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          waypoints: waypoints,
          optimizeWaypoints: false, // Ya optimizamos con nuestro algoritmo
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
          avoidHighways: false,
          avoidTolls: false
        };

        try {
          const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
            service.route(request, (result, status) => {
              if (status === google.maps.DirectionsStatus.OK && result) {
                resolve(result);
              } else {
                reject(new Error(`Directions request failed: ${status}`));
              }
            });
          });

          newResults.set(route.id, result);
          
          // Mostrar ruta si está visible
          if (visibleRoutes.has(route.id) || visibleRoutes.size === 0) {
            renderer.setDirections(result);
          }

        } catch (error) {
          console.error(`Error calculando ruta ${route.name}:`, error);
        }
      }

      setRouteResults(newResults);
    } catch (error) {
      console.error('Error calculando rutas:', error);
    } finally {
      setIsCalculating(false);
    }
  }, [map, displayRoutes, directionsServices, directionsRenderers, visibleRoutes]);

  // Calcular rutas cuando cambien los datos
  useEffect(() => {
    if (displayRoutes.length > 0) {
      calculateRoutes();
    }
  }, [calculateRoutes]);

  // Manejar visibilidad de rutas
  const toggleRouteVisibility = useCallback((routeId: string) => {
    const newVisibleRoutes = new Set(visibleRoutes);
    
    if (newVisibleRoutes.has(routeId)) {
      newVisibleRoutes.delete(routeId);
    } else {
      newVisibleRoutes.add(routeId);
    }
    
    setVisibleRoutes(newVisibleRoutes);

    // Actualizar renderers
    displayRoutes.forEach((route, index) => {
      const renderer = directionsRenderers[index];
      const result = routeResults.get(route.id);
      
      if (result && renderer) {
        if (newVisibleRoutes.has(route.id)) {
          renderer.setDirections(result);
        } else {
          renderer.setDirections(null);
        }
      }
    });
  }, [visibleRoutes, displayRoutes, directionsRenderers, routeResults]);

  // Mostrar/ocultar todas las rutas
  const toggleAllRoutes = useCallback(() => {
    if (visibleRoutes.size === displayRoutes.length) {
      // Ocultar todas
      setVisibleRoutes(new Set());
      directionsRenderers.forEach(renderer => renderer.setDirections(null));
    } else {
      // Mostrar todas
      const allRouteIds = new Set(displayRoutes.map(r => r.id));
      setVisibleRoutes(allRouteIds);
      
      displayRoutes.forEach((route, index) => {
        const renderer = directionsRenderers[index];
        const result = routeResults.get(route.id);
        if (result && renderer) {
          renderer.setDirections(result);
        }
      });
    }
  }, [visibleRoutes, displayRoutes, directionsRenderers, routeResults]);

  // Centrar mapa en ruta específica
  const centerOnRoute = useCallback((routeId: string) => {
    const route = displayRoutes.find(r => r.id === routeId);
    const result = routeResults.get(routeId);
    
    if (route && result && map) {
      const bounds = new google.maps.LatLngBounds();
      
      result.routes[0].legs.forEach(leg => {
        bounds.extend(leg.start_location);
        bounds.extend(leg.end_location);
      });
      
      map.fitBounds(bounds);
      onRouteSelect?.(routeId);
    }
  }, [displayRoutes, routeResults, map, onRouteSelect]);

  // Calcular métricas totales
  const totalMetrics = useMemo(() => {
    const visibleRouteData = displayRoutes.filter(r => visibleRoutes.has(r.id) || visibleRoutes.size === 0);
    
    return {
      totalDistance: visibleRouteData.reduce((sum, r) => sum + r.total_distance, 0),
      totalTime: visibleRouteData.reduce((sum, r) => sum + r.estimated_time, 0),
      totalShipments: visibleRouteData.reduce((sum, r) => sum + r.shipments.length, 0),
      avgScore: visibleRouteData.length > 0 
        ? visibleRouteData.reduce((sum, r) => sum + r.optimization_score, 0) / visibleRouteData.length 
        : 0
    };
  }, [displayRoutes, visibleRoutes]);

  if (displayRoutes.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Navigation className="w-12 h-12 text-gray-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">No hay rutas para mostrar</h3>
              <p className="text-gray-600 mt-2">
                Optimiza rutas para ver la visualización en el mapa.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Métricas totales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Distancia Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {totalMetrics.totalDistance.toFixed(1)} km
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Tiempo Total</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(totalMetrics.totalTime / 60)}h {totalMetrics.totalTime % 60}m
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium">Envíos</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {totalMetrics.totalShipments}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium">Score Promedio</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {totalMetrics.avgScore.toFixed(0)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Controles de rutas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Control de Rutas
              {isCalculating && (
                <Badge variant="outline" className="ml-2">
                  Calculando...
                </Badge>
              )}
            </CardTitle>
            <Button
              onClick={toggleAllRoutes}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {visibleRoutes.size === displayRoutes.length ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Ocultar Todas
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Mostrar Todas
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayRoutes.map((route, index) => {
              const isVisible = visibleRoutes.has(route.id) || visibleRoutes.size === 0;
              const color = STATUS_COLORS[route.status] || ROUTE_COLORS[index % ROUTE_COLORS.length];
              
              return (
                <div
                  key={route.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <h4 className="font-medium">{route.name}</h4>
                      <p className="text-sm text-gray-600">
                        {route.shipments.length} envíos • {route.total_distance} km • {Math.round(route.estimated_time / 60)}h
                      </p>
                    </div>
                    <Badge className={`ml-2 ${
                      route.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                      route.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {route.status === 'planned' ? 'Planificada' :
                       route.status === 'active' ? 'Activa' : 'Completada'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => centerOnRoute(route.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Navigation className="w-4 h-4" />
                      Centrar
                    </Button>
                    <Button
                      onClick={() => toggleRouteVisibility(route.id)}
                      variant={isVisible ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      {isVisible ? (
                        <>
                          <Eye className="w-4 h-4" />
                          Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Oculta
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RouteVisualization;









