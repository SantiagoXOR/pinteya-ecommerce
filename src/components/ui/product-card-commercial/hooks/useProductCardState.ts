'use client'

import React from 'react'

interface UseProductCardStateOptions {
  image?: string
  title?: string
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
 */
export const useProductCardState = ({
  image,
  title
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

  // Actualizar imagen cuando cambie la prop
  React.useEffect(() => {
    if (image && image !== currentImageSrc) {
      console.log(`🔄 [ProductCardState] Actualizando imagen para ${title}:`, {
        from: currentImageSrc,
        to: image
      })
      setCurrentImageSrc(image)
      setImageError(false)
    }
  }, [image, currentImageSrc, title])

  // Handler para abrir el modal
  const handleOpenModal = React.useCallback(() => {
    setShowShopDetailModal(true)
  }, [showShopDetailModal, title])

  // Handler para el modal
  const handleModalOpenChange = React.useCallback((open: boolean) => {
    console.log('🔄 [ProductCardState] onOpenChange llamado:', { 
      open, 
      currentState: showShopDetailModal,
      productTitle: title 
    })
    
    setShowShopDetailModal(open)
    
    // Si el modal se está cerrando, ignorar clics en el card por un breve período
    if (!open) {
      ignoreClicksUntilRef.current = Date.now() + 300
      console.log('🛡️ [ProductCardState] Activando guardia anti-click fantasma')
    }
  }, [showShopDetailModal, title])

  // Función para manejar errores de imagen
  const handleImageError = React.useCallback(() => {
    console.log(`❌ [ProductCardState] Error de imagen: ${currentImageSrc}`)
    
    if (!imageError) {
      setImageError(true)
      setCurrentImageSrc('/images/products/placeholder.svg')
      console.log(`✅ Fallback aplicado: /images/products/placeholder.svg`)
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

