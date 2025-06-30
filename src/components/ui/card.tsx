"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { PriceDisplay } from "./price-display"
import { StockIndicator } from "./stock-indicator"
import { ShippingInfo } from "./shipping-info"

const cardVariants = cva(
  "rounded-card bg-white text-gray-900 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border border-gray-200 shadow-1",
        elevated: "shadow-2",
        outlined: "border border-gray-300",
        ghost: "border-0 shadow-none",
      },
      padding: {
        none: "p-0",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
      },
      hover: {
        none: "",
        lift: "hover:shadow-2 hover:-translate-y-1",
        glow: "hover:shadow-2 hover:border-primary/20",
        scale: "hover:scale-[1.02]",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      hover: "none",
    },
  }
)

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
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight text-lg", className)}
    {...props}
  >
    {children}
  </h3>
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

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

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({
    className,
    image,
    title,
    brand,
    price,
    originalPrice,
    discount,
    badge,
    cta = "Agregar al carrito",
    stock = 0,
    productId,
    onAddToCart,
    showCartAnimation = true,
    // Nuevas props
    showInstallments = false,
    installments,
    showFreeShipping = false,
    stockUnit = "unidades",
    lowStockThreshold = 5,
    showExactStock = false,
    useNewComponents = false,
    showBrand = true,
    isNew = false,
    children,
    ...props
  }, ref) => {
    const [isAddingToCart, setIsAddingToCart] = React.useState(false);

    const handleAddToCart = async () => {
      if (!onAddToCart) return;

      if (showCartAnimation) {
        setIsAddingToCart(true);
        // Simular delay de animación
        setTimeout(() => setIsAddingToCart(false), 1000);
      }

      onAddToCart();
    };

    return (
    <div
      ref={ref}
      className={cn(
        // Mobile-first: diseño compacto para 2 columnas
        "bg-white rounded-xl shadow-sm p-2 w-full flex flex-col relative overflow-hidden",
        // Mobile: altura compacta
        "h-[280px] sm:h-[320px]",
        // Tablet y desktop: altura completa
        "md:h-[400px] lg:h-[450px]",
        "md:rounded-2xl md:max-w-[300px]",
        className
      )}
      data-testid="product-card"
      {...props}
    >
      {/* Badge de descuento - Responsive */}
      {discount && (
        <div className="absolute top-2 left-2 md:top-3 md:left-3 z-30">
          <div
            className="text-white text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded-t"
            style={{ backgroundColor: '#EA5A17' }}
          >
            {discount}
          </div>
          <div
            className="bg-white text-xs font-semibold px-1.5 py-0.5 md:px-2 md:py-1 rounded-b shadow-sm text-left leading-none"
            style={{ color: '#EA5A17' }}
          >
            <div>Descuento</div>
            <div>especial</div>
          </div>
        </div>
      )}

      {/* Badge "Nuevo" en esquina superior derecha - Responsive */}
      {isNew && (
        <span
          className="absolute top-2 right-2 md:top-3 md:right-3 text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded z-30 shadow"
          style={{ backgroundColor: '#FFD600', color: '#EA5A17' }}
        >
          Nuevo
        </span>
      )}

      {/* Imagen del producto - Mejorada con degradado y responsive */}
      <div className="relative flex justify-center items-center mb-2 md:mb-3 mt-1 px-2 flex-1 overflow-hidden rounded-t-xl">
        {image ? (
          <img
            src={image}
            alt={title || 'Producto'}
            className="w-full h-full object-contain scale-110"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/products/placeholder.svg';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
            <img
              src="/images/products/placeholder.svg"
              alt="Sin imagen"
              className="w-16 h-16 md:w-32 md:h-32 opacity-60"
            />
          </div>
        )}

        {/* Degradado suave hacia blanco en la parte inferior - Responsive */}
        <div className="absolute bottom-0 left-0 right-0 h-12 md:h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />
      </div>

      {/* Sección de información del producto - Integrada con degradado y responsive */}
      <div className="flex flex-col mb-1 flex-shrink-0 -mt-2 md:-mt-3 p-2 md:p-0">
        {/* Badge de promoción (excluir envío gratis) - Responsive */}
        <div className="mb-0.5 w-full flex-shrink-0">
          {badge && badge !== "Envío gratis" && (
            <span className="bg-gradient-to-r from-[#FF6A00] to-[#FFCB00] text-white text-xs font-medium px-1 md:px-1.5 py-0.5 rounded inline-block max-w-full truncate">
              {badge}
            </span>
          )}
        </div>

        {/* Marca del producto - Responsive */}
        <div className="mb-0.5 flex-shrink-0">
          {showBrand && brand && (
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {brand}
            </span>
          )}
        </div>

        {/* Título del producto - Responsive */}
        <div className="flex-1 min-h-0">
          <h3 className="text-[#712F00] font-semibold text-xs md:text-sm leading-tight line-clamp-2 h-full flex items-start" data-testid="product-name">
            {productId ? (
              <a href={`/shop-details/${productId}`} className="hover:text-[#8B3A00] transition-colors line-clamp-2">
                {title || 'Producto sin nombre'}
              </a>
            ) : (
              <span className="line-clamp-2">{title || 'Producto sin nombre'}</span>
            )}
          </h3>
        </div>
      </div>

      {/* Sección de precios - Altura fija y responsive */}
      <div className="w-full overflow-hidden mb-1 flex-shrink-0 px-2 md:px-0">
        {useNewComponents ? (
          <div className="h-full w-full overflow-hidden flex flex-col" data-testid="product-price">
            <PriceDisplay
              amount={(price || 0) * 100} // Convertir a centavos
              originalAmount={originalPrice ? originalPrice * 100 : undefined}
              installments={showInstallments ? installments : undefined}
              showFreeShipping={showFreeShipping}
              variant="compact"
              size="sm"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-0.5 h-full w-full overflow-hidden" data-testid="product-price">
            <div className="flex items-center gap-2 w-full">
              <span className="font-bold text-2xl leading-tight truncate" style={{ color: '#EA5A17' }}>
                ${price?.toLocaleString('es-AR') || '0'}
              </span>
              {originalPrice && originalPrice > (price || 0) && (
                <span className="text-gray-400 line-through text-sm truncate">
                  ${originalPrice.toLocaleString('es-AR')}
                </span>
              )}
            </div>

            {/* Cuotas en verde oscuro */}
            {showInstallments && installments && (
              <div className="text-green-800 text-sm font-medium">
                {installments.quantity}x de ${installments.amount.toLocaleString('es-AR')}
                {installments.interestFree ? ' sin interés' : ''}
              </div>
            )}
          </div>
        )}

        {/* Stock info - Altura fija */}
        <div className="h-[18px] flex items-start">
          {useNewComponents ? (
            <StockIndicator
              quantity={stock || 0}
              lowStockThreshold={lowStockThreshold}
              showExactQuantity={showExactStock}
              unit={stockUnit}
              variant="minimal"
            />
          ) : (
            stock !== undefined && stock <= 5 && stock > 0 && (
              <p className="text-xs text-orange-600">
                ¡Solo quedan {stock} unidades!
              </p>
            )
          )}
        </div>
      </div>

      {/* Badge de envío gratis con ícono SVG personalizado - Solo cuando no se usan nuevos componentes - Responsive */}
      {!useNewComponents && (badge === "Envío gratis" || (price && price >= 15000)) && (
        <div className="flex justify-start mb-1 md:mb-2 flex-shrink-0 px-2 md:px-0">
          <img
            src="/images/icons/icon-envio.svg"
            alt="Envío gratis"
            className="h-6 md:h-10 w-auto object-contain"
          />
        </div>
      )}

      {/* Sección inferior - Botón responsive */}
      <div className="flex flex-col mt-auto flex-shrink-0 px-2 md:px-0">
        {/* Botón de acción - Altura fija y responsive */}
        {onAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || stock === 0}
            data-testid="add-to-cart-btn"
            className={cn(
              "flex items-center justify-center gap-1 md:gap-2 font-semibold py-1.5 md:py-2 px-2 md:px-3 rounded-lg transition w-full text-xs md:text-sm",
              stock === 0
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-[#FFCB00] to-[#FFD700] hover:from-[#FFB800] hover:to-[#FFCB00] shadow-sm hover:shadow-md"
            )}
            style={stock !== 0 ? { color: '#EA5A17' } : undefined}
          >
          {isAddingToCart ? (
            <>
              <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-[#EA5A17] border-t-transparent rounded-full animate-spin"></div>
              <span className="truncate hidden sm:inline">Agregando...</span>
              <span className="truncate sm:hidden">...</span>
            </>
          ) : stock === 0 ? (
            <span className="truncate">Sin stock</span>
          ) : (
            <>
              <svg className="w-3 h-3 md:w-4 md:h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M10 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7.333 5H20l-1.5 6H8.167l-.834-4H4V5h3.333zM6 9h12.5l1-4H7.5l.5 2H6v2z" />
              </svg>
              <span className="truncate">{cta || 'Agregar al carrito'}</span>
            </>
          )}
          </button>
        )}
      </div>

      {children}
    </div>
    );
  }
)
ProductCard.displayName = "ProductCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  ProductCard,
  cardVariants 
}
