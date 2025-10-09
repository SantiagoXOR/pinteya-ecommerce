'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useShopDetailsReducer } from '@/hooks/optimization/useShopDetailsReducer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ShoppingCart,
  Heart,
  Minus,
  Plus,
  Package,
  Box,
  Layers,
  Ruler,
  Maximize,
  Hash,
  X,
} from 'lucide-react'
import { cn } from '@/lib/core/utils'
import { FreeShippingText } from '@/components/ui/free-shipping-text'
import {
  AdvancedColorPicker,
  PAINT_COLORS,
  ColorOption,
} from '@/components/ui/advanced-color-picker'
import { detectProductType, formatCapacity, getDefaultColor } from '@/utils/product-utils'
import {
  ProductVariant,
  getProductVariants,
  findVariantByCapacity,
  getAvailableCapacities,
  getEffectivePrice,
  hasDiscount,
} from '@/lib/api/product-variants'
import { 
  getRelatedProducts, 
  ProductGroup, 
  RelatedProduct,
  getAvailableMeasures,
  findProductByMeasure 
} from '@/lib/api/related-products'
import { getProductById } from '@/lib/api/products'
import { ProductWithCategory } from '@/types/api'
import { supabase } from '@/lib/supabase'
import { logError } from '@/lib/error-handling/centralized-error-handler'



// ===================================
// TIPOS
// ===================================

interface Product {
  id: number
  name: string
  price: number
  originalPrice?: number
  image: string
  brand: string
  stock: number
  description?: string
  colors?: ColorOption[]
  capacities?: string[]
}

interface ShopDetailModalProps {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart?: (product: Product, variants: any) => void
  onAddToWishlist?: (product: Product) => void
}

// ===================================
// COMPONENTES DE SELECTORES
// ===================================

interface ColorSelectorProps {
  colors: string[]
  selectedColor: string
  onColorChange: (color: string) => void
}

const ColorSelector: React.FC<ColorSelectorProps> = ({ colors, selectedColor, onColorChange }) => {
  const colorMap: Record<string, string> = {
    blanco: '#FFFFFF',
    negro: '#000000',
    rojo: '#DC2626',
    azul: '#2563EB',
    verde: '#16A34A',
    amarillo: '#EAB308',
    naranja: '#EA580C',
    gris: '#6B7280',
    marron: '#92400E',
    rosa: '#EC4899',
  }

  return (
    <div className='space-y-3'>
      <h4 className='text-sm font-medium text-gray-900'>Color</h4>
      <div className='flex flex-wrap gap-2'>
        {colors.map(color => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={cn(
              'w-8 h-8 rounded-full border-2 transition-all duration-200',
              selectedColor === color
                ? 'border-blaze-orange-500 ring-2 ring-blaze-orange-200'
                : 'border-gray-300 hover:border-gray-400'
            )}
            style={{
              backgroundColor: colorMap[color.toLowerCase()] || '#E5E7EB',
            }}
            title={color}
            aria-label={`Seleccionar color ${color}`}
          />
        ))}
      </div>
      {selectedColor && (
        <p className='text-sm text-gray-600 capitalize'>
          Color seleccionado:{' '}
          <span className='font-medium'>
            {PAINT_COLORS.find(color => color.id === selectedColor)?.displayName}
          </span>
        </p>
      )}
    </div>
  )
}

interface CapacitySelectorProps {
  capacities: string[]
  selectedCapacity: string
  onCapacityChange: (capacity: string) => void
}

const CapacitySelector: React.FC<CapacitySelectorProps> = ({
  capacities,
  selectedCapacity,
  onCapacityChange,
}) => {
  return (
    <div className='space-y-3'>
      <h4 className='text-sm font-medium text-gray-900'>Capacidad</h4>
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-2'>
        {capacities.map(capacity => (
          <button
            key={capacity}
            onClick={() => onCapacityChange(capacity)}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200',
              selectedCapacity === capacity
                ? 'border-blaze-orange-500 bg-blaze-orange-50 text-blaze-orange-700'
                : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
            )}
          >
            {capacity}
          </button>
        ))}
      </div>
      {selectedCapacity && (
        <p className='text-sm text-gray-600'>
          <span className='font-medium'>{selectedCapacity}</span>
        </p>
      )}
    </div>
  )
}

