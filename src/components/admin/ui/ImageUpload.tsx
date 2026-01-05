'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, ZoomIn, AlertCircle } from '@/lib/optimized-imports'
import Image from 'next/image'
import { cn } from '@/lib/core/utils'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string) => void
  onRemove?: () => void
  label?: string
  error?: string
  helperText?: string
  disabled?: boolean
  preview?: boolean
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  label,
  error,
  helperText,
  disabled = false,
  preview = true
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [inputValue, setInputValue] = useState(value || '')

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (disabled) return
    
    // En una implementación real, aquí manejarías el upload del archivo
    // Por ahora solo tomamos URLs de texto
    const url = e.dataTransfer.getData('text/plain')
    if (url) {
      setInputValue(url)
      onChange(url)
    }
  }, [disabled, onChange])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setInputValue(url)
    onChange(url)
  }

  const handleRemove = () => {
    setInputValue('')
    onChange('')
    if (onRemove) onRemove()
  }

  return (
    <div className='space-y-3'>
      {label && (
        <label className='block text-sm font-medium text-gray-700'>
          {label}
        </label>
      )}

      {/* Input URL */}
      <div className='space-y-2'>
        <div className='relative'>
          <input
            type='url'
            value={inputValue}
            onChange={handleInputChange}
            disabled={disabled}
            placeholder='https://ejemplo.com/imagen.jpg'
            className={cn(
              'w-full px-4 py-2.5 rounded-lg border bg-white text-sm',
              'placeholder:text-gray-400',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              error ? [
                'border-red-300 bg-red-50/50',
                'focus:border-red-500 focus:ring-red-500/20'
              ] : [
                'border-gray-300',
                'hover:border-gray-400',
                'focus:border-primary focus:ring-primary/20'
              ],
              disabled && 'opacity-50 cursor-not-allowed bg-gray-50'
            )}
          />
          {value && !disabled && (
            <button
              type='button'
              onClick={handleRemove}
              className='absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-gray-100 transition-colors'
            >
              <X className='h-4 w-4 text-gray-500' />
            </button>
          )}
        </div>

        {/* Drag & Drop Zone */}
        <motion.div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            'relative rounded-lg border-2 border-dashed p-8 text-center transition-all duration-200',
            isDragging ? [
              'border-primary bg-primary/5',
              'scale-[1.02]'
            ] : [
              'border-gray-300',
              'hover:border-gray-400 hover:bg-gray-50/50'
            ],
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-red-300 bg-red-50/30'
          )}
        >
          <AnimatePresence mode="wait">
            {isDragging ? (
              <motion.div
                key="dragging"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='flex flex-col items-center gap-3'
              >
                <Upload className='h-10 w-10 text-primary animate-bounce' />
                <p className='text-sm font-medium text-primary'>
                  Suelta la URL aquí
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className='flex flex-col items-center gap-3'
              >
                <Upload className='h-10 w-10 text-gray-400' />
                <div className='space-y-1'>
                  <p className='text-sm font-medium text-gray-700'>
                    Arrastra una URL o pégala arriba
                  </p>
                  <p className='text-xs text-gray-500'>
                    {helperText || 'Formatos soportados: JPG, PNG, WEBP'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Preview con Zoom */}
      <AnimatePresence>
        {preview && value && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className='relative group'
          >
            <div className='relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200 bg-gray-100'>
              <Image
                src={value}
                alt='Preview'
                fill
                className='object-contain'
                unoptimized
              />
              
              {/* Overlay con acciones */}
              <div className='absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center gap-2'>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setIsZoomed(true)}
                  className='opacity-0 group-hover:opacity-100 transition-opacity p-2.5 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg'
                  type='button'
                >
                  <ZoomIn className='h-5 w-5 text-gray-700' />
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={handleRemove}
                  className='opacity-0 group-hover:opacity-100 transition-opacity p-2.5 rounded-lg bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg'
                  type='button'
                >
                  <X className='h-5 w-5 text-red-600' />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Zoom */}
      <AnimatePresence>
        {isZoomed && value && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsZoomed(false)}
            className='fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4'
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className='relative max-w-4xl w-full h-[80vh]'
            >
              <Image
                src={value}
                alt='Zoom preview'
                fill
                className='object-contain'
                unoptimized
              />
              <button
                onClick={() => setIsZoomed(false)}
                className='absolute top-4 right-4 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg'
              >
                <X className='h-6 w-6' />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className='text-sm text-red-600 flex items-center gap-1.5'
        >
          <AlertCircle className='h-3.5 w-3.5' />
          {error}
        </motion.p>
      )}
    </div>
  )
}

