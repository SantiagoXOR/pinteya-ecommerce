/**
 * Componente SafeImage - Wrapper de Next/Image con validación de URLs
 * 
 * Este componente:
 * 1. Valida URLs de imágenes antes de renderizar
 * 2. Corrige URLs malformadas de Supabase automáticamente
 * 3. Proporciona fallback automático para imágenes inválidas
 * 4. Maneja errores de carga gracefully
 */

'use client'

import Image, { ImageProps } from 'next/image'
import { useState, useMemo } from 'react'
import { getValidImageUrl } from '@/lib/adapters/product-adapter'

interface SafeImageProps extends Omit<ImageProps, 'src'> {
  src: string | undefined | null
  fallbackSrc?: string
}

export function SafeImage({ 
  src, 
  fallbackSrc = '/images/products/placeholder.svg',
  alt,
  onError,
  ...props 
}: SafeImageProps) {
  const [error, setError] = useState(false)
  
  // Validar y corregir la URL usando nuestra función de validación
  const validatedSrc = useMemo(() => {
    if (error) {
      return fallbackSrc
    }
    return getValidImageUrl(src, fallbackSrc)
  }, [src, fallbackSrc, error])
  
  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setError(true)
    
    // Log para debugging en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.error('[SafeImage] Error cargando imagen:', {
        attemptedSrc: src,
        validatedSrc,
        fallbackSrc,
        alt
      })
    }
    
    // Llamar al onError prop si existe
    if (onError) {
      onError(e)
    }
  }
  
  return (
    <Image
      {...props}
      src={validatedSrc}
      alt={alt}
      onError={handleError}
    />
  )
}

// Componente para mostrar imágenes de productos
export function ProductImage({
  src,
  alt,
  className,
  priority = false,
  ...props
}: Omit<SafeImageProps, 'fill'> & { 
  className?: string
  priority?: boolean
}) {
  return (
    <SafeImage
      src={src}
      alt={alt}
      className={className}
      priority={priority}
      {...props}
    />
  )
}

