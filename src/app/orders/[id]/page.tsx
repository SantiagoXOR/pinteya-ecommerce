'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Package, CheckCircle, ArrowLeft, ShoppingBag, MapPin, User, Mail, Phone, CreditCard } from '@/lib/optimized-imports'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { parseWhatsAppOrderMessage, type ParsedOrderData } from '@/lib/utils/parse-whatsapp-message'

export default function OrderDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orderId = params.id as string
  
  const [orderData, setOrderData] = useState<ParsedOrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [rawMessage, setRawMessage] = useState<string>('')

  useEffect(() => {
    const message = searchParams.get('message')
    const customerName = searchParams.get('customerName')
    const total = searchParams.get('total')

    console.log('≡ƒöì DEBUG - Par├ímetros URL:', { message, customerName, total, orderId })

    let foundMessage = ''
    let foundOrderData: ParsedOrderData | null = null

    // 1. Primero intentar desde par├ímetros URL (si vienen)
    if (message) {
      // Decodificar el mensaje que viene de la URL
      try {
        foundMessage = decodeURIComponent(message)
      } catch (e) {
        // Si falla la decodificaci├│n, usar el mensaje tal cual
        foundMessage = message
      }
      foundOrderData = parseWhatsAppOrderMessage(foundMessage)
      console.log('≡ƒöì DEBUG - Mensaje desde URL (decodificado):', foundMessage)
    } else {
      // 2. Intentar desde localStorage con clave del orderId
      try {
        console.log('≡ƒöì DEBUG - Buscando en localStorage con clave:', `order_message_${orderId}`)
        const savedMessage = localStorage.getItem(`order_message_${orderId}`)
        console.log('≡ƒöì DEBUG - Mensaje desde localStorage:', savedMessage)
        
        // Tambi├⌐n buscar con otras posibles claves
        const allKeys = Object.keys(localStorage)
        const orderKeys = allKeys.filter(key => key.includes('order_message_'))
        console.log('≡ƒöì DEBUG - Todas las claves de orden en localStorage:', orderKeys)
        
        // Buscar tambi├⌐n en cashSuccessParams
        const cashSuccessParams = localStorage.getItem('cashSuccessParams')
        console.log('≡ƒöì DEBUG - cashSuccessParams:', cashSuccessParams)
        
        // Buscar tambi├⌐n en cashOrderData
        const cashOrderData = localStorage.getItem('cashOrderData')
        console.log('≡ƒöì DEBUG - cashOrderData:', cashOrderData)
        
        // Buscar tambi├⌐n en mercadopagoSuccessParams
        const mercadopagoSuccessParams = localStorage.getItem('mercadopagoSuccessParams')
        console.log('≡ƒöì DEBUG - mercadopagoSuccessParams:', mercadopagoSuccessParams)
        
        if (savedMessage) {
          foundMessage = savedMessage
          foundOrderData = parseWhatsAppOrderMessage(savedMessage)
          console.log('≡ƒöì DEBUG - Datos parseados desde localStorage:', foundOrderData)
        } else if (cashSuccessParams) {
          // Intentar desde cashSuccessParams
          try {
            const params = JSON.parse(cashSuccessParams)
            if (params.whatsappMessage) {
              foundMessage = params.whatsappMessage
              foundOrderData = parseWhatsAppOrderMessage(params.whatsappMessage)
              console.log('≡ƒöì DEBUG - Datos recuperados desde cashSuccessParams:', foundOrderData)
            }
          } catch (e) {
            console.warn('Error parseando cashSuccessParams:', e)
          }
        } else if (cashOrderData) {
          // Intentar desde cashOrderData
          try {
            const data = JSON.parse(cashOrderData)
            if (data.whatsapp_message) {
              foundMessage = data.whatsapp_message
              foundOrderData = parseWhatsAppOrderMessage(data.whatsapp_message)
              console.log('≡ƒöì DEBUG - Datos recuperados desde cashOrderData:', foundOrderData)
            }
          } catch (e) {
            console.warn('Error parseando cashOrderData:', e)
          }
        } else if (mercadopagoSuccessParams) {
          // Intentar desde mercadopagoSuccessParams
          try {
            const params = JSON.parse(mercadopagoSuccessParams)
            if (params.whatsappMessage) {
              foundMessage = params.whatsappMessage
              foundOrderData = parseWhatsAppOrderMessage(params.whatsappMessage)
              console.log('≡ƒöì DEBUG - Datos recuperados desde mercadopagoSuccessParams:', foundOrderData)
            }
          } catch (e) {
            console.warn('Error parseando mercadopagoSuccessParams:', e)
          }
        }
      } catch (e) {
        console.warn('Error recuperando mensaje desde localStorage:', e)
      }
    }

    // 3. Si tenemos mensaje, usarlo
    if (foundMessage && foundOrderData) {
      setRawMessage(foundMessage)
      setOrderData(foundOrderData)
      console.log('≡ƒöì DEBUG - Usando datos completos del mensaje')
    } else if (customerName || total) {
      // 4. Si no hay mensaje pero tenemos datos b├ísicos de la URL, crear datos b├ísicos
      setOrderData({
        orderNumber: orderId,
        total: total || '0',
        customerName: customerName || 'Cliente',
        phone: '',
        email: '',
        address: '',
        city: '',
        postalCode: '',
        products: [{
          name: 'Producto Pinteya',
          quantity: 1,
          price: total || '0'
        }],
        paymentMethod: 'Pago contra entrega'
      })
      console.log('≡ƒöì DEBUG - Usando datos b├ísicos de URL')
    } else {
      // 5. Si no hay nada, crear datos b├ísicos usando el orderId
      setOrderData({
        orderNumber: orderId,
        total: '0',
        customerName: 'Cliente',
        phone: '',
        email: '',
        address: '',
        city: '',
        postalCode: '',
        products: [{
          name: 'Producto Pinteya',
          quantity: 1,
          price: '0'
        }],
        paymentMethod: 'Pago contra entrega'
      })
      console.log('≡ƒöì DEBUG - Usando datos b├ísicos por defecto')
    }

    setLoading(false)
  }, [orderId, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blaze-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando detalles de la orden...</p>
          </div>
        </div>
      </div>
    )
  }

  // Ya no necesitamos esta verificaci├│n porque siempre creamos datos b├ísicos

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h1 className="text-3xl font-bold text-gray-900">
                  Orden #{orderData.orderNumber || orderId}
                </h1>
              </div>
              <p className="text-gray-600">Detalles de tu compra</p>
              {!rawMessage && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    Informaci├│n b├ísica disponible
                  </Badge>
                </div>
              )}
              {rawMessage && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    Informaci├│n completa disponible
                  </Badge>
                </div>
              )}
            </div>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-6">
          {/* Resumen de la Orden */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Resumen de la Orden
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-600">N├║mero de Orden:</span>
                <Badge variant="outline" className="font-mono">
                  #{orderData.orderNumber || orderId}
                </Badge>
              </div>
              {orderData.paymentMethod && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">M├⌐todo de Pago:</span>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-900">{orderData.paymentMethod}</span>
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${parseFloat(orderData.total.replace(/,/g, '.')).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Informaci├│n del Cliente */}
          {(orderData.customerName || orderData.email || orderData.phone) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informaci├│n del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {orderData.customerName && (
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-600">Nombre:</span>
                      <p className="text-sm text-gray-900">{orderData.customerName}</p>
                    </div>
                  </div>
                )}
                {orderData.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <p className="text-sm text-gray-900">{orderData.email}</p>
                    </div>
                  </div>
                )}
                {orderData.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-600">Tel├⌐fono:</span>
                      <p className="text-sm text-gray-900">{orderData.phone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Direcci├│n de Env├¡o */}
          {(orderData.address || orderData.city) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Direcci├│n de Env├¡o
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-900 space-y-1">
                  {orderData.address && <p>{orderData.address}</p>}
                  {orderData.city && <p>{orderData.city}</p>}
                  {orderData.postalCode && <p>CP: {orderData.postalCode}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Productos */}
          {orderData.products && orderData.products.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Productos ({orderData.products.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderData.products.map((product, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                        <div>
                          <h4 className="text-base font-medium text-gray-900">
                            {product.name}
                          </h4>
                          <p className="text-sm text-gray-600">Cantidad: {product.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          ${parseFloat(product.price.replace(/,/g, '.')).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total de productos */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">
                      Total de la Orden:
                    </span>
                    <span className="text-2xl font-bold text-gray-900">
                      ${parseFloat(orderData.total.replace(/,/g, '.')).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mensaje completo (solo para debug, puedes ocultarlo) */}
          {rawMessage && process.env.NODE_ENV === 'development' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Mensaje Original (Debug)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-4 rounded overflow-x-auto whitespace-pre-wrap">
                  {rawMessage}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
