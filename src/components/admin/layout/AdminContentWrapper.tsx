'use client'

import { cn } from '@/lib/core/utils'

interface AdminContentWrapperProps {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
  fullWidth?: boolean
}

/**
 * Wrapper mobile-first para contenido de paneles admin
 * 
 * Mobile (< 640px): px-2 py-4
 * Tablet (640-1024px): px-3 py-6
 * Desktop (> 1024px): full width sin max-width, px-4 py-6
 */
export function AdminContentWrapper({ 
  children, 
  className,
  noPadding = false,
  fullWidth = true 
}: AdminContentWrapperProps) {
  return (
    <div 
      className={cn(
        // Sin padding si se especifica - SIN padding-top
        !noPadding && 'px-3 pb-4 sm:px-4 sm:pb-6 lg:px-6 lg:pb-6',
        // Width completo del contenedor sin restricciones
        'w-full max-w-none',
        className
      )}
      style={{ width: '100%', maxWidth: 'none' }}
    >
      {children}
    </div>
  )
}

