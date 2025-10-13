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
import { detectProductType, formatCapacity, getDefaultColor, extractColorFromName } from '@/utils/product-utils'
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
import { useRouter } from 'next/navigation'



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
  const router = useRouter()
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
      const rawId = product.id as unknown as string | number
      const productId = typeof rawId === 'number' ? rawId : parseInt(String(rawId), 10)
      if (!Number.isFinite(productId) || productId <= 0) {
        console.warn('⚠️ ID de producto inválido al cargar datos completos:', rawId)
        return
      }
      console.log('🔄 ShopDetailModal useEffect[1]: Cargando datos del producto', productId)
      setLoadingProductData(true)
      getProductById(productId)
        .then(productData => {
          const realProduct =
            productData && typeof productData === 'object' && 'data' in (productData as any)
              ? (productData as any).data
              : productData
          setFullProductData(realProduct || null)
          console.debug('🧩 ShopDetailModal: Datos completos del producto cargados:', realProduct)
        })
        .catch(error => {
          logError('Error cargando datos completos del producto:', error)
          setFullProductData(null)
        })
        .finally(() => {
          setLoadingProductData(false)
        })
    }
  }, [open, product?.id])

  // Detectar tipo de producto usando datos completos si están disponibles
  const productType = detectProductType(
    fullProductData?.name || product?.name || '', 
    fullProductData?.category?.name || ''
  )

  // Unidad de capacidad efectiva (litros, kg, metros, unidades) detectada dinámicamente
  const capacityUnit = useMemo(() => {
    const medidaRaw = ((fullProductData as any)?.medida || (fullProductData as any)?.measure || '')
      .toString()
      .trim()
    if (medidaRaw && /kg/i.test(medidaRaw)) {
      return 'kg' as const
    }
    // Detectar por nombre del producto
    const nameText = (fullProductData?.name || product?.name || '').toString()
    if (nameText && /\b\d+\s?(kg|kilos?)\b/i.test(nameText)) {
      return 'kg' as const
    }
    // Si la capacidad seleccionada contiene KG, ajustar dinámicamente
    if (selectedCapacity && /kg/i.test(selectedCapacity)) {
      return 'kg' as const
    }
    return productType.capacityUnit
  }, [fullProductData, selectedCapacity, productType.capacityUnit])

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
      // Validar ID numérico antes de consultar API
      const productIdNum = typeof product.id === 'number' ? product.id : Number(product.id)
      if (!Number.isFinite(productIdNum) || productIdNum <= 0) {
        console.warn('⚠️ ID de producto inválido al cargar variantes:', product?.id)
        setVariants([])
        return
      }

      const productVariantsRes = await getProductVariants(productIdNum)
      const variantsData = (productVariantsRes && (productVariantsRes as any).data)
        ? (productVariantsRes as any).data
        : []
      setVariants(variantsData)
      // Log detallado de medidas y stock por variante para depurar
      try {
        console.debug('📦 ShopDetailModal: Variants overview (measure, stock, price)', variantsData.map(v => ({
          id: v.id,
          measure: v.measure,
          stock: v.stock,
          price_list: v.price_list,
          price_sale: v.price_sale,
        })))
      } catch {}
      // Si ya hay una capacidad seleccionada, enlazar inmediatamente la variante correcta
      if (selectedCapacity && variantsData.length > 0) {
        const v = findVariantByCapacity(variantsData, selectedCapacity)
        setSelectedVariant(v || null)
        if (v) {
          console.debug('🧩 Variante enlazada tras carga:', {
            id: v.id,
            measure: v.measure,
            stock: v.stock,
          })
        }
      }
      console.debug('🧪 ShopDetailModal: Variantes cargadas', {
        productId: productIdNum,
        count: variantsData.length,
        sample: variantsData[0],
      })
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

    // No establecer capacidad por defecto aquí; se definirá cuando
    // estén disponibles las capacidades reales (variantes/medida/relacionados)

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

  // Helper para extraer capacidades en KG desde distintos textos
  const extractKgCapacities = (text: string): string[] => {
    const caps = new Set<string>()
    const regex = /(\d{1,3})\s?(kg|kilos?)/gi
    let m: RegExpExecArray | null
    while ((m = regex.exec(text)) !== null) {
      caps.add(`${m[1]}KG`)
    }
    return Array.from(caps)
      .sort((a, b) => parseInt(a) - parseInt(b))
  }

  // Calcular capacidades disponibles basándose en variantes, productos relacionados o medida/nombre
  const availableCapacities = useMemo(() => {
    // Acumular capacidades desde todas las fuentes y luego unificar
    const collected: string[] = []

    // Variantes explícitas
    if (variants && variants.length > 0) {
      const vCaps = getAvailableCapacities(variants)
      collected.push(
        ...vCaps.filter(c => (capacityUnit === 'kg' ? /kg/i.test(c) : true))
      )
    }

    // Medida en BD (simple o lista separada por comas, barras, punto y coma)
    const medidaFromDb = ((fullProductData as any)?.medida || (fullProductData as any)?.measure || '')
      .toString()
      .trim()
    if (medidaFromDb) {
      const parts = medidaFromDb
        .split(/[,\/;\|]+/)
        .map(s => s.trim())
        .filter(Boolean)

      if (capacityUnit === 'kg') {
        const kgList = parts.flatMap(s => extractKgCapacities(s))
        collected.push(...kgList)
      } else {
        collected.push(...parts)
      }
    }

    // Productos relacionados (ej. mismas líneas con 5KG/12KG/24KG)
    if (capacityUnit === 'kg' && relatedProducts?.products && relatedProducts.products.length > 0) {
      const fromRelated = relatedProducts.products
        .flatMap(p => {
          const txt = `${p.name || ''} ${p.measure || ''}`
          return extractKgCapacities(txt)
        })
      collected.push(...fromRelated)
    }

    // Nombre del producto actual
    const nameText = (fullProductData?.name || product?.name || '').toString()
    if (capacityUnit === 'kg' && nameText) {
      const caps = extractKgCapacities(nameText)
      collected.push(...caps)
    }

    // Unificar: normalizar a mayúsculas, quitar duplicados y ordenar
    const normalized = collected
      .map(c => c.toUpperCase())
      .filter((c, idx, self) => self.indexOf(c) === idx)

    if (normalized.length > 0) {
      const sorted = normalized.sort((a, b) => parseInt(a) - parseInt(b))
      return sorted
    }

    // Fallback: capacidades por defecto del tipo de producto
    return productType.defaultCapacities
  }, [
    variants,
    fullProductData,
    product,
    productType.defaultCapacities,
    capacityUnit,
    relatedProducts?.products,
  ])

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
    
    // Establecer capacidad por defecto basada en las capacidades disponibles
    if (availableCapacities.length > 0) {
      // Si no hay capacidad seleccionada o la seleccionada no existe en la lista disponible,
      // seleccionar la primera opción disponible
      if (!selectedCapacity || !availableCapacities.includes(selectedCapacity)) {
        setSelectedCapacity(availableCapacities[0])
      }
      // Si la unidad efectiva es KG y la selección actual no es KG, ajustar
      else if (capacityUnit === 'kg' && !/kg/i.test(selectedCapacity)) {
        const kgOption = availableCapacities.find(c => /kg/i.test(c))
        if (kgOption) setSelectedCapacity(kgOption)
      }
    }
  }, [availableWidths, availableCapacities, selectedWidth, selectedCapacity])

  // Logs de diagnóstico para verificar unidad y selección
  useEffect(() => {
    console.log(
      '🧪 ShopDetailModal capacidades:', {
        capacityUnit,
        availableCapacities,
        selectedCapacity,
      }
    )
    // Logear capacidades crudas para depurar duplicados
    if (availableCapacities && availableCapacities.length > 0) {
      console.log('🧪 Capacidades (raw):', availableCapacities)
      console.log('🧪 Capacidades (formateadas):', availableCapacities.map(c => formatCapacity(c, capacityUnit)))
      // Comparar contra variantes disponibles por medida
      try {
        console.log('🧪 Variants measures for matching:', (variants || []).map(v => v.measure))
      } catch {}
    }
  }, [capacityUnit, availableCapacities, selectedCapacity])

  // Colores inteligentes basados en datos del producto (p.ej., color "BLANCO")
  const smartColors: ColorOption[] = useMemo(() => {
    if (!productType.hasColorSelector) return []
    const declaredColor = (((fullProductData as any)?.color || '') as string).toString().trim()
    const extracted = extractColorFromName(fullProductData?.name || product?.name || '') || ''
    const colorText = declaredColor || extracted
    if (colorText) {
      const normalized = colorText.toLowerCase()
      const match =
        PAINT_COLORS.find(
          c =>
            c.displayName.toLowerCase() === normalized ||
            c.name.toLowerCase() === normalized ||
            (normalized.includes('blanco') && c.name === 'blanco-puro')
        ) || null
      if (match) {
        return [match]
      }
    }
    return []
  }, [productType.hasColorSelector, fullProductData, product])

  // Establecer valores por defecto usando colores y capacidades inteligentes
  useEffect(() => {
    if (!selectedColor && productType.hasColorSelector && smartColors.length > 0) {
      setSelectedColor(smartColors[0].id)
    }
    if (!selectedCapacity && availableCapacities.length > 0) {
      setSelectedCapacity(availableCapacities[0])
    }
  }, [smartColors, availableCapacities, selectedColor, selectedCapacity, productType.hasColorSelector])

  // Actualizar variante seleccionada cuando cambia la capacidad
  useEffect(() => {
    if (selectedCapacity && variants && variants.length > 0) {
      const variant = findVariantByCapacity(variants, selectedCapacity)
      setSelectedVariant(variant)
      // Al encontrar variante, limpiar producto relacionado para evitar confusión
      if (variant) {
        setSelectedRelatedProduct(null)
      }
      console.log('🧪 Cambio de capacidad:', {
        selectedCapacity,
        variantFound: variant ? {
          id: variant.id,
          measure: variant.measure,
          price_list: variant.price_list,
          price_sale: variant.price_sale,
          stock: variant.stock,
        } : null,
        effectivePrice: variant ? getEffectivePrice(variant) : null,
      })
    }
  }, [selectedCapacity, variants])

  // Seleccionar producto relacionado por capacidad cuando no hay variante
  useEffect(() => {
    if (
      selectedCapacity &&
      !selectedVariant &&
      relatedProducts?.products &&
      relatedProducts.products.length > 0
    ) {
      const normalize = (v?: string | null): string => {
        if (!v) return ''
        const up = v.trim().toUpperCase()
        const noSpaces = up.replace(/\s+/g, '')
        const kg = noSpaces.replace(/(KGS|KILO|KILOS)$/i, 'KG')
        const l = kg.replace(/(LT|LTS|LITRO|LITROS)$/i, 'L')
        return l
      }
      const target = normalize(selectedCapacity)

      // 1) Intento por medida declarada
      let prod = findProductByMeasure(relatedProducts.products, selectedCapacity)

      // 2) Fallback más estricto: solo comparar campos de medida declarados
      // Evita falsos positivos cuando el nombre del producto contiene otra capacidad
      if (!prod) {
        prod =
          relatedProducts.products.find(p => {
            const m1 = normalize((p as any).measure)
            const m2 = normalize((p as any).medida)
            return m1 === target || m2 === target
          }) || null
      }

      setSelectedRelatedProduct(prod || null)
      if (prod) {
        console.log('🔗 Producto relacionado por capacidad:', {
          selectedCapacity,
          productId: prod.id,
          measure: (prod as any).measure,
          stock: (prod as any).stock,
          price: (prod as any).discounted_price ?? (prod as any).price,
        })
      } else {
        console.log('🔎 Sin producto relacionado para capacidad:', selectedCapacity)
      }
    }
  }, [selectedCapacity, selectedVariant, relatedProducts?.products])

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

  // Imagen principal saneada (elimino comillas/backticks y valido URL)
  const mainImageUrl = useMemo(() => {
    const sanitize = (u?: string) => (typeof u === 'string' ? u.replace(/[`"]/g, '').trim() : '')
    const getUrlFromCandidate = (c: any) => {
      if (!c) return ''
      if (typeof c === 'string') return sanitize(c)
      return sanitize(c?.url || c?.image_url)
    }
    const candidates: any[] = [
      (fullProductData as any)?.images?.[0],
      fullProductData?.images?.main,
      fullProductData?.images?.gallery?.[0],
      (product as any)?.images?.[0],
      product?.image,
    ]
    for (const c of candidates) {
      const url = getUrlFromCandidate(c)
      if (url && /^https?:\/\//.test(url)) return url
    }
    return '/images/placeholder-product.jpg'
  }, [fullProductData, product])
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

    // Para otros productos, usar precio base con multiplicadores (sanear a número)
    const baseCandidate = (fullProductData as any)?.discounted_price ?? (fullProductData as any)?.price ?? product.price
    let basePrice = typeof baseCandidate === 'number' ? baseCandidate : parseFloat(String(baseCandidate))
    if (!Number.isFinite(basePrice)) {
      basePrice = typeof product.price === 'number' ? product.price : parseFloat(String(product.price))
      if (!Number.isFinite(basePrice)) basePrice = 0
    }

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
    let path: string = 'fallback'
    let priceComputed: number = 0

    // Prioridad 1: Si hay una variante seleccionada, usar su precio
    if (selectedVariant) {
      path = 'variant'
      priceComputed = getEffectivePrice(selectedVariant)
    }
    // Prioridad 2: Producto relacionado seleccionado (ya sea por ancho o por capacidad)
    else if (selectedRelatedProduct) {
      path = 'relatedProduct'
      priceComputed = parseFloat(selectedRelatedProduct.discounted_price || selectedRelatedProduct.price)
    }
    // Prioridad 3: Para productos con selector de ancho, usar mapeo de precios cuando no hay relacionados
    else if (selectedWidth && productType.hasWidthSelector && widthToPriceMap[selectedWidth]) {
      path = 'widthMap'
      const priceData = widthToPriceMap[selectedWidth]
      priceComputed = parseFloat(priceData.discounted_price || priceData.price)
    }
    // Prioridad 4: Usar calculateDynamicPrice para otros casos (p. ej. tamaño en pinceles)
    else if (selectedSize && productType.hasSizeSelector) {
      path = 'dynamic'
      priceComputed = calculateDynamicPrice()
    } else {
      // Fallback: precio base del producto (sanear)
      const candidate = (fullProductData as any)?.discounted_price ?? (fullProductData as any)?.price ?? product.price
      const n = typeof candidate === 'number' ? candidate : parseFloat(String(candidate))
      priceComputed = Number.isFinite(n) ? n : 0
    }

    // Log detallado para depurar por qué no cambia el precio con otras medidas
    try {
      console.log('💰 currentPrice debug', {
        path,
        selectedCapacity,
        selectedWidth,
        selectedSize,
        hasWidthSelector: productType.hasWidthSelector,
        hasSizeSelector: productType.hasSizeSelector,
        variant: selectedVariant
          ? { id: selectedVariant.id, measure: selectedVariant.measure, price: getEffectivePrice(selectedVariant) }
          : null,
        relatedProduct: selectedRelatedProduct
          ? {
              id: selectedRelatedProduct.id,
              measure: selectedRelatedProduct.measure,
              price: parseFloat(selectedRelatedProduct.discounted_price || selectedRelatedProduct.price),
            }
          : null,
        availableCapacities,
        relatedProductsCount: relatedProducts?.products?.length || 0,
        priceComputed,
      })
    } catch (e) {
      // Evitar romper por logs
    }

    return priceComputed
  }, [
    selectedVariant,
    selectedWidth,
    selectedSize,
    selectedRelatedProduct,
    productType.hasWidthSelector,
    productType.hasSizeSelector,
    widthToPriceMap,
    calculateDynamicPrice,
    product.discounted_price,
    product.price,
    selectedCapacity,
    availableCapacities,
    relatedProducts?.products,
  ])
  
  // Calcular precio original para mostrar descuentos
  const originalPrice = useMemo(() => {
    if (selectedVariant) {
      return getEffectivePrice(selectedVariant)
    }
    
    if (selectedRelatedProduct) {
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
    
    if (selectedRelatedProduct) {
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
    // Debug inicial del click
    console.debug('🛒 ShopDetailModal: Click en Agregar al Carrito', {
      hasProduct: !!product,
      hasOnAddToCart: !!onAddToCart,
      quantity,
      selectedVariantId: selectedVariant?.id,
      selectedRelatedProductId: selectedRelatedProduct?.id,
      selectedColor,
      selectedCapacity,
      selectedWidth,
    })

    if (!product) {
      console.warn('⚠️ ShopDetailModal: No hay producto disponible, ignorando click')
      return
    }

    if (!onAddToCart) {
      console.warn('⚠️ ShopDetailModal: Prop onAddToCart no provista, ignorando click')
      return
    }

    let productToAdd = product

    // Prioridad 1: Producto relacionado seleccionado (por ancho o capacidad)
    if (selectedRelatedProduct) {
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
        // Pasar cantidad al callback para que el carrito la respete
        quantity,
      }
    }

    try {
      console.log('🛒 ShopDetailModal: Agregando al carrito...', {
        productToAdd,
        variants: cartData.variants,
      })
      await onAddToCart(productToAdd, cartData.variants)
      console.log('🛒 ShopDetailModal: Producto agregado, cerrando modal...')
      onOpenChange(false) // Cerrar modal después de agregar al carrito
      console.log('🛒 ShopDetailModal: onOpenChange(false) llamado')
      router.push('/products')
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
    onOpenChange,
    router
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

  // Stock efectivo basado en selección actual (prioriza variante sobre producto relacionado)
  const effectiveStock = useMemo(() => {
    // Normalizar posibles valores string/number provenientes de la API/BD
    const toNumber = (v: any): number | undefined => {
      const n = typeof v === 'number' ? v : parseFloat(String(v))
      return Number.isFinite(n) ? n : undefined
    }

    const variantStock = toNumber(selectedVariant?.stock)
    const relatedStock = toNumber(selectedRelatedProduct?.stock)
    const baseStock = toNumber((fullProductData as any)?.stock ?? (product as any)?.stock ?? 0) ?? 0
    const computed = (variantStock ?? relatedStock ?? baseStock) || 0
    console.log('🧮 ShopDetailModal: effectiveStock', { selectedCapacity, variantStock, relatedStock, baseStock, computed })
    return computed
  }, [selectedVariant, selectedRelatedProduct, fullProductData?.stock, product?.stock])

  // Log explícito de stock cuando cambian selección/capacidad
  useEffect(() => {
    const toNumber = (v: any): number | undefined => {
      const n = typeof v === 'number' ? v : parseFloat(String(v))
      return Number.isFinite(n) ? n : undefined
    }
    const variantStock = toNumber(selectedVariant?.stock)
    const relatedStock = toNumber(selectedRelatedProduct?.stock)
    const baseStock = toNumber((fullProductData as any)?.stock ?? (product as any)?.stock ?? 0) ?? 0
    console.log('🔢 Stock debug', {
      selectedCapacity,
      variant: selectedVariant ? { id: selectedVariant.id, measure: selectedVariant.measure, stock: variantStock } : null,
      relatedProduct: selectedRelatedProduct ? { id: selectedRelatedProduct.id, measure: selectedRelatedProduct.measure, stock: relatedStock } : null,
      baseStock,
      effectiveStock,
    })
  }, [selectedCapacity, selectedVariant, selectedRelatedProduct, fullProductData?.stock, product?.stock, effectiveStock])

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
              src={mainImageUrl}
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
                Stock: <span className='font-medium'>{effectiveStock}</span> unidades
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
                colors={smartColors.length > 0 ? smartColors : availableColors}
                selectedColor={selectedColor}
                onColorChange={setSelectedColor}
                showSearch={false}
                showCategories={false}
                maxDisplayColors={smartColors.length > 0 ? smartColors.length : 12}
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
                      {capacityUnit === 'litros'
                        ? 'Capacidad'
                        : capacityUnit === 'kg'
                          ? 'Peso'
                          : capacityUnit === 'metros'
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
                          {formatCapacity(capacity, capacityUnit)}
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
            stock={effectiveStock}
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
                    {capacityUnit === 'litros'
                      ? 'Capacidad'
                      : capacityUnit === 'kg'
                        ? 'Peso'
                        : capacityUnit === 'metros'
                          ? 'Longitud'
                          : 'Cantidad'}
                    :
                  </span>{' '}
                  {formatCapacity(selectedCapacity, capacityUnit)}
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
                effectiveStock === 0 || 
                isLoading || 
                loadingProductData ||
                quantity > effectiveStock
              }
              className='w-full bg-yellow-400 hover:bg-yellow-500 text-black text-lg py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
              size='lg'
            >
              <ShoppingCart className='mr-2 h-5 w-5' />
              {effectiveStock === 0
                ? 'Sin Stock'
                : isLoading || loadingProductData
                  ? 'Cargando...'
                  : quantity > effectiveStock
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
              {effectiveStock > 0 && (
                <p>
                  {effectiveStock <= 5 ? (
                    <span className='text-amber-600 font-medium'>
                      ¡Últimas {effectiveStock} unidades disponibles!
                    </span>
                  ) : (
                    <span className='text-green-600'>
                      ✓ Disponible ({effectiveStock} en stock)
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
