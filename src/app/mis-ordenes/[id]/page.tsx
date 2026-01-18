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
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

  useEffect(() => {
    const loadOrderData = async () => {
      const message = searchParams.get('message')
      const customerName = searchParams.get('customerName')
      const total = searchParams.get('total')

      console.log('🔍 DEBUG - Parámetros URL:', { message, customerName, total, orderId })

      // 1. PRIMERO: Intentar obtener datos desde la API (base de datos)
      try {
        const response = await fetch(`/api/orders/${orderId}`)
        const result = await response.json()

        if (result.success && result.data) {
          const order = result.data
          console.log('✅ DEBUG - Orden obtenida de la API:', order)

          // Construir datos desde la orden de la BD
          const products = (order.order_items || []).map((item: any) => {
            // Usar total_price si existe (precio total del item), sino calcular: price * quantity
            const itemPrice = item.total_price || (item.price && item.quantity ? (Number(item.price) * Number(item.quantity)) : Number(item.price) || 0)
            
            // Construir nombre del producto con detalles de la variante si están disponibles
            let productName = item.product_name || 'Producto'
            if (item.product_snapshot) {
              const details = []
              if (item.product_snapshot.color) details.push(`Color: ${item.product_snapshot.color}`)
              if (item.product_snapshot.finish) details.push(`Terminación: ${item.product_snapshot.finish}`)
              if (item.product_snapshot.medida) details.push(`Medida: ${item.product_snapshot.medida}`)
              if (item.product_snapshot.brand) details.push(`Marca: ${item.product_snapshot.brand}`)
              if (details.length > 0) {
                productName += ` (${details.join(', ')})`
              }
            }
            
            return {
              name: productName,
              quantity: item.quantity || 1,
              price: itemPrice.toString(),
              imageUrl: item.image_url || null
            }
          })

          const payerInfo = order.payer_info || {}
          const shippingAddress = order.shipping_address || {}

          // Construir dirección completa
          let fullAddress = ''
          // Si street_name tiene contenido, usarlo aunque street_number esté vacío
          if (shippingAddress.street_name) {
            // Verificar si street_number existe y no está vacío
            if (shippingAddress.street_number && shippingAddress.street_number.trim()) {
              fullAddress = `${shippingAddress.street_name} ${shippingAddress.street_number}`
              if (shippingAddress.apartment) {
                fullAddress += `, ${shippingAddress.apartment}`
              }
            } else {
              // Usar street_name directamente si contiene toda la dirección
              fullAddress = shippingAddress.street_name
              if (shippingAddress.apartment) {
                fullAddress += `, ${shippingAddress.apartment}`
              }
            }
          } else if (shippingAddress.address) {
            fullAddress = shippingAddress.address
          }

          const orderDataFromDB: ParsedOrderData = {
            orderNumber: order.order_number || order.external_reference || orderId,
            total: (order.total || 0).toString(),
            customerName: payerInfo.name ? `${payerInfo.name} ${payerInfo.surname || ''}`.trim() : customerName || 'Cliente',
            phone: payerInfo.phone || '',
            email: payerInfo.email || '',
            address: fullAddress,
            city: shippingAddress.city_name || shippingAddress.city || shippingAddress.state_name || '',
            postalCode: shippingAddress.zip_code || shippingAddress.postalCode || '',
            products: products.length > 0 ? products : [{
              name: 'Producto',
              quantity: 1,
              price: (order.total || 0).toString()
            }],
            paymentMethod: (() => {
              // Traducir método de pago a español legible
              const method = order.payment_method || order.payment_status || 'cash'
              if (method === 'cash' || method === 'cash_on_delivery') {
                return 'Pago al recibir'
              }
              if (method === 'mercadopago') {
                return 'MercadoPago'
              }
              if (method === 'credit_card') {
                return 'Tarjeta de crédito'
              }
              if (method === 'debit_card') {
                return 'Tarjeta de débito'
              }
              return method // Mantener el valor original si no coincide con ningún patrón conocido
            })()
          }

          setOrderData(orderDataFromDB)
          if (order.whatsapp_message) {
            setRawMessage(order.whatsapp_message)
          }
          setLoading(false)
          return // Salir temprano si tenemos datos de la BD
        }
      } catch (error) {
        console.warn('⚠️ DEBUG - Error obteniendo orden de la API, usando fallback:', error)
      }

      // 2. FALLBACK: Intentar desde parámetros URL o localStorage
      let foundMessage = ''
      let foundOrderData: ParsedOrderData | null = null

      if (message) {
        // Decodificar el mensaje que viene de la URL
        try {
          foundMessage = decodeURIComponent(message)
        } catch (e) {
          // Si falla la decodificación, usar el mensaje tal cual
          foundMessage = message
        }
        foundOrderData = parseWhatsAppOrderMessage(foundMessage)
        console.log('🔍 DEBUG - Mensaje desde URL (decodificado):', foundMessage)
      } else {
      // 2. Intentar desde localStorage con clave del orderId
      try {
        console.log('🔍 DEBUG - Buscando en localStorage con clave:', `order_message_${orderId}`)
        const savedMessage = localStorage.getItem(`order_message_${orderId}`)
        console.log('🔍 DEBUG - Mensaje desde localStorage:', savedMessage)
        
        // También buscar con otras posibles claves
        const allKeys = Object.keys(localStorage)
        const orderKeys = allKeys.filter(key => key.includes('order_message_'))
        console.log('🔍 DEBUG - Todas las claves de orden en localStorage:', orderKeys)
        
        // Buscar también en cashSuccessParams
        const cashSuccessParams = localStorage.getItem('cashSuccessParams')
        console.log('🔍 DEBUG - cashSuccessParams:', cashSuccessParams)
        
        // Buscar también en cashOrderData
        const cashOrderData = localStorage.getItem('cashOrderData')
        console.log('🔍 DEBUG - cashOrderData:', cashOrderData)
        
        // Buscar también en mercadopagoSuccessParams
        const mercadopagoSuccessParams = localStorage.getItem('mercadopagoSuccessParams')
        console.log('🔍 DEBUG - mercadopagoSuccessParams:', mercadopagoSuccessParams)
        
        if (savedMessage) {
          foundMessage = savedMessage
          foundOrderData = parseWhatsAppOrderMessage(savedMessage)
          console.log('🔍 DEBUG - Datos parseados desde localStorage:', foundOrderData)
        } else if (cashSuccessParams) {
          // Intentar desde cashSuccessParams
          try {
            const params = JSON.parse(cashSuccessParams)
            if (params.whatsappMessage) {
              foundMessage = params.whatsappMessage
              foundOrderData = parseWhatsAppOrderMessage(params.whatsappMessage)
              console.log('🔍 DEBUG - Datos recuperados desde cashSuccessParams:', foundOrderData)
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
              console.log('🔍 DEBUG - Datos recuperados desde cashOrderData:', foundOrderData)
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
              console.log('🔍 DEBUG - Datos recuperados desde mercadopagoSuccessParams:', foundOrderData)
            }
          } catch (e) {
            console.warn('Error parseando mercadopagoSuccessParams:', e)
          }
        }
      } catch (e) {
        console.warn('Error recuperando mensaje desde localStorage:', e)
      }
      }

      // 3. Si tenemos mensaje, usarlo como fallback
      if (foundMessage && foundOrderData) {
        setRawMessage(foundMessage)
        setOrderData(foundOrderData)
        console.log('🔍 DEBUG - Usando datos completos del mensaje (fallback)')
      } else if (customerName || total) {
        // 4. Si no hay mensaje pero tenemos datos básicos de la URL, crear datos básicos
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
        console.log('🔍 DEBUG - Usando datos básicos de URL')
      } else {
        // 5. Si no hay nada, crear datos básicos usando el orderId
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
        console.log('🔍 DEBUG - Usando datos básicos por defecto')
      }

      setLoading(false)
    }

    loadOrderData()
  }, [orderId, searchParams])

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blaze-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando detalles de la orden...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-4xl mx-auto px-8 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">No se encontraron datos de la orden</p>
            <Link href="/mis-ordenes">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Mis Órdenes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h1 className="text-3xl font-bold text-white">
                  Orden #{orderData.orderNumber || orderId}
                </h1>
              </div>
              <p className="text-gray-600">Detalles de tu compra</p>
              {!rawMessage && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                    Información básica disponible
                  </Badge>
                </div>
              )}
              {rawMessage && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    Información completa disponible
                  </Badge>
                </div>
              )}
            </div>
            <Link href="/mis-ordenes">
              <Button className="bg-blaze-orange-600 text-white hover:bg-blaze-orange-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Mis Órdenes
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
                <span className="text-sm font-medium text-gray-600">Número de Orden:</span>
                <Badge variant="outline" className="font-mono">
                  #{orderData.orderNumber || orderId}
                </Badge>
              </div>
              {orderData.paymentMethod && (
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Método de Pago:</span>
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
                  ${(() => {
                    // Manejar diferentes formatos de total (número, string con comas, string con puntos)
                    let totalNum: number
                    if (typeof orderData.total === 'number') {
                      totalNum = orderData.total
                    } else {
                      // Verificar si el string ya es un número válido con punto decimal (ej: "64050.00")
                      const isNumericWithDecimal = /^\d+\.\d+$/.test(orderData.total)
                      if (isNumericWithDecimal) {
                        // Parsear directamente sin eliminar puntos
                        totalNum = parseFloat(orderData.total) || 0
                      } else {
                        // Formato español con miles (ej: "64.050,00") - eliminar puntos y reemplazar coma
                        const cleaned = orderData.total.replace(/\./g, '').replace(',', '.')
                        totalNum = parseFloat(cleaned) || 0
                      }
                    }
                    return totalNum.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  })()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Información del Cliente */}
          {(orderData.customerName || orderData.email || orderData.phone) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Información del Cliente
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
                {orderData.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <div>
                      <span className="text-sm font-medium text-gray-600">Teléfono:</span>
                      <p className="text-sm text-gray-900">{orderData.phone}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dirección de Envío */}
          {(orderData.address || orderData.city) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Dirección de Envío
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
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                          {product.imageUrl && !imageErrors[index] ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              onError={() => {
                                setImageErrors(prev => ({ ...prev, [index]: true }))
                              }}
                            />
                          ) : (
                            <Package className="w-6 h-6 text-gray-400" />
                          )}
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
                          ${(() => {
                            // Manejar diferentes formatos de precio (número, string con comas, string con puntos)
                            let priceNum: number
                            if (typeof product.price === 'number') {
                              priceNum = product.price
                            } else {
                              // Verificar si el string ya es un número válido con punto decimal (ej: "64050.00")
                              const isNumericWithDecimal = /^\d+\.\d+$/.test(product.price)
                              if (isNumericWithDecimal) {
                                // Parsear directamente sin eliminar puntos
                                priceNum = parseFloat(product.price) || 0
                              } else {
                                // Formato español con miles (ej: "64.050,00") - eliminar puntos y reemplazar coma
                                const cleaned = product.price.replace(/\./g, '').replace(',', '.')
                                priceNum = parseFloat(cleaned) || 0
                              }
                            }
                            return priceNum.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          })()}
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
                      ${(() => {
                        // Manejar diferentes formatos de total
                        let totalNum: number
                        if (typeof orderData.total === 'number') {
                          totalNum = orderData.total
                        } else {
                          // Verificar si el string ya es un número válido con punto decimal (ej: "64050.00")
                          const isNumericWithDecimal = /^\d+\.\d+$/.test(orderData.total)
                          if (isNumericWithDecimal) {
                            // Parsear directamente sin eliminar puntos
                            totalNum = parseFloat(orderData.total) || 0
                          } else {
                            // Formato español con miles (ej: "64.050,00") - eliminar puntos y reemplazar coma
                            const cleaned = orderData.total.replace(/\./g, '').replace(',', '.')
                            totalNum = parseFloat(cleaned) || 0
                          }
                        }
                        return totalNum.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      })()}
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
