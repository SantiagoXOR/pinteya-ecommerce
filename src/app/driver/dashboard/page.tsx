/**
 * Dashboard principal para drivers
 * Interfaz mobile-first con información de rutas, estado y acciones rápidas
 */

'use client';

import React, { useEffect, useState } from 'react';
import { LoadScript } from '@react-google-maps/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Navigation,
  MapPin,
  Clock,
  Package,
  CheckCircle,
  AlertCircle,
  Truck,
  Route,
  Play,
  Pause,
  MoreVertical,
  List,
  Map
} from 'lucide-react';
import { useDriver } from '@/contexts/DriverContext';
import { cn } from '@/lib/core/utils';
import Link from 'next/link';
import PendingOrdersList from '@/components/driver/PendingOrdersList';
import LiveNavigationMap from '@/components/driver/LiveNavigationMap';

interface PendingOrder {
  id: number;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  estimatedDelivery?: string;
  shippingAddress: {
    streetName: string;
    streetNumber: string;
    floor?: string;
    apartment?: string;
    cityName: string;
    stateName: string;
    zipCode: string;
    fullAddress: string;
  };
  items: Array<{
    id: number;
    productName: string;
    quantity: number;
    price: number;
    weight: number;
  }>;
  totalItems: number;
  totalWeight: number;
  notes?: string;
}

interface DeliveryStop {
  orderId: number;
  orderNumber: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  sequence: number;
  status: 'pending' | 'current' | 'completed';
  estimatedArrival?: string;
  total: number;
  items: number;
  notes?: string;
}

