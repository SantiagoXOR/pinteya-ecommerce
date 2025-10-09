'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, MessageCircle, ShoppingBag, FileText, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export default function CashSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  // Extraer datos de la URL
  const orderId = searchParams.get('orderId')
  const total = searchParams.get('total')
  const whatsappUrl = searchParams.get('whatsappUrl')
  const customerName = searchParams.get('customerName')
  const phone = searchParams.get('phone')

  // Countdown para redirección automática
  useEffect(() => {
    if (!whatsappUrl) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
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

  const handleContinueShopping = () => {
    router.push('/products')
  }

  const handleViewOrder = () => {
    if (orderId) {
      router.push(`/orders/${orderId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8 px-4">
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

            {total && (
              <>
                <Separator />
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total a Pagar:</span>
                  <span className="text-green-600">
                    ${parseFloat(total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
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