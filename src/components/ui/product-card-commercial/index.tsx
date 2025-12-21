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
 */
const CommercialProductCard = React.forwardRef<HTMLDivElement, CommercialProductCardProps>(
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

    // Precargar el modal cuando el componente se monta para evitar retrasos
    React.useEffect(() => {
      // Precargar el módulo del modal en background
      import('@/components/ShopDetails/ShopDetailModal').catch(() => {})
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

    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-xl bg-white shadow-md flex flex-col w-full cursor-pointer',
          'h-[300px] sm:h-[360px] md:h-[450px] lg:h-[500px]',
          'md:rounded-2xl transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-xl',
          'transform-gpu will-change-transform overflow-visible',
          className
        )}
        data-testid='commercial-product-card'
        data-product-id={String(productId || '')}
        data-finish={badges.resolvedFinish || ''}
        data-finish-source={badges.resolvedFinishSource}
        style={{
          transformOrigin: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: state.isHovered ? 'scale(1.02)' : 'scale(1)',
          boxShadow: state.isHovered ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={() => {
          state.setIsHovered(true)
          state.setShowQuickActions(true)
        }}
        onMouseLeave={() => {
          state.setIsHovered(false)
          state.setShowQuickActions(false)
        }}
        onClick={handleCardClick}
        {...props}
      >
        {/* Icono de envío gratis */}
        {shouldShowFreeShipping && (
          <div className='absolute right-2 md:right-3 top-2 md:top-2.5 z-30 pointer-events-none select-none flex items-center'>
            <Image
              src='/images/icons/icon-envio.svg'
              alt='Envío gratis'
              width={36}
              height={36}
              className='h-7 sm:h-8 md:h-9 w-auto object-contain drop-shadow'
              priority
              unoptimized
            />
          </div>
        )}

        {/* Badge "Nuevo" */}
        {isNew && (
          <span
            className='absolute top-12 md:top-14 right-2 md:right-3 text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded z-40 shadow'
            style={{ backgroundColor: '#FFD600', color: '#EA5A17' }}
          >
            Nuevo
          </span>
        )}

        {/* Imagen del producto */}
        <ProductCardImage
          image={image}
          title={title}
          productId={productId}
          onImageError={state.handleImageError}
          imageError={state.imageError}
          currentImageSrc={state.currentImageSrc}
        />

        {/* Contenedor de información con blur blanco */}
        <div className='relative -mt-2 md:-mt-3 rounded-b-xl md:rounded-b-2xl overflow-visible ml-2 md:ml-3'>
          {/* Blur blanco detrás de toda la información */}
          <div 
            className='absolute inset-0 z-0 pointer-events-none rounded-b-xl md:rounded-b-2xl'
            style={{
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 30%, rgba(255, 255, 255, 0.7) 60%, transparent 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)'
            }}
          />
          
          {/* Contenido: marca, título, precios */}
          <div className='relative z-10'>
            <ProductCardContent
              brand={brand}
              title={title}
              displayPrice={variantsData.displayPrice}
              displayOriginalPrice={variantsData.displayOriginalPrice}
              discount={discount}
            />
          </div>

          {/* Selectores de color y medida */}
          <div className='relative z-10 w-full mt-0.5 px-1.5 md:px-2 pb-1.5 overflow-visible'>
            <div className='flex flex-col gap-0 overflow-visible'>
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

              {/* Selector de finishes (terminaciones) - mostrar siempre que haya finishes */}
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

        {/* Modal con Suspense - Renderizar condicionalmente pero precargado */}
        {state.showShopDetailModal && (
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
      </div>
    )
  }
)

CommercialProductCard.displayName = 'CommercialProductCard'

// Re-exportar tipos para compatibilidad
export { CommercialProductCard }
export type { CommercialProductCardProps, ProductVariant, BadgeConfig }

