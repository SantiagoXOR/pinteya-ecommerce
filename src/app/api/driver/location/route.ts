// Configuración para Node.js Runtime
export const runtime = 'nodejs';

/**
 * API para actualizar la ubicación del driver en tiempo real
 * POST /api/driver/location
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { createClient } from '@/lib/integrations/supabase/server';

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
    const { location, speed, heading, accuracy } = body;

    // Validar datos de ubicación
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return NextResponse.json(
        { error: 'Datos de ubicación inválidos' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener información del driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, status')
      .eq('email', session.user.email)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { error: 'Driver no encontrado' },
        { status: 404 }
      );
    }

    // Preparar datos de ubicación
    const locationData = {
      lat: location.lat,
      lng: location.lng,
      timestamp: new Date().toISOString(),
      speed: speed || 0,
      heading: heading || 0,
      accuracy: accuracy || 0
    };

    // Actualizar ubicación del driver
    const { data: updatedDriver, error: updateError } = await supabase
      .from('drivers')
      .update({
        current_location: locationData,
        updated_at: new Date().toISOString()
      })
      .eq('id', driver.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating driver location:', updateError);
      return NextResponse.json(
        { error: 'Error actualizando ubicación' },
        { status: 500 }
      );
    }

    // Opcional: Guardar historial de ubicaciones para tracking
    try {
      await supabase
        .from('driver_location_history')
        .insert({
          driver_id: driver.id,
          location: locationData,
          created_at: new Date().toISOString()
        });
    } catch (historyError) {
      // No fallar si no se puede guardar el historial
      console.warn('Could not save location history:', historyError);
    }

    // Si el driver está en una ruta activa, verificar proximidad a destinos
    if (driver.status === 'busy') {
      await checkProximityToDestinations(driver.id, location);
    }

    return NextResponse.json({
      success: true,
      location: locationData,
      driver: {
        id: updatedDriver.id,
        status: updatedDriver.status,
        current_location: updatedDriver.current_location
      }
    });

  } catch (error) {
    console.error('Error in driver location API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
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

    const supabase = await createClient();

    // Obtener ubicación actual del driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, current_location, status, updated_at')
      .eq('email', session.user.email)
      .single();

    if (driverError || !driver) {
      return NextResponse.json(
        { error: 'Driver no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      location: driver.current_location,
      status: driver.status,
      last_updated: driver.updated_at
    });

  } catch (error) {
    console.error('Error getting driver location:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Función helper para verificar proximidad a destinos de entrega
 */
async function checkProximityToDestinations(
  driverId: string, 
  currentLocation: { lat: number; lng: number }
) {
  try {
    const supabase = await createClient();

    // Obtener rutas activas del driver
    const { data: activeRoutes, error } = await supabase
      .from('optimized_routes')
      .select('*')
      .eq('driver_id', driverId)
      .eq('status', 'active');

    if (error || !activeRoutes?.length) return;

    // Verificar proximidad a cada destino
    for (const route of activeRoutes) {
      if (!route.shipments) continue;

      for (let i = 0; i < route.shipments.length; i++) {
        const shipment = route.shipments[i];
        
        if (shipment.status === 'delivered') continue;

        const destination = shipment.destination?.coordinates;
        if (!destination) continue;

        const distance = calculateDistance(currentLocation, destination);
        
        // Si está a menos de 100 metros del destino
        if (distance < 100) {
          // Opcional: Enviar notificación o actualizar estado
          console.log(`Driver ${driverId} is near delivery destination: ${shipment.customer_name}`);
          
          // Aquí se podría implementar:
          // - Notificación push al cliente
          // - Actualización automática de estado
          // - Alerta al dashboard administrativo
        }
      }
    }
  } catch (error) {
    console.error('Error checking proximity:', error);
  }
}

/**
 * Calcular distancia entre dos puntos en metros
 */
function calculateDistance(
  point1: { lat: number; lng: number },
  point2: { lat: number; lng: number }
): number {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (point2.lat - point1.lat) * Math.PI / 180;
  const dLon = (point2.lng - point1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}










