'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { PriceDisplay } from './price-display'
import { useDesignSystemConfig, shouldShowFreeShipping as dsShouldShowFreeShipping } from '@/lib/design-system-config'
import { StockIndicator } from './stock-indicator'
import { ShippingInfo } from './shipping-info'
import { formatCurrency } from '@/lib/utils/consolidated-utils'
import { useTenantSafe } from '@/contexts/TenantContext'
import { getTenantAssetPath } from '@/lib/tenant/tenant-assets'

const cardVariants = cva('rounded-card bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-transform duration-200 ease-out', {
  variants: {
    variant: {
      default: 'border border-gray-200 dark:border-gray-700 shadow-1',
      elevated: 'shadow-2 dark:shadow-xl',
      outlined: 'border border-gray-300 dark:border-gray-700',
      ghost: 'border-0 shadow-none',
    },
    padding: {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
    hover: {
      none: '',
      // Solo transform para hover (compositable)
      lift: 'hover:-translate-y-1',
      glow: 'hover:border-primary/20',
      scale: 'hover:scale-[1.02]',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'md',
    hover: 'none',
  },
})

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, padding, hover, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, hover }), className)}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight text-lg', className)}
      {...props}
    >
      {children}
    </h3>
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-gray-600', className)} {...props} />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('pt-0', className)} {...props} />
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

// Componente especializado para productos
export interface ProductCardProps extends CardProps {
  image?: string
  title?: string
  brand?: string
  price?: number
  originalPrice?: number
  discount?: string
  badge?: string
  cta?: string
  stock?: number
  productId?: number | string
  onAddToCart?: () => void
  showCartAnimation?: boolean
  // Nuevas props para componentes e-commerce
  showInstallments?: boolean
  installments?: {
    quantity: number
    amount: number
    interestFree?: boolean
  }
  showFreeShipping?: boolean
  stockUnit?: string
  lowStockThreshold?: number
  showExactStock?: boolean
  useNewComponents?: boolean // Flag para activar nuevos componentes
  showBrand?: boolean // Mostrar marca por separado
  isNew?: boolean // Badge "Nuevo" en esquina superior derecha
}

