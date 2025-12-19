'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, AlertCircle, Star, Trash2 } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface ProductImage {
  id: string
  url: string
  alt_text?: string | null
  is_primary: boolean
  display_order: number
  file_size?: number
  file_type?: string
}

interface ProductImageGalleryProps {
  productId: string
  className?: string
  maxImages?: number
}

/**
 * Procesa una imagen para que tenga fondo blanco y formato 1:1
 * Si la imagen no es cuadrada, la centra en un canvas blanco
 */
async function processImageToSquare(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new window.Image()

    if (!ctx) {
      resolve(file) // Fallback si no hay canvas
      return
    }

    img.onload = () => {
      try {
        // Determinar el tamaño del canvas (el lado más grande)
        const maxSize = Math.max(img.width, img.height)
        canvas.width = maxSize
        canvas.height = maxSize

        // Rellenar con fondo blanco
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, maxSize, maxSize)

        // Calcular posición para centrar la imagen
        const x = (maxSize - img.width) / 2
        const y = (maxSize - img.height) / 2

        // Dibujar la imagen centrada
        ctx.drawImage(img, x, y, img.width, img.height)

        // Convertir a blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now(),
              })
              resolve(processedFile)
            } else {
              resolve(file) // Fallback si falla la conversión
            }
          },
          'image/webp',
          0.92 // Calidad alta
        )
      } catch (error) {
        console.warn('Error procesando imagen, usando original:', error)
        resolve(file) // Fallback en caso de error
      }
    }

    img.onerror = () => {
      resolve(file) // Fallback si falla la carga
    }

    // Cargar imagen
    img.src = URL.createObjectURL(file)
  })
}

