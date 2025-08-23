import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: number;
  images: {
    main: string;
    gallery: string[];
    previews: string[];
    thumbnails: string[];
  };
  created_at: string;
  updated_at: string;
  category_name: string;
}

interface ProductListResponse {
  success: boolean;
  data: {
    products: Product[];
    total: number;
    pagination: {
      page: number;
      limit: number;
      offset: number;
      totalPages: number;
      hasMore: boolean;
      hasPrevious: boolean;
    };
  };
  meta: {
    timestamp: string;
    method: string;
    user: string;
    role: string;
  };
}

/**
 * Hook estándar para gestión de productos en el panel administrativo
 *
 * Funcionalidades:
 * - Consulta real a la API /api/admin/products-direct
 * - Carga de 25 productos reales de Supabase por página
 * - Información de paginación completa
 * - Datos completos (nombres, precios, stock, categorías, imágenes)
 *
 * @returns {Object} Estado del hook con productos, loading y error
 */
export function useProductList() {
  console.log('🔧 useProductList: Hook iniciado');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        console.log('🔧 useProductList: Iniciando fetch...');
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/admin/products-direct?limit=25');
        console.log('🔧 useProductList: Response status:', response.status);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data: ProductListResponse = await response.json();
        console.log('🔧 useProductList: Respuesta completa:', data);
        console.log('🔧 useProductList: data.success:', data.success);
        console.log('🔧 useProductList: data.data:', data.data);
        console.log('🔧 useProductList: data.data.products:', data.data?.products);

        if (data.success && data.data && Array.isArray(data.data.products)) {
          setProducts(data.data.products);
          console.log('🔧 useProductList: ✅ Productos cargados:', data.data.products.length);
        } else {
          throw new Error('Estructura de respuesta inválida');
        }
      } catch (err) {
        console.error('🔧 useProductList: ❌ Error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return {
    products,
    isLoading,
    error
  };
}

export type { Product, ProductListResponse };
