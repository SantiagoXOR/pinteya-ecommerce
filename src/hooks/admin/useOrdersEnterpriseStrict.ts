// ===================================
// PINTEYA E-COMMERCE - STRICT ORDERS HOOK (REFACTORED)
// Hook orquestador para gestión de órdenes con validación estricta
// ===================================

import { useEffect, useCallback, useRef, useMemo } from 'react'
import { useToast } from '@/hooks/use-toast'
import {
  StrictOrdersListResponse,
  StrictApiError,
  ApiResult,
  createStrictApiError,
  StrictOrderEnterprise,
  StrictPagination,
  isStrictApiError,
  isStrictApiResponse,
} from '@/types/api-strict'
import { OrderStatus, PaymentStatus, FulfillmentStatus } from '@/types/orders-enterprise'
import { useApiMonitoring } from '@/utils/api-monitoring'
import { useOrdersCache } from './useOrdersCache'
import { useOrdersApi } from './useOrdersApi'
import { useOrdersState, StrictOrdersState, StrictOrdersActions } from './useOrdersState'
import { useOrdersDevState } from './useOrdersDevPersistence'

// Función de debounce para evitar peticiones múltiples
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// ===================================
// TIPOS DE FILTROS ESTRICTOS
// ===================================

export interface StrictOrderFilters {
  readonly search?: string
  readonly status?: OrderStatus | 'all'
  readonly payment_status?: PaymentStatus | 'all'
  readonly fulfillment_status?: FulfillmentStatus | 'all'
  readonly date_from?: string
  readonly date_to?: string
  readonly page?: number
  readonly limit?: number
  readonly sort_by?: 'created_at' | 'updated_at' | 'total' | 'order_number'
  readonly sort_order?: 'asc' | 'desc'
}

// Tipos movidos a useOrdersState.ts

export interface UseOrdersEnterpriseStrictReturn extends StrictOrdersState, StrictOrdersActions {
  readonly fetchOrders: (filters?: Partial<StrictOrderFilters>) => Promise<void>
  readonly refreshOrders: () => Promise<void>
  readonly retryLastRequest: () => Promise<void>
}

// ===================================
// CONFIGURACIÓN DEL HOOK
// ===================================

interface UseOrdersEnterpriseStrictOptions {
  readonly autoFetch?: boolean
  readonly refetchInterval?: number
  readonly maxRetries?: number
  readonly timeout?: number
  readonly enableCache?: boolean
  readonly cacheTimeout?: number
}

const DEFAULT_OPTIONS: Required<UseOrdersEnterpriseStrictOptions> = {
  autoFetch: true,
  refetchInterval: 0, // 0 = disabled
  maxRetries: 3,
  timeout: 10000, // 10 seconds
  enableCache: true,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
}

// Constantes DEFAULT movidas a useOrdersState.ts

// ===================================
// CONFIGURACIÓN DEL HOOK ORQUESTADOR
// ===================================

// Funciones de cache movidas a useOrdersCache.ts

// Funciones de cache movidas a useOrdersCache.ts

// Todas las funciones de cache movidas a useOrdersCache.ts

// ===================================
// HOOK PRINCIPAL
// ===================================

