'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, MessageCircle, ShoppingBag, FileText, Clock } from '@/lib/optimized-imports'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAnalytics } from '@/hooks/useAnalytics'
import { trackPurchase as trackGA4Purchase } from '@/lib/google-analytics'
import { trackPurchase as trackMetaPurchase } from '@/lib/meta-pixel'
import { trackGoogleAdsPurchase } from '@/lib/google-ads'
import { Separator } from '@/components/ui/separator'

export default function CashSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { trackEvent, trackConversion } = useAnalytics()
  const [purchaseTracked, setPurchaseTracked] = useState(false)
  const [hasRedirected, setHasRedirected] = useState(false)

  // Extraer datos de la URL
  const orderId = searchParams.get('orderId')
  const totalParam = searchParams.get('total')
  const whatsappUrlParam = searchParams.get('whatsappUrl')
  const customerName = searchParams.get('customerName')
  const phone = searchParams.get('phone')

  // Fallbacks desde localStorage si los params no llegan
  const [effectiveTotal, setEffectiveTotal] = useState<number>(0)
  const [effectiveWhatsappUrl, setEffectiveWhatsappUrl] = useState<string | null>(null)
  const [whatsappMessage, setWhatsappMessage] = useState<string>('')
  const [orderItems, setOrderItems] = useState<any[]>([])
  const [phoneNumber, setPhoneNumber] = useState<string>('')

  // Helper: resuelve el mejor endpoint de WhatsApp según dispositivo
  const resolveWhatsAppLink = (
    baseWaMeUrl: string | null,
    rawMessage: string,
    fallbackPhone: string
  ): string => {
    let phone = (fallbackPhone || '').replace(/\D/g, '')
    // El mensaje crudo (con \n) debe codificarse con encodeURIComponent
    // que convierte \n a %0A automáticamente
    let messageToEncode = rawMessage || ''

    try {
      if (baseWaMeUrl) {
        const u = new URL(baseWaMeUrl)
        const m = u.pathname.match(/\/(\d+)/)
        if (m && m[1]) phone = m[1]
        // searchParams.get() decodifica automáticamente, así que obtenemos el mensaje con \n
        const t = u.searchParams.get('text')
        if (t) messageToEncode = t
      }
    } catch {}

    // ✅ FIX: Siempre codificar el mensaje al final para que \n se convierta en %0A
    const encodedText = encodeURIComponent(messageToEncode)

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const isMobile = /Android|iPhone|iPad|iPod|IEMobile|Mobile/i.test(ua)

    if (isMobile) {
      // En móviles, intentar deep link de la app
      return `whatsapp://send?phone=${phone}&text=${encodedText}`
    }
    // En desktop, preferir el endpoint oficial api.whatsapp.com para respetar saltos de línea
    return `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`
  }

  // Función para generar mensaje de WhatsApp localmente
  const generateLocalWhatsAppMessage = (data: {
    orderId: string
    customerName: string
    total: number
    phone: string
  }) => {
    const lines = [
      `¡Hola! He realizado un pedido con pago contra entrega`,
      '',
      `🧾 *Orden #${data.orderId}*`,
      `• Cliente: ${data.customerName}`,
      `• Teléfono: 📞 ${data.phone || 'No disponible'}`,
      '',
      `🛍️ *Productos:*`,
      `• Producto Pinteya x1 - $${data.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      '',
      `💸 *Total: $${data.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}*`,
      '',
      `💳 *Método de pago:* Pago contra entrega`,
      `📅 *Fecha del pedido:* ${new Date().toLocaleDateString('es-AR')}`,
      '',
      `✅ Gracias por tu compra. Nuestro equipo te contactará en las próximas horas.`
    ]
    
    return lines.join('\n')
  }

  useEffect(() => {
    try {
      const totalFromParam = totalParam ? Number(totalParam) : 0
      let nextTotal = !isNaN(totalFromParam) && totalFromParam > 0 ? totalFromParam : 0

      let nextWhatsapp = whatsappUrlParam || null

      if ((!nextWhatsapp || nextTotal === 0) && typeof window !== 'undefined') {
        const savedRaw = window.localStorage.getItem('cashSuccessParams')
        if (savedRaw) {
          const saved = JSON.parse(savedRaw)
          const savedTotal = Number(saved?.total)
          if (!isNaN(savedTotal) && savedTotal > 0) {
            nextTotal = savedTotal
          }
          if (!nextWhatsapp && saved?.whatsappUrl) {
            nextWhatsapp = saved.whatsappUrl
          }
          if (saved?.whatsappMessage) {
            setWhatsappMessage(String(saved.whatsappMessage))
          }
        }
      }

      setEffectiveTotal(nextTotal)
      setEffectiveWhatsappUrl(nextWhatsapp)

      // Extraer número del wa.me si está disponible, si no usar fallback
      let extractedPhone = ''
      try {
        if (nextWhatsapp) {
          const u = new URL(nextWhatsapp)
          const match = u.pathname.match(/\/(\d+)/)
          if (match && match[1]) extractedPhone = match[1]
        }
      } catch {}

      // Fallback a número de negocio conocido
      const fallbackPhone = '5493513411796'
      const phoneToUse = extractedPhone || fallbackPhone
      setPhoneNumber(phoneToUse)

      // Intentar obtener el mensaje de WhatsApp desde localStorage primero
      let foundMessage = ''
      try {
        const savedParams = localStorage.getItem('cashSuccessParams')
        const savedOrderData = localStorage.getItem('cashOrderData')
        
        console.log('🔍 DEBUG - savedParams:', savedParams)
        console.log('🔍 DEBUG - savedOrderData:', savedOrderData)
        
        if (savedParams) {
          const params = JSON.parse(savedParams)
          console.log('🔍 DEBUG - params.whatsappMessage:', params.whatsappMessage)
          if (params.whatsappMessage) {
            // Decodificar el mensaje que viene codificado desde el backend
            foundMessage = decodeURIComponent(params.whatsappMessage)
          }
        } else if (savedOrderData) {
          const orderData = JSON.parse(savedOrderData)
          console.log('🔍 DEBUG - orderData.whatsapp_message:', orderData.whatsapp_message)
          if (orderData.whatsapp_message) {
            // Decodificar el mensaje que viene codificado desde el backend
            foundMessage = decodeURIComponent(orderData.whatsapp_message)
          }
        }
        
        console.log('🔍 DEBUG - foundMessage:', foundMessage)
      } catch (e) {
        console.warn('No se pudo obtener mensaje de WhatsApp desde localStorage:', e)
      }

      // Si no hay mensaje guardado, generar uno localmente
      if (!foundMessage && orderId && customerName && nextTotal > 0) {
        foundMessage = generateLocalWhatsAppMessage({
          orderId,
          customerName,
          total: nextTotal,
          phone: phone || ''
        })
      }

      if (foundMessage) {
        setWhatsappMessage(foundMessage)
      }
      
      // Redirección inmediata a WhatsApp cuando todo esté listo
      if (nextWhatsapp && foundMessage && !hasRedirected && typeof window !== 'undefined') {
        const finalLink = resolveWhatsAppLink(
          nextWhatsapp,
          foundMessage,
          phoneToUse
        )
        // Usar setTimeout mínimo para asegurar que el estado se actualizó
        setTimeout(() => {
          window.open(finalLink, '_blank')
          setHasRedirected(true)
        }, 100)
      }

      // 📊 ANALYTICS: Track purchase (solo una vez)
      if (orderId && effectiveTotal > 0 && !purchaseTracked) {
        try {
          // Obtener datos del carrito del localStorage o sessionStorage
          const checkoutData = sessionStorage.getItem('checkout-data') || localStorage.getItem('cashOrderData')
          let items: any[] = []
          let totalValue = effectiveTotal
          let shippingCost = 0

          if (checkoutData) {
            try {
              const parsed = JSON.parse(checkoutData)
              items = parsed.items || parsed.order?.items || []
              totalValue = parsed.total || parsed.order?.total || effectiveTotal
              shippingCost = parsed.shipping || parsed.order?.shipping_cost || 0
            } catch (e) {
              console.warn('Error parsing checkout data:', e)
            }
          }

          // Si no hay items, intentar obtener desde orderItems state
          if (items.length === 0 && orderItems.length > 0) {
            items = orderItems
          }

          // Trackear purchase en analytics interno
          trackEvent('purchase', 'ecommerce', 'purchase', orderId, totalValue, {
            transaction_id: orderId,
            value: totalValue,
            currency: 'ARS',
            items: items.map((item: any) => ({
              item_id: String(item.id || item.product_id),
              item_name: item.name || item.product_name || 'Producto',
              item_category: item.category || item.brand || 'Producto',
              price: item.price || item.unit_price || 0,
              quantity: item.quantity || 1,
            })),
            shipping: shippingCost,
          })

          // Trackear conversión
          trackConversion('purchase', {
            transaction_id: orderId,
            value: totalValue,
            currency: 'ARS',
          })

          // Google Analytics 4
          if (items.length > 0) {
            const ga4Items = items.map((item: any) => ({
              item_id: String(item.id || item.product_id),
              item_name: item.name || item.product_name || 'Producto',
              item_category: item.category || item.brand || 'Producto',
              price: item.price || item.unit_price || 0,
              quantity: item.quantity || 1,
            }))

            trackGA4Purchase(orderId, ga4Items, totalValue, 'ARS', shippingCost, 0)

            // Meta Pixel
            const metaContents = items.map((item: any) => ({
              id: String(item.id || item.product_id),
              quantity: item.quantity || 1,
              item_price: item.price || item.unit_price || 0,
            }))

            trackMetaPurchase(totalValue, 'ARS', metaContents, items.length, orderId)
          }

          // Google Ads Conversion Event
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'conversion', {
              'send_to': 'AW-17767977006/pWuOCOrskMkbEK6gt5hC',
              'transaction_id': orderId
            })
          }

          // Trackear también begin_checkout si no se trackeó antes
          trackEvent('begin_checkout', 'ecommerce', 'begin_checkout', orderId, totalValue, {
            currency: 'ARS',
            value: totalValue,
            items_count: items.length,
          })

          setPurchaseTracked(true)
          console.log('[Analytics] Purchase tracked for cash order:', { orderId, totalValue, itemsCount: items.length })
        } catch (error) {
          console.error('[Analytics] Error tracking purchase:', error)
        }
      }
    } catch (e) {
      // Si hay algún error de parseo, mantenemos valores por defecto
      setEffectiveTotal(totalParam ? Number(totalParam) || 0 : 0)
      setEffectiveWhatsappUrl(whatsappUrlParam || null)
    }
  }, [orderId, totalParam, whatsappUrlParam, customerName, phone, hasRedirected])

  const handleWhatsAppRedirect = () => {
    if (effectiveWhatsappUrl) {
      const finalLink = resolveWhatsAppLink(
        effectiveWhatsappUrl,
        whatsappMessage || defaultMessage,
        phoneNumber
      )
      window.open(finalLink, '_blank')
    }
  }

  const defaultMessage = `Hola${customerName ? ` ${customerName}` : ''}, confirmo mi pedido${orderId ? ` #${orderId}` : ''} por un total de $${effectiveTotal.toLocaleString('es-AR')}.` 


  const handleContinueShopping = () => {
    router.push('/')
  }

  const handleViewOrder = () => {
    if (orderId) {
      // Redirigir solo con el orderId - la página de detalle obtiene todos los datos desde la API
      // No pasar mensaje en URL por seguridad y privacidad
      router.push(`/mis-ordenes/${orderId}`)
    }
  }

  return (
    <div className="fixed inset-0 min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4 overflow-y-auto" style={{ backgroundColor: '#f0fdf4' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header de éxito */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-lg text-gray-600">
            Tu orden ha sido registrada exitosamente
          </p>
        </div>

        {/* Información del pedido */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalles del Pedido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {orderId && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Número de Orden:</span>
                <Badge variant="outline" className="font-mono">
                  #{orderId}
                </Badge>
              </div>
            )}
            
            {customerName && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-medium">{customerName}</span>
              </div>
            )}

            {phone && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Teléfono:</span>
                <span className="font-medium">{phone}</span>
              </div>
            )}

            {effectiveTotal > 0 && (
              <>
                <Separator />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total a Pagar:</span>
                  <span className="text-green-600">
                    ${effectiveTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-800 mb-1">
                    Pago Contra Entrega
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Pagarás en efectivo cuando recibas tu pedido. 
                    Nuestro equipo se contactará contigo para coordinar la entrega.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redirección a WhatsApp */}
        {effectiveWhatsappUrl && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Confirma tu pedido por WhatsApp
                </h3>
                <p className="text-green-700 mb-4">
                  Ya te redirigimos automáticamente a WhatsApp para que confirmes 
                  los detalles de tu pedido con nuestro equipo.
                </p>

                <Button 
                  onClick={handleWhatsAppRedirect}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                  size="lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Ir a WhatsApp Ahora
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Acciones adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            variant="default"
            onClick={handleContinueShopping}
            className="flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-900 text-white border-0"
          >
            <ShoppingBag className="w-4 h-4" />
            Seguir Comprando
          </Button>

          {orderId && (
            <Button
              variant="default"
              onClick={handleViewOrder}
              className="flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-900 text-white border-0"
            >
              <FileText className="w-4 h-4" />
              Ver Detalles del Pedido
            </Button>
          )}
        </div>


        {/* Información adicional */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Si tienes alguna pregunta, no dudes en contactarnos.
          </p>
        </div>
      </div>
    </div>
  )
}