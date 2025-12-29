'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Package, BarChart3, TrendingUp, Plus, RefreshCw } from '@/lib/optimized-imports'
import { useProductsEnterprise } from '@/hooks/admin/useProductsEnterprise'
import { ProductList } from '@/components/admin/products/ProductList'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ProductsPageClient() {
  const router = useRouter()
  const {
    // Datos
    products,
    stats,
    categories,

    // Estados de carga
    isLoading,
    isLoadingProducts,
    isLoadingStats,

    // Errores
    error,

    // Filtros y paginación
    filters,
    updateFilters,
    resetFilters,
    pagination,

    // Operaciones
    refreshProducts,
    refreshStats,
    handleBulkOperation,
    handleProductAction,
    // ✅ NUEVO: Funciones para acciones masivas
    bulkUpdateStatus,
    bulkUpdateCategory,
    bulkDelete,
  } = useProductsEnterprise()

  // =====================================================
  // RENDER
  // =====================================================

  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Productos' },
  ]

  return (
    <AdminLayout title='Productos' breadcrumbs={breadcrumbs}>
      <AdminContentWrapper>
    <div className='space-y-6'>
        {/* Header con Gradiente - Responsive */}
        <div className='bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-4 sm:p-6 text-white'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0'>
        <div>
              <div className='flex items-center space-x-3 mb-2'>
                <Package className='w-6 h-6 sm:w-8 sm:h-8' />
                <h1 className='text-2xl sm:text-3xl font-bold'>Gestión de Productos</h1>
              </div>
              <p className='text-blue-100 text-sm sm:text-base'>
                Administra tu catálogo completo con herramientas profesionales
          </p>
        </div>
            <div className='flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto'>
          <Button
                variant='secondary'
            onClick={async () => {
              // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
              await refreshProducts()
              // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
            }}
            disabled={isLoading}
                className='flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 text-white border-white/30'
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className='hidden sm:inline'>Actualizar</span>
          </Button>
          <Button
            onClick={() => router.push('/admin/products/new')}
                className='flex-1 sm:flex-initial flex items-center justify-center space-x-2 bg-white text-blue-600 hover:bg-blue-50'
          >
            <Plus className='w-4 h-4' />
                <span>Nuevo</span>
          </Button>
            </div>
        </div>
      </div>

        {/* Stats Cards - Mobile First */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
          {/* Total Productos */}
          <Card className='border-t-4 border-t-blue-500 hover:shadow-lg transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>Total Productos</CardTitle>
              <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                <Package className='h-5 w-5 text-blue-600' />
              </div>
          </CardHeader>
          <CardContent>
              <div className='text-3xl font-bold text-gray-900' data-testid='stat-total-products'>
                {isLoadingStats ? (
                  <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                ) : (
                  stats?.totalProducts || 0
                )}
            </div>
              <p className='text-xs text-gray-500 mt-1'>En catálogo</p>
          </CardContent>
        </Card>

          {/* Productos Activos */}
          <Card className='border-t-4 border-t-green-500 hover:shadow-lg transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>Activos</CardTitle>
              <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                <TrendingUp className='h-5 w-5 text-green-600' />
              </div>
          </CardHeader>
          <CardContent>
              <div className='text-3xl font-bold text-gray-900' data-testid='stat-active-products'>
                {isLoadingStats ? (
                  <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                ) : (
                  stats?.activeProducts || 0
                )}
            </div>
              <p className='text-xs text-green-600 mt-1'>Con stock disponible</p>
          </CardContent>
        </Card>

          {/* Stock Bajo */}
          <Card className='border-t-4 border-t-yellow-500 hover:shadow-lg transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>Stock Bajo</CardTitle>
              <div className='w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center'>
                <BarChart3 className='h-5 w-5 text-yellow-600' />
              </div>
          </CardHeader>
          <CardContent>
              <div className='text-3xl font-bold text-gray-900' data-testid='stat-low-stock'>
                {isLoadingStats ? (
                  <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                ) : (
                  stats?.lowStockProducts || 0
                )}
            </div>
              <p className='text-xs text-yellow-600 mt-1'>Requieren atención</p>
          </CardContent>
        </Card>

          {/* Sin Stock */}
          <Card className='border-t-4 border-t-red-500 hover:shadow-lg transition-shadow'>
            <CardHeader className='flex flex-row items-center justify-between pb-2'>
              <CardTitle className='text-sm font-medium text-gray-600'>Sin Stock</CardTitle>
              <div className='w-10 h-10 rounded-full bg-red-100 flex items-center justify-center'>
                <Package className='h-5 w-5 text-red-600' />
              </div>
          </CardHeader>
          <CardContent>
              <div className='text-3xl font-bold text-gray-900' data-testid='stat-out-of-stock'>
                {isLoadingStats ? (
                  <div className='h-9 w-20 bg-gray-200 animate-pulse rounded' />
                ) : (
                  stats?.noStockProducts || 0
                )}
            </div>
              <p className='text-xs text-red-600 mt-1'>Necesitan reposición</p>
          </CardContent>
        </Card>
      </div>

        {/* Tabs Mejoradas */}
        <Tabs 
          defaultValue='all' 
          className='w-full'
          onValueChange={(value) => {
            // Actualizar filtro de stock y resetear página
            if (value === 'all') {
              updateFilters({ stock_status: 'all', page: 1 })
            } else if (value === 'low-stock') {
              updateFilters({ stock_status: 'low_stock', page: 1 })
            } else if (value === 'out-of-stock') {
              updateFilters({ stock_status: 'out_of_stock', page: 1 })
            }
          }}
        >
          <div className='flex justify-center sm:justify-start mb-4'>
            <TabsList className='bg-gray-100 p-1 rounded-lg'>
              <TabsTrigger
                value='all'
                className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5'
              >
                Todos los Productos
                {!isLoading && stats?.totalProducts && (
                  <span className='ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium'>
                    {stats.totalProducts}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value='low-stock'
                className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5'
              >
                Stock Bajo
                {!isLoading && stats?.lowStockProducts > 0 && (
                  <span className='ml-2 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium'>
                    {stats.lowStockProducts}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value='out-of-stock'
                className='data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 py-2.5'
              >
                Sin Stock
                {!isLoading && stats?.noStockProducts > 0 && (
                  <span className='ml-2 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium'>
                    {stats.noStockProducts}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab: Todos los Productos */}
          <TabsContent value='all' className='mt-0'>
            <Card className='border-t-4 border-t-blue-500'>
              <CardContent className='p-0'>
              <ErrorBoundary>
                  <Suspense fallback={<LoadingSkeleton count={5} height={80} />}>
                  <ProductList
                      key={`products-${filters.page}-${filters.limit}-${filters.stock_status || 'all'}`}
                    products={products}
                    isLoading={isLoadingProducts}
                      error={error}
                      onProductAction={handleProductAction}
                    filters={filters}
                    categories={categories}
                    updateFilters={updateFilters}
                    resetFilters={resetFilters}
                    pagination={pagination}
                    // ✅ NUEVO: Funciones para acciones masivas
                    onBulkStatusChange={bulkUpdateStatus}
                    onBulkCategoryChange={bulkUpdateCategory}
                    onBulkDelete={bulkDelete}
                    refreshProducts={refreshProducts}  // ✅ Pasar refreshProducts para refetch directo
                    refreshStats={refreshStats}        // ✅ Pasar refreshStats para actualizar contadores
                  />
                </Suspense>
              </ErrorBoundary>
              </CardContent>
            </Card>
            </TabsContent>

          {/* Tab: Stock Bajo */}
          <TabsContent value='low-stock' className='mt-0'>
            <Card className='border-t-4 border-t-yellow-500'>
              <CardContent className='p-0'>
              <ErrorBoundary>
                  <Suspense fallback={<LoadingSkeleton count={5} height={80} />}>
                    <ProductList
                      key={`products-low-${filters.page}-${filters.limit}`}
                      products={products}
                      isLoading={isLoadingProducts}
                      error={error}
                      onProductAction={handleProductAction}
                      filters={filters}
                      categories={categories}
                      updateFilters={updateFilters}
                      resetFilters={resetFilters}
                      pagination={pagination}
                      // ✅ NUEVO: Funciones para acciones masivas
                      onBulkStatusChange={bulkUpdateStatus}
                      onBulkCategoryChange={bulkUpdateCategory}
                      onBulkDelete={bulkDelete}
                      refreshProducts={refreshProducts}  // ✅ NUEVO: Pasar refreshProducts para refetch directo
                    />
                  </Suspense>
              </ErrorBoundary>
                  </CardContent>
                </Card>
          </TabsContent>

          {/* Tab: Sin Stock */}
          <TabsContent value='out-of-stock' className='mt-0'>
            <Card className='border-t-4 border-t-red-500'>
              <CardContent className='p-0'>
                <ErrorBoundary>
                  <Suspense fallback={<LoadingSkeleton count={5} height={80} />}>
                    <ProductList
                      key={`products-out-${filters.page}-${filters.limit}`}
                      products={products}
                      isLoading={isLoadingProducts}
                      error={error}
                      onProductAction={handleProductAction}
                      filters={filters}
                      categories={categories}
                      updateFilters={updateFilters}
                      resetFilters={resetFilters}
                      pagination={pagination}
                      // ✅ NUEVO: Funciones para acciones masivas
                      onBulkStatusChange={bulkUpdateStatus}
                      onBulkCategoryChange={bulkUpdateCategory}
                      onBulkDelete={bulkDelete}
                      refreshProducts={refreshProducts}  // ✅ NUEVO: Pasar refreshProducts para refetch directo
                    />
                  </Suspense>
                </ErrorBoundary>
                  </CardContent>
                </Card>
            </TabsContent>
          </Tabs>

      {/* Error Display */}
      {error && (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='pt-6'>
            <div className='flex items-center space-x-2 text-red-700'>
              <div className='text-sm'>
                Error: {error instanceof Error ? error.message : 'Error desconocido'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
      </AdminContentWrapper>
    </AdminLayout>
  )
}
