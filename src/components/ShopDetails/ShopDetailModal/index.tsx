/**
 * Componente principal ShopDetailModal
 * Orquestador que usa hooks y componentes extraídos
 * 
 * NOTA: Este componente mantiene lógica compleja que no se puede extraer fácilmente
 * como smartColors, cálculo de precios dinámicos, manejo de imágenes complejo, etc.
 */

'use client'

import React, { useEffect, useCallback, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'react-hot-toast'
import { trackAddToCart as trackGA4AddToCart } from '@/lib/google-analytics'
import { trackAddToCart as trackMetaAddToCart } from '@/lib/meta-pixel'
import { useAnalytics } from '@/components/Analytics/SimpleAnalyticsProvider'
import { Ruler } from '@/lib/optimized-imports'
// import { useShopDetailsReducer } from '@/hooks/optimization/useShopDetailsReducer' // No se usa actualmente
import { useRouter } from 'next/navigation'
import { ProductModalSkeleton } from '@/components/ui/product-modal-skeleton'
import {
  PAINT_COLORS,
  ColorOption,
} from '@/components/ui/advanced-color-picker'
import { detectProductType, formatCapacity, getDefaultColor, extractColorFromName, getColorHex } from '@/utils/product-utils'
import { getTextureForProductType } from '@/lib/textures'
import {
  ProductVariant,
  findVariantByCapacity,
  getEffectivePrice,
  hasDiscount,
} from '@/lib/api/product-variants'
import {
  ProductGroup,
  RelatedProduct,
  getAvailableMeasures,
  findProductByMeasure,
} from '@/lib/api/related-products'
import { getValidImageUrl } from '@/lib/adapters/product-adapter'
import { resolveProductImage } from '@/components/ui/product-card-commercial/utils/image-resolver'
import type { ProductVariant } from '@/components/ui/product-card-commercial/types'
import { useShopDetailState } from './hooks/useShopDetailState'
import { useProductData } from './hooks/useProductData'
import { useProductVariants } from './hooks/useProductVariants'
import { useRelatedProducts } from './hooks/useRelatedProducts'
import { useVariantSelection } from './hooks/useVariantSelection'
import { detectCapacityUnit, extractAvailableCapacities, extractAvailableFinishes, getFinishesForColor } from './utils/product-utils'
import { getColorHexFromName } from './utils/color-utils'
import { calculateEffectivePrice, calculateOriginalPrice, hasDiscount as hasDiscountUtil, formatPrice } from './utils/price-utils'
import { findVariantBySelection, normalizeMeasure } from './utils/variant-utils'
import { ProductImageGallery } from './components/ProductImageGallery'
import { ProductInfo } from './components/ProductInfo'
import { ProductSpecifications } from './components/ProductSpecifications'
import { AddToCartSection } from './components/AddToCartSection'
import { RelatedProducts } from './components/RelatedProducts'
import { QuantitySelector } from './components/QuantitySelector'
import { GrainSelector } from './components/VariantSelectors/GrainSelector'
import { SizeSelector } from './components/VariantSelectors/SizeSelector'
import { WidthSelector } from './components/VariantSelectors/WidthSelector'
import { FinishSelector } from './components/VariantSelectors/FinishSelector'
import { CapacitySelector } from './components/VariantSelectors/CapacitySelector'
import type { ShopDetailModalProps, Product } from './types'

// Lazy load de componentes pesados
// NOTA: SuggestedProductsCarousel se carga dinámicamente en RelatedProducts.tsx
// para evitar dependencia circular con product-card-commercial
const AdvancedColorPicker = React.lazy(async () => {
  try {
    const mod = await import('@/components/ui/advanced-color-picker')
    return { default: mod.AdvancedColorPicker || mod.default }
  } catch (error) {
    console.error('❌ [ShopDetailModal] Error cargando AdvancedColorPicker:', error)
    throw error
  }
})

export const ShopDetailModal: React.FC<ShopDetailModalProps> = ({
  product,
  open,
  onOpenChange,
  onAddToCart,
  onAddToWishlist,
}) => {
  console.log('🎯 [ShopDetailModal] Componente renderizado con:', {
    open,
    productId: product?.id,
    productName: product?.name
  })
  
  const router = useRouter()
  const { trackCartAction } = useAnalytics()
  
  // Usar hooks personalizados
  const state = useShopDetailState()
  const {
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
    isLoading,
    setIsLoading,
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
    hasInitialized,
    resetStates,
  } = state

  const { fullProductData: productData, loadingProductData, productType } = useProductData(product, open)
  
  // Sincronizar fullProductData del hook con el estado
  useEffect(() => {
    if (productData) {
      setFullProductData(productData)
    }
  }, [productData, setFullProductData])

  // Usar hook de variantes
  const { loadingVariants } = useProductVariants({
    product,
    open,
    fullProductData: productData,
    hasInitialized,
    selectedCapacity,
    setVariants,
    setSelectedVariant,
    setSelectedFinish,
  })

  // Usar hook de productos relacionados
  const { loadingRelatedProducts } = useRelatedProducts({
    product,
    open,
    setRelatedProducts,
  })

  // Usar hook de selección de variantes
  useVariantSelection({
    variants,
    selectedColor,
    selectedCapacity,
    selectedFinish,
    relatedProducts,
    hasInitialized,
    selectedVariant,
    setSelectedVariant,
    setSelectedRelatedProduct,
  })

  // Resetear estados cuando se cierra el modal
  useEffect(() => {
    if (!open) {
      resetStates()
    }
  }, [open, resetStates])

  // Colores inteligentes (lógica compleja mantenida aquí - demasiado específica para extraer)
  // IMPORTANTE: Definir TEMPRANO para evitar errores de inicialización
  const smartColors: ColorOption[] = useMemo(() => {
    if (!productType.hasColorSelector) return []
    // ✅ CORREGIDO: Asegurar que variants sea siempre un array
    const safeVariants = Array.isArray(variants) ? variants : []
    const variantsToUse = safeVariants.length > 0 ? safeVariants : (Array.isArray((product as any)?.variants) ? (product as any).variants : [])
    
    // Obtener textura según tipo de producto (fallback)
    const defaultTextureType = getTextureForProductType(productType.id)
    
    if (variantsToUse && variantsToUse.length > 0) {
      const variantNames = Array.from(
        new Set(
          variantsToUse
            .map(v => (v.color_name || '').toString().trim())
            .filter(Boolean)
        )
      )
      const list: ColorOption[] = []
      for (const name of variantNames) {
        const slug = name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/\s+/g, '-').trim()
        
        // Buscar la variante para obtener finish y color_hex
        const variantWithColor = variantsToUse.find((v: any) => 
          v.color_name?.toLowerCase() === name.toLowerCase()
        )
        const variantFinish = variantWithColor?.finish || ''
        
        const found = PAINT_COLORS.find(
          c => c.id === slug || c.name === slug || c.displayName.toLowerCase() === name.toLowerCase()
        )
        if (found) {
          // Usar el color encontrado pero agregar finish de la variante
          if (!list.find(l => l.id === found.id)) {
            list.push({
              ...found,
              textureType: found.textureType || defaultTextureType,
              finish: variantFinish // Agregar finish de la variante
            })
          }
        } else {
          // ✅ CORREGIDO: Priorizar color_hex de la variante (como ProductCard)
          const hexFromMap = variantWithColor?.color_hex || getColorHex(name) || '#E5E7EB'
          list.push({
            id: slug,
            name: name.toLowerCase(),
            displayName: name,
            hex: hexFromMap,
            category: '',
            family: 'Personalizados',
            isPopular: false,
            description: `Color ${name}`,
            textureType: defaultTextureType,
            finish: variantFinish // Agregar finish de la variante
          })
        }
      }
      return list.sort((a, b) => a.displayName.localeCompare(b.displayName))
    }
    return []
  }, [productType.hasColorSelector, productType.id, variants, product])

  // Colores disponibles (fallback)
  // IMPORTANTE: Definir TEMPRANO para evitar errores de inicialización
  const availableColors = useMemo(() => {
    if (!productType.hasColorSelector) return []
    // ✅ CORREGIDO: Asegurar que variants sea siempre un array
    const safeVariants = Array.isArray(variants) ? variants : []
    const variantsToUse = safeVariants.length > 0 ? safeVariants : (Array.isArray((product as any)?.variants) ? (product as any).variants : [])
    
    // Obtener textura según tipo de producto (fallback)
    const defaultTextureType = getTextureForProductType(productType.id)
    
    if (variantsToUse && variantsToUse.length > 0) {
      const uniqueColors = new Set<string>()
      variantsToUse.forEach((variant: any) => {
        if (variant.color_name) {
          uniqueColors.add(variant.color_name)
        }
      })
      return Array.from(uniqueColors).map(colorName => {
        // Buscar la variante para obtener finish y color_hex
        const variantWithColor = variantsToUse.find((v: any) => 
          v.color_name?.toLowerCase() === colorName.toLowerCase()
        )
        const variantFinish = variantWithColor?.finish || ''
        
        const existingColor = PAINT_COLORS.find(c => 
          c.name.toLowerCase() === colorName.toLowerCase() ||
          c.displayName.toLowerCase() === colorName.toLowerCase()
        )
        if (existingColor) {
          return {
            ...existingColor,
            textureType: existingColor.textureType || defaultTextureType,
            finish: variantFinish
          }
        }
        // ✅ CORREGIDO: Priorizar color_hex de la variante (como ProductCard)
        const hexFromVariant = variantWithColor?.color_hex || getColorHex(colorName) || '#E5E7EB'
        return {
          id: colorName.toLowerCase().replace(/\s+/g, '-'),
          name: colorName.toLowerCase(),
          displayName: colorName,
          hex: hexFromVariant,
          category: '',
          family: 'Personalizados',
          isPopular: false,
          description: `Color ${colorName}`,
          textureType: defaultTextureType,
          finish: variantFinish
        } as ColorOption
      })
    }
    return product.colors || []
  }, [variants, productType.hasColorSelector, productType.id, product])

  // Calcular capacityUnit usando utilidad extraída
  const capacityUnit = useMemo(() => {
    // ✅ CORREGIDO: Asegurar que variants sea siempre un array
    const safeVariants = Array.isArray(variants) ? variants : []
    return detectCapacityUnit(
      productData,
      selectedCapacity,
      safeVariants,
      relatedProducts,
      productType
    )
  }, [productData, selectedCapacity, variants, relatedProducts, productType])

  // Calcular capacidades disponibles usando utilidad extraída
  const availableCapacities = useMemo(() => {
    // ✅ CORREGIDO: Asegurar que variants sea siempre un array
    const safeVariants = Array.isArray(variants) ? variants : []
    
    // PRIORIDAD 1: Si hay variantes con medidas, usar SOLO esas
    if (safeVariants.length > 0) {
      const capacities = extractAvailableCapacities(safeVariants)
      if (capacities.length > 0) return capacities
    }

    // PRIORIDAD 2: Productos relacionados (legacy, sin variantes)
    if (relatedProducts?.products && relatedProducts.products.length > 0) {
      const measures = getAvailableMeasures(relatedProducts.products)
      if (capacityUnit === 'kg') {
        const kgMeasures = measures.filter(m => /kg/i.test(m))
        if (kgMeasures.length > 0) return kgMeasures
      } else if (capacityUnit === 'litros') {
        const litrosMeasures = measures.filter(m => /\b\d+\s?(l|lt|lts|litro|litros)\b/i.test(m) || /l$/i.test(m))
        if (litrosMeasures.length > 0) return litrosMeasures
      } else {
        if (measures.length > 0) return measures
      }
    }

    // PRIORIDAD 3: Producto padre (solo si tiene medida válida)
    const medidaFromDb = ((productData as any)?.medida || (productData as any)?.measure || '')
      .toString()
      .trim()
    if (medidaFromDb && medidaFromDb !== 'Sin especificar') {
      const parts = medidaFromDb
        .split(/[,\/;\|]+/)
        .map(s => s.trim())
        .filter(Boolean)
        .filter(p => p !== 'Sin especificar')
      if (parts.length > 0) {
        return parts.map(c => c.toUpperCase()).sort((a, b) => parseInt(a) - parseInt(b))
      }
    }

    // ✅ CORREGIDO: NO devolver defaultCapacities como fallback - retornar array vacío
    // Esto evita mostrar selectores cuando el producto no tiene realmente capacidades
    return []
  }, [variants, productData, capacityUnit, relatedProducts?.products])

  // Obtener TODOS los finishes únicos del producto (para mostrar todas las opciones)
  const allFinishes = useMemo(() => {
    const safeVariants = Array.isArray(variants) ? variants : []
    return extractAvailableFinishes(safeVariants)
  }, [variants])

  // Helper para extraer ancho de medida
  const extractWidthFromMeasure = useCallback((measure: string): string => {
    if (measure.includes(' x ')) {
      return measure.split(' x ')[0]
    }
    return measure
  }, [])

  // Mapeo de anchos a precios (lógica específica mantenida aquí)
  const widthToPriceMap = useMemo(() => {
    const map: { [key: string]: { price: string; discounted_price: string } } = {}
    map['18mm'] = { price: '2141.00', discounted_price: '1498.70' }
    map['24mm'] = { price: '2854.00', discounted_price: '1997.80' }
    map['36mm'] = { price: '4288.00', discounted_price: '3001.60' }
    map['48mm'] = { price: '5709.00', discounted_price: '3996.30' }
    return map
  }, [])

  // Calcular precio dinámico (lógica compleja mantenida aquí)
  const calculateDynamicPrice = useCallback(() => {
    if (selectedVariant) {
      return getEffectivePrice(selectedVariant)
    }
    if (selectedWidth && productType.hasWidthSelector && Array.isArray(variants) && variants.length > 0) {
      const variantByMeasure = variants.find(variant => 
        variant.measure && variant.measure.includes(selectedWidth)
      )
      if (variantByMeasure) {
        return parseFloat(variantByMeasure.price_sale || variantByMeasure.price_list)
      }
    }
    const baseCandidate = product.price ?? (productData as any)?.discounted_price ?? (productData as any)?.price
    let basePrice = typeof baseCandidate === 'number' ? baseCandidate : parseFloat(String(baseCandidate))
    if (!Number.isFinite(basePrice)) {
      basePrice = typeof product.price === 'number' ? product.price : parseFloat(String(product.price))
      if (!Number.isFinite(basePrice)) basePrice = 0
    }
    if (selectedSize && productType.hasSizeSelector && productType.id === 'pinceles') {
      const sizeMultipliers: { [key: string]: number } = {
        '1/2"': 1.0,
        '1"': 1.2,
        '1 1/2"': 1.4,
        '2"': 1.6,
        '2 1/2"': 1.8,
        '3"': 2.0,
        '4"': 2.4,
      }
      const multiplier = sizeMultipliers[selectedSize] || 1.0
      basePrice *= multiplier
    }
    return basePrice
  }, [selectedVariant, selectedSize, selectedWidth, productType, product, variants, productData])

  // Calcular precio actual
  const finalCurrentPrice = useMemo(() => {
    if (selectedVariant) {
      return getEffectivePrice(selectedVariant)
    }
    if (selectedWidth && productType.hasWidthSelector) {
      const widthKey = extractWidthFromMeasure(selectedWidth)
      if (widthToPriceMap[widthKey]) {
        return parseFloat(widthToPriceMap[widthKey].discounted_price || widthToPriceMap[widthKey].price)
      }
    }
    if (selectedRelatedProduct) {
      return parseFloat(selectedRelatedProduct.discounted_price || selectedRelatedProduct.price)
    }
    if (selectedSize && productType.hasSizeSelector) {
      return calculateDynamicPrice()
    }
    // ✅ CORREGIDO: Priorizar discounted_price del producto cuando no hay variantes
    const candidate = (productData as any)?.discounted_price ?? product.price ?? (productData as any)?.price
    const n = typeof candidate === 'number' ? candidate : parseFloat(String(candidate))
    return Number.isFinite(n) ? n : 0
  }, [
    selectedVariant,
    selectedWidth,
    selectedSize,
    selectedRelatedProduct,
    productType,
    widthToPriceMap,
    calculateDynamicPrice,
    product,
    productData,
  ])

  const originalPrice = useMemo(() => {
    // ✅ CORREGIDO: Si no hay variante, usar precio del producto como originalPrice
    const calculated = calculateOriginalPrice(
      selectedVariant,
      selectedRelatedProduct,
      product,
      selectedWidth,
      widthToPriceMap,
      productType
    )
    // Si no hay variante y no hay precio calculado, usar price del producto como originalPrice
    if (!calculated && !selectedVariant && !selectedRelatedProduct) {
      // ✅ CORREGIDO: Usar price del producto como originalPrice cuando hay discounted_price
      const productPrice = (productData as any)?.price || product?.price
      const productDiscountedPrice = (productData as any)?.discounted_price
      // Si hay descuento, el originalPrice es el price, no el discounted_price
      if (productDiscountedPrice && productPrice && productPrice > productDiscountedPrice) {
        return productPrice
      }
      return productPrice
    }
    return calculated
  }, [selectedVariant, selectedRelatedProduct, product, productData, selectedWidth, widthToPriceMap, productType])

  const hasVariantDiscount = useMemo(() => {
    if (selectedVariant) {
      return hasDiscount(selectedVariant)
    }
    if (originalPrice && finalCurrentPrice) {
      return hasDiscountUtil(originalPrice, finalCurrentPrice)
    }
    // ✅ CORREGIDO: Verificar descuento del producto cuando no hay variantes
    const productOriginalPrice = product?.originalPrice || (productData as any)?.price
    const productDiscountedPrice = finalCurrentPrice || (productData as any)?.discounted_price || product?.price
    if (productOriginalPrice && productDiscountedPrice && productOriginalPrice > productDiscountedPrice) {
      return true
    }
    return product.originalPrice && product.originalPrice > product.price
  }, [selectedVariant, originalPrice, finalCurrentPrice, product, productData])

  // Stock efectivo
  const effectiveStock = useMemo(() => {
    const toNumber = (v: any): number | undefined => {
      const n = typeof v === 'number' ? v : parseFloat(String(v))
      return Number.isFinite(n) ? n : undefined
    }
    const variantStock = toNumber(selectedVariant?.stock)
    const relatedStock = toNumber(selectedRelatedProduct?.stock)
    const baseStock = toNumber((productData as any)?.stock ?? (product as any)?.stock ?? 0) ?? 0
    return (variantStock ?? relatedStock ?? baseStock) || 0
  }, [selectedVariant, selectedRelatedProduct, productData, product])

  // Imagen principal (lógica compleja mantenida aquí)
  const mainImageUrl = useMemo(() => {
    const sanitize = (u?: string) => (typeof u === 'string' ? u.replace(/[`"]/g, '').trim() : '')
    const urlFrom = (c: any) => {
      if (!c) return ''
      if (typeof c === 'string') return sanitize(c)
      return sanitize(c?.url || c?.image_url)
    }
    
    // ✅ CORREGIDO: Prioridad 1 - image_url desde product_images (API) - productData primero
    if ((productData as any)?.image_url) {
      const apiImage = sanitize((productData as any).image_url)
      const validated = getValidImageUrl(apiImage)
      if (validated && !validated.includes('placeholder')) return validated
    }
    
    // ✅ NUEVO: Prioridad 1.5 - image_url del product inicial (mientras carga productData)
    if ((product as any)?.image_url) {
      const productImage = sanitize((product as any).image_url)
      const validated = getValidImageUrl(productImage)
      if (validated && !validated.includes('placeholder')) return validated
    }
    
    if (selectedVariant?.image_url) {
      const variantImage = sanitize(selectedVariant.image_url)
      const validated = getValidImageUrl(variantImage)
      if (validated && !validated.includes('placeholder')) return validated
    }
    
    if (selectedRelatedProduct?.image_url) {
      const relatedImage = sanitize(selectedRelatedProduct.image_url)
      const validated = getValidImageUrl(relatedImage)
      if (validated && !validated.includes('placeholder')) return validated
    }
    
    const resolvedProductDataImage = resolveProductImage({
      image_url: (productData as any)?.image_url || null,
      default_variant: (productData as any)?.default_variant || null,
      variants: ((productData as any)?.variants || []) as ProductVariant[],
      images: (productData as any)?.images || null,
      imgs: (productData as any)?.imgs || null
    })
    const resolvedProductImage = resolveProductImage({
      image_url: (product as any)?.image_url || null,
      default_variant: (product as any)?.default_variant || null,
      variants: ((product as any)?.variants || []) as ProductVariant[],
      images: (product as any)?.images || null,
      imgs: (product as any)?.imgs || null
    })
    const candidates: any[] = [
      resolvedProductDataImage,
      resolvedProductImage,
      product?.image,
    ]
    for (const c of candidates) {
      const candidate = urlFrom(c)
      const validated = getValidImageUrl(candidate)
      if (validated && !validated.includes('placeholder')) return validated
    }
    return '/images/products/placeholder.svg'
  }, [selectedVariant, selectedRelatedProduct, productData, product])


  // Obtener anchos disponibles
  const availableWidths = useMemo(() => {
    if (!productType.hasWidthSelector) return []
    if (relatedProducts?.products) {
      const measures = getAvailableMeasures(relatedProducts.products)
      return measures.map(extractWidthFromMeasure)
    }
    if (Array.isArray(variants) && variants.length > 0) {
      const widths = variants
        .filter(variant => variant.measure && variant.is_active)
        .map(variant => extractWidthFromMeasure(variant.measure))
        .filter((measure, index, self) => self.indexOf(measure) === index)
        .sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, ''))
          const numB = parseInt(b.replace(/\D/g, ''))
          return numA - numB
        })
      return widths
    }
    if (productType.widthOptions && productType.widthOptions.length > 0) {
      return productType.widthOptions.map(extractWidthFromMeasure)
    }
    return []
  }, [productType.hasWidthSelector, productType.widthOptions, relatedProducts?.products, variants])

  // Obtener finishes disponibles para el color seleccionado (para determinar cuáles habilitar/deshabilitar)
  // IMPORTANTE: Debe estar después de la definición de smartColors y availableColors
  // NOTA: smartColors y availableColors están definidos arriba y se recalculan automáticamente cuando cambian variants/product
  // No incluimos smartColors/availableColors en dependencias para evitar error de inicialización - se recalculan cuando variants cambia
  const availableFinishesForColor = useMemo(() => {
    const safeVariants = Array.isArray(variants) ? variants : []
    // Usar validación segura para evitar error de inicialización
    const safeColors = (smartColors && Array.isArray(smartColors) && smartColors.length > 0) 
      ? smartColors 
      : (availableColors && Array.isArray(availableColors) ? availableColors : [])
    return getFinishesForColor(
      safeVariants, 
      selectedColor, 
      safeColors,
      product?.name,
      product?.id
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variants, selectedColor, product?.name, product?.id, product, productType.hasColorSelector])

  // Establecer valores por defecto
  useEffect(() => {
    if (hasInitialized.current) return
    // ✅ CORREGIDO: Solo establecer color por defecto si hay variantes con colores disponibles
    if (!selectedColor && productType.hasColorSelector && Array.isArray(variants) && variants.length > 0) {
      // Verificar que realmente haya variantes con colores
      const hasColorsInVariants = variants.some(v => v.color_name || v.color_hex)
      if (hasColorsInVariants) {
        const defaultColorName = getDefaultColor(productType)
        const defaultColor = PAINT_COLORS.find(color =>
          color.name.toLowerCase().includes(defaultColorName.toLowerCase())
        )
        if (defaultColor) {
          setSelectedColor(defaultColor.id)
        }
      }
    }
    if (!selectedGrain && productType.hasGrainSelector && productType.grainOptions.length > 0) {
      setSelectedGrain(productType.grainOptions[0])
    }
    if (!selectedSize && productType.hasSizeSelector && productType.sizeOptions.length > 0) {
      setSelectedSize(productType.sizeOptions[0])
    }
    if (!selectedWidth && productType.hasWidthSelector && productType.widthOptions.length > 0) {
      setSelectedWidth(productType.widthOptions[0])
    }
  }, [productType, hasInitialized, selectedColor, selectedGrain, selectedSize, selectedWidth, setSelectedColor, setSelectedGrain, setSelectedSize, setSelectedWidth])

  // Actualizar selectedVariant cuando cambia selectedWidth
  useEffect(() => {
    if (selectedWidth && Array.isArray(variants) && variants.length > 0) {
      const variantByWidth = variants.find(v => 
        v.measure && v.measure.includes(selectedWidth)
      )
      if (variantByWidth) {
        setSelectedVariant(variantByWidth)
        setSelectedRelatedProduct(null)
      }
    }
  }, [selectedWidth, variants, setSelectedVariant, setSelectedRelatedProduct])

  // Actualizar selectedFinish cuando cambia el color (para Sintético Converlux)
  useEffect(() => {
    if (!hasInitialized.current) return
    if (!selectedColor || !Array.isArray(variants) || variants.length === 0) return
    
    // Si el finish actual no está disponible para el nuevo color, seleccionar el primero disponible
    if (availableFinishesForColor.length > 0) {
      if (!selectedFinish || !availableFinishesForColor.includes(selectedFinish)) {
        setSelectedFinish(availableFinishesForColor[0])
      }
    } else if (allFinishes.length > 0 && !selectedFinish) {
      // Si no hay finishes disponibles para el color pero hay finishes en el producto, seleccionar el primero
      setSelectedFinish(allFinishes[0])
    }
  }, [selectedColor, availableFinishesForColor, allFinishes, hasInitialized, selectedFinish, variants, setSelectedFinish])

  // Actualizar selectedVariant cuando cambia selectedFinish
  useEffect(() => {
    if (!selectedFinish || !Array.isArray(variants) || variants.length === 0) return
    if (!hasInitialized.current) return
    const compatibleVariant = variants.find(v =>
      v.finish === selectedFinish &&
      (!selectedCapacity || v.measure === selectedCapacity) &&
      (!selectedColor || (() => {
        // Obtener hex del color seleccionado
        const selectedColorOption = [...((smartColors && Array.isArray(smartColors) && smartColors.length > 0) ? smartColors : (availableColors && Array.isArray(availableColors) ? availableColors : []))].find(
          c => c.id === selectedColor || c.hex === selectedColor
        )
        const targetHex = selectedColorOption?.hex || (selectedColor.startsWith('#') ? selectedColor : null)
        
        if (targetHex) {
          if (v.color_hex === targetHex) return true
          if (v.color_name) {
            const variantColorHex = getColorHexFromName(v.color_name)
            if (variantColorHex === targetHex) return true
          }
        }
        
        // Comparación por nombre
        if (v.color_name) {
          const variantName = v.color_name.trim().toUpperCase()
          const selectedUpper = selectedColor.trim().toUpperCase()
          if (variantName === selectedUpper) return true
          
          // Casos especiales
          if ((selectedUpper === 'NEGRO' || selectedUpper === 'BLACK') && variantName === 'NEGRO') return true
          if ((selectedUpper === 'BLANCO' || selectedUpper === 'WHITE') && variantName === 'BLANCO') return true
        }
        
        return false
      })())
    ) || variants.find(v =>
      v.finish === selectedFinish &&
      (!selectedCapacity || v.measure === selectedCapacity)
    ) || variants.find(v => v.finish === selectedFinish)
    if (compatibleVariant && compatibleVariant.id !== selectedVariant?.id) {
      setSelectedVariant(compatibleVariant)
    }
  }, [selectedFinish, variants, selectedCapacity, selectedColor, hasInitialized, selectedVariant, setSelectedVariant])

  // Handle add to cart
  const handleAddToCart = useCallback(async () => {
    if (!product || !onAddToCart) return
    if (effectiveStock !== undefined && quantity > effectiveStock) {
      toast.error(`Stock insuficiente. Solo hay ${effectiveStock} unidades disponibles`)
      return
    }
    if (effectiveStock === 0) {
      toast.error('Producto sin stock disponible')
      return
    }

    const normalize = (v?: string | null): string => {
      if (!v) return ''
      const up = v.trim().toUpperCase()
      const noSpaces = up.replace(/\s+/g, '')
      const kg = noSpaces.replace(/(KGS|KILO|KILOS)$/i, 'KG')
      const l = kg.replace(/(LT|LTS|LITRO|LITROS)$/i, 'L')
      return l
    }

    const rawMeasure = (
      (selectedVariant as any)?.measure ||
      (selectedRelatedProduct as any)?.measure ||
      (selectedRelatedProduct as any)?.medida ||
      selectedCapacity ||
      (productData as any)?.medida ||
      (product as any)?.medida
    ) as string | undefined
    const normalizedMeasure = normalize(rawMeasure || '')

    const unitPrice = Number(finalCurrentPrice) || 0
    const originalUnitPrice = Number(originalPrice) || unitPrice
    const discountedUnitPrice = unitPrice < originalUnitPrice ? unitPrice : undefined

    let productToAdd = product
    if (selectedRelatedProduct) {
      productToAdd = {
        ...selectedRelatedProduct,
        id: selectedRelatedProduct.id,
        name: selectedRelatedProduct.name,
        price: originalUnitPrice,
        ...(discountedUnitPrice !== undefined ? { discounted_price: discountedUnitPrice } : {}),
        medida: (selectedRelatedProduct as any)?.medida || (selectedRelatedProduct as any)?.measure,
        image: product.image,
        images: product.images,
        category: product.category,
        brand: product.brand,
      } as any
    } else if (selectedVariant) {
      productToAdd = {
        ...product,
        id: product.id,
        price: originalUnitPrice,
        ...(discountedUnitPrice !== undefined ? { discounted_price: discountedUnitPrice } : {}),
        capacity: (selectedVariant as any)?.capacity,
        medida: (selectedVariant as any)?.measure,
        variant_id: selectedVariant.id,
        variant_color: selectedVariant.color_name,
        variant_measure: selectedVariant.measure,
      } as any
    } else {
      productToAdd = {
        ...productToAdd,
        price: originalUnitPrice,
        ...(discountedUnitPrice !== undefined ? { discounted_price: discountedUnitPrice } : {}),
      } as any
    }

    const widthForBadge = selectedWidth 
      ? (selectedWidth.includes(' x ') ? selectedWidth.split(' x ')[0] : selectedWidth)
      : null

    const cartData = {
      product: productToAdd,
      quantity,
      selectedColor,
      selectedCapacity,
      selectedGrain,
      selectedSize,
      selectedWidth,
      selectedFinish,
      variants: {
        color: selectedColor,
        capacity: selectedCapacity,
        measure: normalizedMeasure,
        price: unitPrice,
        stock: effectiveStock,
        grain: selectedGrain,
        size: selectedSize,
        width: widthForBadge || selectedWidth,
        finish: selectedFinish || selectedVariant?.finish,
        quantity,
      }
    }

    try {
      await onAddToCart(productToAdd, cartData.variants)
      
      // Analytics
      try {
        const category = (productToAdd as any)?.brand || (productToAdd as any)?.category || 'Producto'
        const productPrice = productToAdd.discounted_price || productToAdd.price || 0
        const productName = productToAdd.name || productToAdd.title || 'Producto'

        trackGA4AddToCart(
          String(productToAdd.id),
          productName,
          category,
          productPrice,
          quantity,
          'ARS'
        )

        const contentIdForMeta = (productToAdd as any)?.variant_id 
          ? String((productToAdd as any).variant_id)
          : String(productToAdd.id)
        
        trackMetaAddToCart(
          productName,
          contentIdForMeta,
          category,
          productPrice * quantity,
          'ARS'
        )

        trackCartAction('add', String(productToAdd.id), {
          productName,
          category,
          price: productPrice,
          quantity,
          currency: 'ARS',
        })
      } catch (analyticsError) {
        console.warn('[Analytics] Error tracking add to cart from modal:', analyticsError)
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Error al agregar al carrito:', error)
    }
  }, [
    product,
    onAddToCart,
    selectedWidth,
    productType.hasWidthSelector,
    selectedRelatedProduct,
    selectedVariant,
    quantity,
    selectedColor,
    selectedCapacity,
    selectedGrain,
    selectedSize,
    selectedFinish,
    onOpenChange,
    finalCurrentPrice,
    originalPrice,
    effectiveStock,
    productData,
  ])

  const handleAddToWishlist = useCallback(() => {
    if (onAddToWishlist && product) {
      onAddToWishlist(product)
      onOpenChange(false)
    }
  }, [onAddToWishlist, product, onOpenChange])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    console.log('🔄 [ShopDetailModal] handleOpenChange llamado:', {
      newOpen,
      currentOpen: open,
      productId: product?.id
    })
    onOpenChange(newOpen)
  }, [onOpenChange, open, product?.id])

  console.log('🎯 [ShopDetailModal] Renderizando Dialog con open:', open)
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent
        className="!w-[calc(100vw-1rem)] sm:!w-[calc(100vw-2rem)] !max-w-4xl !max-h-[80vh] sm:!max-h-[85vh] !p-0 !gap-0 flex flex-col"
        showCloseButton={true}
        onInteractOutside={(e) => {
          console.log('🖱️ [ShopDetailModal] onInteractOutside llamado:', {
            target: e.target,
            currentTarget: e.currentTarget
          })
          handleOpenChange(false)
        }}
      >
        <DialogHeader className="px-4 sm:px-6 py-3 sm:py-4 border-b shrink-0">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 pr-10">
            {productData?.name || product?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="p-4 sm:p-6">
            {loadingProductData ? (
              <ProductModalSkeleton />
            ) : (
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8'>
                {/* Imagen del producto */}
                <ProductImageGallery
                  mainImageUrl={mainImageUrl}
                  productName={productData?.name || product?.name || 'Producto'}
                  galleryImages={(productData as any)?.images?.gallery}
                />

                {/* Información del producto */}
                <div className='space-y-6'>
                  <ProductInfo
                    product={product}
                    fullProductData={productData}
                    currentPrice={finalCurrentPrice}
                    originalPrice={originalPrice}
                    effectiveStock={effectiveStock}
                    hasVariantDiscount={hasVariantDiscount}
                  />

                  {/* Descripción y especificaciones */}
                  <ProductSpecifications
                    fullProductData={productData}
                    product={product}
                    technicalSheetUrl={(productData as any)?.technical_sheet_url || (productData as any)?.technical_sheet?.url}
                  />

                  <Separator />

                  {/* Selectores de variantes */}
                  <div className='space-y-6'>
                    {/* Selector de colores */}
                    {productType.hasColorSelector && ((smartColors && smartColors.length > 0) || (availableColors && availableColors.length > 0)) && (
                      <React.Suspense fallback={<div className="h-32 animate-pulse bg-gray-100 rounded-lg" />}>
                        <AdvancedColorPicker
                          colors={(smartColors && smartColors.length > 0) ? smartColors : availableColors}
                          selectedColor={selectedColor}
                          onColorChange={setSelectedColor}
                          showSearch={false}
                          showCategories={false}
                          maxDisplayColors={(smartColors && smartColors.length > 0) ? smartColors.length : (availableColors?.length || 0)}
                          className='bg-white'
                          productType={productType}
                          selectedFinish={selectedFinish}
                        />
                      </React.Suspense>
                    )}

                    {/* Selector de acabado - mostrar siempre que haya finishes, pero deshabilitar opciones no disponibles */}
                    {allFinishes.length > 0 && (
                      <FinishSelector
                        finishes={allFinishes}
                        availableFinishes={availableFinishesForColor}
                        selectedFinish={selectedFinish || ''}
                        onFinishChange={setSelectedFinish}
                      />
                    )}

                    {/* Selector de capacidad */}
                    {/* ✅ CORREGIDO: Solo mostrar si hay capacidades reales (no fallbacks) */}
                    {availableCapacities.length > 0 &&
                      !(availableCapacities.length === 1 && availableCapacities[0] === 'Sin especificar') &&
                      !productType.hasWidthSelector &&
                      !productType.hasGrainSelector &&
                      !productType.hasSizeSelector &&
                      !(availableCapacities.length === 1 && availableCapacities[0] === '1') &&
                      // ✅ NUEVO: Verificar que las capacidades no sean solo valores por defecto del tipo
                      !(availableCapacities.length === productType.defaultCapacities.length && 
                        availableCapacities.every((cap, idx) => cap === productType.defaultCapacities[idx])) && (
                        <div className='space-y-4'>
                          <div className='flex items-center gap-2'>
                            <Ruler className='w-5 h-5 text-blaze-orange-600' />
                            <span className='text-base font-semibold text-gray-900'>
                              {capacityUnit === 'litros'
                                ? 'Capacidad'
                                : capacityUnit === 'kg'
                                  ? 'Peso'
                                  : capacityUnit === 'metros'
                                    ? 'Longitud'
                                    : 'Tamaño'}
                            </span>
                          </div>
                          <CapacitySelector
                            capacities={availableCapacities}
                            selectedCapacity={selectedCapacity}
                            onCapacityChange={setSelectedCapacity}
                          />
                        </div>
                      )}

                    {/* Selector de cantidad */}
                    <QuantitySelector
                      quantity={quantity}
                      onQuantityChange={setQuantity}
                      onIncrement={() => setQuantity(prev => prev + 1)}
                      onDecrement={() => setQuantity(prev => Math.max(1, prev - 1))}
                      stock={effectiveStock}
                    />

                    {/* Selector de grano */}
                    {productType.hasGrainSelector && (
                      <GrainSelector
                        grainOptions={productType.grainOptions}
                        selectedGrain={selectedGrain}
                        onGrainChange={setSelectedGrain}
                      />
                    )}

                    {/* Selector de tamaño */}
                    {productType.hasSizeSelector && (
                      <SizeSelector
                        sizeOptions={productType.sizeOptions}
                        selectedSize={selectedSize}
                        onSizeChange={setSelectedSize}
                      />
                    )}

                    {/* Selector de ancho */}
                    {productType.hasWidthSelector && (
                      <WidthSelector
                        widthOptions={availableWidths}
                        selectedWidth={selectedWidth}
                        onWidthChange={setSelectedWidth}
                      />
                    )}
                  </div>

                  <Separator />

                  {/* Sección de agregar al carrito */}
                  <AddToCartSection
                    currentPrice={finalCurrentPrice}
                    quantity={quantity}
                    effectiveStock={effectiveStock}
                    isLoading={isLoading}
                    loadingProductData={loadingProductData}
                    onAddToCart={handleAddToCart}
                    onAddToWishlist={onAddToWishlist ? handleAddToWishlist : undefined}
                    productType={productType}
                    selectedColor={selectedColor}
                    selectedCapacity={selectedCapacity}
                    capacityUnit={capacityUnit}
                    selectedVariant={selectedVariant}
                    selectedGrain={selectedGrain}
                    selectedSize={selectedSize}
                    selectedWidth={selectedWidth}
                  />
                </div>
              </div>
            )}

            {/* Productos relacionados */}
            {product && product.id && (
              <React.Suspense fallback={<div>Cargando productos relacionados...</div>}>
                <RelatedProducts
                  productId={product.id}
                  categoryId={(product as any).category?.id}
                  limit={8}
                />
              </React.Suspense>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ShopDetailModal

