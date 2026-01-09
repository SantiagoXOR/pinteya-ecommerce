'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, X, Loader2, FileText, AlertCircle, ExternalLink } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'

interface TechnicalSheetData {
  id?: string
  url: string
  title: string
  original_filename?: string
  file_size?: number
}

interface TechnicalSheetUploadProps {
  productId?: string
  existingSheet?: TechnicalSheetData | null
  onUploadSuccess: (data: TechnicalSheetData) => void
  onDelete?: () => void
  onError?: (error: string) => void
  className?: string
  maxSizeMB?: number
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error'

export function TechnicalSheetUpload({
  productId,
  existingSheet,
  onUploadSuccess,
  onDelete,
  onError,
  className,
  maxSizeMB = 10,
}: TechnicalSheetUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [dragActive, setDragActive] = useState(false)
  const [currentSheet, setCurrentSheet] = useState<TechnicalSheetData | null>(existingSheet || null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync with external existingSheet prop
  useEffect(() => {
    if (existingSheet) {
      setCurrentSheet(existingSheet)
    }
  }, [existingSheet])

  // Fetch existing technical sheet when productId is available
  useEffect(() => {
    const fetchExistingSheet = async () => {
      if (!productId || existingSheet) return
      
      try {
        const response = await fetch(`/api/admin/products/${productId}/technical-sheet`, {
          credentials: 'include',
        })
        
        if (response.ok) {
          const result = await response.json()
          if (result.data) {
            setCurrentSheet({
              id: result.data.id,
              url: result.data.url,
              title: result.data.title || 'Ficha Técnica',
              original_filename: result.data.original_filename,
              file_size: result.data.file_size,
            })
          }
        }
      } catch (error) {
        console.error('Error fetching existing technical sheet:', error)
      }
    }

    fetchExistingSheet()
  }, [productId, existingSheet])

  const validateFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Solo se permiten archivos PDF'
    }

    const maxSizeBytes = maxSizeMB * 1024 * 1024
    if (file.size > maxSizeBytes) {
      return `El archivo es demasiado grande. Máximo ${maxSizeMB}MB`
    }

    return null
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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

      if (!productId) {
        const errorMsg = 'Se requiere un ID de producto para subir la ficha técnica'
        setErrorMessage(errorMsg)
        setUploadState('error')
        onError?.(errorMsg)
        return
      }

      setUploadState('uploading')
      setErrorMessage(null)
      setUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('title', file.name.replace('.pdf', ''))

        // Simulate progress
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

        const response = await fetch(`/api/admin/products/${productId}/technical-sheet`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        })

        clearInterval(progressInterval)
        setUploadProgress(100)

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || `Error ${response.status}: Error al subir ficha técnica`)
        }

        const sheetData: TechnicalSheetData = {
          id: result.data?.id,
          url: result.data?.url,
          title: result.data?.title || file.name.replace('.pdf', ''),
          original_filename: result.data?.original_filename || file.name,
          file_size: result.data?.file_size || file.size,
        }

        setCurrentSheet(sheetData)
        setUploadState('success')
        onUploadSuccess(sheetData)

        // Reset state after 2 seconds
        setTimeout(() => {
          setUploadState('idle')
          setUploadProgress(0)
        }, 2000)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Error al subir ficha técnica'
        setErrorMessage(errorMsg)
        setUploadState('error')
        onError?.(errorMsg)
      }
    },
    [productId, onUploadSuccess, onError, maxSizeMB]
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
        uploadFile(e.dataTransfer.files[0])
      }
    },
    [uploadFile]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!productId || !currentSheet) {
      setCurrentSheet(null)
      onDelete?.()
      return
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}/technical-sheet`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Error al eliminar ficha técnica')
      }

      setCurrentSheet(null)
      setUploadState('idle')
      setErrorMessage(null)
      setUploadProgress(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onDelete?.()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error al eliminar ficha técnica'
      setErrorMessage(errorMsg)
      setUploadState('error')
      onError?.(errorMsg)
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      <label className="block text-sm font-medium text-gray-700">
        Ficha Técnica (PDF)
      </label>

      {currentSheet ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">
              {currentSheet.title}
            </p>
            <p className="text-xs text-green-600">
              {currentSheet.original_filename}
              {currentSheet.file_size && ` • ${formatFileSize(currentSheet.file_size)}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={currentSheet.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors"
              title="Ver ficha técnica"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={handleRemove}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-colors"
              title="Eliminar ficha técnica"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={handleClick}
          className={cn(
            'relative p-6 bg-gray-50 rounded-lg border-2 border-dashed cursor-pointer transition-all',
            dragActive
              ? 'border-blaze-orange-500 bg-blaze-orange-50'
              : 'border-gray-300 hover:border-blaze-orange-400 hover:bg-gray-100',
            uploadState === 'uploading' && 'pointer-events-none',
            uploadState === 'error' && 'border-red-300 bg-red-50'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleFileInput}
            className="hidden"
            disabled={uploadState === 'uploading'}
          />

          <div className="flex flex-col items-center justify-center text-center">
            {uploadState === 'uploading' ? (
              <>
                <Loader2 className="w-10 h-10 text-blaze-orange-600 animate-spin mb-3" />
                <p className="text-sm font-medium text-gray-700">Subiendo ficha técnica...</p>
                <p className="text-xs text-gray-500 mt-1">{uploadProgress}%</p>
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mt-3">
                  <div
                    className="bg-blaze-orange-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </>
            ) : uploadState === 'error' ? (
              <>
                <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                <p className="text-sm font-medium text-red-700">Error al subir</p>
                {errorMessage && (
                  <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setErrorMessage(null)
                    setUploadState('idle')
                  }}
                  className="mt-2 text-xs text-blaze-orange-600 hover:underline"
                >
                  Intentar de nuevo
                </button>
              </>
            ) : uploadState === 'success' ? (
              <>
                <FileText className="w-10 h-10 text-green-600 mb-3" />
                <p className="text-sm font-medium text-green-700">¡Ficha técnica subida!</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Arrastra un PDF aquí
                </p>
                <p className="text-xs text-gray-500">o haz clic para seleccionar</p>
                <p className="text-xs text-gray-400 mt-2">
                  PDF (máx. {maxSizeMB}MB)
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {!productId && uploadState === 'idle' && !currentSheet && (
        <p className="text-xs text-amber-600">
          Guarda el producto primero para poder subir la ficha técnica
        </p>
      )}

      {errorMessage && uploadState === 'error' && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
          </div>
          <button
            onClick={() => {
              setErrorMessage(null)
              setUploadState('idle')
            }}
            className="text-red-600 hover:text-red-800"
            aria-label="Cerrar error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
