// =====================================================
// COMPONENTE: SIMPLE PAGE LOADING
// Descripción: Loader minimalista para página de producto
// Propósito: Mantener layout mientras el modal está abierto
// =====================================================

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Loader2 } from 'lucide-react'

interface SimplePageLoadingProps {
  className?: string
  message?: string
}

export function SimplePageLoading({ 
  className,
  message = "Cargando producto..." 
}: SimplePageLoadingProps) {
  return (
    <div 
      className={cn(
        'w-full h-[60vh] bg-white flex items-center justify-center',
        className
      )} 
      role="status" 
      aria-label={message}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-orange-100 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
          </div>
        </div>
        
        {/* Texto */}
        <div className="text-center space-y-1">
          <p className="text-lg font-medium text-gray-900">
            {message}
          </p>
          <p className="text-sm text-gray-500">
            Por favor espera un momento
          </p>
        </div>
      </div>

      {/* Screen reader only */}
      <span className="sr-only">{message}</span>
    </div>
  )
}

export default SimplePageLoading

