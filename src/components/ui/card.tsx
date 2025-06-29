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
        "bg-[#fffcee] rounded-2xl shadow-sm p-3 w-full max-w-[280px] flex flex-col justify-between relative overflow-hidden min-h-[400px]",
        className
      )}
      data-testid="product-card"
      {...props}
    >
      {/* Badge de descuento */}
      {discount && (
        <div className="absolute top-2 left-2 z-10 max-w-[calc(100%-16px)]">
          <div className="bg-gradient-to-b from-[#FF6A00] to-[#FFCB00] text-white text-xs font-bold px-2 py-1 rounded max-w-full">
            <span className="text-white truncate block">{discount}</span>
          </div>
          <div className="bg-yellow-400 text-[#4b3200] text-xs font-medium px-2 py-1 rounded-b max-w-full">
            <span className="truncate block">Descuento especial</span>
          </div>
        </div>
      )}

      {/* Imagen del producto */}
      <div className="flex justify-center items-center h-32 mb-3 mt-2">
        {image ? (
          <img
            src={image}
            alt={title || 'Producto'}
            className="w-28 h-28 object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/products/placeholder.svg';
            }}
          />
        ) : (
          <div className="w-28 h-28 bg-gray-200 rounded-lg flex items-center justify-center">
            <img
              src="/images/products/placeholder.svg"
              alt="Sin imagen"
              className="w-20 h-20 opacity-60"
            />
          </div>
        )}
      </div>

      {/* Badge de envío/promoción */}
      {badge && (
        <div className="mb-2 w-full">
          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded inline-block max-w-full truncate">
            {badge}
          </span>
        </div>
      )}

      {/* Marca del producto */}
      {showBrand && brand && (
        <div className="mb-1">
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {brand}
          </span>
        </div>
      )}

      {/* Título del producto */}
      <h3 className="text-[#712F00] font-semibold text-sm leading-tight mb-2 line-clamp-2 min-h-[2.5rem]" data-testid="product-name">
        {productId ? (
          <a href={`/shop-details/${productId}`} className="hover:text-[#8B3A00] transition-colors">
            {title || 'Producto sin nombre'}
          </a>
        ) : (
          title || 'Producto sin nombre'
        )}
      </h3>

      {/* Precios - Nuevos componentes o legacy */}
      <div className="flex-grow">
        {useNewComponents ? (
          <div className="mb-3" data-testid="product-price">
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
          <div className="flex flex-col gap-1 mb-3" data-testid="product-price">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[#1f2937] font-bold text-lg truncate">
                ${price?.toLocaleString('es-AR') || '0'}
              </span>
              {originalPrice && originalPrice > (price || 0) && (
                <span className="text-gray-400 line-through text-sm truncate">
                  ${originalPrice.toLocaleString('es-AR')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stock info - Nuevos componentes o legacy */}
        {useNewComponents ? (
          <div className="mb-3">
            <StockIndicator
              quantity={stock || 0}
              lowStockThreshold={lowStockThreshold}
              showExactQuantity={showExactStock}
              unit={stockUnit}
              variant="minimal"
            />
          </div>
        ) : (
          stock !== undefined && stock <= 5 && stock > 0 && (
            <p className="text-xs text-orange-600 mb-3">
              ¡Solo quedan {stock} unidades!
            </p>
          )
        )}
      </div>

      {/* Botón de acción */}
      {onAddToCart && (
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart || stock === 0}
          data-testid="add-to-cart-btn"
          className={cn(
            "flex items-center justify-center gap-2 font-semibold py-2.5 px-3 rounded-lg transition w-full text-sm mt-auto",
            stock === 0
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-yellow-400 hover:bg-yellow-500 text-[#712F00]"
          )}
        >
          {isAddingToCart ? (
            <>
              <div className="w-4 h-4 border-2 border-[#712F00] border-t-transparent rounded-full animate-spin"></div>
              <span className="truncate">Agregando...</span>
            </>
          ) : stock === 0 ? (
            <span className="truncate">Sin stock</span>
          ) : (
            <>
              <svg className="w-4 h-4 fill-current flex-shrink-0" viewBox="0 0 24 24">
                <path d="M10 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7.333 5H20l-1.5 6H8.167l-.834-4H4V5h3.333zM6 9h12.5l1-4H7.5l.5 2H6v2z" />
              </svg>
              <span className="truncate">{cta || 'Agregar al carrito'}</span>
            </>
          )}
        </button>
      )}

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
