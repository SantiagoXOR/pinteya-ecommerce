import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

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
  price?: number
  originalPrice?: number
  discount?: number
  rating?: number
  reviews?: number
  badge?: string
  stock?: number
  freeShipping?: boolean
  fastShipping?: boolean
  isNew?: boolean
  onAddToCart?: () => void
  onQuickView?: () => void
  onWishlist?: () => void
  showCartAnimation?: boolean
}

const ProductCard = React.forwardRef<HTMLDivElement, ProductCardProps>(
  ({
    className,
    image,
    title,
    price,
    originalPrice,
    discount,
    rating,
    reviews,
    badge,
    stock = 0,
    freeShipping = false,
    fastShipping = false,
    isNew = false,
    onAddToCart,
    onQuickView,
    onWishlist,
    showCartAnimation = true,
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
    <Card
      ref={ref}
      className={cn("group overflow-hidden", className)}
      hover="lift"
      padding="none"
      {...props}
    >
      {/* Imagen del producto */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {image && (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        
        {/* Badges superiores */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {badge && (
            <div className="bg-error text-white text-xs font-medium px-2 py-1 rounded animate-pulse">
              {badge}
            </div>
          )}
          {isNew && (
            <div className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded">
              NUEVO
            </div>
          )}
        </div>

        {/* Badges de envío */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {freeShipping && (
            <div className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
              🚚 ENVÍO GRATIS
            </div>
          )}
          {fastShipping && !freeShipping && (
            <div className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              ⚡ ENVÍO RÁPIDO
            </div>
          )}
        </div>

        {/* Badge de stock bajo */}
        {stock > 0 && stock <= 5 && (
          <div className="absolute bottom-2 left-2 bg-yellow-500 text-white text-xs font-medium px-2 py-1 rounded">
            ¡Últimas {stock}!
          </div>
        )}
        
        {/* Acciones hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200">
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 translate-y-full group-hover:translate-y-0 transition-transform duration-200 flex gap-2">
            {onQuickView && (
              <button
                onClick={onQuickView}
                className="bg-white text-gray-700 p-2 rounded-full shadow-1 hover:bg-gray-50"
                aria-label="Vista rápida"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            )}
            
            {onWishlist && (
              <button
                onClick={onWishlist}
                className="bg-white text-gray-700 p-2 rounded-full shadow-1 hover:bg-gray-50"
                aria-label="Agregar a favoritos"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Contenido del producto */}
      <div className="p-4">
        {/* Rating */}
        {rating && (
          <div className="flex items-center gap-1 mb-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={cn(
                    "w-3 h-3",
                    i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
                  )}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            {reviews && (
              <span className="text-xs text-gray-500">({reviews})</span>
            )}
          </div>
        )}
        
        {/* Título */}
        {title && (
          <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 hover:text-primary transition-colors">
            {title}
          </h3>
        )}
        
        {/* Precios */}
        {price && (
          <div className="flex items-center gap-2 mb-3">
            <span className="font-semibold text-lg text-gray-900">
              ${price.toLocaleString('es-AR')}
            </span>
            {originalPrice && originalPrice > price && (
              <span className="text-sm text-gray-500 line-through">
                ${originalPrice.toLocaleString('es-AR')}
              </span>
            )}
          </div>
        )}
        
        {/* Botón agregar al carrito con animación */}
        {onAddToCart && (
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || stock === 0}
            className={cn(
              "w-full py-2 px-4 rounded-button font-medium transition-all duration-200 relative overflow-hidden",
              stock === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : isAddingToCart
                ? "bg-green-500 text-white"
                : "bg-primary text-white hover:bg-primary-hover active:scale-95"
            )}
          >
            {isAddingToCart ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                ¡Agregado!
              </span>
            ) : stock === 0 ? (
              "Sin stock"
            ) : (
              "Agregar al carrito"
            )}

            {/* Efecto de ondas al hacer click */}
            {isAddingToCart && (
              <span className="absolute inset-0 bg-white/20 animate-ping rounded-button"></span>
            )}
          </button>
        )}
        
        {children}
      </div>
    </Card>
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
