'use client';

import { useProductList } from '@/hooks/admin/useProductList';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

/**
 * 🧪 PÁGINA DE PRUEBA: Corrección useProductList
 * 
 * Esta página verifica que la corrección del hook useProductList
 * funcione correctamente después de los cambios implementados.
 */
export default function ProductsTestFixPage() {
  const {
    products,
    total,
    totalPages,
    currentPage,
    currentPageSize,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    goToPage,
    debug
  } = useProductList({
    page: 1,
    pageSize: 10
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧪 Test: Corrección useProductList</h1>
          <p className="text-muted-foreground mt-2">
            Verificando que la corrección del panel administrativo funcione correctamente
          </p>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refrescar
        </Button>
      </div>

      {/* Estado del Hook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            ) : isError ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              <CheckCircle className="h-5 w-5 text-green-500" />
            )}
            Estado del Hook
          </CardTitle>
          <CardDescription>
            Estado actual de la consulta de productos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Loading</p>
              <Badge variant={isLoading ? "default" : "secondary"}>
                {isLoading ? "Cargando..." : "Completo"}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Fetching</p>
              <Badge variant={isFetching ? "default" : "secondary"}>
                {isFetching ? "Actualizando..." : "Inactivo"}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Error</p>
              <Badge variant={isError ? "destructive" : "secondary"}>
                {isError ? "Error" : "Sin errores"}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Productos</p>
              <Badge variant="outline">
                {products.length} de {total}
              </Badge>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Error detectado:</span>
              </div>
              <p className="text-red-700 mt-1 text-sm">{error.message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información de Paginación */}
      <Card>
        <CardHeader>
          <CardTitle>📄 Información de Paginación</CardTitle>
          <CardDescription>
            Datos de paginación transformados correctamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium">Página Actual</p>
              <p className="text-2xl font-bold text-blue-600">{currentPage}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Total Páginas</p>
              <p className="text-2xl font-bold text-blue-600">{totalPages}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Por Página</p>
              <p className="text-2xl font-bold text-blue-600">{currentPageSize}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Total Items</p>
              <p className="text-2xl font-bold text-green-600">{total}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Mostrados</p>
              <p className="text-2xl font-bold text-green-600">{products.length}</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1 || isLoading}
            >
              Página 1
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => goToPage(2)}
              disabled={currentPage === 2 || totalPages < 2 || isLoading}
            >
              Página 2
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => goToPage(3)}
              disabled={currentPage === 3 || totalPages < 3 || isLoading}
            >
              Página 3
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Productos */}
      <Card>
        <CardHeader>
          <CardTitle>🛍️ Productos Cargados</CardTitle>
          <CardDescription>
            Lista de productos obtenidos de la API transformada
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Cargando productos...</span>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow"
                >
                  <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-green-600">
                      ${product.price.toLocaleString()}
                    </span>
                    <Badge variant="outline">
                      Stock: {product.stock}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {product.id} | Categoría: {product.category_name || product.category_id}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No se encontraron productos
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información de Debug */}
      <Card>
        <CardHeader>
          <CardTitle>🔧 Información de Debug</CardTitle>
          <CardDescription>
            Datos técnicos para verificar la corrección
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(debug, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Resultado de la Prueba */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {!isLoading && !isError && products.length > 0 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : isError ? (
              <XCircle className="h-5 w-5 text-red-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-500" />
            )}
            Resultado de la Prueba
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading && !isError && products.length > 0 ? (
            <div className="text-green-700 bg-green-50 p-4 rounded-lg">
              <p className="font-medium">✅ CORRECCIÓN EXITOSA</p>
              <p className="text-sm mt-1">
                El hook useProductList está funcionando correctamente. 
                Se cargaron {products.length} productos de un total de {total}.
              </p>
            </div>
          ) : isError ? (
            <div className="text-red-700 bg-red-50 p-4 rounded-lg">
              <p className="font-medium">❌ ERROR DETECTADO</p>
              <p className="text-sm mt-1">
                La corrección no funcionó completamente. Revisar logs de consola.
              </p>
            </div>
          ) : (
            <div className="text-yellow-700 bg-yellow-50 p-4 rounded-lg">
              <p className="font-medium">⏳ PRUEBA EN PROGRESO</p>
              <p className="text-sm mt-1">
                Esperando resultados de la consulta...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
