// =====================================================
// COMPONENTE: PRODUCT PAGE LOADING SKELETON
// Descripción: Skeleton loader para la página completa de producto
// Propósito: Mostrar estructura mientras carga el producto antes del modal
// =====================================================

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Loader2, ChevronRight } from 'lucide-react'

interface ProductPageLoadingSkeletonProps {
  className?: string
}

export function ProductPageLoadingSkeleton({ className }: ProductPageLoadingSkeletonProps) {
  return (
    <div 
      className={cn('w-full min-h-[calc(100vh-200px)] bg-white', className)} 
      role="status" 
      aria-label="Cargando producto..."
    >
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs skeleton */}
        <div className="flex items-center gap-2 mb-8 animate-pulse">
          <div className="h-4 w-16 bg-gray-200 rounded" />
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <ChevronRight className="h-4 w-4 text-gray-300" />
          <div className="h-4 w-32 bg-gray-300 rounded" />
        </div>

        {/* Grid principal: imagen | detalles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Columna izquierda: Galería de imágenes */}
          <div className="space-y-4">
            {/* Imagen principal */}
            <div className="relative aspect-square bg-gray-100 rounded-2xl overflow-hidden border-2 border-gray-200 animate-pulse">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-3">
                  <Loader2 className="h-16 w-16 text-gray-300 animate-spin mx-auto" />
                  <p className="text-sm text-gray-400 font-medium">Cargando imagen...</p>
                </div>
              </div>
            </div>
            
            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div 
                  key={i} 
                  className="aspect-square bg-gray-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Columna derecha: Información del producto */}
          <div className="space-y-6">
            {/* Marca */}
            <div className="animate-pulse">
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>

            {/* Título del producto */}
            <div className="space-y-3 animate-pulse">
              <div className="h-8 w-full bg-gray-300 rounded-lg" />
              <div className="h-8 w-4/5 bg-gray-300 rounded-lg" />
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3 animate-pulse">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-5 w-5 bg-gray-200 rounded" />
                ))}
              </div>
              <div className="h-4 w-24 bg-gray-200 rounded" />
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3 animate-pulse">
                <div className="h-12 w-40 bg-gray-300 rounded-lg" />
                <div className="h-6 w-32 bg-gray-200 rounded" />
              </div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 my-6" />

            {/* Descripción */}
            <div className="space-y-3">
              <div className="h-5 w-28 bg-gray-300 rounded animate-pulse" />
              <div className="space-y-2 animate-pulse">
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-11/12 bg-gray-200 rounded" />
                <div className="h-4 w-4/5 bg-gray-200 rounded" />
              </div>
            </div>

            {/* Características */}
            <div className="space-y-3 pt-4">
              <div className="h-5 w-32 bg-gray-300 rounded animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-2 animate-pulse">
                    <div className="h-5 w-5 bg-gray-200 rounded-full" />
                    <div className="h-4 flex-1 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 my-6" />

            {/* Selector de opciones */}
            <div className="space-y-4">
              {/* Colores */}
              <div className="space-y-3">
                <div className="h-5 w-24 bg-gray-300 rounded animate-pulse" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" 
                    />
                  ))}
                </div>
              </div>

              {/* Capacidades */}
              <div className="space-y-3">
                <div className="h-5 w-28 bg-gray-300 rounded animate-pulse" />
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((i) => (
                    <div 
                      key={i} 
                      className="h-12 bg-gray-200 rounded-lg animate-pulse" 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Cantidad y stock */}
            <div className="flex items-center justify-between pt-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-10 w-16 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="h-4 w-32 bg-green-200 rounded animate-pulse" />
            </div>

            {/* Botones de acción */}
            <div className="space-y-3 pt-6">
              <div className="h-14 w-full bg-yellow-200 rounded-xl animate-pulse" />
              <div className="h-12 w-full bg-gray-200 rounded-xl animate-pulse" />
            </div>

            {/* Información adicional */}
            <div className="pt-6 space-y-2 border-t border-gray-200">
              <div className="flex items-center gap-2 animate-pulse">
                <div className="h-4 w-4 bg-green-200 rounded" />
                <div className="h-4 flex-1 bg-gray-200 rounded" />
              </div>
              <div className="flex items-center gap-2 animate-pulse">
                <div className="h-4 w-4 bg-blue-200 rounded" />
                <div className="h-4 flex-1 bg-gray-200 rounded" />
              </div>
              <div className="flex items-center gap-2 animate-pulse">
                <div className="h-4 w-4 bg-orange-200 rounded" />
                <div className="h-4 flex-1 bg-gray-200 rounded" />
              </div>
            </div>
          </div>
        </div>

        {/* Sección de productos relacionados skeleton */}
        <div className="pt-12 border-t border-gray-200">
          <div className="h-8 w-64 bg-gray-300 rounded-lg mb-6 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-24 bg-gray-300 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Mensaje de carga centrado */}
        <div className="flex flex-col items-center justify-center gap-4 py-12">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-orange-600 animate-spin" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Cargando producto...
            </h3>
            <p className="text-sm text-gray-600">
              Estamos preparando toda la información del producto para ti
            </p>
          </div>
        </div>
      </div>

      {/* Screen reader only text */}
      <span className="sr-only">
        Cargando información del producto, por favor espera...
      </span>
    </div>
  )
}

export default ProductPageLoadingSkeleton

