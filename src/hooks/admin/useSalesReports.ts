'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'

export interface SalesData {
  id: string
  date: string
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  topProducts: Array<{
    id: string
    name: string
    sales: number
    revenue: number
  }>
  salesByCategory: Array<{
    category: string
    sales: number
    percentage: number
  }>
}

export interface SalesFilters {
  startDate: string
  endDate: string
  category?: string
  status?: 'completed' | 'pending' | 'cancelled'
}

export interface UseSalesReportsReturn {
  salesData: SalesData | null
  isLoading: boolean
  error: string | null
  filters: SalesFilters
  setFilters: (filters: Partial<SalesFilters>) => void
  refreshData: () => Promise<void>
  exportReport: (format: 'csv' | 'pdf' | 'excel') => Promise<void>
  generateCustomReport: (config: any) => Promise<void>
}

export function useSalesReports(): UseSalesReportsReturn {
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFiltersState] = useState<SalesFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })

  const fetchSalesData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status }),
      })

      const response = await fetch(`/api/admin/sales/reports?${queryParams}`)

      if (!response.ok) {
        throw new Error('Error al obtener datos de ventas')
      }

      const data = await response.json()
      setSalesData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  const setFilters = useCallback((newFilters: Partial<SalesFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  const refreshData = useCallback(async () => {
    await fetchSalesData()
  }, [fetchSalesData])

  const exportReport = useCallback(
    async (format: 'csv' | 'pdf' | 'excel') => {
      try {
        setIsLoading(true)

        const queryParams = new URLSearchParams({
          ...filters,
          format,
        })

        const response = await fetch(`/api/admin/sales/export?${queryParams}`)

        if (!response.ok) {
          throw new Error('Error al exportar reporte')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sales-report-${filters.startDate}-${filters.endDate}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: 'Éxito',
          description: 'Reporte exportado correctamente',
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al exportar'
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [filters]
  )

  const generateCustomReport = useCallback(
    async (config: any) => {
      try {
        setIsLoading(true)

        const response = await fetch('/api/admin/sales/custom-report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...config, filters }),
        })

        if (!response.ok) {
          throw new Error('Error al generar reporte personalizado')
        }

        const data = await response.json()
        setSalesData(data)

        toast({
          title: 'Éxito',
          description: 'Reporte personalizado generado correctamente',
        })
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error al generar reporte'
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    },
    [filters]
  )

  useEffect(() => {
    fetchSalesData()
  }, [fetchSalesData])

  return {
    salesData,
    isLoading,
    error,
    filters,
    setFilters,
    refreshData,
    exportReport,
    generateCustomReport,
  }
}
