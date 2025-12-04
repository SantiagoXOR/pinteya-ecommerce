'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, MessageCircle, ShoppingBag, FileText, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useAppDispatch } from '@/redux/store'
import { removeAllItemsFromCart } from '@/redux/features/cart-slice'

export default function MercadoPagoSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const dispatch = useAppDispatch()
  const [countdown, setCountdown] = useState(10)

  // Extraer datos de la URL de MercadoPago
  const orderId = searchParams.get('order_id')
  const customerName = searchParams.get('customerName')
  const phone = searchParams.get('phone')

  // Estados para la orden
  const [orderData, setOrderData] = useState<any>(null)
  const [effectiveTotal, setEffectiveTotal] = useState<number>(0)
  const [effectiveWhatsappUrl, setEffectiveWhatsappUrl] = useState<string | null>(null)
  const [whatsappMessage, setWhatsappMessage] = useState<string>('')
  const [phoneNumber, setPhoneNumber] = useState<string>('')

  // Número de WhatsApp del negocio
  const businessPhone = '5493513411796'

  // Helper: resuelve el mejor endpoint de WhatsApp según dispositivo
  const resolveWhatsAppLink = (
    baseWaMeUrl: string | null,
    rawMessage: string,
    fallbackPhone: string
  ): string => {
    let phone = (fallbackPhone || '').replace(/\D/g, '')
    // Usar solo \n para saltos de línea (más compatible con WhatsApp)
    let encodedText = rawMessage ? encodeURIComponent(rawMessage) : ''

    try {
      if (baseWaMeUrl) {
        const u = new URL(baseWaMeUrl)
        const m = u.pathname.match(/\/(\d+)/)
        if (m && m[1]) phone = m[1]
        const t = u.searchParams.get('text')
        if (t) encodedText = t
        // Normalizar cualquier wa.me a api.whatsapp.com/send para consistencia y mejor renderizado
        if (u.hostname === 'wa.me') {
          // Si faltara el text, usar el que construimos arriba
          return `https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`
        }
      }
    } catch {}

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
    // Usar el mismo formato que whatsappLinkService para consistencia
    const lines = [
      `✨ *¡Gracias por tu compra en Pinteya!* 🛍`,
      `💳 Tu pago con MercadoPago ha sido procesado exitosamente`,
      '',
      `*Detalle de Orden:*`,
      `• Orden: ${data.orderId}`,
      `• Total: $${data.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      '',
      `*Datos Personales:*`,
      `• Nombre: ${data.customerName}`,
      `• Teléfono: 📞 ${data.phone || 'No disponible'}`,
      '',
      `*Productos:*`,
      `• Producto de Prueba MercadoPago x1 - $${data.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
      '',
      `✅ ¡Listo! 💚 En breve te contactamos para confirmar disponibilidad y horario.`
    ]
    
    return lines.join('\n')
  }

  useEffect(() => {
    // Limpiar el carrito inmediatamente al llegar a la página de éxito
    dispatch(removeAllItemsFromCart())
    console.log('🛒 Carrito limpiado después del éxito de MercadoPago')

    async function fetchOrderAndPrepareWhatsApp() {
      if (!orderId) return

      try {
        console.log('🔍 DEBUG - Obteniendo orden desde API:', orderId)
        
        // 1. Obtener datos completos de la orden desde la API
        const response = await fetch(`/api/orders/${orderId}`)
        const responseData = await response.json()
        const order = responseData.data
        
        console.log('🔍 DEBUG - Response completo:', responseData)
        console.log('🔍 DEBUG - Orden obtenida:', order)
        console.log('🔍 DEBUG - whatsapp_message existe?:', !!order?.whatsapp_message)
        console.log('🔍 DEBUG - whatsapp_message length:', order?.whatsapp_message?.length || 0)
        
        if (order) {
          setOrderData(order)
          
          // 2. Extraer datos de la orden
          const total = order.total || 0  // Corregido: usar order.total en vez de order.total_amount
          setEffectiveTotal(total)
          
          // 3. Obtener URL de WhatsApp de la orden
          const whatsappUrl = order.whatsapp_notification_link || null
          setEffectiveWhatsappUrl(whatsappUrl)
          
          // 4. Obtener mensaje de WhatsApp de la orden
          let message = order.whatsapp_message || ''
          if (message) {
            // El mensaje ya viene en texto plano desde la BD, NO necesita decodificación
            console.log('🔍 DEBUG - Mensaje de WhatsApp desde BD:', message.substring(0, 100) + '...')
            console.log('🔍 DEBUG - Mensaje completo:', message)
          }
          
          // 5. Si no hay whatsapp_message pero sí hay whatsapp_notification_link, extraerlo
          if (!message && order.whatsapp_notification_link) {
            try {
              const url = new URL(order.whatsapp_notification_link)
              const encodedText = url.searchParams.get('text')
              if (encodedText) {
                message = decodeURIComponent(encodedText)
                console.log('🔍 DEBUG - Mensaje extraído del link:', message.substring(0, 100) + '...')
              }
            } catch (e) {
              console.warn('Error extrayendo mensaje del link:', e)
            }
          }
          
          // 6. Si aún no hay mensaje, generar uno localmente (fallback) - MEJORADO
          if (!message) {
            console.warn('⚠️ ADVERTENCIA: whatsapp_message no encontrado en BD, usando fallback')
            console.log('🔍 DEBUG - order.whatsapp_message:', order.whatsapp_message)
            console.log('🔍 DEBUG - order.whatsapp_notification_link:', order.whatsapp_notification_link)
            
            // Extraer datos del payer_info si está disponible
            const payerName = order.payer_info?.name && order.payer_info?.surname
              ? `${order.payer_info.name} ${order.payer_info.surname}`
              : (customerName || order.customer_name || 'Cliente')
            
            const payerPhone = order.payer_info?.phone || phone || order.phone || ''
            
            message = generateLocalWhatsAppMessage({
              orderId: order.order_number || order.id.toString(),  // ✅ Usar order_number, no id
              customerName: payerName,
              total,
              phone: payerPhone
            })
            console.log('🔍 DEBUG - Mensaje generado con datos del payer_info')
            console.log('🔍 DEBUG - Mensaje fallback generado:', message.substring(0, 100))
          }
          
          setWhatsappMessage(message)
          
          // Log final para confirmar qué mensaje se está usando
          console.log('✅ MENSAJE FINAL CONFIGURADO:')
          console.log('📝 Primeras 200 caracteres:', message.substring(0, 200))
          console.log('📏 Longitud total:', message.length)
          console.log('🔍 Contiene order_number?:', message.includes('ORD-'))
          console.log('🔍 Contiene nombre real?:', message.includes('Santiago') || message.includes('Martinez'))
          
          // 6. Guardar en localStorage para la página de detalles
          try {
            localStorage.setItem(`order_message_${orderId}`, message)
            localStorage.setItem('mercadopagoSuccessParams', JSON.stringify({
              orderId,
              total,
              whatsappMessage: message,
              customerName: customerName || order.customer_name || 'Cliente'
            }))
            console.log('🔍 DEBUG - Mensaje guardado en localStorage')
          } catch (e) {
            console.warn('Error guardando en localStorage:', e)
          }
          
          // 7. Extraer número de teléfono
          let extractedPhone = businessPhone
          try {
            if (whatsappUrl) {
              const u = new URL(whatsappUrl)
              const match = u.pathname.match(/\/(\d+)/)
              if (match && match[1]) extractedPhone = match[1]
            }
          } catch {}
          setPhoneNumber(extractedPhone)
          
          // 📊 Google Ads Conversion Event
          if (typeof window !== 'undefined' && window.gtag) {
            const transactionId = order.order_number || order.id?.toString() || orderId
            if (transactionId) {
              window.gtag('event', 'conversion', {
                'send_to': 'AW-17767977006/pWuOCOrskMkbEK6gt5hC',
                'transaction_id': transactionId
              })
            }
          }
          
        } else {
          console.warn('No se encontró la orden en la API')
          // Crear datos básicos si no se encuentra la orden
          setEffectiveTotal(10) // Valor por defecto para el producto de prueba
          setWhatsappMessage(generateLocalWhatsAppMessage({
            orderId,
            customerName: customerName || 'Cliente',
            total: 10,
            phone: phone || ''
          }))
          setPhoneNumber(businessPhone)
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        // En caso de error, crear mensaje básico
        const basicMessage = generateLocalWhatsAppMessage({
          orderId,
          customerName: customerName || 'Cliente',
          total: 10,
          phone: phone || ''
        })
        setWhatsappMessage(basicMessage)
        setEffectiveTotal(10)
        setPhoneNumber(businessPhone)
      }
    }

    fetchOrderAndPrepareWhatsApp()
  }, [orderId, customerName, phone, dispatch])

  // Countdown para redirección automática
  useEffect(() => {
    if (!effectiveWhatsappUrl || !whatsappMessage) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          const finalLink = resolveWhatsAppLink(
            effectiveWhatsappUrl,
            whatsappMessage,
            phoneNumber
          )
          window.open(finalLink, '_blank')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [effectiveWhatsappUrl, whatsappMessage, phoneNumber])

  const handleWhatsAppRedirect = () => {
    if (whatsappMessage) {
      const finalLink = resolveWhatsAppLink(
        effectiveWhatsappUrl,
        whatsappMessage,
        phoneNumber
      )
      window.open(finalLink, '_blank')
    }
  }

  const handleContinueShopping = () => {
    router.push('/')
  }

  const handleViewOrder = () => {
    if (orderId) {
      // Pasar el mensaje de WhatsApp como parámetro para mostrarlo en la página de detalles
      const params = new URLSearchParams()
      if (whatsappMessage) {
        params.set('message', whatsappMessage)  // Next.js lo codificará automáticamente
      }
      params.set('customerName', customerName || orderData?.customer_name || 'Cliente')
      params.set('total', effectiveTotal.toString())
      
      // Usar order_number si existe, sino usar orderId
      const displayOrderId = orderData?.order_number || orderId
      router.push(`/orders/${displayOrderId}?${params.toString()}`)
    }
  }

  const defaultMessage = `Hola${customerName ? ` ${customerName}` : ''}, confirmo mi pedido${orderId ? ` #${orderId}` : ''} por un total de $${effectiveTotal.toLocaleString('es-AR')}.` 

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header de éxito */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-lg text-gray-600">
            Tu pago con MercadoPago ha sido procesado correctamente
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
            {(orderData?.order_number || orderId) && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Número de Orden:</span>
                <Badge variant="outline" className="font-mono">
                  #{orderData?.order_number || orderId}
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
                  <span>Total Pagado:</span>
                  <span className="text-green-600">
                    ${effectiveTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">
                    Pago con MercadoPago
                  </h4>
                  <p className="text-sm text-blue-700">
                    Tu pago ha sido aprobado y procesado. Recibirás un email de confirmación.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Redirección a WhatsApp */}
        {whatsappMessage && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Confirma tu pedido por WhatsApp
                </h3>
                <p className="text-green-700 mb-4">
                  Te redirigiremos automáticamente a WhatsApp para que confirmes 
                  los detalles de tu pedido con nuestro equipo.
                </p>
                
                {countdown > 0 && (
                  <div className="bg-white rounded-lg p-3 mb-4 border border-green-200">
                    <p className="text-sm text-green-600">
                      Redirección automática en <span className="font-bold text-lg">{countdown}</span> segundos
                    </p>
                  </div>
                )}

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
            variant="outline"
            onClick={handleContinueShopping}
            className="flex items-center justify-center gap-2 py-3"
          >
            <ShoppingBag className="w-4 h-4" />
            Seguir Comprando
          </Button>

          {orderId && (
            <Button
              variant="outline"
              onClick={handleViewOrder}
              className="flex items-center justify-center gap-2 py-3"
            >
              <FileText className="w-4 h-4" />
              Ver Detalles del Pedido
            </Button>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Recibirás un email de confirmación con todos los detalles de tu pedido.
          </p>
          <p className="mt-1">
            Si tienes alguna pregunta, no dudes en contactarnos.
          </p>
        </div>
      </div>
    </div>
  )
}