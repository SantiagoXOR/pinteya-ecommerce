'use client'

import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/core/utils'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'
import { Heart, Eye, Star, ShoppingCart, AlertCircle } from 'lucide-react'
import { ShopDetailModal } from '@/components/ShopDetails/ShopDetailModal'
import { 
  extractProductCapacity, 
  formatProductBadges, 
  type ProductBadgeInfo, 
  type ExtractedProductInfo 
} from '@/utils/product-utils'

// Verificar que Framer Motion esté disponible
const isFramerMotionAvailable = false // Deshabilitado para usar fallbacks CSS

// Componentes fallback para cuando Framer Motion no esté disponible
const MotionDiv = 'div'
const MotionButton = 'button'

// Interfaces para variantes de productos
export interface ProductVariant {
  id?: string | number
  measure?: string
  color_name?: string
  color_hex?: string
  finish?: string
  price_list?: number
  price_sale?: number
  stock?: number
  is_active?: boolean
  is_default?: boolean
  image_url?: string
}

// Configuración de badges inteligentes
export interface BadgeConfig {
  showCapacity?: boolean
  showColor?: boolean
  showFinish?: boolean
  showMaterial?: boolean
  showGrit?: boolean
  showDimensions?: boolean
  showWeight?: boolean
  showBrand?: boolean
  maxBadges?: number
}

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
  
  // Nuevas props para sistema de badges inteligente
  variants?: ProductVariant[]
  description?: string
  badgeConfig?: BadgeConfig
  
  // Nuevas props para datos estructurados de la base de datos
  features?: Record<string, any>
  specifications?: Record<string, any>
  dimensions?: Record<string, any>
  weight?: number
  // Campos directos de la base de datos
  color?: string
  medida?: string
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
      variants,
      description,
      badgeConfig = {
        showCapacity: true,
        showColor: true,
        showFinish: true,
        showMaterial: true,
        showGrit: true,
        showDimensions: true,
        showWeight: true,
        showBrand: false,
        maxBadges: 4
      },
      features,
      specifications,
      dimensions,
      weight,
      children,
      color,
      medida,
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
    // Ref para ignorar clics justo después de cerrar el modal (evita re-apertura por burbujeo)
    const ignoreClicksUntilRef = React.useRef<number>(0)

    // Handler para el modal - DEBE estar en el nivel superior del componente
    const handleModalOpenChange = React.useCallback((open: boolean) => {
      console.log('🔄 [CommercialProductCard] onOpenChange llamado:', { 
        open, 
        currentState: showShopDetailModal,
        productTitle: title 
      })
      
      console.log('📝 [CommercialProductCard] Estado va a cambiar de', showShopDetailModal, 'a', open)
      
      // Forzar actualización del estado usando función callback
      setShowShopDetailModal(prevState => {
        console.log('🔧 [CommercialProductCard] Estado anterior:', prevState, ', nuevo:', open)
        return open
      })
      
      // Si el modal se está cerrando, ignorar clics en el card por un breve período
      if (!open) {
        ignoreClicksUntilRef.current = Date.now() + 300 // 300ms de ventana anti-click fantasma
        console.log('🛡️ [CommercialProductCard] Activando guardia anti-click fantasma hasta:', ignoreClicksUntilRef.current)
      }

      console.log('✅ [CommercialProductCard] setShowShopDetailModal llamado con:', open)
    }, [showShopDetailModal, title])

    // ============================================================================
    // SISTEMA DE BADGES INTELIGENTE
    // ============================================================================
    
    // Extraer información del producto para badges inteligentes
    const extractedInfo = React.useMemo(() => {
      if (!title) return {}
      
      // Debug: Verificar datos disponibles
      console.group(`🔍 [ProductCardCommercial] Debug badges - Producto: ${title}`)
      console.log('📋 Datos disponibles:')
      console.log('  - title:', title)
      console.log('  - variants:', variants)
      console.log('  - description:', description)
      console.log('  - features:', features)
      console.log('  - specifications:', specifications)
      console.log('  - dimensions:', dimensions)
      console.log('  - weight:', weight)
      console.log('  - brand:', brand)
      console.log('  - color (BD):', color)
      console.log('  - medida (BD):', medida)
      console.log('  - badgeConfig:', badgeConfig)
      
      // Crear objeto con datos estructurados de la base de datos
      const databaseData = {
        features,
        specifications,
        dimensions,
        weight,
        brand,
        // Campos directos de la BD - IMPORTANTE: usar los nombres correctos
        color: color, // Campo color de la BD
        medida: medida // Campo medida de la BD
      }
      
      console.log('🔧 databaseData creado:', databaseData)
      
      const result = extractProductCapacity(title, variants, description, databaseData)
      console.log('🎯 Información extraída:', result)
      console.groupEnd()
      
      return result
    }, [title, variants, description, features, specifications, dimensions, weight, brand, color, medida])

    // Generar badges inteligentes basados en la configuración
    const intelligentBadges = React.useMemo(() => {
      console.group(`🎨 [ProductCardCommercial] Generando badges para "${title}"`)
      console.log('📋 extractedInfo:', extractedInfo)
      console.log('⚙️ badgeConfig:', badgeConfig)
      
      const badges = formatProductBadges(extractedInfo, badgeConfig)
      console.log('🎯 Badges generados:', badges)
      console.log(`📊 Total badges: ${badges.length}`)
      
      if (badges.length === 0) {
        console.warn('⚠️ NO SE GENERARON BADGES - Verificar:')
        console.log('  - extractedInfo tiene datos?', Object.keys(extractedInfo).length > 0)
        console.log('  - badgeConfig permite mostrar badges?', badgeConfig)
        console.log('  - Datos específicos:', { 
          capacity: extractedInfo.capacity, 
          color: extractedInfo.color,
          showCapacity: badgeConfig?.showCapacity,
          showColor: badgeConfig?.showColor
        })
      }
      
      console.groupEnd()
      return badges
    }, [extractedInfo, badgeConfig, title])

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
        // Ignorar clics si estamos dentro de la ventana anti-click post-cierre
        if (Date.now() < ignoreClicksUntilRef.current) {
          e.preventDefault()
          e.stopPropagation()
          console.log('🛑 [CommercialProductCard] Click ignorado por guardia anti-click fantasma')
          return
        }
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
          // NO abrir el modal después de agregar al carrito
          // El modal debe cerrarse después de agregar al carrito
        } catch (error) {
          console.error('Error al agregar al carrito:', error)
        }
      },
      [onAddToCart, isAddingToCart, stock, showCartAnimation]
    )

    // Calcular si mostrar envío gratis automáticamente con umbral global
    const config = useDesignSystemConfig()
    const autoFreeShipping = price ? dsShouldShowFreeShipping(price, config) : false
    const shouldShowFreeShipping = Boolean(freeShipping || autoFreeShipping)

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

        {/* Badge de descuento compacto en esquina superior izquierda - Responsive */}
        {discount && (
          <div className='absolute top-2 left-2 md:top-3 md:left-3 z-30'>
            <div
              className='text-white text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded shadow-sm'
              style={{ backgroundColor: '#EA5A17' }}
            >
              {discount}
            </div>
          </div>
        )}

        {/* Badge "Nuevo" en esquina superior izquierda (debajo del descuento si existe) - Responsive */}
        {isNew && (
          <span
            className={cn(
              'absolute left-2 md:left-3 text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded z-30 shadow',
              discount ? 'top-10 md:top-12' : 'top-2 md:top-3'
            )}
            style={{ backgroundColor: '#FFD600', color: '#EA5A17' }}
          >
            Nuevo
          </span>
        )}

        {/* ============================================================================ */}
        {/* ZONA EXCLUSIVA PARA BADGES INTELIGENTES */}
        {/* Posicionados en el margen superior derecho */}
        {/* ============================================================================ */}
        {intelligentBadges.length > 0 && (
          <div className='absolute top-2 right-2 md:top-3 md:right-3 z-20 max-w-[120px] md:max-w-[140px]'>
            <div className='flex flex-col gap-1 md:gap-1.5 items-end'>
              {intelligentBadges.map((badge, index) => {
                // Badge circular de color
                if (badge.isCircular && badge.circleColor && badge.type === 'color-circle') {
                  return (
                    <div
                      key={`badge-${badge.type}-${index}`}
                      className='relative group'
                      title={badge.displayText}
                    >
                      <div
                        className='w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-white shadow-lg cursor-pointer transition-transform hover:scale-110'
                        style={{ backgroundColor: badge.circleColor }}
                      />
                      {/* Tooltip opcional */}
                      <div className='absolute bottom-full right-0 mb-1 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-30'>
                        {badge.displayText}
                      </div>
                    </div>
                  )
                }
                
                // Badge tradicional
                return (
                  <div
                    key={`badge-${badge.type}-${index}`}
                    className='text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded shadow-md flex-shrink-0 backdrop-blur-sm'
                    style={{ 
                      backgroundColor: badge.bgColor, 
                      color: badge.color,
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {badge.displayText}
                  </div>
                )
              })}
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
              {/* Precio actual - Grande y destacado, responsive (sin decimales) */}
              <div
                className='text-lg md:text-2xl font-bold drop-shadow-sm'
                style={{ color: '#EA5A17' }}
              >
                {
                  `$${(price ?? 0).toLocaleString('es-AR', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}`
                }
              </div>

              {/* Precio anterior tachado - Responsive (sin decimales) */}
              {originalPrice && originalPrice > (price || 0) && (
                <div className='text-gray-500 line-through text-xs md:text-sm drop-shadow-sm'>
                  {
                    `$${originalPrice.toLocaleString('es-AR', {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}`
                  }
                </div>
              )}
            </div>

            {/* Cuotas ocultas temporalmente por solicitud del usuario */}
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

        {/* Shop Detail Modal: siempre montado, controlado por la prop open */}
        <ShopDetailModal
          open={showShopDetailModal}
          onOpenChange={handleModalOpenChange}
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
      </div>
    )
  }
)

CommercialProductCard.displayName = 'CommercialProductCard'

export { CommercialProductCard }
