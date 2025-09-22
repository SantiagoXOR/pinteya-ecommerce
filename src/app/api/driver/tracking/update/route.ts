// Configuración para Node.js Runtime
export const runtime = 'nodejs';

/**
 * API para actualizar el tracking en tiempo real de drivers
 * Maneja ubicaciones, progreso de entregas y notificaciones a clientes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/integrations/supabase/server';
import { auth } from '@/lib/auth';

interface TrackingUpdateRequest {
  driverId: string;
  orderId: string;
  currentLocation: { lat: number; lng: number };
  timestamp: Date;
  speed: number;
  heading: number;
  accuracy: number;
  status: 'en_route' | 'arrived' | 'delayed' | 'offline';
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const body: TrackingUpdateRequest = await request.json();
    
    // Validar datos requeridos
    if (!body.driverId || !body.orderId || !body.currentLocation) {
      return NextResponse.json(
        { error: 'Datos de tracking incompletos' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar que el usuario es el driver autorizado
    const { data: driverData, error: driverError } = await supabase
      .from('drivers')
      .select('id, user_id')
      .eq('id', body.driverId)
      .eq('user_id', userId)
      .single();

    if (driverError || !driverData) {
      return NextResponse.json(
        { error: 'Driver no encontrado o no autorizado' },
        { status: 403 }
      );
    }

    // Verificar que la orden existe y está asignada al driver
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, status, customer_id, delivery_address')
      .eq('id', body.orderId)
      .eq('driver_id', body.driverId)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json(
        { error: 'Orden no encontrada o no asignada al driver' },
        { status: 404 }
      );
    }

    // Insertar/actualizar ubicación del driver
    const { error: locationError } = await supabase
      .from('driver_locations')
      .upsert({
        driver_id: body.driverId,
        order_id: body.orderId,
        latitude: body.currentLocation.lat,
        longitude: body.currentLocation.lng,
        speed: body.speed,
        heading: body.heading,
        accuracy: body.accuracy,
        status: body.status,
        timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'driver_id,order_id'
      });

    if (locationError) {
      console.error('Error updating driver location:', locationError);
      return NextResponse.json(
        { error: 'Error actualizando ubicación' },
        { status: 500 }
      );
    }

    // Insertar historial de tracking
    const { error: historyError } = await supabase
      .from('tracking_history')
      .insert({
        driver_id: body.driverId,
        order_id: body.orderId,
        latitude: body.currentLocation.lat,
        longitude: body.currentLocation.lng,
        speed: body.speed,
        heading: body.heading,
        accuracy: body.accuracy,
        status: body.status,
        timestamp: new Date().toISOString()
      });

    if (historyError) {
      console.error('Error inserting tracking history:', historyError);
      // No retornar error, el historial es opcional
    }

    // Calcular ETA estimado basado en distancia y velocidad
    let estimatedArrival = null;
    if (body.speed > 0) {
      // Aquí podrías integrar con Google Maps Distance Matrix API
      // Por ahora, usamos una estimación simple
      const averageSpeed = Math.max(body.speed, 30); // km/h mínimo
      const estimatedMinutes = 15; // Estimación base
      estimatedArrival = new Date(Date.now() + estimatedMinutes * 60 * 1000);
    }

    // Actualizar ETA en la orden si es necesario
    if (estimatedArrival && body.status === 'en_route') {
      await supabase
        .from('orders')
        .update({
          estimated_delivery_time: estimatedArrival.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', body.orderId);
    }

    // Enviar notificación al cliente si hay cambios significativos
    if (body.status === 'arrived' || body.status === 'delayed') {
      await sendCustomerNotification(
        orderData.customer_id,
        body.orderId,
        body.status,
        estimatedArrival
      );
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      message: 'Tracking actualizado correctamente',
      data: {
        driverId: body.driverId,
        orderId: body.orderId,
        status: body.status,
        timestamp: new Date().toISOString(),
        estimatedArrival: estimatedArrival?.toISOString()
      }
    });

  } catch (error) {
    console.error('Error in tracking update:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Función auxiliar para enviar notificaciones a clientes
async function sendCustomerNotification(
  customerId: string,
  orderId: string,
  status: string,
  estimatedArrival: Date | null
) {
  try {
    const supabase = await createClient();

    // Obtener información del cliente
    const { data: customerData } = await supabase
      .from('user_profiles')
      .select('email, phone')
      .eq('user_id', customerId)
      .single();

    if (!customerData) return;

    let message = '';
    switch (status) {
      case 'arrived':
        message = `¡Tu pedido #${orderId} ha llegado! El driver está en tu ubicación.`;
        break;
      case 'delayed':
        message = `Tu pedido #${orderId} se ha retrasado. ${estimatedArrival ? `Nueva hora estimada: ${estimatedArrival.toLocaleTimeString('es-ES')}` : 'Te notificaremos cuando esté cerca.'}`;
        break;
      default:
        return;
    }

    // Insertar notificación en la base de datos
    await supabase
      .from('notifications')
      .insert({
        user_id: customerId,
        title: 'Actualización de entrega',
        message,
        type: 'delivery_update',
        data: {
          orderId,
          status,
          estimatedArrival: estimatedArrival?.toISOString()
        },
        created_at: new Date().toISOString()
      });

    // Aquí podrías integrar con servicios de email/SMS
    // Por ejemplo: SendGrid, Twilio, etc.

  } catch (error) {
    console.error('Error sending customer notification:', error);
  }
}

// Endpoint para obtener ubicación actual del driver
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const driverId = url.searchParams.get('driverId');
    const orderId = url.searchParams.get('orderId');

    if (!driverId || !orderId) {
      return NextResponse.json(
        { error: 'Driver ID y Order ID requeridos' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener ubicación actual del driver
    const { data: locationData, error } = await supabase
      .from('driver_locations')
      .select('*')
      .eq('driver_id', driverId)
      .eq('order_id', orderId)
      .single();

    if (error || !locationData) {
      return NextResponse.json(
        { error: 'Ubicación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        driverId: locationData.driver_id,
        orderId: locationData.order_id,
        currentLocation: {
          lat: locationData.latitude,
          lng: locationData.longitude
        },
        speed: locationData.speed,
        heading: locationData.heading,
        accuracy: locationData.accuracy,
        status: locationData.status,
        timestamp: locationData.timestamp,
        lastUpdate: locationData.updated_at
      }
    });

  } catch (error) {
    console.error('Error getting driver location:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}










