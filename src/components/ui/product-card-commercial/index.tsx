'use client'

import React from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import Image from 'next/image'
import { cn } from '@/lib/core/utils'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'
import { useCartUnified } from '@/hooks/useCartUnified'
import { trackAddToCart as trackGA4AddToCart } from '@/lib/google-analytics'
import { trackAddToCart as trackMetaAddToCart } from '@/lib/meta-pixel'
import { useAnalytics } from '@/components/Analytics/UnifiedAnalyticsProvider'
import { useAppSelector } from '@/redux/store'
import { selectCartItems } from '@/redux/features/cart-slice'
import { toast } from 'react-hot-toast'
import { useDevicePerformance } from '@/hooks/useDevicePerformance'
import { useScrollActive } from '@/hooks/useScrollActive'

// Hooks personalizados
import { useProductVariantSelection } from './hooks/useProductVariantSelection'
import { useProductBadges } from './hooks/useProductBadges'
import { useProductCardState } from './hooks/useProductCardState'
// Utils
import { resolveProductImage } from './utils/image-resolver'

// Componentes
import { ColorPillSelector } from './components/ColorPillSelector'
import { MeasurePillSelector } from './components/MeasurePillSelector'
import { FinishPillSelector } from './components/FinishPillSelector'
import { ProductCardImage } from './components/ProductCardImage'
import { ProductCardContent } from './components/ProductCardContent'
import { ProductCardActions } from './components/ProductCardActions'

// Tipos
import { 
  type CommercialProductCardProps, 
  type ProductVariant, 
  type BadgeConfig,
  DEFAULT_BADGE_CONFIG 
} from './types'

// Modal con lazy loading - Importar desde el index directamente
// NOTA: Usar import directo para evitar problemas con HMR de Turbopack
const ShopDetailModal = React.lazy(async () => {
  const startTime = Date.now()
  try {
    console.log('🔄 [ProductCard] Iniciando carga del módulo ShopDetailModal...', {
      timestamp: new Date().toISOString()
    })
    
    // Import directo para evitar problemas con caché de Turbopack
    // Usar ruta absoluta para asegurar resolución correcta
    const mod = await import('@/components/ShopDetails/ShopDetailModal/index')
    
    const loadTime = Date.now() - startTime
    console.log(`📦 [ProductCard] Módulo cargado en ${loadTime}ms:`, {
      hasShopDetailModal: !!mod.ShopDetailModal,
      hasDefault: !!mod.default,
      keys: Object.keys(mod),
      modType: typeof mod,
      modConstructor: mod?.constructor?.name
    })
    
    // El módulo exporta tanto ShopDetailModal como default
    const Component = mod.ShopDetailModal || mod.default
    
    if (!Component) {
      const error = new Error('ShopDetailModal no encontrado en el módulo')
      console.error('❌ [ProductCard] ShopDetailModal no encontrado:', {
        mod,
        keys: Object.keys(mod),
        hasShopDetailModal: !!mod.ShopDetailModal,
        hasDefault: !!mod.default
      })
      throw error
    }
    
    console.log('✅ [ProductCard] Componente encontrado:', {
      componentType: typeof Component,
      componentName: Component?.name || Component?.displayName || 'Sin nombre',
      isFunction: typeof Component === 'function',
      isReactComponent: Component?.prototype?.isReactComponent !== undefined
    })
    
    return { default: Component }
  } catch (error) {
    const loadTime = Date.now() - startTime
    console.error(`❌ [ProductCard] Error cargando ShopDetailModal (después de ${loadTime}ms):`, {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      error: error,
      errorString: String(error),
      cause: (error as any)?.cause
    })
    // Re-lanzar el error para que el ErrorBoundary lo capture
    throw error
  }
})

/**
 * CommercialProductCard - Componente modularizado
 * 
 * Usa hooks personalizados para separar lógica de negocio
 * y componentes memoizados para optimizar rendimiento.
 * 
 * ⚡ OPTIMIZACIÓN: Memoizado para evitar re-renders innecesarios
 */
