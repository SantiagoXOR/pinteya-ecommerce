// ===================================
// COMPONENTE: ProductSkeleton - Loading skeleton para productos
// ===================================

"use client";

import React from 'react';
import { cn } from '@/lib/utils';

// ===================================
// TIPOS
// ===================================

export interface ProductSkeletonProps {
  className?: string;
  variant?: 'card' | 'list' | 'grid';
  showBadges?: boolean;
  showPrice?: boolean;
  showButton?: boolean;
}

export interface ProductSkeletonGridProps {
  count?: number;
  className?: string;
  variant?: ProductSkeletonProps['variant'];
}

// ===================================
// COMPONENTE SKELETON INDIVIDUAL
// ===================================

export const ProductSkeleton: React.FC<ProductSkeletonProps> = ({
  className,
  variant = 'card',
  showBadges = true,
  showPrice = true,
  showButton = true,
}) => {
  const baseClasses = "animate-pulse bg-white rounded-lg border border-gray-200 overflow-hidden";
  
  if (variant === 'list') {
    return (
      <div className={cn(baseClasses, "flex gap-4 p-4", className)}>
        {/* Imagen */}
        <div className="w-24 h-24 bg-gray-200 rounded-md flex-shrink-0" />
        
        {/* Contenido */}
        <div className="flex-1 space-y-3">
          {/* Título */}
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          
          {/* Descripción */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-2/3" />
          </div>
          
          {/* Precio */}
          {showPrice && (
            <div className="flex items-center gap-2">
              <div className="h-5 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-16" />
            </div>
          )}
        </div>
        
        {/* Botón */}
        {showButton && (
          <div className="w-24 h-10 bg-gray-200 rounded-lg flex-shrink-0" />
        )}
      </div>
    );
  }

  return (
    <div className={cn(baseClasses, "p-4", className)}>
      {/* Badges */}
      {showBadges && (
        <div className="flex gap-2 mb-3">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
          <div className="h-5 bg-gray-200 rounded-full w-20" />
        </div>
      )}
      
      {/* Imagen */}
      <div className="w-full h-48 bg-gray-200 rounded-md mb-4" />
      
      {/* Título */}
      <div className="h-5 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
      
      {/* Precio */}
      {showPrice && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-6 bg-gray-200 rounded w-24" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
          <div className="h-3 bg-gray-200 rounded w-32" />
        </div>
      )}
      
      {/* Botón */}
      {showButton && (
        <div className="h-10 bg-gray-200 rounded-lg w-full" />
      )}
    </div>
  );
};

// ===================================
// GRID DE SKELETONS
// ===================================

export const ProductSkeletonGrid: React.FC<ProductSkeletonGridProps> = ({
  count = 8,
  className,
  variant = 'card',
}) => {
  return (
    <div className={cn(
      "grid gap-6",
      variant === 'list' 
        ? "grid-cols-1" 
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      className
    )}>
      {Array.from({ length: count }, (_, index) => (
        <ProductSkeleton
          key={index}
          variant={variant}
          className={variant === 'list' ? "max-w-none" : ""}
        />
      ))}
    </div>
  );
};

// ===================================
// SKELETON PARA PÁGINA DE BÚSQUEDA
// ===================================

export const SearchPageSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("min-h-screen bg-gray-50 py-8", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse" />
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </div>

        {/* Filtros skeleton */}
        <div className="flex gap-4 mb-6">
          <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-lg w-28 animate-pulse" />
          <div className="h-10 bg-gray-200 rounded-lg w-36 animate-pulse" />
        </div>

        {/* Grid de productos skeleton */}
        <ProductSkeletonGrid count={12} />
        
        {/* Paginación skeleton */}
        <div className="flex justify-center mt-8">
          <div className="flex gap-2">
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
            <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductSkeleton;
