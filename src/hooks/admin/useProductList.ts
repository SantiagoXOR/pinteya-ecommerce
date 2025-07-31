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

// API Functions
async function fetchProducts(params: ProductListParams): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.pageSize) searchParams.set('pageSize', params.pageSize.toString());
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

  const response = await fetch(`/api/admin/products-direct?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error(`Error fetching products: ${response.statusText}`);
  }

  return response.json();
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

  // Fetch products query
  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['admin-products', params],
    queryFn: () => fetchProducts(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
  };
}
