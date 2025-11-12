'use client'

// Forzar renderizado dinámico para evitar problemas con prerendering
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Package, Truck, ArrowRight, Home, Receipt } from 'lucide-react'
import { trackPurchase as trackGA4Purchase } from '@/lib/google-analytics'
import { trackPurchase as trackMetaPurchase } from '@/lib/meta-pixel'

interface PaymentInfo {
  payment_id?: string
  status?: string
  external_reference?: string
  merchant_order_id?: string
}

export default function CheckoutSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Obtener parámetros de la URL
    const payment_id = searchParams.get('payment_id')
    const status = searchParams.get('status')
    const external_reference = searchParams.get('external_reference')
    const merchant_order_id = searchParams.get('merchant_order_id')

    setPaymentInfo({
      payment_id,
      status,
      external_reference,
      merchant_order_id,
    })

    setIsLoading(false)

    // Log para debugging
    console.log('🎉 Pago exitoso:', {
      payment_id,
      status,
      external_reference,
      merchant_order_id,
    })
  }, [searchParams])

  // 📊 ANALYTICS: Track purchase (solo una vez al cargar con pago exitoso)
  useEffect(() => {
    if (paymentInfo.payment_id && paymentInfo.status === 'approved') {
      try {
        // Obtener datos del carrito del sessionStorage (si están disponibles)
        const checkoutData = sessionStorage.getItem('checkout-data')
        let items: any[] = []
        let totalValue = 0
        let shippingCost = 0

        if (checkoutData) {
          const parsed = JSON.parse(checkoutData)
          items = parsed.items || []
          totalValue = parsed.total || 0
          shippingCost = parsed.shipping || 0
        }

        // Si no hay datos en sessionStorage, intentar reconstruir desde URL
        const transactionId = paymentInfo.external_reference || paymentInfo.payment_id

        if (items.length > 0 && totalValue > 0) {
          // Preparar items para Google Analytics
          const ga4Items = items.map((item: any) => ({
            item_id: String(item.id),
            item_name: item.name || item.title || 'Producto',
            item_category: item.brand || item.category || 'Producto',
            price: item.discounted_price || item.price || 0,
            quantity: item.quantity || 1,
          }))

          // Preparar items para Meta Pixel
          const metaContents = items.map((item: any) => ({
            id: String(item.id),
            quantity: item.quantity || 1,
            item_price: item.discounted_price || item.price || 0,
          }))

          // Google Analytics
          trackGA4Purchase(
            transactionId,
            ga4Items,
            totalValue,
            'ARS',
            shippingCost,
            0 // tax
          )

          // Meta Pixel
          trackMetaPurchase(
            totalValue,
            'ARS',
            metaContents,
            items.length,
            transactionId
          )

          console.debug('[Analytics] Purchase tracked:', {
            transactionId,
            items: items.length,
            totalValue,
          })

          // Limpiar datos del checkout del sessionStorage
          sessionStorage.removeItem('checkout-data')
          sessionStorage.removeItem('checkout-in-progress')
        } else {
          console.warn('[Analytics] No checkout data found for purchase tracking')
        }
      } catch (analyticsError) {
        console.warn('[Analytics] Error tracking purchase:', analyticsError)
      }
    }
  }, [paymentInfo])

  const handleContinueShopping = () => {
    router.push('/')
  }

  const handleViewOrder = () => {
    router.push('/orders')
  }

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-green-600'></div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-2xl shadow-2xl'>
        <CardHeader className='text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg'>
          <div className='flex justify-center mb-4'>
            <div className='w-20 h-20 bg-white rounded-full flex items-center justify-center'>
              <CheckCircle className='w-12 h-12 text-green-600' />
            </div>
          </div>
          <CardTitle className='text-3xl font-bold mb-2'>¡Pago Exitoso!</CardTitle>
          <p className='text-green-100 text-lg'>Tu compra ha sido procesada correctamente</p>
        </CardHeader>

        <CardContent className='p-8'>
          {/* Información del pago */}
          <div className='space-y-6'>
            {/* Estado del pago */}
            <div className='flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200'>
              <div className='flex items-center gap-3'>
                <CheckCircle className='w-6 h-6 text-green-600' />
                <div>
                  <h3 className='font-semibold text-green-800'>Estado del Pago</h3>
                  <p className='text-green-600'>Aprobado y procesado</p>
                </div>
              </div>
              <Badge variant='secondary' className='bg-green-100 text-green-700'>
                {paymentInfo.status || 'approved'}
              </Badge>
            </div>

            {/* Detalles del pago */}
            {paymentInfo.payment_id && (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='p-4 bg-gray-50 rounded-lg'>
                  <h4 className='font-medium text-gray-700 mb-1'>ID de Pago</h4>
                  <p className='text-gray-900 font-mono text-sm'>{paymentInfo.payment_id}</p>
                </div>

                {paymentInfo.external_reference && (
                  <div className='p-4 bg-gray-50 rounded-lg'>
                    <h4 className='font-medium text-gray-700 mb-1'>Número de Orden</h4>
                    <p className='text-gray-900 font-mono text-sm'>
                      {paymentInfo.external_reference}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Próximos pasos */}
            <div className='space-y-4'>
              <h3 className='text-xl font-semibold text-gray-900 flex items-center gap-2'>
                <Package className='w-5 h-5' />
                Próximos Pasos
              </h3>

              <div className='space-y-3'>
                <div className='flex items-center gap-3 p-3 bg-blue-50 rounded-lg'>
                  <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
                    <span className='text-blue-600 font-bold text-sm'>1</span>
                  </div>
                  <div>
                    <p className='font-medium text-blue-800'>Confirmación por email</p>
                    <p className='text-blue-600 text-sm'>
                      Recibirás un email con los detalles de tu compra
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-3 bg-orange-50 rounded-lg'>
                  <div className='w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center'>
                    <span className='text-orange-600 font-bold text-sm'>2</span>
                  </div>
                  <div>
                    <p className='font-medium text-orange-800'>Preparación del pedido</p>
                    <p className='text-orange-600 text-sm'>
                      Comenzaremos a preparar tu pedido en las próximas horas
                    </p>
                  </div>
                </div>

                <div className='flex items-center gap-3 p-3 bg-purple-50 rounded-lg'>
                  <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
                    <Truck className='w-4 h-4 text-purple-600' />
                  </div>
                  <div>
                    <p className='font-medium text-purple-800'>Envío</p>
                    <p className='text-purple-600 text-sm'>
                      Te notificaremos cuando tu pedido esté en camino
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className='flex flex-col sm:flex-row gap-4 pt-6'>
              <Button
                onClick={handleViewOrder}
                className='flex-1 bg-green-600 hover:bg-green-700 text-white'
              >
                <Receipt className='w-4 h-4 mr-2' />
                Ver Detalles del Pedido
                <ArrowRight className='w-4 h-4 ml-2' />
              </Button>

              <Button onClick={handleContinueShopping} variant='outline' className='flex-1'>
                <Home className='w-4 h-4 mr-2' />
                Continuar Comprando
              </Button>
            </div>

            {/* Información adicional */}
            <div className='text-center pt-6 border-t border-gray-200'>
              <p className='text-gray-600 text-sm'>
                ¿Tienes alguna pregunta? Contáctanos en{' '}
                <a href='mailto:soporte@pinteya.com' className='text-green-600 hover:underline'>
                  soporte@pinteya.com
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
