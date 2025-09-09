// =====================================================
// PÁGINA: GESTIÓN DE PRODUCTOS ENTERPRISE
// Ruta: /admin/products
// Descripción: Dashboard principal del módulo de productos
// Incluye: Import/Export, Operaciones masivas, Gestión avanzada
// =====================================================

'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Package,
  BarChart3,
  TrendingUp,
  Plus,
  RefreshCw,
  Download,
  Upload,
  Settings
} from 'lucide-react';
import { useProductsEnterprise } from '@/hooks/admin/useProductsEnterprise';
import { ProductBulkOperations } from '@/components/admin/products/ProductBulkOperations';
import { ProductList } from '@/components/admin/products/ProductList';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export default function ProductsPage() {
  const router = useRouter();
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

    // Acciones CRUD
    createProduct,
    updateProduct,
    refetchProducts,

    // Operaciones masivas
    bulkUpdateStatus,
    bulkUpdateCategory,
    bulkDelete,

    // Import/Export
    importProducts,
    exportProducts,

    // Estados de mutations
    isCreating,
    isUpdating,
    isBulkOperating,
    isImporting,

    // Métricas derivadas
    derivedMetrics
  } = useProductsEnterprise();

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleCreateProduct = () => {
    router.push('/admin/products/new');
  };

  const handleBulkUpdateStatus = async (productIds: string[], status: 'active' | 'inactive') => {
    try {
      await bulkUpdateStatus(productIds, status);
    } catch (error) {
      console.error('Error en actualización masiva de estado:', error);
    }
  };

  const handleBulkUpdateCategory = async (productIds: string[], categoryId: number) => {
    try {
      await bulkUpdateCategory(productIds, categoryId);
    } catch (error) {
      console.error('Error en actualización masiva de categoría:', error);
    }
  };

  const handleBulkDelete = async (productIds: string[]) => {
    try {
      await bulkDelete(productIds);
    } catch (error) {
      console.error('Error en eliminación masiva:', error);
    }
  };

  const handleImportProducts = async (file: File) => {
    try {
      await importProducts(file);
    } catch (error) {
      console.error('Error en importación:', error);
    }
  };

  const handleExportProducts = async () => {
    try {
      await exportProducts();
    } catch (error) {
      console.error('Error en exportación:', error);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  if (error) {
    return (
      <ErrorBoundary
        error={error}
        onRetry={refetchProducts}
        title="Error al cargar productos"
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Productos</h1>
          <p className="text-muted-foreground">
            Sistema enterprise para gestión completa de productos e inventario
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchProducts()}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportProducts}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </Button>

          <Button
            onClick={handleCreateProduct}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Productos
                  </p>
                  <p className="text-2xl font-bold">
                    {(stats.total_products || 0).toLocaleString()}
                  </p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Productos Activos
                  </p>
                  <p className="text-2xl font-bold">
                    {(stats.active_products || 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Stock Bajo
                  </p>
                  <p className="text-2xl font-bold">
                    {(stats.low_stock_products || 0).toLocaleString()}
                  </p>
                </div>
                <Package className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Valor Total
                  </p>
                  <p className="text-2xl font-bold">
                    ${(stats.total_value || 0).toLocaleString()}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Operaciones Masivas */}
      <ProductBulkOperations
        selectedProducts={[]} // TODO: Implementar selección desde lista
        categories={categories}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onBulkUpdateCategory={handleBulkUpdateCategory}
        onBulkDelete={handleBulkDelete}
        onImportProducts={handleImportProducts}
        onExportProducts={handleExportProducts}
        isLoading={isBulkOperating || isImporting}
      />

      {/* Contenido principal en tabs */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Productos ({derivedMetrics.totalProducts})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Inventario
          </TabsTrigger>
        </TabsList>

        {/* Tab: Lista de Productos */}
        <TabsContent value="products">
          <ProductList />
        </TabsContent>

        {/* Tab: Analytics */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Productos</CardTitle>
              <CardDescription>
                Análisis detallado de performance y tendencias
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Analytics en desarrollo</h3>
                <p className="text-muted-foreground">
                  Los gráficos de analytics estarán disponibles próximamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Inventario */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Inventario</CardTitle>
              <CardDescription>
                Control avanzado de stock y alertas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inventario en desarrollo</h3>
                <p className="text-muted-foreground">
                  El sistema de inventario avanzado estará disponible próximamente.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Indicadores de estado */}
      {(isCreating || isUpdating || isBulkOperating || isImporting) && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            {isCreating && "Creando producto..."}
            {isUpdating && "Actualizando producto..."}
            {isBulkOperating && "Procesando operación masiva..."}
            {isImporting && "Importando productos..."}
          </div>
        </div>
      )}
    </div>
  );
}
