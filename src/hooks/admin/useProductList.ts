'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category_id: string;
  category_name?: string;
  image_url?: string;
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
}

interface ProductFilters {
  search?: string;
  category?: string;
  status?: string;
  priceMin?: number;
  priceMax?: number;
  stockMin?: number;
  stockMax?: number;
}

interface ProductListParams {
  page?: number;
  pageSize?: number;
  filters?: ProductFilters;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ✅ MEJORA: Interface para la respuesta de la API (estructura real)
interface ApiProductListResponse {
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

// API Functions
async function fetchProducts(params: ProductListParams): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', params.page.toString());
  // ✅ CORRECCIÓN: Cambiar 'pageSize' a 'limit' para coincidir con la API
  if (params.pageSize) searchParams.set('limit', params.pageSize.toString());
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortOrder) searchParams.set('sortOrder', params.sortOrder);

  // Add filters
  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        searchParams.set(key, value.toString());
      }
    });
  }

  console.log('🔍 Fetching products with params:', searchParams.toString());

  const response = await fetch(`/api/admin/products-direct?${searchParams.toString()}`);

  // ✅ MEJORA: Error handling más detallado siguiendo mejores prácticas
  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ API Error:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      errorText
    });
    throw new Error(`Error fetching products: ${response.status} ${response.statusText}`);
  }

  const apiResponse: ApiProductListResponse = await response.json();

  // ✅ VALIDACIÓN: Verificar estructura de respuesta
  if (!apiResponse.success) {
    console.error('❌ API returned error:', apiResponse);
    throw new Error('API returned unsuccessful response');
  }

  if (!apiResponse.data || !Array.isArray(apiResponse.data.products)) {
    console.error('❌ Invalid API response structure:', apiResponse);
    throw new Error('Invalid API response structure: missing products array');
  }

  console.log('✅ API Response received:', {
    success: apiResponse.success,
    totalProducts: apiResponse.data.total,
    productsCount: apiResponse.data.products.length,
    currentPage: apiResponse.data.pagination.page,
    totalPages: apiResponse.data.pagination.totalPages
  });

  // ✅ CORRECCIÓN CRÍTICA: Transformar respuesta al formato esperado por el hook
  const transformedResponse: ProductListResponse = {
    data: apiResponse.data.products,                          // Extraer products del objeto anidado
    total: apiResponse.data.total,
    page: apiResponse.data.pagination.page,
    pageSize: apiResponse.data.pagination.limit,              // Mapear limit → pageSize
    totalPages: apiResponse.data.pagination.totalPages
  };

  console.log('🔄 Transformed response:', {
    productsCount: transformedResponse.data.length,
    total: transformedResponse.total,
    page: transformedResponse.page,
    pageSize: transformedResponse.pageSize,
    totalPages: transformedResponse.totalPages
  });

  return transformedResponse;
}

async function deleteProduct(productId: string): Promise<void> {
  const response = await fetch(`/api/admin/products-simple/${productId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`Error deleting product: ${response.statusText}`);
  }
}

async function bulkDeleteProducts(productIds: string[]): Promise<void> {
  const response = await fetch('/api/admin/products-simple/bulk', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ids: productIds }),
  });

  if (!response.ok) {
    throw new Error(`Error deleting products: ${response.statusText}`);
  }
}

// Hook
export function useProductList(initialParams: ProductListParams = {}) {
  const [params, setParams] = useState<ProductListParams>({
    page: 1,
    pageSize: 25,
    ...initialParams,
  });

  const queryClient = useQueryClient();

  // ✅ MEJORA: Fetch products query con mejores prácticas de TanStack Query
  const {
    data: productsData,
    isLoading,
    error,
    refetch,
    isFetching,
    isError,
  } = useQuery({
    queryKey: ['admin-products', params],
    queryFn: () => fetchProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3, // ✅ Reintentar 3 veces en caso de error
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // ✅ Backoff exponencial
    refetchOnWindowFocus: false, // ✅ No refetch automático al enfocar ventana
    refetchOnMount: true, // ✅ Refetch al montar componente
    onError: (error) => {
      console.error('❌ Query error in useProductList:', error);
    },
    onSuccess: (data) => {
      console.log('✅ Query success in useProductList:', {
        productsCount: data.data.length,
        total: data.total
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: bulkDeleteProducts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  // Update params
  const updateParams = useCallback((newParams: Partial<ProductListParams>) => {
    setParams(current => ({
      ...current,
      ...newParams,
      // Reset to page 1 when filters change
      ...(newParams.filters && { page: 1 }),
    }));
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    updateParams({
      filters: {
        ...params.filters,
        ...newFilters,
      },
    });
  }, [params.filters, updateParams]);

  // Clear filters
  const clearFilters = useCallback(() => {
    updateParams({ filters: {}, page: 1 });
  }, [updateParams]);

  // Pagination handlers
  const goToPage = useCallback((page: number) => {
    updateParams({ page });
  }, [updateParams]);

  const changePageSize = useCallback((pageSize: number) => {
    updateParams({ pageSize, page: 1 });
  }, [updateParams]);

  // Sorting handlers
  const updateSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc') => {
    updateParams({ sortBy, sortOrder });
  }, [updateParams]);

  // Search handler
  const search = useCallback((searchTerm: string) => {
    updateFilters({ search: searchTerm });
  }, [updateFilters]);

  // Delete handlers
  const handleDeleteProduct = useCallback(async (productId: string) => {
    try {
      await deleteProductMutation.mutateAsync(productId);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }, [deleteProductMutation]);

  const handleBulkDelete = useCallback(async (productIds: string[]) => {
    try {
      await bulkDeleteMutation.mutateAsync(productIds);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }, [bulkDeleteMutation]);

  // Computed values
  const products = productsData?.data || [];
  const total = productsData?.total || 0;
  const totalPages = productsData?.totalPages || 0;
  const currentPage = productsData?.page || 1;
  const currentPageSize = productsData?.pageSize || 25;

  const hasFilters = Object.values(params.filters || {}).some(value => 
    value !== undefined && value !== ''
  );

  return {
    // Data
    products,
    total,
    totalPages,
    currentPage,
    currentPageSize,

    // State
    isLoading,
    isFetching, // ✅ MEJORA: Agregar estado de fetching para indicadores de carga
    isError, // ✅ MEJORA: Agregar estado de error booleano
    error: error as Error | null,
    params,
    hasFilters,

    // Actions
    refetch,
    updateParams,
    updateFilters,
    clearFilters,
    search,

    // Pagination
    goToPage,
    changePageSize,

    // Sorting
    updateSort,

    // Delete operations
    deleteProduct: handleDeleteProduct,
    bulkDelete: handleBulkDelete,
    isDeleting: deleteProductMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,

    // ✅ MEJORA: Información de debugging
    debug: {
      queryKey: ['admin-products', params],
      lastFetch: new Date().toISOString(),
      apiEndpoint: '/api/admin/products-direct',
      transformedData: !!productsData
    }
  };
}
