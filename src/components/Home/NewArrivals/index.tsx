"use client";

import React from "react";
import Link from "next/link";
import ProductItem from "@/components/Common/ProductItem";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";

const NewArrival = () => {
  // Hook para obtener productos más recientes
  const { products, loading, error } = useProducts({
    initialFilters: {
      limit: 8, // Mostrar solo 8 productos
      sortBy: 'created_at',
      sortOrder: 'desc',
    },
  });

  return (
    <section className="overflow-hidden pt-15">
      <div className="max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0">
        {/* Section Header - Migrado al Design System */}
        <div className="mb-7 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2.5 font-medium text-gray-700 mb-1.5">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <span>Esta Semana</span>
              <Badge variant="info" size="sm">
                Nuevos
              </Badge>
            </div>
            <h2 className="font-semibold text-xl xl:text-heading-5 text-gray-900">
              Últimos Productos de Pinturería
            </h2>
          </div>

          {/* Botón migrado al Design System */}
          <Button variant="outline" asChild>
            <Link href="/shop-with-sidebar">
              Ver Todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Loading State - Mejorado con Design System */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-7.5 gap-y-9">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                      <div className="bg-gray-200 h-4 rounded w-1/2"></div>
                      <div className="bg-gray-200 h-6 rounded w-1/3"></div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        ) : error ? (
          /* Error State - Mejorado con Design System */
          <Card variant="outlined" className="border-red-200 bg-red-50">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">
                    Error al cargar productos
                  </h3>
                  <p className="text-red-700 text-sm">{error}</p>
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
        ) : (
          /* Products Grid - Manteniendo ProductItem existente */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-7.5 gap-y-9">
            {products.map((item, key) => (
              <ProductItem item={item} key={key} />
            ))}
          </div>
        )}

        {/* Empty State - Nuevo con Design System */}
        {!loading && !error && products.length === 0 && (
          <Card variant="outlined" className="border-gray-200">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    No hay productos nuevos
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Pronto agregaremos nuevos productos de pinturería
                  </p>
                  <Button variant="outline" asChild>
                    <Link href="/shop-with-sidebar">
                      Ver Catálogo Completo
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
};

export default NewArrival;
