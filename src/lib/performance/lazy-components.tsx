// ===================================
// PINTEYA E-COMMERCE - LAZY COMPONENTS
// Sistema de lazy loading para componentes pesados
// ===================================

import { lazy, Suspense, ComponentType, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

// ===================================
// FALLBACK COMPONENTS
// ===================================

const DefaultFallback = () => (
  <div className='flex items-center justify-center p-8'>
    <Loader2 className='w-6 h-6 animate-spin text-primary' />
    <span className='ml-2 text-sm text-muted-foreground'>Cargando...</span>
  </div>
)

const ShopDetailsFallback = () => (
  <div className='container mx-auto px-4 pb-12'>
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12'>
      {/* Product Images Section */}
      <div className='space-y-4'>
        <Card className='overflow-hidden'>
          <div className='relative aspect-square bg-gray-100'>
            <Skeleton className='w-full h-full' />
          </div>
        </Card>
        <div className='flex space-x-2'>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className='w-20 h-20 rounded-lg' />
          ))}
        </div>
      </div>

      {/* Product Info Section */}
      <div className='space-y-6'>
        <Skeleton className='h-8 w-3/4' />
        <Skeleton className='h-6 w-1/2' />
        <Skeleton className='h-12 w-full' />
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
        </div>
      </div>
    </div>
  </div>
)

const AdminDashboardFallback = () => (
  <div className='p-6 space-y-6'>
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardContent className='p-6'>
            <Skeleton className='h-4 w-1/2 mb-2' />
            <Skeleton className='h-8 w-3/4' />
          </CardContent>
        </Card>
      ))}
    </div>
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      <Card>
        <CardContent className='p-6'>
          <Skeleton className='h-6 w-1/3 mb-4' />
          <Skeleton className='h-64 w-full' />
        </CardContent>
      </Card>
      <Card>
        <CardContent className='p-6'>
          <Skeleton className='h-6 w-1/3 mb-4' />
          <Skeleton className='h-64 w-full' />
        </CardContent>
      </Card>
    </div>
  </div>
)

// ===================================
// LAZY COMPONENTS
// ===================================

// ShopDetails - Componente más pesado (45KB)
export const LazyShopDetails = lazy(() =>
  import('@/components/ShopDetails').then(module => ({
    default: module.default,
  }))
)

// Admin Dashboard
export const LazyAdminDashboard = lazy(() =>
  import('@/components/admin/LazyAdminDashboard')
    .then(module => {
      // The LazyAdminDashboard is a named export, not the default export
      if (module.LazyAdminDashboard) {
        return { default: module.LazyAdminDashboard }
      }
      // Fallback if the named export doesn't exist
      throw new Error('LazyAdminDashboard component not found')
    })
    .catch(() => ({
      default: () => <div>Admin Dashboard no disponible</div>,
    }))
)

// Product Gallery
export const LazyProductGallery = lazy(() =>
  import('@/components/ShopDetails')
    .then(module => ({
      default: module.default,
    }))
    .catch(() => ({
      default: () => <div>Product Gallery no disponible</div>,
    }))
)

// Checkout Form
export const LazyCheckoutForm = lazy(() =>
  import('@/components/Checkout')
    .then(module => ({
      default: module.default,
    }))
    .catch(() => ({
      default: () => <div>Checkout Form no disponible</div>,
    }))
)

// User Dashboard
export const LazyUserDashboard = lazy(() =>
  import('@/components/User/UserDashboard')
    .then(module => ({
      default: module.default,
    }))
    .catch(() => ({
      default: () => <div>User Dashboard no disponible</div>,
    }))
)

// ===================================
// WRAPPER COMPONENTS CON SUSPENSE
// ===================================

export function ShopDetailsWithSuspense(props: any) {
  return (
    <Suspense fallback={<ShopDetailsFallback />}>
      <LazyShopDetails {...props} />
    </Suspense>
  )
}

