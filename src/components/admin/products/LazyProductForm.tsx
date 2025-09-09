"use client";

import { lazy, Suspense } from 'react';
import { AdminCard } from '../ui/AdminCard';

// Lazy load del ProductForm principal
const ProductForm = lazy(() => import('./ProductForm'));

// Skeleton optimizado para ProductForm
const ProductFormSkeleton = () => (
  <div className="space-y-6">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
      </div>
      <div className="flex gap-3">
        <div className="w-24 h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Columna principal */}
      <div className="lg:col-span-2 space-y-6">
        {/* Información básica */}
        <AdminCard title="" className="">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-4"></div>
            
            {/* Nombre del producto */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Descripción corta */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Descripción completa */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </AdminCard>

        {/* Detalles del producto */}
        <AdminCard title="" className="">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-44 animate-pulse mb-4"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Marca */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              {/* Modelo */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              {/* SKU */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              {/* Código de barras */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Precios */}
        <AdminCard title="" className="">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse mb-4"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Inventario */}
        <AdminCard title="" className="">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-28 animate-pulse mb-4"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Checkboxes */}
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>

        {/* Variantes */}
        <AdminCard title="" className="">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-28 animate-pulse mb-4"></div>
            
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="w-40 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </AdminCard>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Estado y categoría */}
        <AdminCard title="" className="">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-36 animate-pulse mb-4"></div>
            
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </AdminCard>

        {/* Imágenes */}
        <AdminCard title="" className="">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-28 animate-pulse mb-4"></div>
            
            {/* Imagen principal */}
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse"></div>
            
            {/* Galería */}
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            
            <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </AdminCard>

        {/* SEO */}
        <AdminCard title="" className="">
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-20 animate-pulse mb-4"></div>
            
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-36 animate-pulse"></div>
              <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </AdminCard>
      </div>
    </div>
  </div>
);

// Componente principal con lazy loading
const LazyProductForm = () => {
  return (
    <Suspense fallback={<ProductFormSkeleton />}>
      <ProductForm />
    </Suspense>
  );
};

export default LazyProductForm;
export { ProductFormSkeleton };