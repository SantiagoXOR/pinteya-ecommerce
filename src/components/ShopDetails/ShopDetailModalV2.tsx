'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, ShoppingCart, Heart, Share2, Star, Truck, Shield, RotateCcw } from 'lucide-react'
import Image from 'next/image'
import { Product } from '@/types/product'

interface ShopDetailModalV2Props {
  product: Product | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddToCart?: (product: Product) => void
  onAddToWishlist?: (product: Product) => void
}

export default function ShopDetailModalV2({
  product,
  open,
  onOpenChange,
  onAddToCart,
  onAddToWishlist
}: ShopDetailModalV2Props) {
  if (!product) return null

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product)
    }
  }

  const handleAddToWishlist = () => {
    if (onAddToWishlist) {
      onAddToWishlist(product)
    }
  }

  const discountPercentage = product.original_price 
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 grid grid-rows-[auto,1fr,auto]" onInteractOutside={() => onOpenChange(false)}>
        {/* Header con título y botón de cierre */}
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900 pr-8">
              {product.name}
            </DialogTitle>
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Contenido principal con scroll */}
        <ScrollArea className="h-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Imagen del producto */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden">
                <Image
                  src={product.image_url || '/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {discountPercentage > 0 && (
                  <Badge className="absolute top-3 left-3 bg-red-500 text-white">
                    -{discountPercentage}%
                  </Badge>
                )}
              </div>
              
              {/* Características del producto */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <Truck className="h-5 w-5 text-green-600 mb-1" />
                  <span className="text-xs text-gray-600">Envío gratis</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600 mb-1" />
                  <span className="text-xs text-gray-600">Garantía</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                  <RotateCcw className="h-5 w-5 text-orange-600 mb-1" />
                  <span className="text-xs text-gray-600">30 días</span>
                </div>
              </div>
            </div>

            {/* Información del producto */}
            <div className="space-y-6">
              {/* Precio */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {(() => {
                      const formatted = product.price.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      const commaIndex = formatted.lastIndexOf(',')
                      if (commaIndex === -1) return `$${formatted}`
                      const integerWithSep = formatted.slice(0, commaIndex + 1)
                      const decimals = formatted.slice(commaIndex + 1)
                      return (
                        <span>
                          {`$${integerWithSep}`}<span className="align-super text-xs">{decimals}</span>
                        </span>
                      )
                    })()}
                  </span>
                  {product.original_price && product.original_price > product.price && (
                    <span className="text-lg text-gray-500 line-through">
                      {(() => {
                        const formatted = product.original_price!.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        const commaIndex = formatted.lastIndexOf(',')
                        if (commaIndex === -1) return `$${formatted}`
                        const integerWithSep = formatted.slice(0, commaIndex + 1)
                        const decimals = formatted.slice(commaIndex + 1)
                        return (
                          <span>
                            {`$${integerWithSep}`}<span className="align-super text-xs">{decimals}</span>
                          </span>
                        )
                      })()}
                    </span>
                  )}
                </div>
                <p className="text-sm text-green-600 font-medium">
                  Hasta 12 cuotas sin interés de {(() => {
                    const base = (product.price / 12)
                    const formatted = base.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    const commaIndex = formatted.lastIndexOf(',')
                    if (commaIndex === -1) return `$${formatted}`
                    const integerWithSep = formatted.slice(0, commaIndex + 1)
                    const decimals = formatted.slice(commaIndex + 1)
                    return (
                      <span>
                        {`$${integerWithSep}`}<span className="align-super text-xs">{decimals}</span>
                      </span>
                    )
                  })()}
                </p>
              </div>

              <Separator />

              {/* Descripción */}
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Descripción</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {product.description || 'Producto de alta calidad para tus proyectos de construcción y mejoras del hogar.'}
                </p>
              </div>

              {/* Categoría y marca */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Categoría:</span>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>
                {product.brand && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Marca:</span>
                    <span className="text-sm font-medium">{product.brand}</span>
                  </div>
                )}
              </div>

              {/* Stock */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Stock:</span>
                <span className={`text-sm font-medium ${
                  product.stock > 10 ? 'text-green-600' : 
                  product.stock > 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
                </span>
              </div>

              {/* Rating (simulado) */}
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.0) 127 reseñas</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer con botones de acción */}
        <DialogFooter className="px-6 py-4 border-t bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            {/* Botones secundarios */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddToWishlist}
                className="flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Favoritos</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Compartir</span>
              </Button>
            </div>

            {/* Botones principales */}
            <div className="flex gap-2 flex-1 sm:justify-end">
              <DialogClose asChild>
                <Button variant="outline" className="flex-1 sm:flex-none">
                  Seguir viendo
                </Button>
              </DialogClose>
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 sm:flex-none bg-yellow-400 text-black hover:bg-yellow-500 disabled:bg-gray-300"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {product.stock === 0 ? 'Sin stock' : 'Agregar al carrito'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}