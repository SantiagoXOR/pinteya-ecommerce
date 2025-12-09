'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { AdminCard } from '../ui/AdminCard'
import {
  Upload,
  X,
  Star,
  StarOff,
  Move,
  Edit,
  Trash2,
  Image as ImageIcon,
  Plus,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
} from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'

interface ProductImage {
  id?: string
  url: string
  alt?: string
  is_primary?: boolean
  file_size?: number
  file_type?: string
  width?: number
  height?: number
  upload_status?: 'uploading' | 'success' | 'error'
  upload_progress?: number
}

interface ProductImageManagerProps {
  productId?: string
  images: ProductImage[]
  onChange: (images: ProductImage[]) => void
  error?: string
  maxImages?: number
  maxFileSize?: number // in MB
  allowedTypes?: string[]
  enableOptimization?: boolean
  className?: string
}

// Image validation and optimization utilities
const validateImageFile = (file: File, maxSize: number = 5): string | null => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

  if (!allowedTypes.includes(file.type)) {
    return 'Tipo de archivo no permitido. Use JPG, PNG, WebP o GIF.'
  }

  if (file.size > maxSize * 1024 * 1024) {
    return `El archivo es muy grande. Maximo ${maxSize}MB permitido.`
  }

  return null
}

const optimizeImage = async (
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.8
): Promise<File> => {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new window.Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        blob => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(optimizedFile)
          } else {
            resolve(file)
          }
        },
        file.type,
        quality
      )
    }

    img.src = URL.createObjectURL(file)
  })
}

const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise(resolve => {
    const img = new window.Image()
    img.onload = () => {
      resolve({ width: img.width, height: img.height })
    }
    img.src = URL.createObjectURL(file)
  })
}

