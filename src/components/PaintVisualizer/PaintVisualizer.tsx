/**
 * Paint Visualizer - Componente principal para visualización AR de pintura
 * Usa Gemini API para procesar la imagen y aplicar pintura automáticamente
 * Diseño inmersivo full-screen en móvil / modal centrado en desktop
 */

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
  } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Camera,
  Loader2,
  Paintbrush,
  RotateCcw,
  Download,
  ArrowLeft,
  Info as InfoCircle,
  ImageIcon as Photo,
} from '@/lib/optimized-imports'
import { usePaintProducts } from '@/hooks/usePaintProducts'
import { PaintVisualizerProps, PaintProduct, PaintColor } from './types'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { ColorPillSelector } from '@/components/ui/product-card-commercial/components/ColorPillSelector'

type ViewMode = 'selection' | 'camera' | 'result'

export function PaintVisualizer({ isOpen, onClose, productName, productCategory }: PaintVisualizerProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('selection')
  const [selectedProduct, setSelectedProduct] = useState<PaintProduct | null>(null)
  const [selectedColor, setSelectedColor] = useState<PaintColor | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [paintedImage, setPaintedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { products, isLoading: isLoadingProducts } = usePaintProducts()

  // Detectar si es impregnante
  const isImpregnante = selectedProduct?.name.toLowerCase().includes('impregnante') ?? false

  // Verificar si getUserMedia está disponible
  const checkCameraSupport = useCallback(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false
    }
    return true
  }, [])

  // Inicializar cámara
  const startCamera = useCallback(async () => {
    if (!checkCameraSupport()) {
      const errorMsg = 'Tu navegador no soporta acceso a la cámara'
      setCameraError(errorMsg)
      toast.error(errorMsg)
      return
    }

    setCameraError(null)

    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        try {
          await videoRef.current.play()
          setIsCameraActive(true)
          setCameraError(null)
        } catch (playError) {
          console.error('Error al reproducir video:', playError)
          // Detener el stream si hay error al reproducir
          stream.getTracks().forEach(track => track.stop())
          throw playError
        }
      }
    } catch (error: any) {
      console.error('Error accediendo a la cámara:', error)
      setIsCameraActive(false)
      
      let errorMsg = 'No se pudo acceder a la cámara'
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMsg = 'Permiso de cámara denegado. Puedes usar la galería para seleccionar una imagen.'
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMsg = 'No se encontró ninguna cámara en tu dispositivo. Puedes usar la galería para seleccionar una imagen.'
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMsg = 'La cámara está siendo usada por otra aplicación. Puedes usar la galería para seleccionar una imagen.'
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMsg = 'Las restricciones de la cámara no se pueden satisfacer. Puedes usar la galería para seleccionar una imagen.'
      }
      
      setCameraError(errorMsg)
      // No mostrar toast para errores de permisos, solo mostrar el mensaje en la UI
      if (error.name !== 'NotAllowedError' && error.name !== 'PermissionDeniedError') {
        toast.error(errorMsg)
      }
    }
  }, [checkCameraSupport])

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.pause()
    }
    setIsCameraActive(false)
    setCameraError(null)
  }, [])

  // Capturar foto
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) {
      toast.error('La cámara no está disponible')
      return
    }

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        setImageSrc(dataUrl)
        stopCamera()
        setViewMode('result')
      }
    } else {
      toast.error('Espera a que la cámara esté lista')
    }
  }, [stopCamera, isCameraActive])

  // Cargar imagen desde archivo
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es demasiado grande. Máximo 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string)
        stopCamera()
        setViewMode('result')
      }
      reader.readAsDataURL(file)
    }
  }

  // Abrir selector de archivos
  const handleGalleryClick = () => {
    fileInputRef.current?.click()
  }

  // Cargar imagen en canvas
  useEffect(() => {
    if (!imageSrc) return

    const img = new Image()
    img.onload = () => {
      if (imageCanvasRef.current) {
        const imageCanvas = imageCanvasRef.current
        imageCanvas.width = img.width
        imageCanvas.height = img.height

        const imageCtx = imageCanvas.getContext('2d')
        if (imageCtx) {
          imageCtx.drawImage(img, 0, 0)
        }
      }
    }
    img.src = imageSrc
  }, [imageSrc])

  // Aplicar pintura automáticamente usando Gemini + procesamiento de imagen
  const applyPaint = useCallback(async () => {
    if (!imageSrc || !selectedColor || !imageCanvasRef.current) {
      toast.error('Selecciona una imagen y un color primero')
      return
    }

    setIsProcessing(true)
    setGeminiAnalysis(null)

    try {
      const response = await fetch('/api/paint-visualizer/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: imageSrc,
          colorHex: selectedColor.hex,
          colorName: selectedColor.name,
          productName: selectedProduct?.name,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Error al procesar la imagen')
      }

      if (data.analysis) {
        setGeminiAnalysis(data.analysis)
      }

      const imageCanvas = imageCanvasRef.current
      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = imageCanvas.width
      outputCanvas.height = imageCanvas.height
      const outputCtx = outputCanvas.getContext('2d')

      if (!outputCtx) {
        throw new Error('Error al crear contexto de canvas')
      }

      outputCtx.drawImage(imageCanvas, 0, 0)

      const imageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height)
      const pixels = imageData.data

      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 0, g: 0, b: 0 }
      }

      const paintColor = hexToRgb(selectedColor.hex)

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]

        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255

        if (luminance > 0.4) {
          const blendFactor = Math.min(luminance * 0.7, 0.8)

          pixels[i] = Math.min(255, r * (paintColor.r / 255) * (1 - blendFactor) + paintColor.r * blendFactor)
          pixels[i + 1] = Math.min(255, g * (paintColor.g / 255) * (1 - blendFactor) + paintColor.g * blendFactor)
          pixels[i + 2] = Math.min(255, b * (paintColor.b / 255) * (1 - blendFactor) + paintColor.b * blendFactor)
        }
      }

      outputCtx.putImageData(imageData, 0, 0)

      const result = outputCanvas.toDataURL('image/jpeg', 0.9)
      setPaintedImage(result)
      toast.success('Pintura aplicada exitosamente')
    } catch (error) {
      console.error('Error aplicando pintura:', error)
      toast.error(error instanceof Error ? error.message : 'Error al aplicar la pintura')
    } finally {
      setIsProcessing(false)
    }
  }, [imageSrc, selectedColor, selectedProduct])

  // Reset
  const handleReset = () => {
    setImageSrc(null)
    setPaintedImage(null)
    setGeminiAnalysis(null)
    stopCamera()
    setViewMode('selection')
  }

  // Descargar imagen
  const handleDownload = () => {
    if (paintedImage) {
      const link = document.createElement('a')
      link.download = `pintura-${selectedColor?.name || 'color'}-${Date.now()}.jpg`
      link.href = paintedImage
      link.click()
      toast.success('Imagen descargada')
    }
  }

  // Manejar selección de producto
  const handleProductSelect = (product: PaintProduct) => {
    setSelectedProduct(product)
    if (product.colors.length > 0) {
      setSelectedColor(product.colors[0])
    }
  }

  // Manejar selección de color
  const handleColorSelect = (hex: string) => {
    if (!selectedProduct) return
    const color = selectedProduct.colors.find(c => c.hex === hex)
    if (color) {
      setSelectedColor(color)
    }
  }

  // Continuar a vista de cámara
  const handleContinueToCamera = async () => {
    if (selectedProduct && selectedColor) {
      try {
        // Cambiar a vista de cámara primero
        setViewMode('camera')
        // Pequeño delay para asegurar que el DOM se actualice
        await new Promise(resolve => setTimeout(resolve, 100))
        // Intentar iniciar la cámara directamente desde el gesto del usuario
        // Esto es necesario porque getUserMedia debe ser llamado desde un gesto del usuario
        await startCamera()
      } catch (error) {
        // El error ya está manejado en startCamera
        console.error('Error al iniciar cámara:', error)
      }
    } else {
      toast.error('Selecciona un producto y un color primero')
    }
  }

  // Volver desde cámara
  const handleBackFromCamera = () => {
    stopCamera()
    setViewMode('selection')
  }

  // Efectos
  useEffect(() => {
    if (isOpen) {
      setViewMode('selection')
      setImageSrc(null)
      setPaintedImage(null)
      setGeminiAnalysis(null)
      setSelectedProduct(null)
      setSelectedColor(null)
      stopCamera()
    }
  }, [isOpen, stopCamera])

  useEffect(() => {
    // Solo detener la cámara cuando cambiamos de vista
    // NO iniciar automáticamente desde useEffect porque getUserMedia debe llamarse
    // desde un gesto del usuario (como un click)
    if (viewMode !== 'camera') {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [viewMode, stopCamera])

  // Vista de selección
  const renderSelectionView = () => (
    <div className='p-4 md:p-6 space-y-6 max-h-[90vh] overflow-y-auto'>
      <div>
        <h2 className='text-xl font-bold mb-4'>Selecciona un producto</h2>
        {isLoadingProducts ? (
          <div className='flex items-center justify-center py-12'>
            <Loader2 className='w-8 h-8 animate-spin' />
          </div>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            {products.slice(0, 12).map((product) => {
              const isSelected = selectedProduct?.id === product.id
              return (
                <div
                  key={product.id}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleProductSelect(product)
                  }}
                  className={cn(
                    'cursor-pointer transition-all relative',
                    isSelected && 'ring-2 ring-blue-500 rounded-lg'
                  )}
                >
                  <div style={{ pointerEvents: 'none' }}>
                    <CommercialProductCard
                      image={product.image}
                      title={product.name}
                      brand={product.brand}
                      price={undefined}
                      productId={product.id}
                      onAddToCart={() => {
                        // No-op: en modo selección no agregamos al carrito
                      }}
                      variants={product.colors.map((c, idx) => ({
                        id: idx,
                        color_name: c.name,
                        color_hex: c.hex,
                      }))}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className='space-y-4'>
          <div>
            <h3 className='text-lg font-semibold mb-2'>
              Producto seleccionado: {selectedProduct.name}
            </h3>
            <Button
              onClick={handleContinueToCamera}
              className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            >
              Continuar con {selectedProduct.name}
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  // Vista de cámara
  const renderCameraView = () => (
    <div className='relative bg-black w-full h-full overflow-hidden' style={{ minHeight: '100vh', minWidth: '100%' }}>
      {/* Video de fondo */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className='absolute inset-0 w-full h-full object-cover'
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Header superior */}
      <header
        className='absolute top-0 left-0 right-0 z-20 pt-[env(safe-area-inset-top,0px)] pb-4 px-4 bg-gradient-to-b from-black/60 to-transparent'
        style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 0px))' }}
      >
        <div className='flex items-center justify-between text-white'>
          <button
            onClick={handleBackFromCamera}
            className='p-2 rounded-full hover:bg-white/10 transition-colors backdrop-blur-md bg-black/20'
          >
            <ArrowLeft className='w-6 h-6' />
          </button>
          <div className='flex-1 mx-4 text-center'>
            <div className='bg-black/30 backdrop-blur-md rounded-full px-4 py-1.5 inline-block border border-white/10'>
              <p className='text-xs text-gray-300 font-medium uppercase tracking-wide'>Producto</p>
              <p className='text-sm font-semibold truncate max-w-[200px]'>
                {selectedProduct?.name || 'Sin producto'}
              </p>
            </div>
          </div>
          <button className='p-2 rounded-full hover:bg-white/10 transition-colors backdrop-blur-md bg-black/20'>
            <InfoCircle className='w-6 h-6' />
          </button>
        </div>
      </header>

      {/* Selector de colores */}
      {selectedProduct && selectedProduct.colors.length > 0 && (
        <div
          className='absolute bottom-[200px] left-0 right-0 z-20 px-6'
          style={{ bottom: '200px' }}
        >
          <div className='bg-black/40 backdrop-blur-md rounded-2xl p-4'>
            <ColorPillSelector
              colors={selectedProduct.colors.map(c => ({ name: c.name, hex: c.hex }))}
              selectedColor={selectedColor?.hex}
              onColorSelect={handleColorSelect}
              isImpregnante={isImpregnante}
            />
          </div>
        </div>
      )}

      {/* Barra de controles inferior */}
      <div
        className='absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-12'
        style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom, 0px))' }}
      >
        <div className='bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-t-3xl pt-6 pb-8 px-8 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]'>
          <div className='flex items-center justify-between max-w-md mx-auto'>
            <button
              onClick={handleGalleryClick}
              className='flex flex-col items-center justify-center w-12 h-12 text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-colors'
            >
              <div className='bg-gray-200 dark:bg-gray-700 p-2.5 rounded-xl'>
                <Photo className='w-5 h-5' />
              </div>
              <span className='text-[10px] mt-1 font-medium'>Galería</span>
            </button>
            <div className='relative -mt-8'>
              <div className='absolute inset-0 bg-orange-500/20 blur-xl rounded-full' />
              <button
                onClick={capturePhoto}
                disabled={!isCameraActive}
                className='relative w-20 h-20 bg-white dark:bg-gray-800 rounded-full border-[6px] border-orange-500 shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 group disabled:opacity-50'
              >
                <div className='w-14 h-14 bg-orange-500 rounded-full group-active:scale-90 transition-transform' />
                <Camera className='text-white absolute w-8 h-8 pointer-events-none' />
              </button>
            </div>
            <button className='flex flex-col items-center justify-center w-12 h-12 text-gray-600 dark:text-gray-300 hover:text-orange-500 transition-colors'>
              <div className='bg-gray-200 dark:bg-gray-700 p-2.5 rounded-xl'>
                <InfoCircle className='w-5 h-5' />
              </div>
              <span className='text-[10px] mt-1 font-medium'>Info</span>
            </button>
          </div>
          <div className='w-32 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-6' />
        </div>
      </div>

      {/* Error de cámara */}
      {cameraError && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/80 z-30'>
          <div className='text-center text-white p-6 max-w-md mx-auto'>
            <Camera className='w-16 h-16 mx-auto mb-4 opacity-50' />
            <p className='text-sm mb-6'>{cameraError}</p>
            <div className='flex flex-col gap-3'>
              <Button 
                onClick={handleGalleryClick} 
                variant='outline' 
                className='text-white border-white hover:bg-white/20'
              >
                <Photo className='w-4 h-4 mr-2' />
                Usar Galería
              </Button>
              <Button 
                onClick={startCamera} 
                variant='outline' 
                className='text-white border-white hover:bg-white/20'
              >
                Reintentar Cámara
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {!isCameraActive && !cameraError && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/50 z-30'>
          <div className='text-center text-white'>
            <Loader2 className='w-12 h-12 mx-auto mb-4 animate-spin' />
            <p className='text-sm'>Solicitando acceso a la cámara...</p>
          </div>
        </div>
      )}

      {/* Input de archivo oculto */}
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        onChange={handleImageUpload}
        className='hidden'
      />
    </div>
  )

  // Vista de resultado
  const renderResultView = () => (
    <div className='p-4 md:p-6 space-y-4 max-h-[90vh] overflow-y-auto'>
      <div className='space-y-4'>
        {/* Imagen original */}
        <div className='border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100'>
          <div className='relative' style={{ paddingBottom: '75%' }}>
            <img
              src={imageSrc || ''}
              alt='Imagen a pintar'
              className='absolute inset-0 w-full h-full object-contain'
            />
          </div>
        </div>

        {/* Análisis de Gemini */}
        {geminiAnalysis && (
          <div className='p-4 bg-blue-50 border border-blue-200 rounded-lg'>
            <p className='text-sm text-blue-900'>
              <strong>Análisis de Gemini:</strong> {geminiAnalysis}
            </p>
          </div>
        )}

        {/* Botones de acción */}
        <div className='flex gap-2'>
          {!paintedImage && (
            <Button onClick={applyPaint} disabled={isProcessing} className='flex-1'>
              {isProcessing ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  Procesando con Gemini...
                </>
              ) : (
                <>
                  <Paintbrush className='w-4 h-4 mr-2' />
                  Aplicar Pintura con Gemini
                </>
              )}
            </Button>
          )}
          <Button variant='outline' onClick={handleReset}>
            <RotateCcw className='w-4 h-4 mr-2' />
            Reiniciar
          </Button>
          {paintedImage && (
            <Button variant='outline' onClick={handleDownload}>
              <Download className='w-4 h-4 mr-2' />
              Descargar
            </Button>
          )}
        </div>

        {/* Resultado pintado */}
        {paintedImage && (
          <div className='border-2 border-gray-300 rounded-lg overflow-hidden'>
            <img src={paintedImage} alt='Resultado pintado' className='w-full h-auto' />
          </div>
        )}
      </div>
    </div>
  )

  // Handler para prevenir que el modal se cierre cuando hay un error de cámara
  const handleDialogOpenChange = useCallback((open: boolean) => {
    // Solo cerrar si realmente se quiere cerrar (no por errores)
    if (!open) {
      // Si estamos en vista de cámara y hay error, no cerrar automáticamente
      // Pero permitir cerrar si el usuario hace click en el overlay o en el botón X
      onClose()
    }
  }, [onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        data-testid="paint-visualizer-modal"
        className={cn(
          'p-0 overflow-hidden',
          viewMode === 'camera'
            ? 'max-w-full max-h-[90vh] h-[90vh] md:max-w-4xl md:max-h-[90vh] md:rounded-lg'
            : 'max-w-4xl max-h-[90vh]'
        )}
        size='4xl'
      >
        <DialogTitle className='sr-only'>
          Visualizador de Pintura PinteYa ColorMate
        </DialogTitle>
        <DialogDescription className='sr-only'>
          Selecciona un producto de pintura, elige un color y visualiza cómo se verá en tu espacio usando la cámara de tu dispositivo.
        </DialogDescription>
        {viewMode === 'selection' && renderSelectionView()}
        {viewMode === 'camera' && renderCameraView()}
        {viewMode === 'result' && renderResultView()}

        {/* Canvas oculto para captura y procesamiento */}
        <canvas ref={canvasRef} className='hidden' />
        <canvas ref={imageCanvasRef} className='hidden' />
      </DialogContent>
    </Dialog>
  )
}
