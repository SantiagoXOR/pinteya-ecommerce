'use client'

import React from 'react'
import Image from 'next/image'
import { AlertCircle } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'
import { getValidImageUrl } from '@/lib/adapters/product-adapter'
import type { ProductCardImageProps } from '../types'

/**
 * Valida si una URL es válida para Next.js Image
 * Verifica que sea una URL absoluta válida o una ruta relativa
 */
function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  // Rutas relativas siempre son válidas
  if (url.startsWith('/')) return true
  
  // Verificar que sea una URL absoluta válida
  try {
    const parsedUrl = new URL(url)
    // Verificar que tenga protocolo http/https
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Componente de imagen del ProductCard
 * Maneja fallbacks y errores de carga
 */
export const ProductCardImage = React.memo(function ProductCardImage({
  image,
  title,
  productId,
  onImageError,
  imageError = false,
  currentImageSrc
}: ProductCardImageProps) {
  // ✅ FIX: Validar y corregir URL antes de pasarla a Next.js Image
  const rawSrc = currentImageSrc || image || '/images/products/placeholder.svg'
  const displaySrc = React.useMemo(() => {
    // Validar URL usando la función de validación existente
    const validated = getValidImageUrl(rawSrc, '/images/products/placeholder.svg')
    
    // Verificar que la URL validada sea válida para Next.js Image
    if (!isValidImageUrl(validated)) {
      console.warn('[ProductCardImage] URL inválida detectada, usando placeholder', {
        original: rawSrc,
        validated,
        productId
      })
      return '/images/products/placeholder.svg'
    }
    
    return validated
  }, [rawSrc, productId])

  const handleLoad = React.useCallback(() => {
    // Imagen cargada exitosamente - no requiere logging
  }, [])

  // ✅ FIX: Manejar errores de carga de imagen de forma más robusta
  const [hasImageError, setHasImageError] = React.useState(imageError)
  
  const handleImageError = React.useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setHasImageError(true)
    // Llamar al callback de error si existe
    if (onImageError) {
      onImageError(e)
    }
    // Log para debugging en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.warn('[ProductCardImage] Error cargando imagen:', {
        src: displaySrc,
        productId,
        title
      })
    }
  }, [displaySrc, productId, title, onImageError])

  // Resetear error si cambia la imagen
  React.useEffect(() => {
    setHasImageError(false)
  }, [displaySrc])

  return (
    <div className='relative w-full h-full flex justify-center items-center'>
      <div className='relative w-full h-full flex items-center justify-center p-0.5 sm:p-1.5 md:p-5 card-image-depth'>
        {displaySrc && !hasImageError && displaySrc !== '/images/products/placeholder.svg' ? (
          <Image
            src={displaySrc}
            alt={title || 'Producto'}
            width={320}
            height={320}
            className={cn(
              'object-contain z-0',
              // ⚡ OPTIMIZACIÓN: Deshabilitar transición durante scroll para mejor rendimiento
              'transition-transform duration-300 ease-out'
            )}
            // ⚡ FASE 14: sizes optimizado para dimensiones reales de productos (308x308 según reporte)
            // Esto reduce el tamaño de descarga al servir imágenes del tamaño correcto
            sizes="(max-width: 640px) 308px, (max-width: 1024px) 308px, 320px"
            priority={false}
            loading="lazy" // MULTITENANT: Lazy loading para todas excepto LCP candidate
            decoding="async" // ⚡ OPTIMIZACIÓN: Decodificar imagen de forma asíncrona para no bloquear render
            quality={65} // ⚡ FASE 14: Optimizado para thumbnails (ahorro adicional de ~5-10% tamaño)
            fetchPriority="low" // Below-fold: no competir con LCP
            onError={handleImageError}
            onLoad={handleLoad}
            // ✅ FIX: Usar unoptimized para URLs que pueden causar problemas con Next.js Image
            // Esto evita errores 400 cuando Next.js intenta optimizar imágenes remotas problemáticas
            unoptimized={displaySrc.startsWith('http') && !displaySrc.includes('supabase.co') && !displaySrc.includes('pinteya.com')}
            style={{ objectFit: 'contain', maxHeight: '100%', maxWidth: '100%', aspectRatio: '1/1' }}
          />
        ) : (
          <div className='flex items-center justify-center w-full h-full z-0 bg-gray-50'>
            <div className='text-center p-4'>
              <AlertCircle className='w-8 h-8 text-gray-400 mx-auto mb-2' />
              <p className='text-xs text-gray-500'>Imagen no disponible</p>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.image === nextProps.image &&
    prevProps.currentImageSrc === nextProps.currentImageSrc &&
    prevProps.imageError === nextProps.imageError &&
    prevProps.title === nextProps.title &&
    prevProps.productId === nextProps.productId &&
    prevProps.onImageError === nextProps.onImageError
  )
})

ProductCardImage.displayName = 'ProductCardImage'

