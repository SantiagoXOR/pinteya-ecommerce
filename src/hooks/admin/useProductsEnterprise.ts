// =====================================================
// HOOK: useProductsEnterprise
// Descripción: Hook enterprise para gestión avanzada de productos
// Incluye: Import/Export, Variantes, Inventario, Operaciones masivas
// =====================================================

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { logger } from '@/lib/utils/logger'

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface ProductVariant {
  id: string
  product_id: string
  name: string
  sku: string
  price: number
  stock: number
  attributes: Record<string, string> // { color: 'rojo', size: 'M' }
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  discounted_price?: number
  stock: number
  category_id: number
  category_name?: string
  brand?: string
  sku?: string
  images: string[]
  is_active: boolean
  is_featured: boolean
  variants?: ProductVariant[]
  created_at: string
  updated_at: string
}

export interface ProductFilters {
  page: number
  limit: number
  search?: string
  category_id?: number
  brand?: string
  status?: 'active' | 'inactive' | 'all'
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'all'
  price_min?: number
  price_max?: number
  sort_by?: 'name' | 'price' | 'stock' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export interface ProductStats {
  total_products: number
  active_products: number
  inactive_products: number
  low_stock_products: number
  out_of_stock_products: number
  total_value: number
  average_price: number
  featured_products: number
}

export interface BulkOperation {
  operation: 'update_status' | 'update_category' | 'update_price' | 'delete'
  product_ids: string[]
  data?: any
}

export interface ImportResult {
  success: boolean
  imported_count: number
  failed_count: number
  errors: Array<{ row: number; error: string }>
}

// =====================================================
// HOOK PRINCIPAL
// =====================================================

export function useProductsEnterprise(initialFilters?: Partial<ProductFilters>) {
  const queryClient = useQueryClient()

  // Estado local para filtros
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    limit: 25,
    sort_by: 'created_at',
    sort_order: 'desc',
    status: 'all',
    stock_status: 'all',
    ...initialFilters,
  })

  // =====================================================
  // QUERIES
  // =====================================================

  // Query para lista de productos
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['admin-products', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          params.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/admin/products?${params}`)
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      logger.dev('[useProductsEnterprise] API Response:', {
        productsCount: data?.data?.length,
        count: data?.count,
        total: data?.total,
      })
      return data
    },
    enabled: filters.page > 0 && filters.limit > 0,
    staleTime: 30000,          // 30 seg - datos frescos
    gcTime: 300000,            // 5 min - mantener en memoria (cacheTime deprecado, usar gcTime)
    refetchOnWindowFocus: false,
  })

  // Query para estadísticas
  const {
    data: statsData,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['admin-products-stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/products/stats')
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      logger.dev('[useProductsEnterprise] Stats Response:', data?.stats)
      return data
    },
    staleTime: 60000,          // 1 min - stats cambian menos frecuentemente
    gcTime: 600000,            // 10 min
    refetchOnWindowFocus: false,
  })

  // Query para categorías
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/categories')
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }
      return response.json()
    },
    staleTime: 300000,         // 5 min - categorías casi nunca cambian
    gcTime: 3600000,           // 1 hora
    refetchOnWindowFocus: false,
  })

  // =====================================================
  // MUTATIONS
  // =====================================================

  // Mutation para crear producto
  const createProductMutation = useMutation({
    mutationFn: async (productData: Partial<Product>) => {
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-products-stats'] })
    },
  })

  // Mutation para actualizar producto
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-products-stats'] })
    },
  })

  // Mutation para operaciones masivas
  const bulkOperationMutation = useMutation({
    mutationFn: async (operation: BulkOperation) => {
      const response = await fetch('/api/admin/products/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation),
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-products-stats'] })
    },
  })

  // Mutation para importar productos
  const importProductsMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/products/import', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-products-stats'] })
    },
  })

  // =====================================================
  // FUNCIONES AUXILIARES
  // =====================================================

  const updateFilters = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      page: 1,
      limit: 25,
      sort_by: 'created_at',
      sort_order: 'desc',
      status: 'all',
      stock_status: 'all',
    })
  }, [])

  const createProduct = useCallback(
    (productData: Partial<Product>) => {
      return createProductMutation.mutateAsync(productData)
    },
    [createProductMutation]
  )

  const updateProduct = useCallback(
    (id: string, data: Partial<Product>) => {
      return updateProductMutation.mutateAsync({ id, data })
    },
    [updateProductMutation]
  )

  const bulkUpdateStatus = useCallback(
    (productIds: string[], status: 'active' | 'inactive') => {
      return bulkOperationMutation.mutateAsync({
        operation: 'update_status',
        product_ids: productIds,
        data: { status },
      })
    },
    [bulkOperationMutation]
  )

  const bulkUpdateCategory = useCallback(
    (productIds: string[], categoryId: number) => {
      return bulkOperationMutation.mutateAsync({
        operation: 'update_category',
        product_ids: productIds,
        data: { category_id: categoryId },
      })
    },
    [bulkOperationMutation]
  )

  const bulkDelete = useCallback(
    (productIds: string[]) => {
      return bulkOperationMutation.mutateAsync({
        operation: 'delete',
        product_ids: productIds,
      })
    },
    [bulkOperationMutation]
  )

  const importProducts = useCallback(
    (file: File) => {
      return importProductsMutation.mutateAsync(file)
    },
    [importProductsMutation]
  )

  const exportProducts = useCallback(async () => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params.append(key, value.toString())
      }
    })

    const response = await fetch(`/api/admin/products/export?${params}`)
    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `productos-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }, [filters])

  // =====================================================
  // MÉTRICAS DERIVADAS
  // =====================================================

  // Calcular total de productos y páginas de forma consistente
  const totalProducts = productsData?.total || productsData?.count || 0
  const totalPages = Math.ceil(totalProducts / filters.limit) || 1
  
  logger.dev('[useProductsEnterprise] Paginación:', {
    totalProducts,
    limit: filters.limit,
    totalPages,
    currentPage: filters.page,
  })

  const derivedMetrics = {
    // La API retorna 'total' (no 'count')
    totalProducts,
    totalPages,
    currentPage: filters.page,
    hasNextPage: filters.page < totalPages,
    hasPrevPage: filters.page > 1,

    // Estadísticas calculadas
    stockHealthScore: statsData?.data
      ? ((statsData.data.active_products / statsData.data.total_products) * 100).toFixed(1)
      : '0',

    lowStockPercentage: statsData?.data
      ? ((statsData.data.low_stock_products / statsData.data.total_products) * 100).toFixed(1)
      : '0',

    averageStockValue: statsData?.data
      ? (statsData.data.total_value / statsData.data.total_products).toFixed(0)
      : '0',
  }

  // =====================================================
  // RETURN
  // =====================================================

  return {
    // Datos ya transformados por el API - NO transformar de nuevo
    products: productsData?.data || [],
    // Transformar stats de snake_case a camelCase
    stats: statsData?.stats ? {
      totalProducts: statsData.stats.total_products,
      activeProducts: statsData.stats.active_products,
      lowStockProducts: statsData.stats.low_stock_products,
      noStockProducts: statsData.stats.no_stock_products,
    } : null,
    categories: categoriesData?.data || [],

    // Estados de carga
    isLoading: productsLoading || statsLoading,
    isLoadingProducts: productsLoading,
    isLoadingStats: statsLoading,
    isLoadingCategories: categoriesLoading,

    // Errores
    error: productsError || statsError,
    productsError,
    statsError,

    // Filtros y paginación
    filters,
    updateFilters,
    resetFilters,

    // Acciones CRUD
    createProduct,
    updateProduct,
    refetchProducts,

    // Operaciones masivas
    bulkUpdateStatus,
    bulkUpdateCategory,
    bulkDelete,

    // Import/Export
    importProducts,
    exportProducts,

    // Estados de mutations
    isCreating: createProductMutation.isPending,
    isUpdating: updateProductMutation.isPending,
    isBulkOperating: bulkOperationMutation.isPending,
    isImporting: importProductsMutation.isPending,

    // Métricas derivadas
    derivedMetrics,

    // Paginación helpers
    pagination: {
      currentPage: filters.page,
      totalPages: derivedMetrics.totalPages,
      totalItems: derivedMetrics.totalProducts,
      hasNext: derivedMetrics.hasNextPage,
      hasPrev: derivedMetrics.hasPrevPage,
      goToPage: (page: number) => updateFilters({ page }),
      nextPage: () => derivedMetrics.hasNextPage && updateFilters({ page: filters.page + 1 }),
      prevPage: () => derivedMetrics.hasPrevPage && updateFilters({ page: filters.page - 1 }),
    },
    
    // Función refresh simplificada
    refreshProducts: refetchProducts,
    
    // Handlers para componente
    handleBulkOperation: bulkUpdateStatus,
    handleProductAction: (action: string, productId: string) => {
      // Placeholder para acciones de producto
      console.log('Product action:', action, productId)
    },
  }
}
