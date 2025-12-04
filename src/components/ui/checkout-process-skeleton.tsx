// =====================================================
// COMPONENTE: CHECKOUT PROCESS SKELETON
// Descripción: Skeleton loader para el proceso de verificación de pago
// Propósito: Mejorar UX durante verificación de Mercado Pago
// =====================================================

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Loader2, CreditCard, Shield, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface CheckoutProcessSkeletonProps {
  className?: string
  message?: string
}

export function CheckoutProcessSkeleton({ 
  className,
  message = "Procesando tu pago..."
}: CheckoutProcessSkeletonProps) {
  return (
    <div className={cn('w-full max-w-3xl mx-auto space-y-6 py-8', className)} role="status" aria-label="Procesando pago...">
      {/* Mensaje principal con icono de carga */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader className="text-center pb-3">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
              <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                <Shield className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-gray-900">{message}</h3>
              <p className="text-sm text-gray-600">
                Estamos verificando tu pago con Mercado Pago, por favor espera...
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Skeleton del resumen de la orden */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-400" />
            <div className="h-6 bg-gray-300 rounded animate-pulse w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Skeleton de productos */}
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-16 w-16 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-4 bg-gray-300 rounded w-20" />
              </div>
            ))}
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 my-4" />

          {/* Skeleton de subtotal, envío, descuentos */}
          <div className="space-y-3">
            <div className="flex justify-between items-center animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
            <div className="flex justify-between items-center animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
            <div className="flex justify-between items-center animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-28" />
              <div className="h-4 bg-gray-200 rounded w-20" />
            </div>
          </div>

          {/* Separador */}
          <div className="border-t border-gray-200 my-4" />

          {/* Skeleton del total */}
          <div className="flex justify-between items-center">
            <div className="h-6 bg-gray-300 rounded animate-pulse w-32" />
            <div className="h-6 bg-gray-300 rounded animate-pulse w-28" />
          </div>
        </CardContent>
      </Card>

      {/* Skeleton de información de envío */}
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-300 rounded animate-pulse w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        </CardContent>
      </Card>

      {/* Skeleton del método de pago */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-gray-400" />
            <div className="h-6 bg-gray-300 rounded animate-pulse w-36" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Skeleton de la tarjeta de pago */}
            <div className="p-4 border-2 border-gray-200 rounded-lg animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-12 w-16 bg-gray-200 rounded" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Indicador de progreso */}
      <div className="space-y-2">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-blue-500 animate-pulse w-3/4" />
        </div>
        <p className="text-xs text-center text-gray-500">
          Verificando pago de forma segura...
        </p>
      </div>

      {/* Mensaje de seguridad */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-green-900">
              Transacción segura
            </p>
            <p className="text-xs text-green-700">
              Tu información está protegida con encriptación SSL y procesada de forma segura por Mercado Pago.
            </p>
          </div>
        </div>
      </div>

      {/* Screen reader only text */}
      <span className="sr-only">
        Procesando tu pago con Mercado Pago. Por favor no cierres esta ventana ni presiones el botón atrás.
      </span>
    </div>
  )
}

export default CheckoutProcessSkeleton

