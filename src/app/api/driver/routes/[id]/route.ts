/**
 * API para obtener detalles específicos de una ruta asignada al driver
 * GET /api/driver/routes/[id]
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createClient } from '@/lib/integrations/supabase/server'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const routeId = params.id

    // Para pruebas, devolver datos de ejemplo
    const routeData = {
      id: routeId,
      name: `Ruta de Entrega #${routeId}`,
      total_distance: 35.6,
      estimated_time: 2640, // 44 minutos en segundos
      status: 'active',
      shipments: [
        {
          id: routeId,
          orderNumber: `#${routeId}`,
          tracking_number: `TRK-${routeId}`,
          customer_name: 'Cliente de Prueba',
          customer_phone: '+54 351 123-4567',
          destination: {
            address: 'Av. Colón 1234, Piso 2, Depto A, Córdoba, Córdoba 5000',
            city: 'Córdoba',
            postal_code: '5000',
            coordinates: {
              lat: -31.4084841,
              lng: -64.1917654,
            },
          },
          items: [
            {
              name: 'Producto de Prueba',
              quantity: 1,
              weight: 1,
            },
          ],
          status: 'confirmed',
          estimated_delivery_time: '14:00 - 18:00',
          requires_signature: false,
        },
      ],
      waypoints: [
        {
          lat: -31.4084841,
          lng: -64.1917654,
        },
      ],
      driver: {
        id: 'driver-1',
        name: 'Santiago Martinez',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return NextResponse.json(routeData)
  } catch (error) {
    console.error('Error in driver route API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verificar autenticación
    const session = await auth()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const routeId = params.id
    const body = await request.json()
    const { status, shipments, current_shipment_index } = body

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

    // Actualizar la ruta
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (status) updateData.status = status
    if (shipments) updateData.shipments = shipments

    const { data: updatedRoute, error: updateError } = await supabase
      .from('optimized_routes')
      .update(updateData)
      .eq('id', routeId)
      .eq('driver_id', driver.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating route:', updateError)
      return NextResponse.json({ error: 'Error actualizando ruta' }, { status: 500 })
    }

    return NextResponse.json(updatedRoute)
  } catch (error) {
    console.error('Error in driver route update API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
