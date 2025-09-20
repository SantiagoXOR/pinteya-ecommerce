// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// =====================================================
// API: GESTIÓN DE RUTAS OPTIMIZADAS
// Ruta: /api/admin/logistics/routes
// Descripción: CRUD para rutas de logística optimizadas
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/integrations/supabase/server';
import { auth } from '@/lib/auth/config';

// =====================================================
// INTERFACES
// =====================================================

interface OptimizedRoute {
  id?: string;
  name: string;
  shipments: any[];
  total_distance: number;
  estimated_time: number;
  driver_id?: string;
  vehicle?: string;
  status: 'planned' | 'active' | 'completed';
  start_location?: { lat: number; lng: number };
  waypoints: { lat: number; lng: number }[];
  optimization_score: number;
  created_at?: string;
  updated_at?: string;
}

// =====================================================
// VALIDACIÓN DE ADMIN
// =====================================================

async function validateAdmin() {
  try {
    console.log('[ROUTES API] Iniciando validación de admin...');
    const session = await auth();

    if (!session || !session.user) {
      console.log('[ROUTES API] No hay sesión o usuario');
      return { error: 'No autenticado', status: 401 };
    }

    console.log('[ROUTES API] Usuario autenticado:', session.user.email);
    const supabase = createAdminClient();

    // Verificar si el usuario es admin
    console.log('[ROUTES API] Buscando perfil de usuario para:', session.user.email);
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('email, role_id')
      .eq('email', session.user.email)
      .single();

    if (userError || !userProfile) {
      console.log('[ROUTES API] Error al buscar usuario:', userError);
      return { error: 'Usuario no encontrado', status: 404 };
    }

    console.log('[ROUTES API] Perfil encontrado:', userProfile);

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
// GET: OBTENER RUTAS
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const validation = await validateAdmin();
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Parámetros de consulta
    const status = searchParams.get('status');
    const driverId = searchParams.get('driver_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Construir consulta
    let query = supabase
      .from('optimized_routes')
      .select(`
        *,
        driver:logistics_drivers!driver_id (
          id,
          name,
          phone,
          vehicle_type,
          license_plate,
          status
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status);
    }

    if (driverId) {
      query = query.eq('driver_id', driverId);
    }

    const { data: routes, error } = await query;

    if (error) {
      console.error('Error al obtener rutas:', error);
      return NextResponse.json(
        { error: 'Error al obtener rutas' },
        { status: 500 }
      );
    }

    // Procesar datos para incluir shipments
    const processedRoutes = routes?.map(route => ({
      ...route,
      shipments: route.shipments || [],
      waypoints: route.waypoints || [],
      start_location: route.start_location || null
    })) || [];

    return NextResponse.json(processedRoutes);

  } catch (error) {
    console.error('Error en GET /api/admin/logistics/routes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// =====================================================
// POST: CREAR NUEVA RUTA
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const validation = await validateAdmin();
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const body = await request.json();
    const {
      name,
      shipments,
      total_distance,
      estimated_time,
      driver_id,
      vehicle,
      status = 'planned',
      start_location,
      waypoints,
      optimization_score
    }: OptimizedRoute = body;

    // Validaciones
    if (!name || !shipments || !Array.isArray(shipments)) {
      return NextResponse.json(
        { error: 'Datos de ruta inválidos' },
        { status: 400 }
      );
    }

    if (typeof total_distance !== 'number' || typeof estimated_time !== 'number') {
      return NextResponse.json(
        { error: 'Distancia y tiempo deben ser números' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Crear la ruta
    const { data: route, error: routeError } = await supabase
      .from('optimized_routes')
      .insert({
        name,
        shipments,
        total_distance,
        estimated_time,
        driver_id: driver_id || null,
        vehicle: vehicle || null,
        status,
        start_location: start_location || null,
        waypoints: waypoints || [],
        optimization_score: optimization_score || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (routeError) {
      console.error('Error al crear ruta:', routeError);
      return NextResponse.json(
        { error: 'Error al crear ruta' },
        { status: 500 }
      );
    }

    // Si hay envíos, actualizar su route_id
    if (shipments.length > 0) {
      const shipmentIds = shipments.map(s => s.id).filter(Boolean);
      
      if (shipmentIds.length > 0) {
        const { error: updateError } = await supabase
          .from('shipments')
          .update({ route_id: route.id })
          .in('id', shipmentIds);

        if (updateError) {
          console.error('Error al actualizar envíos con route_id:', updateError);
          // No fallar la creación de la ruta por esto
        }
      }
    }

    return NextResponse.json(route, { status: 201 });

  } catch (error) {
    console.error('Error en POST /api/admin/logistics/routes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// =====================================================
// PATCH: ACTUALIZAR RUTA
// =====================================================

export async function PATCH(request: NextRequest) {
  try {
    const validation = await validateAdmin();
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID de ruta requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Actualizar la ruta
    const { data: route, error } = await supabase
      .from('optimized_routes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar ruta:', error);
      return NextResponse.json(
        { error: 'Error al actualizar ruta' },
        { status: 500 }
      );
    }

    return NextResponse.json(route);

  } catch (error) {
    console.error('Error en PATCH /api/admin/logistics/routes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// =====================================================
// DELETE: ELIMINAR RUTA
// =====================================================

export async function DELETE(request: NextRequest) {
  try {
    const validation = await validateAdmin();
    if (validation.error) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID de ruta requerido' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verificar que la ruta existe y no está activa
    const { data: existingRoute, error: checkError } = await supabase
      .from('optimized_routes')
      .select('id, status, shipments')
      .eq('id', id)
      .single();

    if (checkError || !existingRoute) {
      return NextResponse.json(
        { error: 'Ruta no encontrada' },
        { status: 404 }
      );
    }

    if (existingRoute.status === 'active') {
      return NextResponse.json(
        { error: 'No se puede eliminar una ruta activa' },
        { status: 400 }
      );
    }

    // Limpiar route_id de los envíos
    if (existingRoute.shipments && Array.isArray(existingRoute.shipments)) {
      const shipmentIds = existingRoute.shipments.map((s: any) => s.id).filter(Boolean);
      
      if (shipmentIds.length > 0) {
        await supabase
          .from('shipments')
          .update({ route_id: null })
          .in('id', shipmentIds);
      }
    }

    // Eliminar la ruta
    const { error: deleteError } = await supabase
      .from('optimized_routes')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error al eliminar ruta:', deleteError);
      return NextResponse.json(
        { error: 'Error al eliminar ruta' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error en DELETE /api/admin/logistics/routes:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}










