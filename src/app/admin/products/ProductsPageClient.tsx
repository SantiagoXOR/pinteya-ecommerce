'use client'

import { Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  BarChart3,
  TrendingUp,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Settings,
} from 'lucide-react'
import { useProductsEnterprise } from '@/hooks/admin/useProductsEnterprise'
import { ProductBulkOperations } from '@/components/admin/products/ProductBulkOperations'
import { ProductList } from '@/components/admin/products/ProductList'
import { LoadingSkeleton } from '@/components/ui/loading-skeleton'
import { ErrorBoundary } from '@/components/ui/error-boundary'

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
    handleBulkOperation,
    handleProductAction,
  } = useProductsEnterprise()

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Gestión de Productos</h1>
          <p className='text-gray-600 mt-1'>
            Administra tu catálogo de productos con herramientas enterprise
          </p>
        </div>
        <div className='flex items-center space-x-3'>
          <Button
            variant='outline'
            onClick={refreshProducts}
            disabled={isLoading}
            className='flex items-center space-x-2'
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>
          <Button
            onClick={() => router.push('/admin/products/new')}
            className='flex items-center space-x-2 bg-blue-600 hover:bg-blue-700'
          >
            <Plus className='w-4 h-4' />
            <span>Nuevo Producto</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Productos</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoadingStats ? '...' : stats?.totalProducts || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              {stats?.activeProducts || 0} activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Stock Bajo</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {isLoadingStats ? '...' : stats?.lowStockProducts || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Sin Stock</CardTitle>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {isLoadingStats ? '...' : stats?.noStockProducts || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              Necesitan reposición
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Categorías</CardTitle>
            <Settings className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {isLoadingStats ? '...' : categories?.length || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              Categorías activas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Gestión de Productos</CardTitle>
          <CardDescription>
            Administra tu inventario con herramientas avanzadas de gestión
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='products' className='space-y-4'>
            <TabsList>
              <TabsTrigger value='products'>Productos</TabsTrigger>
              <TabsTrigger value='bulk'>Operaciones Masivas</TabsTrigger>
              <TabsTrigger value='import'>Importar/Exportar</TabsTrigger>
            </TabsList>

            <TabsContent value='products' className='space-y-4'>
              <ErrorBoundary>
                <Suspense fallback={<LoadingSkeleton />}>
                  <ProductList
                    products={products}
                    isLoading={isLoadingProducts}
                    filters={filters}
                    updateFilters={updateFilters}
                    resetFilters={resetFilters}
                    pagination={pagination}
                    onProductAction={handleProductAction}
                  />
                </Suspense>
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value='bulk' className='space-y-4'>
              <ErrorBoundary>
                <ProductBulkOperations
                  onBulkOperation={handleBulkOperation}
                  selectedProducts={[]}
                  isLoading={isLoading}
                />
              </ErrorBoundary>
            </TabsContent>

            <TabsContent value='import' className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center space-x-2'>
                      <Upload className='w-5 h-5' />
                      <span>Importar Productos</span>
                    </CardTitle>
                    <CardDescription>
                      Importa productos desde un archivo CSV
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className='w-full' variant='outline'>
                      Seleccionar Archivo CSV
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center space-x-2'>
                      <Download className='w-5 h-5' />
                      <span>Exportar Productos</span>
                    </CardTitle>
                    <CardDescription>
                      Exporta tu catálogo completo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className='w-full' variant='outline'>
                      Descargar CSV
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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
  )
}
