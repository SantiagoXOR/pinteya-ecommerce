/**
 * API para obtener el perfil del driver y sus rutas asignadas
 * GET /api/driver/profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createClient } from '@/lib/integrations/supabase/server';

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

    // Obtener información del driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, email, phone, status, rating, total_deliveries, created_at, updated_at')
      .eq('email', session.user.email)
      .single();

    if (driverError || !driver) {
      console.error('Driver not found:', driverError);
      return NextResponse.json(
        { error: 'Driver no encontrado' },
        { status: 404 }
      );
    }

    // Obtener rutas asignadas al driver
    const { data: routes, error: routesError } = await supabase
      .from('optimized_routes')
      .select('*')
      .eq('driver_id', driver.id)
      .in('status', ['planned', 'active'])
      .order('created_at', { ascending: true });

    if (routesError) {
      console.error('Error fetching routes:', routesError);
    }

    // Obtener estadísticas del día
    const today = new Date().toISOString().split('T')[0];
    
    const { data: todayDeliveries, error: deliveriesError } = await supabase
      .from('optimized_routes')
      .select('shipments')
      .eq('driver_id', driver.id)
      .eq('status', 'completed')
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`);

    let completedDeliveries = 0;
    let totalDistance = 0;

    if (todayDeliveries) {
      todayDeliveries.forEach(route => {
        if (route.shipments && Array.isArray(route.shipments)) {
          completedDeliveries += route.shipments.filter(
            (shipment: any) => shipment.status === 'delivered'
          ).length;
        }
      });
    }

    // Calcular distancia total del día
    const { data: todayRoutes, error: todayRoutesError } = await supabase
      .from('optimized_routes')
      .select('total_distance')
      .eq('driver_id', driver.id)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lte('created_at', `${today}T23:59:59.999Z`);

    if (todayRoutes) {
      totalDistance = todayRoutes.reduce(
        (sum, route) => sum + (route.total_distance || 0), 
        0
      );
    }

    const response = {
      driver: {
        id: driver.id,
        name: `${driver.first_name} ${driver.last_name}`,
        first_name: driver.first_name,
        last_name: driver.last_name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status,
        rating: driver.rating,
        total_deliveries: driver.total_deliveries
      },
      routes: routes || [],
      todayStats: {
        completedDeliveries,
        totalDistance: Math.round(totalDistance * 100) / 100,
        activeTime: '0h 0m', // TODO: Implementar tracking de tiempo activo
        efficiency: routes?.length > 0 ? 
          Math.round(routes.reduce((sum, route) => sum + (route.optimization_score || 0), 0) / routes.length) : 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in driver profile API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { status, current_location } = body;

    const supabase = await createClient();

    // Actualizar información del driver
    const { data: driver, error } = await supabase
      .from('drivers')
      .update({
        status: status || undefined,
        current_location: current_location || undefined,
        updated_at: new Date().toISOString()
      })
      .eq('email', session.user.email)
      .select()
      .single();

    if (error) {
      console.error('Error updating driver:', error);
      return NextResponse.json(
        { error: 'Error actualizando driver' },
        { status: 500 }
      );
    }

    return NextResponse.json({ driver });

  } catch (error) {
    console.error('Error in driver profile update API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}









