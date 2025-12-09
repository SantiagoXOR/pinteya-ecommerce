/**
 * Modal de Nueva Orden - Panel Administrativo
 * Basado en mejores prácticas de e-commerce (Shopify, WooCommerce)
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Plus,
  Minus,
  Search,
  X,
  ShoppingCart,
  User,
  Package,
  CreditCard,
  Truck,
  Calculator,
} from '@/lib/optimized-imports'
import { useOrderNotifications } from '@/hooks/admin/useOrderNotifications'

// ===================================
// TIPOS
// ===================================

interface Product {
  id: number
  name: string
  price: number
  stock: number
  images?: string[]
  category?: {
    name: string
  }
}

interface Customer {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
}

interface OrderItem {
  product: Product
  quantity: number
  price: number
  total: number
}

interface NewOrderData {
  customer: Customer | null
  items: OrderItem[]
  shippingMethod: string
  paymentMethod: string
  notes: string
  discount: number
  shippingCost: number
}

interface NewOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderCreated: (order: any) => void
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const notifications = useOrderNotifications()

  // Estados principales
  const [orderData, setOrderData] = useState<NewOrderData>({
    customer: null,
    items: [],
    shippingMethod: 'standard',
    paymentMethod: 'cash',
    notes: '',
    discount: 0,
    shippingCost: 0,
  })

  // Estados de UI
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [productSearch, setProductSearch] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')

  // Estados de datos
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    if (isOpen) {
      loadInitialData()
    }
  }, [isOpen])

  useEffect(() => {
    // Filtrar productos por búsqueda
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(productSearch.toLowerCase())
    )
    setFilteredProducts(filtered)
  }, [products, productSearch])

  useEffect(() => {
    console.log('🔍 [NewOrderModal] Filtering customers:', { customers, customerSearch })
    // Filtrar clientes por búsqueda
    const filtered = customers.filter(
      customer =>
        customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        customer.email.toLowerCase().includes(customerSearch.toLowerCase())
    )
    console.log('✅ [NewOrderModal] Filtered customers:', filtered)
    setFilteredCustomers(filtered)
  }, [customers, customerSearch])

  // ===================================
  // FUNCIONES DE DATOS
  // ===================================

  const loadInitialData = async () => {
    try {
      setIsLoading(true)

      // Cargar productos
      const productsResponse = await fetch('/api/products?limit=100')
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData.data || [])
      }

      // Cargar clientes reales desde la base de datos
      try {
        console.log('📝 [NewOrderModal] Cargando clientes desde la base de datos...')
        const customersResponse = await fetch('/api/admin/customers')
        if (customersResponse.ok) {
          const customersData = await customersResponse.json()
          console.log('📝 [NewOrderModal] Clientes cargados:', customersData)
          setCustomers(customersData.data || [])
        } else {
          console.error(
            'Error loading customers:',
            customersResponse.status,
            customersResponse.statusText
          )
          // Fallback a clientes mock si falla la API
          const mockCustomers: Customer[] = [
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Juan Pérez',
              email: 'juan@example.com',
              phone: '+54 11 1234-5678',
              address: 'Av. Corrientes 1234, CABA',
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440002',
              name: 'María García',
              email: 'maria@example.com',
              phone: '+54 11 8765-4321',
              address: 'Av. Santa Fe 5678, CABA',
            },
            {
              id: '550e8400-e29b-41d4-a716-446655440003',
              name: 'Carlos López',
              email: 'carlos@example.com',
              phone: '+54 11 5555-5555',
              address: 'Av. Rivadavia 9999, CABA',
            },
          ]
          console.log('📝 [NewOrderModal] Usando clientes mock como fallback:', mockCustomers)
          setCustomers(mockCustomers)
        }
      } catch (customerError) {
        console.error('Error loading customers:', customerError)
        // Fallback a clientes mock en caso de error
        const mockCustomers: Customer[] = [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            name: 'Juan Pérez',
            email: 'juan@example.com',
            phone: '+54 11 1234-5678',
            address: 'Av. Corrientes 1234, CABA',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            name: 'María García',
            email: 'maria@example.com',
            phone: '+54 11 8765-4321',
            address: 'Av. Santa Fe 5678, CABA',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            name: 'Carlos López',
            email: 'carlos@example.com',
            phone: '+54 11 5555-5555',
            address: 'Av. Rivadavia 9999, CABA',
          },
        ]
        console.log('📝 [NewOrderModal] Usando clientes mock por error:', mockCustomers)
        setCustomers(mockCustomers)
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      notifications.showNetworkError('cargar datos iniciales')
    } finally {
      setIsLoading(false)
    }
  }

  // ===================================
  // FUNCIONES DE ORDEN
  // ===================================

  const addProductToOrder = (product: Product) => {
    const existingItem = orderData.items.find(item => item.product.id === product.id)

    if (existingItem) {
      updateItemQuantity(product.id, existingItem.quantity + 1)
    } else {
      const newItem: OrderItem = {
        product,
        quantity: 1,
        price: product.price,
        total: product.price,
      }

      setOrderData(prev => ({
        ...prev,
        items: [...prev.items, newItem],
      }))
    }
  }

  const updateItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromOrder(productId)
      return
    }

    setOrderData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.product.id === productId
          ? { ...item, quantity: newQuantity, total: item.price * newQuantity }
          : item
      ),
    }))
  }

  const removeItemFromOrder = (productId: number) => {
    setOrderData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.product.id !== productId),
    }))
  }

  const calculateTotals = () => {
    const subtotal = orderData.items.reduce((sum, item) => sum + item.total, 0)
    const discountAmount = (subtotal * orderData.discount) / 100
    const total = subtotal - discountAmount + orderData.shippingCost

    return {
      subtotal,
      discountAmount,
      total,
      itemCount: orderData.items.reduce((sum, item) => sum + item.quantity, 0),
    }
  }

  // ===================================
  // FUNCIONES DE ENVÍO
  // ===================================

  const createOrder = async () => {
    try {
      // Validaciones mejoradas
      if (!orderData.customer) {
        notifications.showValidationWarning('Debe seleccionar un cliente')
        return
      }

      if (orderData.items.length === 0) {
        notifications.showValidationWarning('Debe agregar al menos un producto')
        return
      }

      // Validar que el customer ID sea un UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(orderData.customer.id)) {
        notifications.showValidationWarning('ID de cliente inválido')
        return
      }

      // Validar que todos los productos tengan datos válidos
      for (const item of orderData.items) {
        if (!item.product.id || item.product.id <= 0) {
          notifications.showValidationWarning(`Producto inválido: ${item.product.name}`)
          return
        }
        if (item.quantity <= 0 || item.quantity > 99) {
          notifications.showValidationWarning(
            `Cantidad inválida para ${item.product.name}: debe ser entre 1 y 99`
          )
          return
        }
        if (item.price < 0) {
          notifications.showValidationWarning(`Precio inválido para ${item.product.name}`)
          return
        }
      }

      setIsLoading(true)
      const processingToast = notifications.showProcessingInfo('Creando orden')

      const totals = calculateTotals()

      // Preparar payload según el schema de la API
      const orderPayload = {
        user_id: orderData.customer.id,
        items: orderData.items.map(item => ({
          product_id: Number(item.product.id), // Asegurar que sea number
          quantity: Number(item.quantity), // Asegurar que sea number
          unit_price: Number(item.price), // Asegurar que sea number
        })),
        notes: orderData.notes || undefined,
      }

      console.log('📦 [NewOrderModal] Enviando payload:', orderPayload)
      console.log('📦 [NewOrderModal] Tipos de datos:', {
        user_id_type: typeof orderPayload.user_id,
        user_id_value: orderPayload.user_id,
        first_item: orderPayload.items[0]
          ? {
              product_id_type: typeof orderPayload.items[0].product_id,
              product_id_value: orderPayload.items[0].product_id,
              quantity_type: typeof orderPayload.items[0].quantity,
              unit_price_type: typeof orderPayload.items[0].unit_price,
            }
          : 'No items',
      })

      // Llamar a la API real para crear la orden
      const response = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ [NewOrderModal] Error de API:', errorData)

        // Manejo mejorado de errores específicos
        if (errorData.details && Array.isArray(errorData.details)) {
          const validationErrors = errorData.details
            .map((err: any) => `${err.path?.join('.')}: ${err.message}`)
            .join(', ')
          throw new Error(`Errores de validación: ${validationErrors}`)
        }

        throw new Error(errorData.error || 'Error al crear la orden')
      }

      const result = await response.json()
      const newOrder = result.data

      console.log('✅ [NewOrderModal] Orden creada exitosamente:', newOrder)

      // Cerrar toast de procesamiento
      processingToast.dismiss()

      notifications.showOrderCreated({
        orderId: newOrder.id,
        customerName: orderData.customer.name,
        amount: totals.total,
      })

      onOrderCreated(newOrder)
      handleClose()
    } catch (error) {
      console.error('❌ [NewOrderModal] Error creating order:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error interno del servidor'
      notifications.showOrderCreationError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setOrderData({
      customer: null,
      items: [],
      shippingMethod: 'standard',
      paymentMethod: 'cash',
      notes: '',
      discount: 0,
      shippingCost: 0,
    })
    setCurrentStep(1)
    setProductSearch('')
    setCustomerSearch('')
    onClose()
  }

  const totals = calculateTotals()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-hidden'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ShoppingCart className='h-5 w-5' />
            Nueva Orden Manual
          </DialogTitle>
        </DialogHeader>

        <div className='flex-1 overflow-hidden'>
          {/* Pasos del proceso */}
          <div className='flex items-center justify-center mb-6'>
            <div className='flex items-center space-x-4'>
              {[1, 2, 3].map(step => (
                <div key={step} className='flex items-center'>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-12 h-0.5 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <ScrollArea className='h-[500px] pr-4'>
            {/* Paso 1: Seleccionar Cliente */}
            {currentStep === 1 && (
              <div className='space-y-4'>
                <div className='flex items-center gap-2 mb-4'>
                  <User className='h-5 w-5' />
                  <h3 className='text-lg font-semibold'>Seleccionar Cliente</h3>
                </div>

                <div className='relative'>
                  <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Buscar cliente por nombre o email...'
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                    className='pl-10'
                  />
                </div>

                <div className='grid gap-3 max-h-80 overflow-y-auto'>
                  {filteredCustomers.map(customer => (
                    <Card
                      key={customer.id}
                      className={`cursor-pointer transition-colors ${
                        orderData.customer?.id === customer.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setOrderData(prev => ({ ...prev, customer }))}
                    >
                      <CardContent className='p-4'>
                        <div className='flex justify-between items-start'>
                          <div>
                            <h4 className='font-medium'>{customer.name}</h4>
                            <p className='text-sm text-gray-600'>{customer.email}</p>
                            {customer.phone && (
                              <p className='text-sm text-gray-600'>{customer.phone}</p>
                            )}
                          </div>
                          {orderData.customer?.id === customer.id && (
                            <Badge variant='default'>Seleccionado</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Paso 2: Agregar Productos */}
            {currentStep === 2 && (
              <div className='space-y-4'>
                <div className='flex items-center gap-2 mb-4'>
                  <Package className='h-5 w-5' />
                  <h3 className='text-lg font-semibold'>Agregar Productos</h3>
                </div>

                <div className='relative'>
                  <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    placeholder='Buscar productos...'
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className='pl-10'
                  />
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Lista de productos disponibles */}
                  <div>
                    <h4 className='font-medium mb-3'>Productos Disponibles</h4>
                    <div className='space-y-2 max-h-60 overflow-y-auto'>
                      {filteredProducts.map(product => (
                        <Card key={product.id} className='cursor-pointer hover:bg-gray-50'>
                          <CardContent className='p-3'>
                            <div className='flex justify-between items-center'>
                              <div className='flex-1'>
                                <h5 className='font-medium text-sm'>{product.name}</h5>
                                <p className='text-xs text-gray-600'>
                                  ${product.price.toLocaleString()} - Stock: {product.stock}
                                </p>
                              </div>
                              <Button
                                size='sm'
                                onClick={() => addProductToOrder(product)}
                                disabled={product.stock === 0}
                              >
                                <Plus className='h-4 w-4' />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Productos en la orden */}
                  <div>
                    <h4 className='font-medium mb-3'>Productos en la Orden</h4>
                    <div className='space-y-2 max-h-60 overflow-y-auto'>
                      {orderData.items.map(item => (
                        <Card key={item.product.id}>
                          <CardContent className='p-3'>
                            <div className='flex justify-between items-center'>
                              <div className='flex-1'>
                                <h5 className='font-medium text-sm'>{item.product.name}</h5>
                                <p className='text-xs text-gray-600'>
                                  ${item.price.toLocaleString()} x {item.quantity} = $
                                  {item.total.toLocaleString()}
                                </p>
                              </div>
                              <div className='flex items-center gap-2'>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() =>
                                    updateItemQuantity(item.product.id, item.quantity - 1)
                                  }
                                >
                                  <Minus className='h-3 w-3' />
                                </Button>
                                <span className='text-sm font-medium w-8 text-center'>
                                  {item.quantity}
                                </span>
                                <Button
                                  size='sm'
                                  variant='outline'
                                  onClick={() =>
                                    updateItemQuantity(item.product.id, item.quantity + 1)
                                  }
                                  disabled={item.quantity >= item.product.stock}
                                >
                                  <Plus className='h-3 w-3' />
                                </Button>
                                <Button
                                  size='sm'
                                  variant='destructive'
                                  onClick={() => removeItemFromOrder(item.product.id)}
                                >
                                  <X className='h-3 w-3' />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {orderData.items.length === 0 && (
                        <p className='text-sm text-gray-500 text-center py-4'>
                          No hay productos agregados
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Paso 3: Configuración Final */}
            {currentStep === 3 && (
              <div className='space-y-6'>
                <div className='flex items-center gap-2 mb-4'>
                  <Calculator className='h-5 w-5' />
                  <h3 className='text-lg font-semibold'>Configuración Final</h3>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Configuración de envío y pago */}
                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor='shipping-method'>Método de Envío</Label>
                      <Select
                        value={orderData.shippingMethod}
                        onValueChange={value =>
                          setOrderData(prev => ({ ...prev, shippingMethod: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='standard'>Envío Estándar (Gratis)</SelectItem>
                          <SelectItem value='express'>Envío Express (+$500)</SelectItem>
                          <SelectItem value='pickup'>Retiro en Tienda</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor='payment-method'>Método de Pago</Label>
                      <Select
                        value={orderData.paymentMethod}
                        onValueChange={value =>
                          setOrderData(prev => ({ ...prev, paymentMethod: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='cash'>Efectivo</SelectItem>
                          <SelectItem value='card'>Tarjeta</SelectItem>
                          <SelectItem value='transfer'>Transferencia</SelectItem>
                          <SelectItem value='mercadopago'>MercadoPago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor='discount'>Descuento (%)</Label>
                      <Input
                        id='discount'
                        type='number'
                        min='0'
                        max='100'
                        value={orderData.discount}
                        onChange={e =>
                          setOrderData(prev => ({ ...prev, discount: Number(e.target.value) }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor='shipping-cost'>Costo de Envío</Label>
                      <Input
                        id='shipping-cost'
                        type='number'
                        min='0'
                        value={orderData.shippingCost}
                        onChange={e =>
                          setOrderData(prev => ({ ...prev, shippingCost: Number(e.target.value) }))
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor='notes'>Notas de la Orden</Label>
                      <Textarea
                        id='notes'
                        placeholder='Notas adicionales...'
                        value={orderData.notes}
                        onChange={e => setOrderData(prev => ({ ...prev, notes: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Resumen de la orden */}
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-lg'>Resumen de la Orden</CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-3'>
                        <div className='flex justify-between'>
                          <span>Cliente:</span>
                          <span className='font-medium'>{orderData.customer?.name}</span>
                        </div>
                        <div className='flex justify-between'>
                          <span>Productos:</span>
                          <span>{totals.itemCount} items</span>
                        </div>
                        <Separator />
                        <div className='flex justify-between'>
                          <span>Subtotal:</span>
                          <span>${totals.subtotal.toLocaleString()}</span>
                        </div>
                        {orderData.discount > 0 && (
                          <div className='flex justify-between text-green-600'>
                            <span>Descuento ({orderData.discount}%):</span>
                            <span>-${totals.discountAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className='flex justify-between'>
                          <span>Envío:</span>
                          <span>${orderData.shippingCost.toLocaleString()}</span>
                        </div>
                        <Separator />
                        <div className='flex justify-between text-lg font-semibold'>
                          <span>Total:</span>
                          <span>${totals.total.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter className='flex justify-between'>
          <div className='flex gap-2'>
            {currentStep > 1 && (
              <Button
                variant='outline'
                onClick={() => setCurrentStep(prev => prev - 1)}
                disabled={isLoading}
              >
                Anterior
              </Button>
            )}
          </div>

          <div className='flex gap-2'>
            <Button variant='outline' onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={
                  isLoading ||
                  (currentStep === 1 && !orderData.customer) ||
                  (currentStep === 2 && orderData.items.length === 0)
                }
              >
                Siguiente
              </Button>
            ) : (
              <Button
                onClick={createOrder}
                disabled={isLoading || !orderData.customer || orderData.items.length === 0}
              >
                {isLoading ? 'Creando...' : 'Crear Orden'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
