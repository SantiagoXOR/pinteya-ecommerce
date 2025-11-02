import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { getPaymentDetails } from '@/lib/integrations/mercadopago'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params

    // 1. Verificar autenticación admin
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 })
    }

    // 2. Obtener orden con payment_id
    const { data: order, error: orderError } = await supabaseAdmin!
      .from('orders')
      .select('id, payment_id, total, status, payment_status')
      .eq('id' as any, orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Orden no encontrada' }, { status: 404 })
    }

    // 3. Verificar que tenga payment_id
    const paymentId = (order as any).payment_id
    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Esta orden no tiene un pago asociado de MercadoPago' },
        { status: 404 }
      )
    }

    // 4. Obtener detalles del pago desde MercadoPago
    const paymentResult = await getPaymentDetails(paymentId)

    if (!paymentResult.success || !paymentResult.data) {
      return NextResponse.json(
        { success: false, error: 'No se pudo obtener el comprobante de pago' },
        { status: 500 }
      )
    }

    const payment = paymentResult.data

    // 5. Retornar información del comprobante
    return NextResponse.json({
      success: true,
      data: {
        payment_id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
        transaction_amount: payment.transaction_amount,
        currency_id: payment.currency_id,
        date_approved: payment.date_approved,
        date_created: payment.date_created,
        payment_method_id: payment.payment_method_id,
        payment_type_id: payment.payment_type_id,
        payer: {
          email: payment.payer.email,
          identification: payment.payer.identification,
          first_name: payment.payer.first_name,
          last_name: payment.payer.last_name,
        },
        external_url: `https://www.mercadopago.com.ar/activities?type=collection&id=${payment.id}`,
      },
    })
  } catch (error) {
    logger.log(LogLevel.ERROR, LogCategory.API, 'Error getting payment proof', {
      orderId: (await params).id,
      error,
    })

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

