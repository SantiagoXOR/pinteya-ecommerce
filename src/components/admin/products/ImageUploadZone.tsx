'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2, AlertCircle } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'

interface ImageUploadZoneProps {
  productId?: string // ✅ Ahora es opcional para permitir uploads antes de crear el producto
  currentImageUrl?: string | null
  onUploadSuccess: (imageUrl: string) => void
  onError?: (error: string) => void
  className?: string
  maxSizeMB?: number
  allowedTypes?: string[]
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error'

export function ImageUploadZone({
  productId,
  currentImageUrl,
  onUploadSuccess,
  onError,
  className,
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
}: ImageUploadZoneProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = (file: File): string | null => {
    // Validar tipo
    if (!allowedTypes.includes(file.type)) {
      return `Tipo de archivo no permitido. Use: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`
    }

    // Validar tamaño
    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `El archivo es demasiado grande. Máximo ${maxSizeMB}MB`
    }

    return null
  }

  const optimizeImageBeforeUpload = async (file: File): Promise<File> => {
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
          // Configuración de optimización
          const MAX_WIDTH = 1200
          const MAX_HEIGHT = 1200
          const QUALITY = 0.85

          // Calcular nuevas dimensiones manteniendo aspecto
          let { width, height } = img
          if (width > MAX_WIDTH || height > MAX_HEIGHT) {
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height)
            width = width * ratio
            height = height * ratio
          }

