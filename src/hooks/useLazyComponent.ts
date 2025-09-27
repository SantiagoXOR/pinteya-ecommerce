import React, { lazy, Suspense, ComponentType } from 'react'

interface LazyComponentProps {
  fallback?: React.ReactNode
  children: React.ReactNode
}

/**
 * Hook para lazy loading de componentes
 * Optimiza el bundle size cargando componentes solo cuando se necesitan
 */
export function useLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn)

  return function LazyWrapper(props: React.ComponentProps<T>) {
    const defaultFallback = React.createElement('div', {
      className: 'animate-pulse bg-gray-200 h-20 rounded',
    })
    return React.createElement(
      Suspense,
      { fallback: fallback || defaultFallback },
      React.createElement(LazyComponent, props)
    )
  }
}

/**
 * Componente wrapper para lazy loading
 */
export function LazyComponent({ fallback, children }: LazyComponentProps) {
  const defaultFallback = React.createElement('div', {
    className: 'animate-pulse bg-gray-200 h-20 rounded',
  })
  return React.createElement(Suspense, { fallback: fallback || defaultFallback }, children)
}

/**
 * HOC para lazy loading de componentes pesados
 */
export function withLazyLoading<T extends ComponentType<any>>(
  Component: T,
  fallback?: React.ReactNode
) {
  return function LazyLoadedComponent(props: React.ComponentProps<T>) {
    const defaultFallback = React.createElement('div', {
      className: 'animate-pulse bg-gray-200 h-20 rounded',
    })
    return React.createElement(
      Suspense,
      { fallback: fallback || defaultFallback },
      React.createElement(Component, props)
    )
  }
}

// Lazy loading para modales comunes
// export const LazyModal = lazy(() => import('@/components/ui/modal'));
// export const LazyProductModal = lazy(() => import('@/components/Product/ProductModal')); // Archivo no existe
// export const LazyCheckoutModal = lazy(() => import('@/components/Checkout/CheckoutModal')); // Archivo no existe

// Lazy loading para páginas pesadas
// export const LazyProductGrid = lazy(() => import('@/components/Product/ProductGrid')); // Archivo no existe
// export const LazyTestimonials = lazy(() => import('@/components/Home/Testimonials')); // Archivo no existe
// export const LazyNewsletter = lazy(() => import('@/components/Common/Newsletter'));
