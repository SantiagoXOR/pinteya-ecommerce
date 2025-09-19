// =====================================================
// API: ASIGNAR DRIVER A RUTA
// Ruta: /api/admin/logistics/routes/[id]/assign-driver
// Descripción: Asignar conductor a una ruta específica
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/integrations/supabase/server';
import { auth } from '@/auth';

// =====================================================
// VALIDACIÓN DE ADMIN
// =====================================================

async function validateAdmin() {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return { error: 'No autenticado', status: 401 };
    }

    const supabase = createAdminClient();

    // Verificar si el usuario es admin
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('email, role_id')
      .eq('email', session.user.email)
      .single();

    if (userError || !userProfile) {
      return { error: 'Usuario no encontrado', status: 404 };
    }

    // Obtener el rol del usuario
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role_name')
      .eq('id', userProfile.role_id)
      .single();

    if (roleError || !roleData || roleData.role_name !== 'admin') {
      return { error: 'Acceso denegado - Se requieren permisos de administrador', status: 403 };
    }

    return { success: true, userId: session.user.id, email: userProfile.email, supabase };
  } catch (error) {
    console.error('Error en validación de admin:', error);
    return { error: 'Error interno del servidor', status: 500 };
  }
}

// =====================================================
// PATCH: ASIGNAR DRIVER A RUTA
// =====================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validation = await validateAdmin();
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const routeId = params.id;
    const body = await request.json();
    const { driver_id } = body;

    if (!routeId) {
      return NextResponse.json(
        { error: 'ID de ruta requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar que la ruta existe
    const { data: route, error: routeError } = await supabase
      .from('optimized_routes')
      .select('id, status, shipments, total_distance, estimated_time')
      .eq('id', routeId)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: 'Ruta no encontrada' },
        { status: 404 }
      );
    }

    // Si se está asignando un driver
    if (driver_id) {
      // Verificar que el driver existe y está disponible
      const { data: driver, error: driverError } = await supabase
        .from('logistics_drivers')
        .select('id, name, status, max_capacity, vehicle_type')
        .eq('id', driver_id)
        .single();

      if (driverError || !driver) {
        return NextResponse.json(
          { error: 'Driver no encontrado' },
          { status: 404 }
        );
      }

      if (driver.status !== 'available') {
        return NextResponse.json(
          { error: 'El driver no está disponible' },
          { status: 400 }
        );
      }

      // Verificar capacidad del vehículo
      const shipmentsCount = Array.isArray(route.shipments) ? route.shipments.length : 0;
      if (shipmentsCount > driver.max_capacity) {
        return NextResponse.json(
          { 
            error: `El vehículo del driver tiene capacidad para ${driver.max_capacity} envíos, pero la ruta tiene ${shipmentsCount}` 
          },
          { status: 400 }
        );
      }

      // Verificar que el driver no tenga otras rutas activas
      const { data: activeRoutes, error: activeRoutesError } = await supabase
        .from('optimized_routes')
        .select('id')
        .eq('driver_id', driver_id)
        .eq('status', 'active');

      if (activeRoutesError) {
        console.error('Error al verificar rutas activas:', activeRoutesError);
        return NextResponse.json(
          { error: 'Error al verificar disponibilidad del driver' },
          { status: 500 }
        );
      }

      if (activeRoutes && activeRoutes.length > 0) {
        return NextResponse.json(
          { error: 'El driver ya tiene rutas activas asignadas' },
          { status: 400 }
        );
      }

      // Asignar driver a la ruta
      const { data: updatedRoute, error: updateError } = await supabase
        .from('optimized_routes')
        .update({
          driver_id: driver_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', routeId)
        .select(`
          *,
          driver:driver_id (
            id,
            name,
            phone,
            vehicle_type,
            license_plate,
            status
          )
        `)
        .single();

      if (updateError) {
        console.error('Error al asignar driver:', updateError);
        return NextResponse.json(
          { error: 'Error al asignar driver' },
          { status: 500 }
        );
      }

      // Actualizar estado del driver a busy si la ruta está activa
      if (route.status === 'active') {
        await supabase
          .from('logistics_drivers')
          .update({ status: 'busy' })
          .eq('id', driver_id);
      }

      return NextResponse.json({
        ...updatedRoute,
        message: `Driver ${driver.name} asignado exitosamente a la ruta`
      });

    } else {
      // Desasignar driver (driver_id = null)
      
      // Obtener el driver actual para liberarlo
      const currentDriverId = route.driver_id;
      
      // Desasignar driver de la ruta
      const { data: updatedRoute, error: updateError } = await supabase
        .from('optimized_routes')
        .update({
          driver_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', routeId)
        .select()
        .single();

      if (updateError) {
        console.error('Error al desasignar driver:', updateError);
        return NextResponse.json(
          { error: 'Error al desasignar driver' },
          { status: 500 }
        );
      }

      // Si había un driver asignado, verificar si puede volver a available
      if (currentDriverId) {
        // Verificar si el driver tiene otras rutas activas
        const { data: otherActiveRoutes } = await supabase
          .from('optimized_routes')
          .select('id')
          .eq('driver_id', currentDriverId)
          .eq('status', 'active');

        // Si no tiene otras rutas activas, marcarlo como available
        if (!otherActiveRoutes || otherActiveRoutes.length === 0) {
          await supabase
            .from('logistics_drivers')
            .update({ status: 'available' })
            .eq('id', currentDriverId);
        }
      }

      return NextResponse.json({
        ...updatedRoute,
        message: 'Driver desasignado exitosamente de la ruta'
      });
    }

  } catch (error) {
    console.error('Error en PATCH /api/admin/logistics/routes/[id]/assign-driver:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// =====================================================
// GET: OBTENER DRIVERS DISPONIBLES PARA LA RUTA
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const validation = await validateAdmin();
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const routeId = params.id;

    if (!routeId) {
      return NextResponse.json(
        { error: 'ID de ruta requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Obtener información de la ruta
    const { data: route, error: routeError } = await supabase
      .from('optimized_routes')
      .select('id, shipments, total_distance, estimated_time')
      .eq('id', routeId)
      .single();

    if (routeError || !route) {
      return NextResponse.json(
        { error: 'Ruta no encontrada' },
        { status: 404 }
      );
    }

    const shipmentsCount = Array.isArray(route.shipments) ? route.shipments.length : 0;

    // Obtener drivers disponibles con capacidad suficiente
    const { data: availableDrivers, error: driversError } = await supabase
      .from('logistics_drivers')
      .select(`
        id,
        name,
        phone,
        vehicle_type,
        license_plate,
        status,
        max_capacity,
        current_location
      `)
      .eq('status', 'available')
      .gte('max_capacity', shipmentsCount)
      .order('name', { ascending: true });

    if (driversError) {
      console.error('Error al obtener drivers disponibles:', driversError);
      return NextResponse.json(
        { error: 'Error al obtener drivers disponibles' },
        { status: 500 }
      );
    }

    // Enriquecer datos con información de compatibilidad
    const enrichedDrivers = availableDrivers?.map(driver => ({
      ...driver,
      compatibility_score: Math.round(
        (driver.max_capacity >= shipmentsCount ? 50 : 0) +
        (driver.status === 'available' ? 30 : 0) +
        (Math.random() * 20) // Factor aleatorio para simular otros criterios
      ),
      capacity_utilization: Math.round((shipmentsCount / driver.max_capacity) * 100),
      estimated_completion: new Date(
        Date.now() + route.estimated_time * 60 * 1000
      ).toISOString()
    })) || [];

    // Ordenar por score de compatibilidad
    enrichedDrivers.sort((a, b) => b.compatibility_score - a.compatibility_score);

    return NextResponse.json({
      route: {
        id: route.id,
        shipments_count: shipmentsCount,
        total_distance: route.total_distance,
        estimated_time: route.estimated_time
      },
      available_drivers: enrichedDrivers
    });

  } catch (error) {
    console.error('Error en GET /api/admin/logistics/routes/[id]/assign-driver:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
