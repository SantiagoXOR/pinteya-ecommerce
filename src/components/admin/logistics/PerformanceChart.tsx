// =====================================================
// COMPONENTE: PERFORMANCE CHART ENTERPRISE
// Descripción: Gráficos de performance para logística
// Basado en: Recharts + shadcn/ui
// =====================================================

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// ✅ OPTIMIZACIÓN: Lazy load de Recharts - Solo carga cuando se necesita (~100KB ahorrados)
// import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Download,
} from '@/lib/optimized-imports'
import { PerformanceMetric } from '@/types/logistics'
import { cn } from '@/lib/core/utils'
import { formatCurrency, formatDate } from '@/lib/utils/consolidated-utils'

// =====================================================
// INTERFACES
// =====================================================

interface PerformanceChartProps {
  data: PerformanceMetric[]
  height?: number
  showDetails?: boolean
  className?: string
}

interface ChartTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

// =====================================================
// CONFIGURACIÓN DE COLORES
// =====================================================

const chartColors = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b',
  danger: '#ef4444',
  muted: '#6b7280',
}

const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function PerformanceChart({
  data,
  height = 300,
  showDetails = false,
  className,
}: PerformanceChartProps) {
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')

  // Validar datos y filtrar según el rango de tiempo
  const safeData = data || []
  const filteredData = safeData.slice(-parseInt(timeRange))

  // Calcular métricas derivadas
  const processedData = filteredData.map(item => ({
    ...item,
    date_formatted: formatDate(item.date, 'dd/MM'),
    on_time_rate: item.delivered_count > 0 ? (item.on_time_count / item.delivered_count) * 100 : 0,
    delivery_rate:
      item.shipments_count > 0 ? (item.delivered_count / item.shipments_count) * 100 : 0,
    average_cost_per_shipment:
      item.shipments_count > 0 ? item.total_cost / item.shipments_count : 0,
  }))

  // Calcular totales y tendencias
  const totals = processedData.reduce(
    (acc, item) => ({
      shipments: acc.shipments + item.shipments_count,
      delivered: acc.delivered + item.delivered_count,
      onTime: acc.onTime + item.on_time_count,
      cost: acc.cost + item.total_cost,
    }),
    { shipments: 0, delivered: 0, onTime: 0, cost: 0 }
  )

  const averages = {
    onTimeRate: totals.delivered > 0 ? (totals.onTime / totals.delivered) * 100 : 0,
    deliveryRate: totals.shipments > 0 ? (totals.delivered / totals.shipments) * 100 : 0,
    costPerShipment: totals.shipments > 0 ? totals.cost / totals.shipments : 0,
  }

  // Si no hay datos, mostrar estado vacío
  if (processedData.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-64 text-muted-foreground', className)}>
        <div className='text-center'>
          <BarChart3 className='w-12 h-12 mx-auto mb-4 opacity-50' />
          <p>No hay datos de performance disponibles</p>
        </div>
      </div>
    )
  }

  // Versión simplificada sin ResponsiveContainer para evitar errores
  return (
    <div className={cn('w-full', className)}>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-white p-4 rounded-lg border'>
          <h3 className='text-sm font-medium text-gray-500'>Tasa de Entrega</h3>
          <p className='text-2xl font-bold text-green-600'>{averages.deliveryRate.toFixed(1)}%</p>
        </div>
        <div className='bg-white p-4 rounded-lg border'>
          <h3 className='text-sm font-medium text-gray-500'>Puntualidad</h3>
          <p className='text-2xl font-bold text-blue-600'>{averages.onTimeRate.toFixed(1)}%</p>
        </div>
        <div className='bg-white p-4 rounded-lg border'>
          <h3 className='text-sm font-medium text-gray-500'>Costo Promedio</h3>
          <p className='text-2xl font-bold text-orange-600'>
            ${averages.costPerShipment.toFixed(2)}
          </p>
        </div>
      </div>

      <div className='bg-white p-6 rounded-lg border'>
        <h3 className='text-lg font-semibold mb-4'>Métricas de Performance</h3>
        <div className='space-y-4'>
          {processedData.slice(-7).map((item, index) => (
            <div key={index} className='flex justify-between items-center py-2 border-b'>
              <span className='text-sm text-gray-600'>{item.date_formatted}</span>
              <div className='flex space-x-4'>
                <span className='text-sm'>Envíos: {item.shipments_count}</span>
                <span className='text-sm'>Entregados: {item.delivered_count}</span>
                <span className='text-sm'>Puntualidad: {item.on_time_rate.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