const ProductCard = React.memo(
  React.forwardRef<HTMLDivElement, ProductCardProps>(
    (
      {
        className,
        image,
        title,
        brand,
        price,
        originalPrice,
        discount,
        badge,
        cta = 'Agregar al carrito',
        stock = 0,
        productId,
        onAddToCart,
        showCartAnimation = false,
        // Nuevas props
        showInstallments = false,
        installments,
        showFreeShipping = false,
        stockUnit = 'unidades',
        lowStockThreshold = 5,
        showExactStock = false,
        useNewComponents = false,
        showBrand = true,
        isNew = false,
        children,
        ...props
      },
      ref
    ) => {
      // Config del design system para condiciones legacy
      const config = useDesignSystemConfig()
      const legacyAutoFree = price ? dsShouldShowFreeShipping(price, config) : false
      const [isAddingToCart, setIsAddingToCart] = React.useState(false)
      const tenant = useTenantSafe()
      
      // ⚡ MULTITENANT: Colores del tenant para el botón de agregar al carrito
      const accentColor = tenant?.accentColor || '#ffd549' // Amarillo por defecto
      const primaryColor = tenant?.primaryColor || '#f27a1d' // Naranja por defecto
      
      // ⚡ MULTITENANT: Icono de envío gratis por tenant desde Supabase Storage
      const shippingIconPath = getTenantAssetPath(
        tenant,
        'icons/icon-envio.svg',
        '/images/icons/icon-envio.svg'
      )
      const shippingIconLocal = tenant ? `/tenants/${tenant.slug}/icons/icon-envio.svg` : '/images/icons/icon-envio.svg'

      const handleAddToCart = async () => {
        if (!onAddToCart) {
          return
        }

        onAddToCart()
      }

      return (
        <div
          ref={ref}
          className={cn(
            // Mobile-first: diseño compacto para 2 columnas
            'bg-white rounded-xl shadow-sm p-1.5 sm:p-2 w-full flex flex-col relative',
            // Mobile: altura compacta
            'h-[240px] sm:h-[280px]',
            // Tablet y desktop: altura completa
            'md:h-[400px] lg:h-[450px]',
            'md:rounded-2xl md:max-w-[300px]',
            className
          )}
          data-testid='product-card'
          {...props}
        >
          {/* Badge "Nuevo" en esquina superior derecha */}
          {isNew && (
            <span
              className='absolute top-2 right-2 md:top-3 md:right-3 text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded z-40 shadow'
              style={{ 
                backgroundColor: 'var(--tenant-accent, #FFD600)', 
                color: 'var(--tenant-primary, #EA5A17)' 
              }}
            >
              Nuevo
            </span>
          )}

          {/* Imagen del producto - Mejorada con degradado y responsive */}
          <div className='relative flex justify-center items-center mb-1.5 sm:mb-2 md:mb-3 mt-0.5 sm:mt-1 px-1.5 sm:px-2 flex-1 overflow-hidden rounded-t-xl'>
            {image ? (
              <img
                src={image}
                alt={title || 'Producto'}
                className='w-full h-full object-contain scale-110'
                onError={e => {
                  const target = e.target as HTMLImageElement
                  target.src = '/images/products/placeholder.svg'
                }}
              />
            ) : (
              <div className='w-full h-full bg-gray-200 rounded-lg flex items-center justify-center'>
                <img
                  src='/images/products/placeholder.svg'
                  alt='Sin imagen'
                  className='w-16 h-16 md:w-32 md:h-32 opacity-60'
                />
              </div>
            )}

            {/* Degradado suave hacia blanco en la parte inferior - Responsive */}
            <div className='absolute bottom-0 left-0 right-0 h-12 md:h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none' />
            
            {/* Icono de envío gratis - Esquina inferior derecha de la imagen */}
            {!useNewComponents && (badge === 'Envío gratis' || legacyAutoFree) && (
              <div className='absolute bottom-2 right-2 md:bottom-3 md:right-3 z-30 pointer-events-none'>
                <img
                  src={shippingIconPath}
                  alt='Envío gratis'
                  className='h-6 sm:h-8 md:h-10 w-auto object-contain drop-shadow-lg'
                  onError={(e) => {
                    // Fallback al icono local del tenant, luego al genérico
                    const target = e.target as HTMLImageElement
                    if (target.src !== shippingIconLocal) {
                      target.src = shippingIconLocal
                    } else if (target.src !== '/images/icons/icon-envio.svg') {
                      target.src = '/images/icons/icon-envio.svg'
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Sección de información del producto - Integrada con degradado y responsive */}
          <div className='flex flex-col mb-0.5 sm:mb-1 flex-shrink-0 -mt-1.5 sm:-mt-2 md:-mt-3 p-1.5 sm:p-2 md:p-0'>
            {/* Badge de promoción (excluir envío gratis) - Responsive */}
            <div className='mb-0.5 w-full flex-shrink-0'>
              {badge && badge !== 'Envío gratis' && (
                <span className='bg-gradient-to-r from-[#FF6A00] to-[#FFCB00] text-white text-xs font-medium px-1 md:px-1.5 py-0.5 rounded inline-block max-w-full truncate'>
                  {badge}
                </span>
              )}
            </div>

            {/* Marca del producto - Responsive */}
            <div className='mb-0.5 flex-shrink-0'>
              {showBrand && brand && (
                <span className='text-xs text-gray-500 font-medium uppercase tracking-wide'>
                  {brand}
                </span>
              )}
            </div>

            {/* Título del producto - Responsive */}
            <div className='flex-1 min-h-0'>
              <h3
                className='text-[#712F00] font-semibold text-xs md:text-sm leading-tight line-clamp-2 h-full flex items-start'
                data-testid='product-name'
              >
                {productId ? (
                  <a
                    href={`/shop-details/${productId}`}
                    className='hover:text-[#8B3A00] transition-colors line-clamp-2'
                  >
                    {title || 'Producto sin nombre'}
                  </a>
                ) : (
                  <span className='line-clamp-2'>{title || 'Producto sin nombre'}</span>
                )}
              </h3>
            </div>
          </div>

          {/* Sección de precios - Altura fija y responsive */}
          <div className='w-full overflow-hidden mb-0.5 sm:mb-1 flex-shrink-0 px-1.5 sm:px-2 md:px-0'>
            {useNewComponents ? (
              <div
                className='h-full w-full overflow-hidden flex flex-col'
                data-testid='product-price'
              >
                <PriceDisplay
                  amount={(price || 0) * 100} // Convertir a centavos
                  originalAmount={originalPrice ? originalPrice * 100 : undefined}
                  installments={showInstallments ? installments : undefined}
                  showFreeShipping={showFreeShipping}
                  variant='compact'
                  size='sm'
                />
              </div>
            ) : (
              <div
                className='flex flex-col gap-0.5 h-full w-full overflow-hidden'
                data-testid='product-price'
              >
                <div className='flex items-center gap-2 w-full'>
                  <span
                    className='font-bold text-lg sm:text-xl leading-tight truncate'
                    style={{ color: primaryColor }}
                  >
                    {formatCurrency(price)}
                  </span>
                  
                  {/* Badge de descuento inline con el precio - ⚡ MULTITENANT: usar primaryColor */}
                  {discount && (
                    <div
                      className='inline-flex flex-col items-center justify-center px-1 py-0.5 rounded shadow-sm'
                      style={{ backgroundColor: primaryColor }}
                    >
                      <span className='font-extrabold text-[9px] sm:text-[10px] text-white leading-none'>
                        {discount}
                      </span>
                      <span className='uppercase text-[6px] sm:text-[7px] font-semibold text-white leading-none -mt-[1px]'>
                        OFF
                      </span>
                    </div>
                  )}
                  
                  {originalPrice && originalPrice > (price || 0) && (
                    <span className='text-gray-400 line-through text-sm truncate'>
                      {formatCurrency(originalPrice)}
                    </span>
                  )}
                </div>

                {/* Cuotas en verde oscuro */}
                {showInstallments && installments && (
                  <div className='text-green-800 text-sm font-medium'>
                    {installments.quantity}x de {formatCurrency(installments.amount)}
                    {installments.interestFree ? ' sin interés' : ''}
                  </div>
                )}
              </div>
            )}

            {/* Stock info - Altura fija - OCULTO según solicitud del usuario */}
            <div className='h-[18px] flex items-start'>
              {/* Badge de stock oculto por solicitud del usuario */}
            </div>
          </div>

          {/* Sección inferior - Botón responsive */}
          <div className='flex flex-col mt-auto flex-shrink-0 px-2 md:px-0'>
            {/* Botón de acción - Altura fija y responsive */}
            {onAddToCart && (
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || stock === 0}
                data-testid='add-to-cart-btn'
                className={cn(
                  'flex items-center justify-center gap-1 md:gap-2 font-semibold py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 rounded-lg transition w-full text-sm sm:text-base',
                  stock === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'shadow-sm hover:shadow-md'
                )}
                style={stock !== 0 ? { 
                  backgroundColor: accentColor,
                  color: primaryColor
                } : undefined}
                onMouseEnter={(e) => {
                  if (stock !== 0) {
                    e.currentTarget.style.backgroundColor = `${accentColor}dd`
                  }
                }}
                onMouseLeave={(e) => {
                  if (stock !== 0) {
                    e.currentTarget.style.backgroundColor = accentColor
                  }
                }}
              >
                {isAddingToCart ? (
                  <>
                    <div 
                      className='w-3 h-3 md:w-4 md:h-4 border-2 border-t-transparent rounded-full animate-spin'
                      style={{ borderColor: primaryColor }}
                    ></div>
                    <span className='truncate hidden sm:inline'>Agregando...</span>
                    <span className='truncate sm:hidden'>...</span>
                  </>
                ) : stock === 0 ? (
                  <span className='truncate'>Sin stock</span>
                ) : (
                  <>
                    <svg
                      className='w-3 h-3 md:w-4 md:h-4 fill-current flex-shrink-0'
                      viewBox='0 0 24 24'
                      style={{ color: primaryColor }}
                    >
                      <path d='M10 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7.333 5H20l-1.5 6H8.167l-.834-4H4V5h3.333zM6 9h12.5l1-4H7.5l.5 2H6v2z' />
                    </svg>
                    <span className='truncate' style={{ color: primaryColor }}>{cta || 'Agregar al carrito'}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {children}
        </div>
      )
    }
  )
)
ProductCard.displayName = 'ProductCard'

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  ProductCard,
  cardVariants,
}
