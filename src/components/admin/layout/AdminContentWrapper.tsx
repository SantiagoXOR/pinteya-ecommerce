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
 * Mobile (< 640px): px-4 py-4
 * Tablet (640-1024px): px-6 py-6
 * Desktop (> 1024px): max-w-7xl mx-auto px-8 py-6
 */
export function AdminContentWrapper({ 
  children, 
  className,
  noPadding = false,
  fullWidth = false 
}: AdminContentWrapperProps) {
  return (
    <div 
      className={cn(
        // Sin padding si se especifica - SIN padding-top
        !noPadding && 'px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-6',
        // Max width en desktop (a menos que sea fullWidth)
        !fullWidth && 'max-w-7xl mx-auto',
        // Width completo del contenedor
        'w-full',
        className
      )}
    >
      {children}
    </div>
  )
}

