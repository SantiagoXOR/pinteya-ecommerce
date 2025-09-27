'use client'

import { lazy, Suspense } from 'react'

// Lazy load del QuickViewModal principal
const QuickViewModal = lazy(() => import('./QuickViewModal'))

// Skeleton optimizado para QuickViewModal
const QuickViewModalSkeleton = () => (
  <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
    <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden'>
      <div className='flex flex-col md:flex-row'>
        {/* Imagen del producto */}
        <div className='md:w-1/2 p-6'>
          <div className='aspect-square bg-gray-200 rounded-lg animate-pulse mb-4'></div>

          {/* Thumbnails */}
          <div className='flex gap-2 justify-center'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='w-16 h-16 bg-gray-200 rounded animate-pulse'></div>
            ))}
          </div>
        </div>

        {/* Información del producto */}
        <div className='md:w-1/2 p-6 space-y-4'>
          {/* Header con botón cerrar */}
          <div className='flex justify-between items-start'>
            <div className='flex-1 space-y-2'>
              <div className='h-6 bg-gray-200 rounded animate-pulse'></div>
              <div className='h-4 bg-gray-200 rounded w-3/4 animate-pulse'></div>
            </div>
            <div className='w-8 h-8 bg-gray-200 rounded animate-pulse'></div>
          </div>

          {/* Precio */}
          <div className='space-y-2'>
            <div className='h-8 bg-gray-200 rounded w-32 animate-pulse'></div>
            <div className='h-4 bg-gray-200 rounded w-24 animate-pulse'></div>
          </div>

          {/* Rating */}
          <div className='flex items-center gap-2'>
            <div className='flex gap-1'>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='w-4 h-4 bg-gray-200 rounded animate-pulse'></div>
              ))}
            </div>
            <div className='h-4 bg-gray-200 rounded w-20 animate-pulse'></div>
          </div>

          {/* Descripción */}
          <div className='space-y-2'>
            <div className='h-4 bg-gray-200 rounded animate-pulse'></div>
            <div className='h-4 bg-gray-200 rounded w-5/6 animate-pulse'></div>
            <div className='h-4 bg-gray-200 rounded w-4/6 animate-pulse'></div>
          </div>

          {/* Opciones de producto */}
          <div className='space-y-4'>
            {/* Color */}
            <div className='space-y-2'>
              <div className='h-4 bg-gray-200 rounded w-16 animate-pulse'></div>
              <div className='flex gap-2'>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className='w-8 h-8 bg-gray-200 rounded-full animate-pulse'></div>
                ))}
              </div>
            </div>

            {/* Talla */}
            <div className='space-y-2'>
              <div className='h-4 bg-gray-200 rounded w-12 animate-pulse'></div>
              <div className='flex gap-2'>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className='w-12 h-10 bg-gray-200 rounded animate-pulse'></div>
                ))}
              </div>
            </div>
          </div>

          {/* Cantidad y botones */}
          <div className='space-y-4'>
            <div className='flex items-center gap-4'>
              <div className='h-4 bg-gray-200 rounded w-16 animate-pulse'></div>
              <div className='flex items-center border rounded'>
                <div className='w-10 h-10 bg-gray-200 animate-pulse'></div>
                <div className='w-16 h-10 bg-gray-200 animate-pulse'></div>
                <div className='w-10 h-10 bg-gray-200 animate-pulse'></div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className='flex gap-3'>
              <div className='flex-1 h-12 bg-gray-200 rounded animate-pulse'></div>
              <div className='w-12 h-12 bg-gray-200 rounded animate-pulse'></div>
            </div>
          </div>

          {/* Información adicional */}
          <div className='space-y-3 pt-4 border-t'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='flex items-center gap-3'>
                <div className='w-5 h-5 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-4 bg-gray-200 rounded flex-1 animate-pulse'></div>
              </div>
            ))}
          </div>

          {/* Social sharing */}
          <div className='flex items-center gap-3 pt-4'>
            <div className='h-4 bg-gray-200 rounded w-20 animate-pulse'></div>
            <div className='flex gap-2'>
              {[...Array(4)].map((_, i) => (
                <div key={i} className='w-8 h-8 bg-gray-200 rounded animate-pulse'></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Componente principal con lazy loading
const LazyQuickViewModal = () => {
  return (
    <Suspense fallback={<QuickViewModalSkeleton />}>
      <QuickViewModal />
    </Suspense>
  )
}

export default LazyQuickViewModal
export { QuickViewModalSkeleton }
