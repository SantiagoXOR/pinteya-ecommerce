"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { searchProducts } from '@/lib/api/products';
import { ProductWithCategory } from '@/types/api';
import { ProductCard } from '@/components/ui';
import { Search, AlertCircle, Package, Filter, SortAsc } from 'lucide-react';
import { ProductSkeletonGrid } from '@/components/ui/product-skeleton';
import { Button } from '@/components/ui/button';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('search') || '';
  const category = searchParams.get('category');

  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'price-asc' | 'price-desc' | 'name'>('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Función para ordenar productos
  const sortProducts = (products: ProductWithCategory[], sortBy: string) => {
    const sorted = [...products];

    switch (sortBy) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'relevance':
      default:
        return sorted; // Mantener orden original (relevancia)
    }
  };

  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('🔍 Buscando productos para:', query);
        const response = await searchProducts(query, 50); // Más resultados para la página

        if (response.success && response.data) {
          const sortedProducts = sortProducts(response.data, sortBy);
          setProducts(sortedProducts);
          setTotalResults(response.pagination?.total || response.data.length);
        } else {
          setProducts([]);
          setTotalResults(0);
          setError(response.error || 'No se encontraron resultados');
        }
      } catch (err) {
        console.error('❌ Error en búsqueda:', err);
        setProducts([]);
        setTotalResults(0);
        setError('Error al realizar la búsqueda. Intenta nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query, category, sortBy]);

  // Estado de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blaze-orange-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Buscando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  // Sin query de búsqueda
  if (!query.trim()) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Busca productos de pinturería
            </h1>
            <p className="text-gray-600">
              Usa el buscador para encontrar pinturas, herramientas y accesorios
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header de resultados */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-blaze-orange-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Resultados de búsqueda
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-lg text-gray-700">
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-blaze-orange-500 border-t-transparent rounded-full" />
                    Buscando productos...
                  </span>
                ) : (
                  <>
                    Búsqueda: <span className="font-semibold">"{query}"</span>
                  </>
                )}
              </p>
              {category && (
                <p className="text-sm text-gray-600">
                  Categoría: <span className="font-medium">{category}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {isLoading ? (
                  <span>Cargando...</span>
                ) : totalResults > 0 ? (
                  <span>{totalResults} producto{totalResults !== 1 ? 's' : ''} encontrado{totalResults !== 1 ? 's' : ''}</span>
                ) : (
                  <span>Sin resultados</span>
                )}
              </div>

              {/* Controles de vista y ordenamiento */}
              {!isLoading && totalResults > 0 && (
                <div className="flex items-center gap-3">
                  {/* Selector de ordenamiento */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blaze-orange-500 focus:border-blaze-orange-500"
                  >
                    <option value="relevance">Más relevante</option>
                    <option value="price-asc">Precio: menor a mayor</option>
                    <option value="price-desc">Precio: mayor a menor</option>
                    <option value="name">Nombre A-Z</option>
                  </select>

                  {/* Selector de vista */}
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`px-3 py-2 text-sm ${
                        viewMode === 'grid'
                          ? 'bg-blaze-orange-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Grid
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-2 text-sm ${
                        viewMode === 'list'
                          ? 'bg-blaze-orange-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Lista
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        {isLoading ? (
          // Estado de loading con skeletons
          <ProductSkeletonGrid
            count={12}
            variant={viewMode === 'list' ? 'list' : 'card'}
            className={viewMode === 'list' ? 'grid-cols-1' : ''}
          />
        ) : error ? (
          // Estado de error
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error en la búsqueda
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white"
            >
              Intentar nuevamente
            </Button>
          </div>
        ) : products.length === 0 ? (
          // Sin resultados
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No se encontraron productos
            </h2>
            <p className="text-gray-600 mb-6">
              No hay productos que coincidan con tu búsqueda "{query}"
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Sugerencias:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Verifica la ortografía</li>
                <li>Usa términos más generales</li>
                <li>Prueba con sinónimos</li>
                <li>Busca por marca o categoría</li>
              </ul>
            </div>
          </div>
        ) : (
          // Resultados de productos
          <div className={`gap-6 ${
            viewMode === 'list'
              ? 'space-y-4'
              : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }`}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                className={`bg-white shadow-sm hover:shadow-md transition-shadow ${
                  viewMode === 'list' ? 'flex flex-row items-center p-4' : ''
                }`}
              />
            ))}
          </div>
        )}

        {/* Paginación futura */}
        {!isLoading && !error && products.length > 0 && totalResults > 50 && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2">
              <Button variant="outline" disabled>
                Anterior
              </Button>
              <Button variant="outline" className="bg-blaze-orange-500 text-white">
                1
              </Button>
              <Button variant="outline">
                2
              </Button>
              <Button variant="outline">
                3
              </Button>
              <Button variant="outline">
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Información adicional */}
        {products.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ¿No encontraste lo que buscabas?
              </h3>
              <p className="text-gray-600 mb-4">
                Contáctanos y te ayudamos a encontrar el producto perfecto
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Contactar asesor
                </a>
                <a
                  href="/shop"
                  className="border border-blaze-orange-600 text-blaze-orange-600 hover:bg-blaze-orange-50 px-6 py-2 rounded-lg transition-colors"
                >
                  Ver todos los productos
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
