// ===================================
// PINTEYA E-COMMERCE - HOOK PARA PRODUCTOS
// ===================================

import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/product';
import { ProductFilters, PaginatedResponse, ProductWithCategory } from '@/types/api';
import { getProducts } from '@/lib/api/products';
import { adaptApiProductsToLegacy, ExtendedProduct } from '@/lib/adapters/productAdapter';

interface UseProductsState {
  products: ExtendedProduct[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseProductsOptions {
  initialFilters?: ProductFilters;
  autoFetch?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { initialFilters = {}, autoFetch = true } = options;

  // DEBUG: Log básico para verificar que el hook se ejecuta
  console.log('🔍 HOOK useProducts EJECUTÁNDOSE');

  const [state, setState] = useState<UseProductsState>({
    products: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 12,
      total: 0,
      totalPages: 0,
    },
  });

  const [filters, setFilters] = useState<ProductFilters>(initialFilters);

  /**
   * Obtiene productos desde la API
   */
  const fetchProducts = useCallback(async (newFilters?: ProductFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const filtersToUse = newFilters || filters;
      const response: PaginatedResponse<ProductWithCategory> = await getProducts(filtersToUse);

      if (response.success) {
        // DEBUG CRÍTICO: Log de datos antes del adaptador
        const poximixProducts = response.data.filter(p => p.name?.includes('Poximix'));
        if (poximixProducts.length > 0) {
          console.log('🔍 DEBUG CRÍTICO - DATOS ANTES DEL ADAPTADOR:', poximixProducts.map(p => ({
            id: p.id,
            name: p.name,
            'contiene Poxipol': p.name?.includes('Poxipol')
          })));
        }

        const adaptedProducts = adaptApiProductsToLegacy(response.data);

        // DEBUG CRÍTICO: Log de datos después del adaptador
        const adaptedPoximix = adaptedProducts.filter(p => p.title?.includes('Poximix'));
        if (adaptedPoximix.length > 0) {
          console.log('🔍 DEBUG CRÍTICO - DATOS DESPUÉS DEL ADAPTADOR:', adaptedPoximix.map(p => ({
            id: p.id,
            title: p.title,
            'contiene Poxipol': p.title?.includes('Poxipol')
          })));
        }

        setState(prev => ({
          ...prev,
          products: adaptedProducts,
          loading: false,
          pagination: response.pagination,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Error obteniendo productos',
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error inesperado',
      }));
    }
  }, [filters]);

  /**
   * Actualiza los filtros y obtiene productos
   */
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchProducts(updatedFilters);
  }, [filters, fetchProducts]);

  /**
   * Cambia la página
   */
  const changePage = useCallback((page: number) => {
    updateFilters({ page });
  }, [updateFilters]);

  /**
   * Cambia el límite de productos por página
   */
  const changeLimit = useCallback((limit: number) => {
    updateFilters({ limit, page: 1 });
  }, [updateFilters]);

  /**
   * Cambia el ordenamiento
   */
  const changeSorting = useCallback((sortBy: 'price' | 'name' | 'created_at', sortOrder: 'asc' | 'desc') => {
    updateFilters({ sortBy, sortOrder, page: 1 });
  }, [updateFilters]);

  /**
   * Busca productos por término
   */
  const searchProducts = useCallback((searchTerm: string) => {
    updateFilters({ search: searchTerm, page: 1 });
  }, [updateFilters]);

  /**
   * Filtra por categoría
   */
  const filterByCategory = useCallback((category: string) => {
    updateFilters({ category, page: 1 });
  }, [updateFilters]);

  /**
   * Filtra por rango de precios
   */
  const filterByPriceRange = useCallback((priceMin?: number, priceMax?: number) => {
    updateFilters({ priceMin, priceMax, page: 1 });
  }, [updateFilters]);

  /**
   * Limpia todos los filtros
   */
  const clearFilters = useCallback(() => {
    const clearedFilters: ProductFilters = {
      page: 1,
      limit: filters.limit || 12,
      sortBy: 'created_at',
      sortOrder: 'desc',
    };
    setFilters(clearedFilters);
    fetchProducts(clearedFilters);
  }, [filters.limit, fetchProducts]);

  /**
   * Refresca los productos
   */
  const refresh = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchProducts();
    }
  }, [autoFetch, fetchProducts]);

  return {
    // Estado
    products: state.products,
    loading: state.loading,
    error: state.error,
    pagination: state.pagination,
    filters,

    // Acciones
    fetchProducts,
    updateFilters,
    changePage,
    changeLimit,
    changeSorting,
    searchProducts,
    filterByCategory,
    filterByPriceRange,
    clearFilters,
    refresh,

    // Helpers
    hasProducts: state.products.length > 0,
    isEmpty: !state.loading && state.products.length === 0,
    hasError: !!state.error,
    hasNextPage: state.pagination.page < state.pagination.totalPages,
    hasPrevPage: state.pagination.page > 1,
  };
}
