// =====================================================
// COMPONENTE: PRODUCT MODAL SKELETON
// Descripción: Skeleton loader para el modal de detalle de producto
// Propósito: Mejorar UX durante la carga mostrando estructura del contenido
// =====================================================

import React from 'react'
import { cn } from '@/lib/core/utils'
import { Loader2 } from 'lucide-react'

interface ProductModalSkeletonProps {
  className?: string
}

export function ProductModalSkeleton({ className }: ProductModalSkeletonProps) {
  return (
    <div className={cn('w-full', className)} role="status" aria-label="Cargando producto...">
      {/* Grid de 2 columnas: imagen | detalles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Columna izquierda: Imagen del producto */}
        <div className="space-y-4">
          {/* Skeleton de imagen principal */}
          <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-12 w-12 text-gray-400 animate-spin" />
            </div>
          </div>
          
          {/* Skeleton de características (envío, garantía, etc.) */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center p-3 bg-gray-100 rounded-lg">
                <div className="h-5 w-5 bg-gray-300 rounded-full animate-pulse mb-1" />
                <div className="h-3 w-16 bg-gray-300 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Columna derecha: Información del producto */}
        <div className="space-y-6">
          {/* Skeleton de título */}
          <div className="space-y-2">
            <div className="h-8 bg-gray-300 rounded-lg animate-pulse w-full" />
            <div className="h-8 bg-gray-300 rounded-lg animate-pulse w-3/4" />
          </div>

          {/* Skeleton de precio */}
          <div className="space-y-2">
            <div className="h-10 bg-gray-300 rounded-lg animate-pulse w-1/2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>

          {/* Separador */}
          <div className="h-px bg-gray-200" />

          {/* Skeleton de descripción */}
          <div className="space-y-2">
            <div className="h-5 bg-gray-300 rounded animate-pulse w-32" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6" />
            </div>
          </div>

          {/* Skeleton de selectores de variantes */}
          <div className="space-y-4">
            {/* Selector de colores */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse w-24" />
              <div className="flex gap-2 flex-wrap">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Selector de capacidades/tamaños */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse w-28" />
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

          {/* Skeleton de categoría y marca */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse w-20" />
              <div className="h-6 bg-gray-200 rounded-full animate-pulse w-24 px-3 py-1" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-4 bg-gray-300 rounded animate-pulse w-16" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
            </div>
          </div>

          {/* Skeleton de stock */}
          <div className="flex items-center gap-2">
            <div className="h-4 bg-gray-300 rounded animate-pulse w-14" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-28" />
          </div>

          {/* Skeleton de rating */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-4 w-4 bg-gray-200 rounded animate-pulse"
                />
              ))}
            </div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
          </div>

          {/* Skeleton de cantidad y botón */}
          <div className="space-y-4 pt-4">
            {/* Selector de cantidad */}
            <div className="flex items-center gap-3">
              <div className="h-4 bg-gray-300 rounded animate-pulse w-20" />
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-10 w-16 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Botón de agregar al carrito */}
            <div className="h-12 bg-gray-300 rounded-xl animate-pulse w-full" />

            {/* Botón de favoritos */}
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse w-full" />
          </div>
        </div>
      </div>

      {/* Texto informativo */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Cargando información del producto...</span>
        </div>
      </div>

      {/* Screen reader only text */}
      <span className="sr-only">Cargando detalles del producto, por favor espera...</span>
    </div>
  )
}

export default ProductModalSkeleton

