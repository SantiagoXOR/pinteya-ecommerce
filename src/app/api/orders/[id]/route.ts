import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'ID de orden requerido' }, { status: 400 })
    }

    const supabase = getSupabaseClient(true)

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database service unavailable' },
        { status: 503 }
      )
    }

    // Obtener orden con items y productos
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        id,
        external_reference,
        total,
        status,
        payment_status,
        payer_info,
        shipping_address,
        created_at,
        updated_at,
        order_items (
          id,
          quantity,
          price,
          products (
            id,
            name,
            images
          )
        )
      `
      )
      .eq('id', orderId)
      .single()

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 })
      }

      console.error('Error fetching order:', orderError)
      return NextResponse.json({ success: false, error: 'Error al obtener orden' }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: order,
    })
  } catch (error) {
    console.error('Error in GET /api/orders/[id]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
