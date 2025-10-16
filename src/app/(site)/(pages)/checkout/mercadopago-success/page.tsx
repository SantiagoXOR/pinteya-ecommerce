'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, MessageCircle, ShoppingBag, FileText, Clock, Phone, Mail, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { generateMercadoPagoWhatsAppMessage } from '@/lib/integrations/whatsapp/whatsapp-utils'

export default function MercadoPagoSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)
  const [orderData, setOrderData] = useState<any>(null)
  const [whatsappUrl, setWhatsappUrl] = useState<string>('')

  // Extraer datos de la URL
  const orderId = searchParams.get('order_id')
  const customerName = searchParams.get('customerName')
  const phone = searchParams.get('phone')

  // Número de WhatsApp del negocio
  const businessPhone = '5493513411796'

  useEffect(() => {
    async function fetchOrderAndPrepareWhatsApp() {
      if (!orderId) return

      try {
        // 1. Obtener datos completos de la orden desde la API
        const response = await fetch(`/api/orders/${orderId}`)
        const { data: order } = await response.json()
        
        if (order) {
          setOrderData(order)
          
          // 2. Generar mensaje de WhatsApp
          const message = generateMercadoPagoWhatsAppMessage(order)
          
          // 3. Construir URL de WhatsApp
          const whatsappUrl = `https://api.whatsapp.com/send?phone=${businessPhone}&text=${encodeURIComponent(message)}`
          setWhatsappUrl(whatsappUrl)
        }
      } catch (error) {
        console.error('Error fetching order:', error)
        // En caso de error, crear mensaje básico
        const basicMessage = `¡Hola! He completado mi pago con MercadoPago. Orden #${orderId}. Gracias por tu compra.`
        const fallbackUrl = `https://api.whatsapp.com/send?phone=${businessPhone}&text=${encodeURIComponent(basicMessage)}`
        setWhatsappUrl(fallbackUrl)
      }
    }

    fetchOrderAndPrepareWhatsApp()
  }, [orderId])

  // Countdown para redirección automática
  useEffect(() => {
    if (!whatsappUrl) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          // Redirigir a WhatsApp
          window.open(whatsappUrl, '_blank')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [whatsappUrl])

  const handleWhatsAppRedirect = () => {
    if (whatsappUrl) {
      window.open(whatsappUrl, '_blank')
    }
  }

  const handleCopyMessage = async () => {
    if (!orderData) return
    
    const message = generateMercadoPagoWhatsAppMessage(orderData)
    try {
      await navigator.clipboard.writeText(message)
      alert('Mensaje copiado al portapapeles')
    } catch (err) {
      console.error('No se pudo copiar el mensaje', err)
    }
  }

  const handleCall = () => {
    window.location.href = `tel:${businessPhone}`
  }

  const handleEmail = () => {
    const subject = encodeURIComponent(`Confirmación de Pedido${orderId ? ` #${orderId}` : ''}`)
    const body = encodeURIComponent(`Hola, he completado mi pago con MercadoPago. Orden #${orderId}. Gracias.`)
    const email = 'ventas@pinteya.com'
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
  }

  const handleContinueShopping = () => {
    router.push('/products')
  }

  const handleViewOrder = () => {
    if (orderId) {
      router.push(`/orders/${orderId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header de éxito */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-blue-600" />
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

            {orderData?.total_amount && (
              <>
                <Separator />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total Pagado:</span>
                  <span className="text-blue-600">
                    ${orderData.total_amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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
        {whatsappUrl && (
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

        {/* Fallbacks si WhatsApp no funciona */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Si WhatsApp no funciona</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              variant="secondary"
              onClick={handleCopyMessage}
              className="flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" /> Copiar Mensaje
            </Button>
            <Button
              variant="secondary"
              onClick={handleCall}
              className="flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" /> Llamar al negocio
            </Button>
            <Button
              variant="secondary"
              onClick={handleEmail}
              className="flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4" /> Enviar Email
            </Button>
          </CardContent>
        </Card>

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