export function useOrdersEnterpriseStrict(
  initialFilters: Partial<StrictOrderFilters> = {},
  options: Partial<UseOrdersEnterpriseStrictOptions> = {}
): UseOrdersEnterpriseStrictReturn {
  const { toast } = useToast()
  const apiMonitoring = useApiMonitoring()
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [options])

  // Memoizar las funciones de monitoreo para evitar recreaciones
  const recordDiscrepancy = useCallback(apiMonitoring.recordDiscrepancy, [])
  const recordRenderingIssue = useCallback(apiMonitoring.recordRenderingIssue, [])

  // ===================================
  // HOOKS ESPECIALIZADOS
  // ===================================

  // Hook de cache
  const cache = useOrdersCache({
    enableCache: opts.enableCache,
    cacheTimeout: opts.cacheTimeout,
    maxSize: 50,
    cleanupInterval: 10 * 60 * 1000,
    minRequestInterval: 1000,
  })

  // Hook de persistencia para desarrollo (Fast Refresh)
  const devPersistence = useOrdersDevState('orders-enterprise-dev')

  // Hook de estado
  const state = useOrdersState(initialFilters)

  // Hook de API
  const api = useOrdersApi({
    timeout: opts.timeout,
    maxRetries: opts.maxRetries,
    enableCache: opts.enableCache,
    cache,
  })

  // Referencias para control de requests (simplificadas)
  const retryCountRef = useRef(0)
  const refetchIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ===================================
  // FUNCIONES DE FETCH SIMPLIFICADAS
  // ===================================

  // Usar el hook de API directamente
  const fetchOrdersInternal = api.fetchOrdersInternal

  // ===================================
  // FUNCIONES DE FETCH PÚBLICAS
  // ===================================

  // Lógica de fetch movida a useOrdersApi.ts

  // ===================================
  // FUNCIÓN DE FETCH PÚBLICA CON RETRY
  // ===================================

  // Función interna sin debounce para uso directo
  const fetchOrdersImmediate = useCallback(
    async (newFilters: Partial<StrictOrderFilters> = {}): Promise<void> => {
      console.log(
        '[useOrdersEnterpriseStrict] fetchOrdersImmediate called with filters:',
        newFilters
      )
      console.log('[useOrdersEnterpriseStrict] Current state filters:', state.filters)

      // Generar clave única para esta petición
      const requestKey = JSON.stringify({ ...state.filters, ...newFilters })
      console.log('[useOrdersEnterpriseStrict] Request key:', requestKey)

      // Evitar peticiones duplicadas
      if (state.hasFiltersChanged({ ...state.filters, ...newFilters }) && state.isLoading) {
        console.log('[useOrdersEnterpriseStrict] Skipping duplicate request')
        return
      }

      // Actualizar filtros y estado de carga
      console.log('[useOrdersEnterpriseStrict] Updating filters and setting loading to true')
      state.updateFilters(newFilters)
      state.setLoading(true)
      retryCountRef.current = 0

      const attemptFetch = async (attempt: number): Promise<void> => {
        const currentFilters = state.getLastFilters()
        console.log(
          '[useOrdersEnterpriseStrict] attemptFetch - attempt:',
          attempt,
          'filters:',
          currentFilters
        )

        const result = await fetchOrdersInternal(currentFilters, attempt > 0)
        console.log('[useOrdersEnterpriseStrict] API result:', result)

        if (isStrictApiResponse(result)) {
          console.log('[useOrdersEnterpriseStrict] Valid API response received:', result.data)
          // Monitoreo automático de discrepancias
          const expectedCount = result.data.pagination.total
          const actualCount = result.data.orders.length
          const endpoint = `/api/admin/orders?${new URLSearchParams({
            page: currentFilters.page?.toString() || '1',
            limit: currentFilters.limit?.toString() || '20',
            ...(currentFilters.status && { status: currentFilters.status }),
            ...(currentFilters.payment_status && { payment_status: currentFilters.payment_status }),
            ...(currentFilters.fulfillment_status && {
              fulfillment_status: currentFilters.fulfillment_status,
            }),
            ...(currentFilters.sort_by && { sort_by: currentFilters.sort_by }),
            ...(currentFilters.sort_order && { sort_order: currentFilters.sort_order }),
          }).toString()}`

          // Solo registrar discrepancia si hay una diferencia real (no por paginación)
          const expectedPageCount = Math.min(
            currentFilters.limit || 20,
            expectedCount - ((currentFilters.page || 1) - 1) * (currentFilters.limit || 20)
          )
          if (actualCount < expectedPageCount && expectedPageCount > 0) {
            recordDiscrepancy(endpoint, expectedPageCount, actualCount)
          }

          // Actualizar estado usando el hook especializado
          state.setOrders(result.data.orders)
          state.setPagination(result.data.pagination)
          state.setAnalytics(result.data.analytics || null)
          retryCountRef.current = 0

          // ✅ PERSISTIR ESTADO PARA DESARROLLO (Fast Refresh)
          if (process.env.NODE_ENV === 'development') {
            devPersistence.persistState({
              orders: result.data.orders,
              pagination: result.data.pagination,
              analytics: result.data.analytics || null,
              filters: currentFilters,
              hasData: true,
              lastFetchTime: Date.now(),
            })
          }
        } else {
          // Es un error
          if (attempt < opts.maxRetries && result.code !== 'REQUEST_CANCELLED') {
            retryCountRef.current = attempt + 1
            // Esperar antes del retry (exponential backoff)
            const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
            await new Promise(resolve => setTimeout(resolve, delay))
            return attemptFetch(attempt + 1)
          }

          // Máximo de reintentos alcanzado o error no recuperable
          state.setError(result.error)

          // Registrar problema de renderizado por error de API
          recordRenderingIssue('useOrdersEnterpriseStrict', 0, 0, currentFilters, result.error)

          // Mostrar toast de error
          if (result.code !== 'REQUEST_CANCELLED') {
            toast({
              title: 'Error al cargar órdenes',
              description: result.error,
              variant: 'destructive',
            })
          }
        }
      }

      await attemptFetch(0)
    },
    [fetchOrdersInternal, opts.maxRetries, toast, recordDiscrepancy, recordRenderingIssue, state]
  )

  // Función fetchOrders con debouncing para evitar peticiones múltiples
  const fetchOrders = useCallback(
    (newFilters: Partial<StrictOrderFilters> = {}): Promise<void> => {
      return new Promise<void>(resolve => {
        // Limpiar timeout anterior si existe
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current)
        }

        // Configurar nuevo timeout con debounce
        const debounceMs = process.env.NODE_ENV === 'development' ? 300 : 150
        debounceTimeoutRef.current = setTimeout(async () => {
          try {
            await fetchOrdersImmediate(newFilters)
            resolve()
          } catch (error) {
            console.error('Error in debounced fetchOrders:', error)
            resolve() // Resolver incluso en caso de error para evitar promesas colgadas
          }
        }, debounceMs)
      })
    },
    [fetchOrdersImmediate]
  )

  // ===================================
  // OTRAS ACCIONES
  // ===================================

  const refreshOrders = useCallback(async (): Promise<void> => {
    // Limpiar cache para forzar refresh
    if (opts.enableCache) {
      cache.clearCache()
    }
    await fetchOrders()
  }, [fetchOrders, opts.enableCache, cache])

  // Usar las funciones del hook de estado directamente
  const updateFilters = state.updateFilters
  const clearError = state.clearError

  const retryLastRequest = useCallback(async (): Promise<void> => {
    const lastFilters = state.getLastFilters()
    if (lastFilters) {
      await fetchOrders(lastFilters)
    }
  }, [fetchOrders, state])

  // ===================================
  // EFECTOS
  // ===================================

  // ===================================
  // RESTAURACIÓN DE ESTADO PERSISTIDO (DESARROLLO)
  // ===================================

  const hasRestoredRef = useRef(false)
  useEffect(() => {
    if (!hasRestoredRef.current && process.env.NODE_ENV === 'development') {
      hasRestoredRef.current = true

      // Intentar restaurar estado persistido
      if (devPersistence.hasValidPersistedData()) {
        const persistedState = devPersistence.getPersistedState()
        if (persistedState) {
          console.log('[useOrdersEnterpriseStrict] Restoring persisted state:', {
            ordersCount: persistedState.orders.length,
            hasData: persistedState.hasData,
          })

          // Restaurar estado
          state.setOrders(persistedState.orders)
          state.setPagination(persistedState.pagination)
          state.setAnalytics(persistedState.analytics)
          state.updateFilters(persistedState.filters)

          return // No hacer auto-fetch si tenemos datos persistidos
        }
      }
    }

    // Auto-fetch inicial solo si no hay datos persistidos
    if (opts.autoFetch && !hasRestoredRef.current) {
      fetchOrders()
    }
  }, [opts.autoFetch]) // Solo ejecutar una vez al montar

  // Escuchar cambios en filtros con debouncing optimizado
  const filtersRef = useRef(state.filters)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Evitar fetch en el primer render (ya se hace en auto-fetch)
    if (isInitialMount.current) {
      isInitialMount.current = false
      filtersRef.current = state.filters
      return
    }

    // Solo hacer fetch si los filtros han cambiado realmente
    const hasChanged = JSON.stringify(filtersRef.current) !== JSON.stringify(state.filters)

    if (hasChanged) {
      filtersRef.current = state.filters
      fetchOrders()
    }
  }, [state.filters, fetchOrders]) // Dependencias mínimas y estables

  // Refetch interval - TEMPORALMENTE DESHABILITADO para evitar refresco infinito
  useEffect(() => {
    // NOTA: Refetch interval deshabilitado temporalmente para solucionar refresco infinito
    // TODO: Reimplementar con useRef para fetchOrders o usar React Query
    /*
    if (opts.refetchInterval > 0) {
      refetchIntervalRef.current = setInterval(() => {
        if (!state.isLoading) {
          fetchOrders();
        }
      }, opts.refetchInterval);

      return () => {
        if (refetchIntervalRef.current) {
          clearInterval(refetchIntervalRef.current);
        }
      };
    }
    */
  }, [opts.refetchInterval])

  // Limpieza automática de cache movida a useOrdersCache.ts

  // Cleanup al desmontar - OPTIMIZADO: Sin dependencias inestables
  useEffect(() => {
    return () => {
      // Cancelar peticiones en progreso usando el hook de API
      api.abortCurrentRequest()

      // Limpiar intervalos y timeouts
      if (refetchIntervalRef.current) {
        clearInterval(refetchIntervalRef.current)
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('[useOrdersEnterpriseStrict] Hook cleanup completed')
      }
    }
  }, []) // ✅ CORREGIDO: Sin dependencias para evitar remontajes por Fast Refresh

  // ===================================
  // RETORNO DEL HOOK
  // ===================================

  return {
    // Estado
    orders: state.orders,
    pagination: state.pagination,
    filters: state.filters,
    analytics: state.analytics,
    isLoading: state.isLoading,
    error: state.error,
    lastFetch: state.lastFetch,

    // Acciones
    fetchOrders,
    refreshOrders,
    updateFilters,
    clearError,
    retryLastRequest,
  }
}

