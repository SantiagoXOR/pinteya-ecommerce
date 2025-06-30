'use client';

// ===================================
// DEMO: Funcionalidades de Marcas
// ===================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { BrandFilter, BrandFilterCompact } from '@/components/ui/brand-filter';
import { CommercialProductCard } from '@/components/ui/product-card-commercial';
import { useBrandFilter } from '@/hooks/useBrandFilter';
import { getProducts } from '@/lib/api/products';
import { getBrandColor, formatBrandName } from '@/lib/api/brands';
import { ProductWithCategory } from '@/types/api';

export default function BrandFeaturesDemo() {
  const [products, setProducts] = useState<ProductWithCategory[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  
  // Hook de filtro de marcas
  const {
    brands,
    selectedBrands,
    isLoading: isLoadingBrands,
    error,
    setSelectedBrands,
    toggleBrand,
    clearBrands,
  } = useBrandFilter({
    autoLoad: true,
    minProducts: 1,
  });

  // Cargar productos cuando cambian las marcas seleccionadas
  useEffect(() => {
    const loadProducts = async () => {
      setIsLoadingProducts(true);
      try {
        const filters = selectedBrands.length > 0 
          ? { brand: selectedBrands[0], limit: 6 } // Solo primera marca para demo
          : { limit: 6 };
        
        const response = await getProducts(filters);
        if (response.success) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error('Error cargando productos:', error);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    loadProducts();
  }, [selectedBrands]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🏷️ Demo: Funcionalidades de Marcas
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Demostración de las nuevas funcionalidades de marcas implementadas en Pinteya E-commerce.
            Incluye filtros, visualización y APIs actualizadas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar con filtros */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Filtro de marcas completo */}
            <BrandFilter
              brands={brands}
              selectedBrands={selectedBrands}
              onBrandChange={setSelectedBrands}
              isLoading={isLoadingBrands}
              showSearch={true}
              showProductCount={true}
            />

            {/* Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Estadísticas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Total marcas:</span>
                  <Badge variant="outline">{brands.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Marcas seleccionadas:</span>
                  <Badge variant="secondary">{selectedBrands.length}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Productos mostrados:</span>
                  <Badge variant="outline">{products.length}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Acciones */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearBrands}
                  className="w-full"
                  disabled={selectedBrands.length === 0}
                >
                  Limpiar filtros
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setSelectedBrands(['El Galgo', 'Akapol'])}
                  className="w-full"
                >
                  Seleccionar populares
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Filtro compacto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtro Compacto de Marcas</CardTitle>
              </CardHeader>
              <CardContent>
                <BrandFilterCompact
                  brands={brands}
                  selectedBrands={selectedBrands}
                  onBrandChange={setSelectedBrands}
                />
              </CardContent>
            </Card>

            {/* Información de marcas seleccionadas */}
            {selectedBrands.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Marcas Activas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedBrands.map(brandName => {
                      const brand = brands.find(b => b.name === brandName);
                      return (
                        <div 
                          key={brandName}
                          className="flex items-center justify-between p-3 border rounded-lg"
                          style={{ borderColor: getBrandColor(brandName) }}
                        >
                          <div>
                            <h4 className="font-semibold">{formatBrandName(brandName)}</h4>
                            <p className="text-sm text-gray-600">
                              {brand?.products_count || 0} productos
                            </p>
                          </div>
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: getBrandColor(brandName) }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <Separator />

            {/* Grid de productos */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Productos {selectedBrands.length > 0 && `de ${selectedBrands.join(', ')}`}
                </h2>
                {isLoadingProducts && (
                  <Badge variant="outline">Cargando...</Badge>
                )}
              </div>

              {error && (
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <p className="text-red-600">Error: {error}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {products.map((product) => (
                  <CommercialProductCard
                    key={product.id}
                    image={product.images?.previews?.[0] || '/images/products/placeholder.svg'}
                    title={product.name}
                    brand={product.brand ?? "Marca"}
                    price={product.discounted_price || product.price}
                    originalPrice={product.discounted_price ? product.price : undefined}
                    stock={product.stock}
                    cta="Ver detalles"
                    onAddToCart={() => console.log(`Agregado: ${product.name}`)}
                    shippingText={product.discounted_price ? "Oferta" : "Disponible"}
                    freeShipping={(product.discounted_price || product.price) >= 15000}
                  />
                ))}
              </div>

              {products.length === 0 && !isLoadingProducts && (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-gray-600">
                      {selectedBrands.length > 0 
                        ? 'No se encontraron productos para las marcas seleccionadas'
                        : 'No hay productos disponibles'
                      }
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Información técnica */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información Técnica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">APIs Implementadas:</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• <code>GET /api/brands</code> - Lista de marcas con conteo</li>
                    <li>• <code>GET /api/products?brand=X</code> - Filtro por marca</li>
                    <li>• <code>GET /api/products?search=X</code> - Búsqueda incluye marcas</li>
                    <li>• <code>GET /api/products?sortBy=brand</code> - Ordenamiento por marca</li>
                  </ul>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-2">Componentes Nuevos:</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• <code>BrandFilter</code> - Filtro completo con búsqueda</li>
                    <li>• <code>BrandFilterCompact</code> - Filtro compacto con badges</li>
                    <li>• <code>useBrandFilter</code> - Hook para manejo de estado</li>
                    <li>• <code>CommercialProductCard</code> - Actualizado con visualización de marca</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
