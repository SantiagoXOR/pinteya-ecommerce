'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Eye, Star } from 'lucide-react'

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
  ({
    className,
    image,
    title,
    brand,
    price,
    originalPrice,
    discount,
    isNew = false,
    cta = "Agregar al carrito",
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
  }, ref) => {
    const [isAddingToCart, setIsAddingToCart] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)
    const [isWishlisted, setIsWishlisted] = React.useState(false)
    const [showQuickActions, setShowQuickActions] = React.useState(false)

    const handleAddToCart = async () => {
      if (!onAddToCart) return

      if (showCartAnimation) {
        setIsAddingToCart(true)
        setTimeout(() => setIsAddingToCart(false), 1000)
      }

      onAddToCart()
    }

    // Calcular si mostrar envío gratis automáticamente
    const shouldShowFreeShipping = freeShipping || (price && price >= 15000)

    return (
      <motion.div
        ref={ref}
        className={cn(
          // Mobile-first: diseño compacto para 2 columnas
          "relative rounded-xl bg-white shadow-md flex flex-col w-full cursor-pointer overflow-hidden",
          // Mobile: más compacto
          "h-[280px] sm:h-[320px]",
          // Tablet y desktop: tamaño completo
          "md:h-[400px] lg:h-[450px]",
          "md:rounded-2xl",
          className
        )}
        data-testid="product-card"
        data-testid-commercial="commercial-product-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{
          scale: 1.02,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          transition: { duration: 0.2 }
        }}
        onHoverStart={() => {
          setIsHovered(true)
          setShowQuickActions(true)
        }}
        onHoverEnd={() => {
          setIsHovered(false)
          setShowQuickActions(false)
        }}
      >
        {/* Contenedor de imagen completa con degradado - Responsive */}
        <div className="relative w-full flex justify-center items-center overflow-hidden rounded-t-xl mb-2 md:mb-3 flex-1">
          {image ? (
            <img
              src={image}
              alt={title || 'Producto'}
              className="object-contain w-full h-full scale-110 z-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src = '/images/products/placeholder.svg'
              }}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full z-0">
              <img
                src="/images/products/placeholder.svg"
                alt="Sin imagen"
                className="w-64 h-64 opacity-60"
              />
            </div>
          )}

          {/* Degradado suave hacia blanco en la parte inferior - Responsive */}
          <div className="absolute bottom-0 left-0 right-0 h-12 md:h-20 bg-gradient-to-t from-white via-white/80 to-transparent z-10 pointer-events-none" />

          {/* Quick Actions - Aparecen en hover */}
          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                className="absolute top-2 right-2 flex flex-col gap-2 z-20"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Wishlist */}
                <motion.button
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors",
                    isWishlisted
                      ? "bg-red-500 text-white"
                      : "bg-white/80 text-gray-600 hover:bg-red-50 hover:text-red-500"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsWishlisted(!isWishlisted)
                  }}
                >
                  <Heart className={cn("w-4 h-4", isWishlisted && "fill-current")} />
                </motion.button>

                {/* Quick View */}
                <motion.button
                  className="w-8 h-8 rounded-full bg-white/80 text-gray-600 hover:bg-blue-50 hover:text-blue-500 flex items-center justify-center backdrop-blur-sm transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation()
                    // Aquí iría la lógica de vista rápida
                  }}
                >
                  <Eye className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Badge "Nuevo" en esquina superior derecha - Responsive */}
        {isNew && (
          <span
            className="absolute top-2 right-2 md:top-3 md:right-3 text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded z-30 shadow"
            style={{ backgroundColor: '#FFD600', color: '#EA5A17' }}
          >
            Nuevo
          </span>
        )}

        {/* Badge de descuento compacto en esquina superior izquierda - Responsive */}
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

        {/* Content con transición suave - Responsive */}
        <div className="relative z-20 text-left p-2 md:p-4 bg-white -mt-2 md:-mt-3 flex-shrink-0">
          {/* Marca del producto - Responsive */}
          {brand && (
            <div className="text-xs md:text-sm uppercase text-gray-600 font-semibold tracking-wide drop-shadow-sm">
              {brand}
            </div>
          )}

          {/* Título del producto - Con mejor contraste y responsive */}
          <h3 className="font-bold text-gray-900 text-sm md:text-lg drop-shadow-sm line-clamp-2 leading-tight mb-1 md:mb-2">
            {title}
          </h3>

          {/* Precios - Optimizados para el gradiente y responsive */}
          <div className="flex flex-col items-start space-y-1">
            {/* Precios en línea horizontal - Responsive */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Precio actual - Grande y destacado, responsive */}
              <div className="text-lg md:text-2xl font-bold drop-shadow-sm" style={{ color: '#EA5A17' }}>
                ${price?.toLocaleString('es-AR') || '0'}
              </div>

              {/* Precio anterior tachado - Responsive */}
              {originalPrice && originalPrice > (price || 0) && (
                <div className="text-gray-500 line-through text-xs md:text-sm drop-shadow-sm">
                  ${originalPrice.toLocaleString('es-AR')}
                </div>
              )}
            </div>

            {/* Cuotas en verde más oscuro - Responsive */}
            {installments && (
              <div className="text-green-800 text-xs md:text-sm font-medium drop-shadow-sm">
                {installments.quantity}x de ${installments.amount.toLocaleString('es-AR')}
                {installments.interestFree ? ' sin interés' : ''}
              </div>
            )}
          </div>

          {/* Badge de envío gratis - Compacto y responsive */}
          {shouldShowFreeShipping && (
            <div className="flex justify-start mt-1 md:mt-2">
              <img
                src="/images/icons/icon-envio.svg"
                alt="Envío gratis"
                className="h-6 md:h-10 w-auto object-contain drop-shadow-sm"
              />
            </div>
          )}

          {/* Botón "Agregar al carrito" - Animado y responsive */}
          <div className="w-full mt-2 md:mt-3">
            {onAddToCart && (
              <motion.button
                onClick={handleAddToCart}
                disabled={isAddingToCart || stock === 0}
                data-testid="add-to-cart"
                data-testid-btn="add-to-cart-btn"
                className={cn(
                  "w-full py-2 md:py-3 rounded-lg md:rounded-xl text-center shadow-md font-semibold flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base relative overflow-hidden",
                  stock === 0
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-yellow-400 text-[#EA5A17]"
                )}
                style={stock !== 0 ? { backgroundColor: '#facc15' } : undefined}
                whileHover={stock !== 0 ? {
                  scale: 1.02,
                  backgroundColor: '#eab308',
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                } : {}}
                whileTap={stock !== 0 ? { scale: 0.98 } : {}}
                transition={{ duration: 0.2 }}
              >
                <AnimatePresence mode="wait">
                  {isAddingToCart ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-3 h-3 md:w-4 md:h-4 border-2 border-[#EA5A17] border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden sm:inline">Agregando...</span>
                      <span className="sm:hidden">...</span>
                    </motion.div>
                  ) : stock === 0 ? (
                    <motion.span
                      key="no-stock"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      Sin stock
                    </motion.span>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-1 md:gap-2"
                    >
                      <svg className="w-4 h-4 md:w-5 md:h-5 fill-current flex-shrink-0" viewBox="0 0 24 24">
                        <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                      </svg>
                      <span className="truncate">{cta}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>
        </div>

        {children}
      </motion.div>
    )
  }
)

CommercialProductCard.displayName = "CommercialProductCard"

export { CommercialProductCard }