const CommercialProductCardBase = React.forwardRef<HTMLDivElement, CommercialProductCardProps>(
  (
    {
      className,
      image,
      title,
      slug,
      brand,
      price,
      originalPrice,
      discount,
      isNew = false,
      stock = 0,
      productId,
      onAddToCart,
      showCartAnimation = true,
      freeShipping = false,
      shippingText,
      deliveryLocation,
      installments,
      variants,
      description,
      badgeConfig = DEFAULT_BADGE_CONFIG,
      features,
      specifications,
      dimensions,
      weight,
      children,
      medida,
      color,
      ...props
    },
    ref
  ) => {
    // Estado global
    const { addProduct } = useCartUnified()
    const cartItems = useAppSelector(selectCartItems)
    const { trackCartAction } = useAnalytics()
    const config = useDesignSystemConfig()
    
    // ⚡ OPTIMIZACIÓN: Detectar nivel de rendimiento del dispositivo
    const performanceLevel = useDevicePerformance()
    const isLowPerformance = performanceLevel === 'low'
    const isMediumPerformance = performanceLevel === 'medium'
    
    // ⚡ OPTIMIZACIÓN: Detectar scroll activo para deshabilitar animaciones
    const isScrolling = useScrollActive(150)

    // Hooks personalizados unificados
    const variantSelection = useProductVariantSelection({
      variants,
      title,
      color,
      medida,
      productId,
      price,
      originalPrice
    })
    const badges = useProductBadges({
      title,
      slug,
      variants,
      description,
      features,
      specifications,
      dimensions,
      weight,
      brand,
      badgeConfig,
      price,
      medida
    })
    // Resolver imagen dinámicamente basada en la variante seleccionada
    // Esto permite que la imagen cambie cuando el usuario selecciona diferentes variantes
    const resolvedImage = React.useMemo(() => {
      // Preparar fuente de imagen con todas las posibles fuentes
      const imageSource = {
        image_url: null, // No disponible en props del componente
        default_variant: variants?.[0] || null,
        variants: variants || [],
        images: Array.isArray(image) ? image : image ? [image] : null,
        imgs: null
      }
      
      // Resolver imagen usando image-resolver con prioridad en variante activa
      return resolveProductImage(imageSource, {
        selectedVariant: variantSelection.currentVariant || null,
        selectedColor: variantSelection.selectedColor || null,
        selectedMeasure: variantSelection.selectedMeasure || null,
        selectedFinish: variantSelection.selectedFinish || null,
        logContext: `ProductCard-${productId || title || 'unknown'}`
      })
    }, [
      variants,
      image,
      variantSelection.currentVariant,
      variantSelection.selectedColor,
      variantSelection.selectedMeasure,
      variantSelection.selectedFinish,
      productId,
      title
    ])
    
    const state = useProductCardState({ image, title, resolvedImage })

    // Estado para saber si el módulo del modal ya está precargado
    const [isModalPreloaded, setIsModalPreloaded] = React.useState(false)
    const [preloadError, setPreloadError] = React.useState<Error | null>(null)

    // Precargar el modal cuando el componente se monta para evitar retrasos
    // Esto asegura que el módulo esté disponible incluso sin cache
    React.useEffect(() => {
      // Precargar el módulo del modal en background
      const preloadModal = async () => {
        try {
          console.log('📦 [ProductCard] Precargando módulo del modal...')
          const module = await import('@/components/ShopDetails/ShopDetailModal')
          console.log('✅ [ProductCard] Módulo del modal precargado exitosamente:', {
            hasShopDetailModal: !!module.ShopDetailModal,
            hasDefault: !!module.default,
            keys: Object.keys(module)
          })
          setIsModalPreloaded(true)
          setPreloadError(null)
        } catch (error) {
          console.error('❌ [ProductCard] Error precargando módulo del modal:', error)
          setPreloadError(error as Error)
          // NO marcar como precargado si hay error - forzar renderizado para ver el error
          setIsModalPreloaded(true) // Permitir renderizar para ver el error en Suspense
        }
      }
      preloadModal()
    }, [])

    // Debug: Rastrear cambios en isModalPreloaded y showShopDetailModal
    React.useEffect(() => {
      const shouldRender = isModalPreloaded || state.showShopDetailModal
      console.log('📊 [ProductCard] Estado del modal:', {
        isModalPreloaded,
        showShopDetailModal: state.showShopDetailModal,
        shouldRender,
        productTitle: title
      })
    }, [isModalPreloaded, state.showShopDetailModal, title])

    // Cantidad actual en el carrito
    const currentCartQuantity = React.useMemo(() => {
      if (!productId) return 0
      const item = cartItems.find(item => String(item.id) === String(productId))
      return item?.quantity || 0
    }, [cartItems, productId])

    // Calcular stock efectivo basado en la variante seleccionada
    const effectiveStock = React.useMemo(() => {
      if (variantSelection.currentVariant?.stock !== undefined && variantSelection.currentVariant?.stock !== null) {
        return variantSelection.currentVariant.stock
      }
      return stock
    }, [variantSelection.currentVariant, stock])

    // Calcular si mostrar envío gratis - Usar precio final (con descuento si aplica)
    // ✅ FIX: Siempre usar el precio final (de variante si existe, sino precio base) para determinar envío gratis
    // El precio de la variante seleccionada se calcula en variantSelection.displayPrice
    // Si hay variante seleccionada, usar su precio; sino usar el precio base
    const currentPrice = React.useMemo(() => {
      if (variantSelection.currentVariant) {
        // Si hay variante, usar price_sale (precio con descuento) o price_list (precio original)
        return variantSelection.currentVariant.price_sale || variantSelection.currentVariant.price_list || price || 0
      }
      // Si no hay variante, usar el precio base (ya viene con descuento si aplica)
      return price || 0
    }, [variantSelection.currentVariant, price])
    
    const autoFreeShipping = currentPrice >= config.ecommerce.shippingInfo.freeShippingThreshold
    const shouldShowFreeShipping = Boolean(freeShipping || autoFreeShipping)

    // Handler para agregar al carrito
    const handleAddToCart = React.useCallback(
      async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        // ✅ Usar effectiveStock (stock de la variante seleccionada o del producto)
        if (state.isAddingToCart || effectiveStock === 0) return

        const quantityToAdd = 1
        const totalQuantityAfterAdd = currentCartQuantity + quantityToAdd

        if (effectiveStock !== undefined && effectiveStock > 0 && totalQuantityAfterAdd > effectiveStock) {
          toast.error(`Stock insuficiente. Solo hay ${effectiveStock} unidades disponibles.`)
          return
        }

        if (showCartAnimation) {
          state.setIsAddingToCart(true)
          setTimeout(() => state.setIsAddingToCart(false), 1000)
        }

        try {
          const selectedColorData = variantSelection.uniqueColors.find(c => c.hex === variantSelection.selectedColor)
          
          const productData = {
            id: typeof productId === 'string' ? parseInt(productId, 10) : (productId || 0),
            name: title || 'Producto',
            price: variantSelection.displayPrice || price || 0,
            discounted_price: variantSelection.currentVariant?.price_sale || undefined,
            images: image ? [image] : [],
            variants: variants || [],
            quantity: 1,
          }

          const attributes = {
            color: selectedColorData?.name || variantSelection.selectedColor || '',
            medida: variantSelection.selectedMeasure || '',
            finish: variantSelection.selectedFinish || variantSelection.currentVariant?.finish || '',
          }

          addProduct(productData, { quantity: 1, attributes })
          
          // Analytics
          try {
            const category = brand || 'Producto'
            const productPrice = productData.discounted_price || productData.price

            trackGA4AddToCart(String(productData.id), productData.name, category, productPrice, 1, 'ARS')
            
            const contentIdForMeta = variantSelection.currentVariant?.id
              ? String(variantSelection.currentVariant.id)
              : String(productData.id)
            trackMetaAddToCart(productData.name, contentIdForMeta, category, productPrice, 'ARS')
            trackCartAction('add', String(productData.id), {
              productName: productData.name,
              category,
              price: productPrice,
              quantity: 1,
              currency: 'ARS',
            })
          } catch (analyticsError) {
            console.warn('[Analytics] Error tracking add to cart:', analyticsError)
          }
          
          state.setCartAddCount(prev => prev + 1)
        } catch (error) {
          console.error('Error al agregar al carrito:', error)
        }
      },
      [state.isAddingToCart, effectiveStock, currentCartQuantity, showCartAnimation, variantSelection, productId, title, image, variants, price, brand, addProduct, trackCartAction]
    )

    // Handler para clic en el card
    const handleCardClick = React.useCallback(
      (e: React.MouseEvent) => {
        console.log('🟢 [ProductCard] handleCardClick llamado', {
          target: e.target,
          currentTarget: e.currentTarget,
          ignoreClicksUntil: state.ignoreClicksUntilRef.current,
          now: Date.now()
        })
        
        if (Date.now() < state.ignoreClicksUntilRef.current) {
          console.log('⏸️ [ProductCard] Click ignorado (dentro del período de guardia)')
          e.preventDefault()
          e.stopPropagation()
          return
        }
        if ((e.target as HTMLElement).closest('[data-testid="add-to-cart"]')) {
          console.log('⏸️ [ProductCard] Click ignorado (botón add-to-cart)')
          return
        }
        e.preventDefault()
        e.stopPropagation()
        console.log('🚀 [ProductCard] Llamando state.handleOpenModal()')
        state.handleOpenModal()
        console.log('✅ [ProductCard] state.handleOpenModal() llamado, showShopDetailModal:', state.showShopDetailModal)
      },
      [state]
    )

    // ⚡ OPTIMIZACIÓN: Memoizar handlers de mouse para evitar re-renders
    const handleMouseEnter = React.useCallback(() => {
      if (!isScrolling) {
        state.setIsHovered(true)
        state.setShowQuickActions(true)
      }
    }, [isScrolling, state])

    const handleMouseLeave = React.useCallback(() => {
      state.setIsHovered(false)
      state.setShowQuickActions(false)
    }, [state])

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col w-full cursor-pointer',
          'min-h-[280px] sm:min-h-[320px] md:h-[400px] lg:h-[440px]',
          'glass-card-3d glass-accelerated',
          'overflow-hidden',
          'rounded-xl md:rounded-[1.5rem]',
          className
        )}
        data-testid='commercial-product-card'
        data-product-id={String(productId || '')}
        data-finish={badges.resolvedFinish || ''}
        data-finish-source={badges.resolvedFinishSource}
        style={{
          // ⚡ OPTIMIZACIÓN: Eliminados todos los efectos costosos
          // El CSS global ya los deshabilita
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          transform: 'none',
          transition: 'none',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        {...props}
      >
        {/* Pseudo-elemento para box-shadow con opacity animada (compositable) */}
        {/* ⚡ OPTIMIZACIÓN: Ocultar durante scroll y en dispositivos de bajo rendimiento */}
        {!isLowPerformance && !isScrolling && (
          <span
            className="absolute inset-0 rounded-xl md:rounded-[1.5rem] pointer-events-none transition-opacity duration-300 ease-out"
            style={{
              boxShadow: '0 12px 48px rgba(0, 0, 0, 0.2), 0 6px 16px rgba(0, 0, 0, 0.12)',
              opacity: state.isHovered ? 1 : 0,
              zIndex: -1,
            }}
          />
        )}
        {/* Icono de envío gratis */}
        {shouldShowFreeShipping && (
          <div className='absolute left-2 md:left-3 top-2 md:top-2.5 z-30 pointer-events-none select-none flex items-center'>
            <Image
              src='/images/icons/icon-envio.svg'
              alt='Envío gratis'
              width={36}
              height={36}
              className='h-6 sm:h-7 md:h-8 w-auto object-contain drop-shadow'
              priority
              unoptimized
            />
          </div>
        )}

        {/* Badge "Nuevo" */}
        {isNew && (
          <span
            className='absolute top-10 md:top-14 right-2 md:right-3 text-[10px] sm:text-xs font-bold px-1 py-0.5 md:px-2 md:py-1 rounded z-40 shadow'
            style={{ backgroundColor: '#FFD600', color: '#EA5A17' }}
          >
            Nuevo
          </span>
        )}

        {/* Imagen del producto - Mejor posicionada y más grande con fondo blanco */}
        <div 
          className='relative flex-[1.8] w-full min-h-[150px] sm:min-h-[180px] md:min-h-[55%] flex items-center justify-center overflow-hidden rounded-t-xl md:rounded-t-[1.5rem]'
          style={{
            backgroundColor: '#ffffff',
          }}
        >
          <ProductCardImage
            image={image}
            title={title}
            productId={productId}
            onImageError={state.handleImageError}
            imageError={state.imageError}
            currentImageSrc={state.currentImageSrc}
          />
        </div>

        {/* Botón de carrito - Posición FIJA respecto al card completo */}
        <ProductCardActions
          onAddToCart={handleAddToCart}
          isAddingToCart={state.isAddingToCart}
          stock={effectiveStock}
          cartAddCount={state.cartAddCount}
        />

        {/* Contenedor de información - Con fondo degradado invertido para sombra detrás de pills */}
        <div className='relative z-10 w-full mt-auto overflow-hidden rounded-b-xl md:rounded-b-[1.5rem]'>
          {/* Fondo degradado invertido: más oscuro abajo para sombra detrás de pills */}
          <div 
            className='absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-b-xl md:rounded-b-[1.5rem]'
            style={{
              background: 'rgba(255, 255, 255, 0.98)',
              // ⚡ OPTIMIZACIÓN: Eliminado backdrop-filter completamente
              // El CSS global ya lo deshabilita
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              paddingBottom: '0.625rem',
              bottom: 0,
            }}
          />
          
          {/* Contenido: marca, título, precios */}
          <div className='relative z-10 px-3 sm:px-4 md:px-5 pt-0 pb-0.5'>
            <ProductCardContent
              brand={brand}
              title={title}
              displayPrice={variantSelection.displayPrice}
              displayOriginalPrice={variantSelection.displayOriginalPrice}
              discount={discount}
              variants={variants}
              selectedColorName={variantSelection.uniqueColors.find(c => c.hex === variantSelection.selectedColor)?.name}
            />
          </div>

          {/* Selectores de color y medida - Full width sin padding horizontal */}
          {(() => {
            const hasColors = variantSelection.uniqueColors.length > 0
            const hasMeasures = variantSelection.uniqueMeasures.length > 0
            const shouldRender = hasColors || hasMeasures
            
            if (!shouldRender) return null
            
            return (
              <div className='relative z-10 w-full pb-2 md:pb-1.5 overflow-hidden'>
                <div className='flex flex-col gap-0 overflow-hidden' style={{ marginBottom: '0' }}>
                  {/* Selector de colores */}
                  {hasColors && (
                    <ColorPillSelector
                      colors={variantSelection.uniqueColors}
                      selectedColor={variantSelection.selectedColor}
                      onColorSelect={variantSelection.setSelectedColor}
                      isImpregnante={variantSelection.isImpregnante}
                      selectedFinish={variantSelection.selectedFinish || undefined}
                    />
                  )}

                  {/* Selector de medidas */}
                  {hasMeasures && (
                    <MeasurePillSelector
                      measures={variantSelection.uniqueMeasures}
                      selectedMeasure={variantSelection.selectedMeasure}
                      onMeasureSelect={variantSelection.setSelectedMeasure}
                      commonUnit={variantSelection.commonUnit}
                      colors={variantSelection.uniqueColors}
                      selectedColor={variantSelection.selectedColor}
                      onColorSelect={variantSelection.setSelectedColor}
                      onAddToCart={handleAddToCart}
                      isAddingToCart={state.isAddingToCart}
                      stock={effectiveStock}
                      isImpregnante={variantSelection.isImpregnante}
                    />
                  )}

                  {/* Selector de finishes (terminaciones) */}
                  {variantSelection.uniqueFinishes.length > 0 && (
                    <FinishPillSelector
                      finishes={variantSelection.uniqueFinishes}
                      availableFinishes={variantSelection.availableFinishesForColor}
                      selectedFinish={variantSelection.selectedFinish}
                      onFinishSelect={variantSelection.setSelectedFinish}
                    />
                  )}
                </div>
              </div>
            )
          })()}
        </div>

        {children}

        {/* Modal con Suspense - Renderizar cuando debe estar abierto
            El Dialog controla su visibilidad con la prop open */}
        {state.showShopDetailModal && (
          <ErrorBoundary
            fallback={
              <div style={{ display: 'none' }}>
                {/* ErrorBoundary fallback - no renderizar nada visible */}
              </div>
            }
            onError={(error, errorInfo) => {
              // Log detallado del error
              console.group('❌ [ProductCard] Error en ShopDetailModal')
              console.error('Error Message:', error?.message)
              console.error('Error Stack:', error?.stack)
              console.error('Component Stack:', errorInfo?.componentStack)
              console.error('Full Error Object:', error)
              console.error('Full ErrorInfo:', errorInfo)
              console.groupEnd()
            }}
            showDetails={true}
          >
            <React.Suspense fallback={
              <div style={{ display: 'none' }}>
                {console.log('⏳ [ProductCard] Suspense fallback activo - cargando ShopDetailModal...')}
              </div>
            }>
              {(() => {
                console.log('🔍 [ProductCard] Intentando renderizar ShopDetailModal, open:', state.showShopDetailModal)
                return (
                  <ShopDetailModal
              open={state.showShopDetailModal}
              onOpenChange={state.handleModalOpenChange}
            product={(() => {
              try {
                const modalProduct = {
                  id: typeof productId === 'string' ? parseInt(productId, 10) : (productId || 0),
                  name: title || '',
                  slug: slug || '',
                  price: variantSelection.displayPrice || price || 0,
                  originalPrice: variantSelection.displayOriginalPrice || originalPrice,
                  image: image || '',
                  brand: brand || '',
                  stock: effectiveStock || 0,
                  description: description || '',
              colors: variantSelection.uniqueColors.length > 0 ? variantSelection.uniqueColors.map(c => ({
                id: c.name.toLowerCase().replace(/\s+/g, '-'),
                name: c.name.toLowerCase(),
                displayName: c.name,
                hex: c.hex,
                category: '',
                family: '',
                isPopular: false,
                description: `Color ${c.name}`
              })) : undefined,
                  capacities: variantSelection.uniqueMeasures.length > 0 ? variantSelection.uniqueMeasures : [],
                  ...(variants && variants.length > 0 ? { variants } : {}),
                } as any
                
                console.log('🎯 [ProductCard] Renderizando ShopDetailModal con:', {
                  open: state.showShopDetailModal,
                  productId: modalProduct.id,
                  productName: modalProduct.name,
                  hasValidId: modalProduct.id > 0,
                  hasBrand: !!modalProduct.brand,
                  hasImage: !!modalProduct.image
                })
                
                return modalProduct
              } catch (error) {
                console.error('❌ [ProductCard] Error construyendo objeto product:', error)
                // Retornar objeto mínimo válido
                return {
                  id: typeof productId === 'string' ? parseInt(productId, 10) : (productId || 0),
                  name: title || '',
                  slug: slug || '',
                  price: price || 0,
                  image: image || '',
                  brand: brand || '',
                  stock: effectiveStock || 0,
                  description: description || '',
                }
              }
            })()}
            onAddToCart={(productData, modalVariants) => {
                const images: string[] = Array.isArray((productData as any).images)
                  ? (productData as any).images
                  : (productData as any).image
                  ? [(productData as any).image]
                  : []

                const rawOriginal = (productData as any).price ?? originalPrice
                const originalParsed = typeof rawOriginal === 'string' ? parseFloat(rawOriginal) : Number(rawOriginal)

                const rawDiscounted = (productData as any).discounted_price ?? (productData as any).price_sale
                const discountedParsed = rawDiscounted !== undefined
                  ? typeof rawDiscounted === 'string' ? parseFloat(rawDiscounted) : Number(rawDiscounted)
                  : undefined

                let parsedId = typeof (productData as any).id === 'string'
                  ? parseInt((productData as any).id, 10)
                  : Number((productData as any).id)
                if (isNaN(parsedId)) {
                  parsedId = typeof productId === 'string' ? parseInt(productId, 10) : Number(productId)
                }

                if (isNaN(parsedId) || parsedId <= 0) {
                  console.error('❌ ID de producto inválido')
                  return
                }

                const cover = images[0] || '/images/products/placeholder.svg'
                const quantityFromModal = Number((modalVariants as any)?.quantity) || 1

                const attributes = {
                  color: (modalVariants as any)?.selectedColor || (modalVariants as any)?.color || '',
                  medida: (modalVariants as any)?.selectedCapacity || (modalVariants as any)?.capacity || '',
                  finish: (modalVariants as any)?.finish || '',
                }

                addProduct(
                  {
                    ...productData,
                    id: parsedId,
                    name: (productData as any).name || title || 'Producto',
                    price: Number.isFinite(originalParsed) ? originalParsed : 0,
                    discounted_price: discountedParsed !== undefined && Number.isFinite(discountedParsed)
                      ? discountedParsed : undefined,
                    images: images.length ? images : [cover],
                    variants: modalVariants,
                    quantity: quantityFromModal,
                  },
                  { quantity: quantityFromModal, attributes }
                )
            }}
            />
                )
              })()}
          </React.Suspense>
          </ErrorBoundary>
        )}
      </div>
    )
  }
)

