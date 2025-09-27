// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API para gestión de entregas por parte de los drivers
 * GET /api/driver/deliveries - Obtener entregas asignadas
 * POST /api/driver/deliveries - Actualizar estado de entrega
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createClient } from '@/lib/integrations/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // pending, in_transit, delivered, exception
    const date = searchParams.get('date') // YYYY-MM-DD

    const supabase = await createClient()

    // Obtener información del driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id')
      .eq('email', session.user.email)
      .single()

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver no encontrado' }, { status: 404 })
    }

    // Construir query para obtener rutas con entregas
    let query = supabase.from('optimized_routes').select('*').eq('driver_id', driver.id)

    // Filtrar por fecha si se especifica
    if (date) {
      query = query
        .gte('created_at', `${date}T00:00:00.000Z`)
        .lte('created_at', `${date}T23:59:59.999Z`)
    }

    const { data: routes, error: routesError } = await query

    if (routesError) {
      console.error('Error fetching routes:', routesError)
      return NextResponse.json({ error: 'Error obteniendo rutas' }, { status: 500 })
    }

    // Extraer y procesar todas las entregas
    const allDeliveries = []

    for (const route of routes || []) {
      if (route.shipments && Array.isArray(route.shipments)) {
        for (let i = 0; i < route.shipments.length; i++) {
          const shipment = route.shipments[i]

          // Filtrar por estado si se especifica
          if (status && shipment.status !== status) {
            continue
          }

          const delivery = {
            id: shipment.id || `${route.id}-${i}`,
            route_id: route.id,
            route_name: route.name,
            tracking_number: shipment.tracking_number || `TRK-${route.id.slice(-6)}-${i + 1}`,
            customer_name: shipment.customer_name || `Cliente ${i + 1}`,
            customer_phone: shipment.customer_phone,
            destination: {
              address: shipment.destination?.address || `Dirección ${i + 1}`,
              city: shipment.destination?.city || 'Buenos Aires',
              postal_code: shipment.destination?.postal_code || '1000',
              coordinates: shipment.destination?.coordinates,
              notes: shipment.destination?.notes,
            },
            items: shipment.items || [],
            status: shipment.status || 'confirmed',
            estimated_delivery_time: shipment.estimated_delivery_time,
            special_instructions: shipment.special_instructions,
            requires_signature: shipment.requires_signature || false,
            cash_on_delivery: shipment.cash_on_delivery,
            delivery_notes: shipment.delivery_notes,
            delivered_at: shipment.delivered_at,
            delivered_by: shipment.delivered_by,
            created_at: route.created_at,
            updated_at: route.updated_at,
          }

          allDeliveries.push(delivery)
        }
      }
    }

    // Ordenar por fecha de creación (más recientes primero)
    allDeliveries.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    // Estadísticas
    const stats = {
      total: allDeliveries.length,
      pending: allDeliveries.filter(d => d.status === 'pending').length,
      confirmed: allDeliveries.filter(d => d.status === 'confirmed').length,
      in_transit: allDeliveries.filter(d => d.status === 'in_transit').length,
      delivered: allDeliveries.filter(d => d.status === 'delivered').length,
      exception: allDeliveries.filter(d => d.status === 'exception').length,
    }

    return NextResponse.json({
      deliveries: allDeliveries,
      stats,
      driver_id: driver.id,
    })
  } catch (error) {
    console.error('Error in driver deliveries API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      delivery_id,
      route_id,
      status,
      delivery_notes,
      signature_data,
      photo_evidence,
      location,
    } = body

    // Validar parámetros requeridos
    if (!delivery_id || !route_id || !status) {
      return NextResponse.json(
        { error: 'delivery_id, route_id y status son requeridos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Obtener información del driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, name')
      .eq('email', session.user.email)
      .single()

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver no encontrado' }, { status: 404 })
    }

    // Obtener la ruta actual
    const { data: route, error: routeError } = await supabase
      .from('optimized_routes')
      .select('*')
      .eq('id', route_id)
      .eq('driver_id', driver.id)
      .single()

    if (routeError || !route) {
      return NextResponse.json({ error: 'Ruta no encontrada' }, { status: 404 })
    }

    // Actualizar el shipment específico
    const updatedShipments = route.shipments.map((shipment: any) => {
      if (
        shipment.id === delivery_id ||
        `${route_id}-${route.shipments.indexOf(shipment)}` === delivery_id
      ) {
        const updatedShipment = {
          ...shipment,
          status,
          delivery_notes,
          updated_at: new Date().toISOString(),
        }

        // Si se marca como entregado, agregar información adicional
        if (status === 'delivered') {
          updatedShipment.delivered_at = new Date().toISOString()
          updatedShipment.delivered_by = driver.name
          updatedShipment.delivery_location = location

          if (signature_data) {
            updatedShipment.signature_data = signature_data
          }

          if (photo_evidence) {
            updatedShipment.photo_evidence = photo_evidence
          }
        }

        return updatedShipment
      }
      return shipment
    })

    // Actualizar la ruta en la base de datos
    const { data: updatedRoute, error: updateError } = await supabase
      .from('optimized_routes')
      .update({
        shipments: updatedShipments,
        updated_at: new Date().toISOString(),
      })
      .eq('id', route_id)
      .eq('driver_id', driver.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating delivery:', updateError)
      return NextResponse.json({ error: 'Error actualizando entrega' }, { status: 500 })
    }

    // Verificar si todas las entregas están completadas
    const allDelivered = updatedShipments.every((shipment: any) => shipment.status === 'delivered')

    // Si todas las entregas están completadas, marcar la ruta como completada
    if (allDelivered) {
      await supabase
        .from('optimized_routes')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', route_id)
    }

    return NextResponse.json({
      success: true,
      delivery_id,
      status,
      route_completed: allDelivered,
      updated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in driver delivery update API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
