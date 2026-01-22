import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { getPaymentDetails } from '@/lib/integrations/mercadopago'
import { logger, LogLevel, LogCategory } from '@/lib/enterprise/logger'
import { withTenantAdmin, type TenantAdminGuardResult } from '@/lib/auth/guards/tenant-admin-guard'
import { getTenantById } from '@/lib/tenant/tenant-service'

export const GET = withTenantAdmin(async (
  guardResult: TenantAdminGuardResult,
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) => {
  try {
    const { tenantId } = guardResult
    const { id: orderId } = await context.params

    // ⚡ MULTITENANT: Obtener orden con payment_id, filtrando por tenant_id
    const { data: order, error: orderError } = await supabaseAdmin!
      .from('orders')
      .select('id, payment_id, total, status, payment_status')
      .eq('id' as any, orderId)
      .eq('tenant_id', tenantId) // ⚡ MULTITENANT
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

    // ⚡ MULTITENANT: Obtener credenciales del tenant
    const tenant = await getTenantById(tenantId)
    if (!tenant || !tenant.mercadopagoAccessToken) {
      return NextResponse.json(
        { success: false, error: 'MercadoPago no configurado para este tenant' },
        { status: 400 }
      )
    }

    // 4. Obtener detalles del pago desde MercadoPago usando credenciales del tenant
    const paymentResult = await getPaymentDetails(paymentId, tenant.mercadopagoAccessToken)

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
      orderId,
      tenantId,
      error,
    })

    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
})

