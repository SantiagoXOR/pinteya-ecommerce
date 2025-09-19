'use client';

import { useState } from 'react';
import { Filter, X, Search, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/core/utils';
import { ProductFilters as ProductFiltersType } from '@/hooks/admin/useProductsEnterprise';

interface Category {
  id: number;
  name: string;
}

interface ProductFiltersProps {
  filters: ProductFiltersType;
  onFiltersChange: (filters: Partial<ProductFiltersType>) => void;
  onClearFilters: () => void;
  categories?: Category[];
  className?: string;
}

const statusOptions = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'all', label: 'Todos' },
];

const stockStatusOptions = [
  { value: 'in_stock', label: 'En Stock' },
  { value: 'low_stock', label: 'Stock Bajo' },
  { value: 'out_of_stock', label: 'Sin Stock' },
  { value: 'all', label: 'Todos' },
];

const sortOptions = [
  { value: 'name', label: 'Nombre' },
  { value: 'price', label: 'Precio' },
  { value: 'stock', label: 'Stock' },
  { value: 'created_at', label: 'Fecha de creación' },
];

const sortOrderOptions = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
];

export function ProductFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  categories = [],
  className
}: ProductFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== ''
  );

  const handleInputChange = (key: keyof ProductFiltersType, value: string | number) => {
    onFiltersChange({ [key]: value === '' ? undefined : value });
  };

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    onFiltersChange({ 
      sort_by: sortBy as ProductFiltersType['sort_by'], 
      sort_order: sortOrder as ProductFiltersType['sort_order'] 
    });
  };

  return (
    <div className={cn("bg-white border border-gray-200 rounded-lg", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
            >
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filtros</span>
              {hasActiveFilters && (
                <span className="bg-blaze-orange-100 text-blaze-orange-800 text-xs px-2 py-1 rounded-full">
                  Activos
                </span>
              )}
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <X className="w-4 h-4" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Bar - Always visible */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar productos por nombre, descripción..."
            value={filters.search || ''}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 space-y-6">
          {/* First Row - Basic Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                value={filters.category_id || ''}
                onChange={(e) => handleInputChange('category_id', Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={filters.status || 'all'}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de Stock
              </label>
              <select
                value={filters.stock_status || 'all'}
                onChange={(e) => handleInputChange('stock_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
              >
                {stockStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marca
              </label>
              <input
                type="text"
                placeholder="Filtrar por marca"
                value={filters.brand || ''}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Second Row - Price and Sort */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de Precio
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Precio mín"
                  value={filters.price_min || ''}
                  onChange={(e) => handleInputChange('price_min', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Precio máx"
                  value={filters.price_max || ''}
                  onChange={(e) => handleInputChange('price_max', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordenar por
              </label>
              <select
                value={filters.sort_by || 'created_at'}
                onChange={(e) => handleSortChange(e.target.value, filters.sort_order || 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orden
              </label>
              <select
                value={filters.sort_order || 'desc'}
                onChange={(e) => handleSortChange(filters.sort_by || 'created_at', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
              >
                {sortOrderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Summary */}
          {hasActiveFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Búsqueda: "{filters.search}"
                    <button
                      onClick={() => handleInputChange('search', '')}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                
                {filters.category_id && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Categoría: {categories.find(c => c.id === filters.category_id)?.name || filters.category_id}
                    <button
                      onClick={() => handleInputChange('category_id', undefined)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                
                {filters.status && filters.status !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Estado: {statusOptions.find(s => s.value === filters.status)?.label || filters.status}
                    <button
                      onClick={() => handleInputChange('status', 'all')}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.stock_status && filters.stock_status !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Stock: {stockStatusOptions.find(s => s.value === filters.stock_status)?.label || filters.stock_status}
                    <button
                      onClick={() => handleInputChange('stock_status', 'all')}
                      className="ml-2 text-orange-600 hover:text-orange-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {filters.brand && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    Marca: {filters.brand}
                    <button
                      onClick={() => handleInputChange('brand', '')}
                      className="ml-2 text-indigo-600 hover:text-indigo-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                
                {(filters.price_min || filters.price_max) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Precio: ${filters.price_min || 0} - ${filters.price_max || '∞'}
                    <button
                      onClick={() => {
                        handleInputChange('price_min', undefined);
                        handleInputChange('price_max', undefined);
                      }}
                      className="ml-2 text-yellow-600 hover:text-yellow-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {((filters.sort_by && filters.sort_by !== 'created_at') || (filters.sort_order && filters.sort_order !== 'desc')) && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Orden: {sortOptions.find(s => s.value === filters.sort_by)?.label} ({sortOrderOptions.find(s => s.value === filters.sort_order)?.label})
                    <button
                      onClick={() => handleSortChange('created_at', 'desc')}
                      className="ml-2 text-gray-600 hover:text-gray-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}