// ===================================
// HOOK PARA ORDEN INDIVIDUAL
// ===================================

export function useOrderDetailStrict(orderId: string | null) {
  const { toast } = useToast()
  const [order, setOrder] = useState<StrictOrderEnterprise | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        credentials: 'include', // ✅ AGREGADO: Incluir cookies de sesión NextAuth.js
      })
      const data = await response.json()

      const validatedResponse = toStrictOrdersResponse(data)

      if (isStrictApiError(validatedResponse)) {
        setError(validatedResponse.error)
        toast({
          title: 'Error al cargar orden',
          description: validatedResponse.error,
          variant: 'destructive',
        })
      } else {
        // Para orden individual, extraer la primera orden
        const orderData = validatedResponse.data.orders[0] || null
        setOrder(orderData)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      toast({
        title: 'Error al cargar orden',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [orderId, toast])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
  }
}

// ===================================
// UTILIDADES EXPORTADAS
// ===================================

/**
 * Utilidades de cache movidas a useOrdersCache.ts
 * Estas funciones están disponibles a través del hook useOrdersCache
 */

// Las utilidades de cache ahora están disponibles a través del hook useOrdersCache:
// - cache.clearCache()
// - cache.getCacheStats()
// - cache.getPendingRequest()
// - cache.setPendingRequest()
