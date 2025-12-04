import { useState, useEffect, useCallback } from 'react'

// =====================================================
// TYPES
// =====================================================

export interface Customer {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  is_active: boolean
  created_at: string
  updated_at: string
  last_login: string | null
  // Stats
  total_orders: number
  total_spent: number
  last_order_date: string | null
}

export interface CustomerStats {
  total_users: number
  active_users: number
  new_users_30d: number
  inactive_users: number
  growth_rate: number
}

export interface CustomerFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  sortBy: 'created_at' | 'last_order' | 'total_spent' | 'total_orders'
  sortOrder: 'asc' | 'desc'
}

export interface CustomerPagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// =====================================================
// HOOK
// =====================================================

export function useCustomers() {
  // Estados de datos
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)

  // Estados de carga
  const [loading, setLoading] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)

  // Estados de error
  const [error, setError] = useState<string | null>(null)

  // Filtros y paginación
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
  })

  const [pagination, setPagination] = useState<CustomerPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  })

  // =====================================================
  // FETCH CUSTOMERS
  // =====================================================

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: filters.search,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      })

      const response = await fetch(`/api/admin/users/list?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setCustomers(data.data.users || [])
        setPagination(data.data.pagination || pagination)
      } else {
        throw new Error(data.error || 'Error al obtener clientes')
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }, [filters, pagination.page, pagination.limit])

  // =====================================================
  // FETCH STATS
  // =====================================================

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true)

      const response = await fetch('/api/admin/users/stats', {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      } else {
        console.warn('Error obteniendo stats:', data.error)
        // No lanzar error, solo no actualizar stats
      }
    } catch (err) {
      console.error('Error fetching customer stats:', err)
      // No establecer error para stats
    } finally {
      setLoadingStats(false)
    }
  }, [])

  // =====================================================
  // EFFECTS
  // =====================================================

  // Cargar customers al montar y cuando cambien filtros/paginación
  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // Cargar stats al montar
  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // =====================================================
  // ACTIONS
  // =====================================================

  const updateFilters = useCallback((newFilters: Partial<CustomerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    // Reset a página 1 cuando cambian filtros
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setPagination(prev => ({ ...prev, page: prev.page + 1 }))
    }
  }, [pagination.hasNextPage])

  const previousPage = useCallback(() => {
    if (pagination.hasPreviousPage) {
      setPagination(prev => ({ ...prev, page: prev.page - 1 }))
    }
  }, [pagination.hasPreviousPage])

  const refreshCustomers = useCallback(() => {
    fetchCustomers()
    fetchStats()
  }, [fetchCustomers, fetchStats])

  // =====================================================
  // RETURN
  // =====================================================

  return {
    // Data
    customers,
    stats,

    // Loading states
    loading,
    loadingStats,
    isLoading: loading || loadingStats,

    // Error
    error,

    // Filters & Pagination
    filters,
    pagination,

    // Actions
    updateFilters,
    resetFilters,
    goToPage,
    nextPage,
    previousPage,
    refreshCustomers,
  }
}

