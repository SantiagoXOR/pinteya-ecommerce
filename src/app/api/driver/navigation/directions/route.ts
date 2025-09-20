// Configuración para Node.js Runtime
export const runtime = 'nodejs';

/**
 * API para obtener direcciones de navegación usando Google Maps Directions API
 * POST /api/driver/navigation/directions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';

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

    const body = await request.json();
    const { origin, destination, waypoints = [], travelMode = 'DRIVING' } = body;

    // Validar parámetros
    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origen y destino son requeridos' },
        { status: 400 }
      );
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      return NextResponse.json(
        { error: 'Google Maps API key no configurada' },
        { status: 500 }
      );
    }

    // Construir URL para Google Directions API
    const baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';
    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      mode: travelMode.toLowerCase(),
      key: process.env.GOOGLE_MAPS_API_KEY,
      language: 'es',
      region: 'AR',
      units: 'metric',
      alternatives: 'false',
      avoid: 'tolls'
    });

    // Agregar waypoints si existen
    if (waypoints.length > 0) {
      const waypointsStr = waypoints
        .map((wp: any) => `${wp.lat},${wp.lng}`)
        .join('|');
      params.append('waypoints', `optimize:true|${waypointsStr}`);
    }

    // Hacer petición a Google Directions API
    const response = await fetch(`${baseUrl}?${params}`);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Google Directions API error:', data);
      return NextResponse.json(
        { error: `Error de Google Maps: ${data.status}` },
        { status: 400 }
      );
    }

    const route = data.routes[0];
    if (!route) {
      return NextResponse.json(
        { error: 'No se encontró ruta' },
        { status: 404 }
      );
    }

    // Procesar instrucciones de navegación
    const instructions = [];
    let totalDistance = 0;
    let totalDuration = 0;

    for (const leg of route.legs) {
      totalDistance += leg.distance.value;
      totalDuration += leg.duration.value;

      for (const step of leg.steps) {
        instructions.push({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''), // Remover HTML
          distance: step.distance.text,
          duration: step.duration.text,
          maneuver: step.maneuver || 'straight',
          coordinates: {
            lat: step.start_location.lat,
            lng: step.start_location.lng
          },
          end_coordinates: {
            lat: step.end_location.lat,
            lng: step.end_location.lng
          }
        });
      }
    }

    // Respuesta estructurada
    const navigationData = {
      route: {
        overview_polyline: route.overview_polyline.points,
        bounds: route.bounds,
        legs: route.legs.map(leg => ({
          distance: leg.distance,
          duration: leg.duration,
          start_address: leg.start_address,
          end_address: leg.end_address,
          start_location: leg.start_location,
          end_location: leg.end_location
        }))
      },
      instructions,
      summary: {
        total_distance: {
          value: totalDistance,
          text: `${(totalDistance / 1000).toFixed(1)} km`
        },
        total_duration: {
          value: totalDuration,
          text: formatDuration(totalDuration)
        },
        waypoints_order: route.waypoint_order || []
      },
      metadata: {
        generated_at: new Date().toISOString(),
        travel_mode: travelMode,
        language: 'es',
        region: 'AR'
      }
    };

    return NextResponse.json(navigationData);

  } catch (error) {
    console.error('Error in navigation directions API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Formatear duración en segundos a formato legible
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener parámetros de la URL
    const { searchParams } = new URL(request.url);
    const origin = searchParams.get('origin');
    const destination = searchParams.get('destination');

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Parámetros origin y destination requeridos' },
        { status: 400 }
      );
    }

    // Redirigir a POST con los parámetros
    const [originLat, originLng] = origin.split(',').map(Number);
    const [destLat, destLng] = destination.split(',').map(Number);

    const body = {
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destLat, lng: destLng }
    };

    // Simular POST request
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(body)
    });

    return await POST(postRequest);

  } catch (error) {
    console.error('Error in navigation directions GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}










