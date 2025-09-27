'use client'

import React from 'react'
import { Package, Truck, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

export interface OrderStatus {
  id: string
  status:
    | 'pending'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled'
    | 'refunded'
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded'
  fulfillment_status?: 'unfulfilled' | 'partial' | 'fulfilled' | 'returned'
  order_number?: string
  tracking_number?: string
  carrier?: string
  estimated_delivery?: string
  created_at: string
  updated_at: string
}

interface OrderTrackerProps {
  order: OrderStatus
  className?: string
  showDetails?: boolean
}

// Configuración de estados
const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    color: 'bg-yellow-500',
    icon: Clock,
    description: 'Tu pedido está siendo procesado',
  },
  confirmed: {
    label: 'Confirmado',
    color: 'bg-blue-500',
    icon: CheckCircle,
    description: 'Tu pedido ha sido confirmado',
  },
  processing: {
    label: 'En Preparación',
    color: 'bg-purple-500',
    icon: Package,
    description: 'Estamos preparando tu pedido',
  },
  shipped: {
    label: 'Enviado',
    color: 'bg-indigo-500',
    icon: Truck,
    description: 'Tu pedido está en camino',
  },
  delivered: {
    label: 'Entregado',
    color: 'bg-green-500',
    icon: CheckCircle,
    description: 'Tu pedido ha sido entregado',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-500',
    icon: XCircle,
    description: 'Tu pedido ha sido cancelado',
  },
  refunded: {
    label: 'Reembolsado',
    color: 'bg-gray-500',
    icon: AlertCircle,
    description: 'Tu pedido ha sido reembolsado',
  },
}

const PAYMENT_STATUS_CONFIG = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  paid: { label: 'Pagado', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Falló', color: 'bg-red-100 text-red-800' },
  refunded: { label: 'Reembolsado', color: 'bg-gray-100 text-gray-800' },
}

// Orden de estados para el progreso
const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

export function OrderTracker({ order, className = '', showDetails = true }: OrderTrackerProps) {
  const currentStatusConfig = STATUS_CONFIG[order.status]
  const paymentStatusConfig = PAYMENT_STATUS_CONFIG[order.payment_status]

  // Calcular progreso
  const currentStatusIndex = STATUS_ORDER.indexOf(order.status)
  const progress =
    order.status === 'cancelled' || order.status === 'refunded'
      ? 0
      : ((currentStatusIndex + 1) / STATUS_ORDER.length) * 100

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Obtener estados completados
  const getCompletedSteps = () => {
    if (order.status === 'cancelled' || order.status === 'refunded') {
      return []
    }
    return STATUS_ORDER.slice(0, currentStatusIndex + 1)
  }

  const completedSteps = getCompletedSteps()

  return (
    <Card className={className}>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center space-x-2'>
              <currentStatusConfig.icon className='w-5 h-5' />
              <span>Estado del Pedido</span>
              {order.order_number && <Badge variant='outline'>#{order.order_number}</Badge>}
            </CardTitle>
            <CardDescription>{currentStatusConfig.description}</CardDescription>
          </div>
          <div className='text-right'>
            <Badge className={currentStatusConfig.color}>{currentStatusConfig.label}</Badge>
            <Badge className={`ml-2 ${paymentStatusConfig.color}`}>
              {paymentStatusConfig.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Barra de progreso */}
        {order.status !== 'cancelled' && order.status !== 'refunded' && (
          <div className='space-y-2'>
            <div className='flex justify-between text-sm text-gray-600'>
              <span>Progreso del pedido</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className='h-2' />
          </div>
        )}

        {/* Timeline de estados */}
        <div className='space-y-4'>
          {STATUS_ORDER.map((status, index) => {
            const statusConfig = STATUS_CONFIG[status]
            const isCompleted = completedSteps.includes(status)
            const isCurrent = order.status === status
            const isDisabled = order.status === 'cancelled' || order.status === 'refunded'

            return (
              <div key={status} className='flex items-center space-x-4'>
                <div
                  className={`
                  flex items-center justify-center w-8 h-8 rounded-full border-2
                  ${
                    isCompleted && !isDisabled
                      ? `${statusConfig.color} border-transparent text-white`
                      : isCurrent && !isDisabled
                        ? `border-current ${statusConfig.color.replace('bg-', 'text-')} bg-white`
                        : 'border-gray-300 bg-gray-100 text-gray-400'
                  }
                `}
                >
                  <statusConfig.icon className='w-4 h-4' />
                </div>
                <div className='flex-1'>
                  <p
                    className={`font-medium ${
                      isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {statusConfig.label}
                  </p>
                  <p className='text-sm text-gray-600'>{statusConfig.description}</p>
                </div>
                {isCurrent && (
                  <div className='text-sm text-gray-500'>{formatDate(order.updated_at)}</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Información adicional */}
        {showDetails && (
          <>
            <Separator />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
              <div>
                <p className='font-medium text-gray-900'>Información del pedido</p>
                <div className='mt-2 space-y-1 text-gray-600'>
                  <p>Creado: {formatDate(order.created_at)}</p>
                  <p>Actualizado: {formatDate(order.updated_at)}</p>
                  {order.fulfillment_status && (
                    <p>Estado de cumplimiento: {order.fulfillment_status}</p>
                  )}
                </div>
              </div>

              {(order.tracking_number || order.carrier || order.estimated_delivery) && (
                <div>
                  <p className='font-medium text-gray-900'>Información de envío</p>
                  <div className='mt-2 space-y-1 text-gray-600'>
                    {order.tracking_number && <p>Número de seguimiento: {order.tracking_number}</p>}
                    {order.carrier && <p>Transportista: {order.carrier}</p>}
                    {order.estimated_delivery && (
                      <p>Entrega estimada: {formatDate(order.estimated_delivery)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Acciones según el estado */}
        {order.tracking_number && order.status === 'shipped' && (
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <div className='flex items-center space-x-2'>
              <Truck className='w-5 h-5 text-blue-600' />
              <div>
                <p className='font-medium text-blue-900'>Tu pedido está en camino</p>
                <p className='text-sm text-blue-700'>
                  Puedes rastrear tu envío con el número: {order.tracking_number}
                </p>
              </div>
            </div>
          </div>
        )}

        {order.status === 'delivered' && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <div className='flex items-center space-x-2'>
              <CheckCircle className='w-5 h-5 text-green-600' />
              <div>
                <p className='font-medium text-green-900'>¡Pedido entregado!</p>
                <p className='text-sm text-green-700'>
                  Esperamos que disfrutes tu compra. ¿Te gustaría dejarnos una reseña?
                </p>
              </div>
            </div>
          </div>
        )}

        {(order.status === 'cancelled' || order.status === 'refunded') && (
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center space-x-2'>
              <XCircle className='w-5 h-5 text-red-600' />
              <div>
                <p className='font-medium text-red-900'>
                  Pedido {order.status === 'cancelled' ? 'cancelado' : 'reembolsado'}
                </p>
                <p className='text-sm text-red-700'>
                  {order.status === 'cancelled'
                    ? 'Tu pedido ha sido cancelado. Si tienes preguntas, contáctanos.'
                    : 'El reembolso ha sido procesado. Puede tardar algunos días en reflejarse.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
