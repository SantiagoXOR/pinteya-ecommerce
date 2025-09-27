// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// =====================================================
// API: GESTIÓN DE DRIVERS/CONDUCTORES
// Ruta: /api/admin/logistics/drivers
// Descripción: CRUD para conductores de la flota propia
// =====================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/integrations/supabase/server'
import { auth } from '@/lib/auth/config'

// =====================================================
// INTERFACES
// =====================================================

interface Driver {
  id?: string
  name: string
  phone: string
  email?: string
  vehicle_type: string
  license_plate: string
  status: 'available' | 'busy' | 'offline'
  current_location?: { lat: number; lng: number }
  max_capacity: number
  license_number?: string
  hire_date?: string
  created_at?: string
  updated_at?: string
}

// =====================================================
// VALIDACIÓN DE ADMIN
// =====================================================

async function validateAdmin() {
  try {
    const session = await auth()

    if (!session || !session.user) {
      return { error: 'No autenticado', status: 401 }
    }

    const supabase = createAdminClient()

    // Verificar si el usuario es admin
    const { data: userProfile, error: userError } = await supabase
      .from('user_profiles')
      .select('email, role_id')
      .eq('email', session.user.email)
      .single()

    if (userError || !userProfile) {
      return { error: 'Usuario no encontrado', status: 404 }
    }

    // Obtener el rol del usuario
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role_name')
      .eq('id', userProfile.role_id)
      .single()

    if (roleError || !roleData || roleData.role_name !== 'admin') {
      return { error: 'Acceso denegado - Se requieren permisos de administrador', status: 403 }
    }

    return { success: true, userId: session.user.id, email: userProfile.email, supabase }
  } catch (error) {
    console.error('Error en validación de admin:', error)
    return { error: 'Error interno del servidor', status: 500 }
  }
}