export function ProductImageManager({
  productId,
  images = [],
  onChange,
  error,
  maxImages = 10,
  maxFileSize = 5,
  allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  enableOptimization = true,
  className,
}: ProductImageManagerProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingAlt, setEditingAlt] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Enhanced file upload with validation and optimization
  const handleFileUpload = useCallback(
    async (files: FileList) => {
      if (files.length === 0) {
        return
      }

      const remainingSlots = maxImages - images.length
      if (remainingSlots <= 0) {
        setUploadErrors(['Se ha alcanzado el limite maximo de imagenes'])
        return
      }

      const filesToUpload = Array.from(files).slice(0, remainingSlots)
      const errors: string[] = []

      setUploading(true)
      setUploadErrors([])

      try {
        const processedImages: ProductImage[] = []

        for (const file of filesToUpload) {
          // Validate file
          const validationError = validateImageFile(file, maxFileSize)
          if (validationError) {
            errors.push(`${file.name}: ${validationError}`)
            continue
          }

          try {
            // Get original dimensions
            const dimensions = await getImageDimensions(file)

            // Optimize image if enabled
            const processedFile = enableOptimization ? await optimizeImage(file) : file

            // Create temporary URL for preview
            const url = URL.createObjectURL(processedFile)

            const newImage: ProductImage = {
              id: `temp-${Date.now()}-${Math.random()}`,
              url,
              alt: file.name.replace(/\.[^/.]+$/, ''),
              is_primary: images.length === 0 && processedImages.length === 0,
              file_size: processedFile.size,
              file_type: processedFile.type,
              width: dimensions.width,
              height: dimensions.height,
              upload_status: 'success',
            }

            processedImages.push(newImage)
          } catch (fileError) {
            errors.push(`${file.name}: Error al procesar la imagen`)
          }
        }

        if (processedImages.length > 0) {
          onChange([...images, ...processedImages])
        }

        if (errors.length > 0) {
          setUploadErrors(errors)
        }
      } catch (error) {
        console.error('Error uploading images:', error)
        setUploadErrors(['Error general al subir las imagenes'])
      } finally {
        setUploading(false)
      }
    },
    [images, maxImages, maxFileSize, enableOptimization, onChange]
  )

  // Enhanced drag and drop functionality
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only set to false if we're leaving the component entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex?: number) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      // Handle file drops (external files)
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileUpload(e.dataTransfer.files)
        return
      }

      // Handle image reordering (internal drag)
      if (draggedIndex !== null && dropIndex !== undefined) {
        const newImages = [...images]
        const draggedImage = newImages[draggedIndex]

        // Remove dragged item
        newImages.splice(draggedIndex, 1)

        // Insert at new position
        const actualDropIndex = dropIndex > draggedIndex ? dropIndex - 1 : dropIndex
        newImages.splice(actualDropIndex, 0, draggedImage)

        onChange(newImages)
      }

      setDraggedIndex(null)
    },
    [draggedIndex, images, onChange, handleFileUpload]
  )

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFileUpload(e.target.files)
      }
    },
    [handleFileUpload]
  )

  // Set primary image
  const setPrimaryImage = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_primary: i === index,
    }))
    onChange(newImages)
  }

  // Remove image
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)

    // If we removed the primary image, make the first one primary
    if (images[index].is_primary && newImages.length > 0) {
      newImages[0].is_primary = true
    }

    onChange(newImages)
  }

  // Edit alt text
  const startEditingAlt = (index: number) => {
    setEditingIndex(index)
    setEditingAlt(images[index].alt || '')
  }

  const saveAltText = () => {
    if (editingIndex === null) {
      return
    }

    const newImages = [...images]
    newImages[editingIndex] = {
      ...newImages[editingIndex],
      alt: editingAlt,
    }

    onChange(newImages)
    setEditingIndex(null)
    setEditingAlt('')
  }

  const cancelEditingAlt = () => {
    setEditingIndex(null)
    setEditingAlt('')
  }

  return (
    <div className={cn('space-y-6', className)}>
      <AdminCard title='Gestion de Imagenes' className='p-6'>
        <div className='space-y-6'>
          {/* Upload Area */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-6 transition-all duration-200',
              isDragOver
                ? 'border-blaze-orange-400 bg-blaze-orange-50'
                : 'border-gray-300 hover:border-gray-400',
              uploading && 'opacity-50 pointer-events-none',
              images.length >= maxImages && 'opacity-50'
            )}
            onDrop={e => handleDrop(e)}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
          >
            <div className='text-center'>
              {uploading ? (
                <Loader2 className='mx-auto h-12 w-12 text-blaze-orange-500 animate-spin' />
              ) : (
                <ImageIcon
                  className={cn(
                    'mx-auto h-12 w-12',
                    isDragOver ? 'text-blaze-orange-500' : 'text-gray-400'
                  )}
                />
              )}

              <div className='mt-4'>
                {uploading ? (
                  <p className='text-sm font-medium text-blaze-orange-600'>
                    Procesando imagenes...
                  </p>
                ) : (
                  <>
                    <label htmlFor='file-upload' className='cursor-pointer'>
                      <span className='mt-2 block text-sm font-medium text-gray-900'>
                        {isDragOver ? 'Suelta las imagenes aqui' : 'Arrastra imagenes aqui o'}{' '}
                        {!isDragOver && (
                          <span className='text-blaze-orange-600 hover:text-blaze-orange-500'>
                            selecciona archivos
                          </span>
                        )}
                      </span>
                    </label>
                    <input
                      ref={fileInputRef}
                      id='file-upload'
                      name='file-upload'
                      type='file'
                      className='sr-only'
                      multiple
                      accept={allowedTypes.join(',')}
                      onChange={handleFileInputChange}
                      disabled={uploading || images.length >= maxImages}
                    />
                  </>
                )}
              </div>

              <p className='mt-1 text-xs text-gray-500'>
                {allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} hasta{' '}
                {maxFileSize}MB cada una. Maximo {maxImages} imagenes.
              </p>

              {enableOptimization && (
                <p className='mt-1 text-xs text-green-600'>Optimizacion automatica activada</p>
              )}

              {images.length >= maxImages && (
                <div className='mt-3 flex items-center justify-center space-x-2 text-yellow-600'>
                  <AlertCircle className='w-4 h-4' />
                  <span className='text-sm'>Limite de imagenes alcanzado</span>
                </div>
              )}
            </div>
          </div>

          {/* Upload Errors */}
          {uploadErrors.length > 0 && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <div className='flex items-start space-x-2'>
                <XCircle className='w-5 h-5 text-red-500 mt-0.5 flex-shrink-0' />
                <div>
                  <h4 className='text-sm font-medium text-red-800'>Errores al subir imagenes:</h4>
                  <ul className='mt-1 text-sm text-red-700 space-y-1'>
                    {uploadErrors.map((error, index) => (
                      <li key={index}>
                        •{' '}
                        {error instanceof Error
                          ? error.message
                          : error?.toString() || 'Error desconocido'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* General Error Message */}
          {error && (
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <div className='flex items-center space-x-2'>
                <XCircle className='w-5 h-5 text-red-500' />
                <span className='text-sm text-red-700'>
                  {error instanceof Error
                    ? error.message
                    : error?.toString() || 'Error desconocido'}
                </span>
              </div>
            </div>
          )}

          {/* Images Grid */}
          {images.length > 0 && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h4 className='text-sm font-medium text-gray-900'>
                  Imagenes del Producto ({images.length}/{maxImages})
                </h4>
                <div className='flex items-center space-x-4'>
                  {images.some(img => img.upload_status === 'uploading') && (
                    <div className='flex items-center space-x-2 text-blaze-orange-600'>
                      <Loader2 className='w-4 h-4 animate-spin' />
                      <span className='text-sm'>Subiendo...</span>
                    </div>
                  )}
                  {images.length > 1 && (
                    <p className='text-xs text-gray-500'>Arrastra para reordenar</p>
                  )}
                </div>
              </div>

              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {images.map((image, index) => (
                  <div
                    key={image.id || index}
                    draggable={image.upload_status !== 'uploading'}
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={e => handleDrop(e, index)}
                    className={cn(
                      'relative group border-2 rounded-lg overflow-hidden transition-all',
                      image.upload_status === 'uploading' ? 'cursor-wait' : 'cursor-move',
                      image.is_primary
                        ? 'border-blaze-orange-500 ring-2 ring-blaze-orange-200'
                        : 'border-gray-200 hover:border-gray-300',
                      draggedIndex === index && 'opacity-50',
                      image.upload_status === 'error' && 'border-red-300 bg-red-50'
                    )}
                  >
                    {/* Image */}
                    <div className='aspect-square relative'>
                      <Image
                        src={image.url}
                        alt={image.alt || `Imagen ${index + 1}`}
                        fill
                        className={cn(
                          'object-cover transition-opacity',
                          image.upload_status === 'uploading' && 'opacity-50'
                        )}
                      />

                      {/* Upload Status Overlay */}
                      {image.upload_status === 'uploading' && (
                        <div className='absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center'>
                          <div className='text-center text-white'>
                            <Loader2 className='w-8 h-8 animate-spin mx-auto mb-2' />
                            <div className='text-sm font-medium'>Subiendo...</div>
                            {image.upload_progress !== undefined && (
                              <div className='mt-2'>
                                <div className='w-20 bg-gray-200 rounded-full h-1.5'>
                                  <div
                                    className='bg-blaze-orange-500 h-1.5 rounded-full transition-all duration-300'
                                    style={{ width: `${image.upload_progress}%` }}
                                  ></div>
                                </div>
                                <div className='text-xs mt-1'>
                                  {Math.round(image.upload_progress)}%
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Error Status Overlay */}
                      {image.upload_status === 'error' && (
                        <div className='absolute inset-0 bg-red-500 bg-opacity-50 flex items-center justify-center'>
                          <div className='text-center text-white'>
                            <XCircle className='w-8 h-8 mx-auto mb-2' />
                            <div className='text-sm font-medium'>Error al subir</div>
                          </div>
                        </div>
                      )}

                      {/* Success Status Indicator */}
                      {image.upload_status === 'success' && (
                        <div className='absolute top-2 right-2 bg-green-500 rounded-full p-1'>
                          <CheckCircle className='w-3 h-3 text-white' />
                        </div>
                      )}

                      {/* Primary Badge */}
                      {image.is_primary && (
                        <div className='absolute top-2 left-2 bg-blaze-orange-600 text-white text-xs px-2 py-1 rounded flex items-center space-x-1'>
                          <Star className='w-3 h-3 fill-current' />
                          <span>Principal</span>
                        </div>
                      )}

                      {/* File Info */}
                      {(image.file_size || image.width) && (
                        <div className='absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-2'>
                          <div className='flex justify-between items-center'>
                            {image.width && image.height && (
                              <span>
                                {image.width}x{image.height}
                              </span>
                            )}
                            {image.file_size && (
                              <span>{(image.file_size / (1024 * 1024)).toFixed(1)}MB</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions Overlay */}
                      {image.upload_status !== 'uploading' && (
                        <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100'>
                          <div className='flex space-x-2'>
                            {/* Set Primary */}
                            <button
                              type='button'
                              onClick={() => setPrimaryImage(index)}
                              className='p-2 bg-white rounded-full hover:bg-gray-100 transition-colors'
                              title={
                                image.is_primary
                                  ? 'Es imagen principal'
                                  : 'Establecer como principal'
                              }
                            >
                              {image.is_primary ? (
                                <Star className='w-4 h-4 text-yellow-500 fill-current' />
                              ) : (
                                <StarOff className='w-4 h-4 text-gray-600' />
                              )}
                            </button>

                            {/* Edit Alt */}
                            <button
                              type='button'
                              onClick={() => startEditingAlt(index)}
                              className='p-2 bg-white rounded-full hover:bg-gray-100 transition-colors'
                              title='Editar texto alternativo'
                            >
                              <Edit className='w-4 h-4 text-gray-600' />
                            </button>

                            {/* Remove */}
                            <button
                              type='button'
                              onClick={() => removeImage(index)}
                              className='p-2 bg-white rounded-full hover:bg-red-100 transition-colors'
                              title='Eliminar imagen'
                            >
                              <Trash2 className='w-4 h-4 text-red-600' />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Alt Text */}
                    <div className='p-2 bg-white'>
                      {editingIndex === index ? (
                        <div className='space-y-2'>
                          <input
                            type='text'
                            value={editingAlt}
                            onChange={e => setEditingAlt(e.target.value)}
                            className='w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blaze-orange-500'
                            placeholder='Texto alternativo'
                          />
                          <div className='flex space-x-1'>
                            <button
                              type='button'
                              onClick={saveAltText}
                              className='flex-1 text-xs bg-blaze-orange-600 text-white px-2 py-1 rounded hover:bg-blaze-orange-700'
                            >
                              Guardar
                            </button>
                            <button
                              type='button'
                              onClick={cancelEditingAlt}
                              className='flex-1 text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400'
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className='text-xs text-gray-600 truncate'>
                          {image.alt || 'Sin texto alternativo'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add More Button */}
                {images.length < maxImages && (
                  <button
                    type='button'
                    onClick={() => fileInputRef.current?.click()}
                    className='aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blaze-orange-400 hover:bg-blaze-orange-50 transition-colors'
                  >
                    <Plus className='w-8 h-8 text-gray-400' />
                    <span className='text-xs text-gray-500 mt-2'>Agregar mas</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className='flex items-center space-x-2 text-sm text-gray-600'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blaze-orange-600'></div>
              <span>Subiendo imagenes...</span>
            </div>
          )}

          {/* Statistics Summary */}
          {images.length > 0 && (
            <div className='bg-gray-50 border border-gray-200 rounded-lg p-4'>
              <h5 className='text-sm font-medium text-gray-800 mb-3'>Resumen de Imagenes</h5>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
                <div className='bg-white rounded-lg p-3'>
                  <div className='text-lg font-semibold text-gray-900'>{images.length}</div>
                  <div className='text-xs text-gray-500'>Total</div>
                </div>
                <div className='bg-white rounded-lg p-3'>
                  <div className='text-lg font-semibold text-green-600'>
                    {images.filter(img => img.upload_status === 'success').length}
                  </div>
                  <div className='text-xs text-gray-500'>Exitosas</div>
                </div>
                <div className='bg-white rounded-lg p-3'>
                  <div className='text-lg font-semibold text-blaze-orange-600'>
                    {images.filter(img => img.upload_status === 'uploading').length}
                  </div>
                  <div className='text-xs text-gray-500'>Subiendo</div>
                </div>
                <div className='bg-white rounded-lg p-3'>
                  <div className='text-lg font-semibold text-red-600'>
                    {images.filter(img => img.upload_status === 'error').length}
                  </div>
                  <div className='text-xs text-gray-500'>Con Error</div>
                </div>
              </div>

              {images.some(img => img.file_size) && (
                <div className='mt-3 pt-3 border-t border-gray-200'>
                  <div className='flex justify-between items-center text-sm'>
                    <span className='text-gray-600'>Tamano total:</span>
                    <span className='font-medium text-gray-900'>
                      {(
                        images
                          .filter(img => img.file_size)
                          .reduce((total, img) => total + (img.file_size || 0), 0) /
                        (1024 * 1024)
                      ).toFixed(1)}{' '}
                      MB
                    </span>
                  </div>
                  <div className='flex justify-between items-center text-sm mt-1'>
                    <span className='text-gray-600'>Con texto alternativo:</span>
                    <span className='font-medium text-gray-900'>
                      {images.filter(img => img.alt && img.alt.trim()).length} de {images.length}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tips */}
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <h5 className='text-sm font-medium text-blue-800 mb-2'>
              Consejos para mejores imagenes:
            </h5>
            <ul className='text-xs text-blue-700 space-y-1'>
              <li>• Usa imagenes de alta calidad (minimo 800x800px)</li>
              <li>• La primera imagen sera la imagen principal del producto</li>
              <li>• Incluye diferentes angulos y detalles del producto</li>
              <li>• Agrega texto alternativo para mejorar la accesibilidad</li>
              <li>• Arrastra las imagenes para cambiar el orden</li>
              {enableOptimization && (
                <li>• Las imagenes se optimizan automaticamente para mejor rendimiento</li>
              )}
            </ul>
          </div>
        </div>
      </AdminCard>
    </div>
  )
}