export function AdminDashboardWithSuspense(props: any) {
  return (
    <Suspense fallback={<AdminDashboardFallback />}>
      <LazyAdminDashboard {...props} />
    </Suspense>
  )
}

export function ProductGalleryWithSuspense(props: any) {
  return (
    <Suspense fallback={<Skeleton className='w-full h-96' />}>
      <LazyProductGallery {...props} />
    </Suspense>
  )
}

export function CheckoutFormWithSuspense(props: any) {
  return (
    <Suspense fallback={<Skeleton className='w-full h-96' />}>
      <LazyCheckoutForm {...props} />
    </Suspense>
  )
}

export function UserDashboardWithSuspense(props: any) {
  return (
    <Suspense fallback={<Skeleton className='w-full h-96' />}>
      <LazyUserDashboard {...props} />
    </Suspense>
  )
}

// ===================================
// HOC PARA LAZY LOADING
// ===================================

export function withLazyLoading<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ReactNode,
  componentName?: string
) {
  const LazyComponent = lazy(async () => {
    const startTime = performance.now()

    try {
      const module = await importFn()
      const loadTime = performance.now() - startTime

      if (process.env.NODE_ENV === 'development') {
        console.log(`[LazyLoading] ${componentName || 'Component'}: ${loadTime.toFixed(2)}ms`)
      }

      return module
    } catch (error) {
      console.error(`[LazyLoading] Error loading ${componentName || 'Component'}:`, error)
      throw error
    }
  })

  return function LazyWrapper(props: React.ComponentProps<T>) {
    return (
      <Suspense fallback={fallback || <DefaultFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// ===================================
// PRELOAD UTILITIES
// ===================================

export const preloadComponents = {
  /**
   * Precargar ShopDetails
   */
  shopDetails: () => {
    import('@/components/ShopDetails').catch(() => {})
  },

  /**
   * Precargar Admin Dashboard
   */
  adminDashboard: () => {
    import('@/app/admin/page').catch(() => {})
  },

  /**
   * Precargar componentes de checkout
   */
  checkout: () => {
    import('@/components/Checkout/CheckoutForm').catch(() => {})
  },

  /**
   * Precargar todos los componentes críticos
   */
  all: () => {
    preloadComponents.shopDetails()
    preloadComponents.checkout()
    // Admin dashboard solo si el usuario es admin
    if (typeof window !== 'undefined' && window.location.pathname.includes('/admin')) {
      preloadComponents.adminDashboard()
    }
  },
}

// ===================================
// PERFORMANCE MONITORING
// ===================================

export function measureComponentLoad(componentName: string) {
  const startTime = performance.now()

  return {
    end: () => {
      const loadTime = performance.now() - startTime

      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName} load time: ${loadTime.toFixed(2)}ms`)
      }

      // Enviar métricas si está configurado
      if (typeof window !== 'undefined' && (window as any).gtag) {
        ;(window as any).gtag('event', 'component_load_time', {
          component_name: componentName,
          load_time: Math.round(loadTime),
        })
      }

      return loadTime
    },
  }
}

// ===================================
// AUTO PRELOAD HOOK
// ===================================

export function useAutoPreload() {
  if (typeof window !== 'undefined') {
    // Precargar después de que la página esté cargada
    window.addEventListener('load', () => {
      setTimeout(() => {
        preloadComponents.all()
      }, 2000) // Esperar 2 segundos después de la carga
    })
  }
}

export default {
  LazyShopDetails,
  LazyAdminDashboard,
  LazyProductGallery,
  LazyCheckoutForm,
  LazyUserDashboard,
  ShopDetailsWithSuspense,
  AdminDashboardWithSuspense,
  ProductGalleryWithSuspense,
  CheckoutFormWithSuspense,
  UserDashboardWithSuspense,
  withLazyLoading,
  preloadComponents,
  measureComponentLoad,
  useAutoPreload,
}
