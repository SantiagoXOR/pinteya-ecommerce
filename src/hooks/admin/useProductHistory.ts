// 📚 Enterprise Product History Hook

import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'

interface ProductHistoryEntry {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SOFT_DELETE'
  field_name?: string
  old_value?: any
  new_value?: any
  user_id: string
  user_name?: string
  timestamp: string
  metadata?: any
}

interface ProductHistoryOptions {
  productId: string
  enabled?: boolean
  limit?: number
}

// API function to fetch product history
async function fetchProductHistory(
  productId: string,
  limit: number = 50
): Promise<ProductHistoryEntry[]> {
  const response = await fetch(`/api/admin/products/${productId}/history?limit=${limit}`)

  if (!response.ok) {
    throw new Error('Error fetching product history')
  }

  const data = await response.json()
  return data.data
}

export function useProductHistory({
  productId,
  enabled = true,
  limit = 50,
}: ProductHistoryOptions) {
  const [localChanges, setLocalChanges] = useState<ProductHistoryEntry[]>([])

  const {
    data: historyData = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['product-history', productId],
    queryFn: () => fetchProductHistory(productId, limit),
    enabled: enabled && !!productId,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Track local changes before they're saved
  const trackChange = useCallback((field: string, oldValue: any, newValue: any) => {
    const changeEntry: ProductHistoryEntry = {
      id: `local-${Date.now()}`,
      action: 'UPDATE',
      field_name: field,
      old_value: oldValue,
      new_value: newValue,
      user_id: 'current-user',
      user_name: 'Tú',
      timestamp: new Date().toISOString(),
      metadata: { local: true },
    }

    setLocalChanges(prev => [changeEntry, ...prev.slice(0, 9)]) // Keep last 10 local changes
  }, [])

  // Clear local changes when data is saved
  const clearLocalChanges = useCallback(() => {
    setLocalChanges([])
  }, [])

  // Combine server history with local changes
  const combinedHistory = [...localChanges, ...historyData]

  // Format history entries for display
  const formatHistoryEntry = useCallback((entry: ProductHistoryEntry) => {
    const date = new Date(entry.timestamp)
    const timeAgo = getTimeAgo(date)

    let description = ''

    switch (entry.action) {
      case 'CREATE':
        description = 'Producto creado'
        break
      case 'UPDATE':
        if (entry.field_name) {
          description = `Actualizó ${getFieldDisplayName(entry.field_name)}`
          if (entry.old_value !== undefined && entry.new_value !== undefined) {
            description += ` de "${entry.old_value}" a "${entry.new_value}"`
          }
        } else {
          description = 'Producto actualizado'
        }
        break
      case 'DELETE':
        description = 'Producto eliminado'
        break
      case 'SOFT_DELETE':
        description = 'Producto marcado como inactivo'
        break
      default:
        description = 'Acción desconocida'
    }

    return {
      ...entry,
      description,
      timeAgo,
      isLocal: entry.metadata?.local || false,
    }
  }, [])

  const formattedHistory = combinedHistory.map(formatHistoryEntry)

  return {
    history: formattedHistory,
    isLoading,
    error,
    refetch,
    trackChange,
    clearLocalChanges,
  }
}

// Helper function to get human-readable field names
function getFieldDisplayName(fieldName: string): string {
  const fieldMap: Record<string, string> = {
    name: 'nombre',
    description: 'descripción',
    short_description: 'descripción corta',
    price: 'precio',
    compare_price: 'precio de comparación',
    cost_price: 'precio de costo',
    stock: 'stock',
    low_stock_threshold: 'umbral de stock bajo',
    category_id: 'categoría',
    status: 'estado',
    is_active: 'estado activo',
    is_featured: 'producto destacado',
    slug: 'URL slug',
    seo_title: 'título SEO',
    seo_description: 'descripción SEO',
    track_inventory: 'seguimiento de inventario',
    allow_backorder: 'permitir pedidos pendientes',
  }

  return fieldMap[fieldName] || fieldName
}

// Helper function to get time ago string
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'hace unos segundos'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) {
    return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
  }

  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) {
    return `hace ${diffInWeeks} semana${diffInWeeks > 1 ? 's' : ''}`
  }

  return date.toLocaleDateString()
}

// Hook for tracking form changes
export function useFormChangeTracking(productId: string, watchedData: any) {
  const { trackChange } = useProductHistory({ productId })
  const [previousData, setPreviousData] = useState(watchedData)

  useEffect(() => {
    if (!previousData || !watchedData) {
      return
    }

    // Compare current data with previous data
    Object.keys(watchedData).forEach(key => {
      const oldValue = previousData[key]
      const newValue = watchedData[key]

      // Skip if values are the same
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
        return
      }

      // Skip certain fields
      if (['updated_at', 'created_at'].includes(key)) {
        return
      }

      // Track the change
      trackChange(key, oldValue, newValue)
    })

    setPreviousData(watchedData)
  }, [watchedData, previousData, trackChange])

  return { trackChange }
}
