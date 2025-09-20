// Configuración para Node.js Runtime
export const runtime = 'nodejs';

/**
 * API para optimizar rutas de entrega usando Google Maps
 * POST /api/driver/optimize-route
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

interface DeliveryStop {
  orderId: number;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  priority?: number;
  estimatedDuration?: number;
}

interface OptimizeRouteRequest {
  stops: DeliveryStop[];
  startLocation?: {
    lat: number;
    lng: number;
  };
  preferences?: {
    optimizeFor: 'time' | 'distance' | 'fuel';
    avoidTolls: boolean;
    avoidHighways: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body: OptimizeRouteRequest = await request.json();
    const { stops, startLocation, preferences } = body;

    if (!stops || stops.length === 0) {
      return NextResponse.json(
        { error: 'Se requieren paradas para optimizar la ruta' },
        { status: 400 }
      );
    }

    // Configuración por defecto para Córdoba, Argentina
    const defaultStart = startLocation || {
      lat: -31.4201,
      lng: -64.1888
    };

    // Si no tenemos Google Maps API key, usar algoritmo simple
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn('Google Maps API key not configured, using simple optimization');
      
      // Algoritmo simple: ordenar por prioridad y luego por orden de creación
      const optimizedStops = [...stops].sort((a, b) => {
        if (a.priority !== b.priority) {
          return (a.priority || 0) - (b.priority || 0);
        }
        return a.orderId - b.orderId;
      });

      return NextResponse.json({
        success: true,
        data: {
          optimizedRoute: optimizedStops.map((stop, index) => ({
            ...stop,
            sequence: index + 1,
            estimatedArrival: new Date(Date.now() + (index + 1) * 30 * 60 * 1000).toISOString(),
            estimatedDuration: 30,
            distanceFromPrevious: 5.0,
            durationFromPrevious: 15
          })),
          summary: {
            totalDistance: stops.length * 5.0,
            totalDuration: stops.length * 30,
            totalStops: stops.length,
            estimatedStartTime: new Date().toISOString(),
            estimatedEndTime: new Date(Date.now() + stops.length * 30 * 60 * 1000).toISOString(),
            optimizationMethod: 'simple'
          },
          startLocation: defaultStart
        }
      });
    }

    // Usar Google Maps Directions API para optimización avanzada
    const waypoints = stops.map(stop => stop.address).join('|');
    const origin = `${defaultStart.lat},${defaultStart.lng}`;
    const destination = stops[stops.length - 1]?.address || origin;

    const directionsUrl = new URL('https://maps.googleapis.com/maps/api/directions/json');
    directionsUrl.searchParams.set('origin', origin);
    directionsUrl.searchParams.set('destination', destination);
    directionsUrl.searchParams.set('waypoints', `optimize:true|${waypoints}`);
    directionsUrl.searchParams.set('key', process.env.GOOGLE_MAPS_API_KEY!);
    directionsUrl.searchParams.set('language', 'es');
    directionsUrl.searchParams.set('region', 'AR');
    
    if (preferences?.avoidTolls) {
      directionsUrl.searchParams.set('avoid', 'tolls');
    }
    if (preferences?.avoidHighways) {
      directionsUrl.searchParams.set('avoid', 'highways');
    }

    const response = await fetch(directionsUrl.toString());
    const directionsData = await response.json();

    if (directionsData.status !== 'OK') {
      console.warn('Google Directions API error:', directionsData);
      console.warn('Falling back to simple optimization algorithm');

      // Fallback al algoritmo simple si Google Maps falla
      const optimizedStops = [...stops].sort((a, b) => {
        if (a.priority !== b.priority) {
          return (a.priority || 0) - (b.priority || 0);
        }
        return a.orderId - b.orderId;
      });

      return NextResponse.json({
        success: true,
        data: {
          optimizedRoute: optimizedStops.map((stop, index) => ({
            ...stop,
            sequence: index + 1,
            estimatedArrival: new Date(Date.now() + (index + 1) * 30 * 60 * 1000).toISOString(),
            estimatedDuration: 30,
            distanceFromPrevious: 5.0,
            durationFromPrevious: 15
          })),
          summary: {
            totalDistance: stops.length * 5.0,
            totalDuration: stops.length * 30,
            totalStops: stops.length,
            estimatedStartTime: new Date().toISOString(),
            estimatedEndTime: new Date(Date.now() + stops.length * 30 * 60 * 1000).toISOString(),
            optimizationMethod: 'simple_fallback'
          },
          startLocation: defaultStart
        }
      });
    }

    // Procesar respuesta de Google Maps
    const route = directionsData.routes[0];
    const waypointOrder = directionsData.routes[0]?.waypoint_order || [];
    
    // Reordenar paradas según la optimización de Google
    const optimizedStops = waypointOrder.map((index: number, sequence: number) => {
      const stop = stops[index];
      const leg = route.legs[sequence];
      
      return {
        ...stop,
        sequence: sequence + 1,
        estimatedArrival: new Date(Date.now() + leg.duration.value * 1000).toISOString(),
        estimatedDuration: Math.ceil(leg.duration.value / 60),
        distanceFromPrevious: leg.distance.value / 1000,
        durationFromPrevious: Math.ceil(leg.duration.value / 60),
        coordinates: {
          lat: leg.end_location.lat,
          lng: leg.end_location.lng
        }
      };
    });

    // Calcular resumen de la ruta
    const totalDistance = route.legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0) / 1000;
    const totalDuration = route.legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0) / 60;

    return NextResponse.json({
      success: true,
      data: {
        optimizedRoute: optimizedStops,
        summary: {
          totalDistance: Math.round(totalDistance * 100) / 100,
          totalDuration: Math.ceil(totalDuration),
          totalStops: stops.length,
          estimatedStartTime: new Date().toISOString(),
          estimatedEndTime: new Date(Date.now() + totalDuration * 60 * 1000).toISOString(),
          optimizationMethod: 'google_maps',
          polyline: route.overview_polyline?.points
        },
        startLocation: defaultStart,
        googleMapsData: {
          route,
          waypointOrder
        }
      }
    });

  } catch (error) {
    console.error('Error in optimize-route API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}