interface QuantitySelectorProps {
  quantity: number
  onQuantityChange: (quantity: number) => void
  onIncrement: () => void
  onDecrement: () => void
  maxQuantity?: number
  stock: number
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  quantity,
  onQuantityChange,
  onIncrement,
  onDecrement,
  maxQuantity = 99,
  stock,
}) => {
  const isMinQuantity = quantity <= 1
  const isMaxQuantity = quantity >= Math.min(maxQuantity, stock)

  return (
    <div className='space-y-4'>
      <h4 className='text-base font-semibold text-gray-900 flex items-center gap-2'>
        <ShoppingCart className='w-5 h-5 text-blaze-orange-600' />
        Cantidad
      </h4>
      <div className='flex items-center justify-between'>
        <div className='flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm'>
          <button
            onClick={onDecrement}
            disabled={isMinQuantity}
            className={cn(
              'p-3 transition-all duration-200',
              isMinQuantity
                ? 'opacity-50 cursor-not-allowed bg-gray-50'
                : 'hover:bg-blaze-orange-50 hover:text-blaze-orange-600'
            )}
            aria-label='Disminuir cantidad'
          >
            <Minus className='w-4 h-4' />
          </button>

          <div className='w-16 px-3 py-3 text-center border-0 font-semibold text-gray-900 bg-white flex items-center justify-center'>
            {quantity}
          </div>

          <button
            onClick={onIncrement}
            disabled={isMaxQuantity}
            className={cn(
              'p-3 transition-all duration-200',
              isMaxQuantity
                ? 'opacity-50 cursor-not-allowed bg-gray-50'
                : 'hover:bg-blaze-orange-50 hover:text-blaze-orange-600'
            )}
            aria-label='Aumentar cantidad'
          >
            <Plus className='w-4 h-4' />
          </button>
        </div>

        <div className='bg-gray-50 px-3 py-2 rounded-lg hidden'>
          <span
            className={cn('text-sm font-medium', stock > 0 ? 'text-green-600' : 'text-red-600')}
          >
            {stock > 0 ? `${stock} disponibles` : 'Sin stock'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ===================================
// SELECTORES ESPECÍFICOS
// ===================================

interface GrainSelectorProps {
  grainOptions: string[]
  selectedGrain: string
  onGrainChange: (grain: string) => void
}

const GrainSelector: React.FC<GrainSelectorProps> = ({
  grainOptions,
  selectedGrain,
  onGrainChange,
}) => {
  if (!grainOptions || grainOptions.length === 0) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <Layers className='w-5 h-5 text-blaze-orange-600' />
          <span className='text-base font-semibold text-gray-900'>Grano</span>
        </div>
        <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
          No hay opciones de grano disponibles para este producto
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <Layers className='w-5 h-5 text-blaze-orange-600' />
        <span className='text-base font-semibold text-gray-900'>Grano</span>
      </div>
      <div className='grid grid-cols-4 gap-2'>
        {grainOptions.map(grain => (
          <button
            key={grain}
            onClick={() => onGrainChange(grain)}
            className={cn(
              'px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all duration-200 hover:shadow-md',
              selectedGrain === grain
                ? 'border-blaze-orange-500 bg-blaze-orange-50 text-blaze-orange-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blaze-orange-300 hover:bg-blaze-orange-25'
            )}
          >
            {grain}
          </button>
        ))}
      </div>
      {selectedGrain && (
        <p className='text-sm text-gray-600'>
          Grano seleccionado: <span className='font-medium'>{selectedGrain}</span>
        </p>
      )}
    </div>
  )
}

interface SizeSelectorProps {
  sizeOptions: string[]
  selectedSize: string
  onSizeChange: (size: string) => void
}

const SizeSelector: React.FC<SizeSelectorProps> = ({ sizeOptions, selectedSize, onSizeChange }) => {
  if (!sizeOptions || sizeOptions.length === 0) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center gap-2'>
          <Ruler className='w-5 h-5 text-blaze-orange-600' />
          <span className='text-base font-semibold text-gray-900'>Tamaño</span>
        </div>
        <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
          No hay opciones de tamaño disponibles para este producto
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <Ruler className='w-5 h-5 text-blaze-orange-600' />
        <span className='text-base font-semibold text-gray-900'>Tamaño</span>
      </div>
      <div className='grid grid-cols-3 gap-2'>
        {sizeOptions.map(size => (
          <button
            key={size}
            onClick={() => onSizeChange(size)}
            className={cn(
              'px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all duration-200 hover:shadow-md',
              selectedSize === size
                ? 'border-blaze-orange-500 bg-blaze-orange-50 text-blaze-orange-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blaze-orange-300 hover:bg-blaze-orange-25'
            )}
          >
            {size}
          </button>
        ))}
      </div>
      {selectedSize && (
        <p className='text-sm text-gray-600'>
          Tamaño seleccionado: <span className='font-medium'>{selectedSize}</span>
        </p>
      )}
    </div>
  )
}

interface WidthSelectorProps {
  widthOptions: string[]
  selectedWidth: string
  onWidthChange: (width: string) => void
}

const WidthSelector: React.FC<WidthSelectorProps> = ({
  widthOptions,
  selectedWidth,
  onWidthChange,
}) => {
  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <Maximize className='w-5 h-5 text-blaze-orange-600' />
        <span className='text-base font-semibold text-gray-900'>Ancho</span>
      </div>
      <div className='grid grid-cols-3 gap-2'>
        {widthOptions.map(width => (
          <button
            key={width}
            onClick={() => onWidthChange(width)}
            className={cn(
              'px-3 py-2 rounded-lg border-2 text-sm font-semibold transition-all duration-200 hover:shadow-md',
              selectedWidth === width
                ? 'border-blaze-orange-500 bg-blaze-orange-50 text-blaze-orange-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blaze-orange-300 hover:bg-blaze-orange-25'
            )}
          >
            {width}
          </button>
        ))}
      </div>
      {selectedWidth && (
        <p className='text-sm text-gray-600'>
          Ancho seleccionado: <span className='font-medium'>{selectedWidth}</span>
        </p>
      )}
    </div>
  )
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export const ShopDetailModal: React.FC<ShopDetailModalProps> = ({
  product,
  open,
  onOpenChange,
  onAddToCart,
  onAddToWishlist,
}) => {
  const { state, actions, selectors } = useShopDetailsReducer()

  // Estados del modal
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedCapacity, setSelectedCapacity] = useState<string>('')
  const [selectedGrain, setSelectedGrain] = useState<string>('')
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedWidth, setSelectedWidth] = useState<string>('')
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [variants, setVariants] = useState<ProductVariant[]>([])  
  const [relatedProducts, setRelatedProducts] = useState<ProductGroup | null>(null)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedRelatedProduct, setSelectedRelatedProduct] = useState<RelatedProduct | null>(null)
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [loadingRelatedProducts, setLoadingRelatedProducts] = useState(false)
  
  // Estado para datos completos del producto
  const [fullProductData, setFullProductData] = useState<ProductWithCategory | null>(null)
  const [loadingProductData, setLoadingProductData] = useState(false)

  // Función para resetear estados
  const resetStates = () => {
    setSelectedColor('')
    setSelectedCapacity('')
    setSelectedGrain('')
    setSelectedSize('')
    setSelectedWidth('')
    setQuantity(1)
    setVariants([])
    setSelectedVariant(null)
    setFullProductData(null)
  }

  // Cargar datos completos del producto
  useEffect(() => {
    console.log('🔄 ShopDetailModal useEffect[1]: open =', open, 'product?.id =', product?.id)
    if (open && product?.id) {
      const productId = parseInt(product.id)
      if (!isNaN(productId)) {
        console.log('🔄 ShopDetailModal useEffect[1]: Cargando datos del producto', productId)
        setLoadingProductData(true)
        getProductById(productId)
          .then(productData => {
            setFullProductData(productData)
          })
          .catch(error => {
            logError('Error cargando datos completos del producto:', error)
            setFullProductData(null)
          })
          .finally(() => {
            setLoadingProductData(false)
          })
      }
    }
  }, [open, product?.id])

  // Detectar tipo de producto usando datos completos si están disponibles
  const productType = detectProductType(
    fullProductData?.name || product?.name || '', 
    fullProductData?.category?.name || ''
  )

  // Cargar variantes cuando se abre el modal
  useEffect(() => {
    console.log('🔄 ShopDetailModal useEffect[2]: open =', open, 'product =', product?.name)
    if (open && product) {
      console.log('🔄 ShopDetailModal useEffect[2]: Cargando variantes y productos relacionados')
      loadVariants()
      loadRelatedProducts()
    }
  }, [open, product])

  // Función para cargar variantes
  const loadVariants = async () => {
    if (!product) return
    
    setLoadingVariants(true)
    try {
      const productVariants = await getProductVariants(product.id)
      setVariants(productVariants)
    } catch (error) {
      logError('❌ Error cargando variantes:', error)
      setVariants([])
    } finally {
      setLoadingVariants(false)
    }
  }

  // Función para cargar productos relacionados
  const loadRelatedProducts = async () => {
    if (!product) return
    
    setLoadingRelatedProducts(true)
    try {
      // Validar que product.id sea un número válido
      if (isNaN(product.id)) {
        console.warn('⚠️ Product ID no es un número válido:', product.id)
        setRelatedProducts(null)
        return
      }
      
      const related = await getRelatedProducts(product.id)
      setRelatedProducts(related)
      if (related) {
        setSelectedRelatedProduct(related.selectedProduct)
      }
    } catch (error) {
      logError('❌ Error cargando productos relacionados:', error)
      setRelatedProducts(null)
    } finally {
      setLoadingRelatedProducts(false)
    }
  }

  // Configurar valores por defecto
  useEffect(() => {
    if (!selectedColor && productType.hasColorSelector) {
      const defaultColorName = getDefaultColor(productType)
      const defaultColor = PAINT_COLORS.find(color =>
        color.name.toLowerCase().includes(defaultColorName.toLowerCase())
      )
      if (defaultColor) {
        setSelectedColor(defaultColor.id)
      }
    }

    if (!selectedCapacity && productType.defaultCapacities.length > 0) {
      setSelectedCapacity(productType.defaultCapacities[0])
    }

    // Configurar valores por defecto para los nuevos selectores
    if (!selectedGrain && productType.hasGrainSelector && productType.grainOptions.length > 0) {
      setSelectedGrain(productType.grainOptions[0])
    }

    if (!selectedSize && productType.hasSizeSelector && productType.sizeOptions.length > 0) {
      setSelectedSize(productType.sizeOptions[0])
    }

    if (!selectedWidth && productType.hasWidthSelector && productType.widthOptions.length > 0) {
      setSelectedWidth(productType.widthOptions[0])
    }
  }, [productType, selectedColor, selectedCapacity, selectedGrain, selectedSize, selectedWidth])

  // Calcular capacidades disponibles basándose en las variantes
  const availableCapacities =
    variants && variants.length > 0 ? getAvailableCapacities(variants) : productType.defaultCapacities

  // Obtener anchos disponibles para productos como cinta papel
  const availableWidths = useMemo(() => {
    if (!productType.hasWidthSelector) {
      return []
    }
    
    // Prioridad 1: Productos relacionados (más específico)
    if (relatedProducts?.products) {
      const measures = getAvailableMeasures(relatedProducts.products)
      return measures
    }
    
    // Prioridad 2: Variantes con medidas
    if (variants && variants.length > 0) {
      const widths = variants
        .filter(variant => variant.measure && variant.is_active)
        .map(variant => variant.measure)
        .filter((measure, index, self) => self.indexOf(measure) === index)
        .sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, ''))
          const numB = parseInt(b.replace(/\D/g, ''))
          return numA - numB
        })
      return widths
    }
    
    // Prioridad 3: Opciones por defecto del tipo de producto
    if (productType.widthOptions && productType.widthOptions.length > 0) {
      return productType.widthOptions
    }
    
    return []
  }, [
    productType.hasWidthSelector, 
    productType.widthOptions, 
    relatedProducts?.products, 
    variants
  ])

  // Establecer valores por defecto para selectores dinámicos
  useEffect(() => {
    if (productType.hasWidthSelector && availableWidths.length > 0 && !selectedWidth) {
      setSelectedWidth(availableWidths[0])
    }
    
    if (productType.hasCapacitySelector && availableCapacities.length > 0 && !selectedCapacity) {
      setSelectedCapacity(availableCapacities[0])
    }
  }, [availableWidths, availableCapacities, selectedWidth, selectedCapacity])

  // Actualizar variante seleccionada cuando cambia la capacidad
  useEffect(() => {
    if (selectedCapacity && variants && variants.length > 0) {
      const variant = findVariantByCapacity(variants, selectedCapacity)
      setSelectedVariant(variant)
    }
  }, [selectedCapacity, variants])

  // Actualizar selectedVariant cuando cambia selectedWidth
  useEffect(() => {
    if (selectedWidth && relatedProducts?.products) {
      const relatedProduct = findProductByMeasure(relatedProducts.products, selectedWidth)
      
      if (relatedProduct) {
        setSelectedRelatedProduct(relatedProduct)
      }
    }
  }, [selectedWidth, relatedProducts?.products])

  // Mapeo de anchos a precios para productos de cinta papel (fallback cuando no hay productos relacionados)
  const widthToPriceMap = useMemo(() => {
    const map: { [key: string]: { price: string; discounted_price: string } } = {}
    
    // Mapeo basado en los productos existentes de cinta papel
    map['18mm'] = { price: '2141.00', discounted_price: '1498.70' } // ID: 52
    map['24mm'] = { price: '2854.00', discounted_price: '1997.80' } // ID: 53
    map['36mm'] = { price: '4288.00', discounted_price: '3001.60' } // ID: 54
    map['48mm'] = { price: '5709.00', discounted_price: '3996.30' } // ID: 55
    
    return map
  }, [])

  // Calcular precio dinámico basado en selecciones
  const calculateDynamicPrice = useCallback(() => {
    // Si hay una variante seleccionada, usar su precio efectivo directamente
    if (selectedVariant) {
      const effectivePrice = getEffectivePrice(selectedVariant)
      return effectivePrice
    }

    // Para productos con selector de ancho, buscar variante por medida
    if (selectedWidth && productType.hasWidthSelector && variants && variants.length > 0) {
      const variantByMeasure = variants.find(variant => 
        variant.measure && variant.measure.includes(selectedWidth)
      )
      
      if (variantByMeasure) {
        const variantPrice = parseFloat(variantByMeasure.price_sale || variantByMeasure.price_list)
        return variantPrice
      }
    }

    // Para otros productos, usar precio base con multiplicadores
    let basePrice = parseFloat(product.discounted_price || product.price)

    // Aplicar modificadores de precio por tamaño (solo para pinceles)
    if (selectedSize && productType.hasSizeSelector) {
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
  }, [selectedVariant, selectedSize, selectedWidth, productType, product, variants])

  // Obtener precio actual basado en la variante seleccionada y modificadores
  const currentPrice = useMemo(() => {
    // Prioridad 1: Si hay una variante seleccionada, usar su precio
    if (selectedVariant) {
      return getEffectivePrice(selectedVariant)
    }
    
    // Prioridad 2: Para productos con selector de ancho, usar producto relacionado seleccionado o mapeo de precios
    if (selectedWidth && productType.hasWidthSelector) {
      if (selectedRelatedProduct) {
        return parseFloat(selectedRelatedProduct.discounted_price || selectedRelatedProduct.price)
      } else if (widthToPriceMap[selectedWidth]) {
        // Fallback: usar mapeo de precios cuando no hay productos relacionados
        const priceData = widthToPriceMap[selectedWidth]
        return parseFloat(priceData.discounted_price || priceData.price)
      }
    }
    
    // Prioridad 3: Usar calculateDynamicPrice para otros casos
    if (selectedSize && productType.hasSizeSelector) {
      return calculateDynamicPrice()
    }
    
    // Fallback: precio base del producto
    return parseFloat(product.discounted_price || product.price)
  }, [selectedVariant, selectedWidth, selectedSize, selectedRelatedProduct, productType.hasWidthSelector, productType.hasSizeSelector, widthToPriceMap, calculateDynamicPrice, product.discounted_price, product.price])
  
  // Calcular precio original para mostrar descuentos
  const originalPrice = useMemo(() => {
    if (selectedVariant) {
      return getEffectivePrice(selectedVariant)
    }
    
    if (selectedWidth && productType.hasWidthSelector && selectedRelatedProduct) {
      return parseFloat(selectedRelatedProduct.price)
    }
    
    if (selectedWidth && productType.hasWidthSelector && widthToPriceMap[selectedWidth]) {
      return parseFloat(widthToPriceMap[selectedWidth].price)
    }
    
    return product.originalPrice || product.price
  }, [selectedVariant, selectedWidth, selectedRelatedProduct, productType.hasWidthSelector, widthToPriceMap, product.originalPrice, product.price])
    
  // Verificar si hay descuento
  const hasVariantDiscount = useMemo(() => {
    if (selectedVariant) {
      return hasDiscount(selectedVariant)
    }
    
    if (selectedWidth && productType.hasWidthSelector && selectedRelatedProduct) {
      return selectedRelatedProduct.discounted_price && 
        parseFloat(selectedRelatedProduct.discounted_price) < parseFloat(selectedRelatedProduct.price)
    }
    
    if (selectedWidth && productType.hasWidthSelector && widthToPriceMap[selectedWidth]) {
      return widthToPriceMap[selectedWidth].discounted_price && 
        parseFloat(widthToPriceMap[selectedWidth].discounted_price) < parseFloat(widthToPriceMap[selectedWidth].price)
    }
    
    return product.originalPrice && product.originalPrice > product.price
  }, [selectedVariant, selectedWidth, selectedRelatedProduct, productType.hasWidthSelector, widthToPriceMap, product.originalPrice, product.price])

  // Datos por defecto para productos de pinturería
  const availableColors = product.colors || PAINT_COLORS.slice(0, 12) // Usar colores del producto o los primeros 12 por defecto
  const defaultCapacities = product.capacities || ['1L', '4L', '10L', '20L']

  const handleAddToCart = useCallback(async () => {
    if (!product || !onAddToCart) return

    let productToAdd = product

    // Prioridad 1: Producto relacionado seleccionado (para productos con selector de ancho como cintas)
    if (selectedWidth && productType.hasWidthSelector && selectedRelatedProduct) {
      productToAdd = {
        ...selectedRelatedProduct,
        id: selectedRelatedProduct.id,
        name: selectedRelatedProduct.name,
        price: selectedRelatedProduct.price,
        discounted_price: selectedRelatedProduct.discounted_price,
        medida: selectedRelatedProduct.medida,
        // Mantener otros datos del producto original
        image: product.image,
        images: product.images,
        category: product.category,
        brand: product.brand,
      }
    }
    // Prioridad 2: Variante seleccionada (para productos con variantes de capacidad)
    else if (selectedVariant) {
      productToAdd = {
        ...product,
        id: selectedVariant.id,
        price: getEffectivePrice(selectedVariant).toString(),
        discounted_price: selectedVariant.discounted_price,
        capacity: selectedVariant.capacity,
      }
    }

    const cartData = {
      product: productToAdd,
      quantity,
      selectedColor,
      selectedCapacity,
      selectedGrain,
      selectedSize,
      selectedWidth,
      variants: {
        color: selectedColor,
        capacity: selectedCapacity,
        grain: selectedGrain,
        size: selectedSize,
        width: selectedWidth,
      }
    }

    try {
      console.log('🛒 ShopDetailModal: Agregando al carrito...')
      await onAddToCart(productToAdd, cartData.variants)
      console.log('🛒 ShopDetailModal: Producto agregado, cerrando modal...')
      onOpenChange(false) // Cerrar modal después de agregar al carrito
      console.log('🛒 ShopDetailModal: onOpenChange(false) llamado')
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
    onOpenChange
  ])

  const handleAddToWishlist = useCallback(() => {
    if (onAddToWishlist && product) {
      console.log('❤️ ShopDetailModal: Agregando a favoritos...')
      onAddToWishlist(product)
      console.log('❤️ ShopDetailModal: Producto agregado a favoritos, cerrando modal...')
      onOpenChange(false) // Cerrar modal después de agregar a favoritos
      console.log('❤️ ShopDetailModal: onOpenChange(false) llamado')
    }
  }, [onAddToWishlist, product, onOpenChange])

  // Calcular si hay descuento (renombrado para evitar conflicto)
  const hasProductDiscount = product.originalPrice && product.originalPrice > product.price

  // Función wrapper para onOpenChange con debug
  const handleOpenChange = useCallback((newOpen: boolean) => {
    console.log('🔄 ShopDetailModal: handleOpenChange llamado con:', newOpen)
    console.log('🔄 ShopDetailModal: Estado actual open:', open)
    console.log('🔄 ShopDetailModal: Llamando onOpenChange con:', newOpen)
    
    // Forzar el cierre inmediatamente si es false
    if (!newOpen) {
      console.log('🔄 ShopDetailModal: Forzando cierre del modal')
    }
    
    onOpenChange(newOpen)
  }, [onOpenChange, open])

  return (
    // Forzamos remonte cuando cambia el estado `open` para evitar estados inconsistentes
    <Dialog key={open ? 'open' : 'closed'} open={open} onOpenChange={handleOpenChange} modal={false}>
      <DialogContent
        key={open ? 'content-open' : 'content-closed'}
        className="max-w-4xl max-h-[90vh] p-0 gap-0 grid grid-rows-[auto,1fr] overflow-hidden"
        showCloseButton={true}
        onInteractOutside={() => handleOpenChange(false)}
      >
        {/* Header con título */}
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {fullProductData?.name || product?.name}
          </DialogTitle>
        </DialogHeader>

        {/* Contenido principal con scroll */}
        <ScrollArea className="h-full">
          <div className="p-6">
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Imagen del producto */}
        <div className='space-y-4'>
          <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden'>
            <img
              src={
                fullProductData?.images?.main || 
                fullProductData?.images?.gallery?.[0] ||
                product?.images?.[0] || 
                product?.image || 
                '/images/placeholder-product.jpg'
              }
              alt={fullProductData?.name || product?.name || 'Producto'}
              className='w-full h-full object-cover'
            />
          </div>

          {/* Galería de imágenes adicionales */}
          {fullProductData?.images?.gallery && fullProductData.images.gallery.length > 1 && (
            <div className='grid grid-cols-4 gap-2'>
              {fullProductData.images.gallery.slice(1, 5).map((image, index) => (
                <div key={index} className='aspect-square bg-gray-100 rounded-md overflow-hidden'>
                  <img
                    src={image}
                    alt={`${fullProductData.name} - imagen ${index + 2}`}
                    className='w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity'
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Información del producto */}
        <div className='space-y-6'>
          {/* Loading state para datos del producto */}
          {loadingProductData && (
            <div className='space-y-4'>
              <div className='animate-pulse'>
                <div className='h-4 bg-gray-200 rounded w-1/4 mb-2'></div>
                <div className='h-8 bg-gray-200 rounded w-3/4 mb-4'></div>
                <div className='h-6 bg-gray-200 rounded w-1/2'></div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className='space-y-2'>
            <p className='text-sm text-gray-500 uppercase font-medium'>
              {fullProductData?.brand || product?.brand}
            </p>
            <h2 className='text-2xl font-bold text-gray-900'>
              {fullProductData?.name || product?.name}
            </h2>

            <div className='flex items-center gap-3'>
              {hasVariantDiscount ? (
                <>
                  <span className='text-3xl font-bold text-blaze-orange-600'>
                    {renderPriceSup(currentPrice)}
                  </span>
                  <span className='text-xl text-gray-500 line-through'>
                    {renderPriceSup(originalPrice)}
                  </span>
                  <Badge variant='destructive' className='text-sm'>
                    {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
                  </Badge>
                </>
              ) : (
                <span className='text-3xl font-bold text-blaze-orange-600'>
                  {renderPriceSup(currentPrice)}
                </span>
              )}
            </div>

            {/* Mostrar categoría si está disponible */}
            {fullProductData?.category && (
              <p className='text-sm text-gray-600'>
                Categoría: <span className='font-medium'>{fullProductData.category.name}</span>
              </p>
            )}

            {/* Mostrar stock */}
            <div className='flex items-center gap-2'>
              <Package className='w-4 h-4 text-gray-500' />
              <span className='text-sm text-gray-600'>
                Stock: <span className='font-medium'>{fullProductData?.stock || product?.stock || 0}</span> unidades
              </span>
            </div>
          </div>

          {/* Descripción */}
          {(fullProductData?.description || product?.description) && (
            <div>
              <p className='text-gray-600 leading-relaxed'>
                {fullProductData?.description || product?.description}
              </p>
            </div>
          )}

          {/* Especificaciones y características */}
          {(fullProductData?.specifications || fullProductData?.features) && (
            <div className='space-y-4'>
              {/* Especificaciones técnicas */}
              {fullProductData?.specifications && Object.keys(fullProductData.specifications).length > 0 && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>Especificaciones Técnicas</h3>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                    {Object.entries(fullProductData.specifications).map(([key, value]) => (
                      <div key={key} className='flex justify-between items-center py-2 px-3 bg-gray-50 rounded-lg'>
                        <span className='text-sm font-medium text-gray-700 capitalize'>
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className='text-sm text-gray-600'>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Características del producto */}
              {fullProductData?.features && Object.keys(fullProductData.features).length > 0 && (
                <div>
                  <h3 className='text-lg font-semibold text-gray-900 mb-3'>Características</h3>
                  <div className='space-y-2'>
                    {Object.entries(fullProductData.features).map(([key, value]) => (
                      <div key={key} className='flex items-start gap-2'>
                        <div className='w-2 h-2 bg-blaze-orange-500 rounded-full mt-2 flex-shrink-0'></div>
                        <div className='flex-1'>
                          <span className='text-sm font-medium text-gray-700 capitalize'>
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <span className='text-sm text-gray-600 ml-2'>{String(value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Información adicional */}
              {fullProductData?.weight && (
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Package className='w-4 h-4' />
                  <span>Peso: {fullProductData.weight}</span>
                </div>
              )}

              {fullProductData?.dimensions && (
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Ruler className='w-4 h-4' />
                  <span>Dimensiones: {fullProductData.dimensions}</span>
                </div>
              )}

              {fullProductData?.sku && (
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <Hash className='w-4 h-4' />
                  <span>SKU: {fullProductData.sku}</span>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Selectores de variantes */}
          <div className='space-y-6'>
            {/* Selector de colores condicional */}
            {productType.hasColorSelector && (
              <AdvancedColorPicker
                colors={PAINT_COLORS}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                showSearch={PAINT_COLORS.length > 12}
                showCategories={PAINT_COLORS.length > 20}
                maxDisplayColors={16}
                className='bg-white'
                productType={productType}
              />
            )}

            {/* Selector de capacidad */}
            {availableCapacities.length > 0 &&
              !(
                availableCapacities.length === 1 && availableCapacities[0] === 'Sin especificar'
              ) && (
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <Box className='w-5 h-5 text-blaze-orange-600' />
                    <span className='text-base font-semibold text-gray-900'>
                      {productType.capacityUnit === 'litros'
                        ? 'Capacidad'
                        : productType.capacityUnit === 'kg'
                          ? 'Peso'
                          : productType.capacityUnit === 'metros'
                            ? 'Longitud'
                            : 'Cantidad'}
                    </span>
                  </div>

                  {loadingVariants ? (
                    <div className='grid grid-cols-2 gap-3'>
                      <div className='animate-pulse bg-gray-200 rounded-xl h-12'></div>
                      <div className='animate-pulse bg-gray-200 rounded-xl h-12'></div>
                      <div className='animate-pulse bg-gray-200 rounded-xl h-12'></div>
                      <div className='animate-pulse bg-gray-200 rounded-xl h-12'></div>
                    </div>
                  ) : (
                    <div className='grid grid-cols-2 gap-3'>
                      {availableCapacities.map(capacity => (
                        <button
                          key={capacity}
                          onClick={() => setSelectedCapacity(capacity)}
                          className={cn(
                            'px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all duration-200 hover:shadow-md',
                            selectedCapacity === capacity
                              ? 'border-blaze-orange-500 bg-blaze-orange-50 text-blaze-orange-700 shadow-sm'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-blaze-orange-300 hover:bg-blaze-orange-25'
                          )}
                        >
                          {formatCapacity(capacity, productType.capacityUnit)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

            {/* Selector de cantidad - ÚNICO */}
            <QuantitySelector
              quantity={quantity}
              onQuantityChange={setQuantity}
              onIncrement={() => setQuantity(prev => prev + 1)}
              onDecrement={() => setQuantity(prev => Math.max(1, prev - 1))}
              stock={fullProductData?.stock || product?.stock || 0}
            />

            {/* Selector de grano para lijas */}
            {productType.hasGrainSelector && (
              <GrainSelector
                grainOptions={productType.grainOptions}
                selectedGrain={selectedGrain}
                onGrainChange={setSelectedGrain}
              />
            )}

            {/* Selector de tamaño para pinceles */}
            {productType.hasSizeSelector && (
              <SizeSelector
                sizeOptions={productType.sizeOptions}
                selectedSize={selectedSize}
                onSizeChange={setSelectedSize}
              />
            )}

            {/* Selector de ancho para cintas de papel */}
            {productType.hasWidthSelector && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-800">Ancho</h3>
                </div>
                
                {loadingRelatedProducts ? (
                  <div className="flex items-center justify-center p-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                    <span className="ml-2 text-gray-600">Cargando opciones...</span>
                  </div>
                ) : availableWidths.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableWidths.map((width) => (
                      <button
                        key={width}
                        onClick={() => setSelectedWidth(width)}
                        className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                          selectedWidth === width
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-orange-300 text-gray-700'
                        }`}
                      >
                        {width}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-100 rounded-lg text-center text-gray-600">
                    No hay opciones de ancho disponibles para este producto
                  </div>
                )}
                
                {selectedWidth && (
                  <p className="text-sm text-gray-600">
                    Ancho seleccionado: {selectedWidth}
                  </p>
                )}
              </div>
            )}
            
            {/* Debug info para selector de ancho */}
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-yellow-100 p-2 rounded text-xs">
                <p>🔍 Debug Selector Ancho:</p>
                <p>- hasWidthSelector: {productType.hasWidthSelector ? 'true' : 'false'}</p>
                <p>- availableWidths.length: {availableWidths.length}</p>
                <p>- availableWidths: [{availableWidths.join(', ')}]</p>
                <p>- selectedWidth: {selectedWidth || 'none'}</p>
                <p>- loadingRelatedProducts: {loadingRelatedProducts ? 'true' : 'false'}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Precio total */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <div className='flex justify-between items-center'>
              <span className='text-lg font-medium text-gray-900'>Total:</span>
              <span className='text-2xl font-bold text-blaze-orange-600'>
                {renderPriceSup(currentPrice * quantity)}
              </span>
            </div>
            {quantity > 1 && (
              <p className='text-sm text-gray-600 mt-1'>
                ${currentPrice.toLocaleString()} × {quantity} unidades
              </p>
            )}

            {/* Mostrar selecciones actuales */}
            <div className='mt-3 space-y-1'>
              {productType.hasColorSelector && selectedColor && (
                <p className='text-xs text-gray-500'>
                  Color:{' '}
                  <span className='font-medium capitalize'>
                    {PAINT_COLORS.find(color => color.id === selectedColor)?.displayName ||
                      PAINT_COLORS.find(color => color.id === selectedColor)?.name ||
                      selectedColor}
                  </span>
                </p>
              )}
              {selectedCapacity && (
                <p className='text-xs text-gray-500'>
                  <span className='font-medium'>
                    {productType.capacityUnit === 'litros'
                      ? 'Capacidad'
                      : productType.capacityUnit === 'kg'
                        ? 'Peso'
                        : productType.capacityUnit === 'metros'
                          ? 'Longitud'
                          : 'Cantidad'}
                    :
                  </span>{' '}
                  {formatCapacity(selectedCapacity, productType.capacityUnit)}
                </p>
              )}
              {productType.hasGrainSelector && selectedGrain && (
                <p className='text-xs text-gray-500'>
                  Grano: <span className='font-medium'>{selectedGrain}</span>
                </p>
              )}
              {productType.hasSizeSelector && selectedSize && (
                <p className='text-xs text-gray-500'>
                  Tamaño: <span className='font-medium'>{selectedSize}</span>
                </p>
              )}
              {productType.hasWidthSelector && selectedWidth && (
                <p className='text-xs text-gray-500'>
                  Ancho: <span className='font-medium'>{selectedWidth}</span>
                </p>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className='space-y-3'>
            <Button
              onClick={handleAddToCart}
              disabled={
                (fullProductData?.stock || product?.stock || 0) === 0 || 
                isLoading || 
                loadingProductData ||
                quantity > (fullProductData?.stock || product?.stock || 0)
              }
              className='w-full bg-yellow-400 hover:bg-yellow-500 text-black text-lg py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
              size='lg'
            >
              <ShoppingCart className='mr-2 h-5 w-5' />
              {(fullProductData?.stock || product?.stock || 0) === 0
                ? 'Sin Stock'
                : isLoading || loadingProductData
                  ? 'Cargando...'
                  : quantity > (fullProductData?.stock || product?.stock || 0)
                    ? 'Stock Insuficiente'
                    : 'Agregar al Carrito'}
            </Button>

            {onAddToWishlist && (
              <Button
                onClick={handleAddToWishlist}
                variant='outline'
                className='w-full border-blaze-orange-300 text-blaze-orange-600 hover:bg-blaze-orange-50 py-3 rounded-xl font-semibold'
                size='lg'
                disabled={loadingProductData}
              >
                <Heart className='mr-2 h-5 w-5' />
                Agregar a Favoritos
              </Button>
            )}

            {/* Información de disponibilidad */}
            <div className='text-center text-sm text-gray-600'>
              {(fullProductData?.stock || product?.stock || 0) > 0 && (
                <p>
                  {(fullProductData?.stock || product?.stock || 0) <= 5 ? (
                    <span className='text-amber-600 font-medium'>
                      ¡Últimas {fullProductData?.stock || product?.stock} unidades disponibles!
                    </span>
                  ) : (
                    <span className='text-green-600'>
                      ✓ Disponible ({fullProductData?.stock || product?.stock} en stock)
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className='text-sm text-gray-600 space-y-1'>
            <FreeShippingText />
            <p>• Garantía de calidad en todos nuestros productos</p>
            <p>• Asesoramiento técnico especializado</p>
          </div>
        </div>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export default ShopDetailModal
  // Helper: renderizar precio con decimales en superíndice (formato ARS)
  const renderPriceSup = (value: number) => {
    const formatted = value.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    const commaIndex = formatted.lastIndexOf(',')
    if (commaIndex === -1) {
      return `$${formatted}`
    }
    const integerWithSep = formatted.slice(0, commaIndex + 1)
    const decimals = formatted.slice(commaIndex + 1)
    return (
      <span>
        {`$${integerWithSep}`}
        <span className='align-super text-xs'>{decimals}</span>
      </span>
    )
  }
