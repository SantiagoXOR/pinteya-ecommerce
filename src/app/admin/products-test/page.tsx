'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, Package } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: string;
  category_name: string | null;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data?: {
    products: Product[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
  error?: string;
  details?: string;
}

export default function ProductsTestPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔍 Fetching products from API...');
      
      const response = await fetch('/api/admin/products-direct?limit=10');
      const data: ApiResponse = await response.json();

      console.log('📊 API Response:', data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.success && data.data) {
        setProducts(data.data.products);
        setTotal(data.data.total);
        setSuccess(`✅ ${data.data.products.length} productos cargados exitosamente de ${data.data.total} totales`);
      } else {
        throw new Error(data.error || 'Respuesta inválida de la API');
      }

    } catch (err) {
      console.error('❌ Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProducts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test de Productos Admin
          </h1>
          <p className="text-gray-600">
            Página de prueba para verificar la API de productos
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Estado de la API
            </CardTitle>
            <CardDescription>
              Prueba de conexión con la API de productos admin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button
                onClick={fetchProducts}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Package className="mr-2 h-4 w-4" />
                    Cargar Productos
                  </>
                )}
              </Button>
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>Error:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {products.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Productos Encontrados ({total} total)</CardTitle>
              <CardDescription>
                Lista de productos obtenidos de la API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {product.description}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-green-600">
                        ${product.price.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500">
                        Stock: {product.stock}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      <p>Categoría: {product.category_name || 'Sin categoría'}</p>
                      <p>ID: {product.id}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Esta página es solo para testing. Si funciona correctamente, 
            el problema está en el panel admin principal.
          </p>
          <div className="space-y-2 text-sm">
            <p><strong>API Endpoint:</strong> /api/admin/products-direct</p>
            <p><strong>Método:</strong> GET</p>
            <p><strong>Autenticación:</strong> Clerk JWT</p>
          </div>
        </div>
      </div>
    </div>
  );
}
