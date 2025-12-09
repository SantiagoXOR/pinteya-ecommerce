'use client'

import React, { useRef, useState } from 'react'
import { Camera, Upload, X, User, Trash2 } from '@/lib/optimized-imports'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { useAvatarUpload } from '@/hooks/useAvatarUpload'
import { useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/core/utils'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  userName?: string
  onAvatarChange?: (avatarUrl: string | null) => void
  className?: string
}

export function AvatarUpload({
  currentAvatarUrl,
  userName = 'Usuario',
  onAvatarChange,
  className,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const { notifyAvatarChange } = useNotifications()

  const {
    uploading,
    progress,
    error,
    preview,
    uploadAvatar,
    deleteAvatar,
    validateFile,
    generatePreview,
    clearPreview,
  } = useAvatarUpload()

  // Manejar selección de archivo
  const handleFileSelect = (file: File) => {
    const validation = validateFile(file)
    if (validation.valid) {
      generatePreview(file)
    }
  }

  // Manejar cambio en input de archivo
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  // Manejar drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)

    const files = event.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  // Subir avatar
  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      return
    }

    const file = fileInputRef.current.files[0]
    const avatarUrl = await uploadAvatar(file)

    if (avatarUrl && onAvatarChange) {
      onAvatarChange(avatarUrl)
      await notifyAvatarChange('Avatar actualizado correctamente')
    }
  }

  // Eliminar avatar
  const handleDelete = async () => {
    const success = await deleteAvatar()
    if (success && onAvatarChange) {
      onAvatarChange(null)
      await notifyAvatarChange('Avatar eliminado correctamente')
    }
  }

  // Abrir selector de archivos
  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  // Obtener iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const displayAvatarUrl = preview || currentAvatarUrl

  return (
    <div className={cn('space-y-4', className)}>
      {/* Avatar Display */}
      <div className='flex flex-col items-center space-y-4'>
        <div className='relative'>
          <Avatar className='h-32 w-32 border-4 border-white shadow-lg'>
            <AvatarImage
              src={displayAvatarUrl}
              alt={`Avatar de ${userName}`}
              className='object-cover'
            />
            <AvatarFallback className='text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white'>
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>

          {/* Camera Icon Overlay */}
          <Button
            size='sm'
            variant='secondary'
            className='absolute bottom-0 right-0 rounded-full h-10 w-10 p-0 shadow-lg'
            onClick={openFileSelector}
            disabled={uploading}
          >
            <Camera className='h-4 w-4' />
          </Button>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className='w-full max-w-xs space-y-2'>
            <Progress value={progress} className='h-2' />
            <p className='text-sm text-center text-muted-foreground'>
              Subiendo avatar... {progress}%
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className='text-sm text-red-600 text-center max-w-xs'>
            {error instanceof Error
              ? error.message
              : typeof error === 'string'
                ? error
                : 'Error desconocido'}
          </div>
        )}
      </div>

      {/* Drag and Drop Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400',
          uploading && 'opacity-50 pointer-events-none'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className='h-8 w-8 mx-auto mb-2 text-gray-400' />
        <p className='text-sm text-gray-600 mb-2'>
          Arrastra una imagen aquí o{' '}
          <button
            type='button'
            className='text-blue-600 hover:text-blue-700 font-medium'
            onClick={openFileSelector}
            disabled={uploading}
          >
            selecciona un archivo
          </button>
        </p>
        <p className='text-xs text-gray-500'>JPG, PNG o WebP. Máximo 5MB.</p>
      </div>

      {/* Action Buttons */}
      <div className='flex justify-center space-x-3'>
        {preview && (
          <>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className='flex items-center space-x-2'
            >
              <Upload className='h-4 w-4' />
              <span>Subir Avatar</span>
            </Button>
            <Button
              variant='outline'
              onClick={clearPreview}
              disabled={uploading}
              className='flex items-center space-x-2'
            >
              <X className='h-4 w-4' />
              <span>Cancelar</span>
            </Button>
          </>
        )}

        {currentAvatarUrl && !preview && (
          <Button
            variant='destructive'
            onClick={handleDelete}
            disabled={uploading}
            className='flex items-center space-x-2'
          >
            <Trash2 className='h-4 w-4' />
            <span>Eliminar Avatar</span>
          </Button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/jpeg,image/jpg,image/png,image/webp'
        onChange={handleFileChange}
        className='hidden'
      />
    </div>
  )
}
