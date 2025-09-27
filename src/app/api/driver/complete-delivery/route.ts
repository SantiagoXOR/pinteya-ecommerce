// Configuración para Node.js Runtime
export const runtime = 'nodejs'

/**
 * API para marcar entregas como completadas
 * POST /api/driver/complete-delivery
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { createClient } from '@/lib/integrations/supabase/server'

interface CompleteDeliveryRequest {
  orderId: number
  deliveryLocation?: {
    lat: number
    lng: number
  }
  deliveryNotes?: string
  deliveryPhoto?: string // Base64 encoded image
  recipientName?: string
  deliveryTime?: string
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Configurar Supabase
    const supabase = await createClient()

    // Verificar que el usuario sea un driver
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('id, first_name, last_name, status')
      .eq('email', session.user.email)
      .single()

    if (driverError || !driver) {
      return NextResponse.json({ error: 'Driver no encontrado' }, { status: 403 })
    }

    const body: CompleteDeliveryRequest = await request.json()
    const { orderId, deliveryLocation, deliveryNotes, deliveryPhoto, recipientName, deliveryTime } =
      body

    if (!orderId) {
      return NextResponse.json({ error: 'ID de orden requerido' }, { status: 400 })
    }

    // Verificar que la orden existe y está pendiente
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status, fulfillment_status, total, order_number')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (order.fulfillment_status === 'fulfilled') {
      return NextResponse.json({ error: 'Esta orden ya fue entregada' }, { status: 400 })
    }

    // Actualizar el estado de la orden
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        fulfillment_status: 'fulfilled',
        updated_at: new Date().toISOString(),
        notes: deliveryNotes
          ? `${order.notes || ''}\n\nEntrega completada: ${deliveryNotes}`.trim()
          : order.notes,
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json({ error: 'Error al actualizar la orden' }, { status: 500 })
    }

    // Crear registro de entrega
    const deliveryRecord = {
      order_id: orderId,
      driver_id: driver.id,
      delivery_time: deliveryTime || new Date().toISOString(),
      delivery_location: deliveryLocation ? JSON.stringify(deliveryLocation) : null,
      delivery_notes: deliveryNotes || null,
      recipient_name: recipientName || null,
      delivery_photo: deliveryPhoto || null,
      created_at: new Date().toISOString(),
    }

    // Intentar insertar en tabla de entregas (si existe)
    try {
      const { error: deliveryError } = await supabase.from('deliveries').insert(deliveryRecord)

      if (deliveryError) {
        console.warn('Could not insert delivery record:', deliveryError)
        // No fallar si la tabla no existe, solo logear
      }
    } catch (err) {
      console.warn('Deliveries table might not exist:', err)
    }

    // Obtener información actualizada de la orden
    const { data: updatedOrder, error: fetchError } = await supabase
      .from('orders')
      .select(
        `
        id,
        total,
        status,
        fulfillment_status,
        order_number,
        shipping_address,
        created_at,
        updated_at,
        order_items (
          id,
          quantity,
          price,
          products (
            name
          )
        )
      `
      )
      .eq('id', orderId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated order:', fetchError)
    }

    // Registrar actividad del driver
    try {
      await supabase.from('driver_activities').insert({
        driver_id: driver.id,
        activity_type: 'delivery_completed',
        order_id: orderId,
        location: deliveryLocation ? JSON.stringify(deliveryLocation) : null,
        notes: `Entrega completada para orden ${order.order_number || `#${orderId}`}`,
        created_at: new Date().toISOString(),
      })
    } catch (err) {
      console.warn('Could not log driver activity:', err)
    }

    return NextResponse.json({
      success: true,
      message: 'Entrega marcada como completada exitosamente',
      data: {
        orderId,
        orderNumber: order.order_number || `#${orderId}`,
        deliveryTime: deliveryTime || new Date().toISOString(),
        driver: {
          id: driver.id,
          name: `${driver.first_name} ${driver.last_name}`,
        },
        order: updatedOrder || order,
        deliveryDetails: {
          location: deliveryLocation,
          notes: deliveryNotes,
          recipientName,
          hasPhoto: !!deliveryPhoto,
        },
      },
    })
  } catch (error) {
    console.error('Error in complete-delivery API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
