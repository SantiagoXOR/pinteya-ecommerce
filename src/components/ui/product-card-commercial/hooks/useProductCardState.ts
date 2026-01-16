'use client'

import React from 'react'
import { logger } from '../utils/logger'

interface UseProductCardStateOptions {
  image?: string
  title?: string
  resolvedImage?: string // Imagen resuelta dinámicamente desde useProductCardData
}

interface UseProductCardStateResult {
  // Estados de UI
  isHovered: boolean
  setIsHovered: React.Dispatch<React.SetStateAction<boolean>>
  isAddingToCart: boolean
  setIsAddingToCart: React.Dispatch<React.SetStateAction<boolean>>
  showQuickActions: boolean
  setShowQuickActions: React.Dispatch<React.SetStateAction<boolean>>
  showShopDetailModal: boolean
  setShowShopDetailModal: React.Dispatch<React.SetStateAction<boolean>>
  showColorsSheet: boolean
  setShowColorsSheet: React.Dispatch<React.SetStateAction<boolean>>
  showSuccessToast: boolean
  setShowSuccessToast: React.Dispatch<React.SetStateAction<boolean>>
  
  // Estados de imagen
  imageError: boolean
  setImageError: React.Dispatch<React.SetStateAction<boolean>>
  currentImageSrc: string
  setCurrentImageSrc: React.Dispatch<React.SetStateAction<string>>
  
  // Estados de carrito
  cartAddCount: number
  setCartAddCount: React.Dispatch<React.SetStateAction<number>>
  
  // Ref para ignorar clics
  ignoreClicksUntilRef: React.MutableRefObject<number>
  
  // Handlers
  handleOpenModal: () => void
  handleModalOpenChange: (open: boolean) => void
  handleImageError: () => void
}

/**
 * Hook para manejar el estado del ProductCard
 * Mejorado para soportar imágenes dinámicas cuando cambia la variante seleccionada
 */
export const useProductCardState = ({
  image,
  title,
  resolvedImage
}: UseProductCardStateOptions): UseProductCardStateResult => {
  // Estados de UI
  const [isHovered, setIsHovered] = React.useState(false)
  const [isAddingToCart, setIsAddingToCart] = React.useState(false)
  const [showQuickActions, setShowQuickActions] = React.useState(false)
  const [showShopDetailModal, setShowShopDetailModal] = React.useState(false)
  const [showColorsSheet, setShowColorsSheet] = React.useState(false)
  const [showSuccessToast, setShowSuccessToast] = React.useState(false)
  
  // Estados de imagen
  const [imageError, setImageError] = React.useState(false)
  const [currentImageSrc, setCurrentImageSrc] = React.useState(image || '/images/products/placeholder.svg')
  
  // Estados de carrito
  const [cartAddCount, setCartAddCount] = React.useState<number>(0)
  
  // Ref para ignorar clics justo después de cerrar el modal
  const ignoreClicksUntilRef = React.useRef<number>(0)

  // Ref para rastrear el valor anterior de la imagen y evitar actualizaciones innecesarias
  const prevImageSrcRef = React.useRef<string>(currentImageSrc)

  // Actualizar imagen cuando cambie la prop o la imagen resuelta dinámicamente
  // Prioridad: resolvedImage > image > placeholder
  // ✅ FIX: Removido currentImageSrc y title de las dependencias para evitar loop infinito
  // Solo reaccionamos a cambios en las props externas (image, resolvedImage)
  React.useEffect(() => {
    const newImageSrc = resolvedImage || image || '/images/products/placeholder.svg'
    
    // Solo actualizar si el nuevo valor es diferente al valor anterior
    if (newImageSrc && newImageSrc !== prevImageSrcRef.current) {
      logger.debug(`[ProductCardState] Actualizando imagen para ${title}`, {
        from: prevImageSrcRef.current,
        to: newImageSrc,
        source: resolvedImage ? 'resolvedImage' : 'image'
      })
      setCurrentImageSrc(newImageSrc)
      prevImageSrcRef.current = newImageSrc
      setImageError(false)
    }
  }, [image, resolvedImage, title])

  // Handler para abrir el modal
  const handleOpenModal = React.useCallback(() => {
    setShowShopDetailModal(true)
  }, [])

  // Handler para el modal
  const handleModalOpenChange = React.useCallback((open: boolean) => {
    setShowShopDetailModal(open)
    
    // Si el modal se está cerrando, ignorar clics en el card por un breve período
    if (!open) {
      ignoreClicksUntilRef.current = Date.now() + 300
    }
  }, [])

  // Función para manejar errores de imagen
  const handleImageError = React.useCallback(() => {
    if (!imageError) {
      logger.warn(`[ProductCardState] Error de imagen: ${currentImageSrc}`)
      setImageError(true)
      const placeholder = '/images/products/placeholder.svg'
      setCurrentImageSrc(placeholder)
      // Sincronizar el ref para mantener consistencia
      prevImageSrcRef.current = placeholder
    }
  }, [currentImageSrc, imageError])

  return {
    // Estados de UI
    isHovered,
    setIsHovered,
    isAddingToCart,
    setIsAddingToCart,
    showQuickActions,
    setShowQuickActions,
    showShopDetailModal,
    setShowShopDetailModal,
    showColorsSheet,
    setShowColorsSheet,
    showSuccessToast,
    setShowSuccessToast,
    
    // Estados de imagen
    imageError,
    setImageError,
    currentImageSrc,
    setCurrentImageSrc,
    
    // Estados de carrito
    cartAddCount,
    setCartAddCount,
    
    // Ref
    ignoreClicksUntilRef,
    
    // Handlers
    handleOpenModal,
    handleModalOpenChange,
    handleImageError
  }
}