export default function DriverDashboardPage() {
  const { state, goOnline, goOffline, startRoute } = useDriver();
  const [activeTab, setActiveTab] = useState('orders');
  const [routeStops, setRouteStops] = useState<DeliveryStop[]>([]);
  const [isNavigating, setIsNavigating] = useState(false);

  // Estadísticas del día
  const todayStats = {
    completedDeliveries: 0,
    totalDistance: 0,
    activeTime: '0h 0m',
    efficiency: 0
  };

  // Ruta activa actual
  const activeRoute = state.currentRoute;

  // Próximas rutas asignadas
  const upcomingRoutes = state.assignedRoutes.filter(route =>
    route.status === 'planned'
  );

  // Función para geocodificar direcciones
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!window.google || !window.google.maps) {
        console.warn('Google Maps not loaded, using default coordinates');
        // Coordenadas por defecto para Córdoba
        resolve({ lat: -31.4201, lng: -64.1888 });
        return;
      }

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        {
          address: address + ', Córdoba, Argentina',
          region: 'AR'
        },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const location = results[0].geometry.location;
            resolve({
              lat: location.lat(),
              lng: location.lng()
            });
          } else {
            console.warn('Geocoding failed for address:', address, 'Status:', status);
            // Coordenadas por defecto para Córdoba con pequeña variación
            resolve({
              lat: -31.4201 + (Math.random() - 0.5) * 0.01,
              lng: -64.1888 + (Math.random() - 0.5) * 0.01
            });
          }
        }
      );
    });
  };

  const handleStartRoute = async (orders: PendingOrder[]) => {
    try {
      console.log('🚀 Starting route with orders:', orders);

      // Geocodificar todas las direcciones
      const stopsWithCoordinates: DeliveryStop[] = [];

      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        console.log(`📍 Geocoding address: ${order.shippingAddress.fullAddress}`);

        const coordinates = await geocodeAddress(order.shippingAddress.fullAddress);

        const stop: DeliveryStop = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          address: order.shippingAddress.fullAddress,
          coordinates: coordinates,
          sequence: i + 1,
          status: i === 0 ? 'current' : 'pending',
          total: order.total,
          items: order.totalItems,
          notes: order.notes
        };

        stopsWithCoordinates.push(stop);
        console.log(`✅ Stop ${i + 1} geocoded:`, stop);
      }

      console.log('🗺️ All stops geocoded:', stopsWithCoordinates);
      setRouteStops(stopsWithCoordinates);
      setIsNavigating(true);
      setActiveTab('navigation');

      // Actualizar contexto del driver
      startRoute(`route-${Date.now()}`);

    } catch (error) {
      console.error('Error starting route:', error);
    }
  };

  const handleCompleteDelivery = (orderId: number) => {
    setRouteStops(prev => prev.map(stop =>
      stop.orderId === orderId
        ? { ...stop, status: 'completed' as const }
        : stop
    ));

    // Actualizar el siguiente stop como current
    const currentIndex = routeStops.findIndex(stop => stop.orderId === orderId);
    if (currentIndex < routeStops.length - 1) {
      setRouteStops(prev => prev.map((stop, index) =>
        index === currentIndex + 1
          ? { ...stop, status: 'current' as const }
          : stop
      ));
    }
  };

  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
      libraries={['places', 'geometry']}
      loadingElement={<div>Cargando Google Maps...</div>}
    >
      <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Estado y controles principales */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Estado del Driver</CardTitle>
              <CardDescription>
                {state.driver?.vehicle_type} - {state.driver?.license_plate}
              </CardDescription>
            </div>
            <div className={cn(
              "w-3 h-3 rounded-full",
              state.isOnline ? "bg-green-500" : "bg-gray-400"
            )} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Control de estado online/offline */}
          <div className="flex space-x-2">
            <Button
              onClick={goOnline}
              disabled={state.isOnline}
              className="flex-1"
              variant={state.isOnline ? "secondary" : "default"}
            >
              <Play className="mr-2 h-4 w-4" />
              {state.isOnline ? 'En Línea' : 'Conectarse'}
            </Button>
            <Button
              onClick={goOffline}
              disabled={!state.isOnline}
              variant="outline"
              className="flex-1"
            >
              <Pause className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
          </div>

          {/* Ubicación actual */}
          {state.currentLocation && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>
                Ubicación: {state.currentLocation.lat.toFixed(4)}, {state.currentLocation.lng.toFixed(4)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs para órdenes y navegación */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            Órdenes del Día
          </TabsTrigger>
          <TabsTrigger value="navigation" className="flex items-center gap-2" disabled={!isNavigating}>
            <Map className="h-4 w-4" />
            Navegación GPS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-6">
          <PendingOrdersList
            onStartRoute={handleStartRoute}
            onSelectOrder={(order) => console.log('Selected order:', order)}
          />
        </TabsContent>

        <TabsContent value="navigation" className="mt-6">
          {isNavigating && routeStops.length > 0 ? (
            <LiveNavigationMap
              stops={routeStops}
              onCompleteDelivery={handleCompleteDelivery}
              onNavigationUpdate={(location) => {
                // Actualizar ubicación en el contexto
                console.log('📍 GPS Navigation update:', location);
              }}
            />
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Navigation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay navegación activa</h3>
                <p className="text-gray-600 mb-4">Selecciona órdenes e inicia un recorrido para usar la navegación GPS</p>
                <Button onClick={() => setActiveTab('orders')}>
                  <List className="h-4 w-4 mr-2" />
                  Ver Órdenes
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Estadísticas del día */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Estadísticas de Hoy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {todayStats.completedDeliveries}
              </div>
              <div className="text-sm text-gray-600">Entregas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {todayStats.totalDistance}km
              </div>
              <div className="text-sm text-gray-600">Distancia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {todayStats.activeTime}
              </div>
              <div className="text-sm text-gray-600">Tiempo Activo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {todayStats.efficiency}%
              </div>
              <div className="text-sm text-gray-600">Eficiencia</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/driver/deliveries">
          <Button variant="outline" className="w-full h-16 flex-col">
            <CheckCircle className="h-5 w-5 mb-1" />
            <span className="text-sm">Entregas</span>
          </Button>
        </Link>
        <Link href="/driver/profile">
          <Button variant="outline" className="w-full h-16 flex-col">
            <Truck className="h-5 w-5 mb-1" />
            <span className="text-sm">Mi Perfil</span>
          </Button>
        </Link>
      </div>
      </div>
    </LoadScript>
  );
}









