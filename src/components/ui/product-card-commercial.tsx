'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/core/utils'
import { Heart, Eye, Star, ShoppingCart, AlertCircle } from 'lucide-react'
import { ShopDetailModal } from '@/components/ShopDetails/ShopDetailModal'

// Verificar que Framer Motion esté disponible
const isFramerMotionAvailable = false // Deshabilitado para usar fallbacks CSS

// Componentes fallback para cuando Framer Motion no esté disponible
const MotionDiv = 'div'
const MotionButton = 'button'

export interface CommercialProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string
  title?: string
  brand?: string
  price?: number
  originalPrice?: number
  discount?: string
  isNew?: boolean
  cta?: string
  stock?: number
  productId?: number | string
  onAddToCart?: () => void
  showCartAnimation?: boolean
  // Información de cuotas
  installments?: {
    quantity: number
    amount: number
    interestFree?: boolean
  }
  // Información de envío
  freeShipping?: boolean
  shippingText?: string
  deliveryLocation?: string
}

const CommercialProductCard = React.forwardRef<HTMLDivElement, CommercialProductCardProps>(
  (
    {
      className,
      image,
      title,
      brand,
      price,
      originalPrice,
      discount,
      isNew = false,
      cta = 'Agregar al carrito',
      stock = 0,
      productId,
      onAddToCart,
      showCartAnimation = true,
      installments,
      freeShipping = false,
      shippingText,
      deliveryLocation,
      children,
      ...props
    },
    ref
  ) => {
    const [isAddingToCart, setIsAddingToCart] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [isWishlisted, setIsWishlisted] = React.useState(false)
    const [showQuickActions, setShowQuickActions] = React.useState(false)
    const [showShopDetailModal, setShowShopDetailModal] = React.useState(false)
    const [imageError, setImageError] = React.useState(false)
    const [currentImageSrc, setCurrentImageSrc] = React.useState(image || '/images/products/placeholder.svg')

    // Función para abrir el modal
    const handleOpenModal = React.useCallback(() => {
      setShowShopDetailModal(true)
    }, [])

    // Función para manejar errores de imagen con fallback automático
    const handleImageError = React.useCallback(() => {
      console.group(`🖼️ [CommercialProductCard] Error de imagen - Producto ID: ${productId}`)
      console.error(`❌ URL fallida: ${currentImageSrc}`)
      console.log(`📦 Título del producto: ${title}`)
      console.log(`🏷️ Marca: ${brand}`)
      console.log(`🔄 Estado anterior imageError: ${imageError}`)
      
      if (!imageError) {
        setImageError(true)
        setCurrentImageSrc('/images/products/placeholder.svg')
        console.log(`✅ Fallback aplicado: /images/products/placeholder.svg`)
      } else {
        console.warn(`⚠️ Ya se había aplicado fallback anteriormente`)
      }
      console.groupEnd()
    }, [currentImageSrc, imageError, productId, title, brand])

    // Logging detallado para debugging de imágenes
    React.useEffect(() => {
      console.group(`🖼️ [CommercialProductCard] Debugging imagen para producto: ${title}`);
      console.log('📦 Product data completo:', { productId, title, brand, price });
      console.log('🔗 image prop:', image);
      console.log('🎯 currentImageSrc actual:', currentImageSrc);
      console.log('❌ imageError estado:', imageError);
      console.groupEnd();
    }, [productId, title, brand, price, image, currentImageSrc, imageError]);

    // Actualizar imagen cuando cambie la prop
    React.useEffect(() => {
      if (image && image !== currentImageSrc) {
        console.log(`🔄 [CommercialProductCard] Actualizando imagen para ${title}:`, {
          from: currentImageSrc,
          to: image
        });
        setCurrentImageSrc(image);
        setImageError(false);
      }
    }, [image, currentImageSrc, title])

    // Función para manejar el clic en el card
    const handleCardClick = React.useCallback(
      (e: React.MouseEvent) => {
        // Evitar que se abra el modal si se hace clic en el botón de agregar al carrito
        if ((e.target as HTMLElement).closest('[data-testid="add-to-cart"]')) {
          return
        }
        // Evitar propagación de eventos que puedan interferir con el modal
        e.preventDefault()
        e.stopPropagation()
        handleOpenModal()
      },
      [handleOpenModal]
    )

    const handleAddToCart = React.useCallback(
      async (e?: React.MouseEvent) => {
        if (e) {
          e.stopPropagation() // Evitar que se propague al card
        }

        if (!onAddToCart || isAddingToCart || stock === 0) return

        if (showCartAnimation) {
          setIsAddingToCart(true)
          setTimeout(() => setIsAddingToCart(false), 1000)
        }

        try {
          await onAddToCart()
          // También abrir el modal después de agregar al carrito
          handleOpenModal()
        } catch (error) {
          console.error('Error al agregar al carrito:', error)
        }
      },
      [onAddToCart, isAddingToCart, stock, showCartAnimation, handleOpenModal]
    )

    // Calcular si mostrar envío gratis automáticamente
    const shouldShowFreeShipping = freeShipping || (price && price >= 15000)

    return (
      <div
        ref={ref}
        className={cn(
          // Mobile-first: diseño compacto para 2 columnas
          'relative rounded-xl bg-white shadow-md flex flex-col w-full cursor-pointer overflow-hidden',
          // Mobile: más compacto
          'h-[280px] sm:h-[320px]',
          // Tablet y desktop: tamaño completo
          'md:h-[400px] lg:h-[450px]',
          'md:rounded-2xl',
          'transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-xl',
          'transform-gpu will-change-transform',
          className
        )}
        data-testid='commercial-product-card'
        style={{
          transformOrigin: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isHovered ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={() => {
          setIsHovered(true)
          setShowQuickActions(true)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
          setShowQuickActions(false)
        }}
        onClick={handleCardClick}
        {...props}
      >
        {/* Contenedor de imagen completa con degradado - Responsive */}
        <div className='relative w-full flex justify-center items-center overflow-hidden rounded-t-xl mb-2 md:mb-3 flex-1'>
          {currentImageSrc && !imageError ? (
            <Image
              src={currentImageSrc}
              alt={title || 'Producto'}
              fill
              className='object-contain scale-110 z-0'
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              priority={false}
              onError={handleImageError}
              onLoad={() => {
                console.log(`✅ [CommercialProductCard] Imagen cargada exitosamente - Producto ID: ${productId}`)
                console.log(`📸 URL: ${currentImageSrc}`)
                // Reset error state si la imagen carga correctamente
                if (imageError && currentImageSrc !== '/images/products/placeholder.svg') {
                  console.log(`🔄 Reseteando estado de error para imagen corregida`)
                  setImageError(false)
                }
              }}
            />
          ) : (
            <div className='flex items-center justify-center w-full h-full z-0 bg-gray-50'>
              <div className='text-center p-4'>
                <AlertCircle className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                <p className='text-xs text-gray-500'>Imagen no disponible</p>
              </div>
            </div>
          )}

          {/* Degradado suave hacia blanco en la parte inferior - Responsive */}
          <div className='absolute bottom-0 left-0 right-0 h-12 md:h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none' />

          {/* Quick Actions eliminados - Ya no se muestran los botones de wishlist y quick view */}
        </div>

        {/* Badge "Nuevo" en esquina superior derecha - Responsive */}
        {isNew && (
          <span
            className='absolute top-2 right-2 md:top-3 md:right-3 text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded z-30 shadow'
            style={{ backgroundColor: '#FFD600', color: '#EA5A17' }}
          >
            Nuevo
          </span>
        )}

        {/* Badge de descuento compacto en esquina superior izquierda - Responsive */}
        {discount && (
          <div className='absolute top-2 left-2 md:top-3 md:left-3 z-30'>
            <div
              className='text-white text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-t'
              style={{ backgroundColor: '#EA5A17' }}
            >
              {discount}
            </div>
            <div
              className='bg-white text-xs font-semibold px-1.5 py-0.5 md:px-2 md:py-1 rounded-b shadow-sm text-left leading-none'
              style={{ color: '#EA5A17' }}
            >
              <div>Descuento</div>
              <div>especial</div>
            </div>
          </div>
        )}

        {/* Content con transición suave - Responsive */}
        <div className='relative z-20 text-left p-2 md:p-4 bg-white -mt-2 md:-mt-3 flex-shrink-0'>
          {/* Marca del producto - Responsive */}
          {brand && (
            <div className='text-xs md:text-sm uppercase text-gray-600 font-semibold tracking-wide drop-shadow-sm'>
              {brand}
            </div>
          )}

          {/* Título del producto - Con mejor contraste y responsive */}
          <h3 className='font-bold text-gray-900 text-sm md:text-lg drop-shadow-sm line-clamp-2 leading-tight mb-1 md:mb-2'>
            {title}
          </h3>

          {/* Precios - Optimizados para el gradiente y responsive */}
          <div className='flex flex-col items-start space-y-1'>
            {/* Precios en línea horizontal - Responsive */}
            <div className='flex items-center gap-1 md:gap-2'>
              {/* Precio actual - Grande y destacado, responsive */}
              <div
                className='text-lg md:text-2xl font-bold drop-shadow-sm'
                style={{ color: '#EA5A17' }}
              >
                ${price?.toLocaleString('es-AR') || '0'}
              </div>

              {/* Precio anterior tachado - Responsive */}
              {originalPrice && originalPrice > (price || 0) && (
                <div className='text-gray-500 line-through text-xs md:text-sm drop-shadow-sm'>
                  ${originalPrice.toLocaleString('es-AR')}
                </div>
              )}
            </div>

            {/* Cuotas en verde más oscuro - Responsive */}
            {installments && (
              <div className='text-green-800 text-xs md:text-sm font-medium drop-shadow-sm'>
                {installments.quantity}x de ${installments.amount.toLocaleString('es-AR')}
                {installments.interestFree ? ' sin interés' : ''}
              </div>
            )}
          </div>

          {/* Badge de envío gratis - Compacto y responsive */}
          {shouldShowFreeShipping && (
            <div className='flex justify-start mt-1 md:mt-2'>
              <img
                src='/images/icons/icon-envio.svg'
                alt='Envío gratis'
                className='h-6 md:h-10 w-auto object-contain drop-shadow-sm'
              />
            </div>
          )}

          {/* Botón "Agregar al carrito" - Animado y responsive */}
          <div className='w-full mt-2 md:mt-3'>
            {onAddToCart && (
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || stock === 0}
                data-testid='add-to-cart'
                data-testid-btn='add-to-cart-btn'
                className={cn(
                  'w-full py-2 md:py-3 rounded-lg md:rounded-xl text-center shadow-md font-semibold flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base relative overflow-hidden',
                  'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] transform-gpu will-change-transform',
                  stock === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-yellow-400 hover:bg-yellow-500 text-[#EA5A17]'
                )}
                style={{
                  backgroundColor: stock !== 0 ? '#facc15' : undefined,
                  transformOrigin: 'center',
                }}
              >
                {isAddingToCart ? (
                  <div className='flex items-center justify-center gap-2'>
                    <div className='w-4 h-4 border-2 border-[#EA5A17] border-t-transparent rounded-full animate-spin' />
                    <span>Agregando...</span>
                  </div>
                ) : stock === 0 ? (
                  <>
                    <AlertCircle className='w-4 h-4' />
                    <span>Sin stock</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className='w-4 h-4' />
                    <span>Agregar al carrito</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {children}

        {/* Shop Detail Modal */}
        {showShopDetailModal && (
          <ShopDetailModal
            open={showShopDetailModal}
            onOpenChange={setShowShopDetailModal}
            product={{
              id: String(productId || ''),
              name: title || '',
              price: price || 0,
              originalPrice,
              discount,
              brand: brand || '',
              category: '',
              description: '',
              images: image ? [image] : [],
              stock: stock || 0,
              isNew: isNew,
              rating: 0,
              reviews: 0,
              colors: undefined, // Usará los colores por defecto del sistema
              capacities: [],
            }}
            onAddToCart={(productData, variants) => {
              console.log('Agregando al carrito:', productData, variants)
              if (onAddToCart) {
                onAddToCart()
              }
            }}
          />
        )}
      </div>
    )
  }
)

CommercialProductCard.displayName = 'CommercialProductCard'

export { CommercialProductCard }