          // Configurar canvas
          canvas.width = width
          canvas.height = height

          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height)

          // Determinar formato de salida
          const outputType = file.type === 'image/webp' || file.type === 'image/avif' 
            ? file.type 
            : 'image/webp'

          // Convertir a blob optimizado
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                  type: outputType,
                  lastModified: Date.now(),
                })
                resolve(optimizedFile)
              } else {
                resolve(file) // Fallback si falla la conversión
              }
            },
            outputType,
            QUALITY
          )
        } catch (error) {
          console.warn('Error optimizando imagen, usando original:', error)
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

  const createPreview = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file)
      if (validationError) {
        setErrorMessage(validationError)
        setUploadState('error')
        onError?.(validationError)
        return
      }

      setUploadState('uploading')
      setErrorMessage(null)
      setUploadProgress(0)

      try {
        // Optimizar imagen antes de subir
        setUploadProgress(10)
        const originalSize = file.size
        const optimizedFile = await optimizeImageBeforeUpload(file)
        const optimizedSize = optimizedFile.size
        const reduction = originalSize > 0 ? ((originalSize - optimizedSize) / originalSize * 100).toFixed(1) : '0'
        
        console.log(`📦 Imagen optimizada: ${(originalSize / 1024).toFixed(1)}KB → ${(optimizedSize / 1024).toFixed(1)}KB (${reduction}% reducción)`)

        // Crear FormData con archivo optimizado
        const formData = new FormData()
        formData.append('file', optimizedFile)
        formData.append('is_primary', 'true')

        // Simular progreso (ya que fetch no tiene progreso nativo)
        setUploadProgress(30)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval)
              return 90
            }
            return prev + 10
          })
        }, 200)

        // Subir archivo - usar endpoint genérico si no hay productId, o endpoint específico si hay productId
        const uploadUrl = productId 
          ? `/api/admin/products/${productId}/images`
          : `/api/admin/upload/image`
        
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData,
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
          throw new Error(errorData.error || `Error ${response.status}: Error al subir imagen`)
        }

        const result = await response.json()
        // El endpoint genérico retorna { data: { url, path } }, el específico retorna { data: { url, ... } }
        const imageUrl = result.data?.url

        if (!imageUrl) {
          throw new Error('No se recibió URL de imagen del servidor')
        }

        setPreview(imageUrl)
        setUploadState('success')
        onUploadSuccess(imageUrl)

        // Resetear estado después de 2 segundos
        setTimeout(() => {
          setUploadState('idle')
          setUploadProgress(0)
        }, 2000)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error al subir imagen'
        setErrorMessage(errorMsg)
        setUploadState('error')
        onError?.(errorMsg)
      }
    },
    [productId, onUploadSuccess, onError]
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

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        createPreview(file)
        uploadFile(file)
      }
    },
    [uploadFile]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      createPreview(file)
      uploadFile(file)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    setUploadState('idle')
    setErrorMessage(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onUploadSuccess('')
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
        className={cn(
          'relative aspect-square bg-gray-50 rounded-lg border-2 border-dashed overflow-hidden cursor-pointer transition-all',
          dragActive
            ? 'border-blaze-orange-500 bg-blaze-orange-50'
            : 'border-gray-300 hover:border-blaze-orange-400 hover:bg-gray-100',
          uploadState === 'uploading' && 'pointer-events-none',
          uploadState === 'error' && 'border-red-300 bg-red-50'
        )}
      >
        <input
          ref={fileInputRef}
          type='file'
          accept={allowedTypes.join(',')}
          onChange={handleFileInput}
          className='hidden'
          disabled={uploadState === 'uploading'}
        />

        {preview ? (
          <div className='relative w-full h-full'>
            <Image
              src={preview}
              alt='Preview'
              fill
              className='object-cover'
              unoptimized
            />
            {uploadState !== 'uploading' && (
              <button
                onClick={handleRemove}
                className='absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10'
                aria-label='Eliminar imagen'
                title='Eliminar imagen'
              >
                <X className='w-4 h-4' />
              </button>
            )}
            {uploadState === 'uploading' && (
              <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                <div className='text-center text-white'>
                  <Loader2 className='w-8 h-8 animate-spin mx-auto mb-2' />
                  <p className='text-sm'>Subiendo...</p>
                  <p className='text-xs mt-1'>{uploadProgress}%</p>
                </div>
              </div>
            )}
            {uploadState === 'success' && (
              <div className='absolute inset-0 bg-green-500 bg-opacity-20 flex items-center justify-center'>
                <div className='text-center text-green-700'>
                  <p className='text-sm font-medium'>✓ Imagen subida</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className='flex flex-col items-center justify-center h-full p-6 text-center'>
            {uploadState === 'uploading' ? (
              <>
                <Loader2 className='w-12 h-12 text-blaze-orange-600 animate-spin mb-3' />
                <p className='text-sm font-medium text-gray-700'>Subiendo imagen...</p>
                <p className='text-xs text-gray-500 mt-1'>{uploadProgress}%</p>
                <div className='w-full max-w-xs bg-gray-200 rounded-full h-2 mt-3'>
                  <div
                    className='bg-blaze-orange-600 h-2 rounded-full transition-all duration-300'
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </>
            ) : uploadState === 'error' ? (
              <>
                <AlertCircle className='w-12 h-12 text-red-500 mb-3' />
                <p className='text-sm font-medium text-red-700'>Error al subir</p>
                {errorMessage && (
                  <p className='text-xs text-red-600 mt-1'>{errorMessage}</p>
                )}
              </>
            ) : (
              <>
                <Upload className='w-12 h-12 text-gray-400 mb-3' />
                <p className='text-sm font-medium text-gray-700 mb-1'>
                  Arrastra una imagen aquí
                </p>
                <p className='text-xs text-gray-500'>o haz clic para seleccionar</p>
                <p className='text-xs text-gray-400 mt-2'>
                  JPG, PNG, WebP (máx. {maxSizeMB}MB)
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {errorMessage && uploadState === 'error' && (
        <div className='flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg'>
          <AlertCircle className='w-5 h-5 text-red-600 flex-shrink-0 mt-0.5' />
          <div className='flex-1'>
            <p className='text-sm font-medium text-red-800'>Error</p>
            <p className='text-xs text-red-600 mt-1'>{errorMessage}</p>
          </div>
          <button
            onClick={() => {
              setErrorMessage(null)
              setUploadState('idle')
            }}
            className='text-red-600 hover:text-red-800'
            aria-label='Cerrar error'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      )}

      <p className='text-xs text-gray-500'>
        💡 Tip: Las imágenes deben ser de al menos 800x800px para mejor calidad
      </p>
    </div>
  )
}

