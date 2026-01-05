/**
 * Hook para manejar el estado del ShopDetailModal
 * Extrae todos los estados locales y la función de reset
 */

import { useState, useCallback, useRef } from 'react'
import { ProductVariant } from '@/lib/api/product-variants'
import { ProductGroup, RelatedProduct } from '@/lib/api/related-products'
import { ProductWithCategory } from '@/types/api'

/**
 * Hook para manejar el estado del modal
 */
export const useShopDetailState = () => {
  // Estados de selección
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedCapacity, setSelectedCapacity] = useState<string>('')
  const [selectedGrain, setSelectedGrain] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedWidth, setSelectedWidth] = useState<string>('')
  const [selectedFinish, setSelectedFinish] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  
  // Estados de carga
  const [isLoading, setIsLoading] = useState(false)
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [loadingRelatedProducts, setLoadingRelatedProducts] = useState(false)
  const [loadingProductData, setLoadingProductData] = useState(false)
  
  // Estados de datos
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [relatedProducts, setRelatedProducts] = useState<ProductGroup | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedRelatedProduct, setSelectedRelatedProduct] = useState<RelatedProduct | null>(null)
  const [fullProductData, setFullProductData] = useState<ProductWithCategory | null>(null)
  
  // Ref para prevenir re-inicialización múltiple
  const hasInitialized = useRef(false)

  // Función para resetear estados
  const resetStates = useCallback(() => {
    setSelectedColor('')
    setSelectedCapacity('')
    setSelectedGrain('')
    setSelectedSize('')
    setSelectedWidth('')
    setSelectedFinish('')
    setQuantity(1)
    setVariants([])
    setSelectedVariant(null)
    setFullProductData(null)
    hasInitialized.current = false // Reset flag de inicialización
  }, [])

  return {
    // Estados de selección
    selectedColor,
    setSelectedColor,
    selectedCapacity,
    setSelectedCapacity,
    selectedGrain,
    setSelectedGrain,
    selectedSize,
    setSelectedSize,
    selectedWidth,
    setSelectedWidth,
    selectedFinish,
    setSelectedFinish,
    quantity,
    setQuantity,
    
    // Estados de carga
    isLoading,
    setIsLoading,
    loadingVariants,
    setLoadingVariants,
    loadingRelatedProducts,
    setLoadingRelatedProducts,
    loadingProductData,
    setLoadingProductData,
    
    // Estados de datos
    variants,
    setVariants,
    relatedProducts,
    setRelatedProducts,
    selectedVariant,
    setSelectedVariant,
    selectedRelatedProduct,
    setSelectedRelatedProduct,
    fullProductData,
    setFullProductData,
    
    // Refs
    hasInitialized,
    
    // Funciones
    resetStates,
  }
}

