/**
 * Vista de navegación GPS en tiempo real para drivers
 * Interfaz principal para navegación turn-by-turn y gestión de entregas
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  MapPin, 
  CheckCircle, 
  Clock, 
  Package,
  Phone,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Pause,
  Play
} from 'lucide-react';
import { useDriver } from '@/contexts/DriverContext';
import { GPSNavigationMap } from '@/components/driver/GPSNavigationMap';
import { DeliveryCard } from '@/components/driver/DeliveryCard';
import { NavigationInstructions } from '@/components/driver/NavigationInstructions';
import { cn } from '@/lib/utils';

export default function DriverRoutePage() {
  const params = useParams();
  const routeId = params.id as string;
  const { state, completeDelivery, updateDriverLocation } = useDriver();
  
  const [currentDeliveryIndex, setCurrentDeliveryIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeData, setRouteData] = useState<any>(null);
  const [navigationInstructions, setNavigationInstructions] = useState<any[]>([]);

  // Cargar datos de la ruta
  useEffect(() => {
    loadRouteData();
  }, [routeId]);

  const loadRouteData = async () => {
    try {
      const response = await fetch(`/api/driver/routes/${routeId}`);
      const data = await response.json();
      setRouteData(data);
    } catch (error) {
      console.error('Error loading route data:', error);
    }
  };

  const currentDelivery = routeData?.shipments?.[currentDeliveryIndex];
  const remainingDeliveries = routeData?.shipments?.slice(currentDeliveryIndex + 1) || [];

  const handleStartNavigation = () => {
    setIsNavigating(true);
    // Iniciar navegación GPS hacia la próxima entrega
    if (currentDelivery) {
      calculateRoute(currentDelivery.destination);
    }
  };

  const handleCompleteDelivery = () => {
    if (currentDelivery && routeData?.shipments) {
      completeDelivery(currentDelivery.id);

      // Avanzar a la siguiente entrega
      if (currentDeliveryIndex < routeData.shipments.length - 1) {
        setCurrentDeliveryIndex(prev => prev + 1);
      } else {
        // Ruta completada
        setIsNavigating(false);
        // Redirigir al dashboard o mostrar resumen
      }
    }
  };

  const calculateRoute = async (destination: any) => {
    if (!state.currentLocation) return;

    try {
      const response = await fetch('/api/driver/navigation/directions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: state.currentLocation,
          destination: destination.coordinates,
          waypoints: []
        })
      });

      const data = await response.json();
      setNavigationInstructions(data.instructions || []);
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  };

  if (!routeData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando ruta...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header con información de la ruta */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-semibold text-lg">{routeData.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{routeData.shipments?.length || 0} entregas</span>
              <span>{routeData.total_distance || 0} km</span>
              <span>{Math.round((routeData.estimated_time || 0) / 60)}h</span>
            </div>
          </div>
          <Badge variant={isNavigating ? "default" : "secondary"}>
            {isNavigating ? 'Navegando' : 'Pausado'}
          </Badge>
        </div>
      </div>

      {/* Mapa de navegación */}
      <div className="flex-1 relative">
        <GPSNavigationMap
          currentLocation={state.currentLocation}
          destination={currentDelivery?.destination}
          waypoints={routeData.waypoints || []}
          isNavigating={isNavigating}
          onLocationUpdate={updateDriverLocation}
        />

        {/* Instrucciones de navegación flotantes */}
        {isNavigating && navigationInstructions.length > 0 && (
          <div className="absolute top-4 left-4 right-4">
            <NavigationInstructions 
              instructions={navigationInstructions}
              currentLocation={state.currentLocation}
            />
          </div>
        )}
      </div>

      {/* Panel inferior con entrega actual */}
      <div className="bg-white border-t border-gray-200 max-h-80 overflow-y-auto">
        {currentDelivery && (
          <DeliveryCard
            delivery={currentDelivery}
            isActive={true}
            onComplete={handleCompleteDelivery}
            onStartNavigation={handleStartNavigation}
            isNavigating={isNavigating}
          />
        )}

        {/* Próximas entregas */}
        {remainingDeliveries.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <h3 className="font-medium text-gray-900 mb-3">
              Próximas Entregas ({remainingDeliveries.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {remainingDeliveries.slice(0, 3).map((delivery, index) => (
                <div
                  key={delivery.id}
                  className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg"
                >
                  <div className="bg-gray-300 text-gray-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                    {currentDeliveryIndex + index + 2}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {delivery.customer_name}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {delivery.destination.address}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              ))}
              
              {remainingDeliveries.length > 3 && (
                <div className="text-center py-2">
                  <span className="text-sm text-gray-500">
                    +{remainingDeliveries.length - 3} entregas más
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Controles de navegación flotantes */}
      <div className="absolute bottom-4 right-4 space-y-2">
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={isNavigating ? () => setIsNavigating(false) : handleStartNavigation}
          disabled={!currentDelivery}
        >
          {isNavigating ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Navigation className="h-6 w-6" />
          )}
        </Button>

        {/* Botón de recentrar mapa */}
        <Button
          size="lg"
          variant="outline"
          className="rounded-full w-14 h-14 shadow-lg bg-white"
          onClick={() => {
            // Recentrar mapa en ubicación actual
            if (state.currentLocation) {
              // Trigger map recenter
            }
          }}
        >
          <MapPin className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
