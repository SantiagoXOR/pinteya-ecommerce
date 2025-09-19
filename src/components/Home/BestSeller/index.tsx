"use client";

import React from "react";
import SingleItem from "./SingleItem";
import Link from "next/link";
import { useFilteredProducts } from "@/hooks/useFilteredProducts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, ArrowRight, Trophy } from "@/lib/optimized-imports";

interface BestSellerProps {
  selectedCategories?: string[];
}

const BestSeller: React.FC<BestSellerProps> = ({ selectedCategories = [] }) => {
  const { data, isLoading, error } = useFilteredProducts({
    categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    limit: 6,
    sortBy: 'price',
    sortOrder: 'desc'
  });

  // Obtener productos y filtrar los que tienen descuento
  const products = data?.data || [];
  const bestSellerProducts = products.filter(product =>
    product.discountedPrice && product.discountedPrice < product.price
  ).slice(0, 6);

  // Mostrar título dinámico según si hay filtros activos
  const sectionTitle = selectedCategories.length > 0
    ? `Mejores Ofertas en ${selectedCategories.length === 1 ? 'esta categoría' : 'estas categorías'}`
    : 'Mejores Ofertas';

  if (isLoading) {
    return (
      <section className="overflow-hidden py-4 sm:py-8">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          {/* Header con Design System */}
          <div className="mb-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2.5 font-medium text-gray-700 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Trophy className="w-3 h-3 text-yellow-600" />
                </div>
                <span>Este Mes</span>
                <Badge variant="warning" size="sm">
                  Top
                </Badge>
              </div>
              <h2 className="font-semibold text-xl xl:text-heading-5 text-gray-900">
                Más Vendidos
              </h2>
            </div>
          </div>

          {/* Loading State mejorado - Mobile-First 2 columnas */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-7.5">
            {[...Array(6)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="animate-pulse">
                  <div className="bg-gray-200 h-40 md:h-64 rounded-t-lg"></div>
                  <CardContent className="p-2 md:p-4">
                    <div className="space-y-2 md:space-y-3">
                      <div className="bg-gray-200 h-3 md:h-4 rounded w-3/4"></div>
                      <div className="bg-gray-200 h-3 md:h-4 rounded w-1/2"></div>
                      <div className="bg-gray-200 h-4 md:h-6 rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="overflow-hidden py-4 sm:py-8">
        <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
          {/* Error State mejorado */}
          <Card variant="outlined" className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    Error al cargar productos más vendidos
                  </h3>
                  <p className="text-red-700 text-sm">
                    {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="border-red-300 text-red-700 hover:bg-red-100"
                >
                  Reintentar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden py-4 sm:py-8">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* Section Header - Migrado al Design System */}
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 font-medium text-gray-700 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-yellow-100 flex items-center justify-center">
                <Trophy className="w-3 h-3 text-yellow-600" />
              </div>
              <span>Este Mes</span>
              <Badge variant="warning" size="sm">
                Top
              </Badge>
            </div>
            <h2 className="font-semibold text-xl xl:text-heading-5 text-gray-900">
              {sectionTitle}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-7.5">
          {/* Best Sellers Grid - Mobile-First 2 columnas */}
          {bestSellerProducts.length > 0 ? (
            bestSellerProducts.map((item, key) => (
              <SingleItem item={item} key={key} />
            ))
          ) : (
            /* Empty State mejorado */
            <div className="col-span-full">
              <Card variant="outlined" className="border-gray-200">
                <CardContent className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        No hay productos en oferta
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">
                        Pronto tendremos nuevas ofertas disponibles
                      </p>
                      <Button variant="outline" asChild>
                        <Link href="/shop">
                          Ver Catálogo Completo
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* CTA Button mejorado */}
        {bestSellerProducts.length > 0 && (
          <div className="text-center mt-12.5">
            <Button variant="outline" size="lg" asChild>
              <Link href="/shop">
                Ver Todos los Productos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default BestSeller;









