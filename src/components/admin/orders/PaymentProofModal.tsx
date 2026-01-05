'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CreditCard, ExternalLink, Download } from '@/lib/optimized-imports'
import { toast } from 'sonner'

interface PaymentProofModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: number
}

export const PaymentProofModal: React.FC<PaymentProofModalProps> = ({
  isOpen,
  onClose,
  orderId,
}) => {
  const [paymentData, setPaymentData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen && orderId) {
      loadPaymentProof()
    }
  }, [isOpen, orderId])

  const loadPaymentProof = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/admin/orders/${orderId}/payment-proof`)

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setPaymentData(data.data)
        } else {
          toast.error(data.error || 'No se pudo cargar el comprobante')
        }
      } else {
        toast.error('Error al cargar el comprobante de pago')
      }
    } catch (error) {
      console.error('Error loading payment proof:', error)
      toast.error('Error al cargar el comprobante')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <CreditCard className='h-5 w-5' />
            Comprobante de Pago
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        ) : paymentData ? (
          <div className='space-y-4'>
            {/* Header con estado */}
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-600'>ID de Transacción</p>
                <p className='font-mono text-lg font-bold'>{paymentData.payment_id}</p>
              </div>
              <Badge className={getStatusColor(paymentData.status)}>
                {paymentData.status.toUpperCase()}
              </Badge>
            </div>

            <Separator />

            {/* Información del pago */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Información del Pago</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Monto:</span>
                  <span className='font-bold text-lg'>
                    {paymentData.currency_id}{' '}
                    {paymentData.transaction_amount.toLocaleString('es-AR')}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Método de Pago:</span>
                  <span className='font-medium'>{paymentData.payment_method_id}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Tipo de Pago:</span>
                  <span className='font-medium'>{paymentData.payment_type_id}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Fecha de Creación:</span>
                  <span className='font-medium'>
                    {new Date(paymentData.date_created).toLocaleString('es-AR')}
                  </span>
                </div>
                {paymentData.date_approved && (
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Fecha de Aprobación:</span>
                    <span className='font-medium'>
                      {new Date(paymentData.date_approved).toLocaleString('es-AR')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información del pagador */}
            <Card>
              <CardHeader>
                <CardTitle className='text-base'>Información del Pagador</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Nombre:</span>
                  <span className='font-medium'>
                    {paymentData.payer.first_name} {paymentData.payer.last_name}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>Email:</span>
                  <span className='font-medium'>{paymentData.payer.email}</span>
                </div>
                {paymentData.payer.identification && (
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Identificación:</span>
                    <span className='font-medium'>
                      {paymentData.payer.identification.type}{' '}
                      {paymentData.payer.identification.number}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Acciones */}
            <div className='flex gap-3'>
              <Button
                variant='outline'
                className='flex-1'
                onClick={() => window.open(paymentData.external_url, '_blank')}
              >
                <ExternalLink className='h-4 w-4 mr-2' />
                Ver en MercadoPago
              </Button>
              <Button
                variant='outline'
                onClick={() => {
                  window.print()
                }}
              >
                <Download className='h-4 w-4 mr-2' />
                Imprimir
              </Button>
            </div>
          </div>
        ) : (
          <div className='text-center py-12 text-gray-500'>
            No se pudo cargar el comprobante de pago
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}



