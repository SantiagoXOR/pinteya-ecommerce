'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

// Tipos para actividad
export interface UserActivity {
  id: string
  user_id: string
  action: string
  category: 'auth' | 'profile' | 'order' | 'security' | 'session' | 'preference'
  description?: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

interface ActivityFilters {
  category?: string
  action?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

interface ActivityResponse {
  success: boolean
  activities: UserActivity[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  stats: {
    byCategory: Record<string, number>
    byDay: Record<string, number>
    totalActivities: number
  }
}

interface UseUserActivityReturn {
  // Estado
  activities: UserActivity[]
  isLoading: boolean
  error: string | null

  // Paginación
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }

  // Estadísticas
  stats: {
    byCategory: Record<string, number>
    byDay: Record<string, number>
    totalActivities: number
  }

  // Funciones
  fetchActivities: (filters?: ActivityFilters) => Promise<void>
  loadMore: () => Promise<void>
  logActivity: (
    action: string,
    category: UserActivity['category'],
    description?: string,
    metadata?: Record<string, any>
  ) => Promise<boolean>
  refreshActivities: () => Promise<void>

  // Filtros
  filters: ActivityFilters
  setFilters: (filters: ActivityFilters) => void
}

export function useUserActivity(): UseUserActivityReturn {
  const [activities, setActivities] = useState<UserActivity[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<ActivityFilters>({
    limit: 20,
    offset: 0,
  })
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  })
  const [stats, setStats] = useState({
    byCategory: {},
    byDay: {},
    totalActivities: 0,
  })

  // Función para obtener actividades
  const fetchActivities = useCallback(
    async (newFilters?: ActivityFilters) => {
      setIsLoading(true)
      setError(null)

      const currentFilters = newFilters || filters

      try {
        const searchParams = new URLSearchParams()

        if (currentFilters.category) searchParams.set('category', currentFilters.category)
        if (currentFilters.action) searchParams.set('action', currentFilters.action)
        if (currentFilters.startDate) searchParams.set('startDate', currentFilters.startDate)
        if (currentFilters.endDate) searchParams.set('endDate', currentFilters.endDate)
        if (currentFilters.limit) searchParams.set('limit', currentFilters.limit.toString())
        if (currentFilters.offset) searchParams.set('offset', currentFilters.offset.toString())

        const response = await fetch(`/api/user/activity?${searchParams.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Error al obtener actividades')
        }

        const data: ActivityResponse = await response.json()

        if (data.success) {
          // Si es una nueva búsqueda (offset 0), reemplazar actividades
          // Si es cargar más (offset > 0), agregar a las existentes
          if (currentFilters.offset === 0) {
            setActivities(data.activities)
          } else {
            setActivities(prev => [...prev, ...data.activities])
          }

          setPagination(data.pagination)
          setStats(data.stats)
        } else {
          throw new Error('Error en la respuesta del servidor')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        setError(errorMessage)
        toast.error('Error al cargar actividades: ' + errorMessage)
      } finally {
        setIsLoading(false)
      }
    },
    [filters]
  )

  // Función para cargar más actividades
  const loadMore = useCallback(async () => {
    if (!pagination.hasMore || isLoading) return

    const newFilters = {
      ...filters,
      offset: pagination.offset + pagination.limit,
    }

    await fetchActivities(newFilters)
  }, [filters, pagination, isLoading, fetchActivities])

  // Función para registrar nueva actividad
  const logActivity = useCallback(
    async (
      action: string,
      category: UserActivity['category'],
      description?: string,
      metadata?: Record<string, any>
    ): Promise<boolean> => {
      try {
        const response = await fetch('/api/user/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action,
            category,
            description,
            metadata,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Error al registrar actividad')
        }

        const data = await response.json()

        if (data.success) {
          // Agregar la nueva actividad al inicio de la lista
          setActivities(prev => [data.activity, ...prev])
          return true
        } else {
          throw new Error(data.error || 'Error al registrar actividad')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
        console.error('Error al registrar actividad:', errorMessage)
        return false
      }
    },
    []
  )

  // Función para refrescar actividades
  const refreshActivities = useCallback(async () => {
    const refreshFilters = { ...filters, offset: 0 }
    await fetchActivities(refreshFilters)
  }, [filters, fetchActivities])

  // Actualizar filtros y recargar
  const updateFilters = useCallback(
    (newFilters: ActivityFilters) => {
      const updatedFilters = { ...newFilters, offset: 0 }
      setFilters(updatedFilters)
      fetchActivities(updatedFilters)
    },
    [fetchActivities]
  )

  // Cargar actividades al montar el componente
  useEffect(() => {
    fetchActivities()
  }, [])

  return {
    // Estado
    activities,
    isLoading,
    error,

    // Paginación
    pagination,

    // Estadísticas
    stats,

    // Funciones
    fetchActivities,
    loadMore,
    logActivity,
    refreshActivities,

    // Filtros
    filters,
    setFilters: updateFilters,
  }
}

// Hook auxiliar para categorías de actividad
export function useActivityCategories() {
  const categories = [
    { value: 'auth', label: 'Autenticación', color: 'blue' },
    { value: 'profile', label: 'Perfil', color: 'green' },
    { value: 'order', label: 'Órdenes', color: 'purple' },
    { value: 'security', label: 'Seguridad', color: 'red' },
    { value: 'session', label: 'Sesiones', color: 'orange' },
    { value: 'preference', label: 'Preferencias', color: 'gray' },
  ]

  const getCategoryInfo = useCallback((category: string) => {
    return (
      categories.find(cat => cat.value === category) || {
        value: category,
        label: category,
        color: 'gray',
      }
    )
  }, [])

  return {
    categories,
    getCategoryInfo,
  }
}

// Hook para formatear actividades
export function useActivityFormatter() {
  const formatAction = useCallback((action: string) => {
    const actionMap: Record<string, string> = {
      login: 'Inicio de sesión',
      logout: 'Cierre de sesión',
      profile_updated: 'Perfil actualizado',
      avatar_changed: 'Avatar cambiado',
      password_changed: 'Contraseña cambiada',
      session_created: 'Nueva sesión iniciada',
      session_terminated: 'Sesión terminada',
      security_settings_updated: 'Configuración de seguridad actualizada',
      order_created: 'Orden creada',
      order_updated: 'Orden actualizada',
      preferences_updated: 'Preferencias actualizadas',
    }

    return actionMap[action] || action
  }, [])

  const formatTimeAgo = useCallback((dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Hace unos segundos'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `Hace ${days} día${days > 1 ? 's' : ''}`
    }
  }, [])

  return {
    formatAction,
    formatTimeAgo,
  }
}
