// ===================================
// EJEMPLOS DE COMPONENTES RESPONSIVE OPTIMIZADOS
// ===================================

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { useResponsiveOptimized, useResponsiveClasses } from '@/hooks/useResponsiveOptimized'

// ===================================
// 1. SIDEBAR RESPONSIVE OPTIMIZADO
// ===================================

interface OptimizedSidebarProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export const OptimizedSidebar: React.FC<OptimizedSidebarProps> = ({
  isOpen,
  onClose,
  children,
}) => {
  const { isMobile } = useResponsiveOptimized()

  return (
    <>
      {/* Overlay para móvil - solo visible en mobile */}
      {isMobile && (
        <div
          className={`
            fixed inset-0 bg-black/50 z-40
            transition-opacity duration-300 ease-in-out
            ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          onClick={onClose}
          aria-hidden='true'
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          // Base styles
          bg-white border-r border-gray-200
          
          // Mobile: Fixed overlay
          fixed top-0 left-0 h-full z-50
          transform transition-transform duration-300 ease-in-out
          
          // Desktop: Static sidebar
          lg:relative lg:transform-none lg:z-auto
          
          // Transform based on state
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          
          // Responsive width
          w-full xsm:w-80 sm:w-96 lg:w-80 xl:w-96
          
          // Responsive padding
          p-4 sm:p-6 lg:p-8
          
          // Responsive max-height for scrolling
          max-h-screen overflow-y-auto
        `}
        aria-label='Filtros de productos'
      >
        {/* Header del sidebar */}
        <div className='flex items-center justify-between mb-6 lg:mb-8'>
          <h2 className='text-custom-lg sm:text-custom-xl lg:text-custom-2xl font-semibold'>
            Filtros
          </h2>

          {/* Botón cerrar - solo visible en mobile */}
          <button
            onClick={onClose}
            className='lg:hidden p-2 hover:bg-gray-100 rounded-button transition-colors'
            aria-label='Cerrar filtros'
          >
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>

        {children}
      </aside>
    </>
  )
}

// ===================================
// 2. GRID DE PRODUCTOS RESPONSIVE
// ===================================

interface Product {
  id: string
  name: string
  price: number
  image: string
  featured?: boolean
}

interface ResponsiveProductGridProps {
  products: Product[]
  loading?: boolean
}

export const ResponsiveProductGrid: React.FC<ResponsiveProductGridProps> = ({
  products,
  loading = false,
}) => {
  const { productGrid } = useResponsiveClasses()

  if (loading) {
    return (
      <div className={productGrid.full}>
        {Array.from({ length: 12 }).map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    )
  }

  return (
    <div className={productGrid.full}>
      {products.map((product, index) => (
        <ResponsiveProductCard
          key={product.id}
          product={product}
          priority={index < 4} // Primeros 4 productos con prioridad
        />
      ))}
    </div>
  )
}

// ===================================
// 3. CARD DE PRODUCTO RESPONSIVE
// ===================================

interface ResponsiveProductCardProps {
  product: Product
  priority?: boolean
}

export const ResponsiveProductCard: React.FC<ResponsiveProductCardProps> = ({
  product,
  priority = false,
}) => {
  const { card } = useResponsiveClasses()
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <article
      className='
      group cursor-pointer
      bg-white rounded-card border border-gray-200
      hover:border-primary-300 hover:shadow-2
      transition-all duration-300
    '
    >
      {/* Imagen del producto */}
      <div
        className='
        relative overflow-hidden rounded-t-card
        aspect-square sm:aspect-[4/3] lg:aspect-square
        bg-gray-100
      '
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          className={`
            object-cover transition-all duration-500
            group-hover:scale-105
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          sizes='
            (max-width: 374px) 100vw,
            (max-width: 424px) 50vw,
            (max-width: 767px) 50vw,
            (max-width: 1023px) 33vw,
            (max-width: 1279px) 25vw,
            (max-width: 1999px) 20vw,
            16vw
          '
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => setImageLoaded(true)}
        />

        {/* Skeleton mientras carga */}
        {!imageLoaded && <div className='absolute inset-0 bg-gray-200 animate-pulse' />}

        {/* Badge de producto destacado */}
        {product.featured && (
          <div
            className='
            absolute top-2 left-2 xsm:top-3 xsm:left-3
            bg-primary-500 text-white
            px-2 py-1 xsm:px-3 xsm:py-1.5
            rounded-button text-2xs xsm:text-custom-xs
            font-medium
          '
          >
            Destacado
          </div>
        )}
      </div>

      {/* Contenido del card */}
      <div className={card.padding}>
        <h3
          className='
          text-custom-sm sm:text-base lg:text-custom-lg
          font-medium text-gray-900
          line-clamp-2 mb-2
          group-hover:text-primary-600
          transition-colors duration-200
        '
        >
          {product.name}
        </h3>

        <div className='flex items-center justify-between'>
          <span
            className='
            text-custom-lg sm:text-custom-xl lg:text-custom-2xl
            font-bold text-primary-600
          '
          >
            ${product.price.toFixed(2)}
          </span>

          <button
            className='
            bg-primary-500 hover:bg-primary-600
            text-white rounded-button
            px-3 py-2 sm:px-4 sm:py-2.5
            text-custom-xs sm:text-custom-sm
            font-medium
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
          '
          >
            Agregar
          </button>
        </div>
      </div>
    </article>
  )
}

// ===================================
// 4. SKELETON LOADING RESPONSIVE
// ===================================

export const ProductSkeleton: React.FC = () => {
  return (
    <div className='animate-pulse bg-white rounded-card border border-gray-200'>
      {/* Imagen skeleton */}
      <div
        className='
        bg-gray-200 rounded-t-card
        aspect-square sm:aspect-[4/3] lg:aspect-square
      '
      />

      {/* Contenido skeleton */}
      <div className='p-4 sm:p-6 lg:p-8 space-y-3'>
        <div className='space-y-2'>
          <div className='h-4 bg-gray-200 rounded w-3/4' />
          <div className='h-4 bg-gray-200 rounded w-1/2' />
        </div>

        <div className='flex items-center justify-between pt-2'>
          <div className='h-6 bg-gray-200 rounded w-20' />
          <div className='h-8 bg-gray-200 rounded w-16' />
        </div>
      </div>
    </div>
  )
}

// ===================================
// 5. HEADER RESPONSIVE CON BÚSQUEDA
// ===================================

interface ResponsiveShopHeaderProps {
  title: string
  productCount: number
  onSortChange: (sort: string) => void
  onViewChange: (view: 'grid' | 'list') => void
  currentView: 'grid' | 'list'
}

export const ResponsiveShopHeader: React.FC<ResponsiveShopHeaderProps> = ({
  title,
  productCount,
  onSortChange,
  onViewChange,
  currentView,
}) => {
  const { heading, container } = useResponsiveClasses()
  const { isMobile } = useResponsiveOptimized()

  return (
    <header className='bg-white border-b border-gray-200 sticky top-0 z-30'>
      <div className={container.full}>
        <div className='py-4 sm:py-6 lg:py-8'>
          {/* Título y contador */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6'>
            <div>
              <h1 className={`${heading.h1} text-gray-900 mb-1`}>{title}</h1>
              <p className='text-custom-sm sm:text-base text-gray-600'>
                {productCount} productos encontrados
              </p>
            </div>

            {/* Controles de vista - solo desktop */}
            {!isMobile && (
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => onViewChange('grid')}
                  className={`
                    p-2 rounded-button transition-colors
                    ${
                      currentView === 'grid'
                        ? 'bg-primary-100 text-primary-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }
                  `}
                  aria-label='Vista de cuadrícula'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                    <path d='M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' />
                  </svg>
                </button>

                <button
                  onClick={() => onViewChange('list')}
                  className={`
                    p-2 rounded-button transition-colors
                    ${
                      currentView === 'list'
                        ? 'bg-primary-100 text-primary-600'
                        : 'text-gray-400 hover:text-gray-600'
                    }
                  `}
                  aria-label='Vista de lista'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                    <path
                      fillRule='evenodd'
                      d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z'
                      clipRule='evenodd'
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Controles móviles */}
          <div
            className='
            flex flex-col xsm:flex-row gap-3 xsm:gap-4
            sm:hidden
          '
          >
            <select
              onChange={e => onSortChange(e.target.value)}
              className='
                flex-1 px-3 py-2 border border-gray-300 rounded-button
                text-custom-sm bg-white
                focus:outline-none focus:ring-2 focus:ring-primary-500
              '
            >
              <option value=''>Ordenar por</option>
              <option value='price-asc'>Precio: Menor a Mayor</option>
              <option value='price-desc'>Precio: Mayor a Menor</option>
              <option value='name'>Nombre A-Z</option>
            </select>

            <div className='flex gap-2'>
              <button
                onClick={() => onViewChange('grid')}
                className={`
                  flex-1 px-4 py-2 rounded-button text-custom-sm font-medium transition-colors
                  ${
                    currentView === 'grid'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                Cuadrícula
              </button>

              <button
                onClick={() => onViewChange('list')}
                className={`
                  flex-1 px-4 py-2 rounded-button text-custom-sm font-medium transition-colors
                  ${
                    currentView === 'list'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                Lista
              </button>
            </div>
          </div>

          {/* Controles desktop */}
          <div className='hidden sm:flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <select
                onChange={e => onSortChange(e.target.value)}
                className='
                  px-4 py-2 border border-gray-300 rounded-button
                  text-custom-sm bg-white min-w-48
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                '
              >
                <option value=''>Ordenar por</option>
                <option value='price-asc'>Precio: Menor a Mayor</option>
                <option value='price-desc'>Precio: Mayor a Menor</option>
                <option value='name'>Nombre A-Z</option>
                <option value='featured'>Destacados</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

// ===================================
// 6. HOOK PARA CLASES RESPONSIVE EXTENDIDO
// ===================================

// Este hook extiende el useResponsiveClasses original
export const useExtendedResponsiveClasses = () => {
  const baseClasses = useResponsiveClasses()
  const { currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsiveOptimized()

  return useMemo(
    () => ({
      ...baseClasses,

      // Clases específicas para ecommerce
      ecommerce: {
        // Sidebar
        sidebar: {
          overlay: 'fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 lg:hidden',
          container: `
          fixed top-0 left-0 h-full bg-white z-50
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:transform-none lg:z-auto
          w-full xsm:w-80 sm:w-96 lg:w-80 xl:w-96
          p-4 sm:p-6 lg:p-8
          max-h-screen overflow-y-auto
        `,
        },

        // Product cards
        productCard: {
          container: `
          group cursor-pointer bg-white rounded-card border border-gray-200
          hover:border-primary-300 hover:shadow-2 transition-all duration-300
        `,
          image: `
          relative overflow-hidden rounded-t-card bg-gray-100
          aspect-square sm:aspect-[4/3] lg:aspect-square
        `,
          content: baseClasses.card.padding,
          title: `
          text-custom-sm sm:text-base lg:text-custom-lg
          font-medium text-gray-900 line-clamp-2 mb-2
          group-hover:text-primary-600 transition-colors duration-200
        `,
          price: `
          text-custom-lg sm:text-custom-xl lg:text-custom-2xl
          font-bold text-primary-600
        `,
          button: `
          bg-primary-500 hover:bg-primary-600 text-white rounded-button
          px-3 py-2 sm:px-4 sm:py-2.5
          text-custom-xs sm:text-custom-sm font-medium
          transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        `,
        },

        // Headers
        shopHeader: {
          container: 'bg-white border-b border-gray-200 sticky top-0 z-30',
          title: `${baseClasses.heading.h1} text-gray-900 mb-1`,
          subtitle: 'text-custom-sm sm:text-base text-gray-600',
          controls: 'flex flex-col xsm:flex-row gap-3 xsm:gap-4 sm:hidden',
          desktopControls: 'hidden sm:flex items-center justify-between',
        },
      },
    }),
    [baseClasses, currentBreakpoint, isMobile, isTablet, isDesktop]
  )
}

export default {
  OptimizedSidebar,
  ResponsiveProductGrid,
  ResponsiveProductCard,
  ProductSkeleton,
  ResponsiveShopHeader,
  useExtendedResponsiveClasses,
}