CommercialProductCardBase.displayName = 'CommercialProductCardBase'

// ⚡ OPTIMIZACIÓN: Memoizar el componente para evitar re-renders innecesarios
// Solo re-renderiza si las props relevantes cambian
const CommercialProductCard = React.memo(CommercialProductCardBase, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  // ✅ CORREGIDO: Incluir variants en la comparación para que se re-renderice cuando se cargan
  const prevVariantsLength = prevProps.variants?.length || 0
  const nextVariantsLength = nextProps.variants?.length || 0
  
  // ✅ DEBUG: Log para verificar la comparación del memo
  const shouldSkipRender = (
    prevProps.productId === nextProps.productId &&
    prevProps.price === nextProps.price &&
    prevProps.originalPrice === nextProps.originalPrice &&
    prevProps.discount === nextProps.discount &&
    prevProps.stock === nextProps.stock &&
    prevProps.image === nextProps.image &&
    prevProps.title === nextProps.title &&
    prevProps.slug === nextProps.slug &&
    prevProps.isNew === nextProps.isNew &&
    prevProps.freeShipping === nextProps.freeShipping &&
    prevVariantsLength === nextVariantsLength
  )
  
  return shouldSkipRender
})

CommercialProductCard.displayName = 'CommercialProductCard'

export { CommercialProductCard }
export type { CommercialProductCardProps, ProductVariant, BadgeConfig }

