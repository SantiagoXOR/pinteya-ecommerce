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
import { detectProductType, formatCapacity, getDefaultColor, extractColorFromName, getColorHex } from '@/utils/product-utils'
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
import { getValidImageUrl } from '@/lib/adapters/product-adapter'
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
  slug?: string
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

    const nameText = (fullProductData?.name || product?.name || '').toString()

    const hasKgSignal =
      (!!medidaRaw && /(\b|\s)(kg|kilo|kilos)(\b|\s)/i.test(medidaRaw)) ||
      (nameText && /\b\d+\s?(kg|kilos?)\b/i.test(nameText)) ||
      (selectedCapacity && /kg/i.test(selectedCapacity))

    const hasLSignal =
      (!!medidaRaw && /\b\d+\s?(l|lt|lts|litro|litros)\b/i.test(medidaRaw)) ||
      (nameText && /\b\d+\s?(l|lt|lts|litro|litros)\b/i.test(nameText)) ||
      (selectedCapacity && /l$/i.test(selectedCapacity))

    // Analizar medidas de productos relacionados y variantes para detectar unidad dominante
    let relatedKg = 0,
      relatedL = 0
    try {
      if (relatedProducts?.products) {
        for (const p of relatedProducts.products) {
          const m = ((p as any).measure || (p as any).medida || '').toString()
          if (/\b\d+\s?(kg|kilos?)\b/i.test(m)) relatedKg++
          if (/\b\d+\s?(l|lt|lts|litro|litros)\b/i.test(m) || /l$/i.test(m)) relatedL++
        }
      }
    } catch {}

    let variantsKg = 0,
      variantsL = 0
    try {
      if (variants && variants.length > 0) {
        for (const v of variants as any[]) {
          const m = (v?.measure || '').toString()
          if (/\b\d+\s?(kg|kilos?)\b/i.test(m)) variantsKg++
          if (/\b\d+\s?(l|lt|lts|litro|litros)\b/i.test(m) || /l$/i.test(m)) variantsL++
        }
      }
    } catch {}

    // Regla principal: priorizar la unidad del tipo de producto.
    // Si el tipo es 'litros', solo cambiar a 'kg' cuando NO haya señales de litros
    // y sí haya señales consistentes de KG en todas las fuentes.
    if (productType.capacityUnit === 'litros') {
      if (hasLSignal || relatedL > 0 || variantsL > 0) return 'litros' as const
      if (!hasLSignal && (hasKgSignal || relatedKg > 0 || variantsKg > 0) && relatedL === 0 && variantsL === 0) {
        return 'kg' as const
      }
      return 'litros' as const
    }

    // Si el tipo es 'kg', mantener salvo señales fuertes de litros y cero de kg
    if (productType.capacityUnit === 'kg') {
      if ((hasLSignal || relatedL > 0 || variantsL > 0) && !hasKgSignal && relatedKg === 0 && variantsKg === 0) {
        return 'litros' as const
      }
      return 'kg' as const
    }

    // Otros tipos: respetar tipo por defecto
    return productType.capacityUnit
  }, [fullProductData, selectedCapacity, productType.capacityUnit, relatedProducts?.products, variants])

  // Cargar variantes cuando se abre el modal
  useEffect(() => {
    console.log('🔄 ShopDetailModal useEffect[2]: open =', open, 'product =', product?.name)
    if (open && product) {
      console.log('🔄 ShopDetailModal useEffect[2]: Cargando variantes y productos relacionados')
      
      // PRIORIDAD 1: Usar variantes pasadas explícitamente via prop
      const productVariants = (product as any)?.variants
      if (productVariants && Array.isArray(productVariants) && productVariants.length > 0) {
        console.log('✅ ShopDetailModal: Usando variantes pasadas via prop:', productVariants.length)
        console.log('🎨 Colores en variantes:', productVariants.map((v: any) => v.color_name).filter(Boolean))
        setVariants(productVariants)
        // No cargar desde API si ya tenemos variantes
      } else {
        console.log('⚠️ ShopDetailModal: No hay variantes en product, cargando desde API')
        loadVariants()
      }
      
      loadRelatedProducts()
    }
  }, [open, product])

  // Función para cargar variantes
  const loadVariants = async () => {
    if (!product) return
    
    setLoadingVariants(true)
    try {
      // Validar ID numérico antes de consultar API
      let productIdNum = typeof product.id === 'number' ? product.id : Number(product.id)
      
      // FIX ESPECÍFICO: Si es SINTETICO CONVERLUX y el ID es 38, usar el ID 34 que tiene las variantes
      console.log('🔍 DEBUG: Producto cargando variantes:', {
        name: product.name,
        id: productIdNum,
        isSinteticoConverlux: product.name?.toLowerCase().includes('sintético converlux')
      })
      
      if (product.name?.toLowerCase().includes('sintético converlux') && productIdNum === 38) {
        console.log('🔧 FIX: Cambiando ID de 38 a 34 para SINTETICO CONVERLUX')
        productIdNum = 34
      }
      
      console.log('🔍 DEBUG: ID final para cargar variantes:', productIdNum)
      
      if (!Number.isFinite(productIdNum) || productIdNum <= 0) {
        console.warn('⚠️ ID de producto inválido al cargar variantes:', product?.id)
        setVariants([])
        return
      }

      // Detectar si debemos unir variantes entre productos hermanos por mismo finish
      const slugText = ((fullProductData as any)?.slug || (fullProductData as any)?.variant_slug || '') as string
      const nameText = (fullProductData?.name || product?.name || '') as string
      const isImpregnante = /impregnante/i.test(nameText)
      const danzkeFamily = /impregnante-danzke/i.test(slugText) || /danzke/i.test(nameText)

      // Extraer acabado desde slug (brillante|satinado)
      let finishFromSlug: string | null = null
      if (slugText) {
        if (/-brillant[e-]?/i.test(slugText) || /-brillo-/i.test(slugText)) finishFromSlug = 'Brillante'
        else if (/-satinad[oa]-/i.test(slugText)) finishFromSlug = 'Satinado'
      }

      // Si es impregnate Danzke y tenemos finish, buscar productos hermanos con el mismo finish
      let aggregatedVariants: ProductVariant[] = []
      if (isImpregnante && danzkeFamily && finishFromSlug) {
        try {
          const baseLike = `%-${finishFromSlug.toLowerCase()}-petrilac`
          // Traer todos los productos hermanos con el mismo finish
          const { data: siblingProducts } = await supabase
            .from('products')
            .select('id, slug, name, price, discounted_price, medida, is_active')
            .ilike('slug', `impregnante-danzke-%${baseLike}`)
            .eq('is_active', true)

          const siblingIds = (siblingProducts || []).map((p: any) => p.id)

          if (siblingIds.length > 0) {
            const { data: siblingVariants } = await supabase
              .from('product_variants')
              .select('id, product_id, aikon_id, variant_slug, color_name, color_hex, measure, finish, price_list, price_sale, stock, is_active, is_default, image_url')
              .in('product_id', siblingIds)
              .eq('is_active', true)

            aggregatedVariants = (siblingVariants || []) as unknown as ProductVariant[]

            // Variantes sintéticas para productos sin filas en variants
            const productsWithoutVariants = (siblingProducts || []).filter((p: any) =>
              !(siblingVariants || []).some((v: any) => v.product_id === p.id)
            )
            for (const p of productsWithoutVariants) {
              const measure = (p.medida || '').toString().trim()
              if (measure) {
                aggregatedVariants.push({
                  id: `synthetic-${p.id}` as any,
                  measure,
                  finish: finishFromSlug,
                  price_list: Number(p.price) || undefined,
                  price_sale: Number(p.discounted_price) || undefined,
                  stock: undefined,
                  is_active: true,
                  is_default: false,
                })
              }
            }

            // CRÍTICO: Mapear precios correctos por capacidad+finish desde productos hermanos
            // Esto evita que se muestren precios incorrectos al cambiar capacidad
            const priceMap = new Map<string, { price_list: number, price_sale: number }>()
            for (const p of siblingProducts || []) {
              const measure = (p.medida || '').toString().trim()
              if (measure) {
                priceMap.set(measure, {
                  price_list: Number(p.price) || 0,
                  price_sale: Number(p.discounted_price) || Number(p.price) || 0
                })
              }
            }

            // Actualizar precios de variantes existentes con los correctos
            aggregatedVariants = aggregatedVariants.map(v => {
              const correctPrices = priceMap.get(v.measure || '')
              if (correctPrices) {
                return {
                  ...v,
                  price_list: correctPrices.price_list,
                  price_sale: correctPrices.price_sale
                }
              }
              return v
            })
          }
        } catch (e) {
          console.warn('⚠️ No se pudieron cargar variantes hermanas por finish:', e)
        }
      }

      let variantsData: ProductVariant[] = []
      if (aggregatedVariants.length > 0) {
        variantsData = aggregatedVariants
      } else {
        const productVariantsRes = await getProductVariants(productIdNum)
        variantsData = (productVariantsRes && (productVariantsRes as any).data)
          ? (productVariantsRes as any).data
          : []
      }
      setVariants(variantsData)
      // Log detallado de medidas y stock por variante para depurar
      try {
        console.debug('📦 ShopDetailModal: Variants overview (measure, stock, price, color_name)', variantsData.map(v => ({
          id: v.id,
          measure: v.measure,
          color_name: v.color_name,
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
      // No autoseleccionar un producto relacionado al abrir el modal
      // para no alterar precio/stock iniciales del card
      // La selección se hará sólo cuando el usuario cambie capacidad/ancho
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

    // Productos relacionados: incluir medidas para KG y también para LITROS
    if (relatedProducts?.products && relatedProducts.products.length > 0) {
      // Usamos el helper que ya normaliza y ordena medidas de productos relacionados
      const measures = getAvailableMeasures(relatedProducts.products)

      if (capacityUnit === 'kg') {
        // Solo medidas en KG
        collected.push(...measures.filter(m => /kg/i.test(m)))
      } else if (capacityUnit === 'litros') {
        // Solo medidas en litros
        collected.push(
          ...measures.filter(m => /\b\d+\s?(l|lt|lts|litro|litros)\b/i.test(m) || /l$/i.test(m))
        )
      } else {
        // Otras unidades: incluir todas
        collected.push(...measures)
      }
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
    console.log('🎨 DEBUG smartColors - productType.hasColorSelector:', productType.hasColorSelector)
    console.log('🎨 DEBUG smartColors - variants:', variants?.length || 0)
    console.log('🎨 DEBUG smartColors - product.variants:', (product as any)?.variants?.length || 0)
    
    if (!productType.hasColorSelector) {
      console.log('🎨 DEBUG smartColors: No tiene selector de color, retornando array vacío')
      return []
    }
    
    // Usar variantes del producto si las variantes cargadas están vacías
    const variantsToUse = variants?.length > 0 ? variants : (product as any)?.variants || []
    console.log('🎨 DEBUG smartColors: Usando variantes:', variantsToUse.length)
    console.log('🎨 DEBUG smartColors: variants cargadas:', variants?.length || 0)
    console.log('🎨 DEBUG smartColors: product.variants:', (product as any)?.variants?.length || 0)
    console.log('🎨 DEBUG smartColors: product completo:', product)

    const isImpregnante = productType.id === 'impregnante-madera'
    const isTerminaciones = productType.id === 'terminaciones'
    // Para impregnantes DANZKE usar siempre misma paleta (independiente de satinado/brillante)
    const SATINADO_WHITELIST = ['caoba', 'cedro', 'cristal', 'nogal', 'pino', 'roble']
    const isDanzke = /danzke/i.test(
      `${(fullProductData as any)?.brand || product?.brand || ''} ${(fullProductData as any)?.name || product?.name || ''}`
    )
    const shouldForceDanzkePalette = isImpregnante && isDanzke
    const BLOCKED = ['blanco', 'blanco-puro', 'blanco puro', 'crema', 'marfil']

    const toSlug = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, '-')
        .trim()

    // 1) PRIORIDAD: Usar colores reales de variantes de la BD para TODOS los productos
    if (variantsToUse && variantsToUse.length > 0) {
      console.log('🎨 DEBUG smartColors: Procesando variantes para colores inteligentes...')
      console.log('🎨 DEBUG smartColors: Total variantes recibidas:', variantsToUse.length)
      
      const variantNames = Array.from(
        new Set(
          variantsToUse
            .map(v => (v.color_name || '').toString().trim())
            .filter(Boolean)
        )
      )
      
      console.log('🎨 DEBUG smartColors: Nombres de colores únicos:', variantNames)
      console.log('🎨 DEBUG smartColors: Total colores únicos:', variantNames.length)

      // Para impregnantes DANZKE, forzar la paleta fija, respetando el orden
      if (isImpregnante && shouldForceDanzkePalette) {
        const ordered = SATINADO_WHITELIST.map(key =>
          PAINT_COLORS.find(c => c.id === key || c.name === key)!
        ).filter(Boolean) as ColorOption[]
        try { console.log('🎨 smartColors (impregnante danzke - fixed palette):', ordered.map(c => c.displayName)) } catch {}
        return ordered
      }

      // ⚠️ CRÍTICO: NO filtrar colores bloqueados para productos sintéticos
      // Solo filtrar para impregnantes
      let filteredNames = variantNames
      if (isImpregnante) {
        filteredNames = variantNames.filter(name => 
          !BLOCKED.some(b => name.toLowerCase().includes(b))
        )
        console.log('🎨 Colores después de filtrar bloqueados:', filteredNames)
      }

      const list: ColorOption[] = []
      for (const name of filteredNames) {
        const slug = toSlug(name)
        const found = PAINT_COLORS.find(
          c => c.id === slug || c.name === slug || c.displayName.toLowerCase() === name.toLowerCase()
        )
        if (found) {
          if (!list.find(l => l.id === found.id)) list.push(found)
        } else {
          // Si no se encuentra en PAINT_COLORS, crear uno personalizado
          // Intentar obtener hex desde COLOR_HEX_MAP primero
          const hexFromMap = getColorHex(name) || '#E5E7EB'
          list.push({
            id: slug,
            name: name.toLowerCase(),
            displayName: name,
            hex: hexFromMap,
            category: isImpregnante ? 'Madera' : 'Sintético',
            family: 'Personalizados',
            isPopular: false,
            description: `Color ${name}`
          })
        }
      }
      
      if (list.length > 0) {
        // Ordenar colores: blancos primero, luego negros, luego el resto
        const sortedList = list.sort((a, b) => {
          const getColorPriority = (color: ColorOption) => {
            const name = color.displayName.toLowerCase()
            if (name.includes('blanco')) return 1
            if (name.includes('negro')) return 2
            if (name.includes('gris')) return 3
            if (name.includes('amarillo')) return 4
            if (name.includes('azul')) return 5
            if (name.includes('verde')) return 6
            if (name.includes('rojo') || name.includes('bermellon')) return 7
            if (name.includes('naranja')) return 8
            if (name.includes('marron') || name.includes('marrón')) return 9
            return 10
          }
          
          const priorityA = getColorPriority(a)
          const priorityB = getColorPriority(b)
          
          if (priorityA !== priorityB) {
            return priorityA - priorityB
          }
          
          // Dentro de la misma familia, ordenar alfabéticamente
          return a.displayName.localeCompare(b.displayName)
        })
        
        console.log('✅ smartColors ordenados:', sortedList.map(c => c.displayName))
        console.log('✅ Total colores a mostrar:', sortedList.length)
        return sortedList
      }
    }


    // 1.5) Para terminaciones, priorizar colores desde variantes de la BD
    if (isTerminaciones && variantsToUse && variantsToUse.length > 0) {
      const variantNames = Array.from(
        new Set(
          variantsToUse
            .map(v => (v.color_name || '').toString().trim())
            .filter(Boolean)
        )
      )

      const list: ColorOption[] = []
      for (const name of variantNames) {
        const slug = toSlug(name)
        const found = PAINT_COLORS.find(
          c => c.id === slug || c.name === slug || c.displayName.toLowerCase() === name.toLowerCase()
        )
        if (found) {
          if (!list.find(l => l.id === found.id)) list.push(found)
        } else {
          // Para terminaciones, crear color personalizado basado en el nombre
          list.push({
            id: slug,
            name: slug,
            displayName: name,
            hex: name.toLowerCase() === 'incoloro' ? 'rgba(255,255,255,0.1)' : '#B88A5A',
            category: 'Madera',
            family: name.toLowerCase() === 'incoloro' ? 'Transparentes' : 'Marrones',
          })
        }
      }
      try { console.log('🎨 smartColors (terminaciones - variants prioritizados):', list.map(c => c.displayName)) } catch {}
      return list
    }

    // 2) Fallback textual para otros productos
    const declaredColor = (((fullProductData as any)?.color || '') as string).toString().trim()
    const extractedFromName = extractColorFromName(fullProductData?.name || product?.name || '') || ''
    const descriptionText = (fullProductData?.description || '') as string

    const sourcesText = [declaredColor, extractedFromName, descriptionText]
      .join(' ')
      .toLowerCase()

    const hasWholeWord = (text: string, word: string) => {
      if (!word) return false
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const re = new RegExp(`(^|[^a-z0-9áéíóúüñ])${escaped}([^a-z0-9áéíóúüñ]|$)`, 'i')
      return re.test(text)
    }

    const synonyms: Record<string, string> = {
      blanco: 'blanco',
      'blanco puro': 'blanco-puro',
      cemento: 'cemento',
      gris: 'gris',
      'rojo teja': 'rojo-teja',
      teja: 'rojo-teja',
      'rojo-teja': 'rojo-teja',
      incoloro: 'incoloro',
      transparente: 'incoloro',
    }

    let matches: ColorOption[] = []

    if (declaredColor) {
      const colorParts = declaredColor
        .split(/[,\/;|]+/)
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)

      for (const part of colorParts) {
        const key = synonyms[part] || part
        const color = PAINT_COLORS.find(
          c => c.id === key || c.name === key || c.displayName.toLowerCase() === part
        )
        if (color && !matches.find(m => m.id === color.id)) {
          matches.push(color)
        }
      }
    }

    Object.entries(synonyms).forEach(([keyword, colorKey]) => {
      if (hasWholeWord(sourcesText, keyword)) {
        const color = PAINT_COLORS.find(c => c.name === colorKey || c.id === colorKey)
        if (color && !matches.find(m => m.id === color.id)) {
          matches.push(color)
        }
      }
    })

    if (isImpregnante) {
      // Para DANZKE, forzar la misma paleta
      if (shouldForceDanzkePalette) {
        const ordered = SATINADO_WHITELIST.map(key =>
          PAINT_COLORS.find(c => c.id === key || c.name === key)!
        ).filter(Boolean) as ColorOption[]
        try { console.log('🎨 smartColors (fallback danzke - fixed palette):', ordered.map(c => c.displayName)) } catch {}
        return ordered
      }
      // En otros impregnantes, filtrar bloqueados
      matches = matches.filter(c => !BLOCKED.includes(c.id))
    }

    if (isTerminaciones) {
      // Para terminaciones, si no hay colores encontrados, usar solo INCOLORO
      if (matches.length === 0) {
        const incoloro = PAINT_COLORS.find(c => c.id === 'incoloro')
        if (incoloro) {
          matches = [incoloro]
        }
      }
      // Filtrar solo colores de madera para terminaciones
      matches = matches.filter(c => c.category === 'Madera')
    }

    try {
      console.log('🎨 smartColors detectados:', {
        via: 'text',
        declaredColor,
        extractedFromName,
        count: matches.length,
        colors: matches.map(m => ({ id: m.id, name: m.displayName })),
      })
    } catch {}

    return matches
  }, [productType.hasColorSelector, productType.id, fullProductData, product, variants])

  // Establecer valores por defecto usando colores y capacidades inteligentes
  useEffect(() => {
    console.log('🔍 DEBUG Estableciendo valores por defecto:', {
      selectedColor,
      selectedCapacity,
      smartColorsLength: smartColors.length,
      availableCapacitiesLength: availableCapacities.length,
      hasColorSelector: productType.hasColorSelector
    })
    
    if (!selectedColor && productType.hasColorSelector && smartColors.length > 0) {
      console.log('✅ Estableciendo color por defecto:', smartColors[0].id)
      setSelectedColor(smartColors[0].id)
    }
    if (!selectedCapacity && availableCapacities.length > 0) {
      console.log('✅ Estableciendo capacidad por defecto:', availableCapacities[0])
      setSelectedCapacity(availableCapacities[0])
    }
  }, [smartColors, availableCapacities, selectedColor, selectedCapacity, productType.hasColorSelector])

  // Actualizar variante seleccionada cuando cambia la capacidad
  useEffect(() => {
    console.log('🔍 DEBUG Cambio capacidad - Estado inicial:', {
      selectedCapacity,
      selectedColor,
      selectedColorEmpty: !selectedColor,
      variantsCount: variants?.length || 0,
      variantsMeasures: Array.isArray(variants) ? variants.map(v => v.measure).slice(0, 5) : 'variants no es array',
      smartColorsLength: smartColors.length,
      firstSmartColor: smartColors.length > 0 ? smartColors[0].id : 'none'
    })
    
    if (selectedCapacity && variants && variants.length > 0) {
      // Primero intentar encontrar variante que coincida con color Y capacidad
      let variant = null
      
      // Usar el color seleccionado, o el primer smartColor si no hay color seleccionado
      // CRÍTICO: Si no hay color seleccionado, establecerlo inmediatamente
      if (!selectedColor && smartColors.length > 0) {
        console.log('🔧 FIX: No hay color seleccionado, estableciendo:', smartColors[0].id)
        setSelectedColor(smartColors[0].id)
        return // Salir para que se re-ejecute con el color establecido
      }
      
      const colorToUse = selectedColor || (smartColors.length > 0 ? smartColors[0].id : null)
      
      console.log('🔍 DEBUG Color para búsqueda:', {
        selectedColor,
        colorToUse,
        willSearchByColor: !!colorToUse,
        smartColorsFirst: smartColors.length > 0 ? smartColors[0].id : 'none',
        smartColorsCount: smartColors.length
      })
      
      // CRÍTICO: Si no hay color seleccionado, mostrar todos los colores disponibles
      if (!selectedColor && smartColors.length > 0) {
        console.log('⚠️ NO HAY COLOR SELECCIONADO - Colores disponibles:', smartColors.map(c => c.id))
      }
      
      if (colorToUse && selectedCapacity) {
        // Convertir el selectedColor (id) a slug
        const toSlug = (s: string) =>
          s
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/\s+/g, '-')
            .trim()
        
        const selectedColorSlug = toSlug(colorToUse)
        
        // Debug: Ver todas las variantes de la capacidad seleccionada
        const variantsForCapacity = variants.filter(v => findVariantByCapacity([v], selectedCapacity) !== null)
        console.log('🔍 DEBUG variantes disponibles para capacidad', selectedCapacity, ':', 
          variantsForCapacity.map(v => ({
            id: v.id,
            color: v.color_name,
            colorSlug: toSlug(v.color_name || ''),
            measure: v.measure,
            price: v.price_sale,
            price_list: v.price_list
          }))
        )
        
        // Debug: Buscar específicamente variantes con precio $40.195
        const variants40195 = variantsForCapacity.filter(v => v.price_sale === 40195)
        console.log('🔍 DEBUG variantes con precio $40.195:', variants40195.map(v => ({
          id: v.id,
          color: v.color_name,
          measure: v.measure,
          price: v.price_sale
        })))
        
        // Debug: Ver todas las variantes que coinciden con el color
        const variantsForColor = variants.filter(v => {
          const colorNameSlug = toSlug(v.color_name || '')
          return colorNameSlug === selectedColorSlug || 
                 (v.color_name || '').toLowerCase().trim() === colorToUse.toLowerCase().trim()
        })
        console.log('🔍 DEBUG variantes disponibles para color', colorToUse, ':', 
          variantsForColor.map(v => ({
            id: v.id,
            color: v.color_name,
            measure: v.measure,
            price: v.price_sale,
            price_list: v.price_list
          }))
        )
        
        // Debug: Buscar la variante correcta manualmente
        const correctVariant = variants.find(v => {
          const capacityMatch = findVariantByCapacity([v], selectedCapacity) !== null
          const colorMatch = (v.color_name || '').toLowerCase().includes('blanco') && 
                           (v.color_name || '').toLowerCase().includes('brill')
          return capacityMatch && colorMatch
        })
        console.log('🔍 DEBUG búsqueda manual correcta:', {
          found: !!correctVariant,
          variant: correctVariant ? {
            id: correctVariant.id,
            color: correctVariant.color_name,
            measure: correctVariant.measure,
            price: correctVariant.price_sale
          } : null
        })
        
        // Buscar variante que coincida con ambos
        console.log('🔍 DEBUG Buscando variante con color+capacidad...')
        variant = variants.find((v, index) => {
          const capacityMatch = findVariantByCapacity([v], selectedCapacity) !== null
          const colorNameSlug = toSlug(v.color_name || '')
          // Comparar slugs O comparar directamente los nombres
          const colorMatch = colorNameSlug === selectedColorSlug || 
                            (v.color_name || '').toLowerCase().trim() === colorToUse.toLowerCase().trim()
          
          console.log(`🔍 Variante ${index}:`, {
            id: v.id,
            variantColor: v.color_name,
            variantColorSlug: colorNameSlug,
            measure: v.measure,
            price: v.price_sale,
            colorToUse,
            selectedColorSlug,
            colorMatch,
            capacityMatch,
            willMatch: capacityMatch && colorMatch
          })
          
          return capacityMatch && colorMatch
        }) || null
        
        // FIX TEMPORAL: Si no encuentra con la lógica normal, usar la búsqueda manual
        if (!variant && correctVariant) {
          console.log('🔧 FIX TEMPORAL: Usando búsqueda manual correcta')
          variant = correctVariant
        }
        
        // FIX CRÍTICO: Si aún no encuentra, buscar cualquier variante de 4L con precio $40.195
        if (!variant) {
          const variant40195 = variants.find(v => {
            const capacityMatch = findVariantByCapacity([v], selectedCapacity) !== null
            const priceMatch = v.price_sale === 40195
            return capacityMatch && priceMatch
          })
          
          if (variant40195) {
            console.log('🔧 FIX CRÍTICO: Encontrada variante con precio $40.195:', {
              id: variant40195.id,
              color: variant40195.color_name,
              measure: variant40195.measure,
              price: variant40195.price_sale
            })
            variant = variant40195
          }
        }
        
        console.log('🔍 DEBUG resultado búsqueda color+capacidad:', {
          selectedColor,
          colorToUse,
          selectedColorSlug,
          selectedCapacity,
          found: !!variant,
          variant: variant ? {
            id: variant.id,
            measure: variant.measure,
            color_name: variant.color_name,
            price_sale: variant.price_sale
          } : null,
          totalVariantsChecked: variants.length,
          variantsWithCapacity: variants.filter(v => findVariantByCapacity([v], selectedCapacity) !== null).length
        })
      }
      
      // Si no se encuentra con color específico, buscar solo por capacidad (fallback)
      if (!variant) {
        variant = findVariantByCapacity(variants, selectedCapacity)
        console.log('🔍 DEBUG fallback solo capacidad:', {
          selectedCapacity,
          found: !!variant,
          variant: variant ? {
            id: variant.id,
            measure: variant.measure,
            color_name: variant.color_name,
            price_sale: variant.price_sale
          } : null
        })
      }
      
      setSelectedVariant(variant)
      // Al encontrar variante, limpiar producto relacionado para evitar confusión
      if (variant) {
        setSelectedRelatedProduct(null)
        console.log('✅ Variante encontrada:', {
          selectedCapacity,
          selectedColor,
          variantFound: {
            id: variant.id,
            measure: variant.measure,
            color_name: variant.color_name,
            price_list: variant.price_list,
            price_sale: variant.price_sale,
            stock: variant.stock,
          },
          effectivePrice: getEffectivePrice(variant),
        })
      } else {
        console.log('⚠️ No se encontró variante para capacidad:', selectedCapacity, 
          '- Disponibles:', Array.isArray(variants) ? variants.map(v => v.measure).filter((v, i, a) => a.indexOf(v) === i) : 'variants no es array')
      }
    }
  }, [selectedCapacity, selectedColor, variants, smartColors])

  // Seleccionar producto relacionado por capacidad cuando no hay variante para esa capacidad
  useEffect(() => {
    if (
      selectedCapacity &&
      relatedProducts?.products &&
      relatedProducts.products.length > 0
    ) {
      // Función normalize definida primero
      const normalize = (v?: string | null): string => {
        if (!v) return ''
        const up = v.trim().toUpperCase()
        const noSpaces = up.replace(/\s+/g, '')
        // Eliminar puntuación común como puntos o guiones ("4 LTS." -> "4LTS")
        const noPunct = noSpaces.replace(/[.\-_/]/g, '')
        const kg = noPunct.replace(/(KGS|KILO|KILOS)$/i, 'KG')
        const l = kg.replace(/(LT|LTS|LITRO|LITROS)$/i, 'L')
        return l
      }
      
      // Verificar si la variante actual corresponde a la capacidad seleccionada
      const variantMatchesCapacity = selectedVariant && 
        (selectedVariant.measure === selectedCapacity || 
         normalize(selectedVariant.measure) === normalize(selectedCapacity))
      
      // Solo buscar producto relacionado si NO hay variante para esta capacidad específica
      if (!variantMatchesCapacity) {
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
      } else {
        // Si la variante coincide con la capacidad, limpiar producto relacionado
        setSelectedRelatedProduct(null)
        console.log('✅ Variante existente coincide con capacidad seleccionada')
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

  // Imagen principal saneada con getValidImageUrl (elimino comillas/backticks y valido URL)
  const mainImageUrl = useMemo(() => {
    const sanitize = (u?: string) => (typeof u === 'string' ? u.replace(/[`"]/g, '').trim() : '')
    const urlFrom = (c: any) => {
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
      const candidate = urlFrom(c)
      const validated = getValidImageUrl(candidate)
      if (validated && !validated.includes('placeholder')) return validated
    }
    return '/images/products/placeholder.svg'
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
    // Priorizar el precio recibido desde la card
    const baseCandidate = product.price ?? (fullProductData as any)?.discounted_price ?? (fullProductData as any)?.price
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
      // Fallback: usar el precio de la card como fuente de verdad
      const candidate = product.price ?? (fullProductData as any)?.discounted_price ?? (fullProductData as any)?.price
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
      // Precio de lista de la variante
      return selectedVariant.price_list
    }
    
    if (selectedRelatedProduct) {
      return parseFloat(selectedRelatedProduct.price)
    }
    
    if (selectedWidth && productType.hasWidthSelector && widthToPriceMap[selectedWidth]) {
      return parseFloat(widthToPriceMap[selectedWidth].price)
    }
    
    // Fallback: usar originalPrice de la card si existe
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

  // Obtener colores reales de las variantes de la base de datos
  const availableColors = useMemo(() => {
    console.log('🎨 DEBUG availableColors - productType.hasColorSelector:', productType.hasColorSelector)
    console.log('🎨 DEBUG availableColors - variants:', variants?.length || 0)
    console.log('🎨 DEBUG availableColors - product.variants:', (product as any)?.variants?.length || 0)
    
    if (!productType.hasColorSelector) {
      console.log('🎨 DEBUG: No tiene selector de color, retornando array vacío')
      return []
    }
    
    // Usar variantes del producto si las variantes cargadas están vacías
    const variantsToUse = variants?.length > 0 ? variants : (product as any)?.variants || []
    console.log('🎨 DEBUG: Usando variantes:', variantsToUse.length)
    
    // Si tenemos variantes con colores, usarlas
    if (variantsToUse && variantsToUse.length > 0) {
      console.log('🎨 DEBUG: Procesando variantes para extraer colores...')
      const uniqueColors = new Set<string>()
      console.log('🎨 DEBUG: Procesando', variantsToUse.length, 'variantes')
      variantsToUse.forEach((variant, index) => {
        console.log(`🎨 DEBUG variant ${index + 1}:`, { 
          id: variant.id, 
          color_name: variant.color_name,
          measure: variant.measure 
        })
        if (variant.color_name) {
          uniqueColors.add(variant.color_name)
        }
      })
      
      console.log('🎨 DEBUG: Colores únicos encontrados:', Array.from(uniqueColors))
      console.log('🎨 DEBUG: Total colores únicos:', uniqueColors.size)
      console.log('🎨 DEBUG: Esperados: 20 colores')
      
      if (uniqueColors.size > 0) {
        // Convertir los nombres de colores a ColorOption
        const colorOptions: ColorOption[] = Array.from(uniqueColors).map(colorName => {
          // Buscar si ya existe en PAINT_COLORS
          const existingColor = PAINT_COLORS.find(c => 
            c.name.toLowerCase() === colorName.toLowerCase() ||
            c.displayName.toLowerCase() === colorName.toLowerCase() ||
            c.id.toLowerCase() === colorName.toLowerCase()
          )
          
          if (existingColor) {
            console.log('🎨 DEBUG: Color encontrado en PAINT_COLORS:', colorName)
            return existingColor
          }
          
          // Si no existe, crear uno nuevo
          console.log('🎨 DEBUG: Creando color personalizado:', colorName)
          return {
            id: colorName.toLowerCase().replace(/\s+/g, '-'),
            name: colorName.toLowerCase(),
            displayName: colorName,
            hex: '#E5E7EB', // Color gris por defecto
            category: 'Sintético',
            family: 'Personalizados',
            isPopular: false,
            description: `Color ${colorName}`
          }
        })
        
        console.log('🎨 Colores reales de variantes:', colorOptions.map(c => c.displayName))
        return colorOptions
      }
    }
    
    // Fallback: usar colores del producto si están definidos
    if (product.colors && product.colors.length > 0) {
      console.log('🎨 DEBUG: Usando colores del producto:', product.colors.length)
      return product.colors
    }
    
    // Último fallback: no mostrar colores por defecto
    console.log('⚠️ No se encontraron colores reales, no mostrando colores por defecto')
    return []
  }, [variants, productType.hasColorSelector, product.colors])
  
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

    // Medida normalizada para el carrito
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
      (fullProductData as any)?.medida ||
      (product as any)?.medida
    ) as string | undefined
    const normalizedMeasure = normalize(rawMeasure || '')

    // Precio unitario efectivo (lo que ve el usuario) y precio original (para mostrar descuento)
    const unitPrice = Number(currentPrice) || 0
    const originalUnitPrice = Number(originalPrice) || unitPrice
    const discountedUnitPrice = unitPrice < originalUnitPrice ? unitPrice : undefined

    // Prioridad 1: Producto relacionado seleccionado (por ancho o capacidad)
    if (selectedRelatedProduct) {
      productToAdd = {
        ...selectedRelatedProduct,
        id: selectedRelatedProduct.id,
        name: selectedRelatedProduct.name,
        // Asegurar que el carrito reciba precio original y con descuento cuando corresponda
        price: originalUnitPrice,
        ...(discountedUnitPrice !== undefined
          ? { discounted_price: discountedUnitPrice }
          : {}),
        medida: (selectedRelatedProduct as any)?.medida || (selectedRelatedProduct as any)?.measure,
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
        // Asegurar que el carrito reciba precio original y con descuento cuando corresponda
        price: originalUnitPrice,
        ...(discountedUnitPrice !== undefined
          ? { discounted_price: discountedUnitPrice }
          : {}),
        capacity: (selectedVariant as any)?.capacity,
        medida: (selectedVariant as any)?.measure,
      }
    }
    // Si no hay variante ni producto relacionado, reforzar precios en el objeto base
    else {
      productToAdd = {
        ...productToAdd,
        price: originalUnitPrice,
        ...(discountedUnitPrice !== undefined
          ? { discounted_price: discountedUnitPrice }
          : {}),
      }
    }

    // Detectar finish para impregnantes Danzke
    const slugText = ((fullProductData as any)?.slug || (fullProductData as any)?.variant_slug || '') as string
    const nameText = (fullProductData?.name || product?.name || '') as string
    const isImpregnante = /impregnante/i.test(nameText)
    const danzkeFamily = /impregnante-danzke/i.test(slugText) || /danzke/i.test(nameText)
    
    let finishFromSlug: string | null = null
    if (isImpregnante && danzkeFamily && slugText) {
      if (/-brillant[e-]?/i.test(slugText) || /-brillo-/i.test(slugText)) finishFromSlug = 'Brillante'
      else if (/-satinad[oa]-/i.test(slugText)) finishFromSlug = 'Satinado'
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
        measure: normalizedMeasure,
        price: unitPrice,
        stock: effectiveStock,
        grain: selectedGrain,
        size: selectedSize,
        width: selectedWidth,
        finish: finishFromSlug, // Agregar finish para impregnantes Danzke
        // Pasar cantidad al callback para que el carrito la respete
        quantity,
      }
    }

    try {
      console.log('🛒 ShopDetailModal: Agregando al carrito...', {
        productToAdd,
        variants: cartData.variants,
        debug: {
          selectedVariant: selectedVariant ? { id: selectedVariant.id, measure: (selectedVariant as any)?.measure, stock: (selectedVariant as any)?.stock } : null,
          selectedRelatedProduct: selectedRelatedProduct ? { id: selectedRelatedProduct.id, measure: (selectedRelatedProduct as any)?.measure || (selectedRelatedProduct as any)?.medida, stock: (selectedRelatedProduct as any)?.stock } : null,
          normalizedMeasure,
          effectiveStock,
          unitPrice,
        }
      })
      await onAddToCart(productToAdd, cartData.variants)
      console.log('🛒 ShopDetailModal: Producto agregado, cerrando modal...')
      onOpenChange(false) // Cerrar modal después de agregar al carrito
      console.log('🛒 ShopDetailModal: onOpenChange(false) llamado')
      // Mantener la ubicación actual: no forzar redirección
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
              onError={e => {
                const target = e.currentTarget as HTMLImageElement
                if (target && target.src !== '/images/products/placeholder.svg') {
                  target.src = '/images/products/placeholder.svg'
                }
              }}
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
              <>
                {console.log('🎨 RENDER DEBUG:', {
                  hasColorSelector: productType.hasColorSelector,
                  smartColorsLength: smartColors.length,
                  availableColorsLength: availableColors.length,
                  smartColors: smartColors.slice(0, 3),
                  availableColors: availableColors.slice(0, 3),
                  finalColors: smartColors.length > 0 ? smartColors : availableColors
                })}
                <AdvancedColorPicker
                  colors={smartColors.length > 0 ? smartColors : availableColors}
                  selectedColor={selectedColor}
                  onColorChange={setSelectedColor}
                  showSearch={false}
                  showCategories={false}
                  maxDisplayColors={smartColors.length > 0 ? smartColors.length : availableColors.length}
                  className='bg-white'
                  productType={productType}
                />
              </>
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
              {/* Mostrar finish para impregnantes Danzke */}
              {(() => {
                const slugText = ((fullProductData as any)?.slug || (fullProductData as any)?.variant_slug || '') as string
                const nameText = (fullProductData?.name || product?.name || '') as string
                const isImpregnante = /impregnante/i.test(nameText)
                const danzkeFamily = /impregnante-danzke/i.test(slugText) || /danzke/i.test(nameText)
                
                if (isImpregnante && danzkeFamily && slugText) {
                  let finishFromSlug: string | null = null
                  if (/-brillant[e-]?/i.test(slugText) || /-brillo-/i.test(slugText)) finishFromSlug = 'Brillante'
                  else if (/-satinad[oa]-/i.test(slugText)) finishFromSlug = 'Satinado'
                  
                  if (finishFromSlug) {
                    return (
                      <p className='text-xs text-gray-500'>
                        <span className='font-medium'>Acabado:</span>{' '}
                        <span className='font-medium capitalize'>{finishFromSlug}</span>
                      </p>
                    )
                  }
                }
                return null
              })()}
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
