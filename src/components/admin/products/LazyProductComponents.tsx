// ===================================
// PINTEYA E-COMMERCE - LAZY PRODUCT COMPONENTS
// Componentes con lazy loading para gestión de productos
// ===================================

'use client'

import React, { lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Package, Search, Filter, Plus, AlertTriangle, Loader2 } from 'lucide-react'

// ===================================
// LAZY IMPORTS
// ===================================

// Lazy loading de componentes de productos
const ProductList = lazy(() => import('./ProductList'))
const ProductForm = lazy(() => import('./ProductForm'))
const ProductFilters = lazy(() => import('./ProductFilters'))
const ProductBulkActions = lazy(() => import('./ProductBulkActions'))

// ===================================
// SKELETON COMPONENTS
// ===================================

function ProductListSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Skeleton className='h-8 w-48 mb-2' />
          <Skeleton className='h-4 w-64' />
        </div>
        <Skeleton className='h-10 w-32' />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='w-5 h-5' />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-10 w-full' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className='overflow-hidden'>
            <div className='aspect-square bg-gray-200'>
              <Skeleton className='h-full w-full' />
            </div>
            <CardContent className='p-4'>
              <Skeleton className='h-5 w-full mb-2' />
              <Skeleton className='h-4 w-24 mb-2' />
              <div className='flex items-center justify-between'>
                <Skeleton className='h-6 w-16' />
                <Skeleton className='h-8 w-20' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between'>
        <Skeleton className='h-4 w-32' />
        <div className='flex items-center space-x-2'>
          <Skeleton className='h-10 w-20' />
          <Skeleton className='h-10 w-10' />
          <Skeleton className='h-10 w-10' />
          <Skeleton className='h-10 w-20' />
        </div>
      </div>
    </div>
  )
}

function ProductFormSkeleton() {
  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Skeleton className='h-8 w-48 mb-2' />
          <Skeleton className='h-4 w-64' />
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-24' />
          <Skeleton className='h-10 w-24' />
        </div>
      </div>

      {/* Form */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Form */}
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent className='space-y-4'>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-10 w-full' />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-32' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-32 w-full' />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-24' />
            </CardHeader>
            <CardContent className='space-y-4'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='space-y-2'>
                  <Skeleton className='h-4 w-20' />
                  <Skeleton className='h-10 w-full' />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-24' />
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 gap-4'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className='aspect-square w-full' />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ProductFiltersSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Filter className='w-5 h-5' />
          <Skeleton className='h-6 w-16' />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='space-y-2'>
              <Skeleton className='h-4 w-20' />
              <Skeleton className='h-10 w-full' />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ===================================
// ERROR BOUNDARY
// ===================================

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ProductErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Product component lazy loading error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex items-center justify-center min-h-[400px]'>
          <Card className='w-full max-w-md'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-red-600'>
                <AlertTriangle className='h-5 w-5' />
                Error de Carga
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600 mb-4'>
                No se pudo cargar el componente de productos. Por favor, intenta nuevamente.
              </p>
              <Button onClick={() => window.location.reload()} className='w-full'>
                <Loader2 className='w-4 h-4 mr-2' />
                Recargar
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// ===================================
// LAZY COMPONENTS
// ===================================

export function LazyProductList(props: any) {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductErrorBoundary>
        <ProductList {...props} />
      </ProductErrorBoundary>
    </Suspense>
  )
}

export function LazyProductForm(props: any) {
  return (
    <Suspense fallback={<ProductFormSkeleton />}>
      <ProductErrorBoundary>
        <ProductForm {...props} />
      </ProductErrorBoundary>
    </Suspense>
  )
}

export function LazyProductFilters(props: any) {
  return (
    <Suspense fallback={<ProductFiltersSkeleton />}>
      <ProductErrorBoundary>
        <ProductFilters {...props} />
      </ProductErrorBoundary>
    </Suspense>
  )
}

export function LazyProductBulkActions(props: any) {
  return (
    <Suspense
      fallback={
        <div className='h-12 flex items-center'>
          <Loader2 className='w-4 h-4 animate-spin' />
        </div>
      }
    >
      <ProductErrorBoundary>
        <ProductBulkActions {...props} />
      </ProductErrorBoundary>
    </Suspense>
  )
}

// ===================================
// PRELOADING HOOKS
// ===================================

export function usePreloadProductComponents() {
  const preloadList = React.useCallback(() => {
    import('./ProductList')
  }, [])

  const preloadForm = React.useCallback(() => {
    import('./ProductForm')
  }, [])

  const preloadFilters = React.useCallback(() => {
    import('./ProductFilters')
  }, [])

  const preloadBulkActions = React.useCallback(() => {
    import('./ProductBulkActions')
  }, [])

  return {
    preloadList,
    preloadForm,
    preloadFilters,
    preloadBulkActions,
  }
}

// ===================================
// PREFETCH COMPONENT
// ===================================

export function ProductComponentsPrefetch() {
  const { preloadList, preloadForm, preloadFilters, preloadBulkActions } =
    usePreloadProductComponents()

  React.useEffect(() => {
    // Precargar componentes después de un delay
    const timer = setTimeout(() => {
      preloadList()
      preloadFilters()
      // Form y BulkActions se cargan bajo demanda
    }, 1500)

    return () => clearTimeout(timer)
  }, [preloadList, preloadFilters])

  return null
}
