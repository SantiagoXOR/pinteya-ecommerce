/**
 * Paint Visualizer - Componente principal para visualización AR de pintura
 * Usa Gemini API para procesar la imagen y aplicar pintura automáticamente
 */

'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Camera,
  Loader2,
  Paintbrush,
  RotateCcw,
  Download,
  Upload,
} from '@/lib/optimized-imports'
import { usePaintProducts } from '@/hooks/usePaintProducts'
import { PaintVisualizerProps, PaintProduct, PaintColor } from './types'
import { cn } from '@/lib/utils'
import { toast } from 'react-hot-toast'

export function PaintVisualizer({ isOpen, onClose, productName, productCategory }: PaintVisualizerProps) {
  const [selectedProduct, setSelectedProduct] = useState<PaintProduct | null>(null)
  const [selectedColor, setSelectedColor] = useState<PaintColor | null>(null)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [paintedImage, setPaintedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [geminiAnalysis, setGeminiAnalysis] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageCanvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const { products, isLoading: isLoadingProducts } = usePaintProducts()

  // Inicializar cámara
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (error) {
      console.error('Error accediendo a la cámara:', error)
      toast.error('No se pudo acceder a la cámara. Por favor, permite el acceso.')
    }
  }, [])

  // Detener cámara
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // Capturar foto
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')

      if (ctx) {
        ctx.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
        setImageSrc(dataUrl)
        stopCamera()
      }
    }
  }, [stopCamera])

  // Cargar imagen desde archivo
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen es demasiado grande. Máximo 5MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
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
      // 1. Enviar imagen a Gemini para análisis
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

      // Guardar análisis de Gemini
      if (data.analysis) {
        setGeminiAnalysis(data.analysis)
      }

      // 2. Aplicar color automáticamente usando técnicas de procesamiento de imagen
      const imageCanvas = imageCanvasRef.current
      const outputCanvas = document.createElement('canvas')
      outputCanvas.width = imageCanvas.width
      outputCanvas.height = imageCanvas.height
      const outputCtx = outputCanvas.getContext('2d')

      if (!outputCtx) {
        throw new Error('Error al crear contexto de canvas')
      }

      // Dibujar imagen original
      outputCtx.drawImage(imageCanvas, 0, 0)

      // Aplicar color usando técnica de overlay/multiply para simular pintura
      // Esto pinta las áreas claras (paredes) con el color seleccionado
      const imageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height)
      const pixels = imageData.data

      // Convertir color hex a RGB
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

      // Aplicar pintura: detectar áreas claras (paredes) y aplicar color con blend
      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i]
        const g = pixels[i + 1]
        const b = pixels[i + 2]

        // Calcular luminosidad
        const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255

        // Si el píxel es relativamente claro (probablemente una pared), aplicar color
        if (luminance > 0.4) {
          // Blend multiply para simular pintura
          const blendFactor = Math.min(luminance * 0.7, 0.8) // Intensidad de la pintura

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
    setSelectedProduct(null)
    setSelectedColor(null)
    setGeminiAnalysis(null)
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


  // Efectos
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
      handleReset()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, startCamera, stopCamera])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto p-0' size='4xl'>
        <DialogHeader className='px-6 pt-6 pb-4 border-b'>
          <DialogTitle className='text-xl font-bold flex items-center gap-2'>
            <Paintbrush className='w-5 h-5' />
            Visualizador de Pintura AR
          </DialogTitle>
          <DialogDescription>
            Selecciona un producto y color, luego captura o sube una imagen. Gemini procesará la imagen automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className='px-6 py-4 space-y-4'>
          {/* Selector de producto y color */}
          {!imageSrc && (
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium mb-2'>Selecciona un producto:</label>
                {isLoadingProducts ? (
                  <div className='flex items-center justify-center py-8'>
                    <Loader2 className='w-6 h-6 animate-spin' />
                  </div>
                ) : (
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-3 max-h-40 overflow-y-auto'>
                    {products.slice(0, 12).map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          setSelectedProduct(product)
                          if (product.colors.length > 0) {
                            setSelectedColor(product.colors[0])
                          }
                        }}
                        className={cn(
                          'p-3 border-2 rounded-lg text-left transition-all',
                          selectedProduct?.id === product.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div className='font-medium text-sm truncate'>{product.name}</div>
                        <div className='text-xs text-gray-500'>{product.brand}</div>
                        <div className='flex gap-1 mt-2'>
                          {product.colors.slice(0, 3).map((color) => (
                            <div
                              key={color.hex}
                              className='w-4 h-4 rounded border border-gray-300'
                              style={{ backgroundColor: color.hex }}
                            />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedProduct && (
                <div>
                  <label className='block text-sm font-medium mb-2'>Selecciona un color:</label>
                  <div className='flex flex-wrap gap-2'>
                    {selectedProduct.colors.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => setSelectedColor(color)}
                        className={cn(
                          'px-4 py-2 rounded-lg border-2 flex items-center gap-2 transition-all',
                          selectedColor?.hex === color.hex
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <div
                          className='w-6 h-6 rounded border border-gray-300'
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className='text-sm font-medium'>{color.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cámara o imagen */}
          {!imageSrc && selectedColor && (
            <div className='space-y-4'>
              <div className='relative bg-black rounded-lg overflow-hidden aspect-video'>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className='w-full h-full object-cover'
                />
                <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2'>
                  <Button onClick={capturePhoto} size='lg' className='rounded-full w-16 h-16'>
                    <Camera className='w-6 h-6' />
                  </Button>
                </div>
              </div>
              <div className='text-center'>
                <label className='inline-block px-4 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200'>
                  <Upload className='w-4 h-4 inline mr-2' />
                  O subir una imagen
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleImageUpload}
                    className='hidden'
                  />
                </label>
              </div>
            </div>
          )}

          {/* Procesamiento y resultado */}
          {imageSrc && selectedColor && (
            <div className='space-y-4'>
              {/* Imagen original */}
              <div className='border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100'>
                <div className='relative' style={{ paddingBottom: '75%' }}>
                  <img
                    src={imageSrc}
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
          )}

          {/* Canvas oculto para captura y procesamiento */}
          <canvas ref={canvasRef} className='hidden' />
          <canvas ref={imageCanvasRef} className='hidden' />
        </div>
      </DialogContent>
    </Dialog>
  )
}
