'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/core/utils'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'
import { useCartUnified } from '@/hooks/useCartUnified'
import { trackAddToCart as trackGA4AddToCart } from '@/lib/google-analytics'
import { trackAddToCart as trackMetaAddToCart } from '@/lib/meta-pixel'
import { useAnalytics } from '@/components/Analytics/SimpleAnalyticsProvider'
import { useAppSelector } from '@/redux/store'
import { selectCartItems } from '@/redux/features/cart-slice'
import { toast } from 'react-hot-toast'
import { useDevicePerformance } from '@/hooks/useDevicePerformance'
import { useScrollActive } from '@/hooks/useScrollActive'

// Hooks personalizados
import { useProductColors } from './hooks/useProductColors'
import { useProductMeasures } from './hooks/useProductMeasures'
import { useProductFinishes } from './hooks/useProductFinishes'
import { useProductVariants } from './hooks/useProductVariants'
import { useProductBadges } from './hooks/useProductBadges'
import { useProductCardState } from './hooks/useProductCardState'

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

// Modal con lazy loading
const ShopDetailModal = React.lazy(() => 
  import('@/components/ShopDetails/ShopDetailModal').then(mod => ({ default: mod.ShopDetailModal }))
)

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

    // Hooks personalizados
    const colors = useProductColors({ variants, title, color })
    const measures = useProductMeasures({ variants, title, medida }) // ✅ NUEVO: Pasar medida como fallback
    const finishes = useProductFinishes({ 
      variants, 
      selectedColor: colors.selectedColor,
      productId,
      productName: title
    })
    const variantsData = useProductVariants({
      variants,
      selectedColor: colors.selectedColor,
      selectedMeasure: measures.selectedMeasure,
      selectedFinish: finishes.selectedFinish,
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
    const state = useProductCardState({ image, title })

    // Estado para saber si el módulo del modal ya está precargado
    const [isModalPreloaded, setIsModalPreloaded] = React.useState(false)

    // Precargar el modal cuando el componente se monta para evitar retrasos
    // Esto asegura que el módulo esté disponible incluso sin cache
    React.useEffect(() => {
      // Precargar el módulo del modal en background
      const preloadModal = async () => {
        try {
          await import('@/components/ShopDetails/ShopDetailModal')
          setIsModalPreloaded(true)
        } catch (error) {
          // Si falla, aún así marcar como precargado para intentar renderizar
          setIsModalPreloaded(true)
        }
      }
      preloadModal()
    }, [])

    // Cantidad actual en el carrito
    const currentCartQuantity = React.useMemo(() => {
      if (!productId) return 0
      const item = cartItems.find(item => String(item.id) === String(productId))
      return item?.quantity || 0
    }, [cartItems, productId])

    // Calcular si mostrar envío gratis
    const autoFreeShipping = price ? dsShouldShowFreeShipping(price, config) : false
    const shouldShowFreeShipping = Boolean(freeShipping || autoFreeShipping)

    // Handler para agregar al carrito
    const handleAddToCart = React.useCallback(
      async (e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        if (state.isAddingToCart || stock === 0) return

        const quantityToAdd = 1
        const totalQuantityAfterAdd = currentCartQuantity + quantityToAdd

        if (stock !== undefined && stock > 0 && totalQuantityAfterAdd > stock) {
          toast.error(`Stock insuficiente. Solo hay ${stock} unidades disponibles.`)
          return
        }

        if (showCartAnimation) {
          state.setIsAddingToCart(true)
          setTimeout(() => state.setIsAddingToCart(false), 1000)
        }

        try {
          const selectedColorData = colors.uniqueColors.find(c => c.hex === colors.selectedColor)
          
          const productData = {
            id: typeof productId === 'string' ? parseInt(productId, 10) : (productId || 0),
            name: title || 'Producto',
            price: variantsData.displayPrice || price || 0,
            discounted_price: variantsData.currentVariant?.price_sale || undefined,
            images: image ? [image] : [],
            variants: variants || [],
            quantity: 1,
          }

          const attributes = {
            color: selectedColorData?.name || colors.selectedColor || '',
            medida: measures.selectedMeasure || '',
            finish: finishes.selectedFinish || variantsData.currentVariant?.finish || '',
          }

          addProduct(productData, { quantity: 1, attributes })
          
          // Analytics
          try {
            const category = brand || 'Producto'
            const productPrice = productData.discounted_price || productData.price

            trackGA4AddToCart(String(productData.id), productData.name, category, productPrice, 1, 'ARS')
            
            const contentIdForMeta = variantsData.currentVariant?.id
              ? String(variantsData.currentVariant.id)
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
      [state.isAddingToCart, stock, currentCartQuantity, showCartAnimation, colors, measures, finishes, variantsData, productId, title, image, variants, price, brand, addProduct, trackCartAction]
    )

    // Handler para clic en el card
    const handleCardClick = React.useCallback(
      (e: React.MouseEvent) => {
        if (Date.now() < state.ignoreClicksUntilRef.current) {
          e.preventDefault()
          e.stopPropagation()
          return
        }
        if ((e.target as HTMLElement).closest('[data-testid="add-to-cart"]')) {
          return
        }
        e.preventDefault()
        e.stopPropagation()
        state.handleOpenModal()
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
          'min-h-[280px] sm:min-h-[320px] md:h-[450px] lg:h-[500px]',
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
          <div className='absolute right-2 md:right-3 top-2 md:top-2.5 z-30 pointer-events-none select-none flex items-center'>
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
          <div className='relative z-10 px-3 sm:px-4 md:px-5 pt-1 pb-0.5'>
            <ProductCardContent
              brand={brand}
              title={title}
              displayPrice={variantsData.displayPrice}
              displayOriginalPrice={variantsData.displayOriginalPrice}
              discount={discount}
              variants={variants}
              selectedColorName={colors.uniqueColors.find(c => c.hex === colors.selectedColor)?.name}
            />
          </div>

          {/* Selectores de color y medida - Full width sin padding horizontal, con espacio extra abajo para que no se corten */}
          <div className='relative z-10 w-full pb-3 md:pb-2 overflow-hidden'>
            <div className='flex flex-col gap-0 overflow-hidden' style={{ marginBottom: '0' }}>
              {/* Selector de colores */}
              <ColorPillSelector
                colors={colors.uniqueColors}
                selectedColor={colors.selectedColor}
                onColorSelect={colors.setSelectedColor}
                isImpregnante={badges.isImpregnante}
              />

              {/* Selector de medidas */}
              <MeasurePillSelector
                measures={measures.uniqueMeasures}
                selectedMeasure={measures.selectedMeasure}
                onMeasureSelect={measures.setSelectedMeasure}
                commonUnit={measures.commonUnit}
                colors={colors.uniqueColors}
                selectedColor={colors.selectedColor}
                onColorSelect={colors.setSelectedColor}
                onAddToCart={handleAddToCart}
                isAddingToCart={state.isAddingToCart}
                stock={stock}
                isImpregnante={badges.isImpregnante}
              />

              {/* Selector de finishes (terminaciones) */}
              {finishes.uniqueFinishes.length > 0 && (
                <FinishPillSelector
                  finishes={finishes.uniqueFinishes}
                  availableFinishes={finishes.availableFinishesForColor}
                  selectedFinish={finishes.selectedFinish}
                  onFinishSelect={finishes.setSelectedFinish}
                />
              )}
            </div>
          </div>
        </div>

        {children}

        {/* Botón de carrito */}
        <ProductCardActions
          onAddToCart={handleAddToCart}
          isAddingToCart={state.isAddingToCart}
          stock={stock}
          cartAddCount={state.cartAddCount}
        />

        {/* Modal con Suspense - Renderizar condicionalmente pero con módulo precargado
            Solo renderizar si el módulo está precargado o si el modal debe estar abierto */}
        {(isModalPreloaded || state.showShopDetailModal) && (
          <React.Suspense fallback={null}>
            <ShopDetailModal
              open={state.showShopDetailModal}
              onOpenChange={state.handleModalOpenChange}
            product={{
              id: typeof productId === 'string' ? parseInt(productId, 10) : (productId || 0),
              name: title || '',
              slug: slug || '',
              price: variantsData.displayPrice || price || 0,
              originalPrice: variantsData.displayOriginalPrice || originalPrice,
              image: image || '',
              brand: brand || '',
              stock: stock || 0,
              description: description || '',
              colors: colors.uniqueColors.length > 0 ? colors.uniqueColors.map(c => ({
                id: c.name.toLowerCase().replace(/\s+/g, '-'),
                name: c.name.toLowerCase(),
                displayName: c.name,
                hex: c.hex,
                category: '',
                family: '',
                isPopular: false,
                description: `Color ${c.name}`
              })) : undefined,
              capacities: measures.uniqueMeasures.length > 0 ? measures.uniqueMeasures : [],
              ...(variants && variants.length > 0 ? { variants } : {}),
            } as any}
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
          </React.Suspense>
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
  return (
    prevProps.productId === nextProps.productId &&
    prevProps.price === nextProps.price &&
    prevProps.originalPrice === nextProps.originalPrice &&
    prevProps.discount === nextProps.discount &&
    prevProps.stock === nextProps.stock &&
    prevProps.image === nextProps.image &&
    prevProps.title === nextProps.title &&
    prevProps.slug === nextProps.slug &&
    prevProps.isNew === nextProps.isNew &&
    prevProps.freeShipping === nextProps.freeShipping
  )
})

CommercialProductCard.displayName = 'CommercialProductCard'

export { CommercialProductCard }
export type { CommercialProductCardProps, ProductVariant, BadgeConfig }

