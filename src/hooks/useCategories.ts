// ===================================
// PINTEYA E-COMMERCE - HOOK PARA CATEGORÍAS
// ===================================

import { useState, useEffect, useCallback } from 'react';
import { Category } from '@/types/database';
import { CategoryFilters, ApiResponse } from '@/types/api';
import { getCategories, getMainCategories } from '@/lib/api/categories';

interface UseCategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

interface UseCategoriesOptions {
  initialFilters?: CategoryFilters;
  autoFetch?: boolean;
}

export function useCategories(options: UseCategoriesOptions = {}) {
  const { initialFilters = {}, autoFetch = true } = options;

  const [state, setState] = useState<UseCategoriesState>({
    categories: [],
    loading: false,
    error: null,
  });

  const [filters, setFilters] = useState<CategoryFilters>(initialFilters);

  /**
   * Obtiene categorías desde la API
   */
  const fetchCategories = useCallback(async (newFilters?: CategoryFilters) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Obtener categorías con filtros
      const filtersToUse = newFilters || filters;
      const response = await getCategories(filtersToUse);

      if (response.success) {
        setState(prev => ({
          ...prev,
          categories: response.data || [],
          loading: false,
        }));
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: response.error || 'Error obteniendo categorías',
        }));
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  }, [filters]);

  /**
   * Actualiza los filtros y obtiene categorías
   */
  const updateFilters = useCallback((newFilters: Partial<CategoryFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    fetchCategories(updatedFilters);
  }, [filters, fetchCategories]);

  /**
   * Busca categorías por término
   */
  const searchCategories = useCallback((searchTerm: string) => {
    updateFilters({ search: searchTerm });
  }, [updateFilters]);

  // Función removida ya que no hay jerarquía en la estructura actual

  /**
   * Refresca las categorías
   */
  const refreshCategories = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Auto-fetch al montar el componente
  useEffect(() => {
    if (autoFetch) {
      fetchCategories();
    }
  }, [autoFetch, fetchCategories]);

  return {
    // Estado
    categories: state.categories,
    loading: state.loading,
    error: state.error,
    
    // Acciones
    fetchCategories,
    updateFilters,
    searchCategories,
    refreshCategories,
  };
}

/**
 * Hook específico para obtener todas las categorías
 */
export function useMainCategories() {
  return useCategories();
}

/**
 * Hook para obtener categorías con conteo de productos para filtros
 */
export function useCategoriesForFilters() {
  const { categories, loading, error, refreshCategories } = useCategories();

  // Transformar categorías para el formato esperado por los filtros
  const categoriesForFilters = categories.map(category => ({
    name: category.name,
    products: category.products_count || 0,
    isRefined: false, // Se manejará en el componente
    slug: category.slug,
    id: category.id,
  }));

  return {
    categories: categoriesForFilters,
    loading,
    error,
    refreshCategories,
  };
}