// =====================================================
// GET: OBTENER DRIVERS
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const validation = await validateAdmin()
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status })
    }

    const supabase = validation.supabase
    const { searchParams } = new URL(request.url)

    // Parámetros de consulta
    const status = searchParams.get('status')
    const vehicleType = searchParams.get('vehicle_type')
    const available = searchParams.get('available') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir consulta
    let query = supabase
      .from('drivers')
      .select('*')
      .order('first_name', { ascending: true })
      .range(offset, offset + limit - 1)

    // Aplicar filtros
    if (status) {
      query = query.eq('status', status)
    }

    if (vehicleType) {
      query = query.eq('vehicle_type', vehicleType)
    }

    if (available) {
      query = query.eq('status', 'available')
    }

    const { data: drivers, error } = await query

    if (error) {
      console.error('Error al obtener drivers:', error)
      return NextResponse.json({ error: 'Error al obtener drivers' }, { status: 500 })
    }

    // Procesar datos para incluir estadísticas y transformar estructura
    const processedDrivers =
      drivers?.map(driver => ({
        id: driver.id,
        name: `${driver.first_name} ${driver.last_name}`,
        phone: driver.phone,
        email: driver.email,
        vehicle_type: 'Vehículo', // Campo genérico
        license_plate: driver.driver_license || 'N/A',
        status: driver.status,
        max_capacity: 50, // Valor por defecto
        current_location: driver.current_location || null,
        active_routes_count:
          driver.active_routes?.filter((r: any) => r.status === 'active').length || 0,
        total_shipments:
          driver.active_routes?.reduce(
            (sum: number, r: any) => sum + (Array.isArray(r.shipments) ? r.shipments.length : 0),
            0
          ) || 0,
        created_at: driver.created_at,
        updated_at: driver.updated_at,
      })) || []

    return NextResponse.json(processedDrivers)
  } catch (error) {
    console.error('Error en GET /api/admin/logistics/drivers:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// =====================================================
// POST: CREAR NUEVO DRIVER
// =====================================================

export async function POST(request: NextRequest) {
  try {
    const validation = await validateAdmin()
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status })
    }

    const body = await request.json()
    const {
      name,
      phone,
      email,
      vehicle_type,
      license_plate,
      status = 'available',
      current_location,
      max_capacity,
      license_number,
      hire_date,
    }: Driver = body

    // Validaciones
    if (!name || !phone || !vehicle_type || !license_plate) {
      return NextResponse.json(
        { error: 'Campos requeridos: name, phone, vehicle_type, license_plate' },
        { status: 400 }
      )
    }

    if (typeof max_capacity !== 'number' || max_capacity <= 0) {
      return NextResponse.json(
        { error: 'max_capacity debe ser un número positivo' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que la placa no esté duplicada
    const { data: existingDriver, error: checkError } = await supabase
      .from('logistics_drivers')
      .select('id')
      .eq('license_plate', license_plate)
      .single()

    if (existingDriver) {
      return NextResponse.json({ error: 'Ya existe un conductor con esa placa' }, { status: 400 })
    }

    // Crear el driver
    const { data: driver, error: createError } = await supabase
      .from('logistics_drivers')
      .insert({
        name,
        phone,
        email: email || null,
        vehicle_type,
        license_plate,
        status,
        current_location: current_location || null,
        max_capacity,
        license_number: license_number || null,
        hire_date: hire_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Error al crear driver:', createError)
      return NextResponse.json({ error: 'Error al crear driver' }, { status: 500 })
    }

    return NextResponse.json(driver, { status: 201 })
  } catch (error) {
    console.error('Error en POST /api/admin/logistics/drivers:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// =====================================================
// PATCH: ACTUALIZAR DRIVER
// =====================================================

export async function PATCH(request: NextRequest) {
  try {
    const validation = await validateAdmin()
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status })
    }

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de driver requerido' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el driver existe
    const { data: existingDriver, error: checkError } = await supabase
      .from('logistics_drivers')
      .select('id')
      .eq('id', id)
      .single()

    if (checkError || !existingDriver) {
      return NextResponse.json({ error: 'Driver no encontrado' }, { status: 404 })
    }

    // Si se actualiza la placa, verificar que no esté duplicada
    if (updates.license_plate) {
      const { data: duplicateDriver } = await supabase
        .from('logistics_drivers')
        .select('id')
        .eq('license_plate', updates.license_plate)
        .neq('id', id)
        .single()

      if (duplicateDriver) {
        return NextResponse.json({ error: 'Ya existe un conductor con esa placa' }, { status: 400 })
      }
    }

    // Actualizar el driver
    const { data: driver, error: updateError } = await supabase
      .from('logistics_drivers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error al actualizar driver:', updateError)
      return NextResponse.json({ error: 'Error al actualizar driver' }, { status: 500 })
    }

    return NextResponse.json(driver)
  } catch (error) {
    console.error('Error en PATCH /api/admin/logistics/drivers:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// =====================================================
// DELETE: ELIMINAR DRIVER
// =====================================================

export async function DELETE(request: NextRequest) {
  try {
    const validation = await validateAdmin()
    if (validation.error) {
      return NextResponse.json({ error: validation.error }, { status: validation.status })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID de driver requerido' }, { status: 400 })
    }

    const supabase = await createClient()

    // Verificar que el driver existe
    const { data: existingDriver, error: checkError } = await supabase
      .from('logistics_drivers')
      .select('id, status')
      .eq('id', id)
      .single()

    if (checkError || !existingDriver) {
      return NextResponse.json({ error: 'Driver no encontrado' }, { status: 404 })
    }

    // Verificar que no tenga rutas activas
    const { data: activeRoutes, error: routesError } = await supabase
      .from('optimized_routes')
      .select('id')
      .eq('driver_id', id)
      .eq('status', 'active')

    if (routesError) {
      console.error('Error al verificar rutas activas:', routesError)
      return NextResponse.json({ error: 'Error al verificar rutas activas' }, { status: 500 })
    }

    if (activeRoutes && activeRoutes.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un conductor con rutas activas' },
        { status: 400 }
      )
    }

    // Limpiar driver_id de rutas planificadas
    await supabase.from('optimized_routes').update({ driver_id: null }).eq('driver_id', id)

    // Eliminar el driver
    const { error: deleteError } = await supabase.from('logistics_drivers').delete().eq('id', id)

    if (deleteError) {
      console.error('Error al eliminar driver:', deleteError)
      return NextResponse.json({ error: 'Error al eliminar driver' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error en DELETE /api/admin/logistics/drivers:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