export function ProductImageGallery({
  productId,
  className,
  maxImages = 10,
}: ProductImageGalleryProps) {
  const queryClient = useQueryClient()
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Obtener imágenes del producto
  const { data: imagesData, isLoading } = useQuery({
    queryKey: ['product-images', productId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/products/${productId}/images`, {
        credentials: 'include', // ✅ Incluir cookies de autenticación
      })
      if (!response.ok) throw new Error('Error al cargar imágenes')
      const result = await response.json()
      return (result.data || []) as ProductImage[]
    },
    enabled: !!productId,
  })

  // ✅ NUEVO: Obtener imagen de variante predeterminada siempre (para mostrar como fallback)
  const { data: defaultVariantImage } = useQuery({
    queryKey: ['default-variant-image', productId],
    queryFn: async () => {
      const response = await fetch(`/api/admin/products/${productId}`, {
        credentials: 'include', // ✅ Incluir cookies de autenticación
      })
      if (!response.ok) return null
      const result = await response.json()
      const defaultVariant = result.data?.default_variant
      return defaultVariant?.image_url || null
    },
    enabled: !!productId,
    staleTime: 0, // Siempre refetch para obtener la imagen más reciente
  })

  const images = imagesData || []
  // ✅ NUEVO: Si no hay imágenes y hay imagen de variante predeterminada, agregarla como imagen virtual
  // Prioridad: product_images > variante predeterminada
  const imagesWithFallback = React.useMemo(() => {
    // Si hay imágenes en product_images, usarlas
    if (images.length > 0) {
      return images
    }
    
    // Si no hay imágenes en product_images, usar imagen de variante predeterminada
    if (defaultVariantImage && defaultVariantImage.trim() !== '') {
      console.log('🖼️ Usando imagen de variante predeterminada como fallback:', defaultVariantImage)
      return [{
        id: 'default-variant-image',
        url: defaultVariantImage,
        alt_text: 'Imagen de variante predeterminada',
        is_primary: true,
        display_order: 0,
      } as ProductImage]
    }
    
    return []
  }, [images, defaultVariantImage])
  
  const primaryImage = imagesWithFallback.find(img => img.is_primary) || imagesWithFallback[0]

  // Mutación para subir imagen
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Procesar imagen para formato 1:1 con fondo blanco
      const processedFile = await processImageToSquare(file)

      const formData = new FormData()
      formData.append('file', processedFile)
      // ✅ CORREGIDO: Usar solo imágenes reales (no la imagen virtual) para determinar si es primaria
      formData.append('is_primary', images.length === 0 ? 'true' : 'false') // Primera imagen es primaria

      const response = await fetch(`/api/admin/products/${productId}/images`, {
        method: 'POST',
        body: formData,
        credentials: 'include', // ✅ Incluir cookies de autenticación
      })

      // ✅ IMPORTANTE: Leer el body una sola vez
      const result = await response.json().catch(() => ({ error: 'Error desconocido' }))

      if (!response.ok) {
        throw new Error(result.error || 'Error al subir imagen')
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
      queryClient.invalidateQueries({ queryKey: ['default-variant-image', productId] })
      setUploading(false)
    },
    onError: () => {
      setUploading(false)
    },
  })

  // Mutación para eliminar imagen
  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
        method: 'DELETE',
        credentials: 'include', // ✅ Incluir cookies de autenticación
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(error.error || 'Error al eliminar imagen')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
      queryClient.invalidateQueries({ queryKey: ['default-variant-image', productId] })
    },
  })

  // Mutación para marcar como primaria
  const setPrimaryMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const response = await fetch(`/api/admin/products/${productId}/images/${imageId}`, {
        method: 'PUT', // ✅ Usar PUT en lugar de PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_primary: true }),
        credentials: 'include', // ✅ Incluir cookies de autenticación
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Error desconocido' }))
        throw new Error(error.error || 'Error al actualizar imagen')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-images', productId] })
      queryClient.invalidateQueries({ queryKey: ['default-variant-image', productId] })
    },
  })

  const handleFileUpload = useCallback(
    async (file: File) => {
      // ✅ CORREGIDO: Usar solo imágenes reales (no la imagen virtual de variante) para el límite
      const realImagesCount = images.length
      if (realImagesCount >= maxImages) {
        alert(`Máximo ${maxImages} imágenes permitidas`)
        return
      }

      setUploading(true)
      uploadMutation.mutate(file)
    },
    [images.length, maxImages, uploadMutation]
  )

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = Array.from(e.dataTransfer.files).filter(file =>
        file.type.startsWith('image/')
      )

      if (files.length > 0) {
        handleFileUpload(files[0]) // Subir solo la primera imagen
      }
    },
    [handleFileUpload]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0])
    }
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Galería de imágenes */}
      {imagesWithFallback.length > 0 && (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
          {imagesWithFallback.map((image, index) => {
            // ✅ NUEVO: No mostrar acciones para imagen virtual de variante predeterminada
            const isVirtualImage = image.id === 'default-variant-image'
            return (
            <div
              key={image.id}
              className='relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200'
            >
              <Image
                src={image.url}
                alt={image.alt_text || `Imagen ${index + 1}`}
                fill
                className='object-cover'
                unoptimized
              />

              {/* Overlay con acciones - Solo para imágenes reales */}
              {!isVirtualImage && (
                <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2'>
                  <button
                    type='button'
                    onClick={() => setPrimaryMutation.mutate(image.id)}
                    className={cn(
                      'p-2 rounded-full transition-all opacity-0 group-hover:opacity-100',
                      image.is_primary
                        ? 'bg-amber-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-amber-100'
                    )}
                    title={image.is_primary ? 'Imagen principal' : 'Marcar como principal'}
                  >
                    <Star className={cn('w-4 h-4', image.is_primary && 'fill-current')} />
                  </button>

                  <button
                    type='button'
                    onClick={() => {
                      if (confirm('¿Eliminar esta imagen?')) {
                        deleteMutation.mutate(image.id)
                      }
                    }}
                    className='p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all opacity-0 group-hover:opacity-100'
                    title='Eliminar imagen'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              )}

              {/* Badge para imagen virtual de variante */}
              {isVirtualImage && (
                <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center'>
                  <div className='bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium opacity-0 group-hover:opacity-100'>
                    Imagen de variante predeterminada
                  </div>
                </div>
              )}

              {/* Badge de imagen principal */}
              {image.is_primary && !isVirtualImage && (
                <div className='absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1'>
                  <Star className='w-3 h-3 fill-current' />
                  Principal
                </div>
              )}
            </div>
          )
          })}
        </div>
      )}

      {/* Zona de carga */}
      {images.length < maxImages && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative aspect-square bg-gray-50 rounded-lg border-2 border-dashed overflow-hidden cursor-pointer transition-all',
            dragActive
              ? 'border-blaze-orange-500 bg-blaze-orange-50'
              : 'border-gray-300 hover:border-blaze-orange-400 hover:bg-gray-100',
            uploading && 'pointer-events-none opacity-50'
          )}
        >
          <input
            type='file'
            accept='image/jpeg,image/jpg,image/png,image/webp'
            onChange={handleFileInput}
            className='hidden'
            id={`image-upload-${productId}`}
            disabled={uploading}
          />

          <label
            htmlFor={`image-upload-${productId}`}
            className='flex flex-col items-center justify-center h-full p-6 text-center cursor-pointer'
          >
            {uploading ? (
              <>
                <Loader2 className='w-12 h-12 text-blaze-orange-600 animate-spin mb-3' />
                <p className='text-sm font-medium text-gray-700'>Procesando imagen...</p>
                <p className='text-xs text-gray-500 mt-1'>
                  Agregando fondo blanco y ajustando a formato 1:1
                </p>
              </>
            ) : (
              <>
                <Upload className='w-12 h-12 text-gray-400 mb-3' />
                <p className='text-sm font-medium text-gray-700 mb-1'>
                  {imagesWithFallback.length === 0 ? 'Agregar primera imagen' : 'Agregar más imágenes'}
                </p>
                <p className='text-xs text-gray-500'>Arrastra o haz clic para seleccionar</p>
                <p className='text-xs text-gray-400 mt-2'>
                  JPG, PNG, WebP (máx. 5MB) • Se ajustará a formato 1:1 automáticamente
                </p>
              </>
            )}
          </label>
        </div>
      )}

      {/* Información */}
      <div className='text-xs text-gray-500 space-y-1'>
        <p>
          💡 <strong>Tip:</strong> Las imágenes se procesan automáticamente para formato 1:1 con fondo blanco.
        </p>
        <p>
          {imagesWithFallback.length > 0
            ? `${images.length > 0 ? images.length : 1} imagen${images.length > 1 ? 'es' : ''} agregada${images.length > 1 ? 's' : ''}${images.length === 0 && imagesWithFallback.length > 0 ? ' (mostrando imagen de variante predeterminada)' : ''}. Máximo ${maxImages} imágenes.`
            : `Máximo ${maxImages} imágenes por producto.`}
        </p>
      </div>
    </div>
  )
}
