'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { QuickViewModal } from '@/components/ui/modal'
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

console.log('🎯 ShopDetailModal - Componente cargado')

// ===================================
// TIPOS
// ===================================

interface Product {
  id: string
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
              boxShadow: color.toLowerCase() === 'blanco' ? 'inset 0 0 0 1px #E5E7EB' : 'none',
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

          <input
            type='number'
            value={quantity}
            onChange={e => {
              const value = parseInt(e.target.value) || 1
              const clampedValue = Math.max(1, Math.min(value, Math.min(maxQuantity, stock)))
              onQuantityChange(clampedValue)
            }}
            className='w-16 px-3 py-3 text-center border-0 focus:outline-none font-semibold text-gray-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
            min='1'
            max={Math.min(maxQuantity, stock)}
          />

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
  console.log('🎯 ShopDetailModal - Renderizando con props:', {
    productId: product?.id,
    open,
    hasOnOpenChange: !!onOpenChange,
  })

  // Debug: Verificar que onOpenChange se recibe correctamente
  console.log('ShopDetailModal - onOpenChange recibido:', typeof onOpenChange, onOpenChange)
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
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [loadingVariants, setLoadingVariants] = useState(false)

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
  }

  // Detectar tipo de producto
  const productType = detectProductType(product.name, product.category)

  // Cargar variantes del producto
  useEffect(() => {
    if (open && product.id) {
      setLoadingVariants(true)
      getProductVariants(product.id)
        .then(response => {
          if (response.success && response.data) {
            setVariants(response.data)
            // Seleccionar la primera variante por defecto
            if (response.data.length > 0) {
              const firstVariant = response.data[0]
              setSelectedVariant(firstVariant)
              setSelectedCapacity(firstVariant.capacity)
            }
          }
        })
        .catch(error => {
          console.error('Error cargando variantes:', error)
          setVariants([])
        })
        .finally(() => {
          setLoadingVariants(false)
        })
    }
  }, [open, product.id])

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

  // Actualizar variante seleccionada cuando cambia la capacidad
  useEffect(() => {
    if (selectedCapacity && variants.length > 0) {
      const variant = findVariantByCapacity(variants, selectedCapacity)
      setSelectedVariant(variant)
    }
  }, [selectedCapacity, variants])

  // Calcular capacidades disponibles basándose en las variantes
  const availableCapacities =
    variants.length > 0 ? getAvailableCapacities(variants) : productType.defaultCapacities

  // Calcular precio dinámico basado en selecciones
  const calculateDynamicPrice = useCallback(() => {
    let basePrice = selectedVariant
      ? getEffectivePrice(selectedVariant)
      : parseFloat(product.discounted_price || product.price)

    // Aplicar modificadores de precio por tamaño
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

    // Aplicar modificadores de precio por ancho/longitud
    if (selectedWidth && productType.hasWidthSelector) {
      const widthMultipliers: { [key: string]: number } = {
        '12mm': 1.0,
        '18mm': 1.2,
        '24mm': 1.4,
        '36mm': 1.6,
        '48mm': 1.8,
        '72mm': 2.0,
      }
      const multiplier = widthMultipliers[selectedWidth] || 1.0
      basePrice *= multiplier
    }

    return basePrice
  }, [selectedVariant, selectedSize, selectedWidth, productType, product])

  // Obtener precio actual basado en la variante seleccionada y modificadores
  const currentPrice = calculateDynamicPrice()
  const originalPrice = selectedVariant
    ? parseFloat(selectedVariant.price)
    : parseFloat(product.price)
  const hasVariantDiscount = selectedVariant
    ? hasDiscount(selectedVariant)
    : product.discounted_price && parseFloat(product.discounted_price) < parseFloat(product.price)

  // Datos por defecto para productos de pinturería
  const availableColors = product.colors || PAINT_COLORS.slice(0, 12) // Usar colores del producto o los primeros 12 por defecto
  const defaultCapacities = product.capacities || ['1L', '4L', '10L', '20L']

  const handleAddToCart = () => {
    if (onAddToCart) {
      // Usar el producto de la variante seleccionada si está disponible
      const productToAdd = selectedVariant
        ? {
            ...product,
            id: selectedVariant.id,
            price: selectedVariant.price,
            discounted_price: selectedVariant.discounted_price,
            capacity: selectedVariant.capacity,
          }
        : product

      onAddToCart(productToAdd, quantity, selectedColor, selectedCapacity)
    }
    // Verificar que onOpenChange existe antes de llamarla
    if (onOpenChange) {
      onOpenChange(false)
    }
  }

  const handleAddToFavorites = () => {
    if (onAddToFavorites) {
      onAddToFavorites(product)
    }
  }

  // Calcular si hay descuento (renombrado para evitar conflicto)
  const hasProductDiscount = product.originalPrice && product.originalPrice > product.price

  return (
    <QuickViewModal open={open} onOpenChange={onOpenChange}>
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto'>
        {/* Imagen del producto */}
        <div className='space-y-4'>
          <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden'>
            <img
              src={product.images?.[0] || '/images/placeholder-product.jpg'}
              alt={product.name}
              className='w-full h-full object-cover'
            />
          </div>

          {hasProductDiscount && (
            <Badge variant='destructive' className='w-fit'>
              {Math.round(
                ((product.originalPrice! - product.price) / product.originalPrice!) * 100
              )}
              % OFF
            </Badge>
          )}
        </div>

        {/* Información del producto */}
        <div className='space-y-6'>
          {/* Header */}
          <div className='space-y-2'>
            <p className='text-sm text-gray-500 uppercase font-medium'>{product.brand}</p>
            <h2 className='text-2xl font-bold text-gray-900'>{product.name}</h2>

            <div className='flex items-center gap-3'>
              {hasVariantDiscount ? (
                <>
                  <span className='text-3xl font-bold text-blaze-orange-600'>
                    ${currentPrice.toLocaleString()}
                  </span>
                  <span className='text-xl text-gray-500 line-through'>
                    ${originalPrice.toLocaleString()}
                  </span>
                  <Badge variant='destructive' className='text-sm'>
                    {Math.round(((originalPrice - currentPrice) / originalPrice) * 100)}% OFF
                  </Badge>
                </>
              ) : (
                <span className='text-3xl font-bold text-blaze-orange-600'>
                  ${currentPrice.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* Descripción */}
          {product.description && (
            <div>
              <p className='text-gray-600 leading-relaxed'>{product.description}</p>
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
              stock={product.stock}
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
              <WidthSelector
                widthOptions={productType.widthOptions}
                selectedWidth={selectedWidth}
                onWidthChange={setSelectedWidth}
              />
            )}
          </div>

          <Separator />

          {/* Precio total */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <div className='flex justify-between items-center'>
              <span className='text-lg font-medium text-gray-900'>Total:</span>
              <span className='text-2xl font-bold text-blaze-orange-600'>
                ${(currentPrice * quantity).toLocaleString()}
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
              disabled={product.stock === 0 || isLoading}
              className='w-full bg-yellow-400 hover:bg-yellow-500 text-black text-lg py-3 rounded-xl font-semibold'
              size='lg'
            >
              <ShoppingCart className='mr-2 h-5 w-5' />
              {product.stock === 0
                ? 'Sin Stock'
                : isLoading
                  ? 'Agregando...'
                  : 'Agregar al Carrito'}
            </Button>
          </div>

          {/* Información adicional */}
          <div className='text-sm text-gray-600 space-y-1'>
            <FreeShippingText />
            <p>• Garantía de calidad en todos nuestros productos</p>
            <p>• Asesoramiento técnico especializado</p>
          </div>
        </div>
      </div>
    </QuickViewModal>
  )
}

export default ShopDetailModal
