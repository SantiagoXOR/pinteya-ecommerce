'use client'

import React from 'react'

interface OrderStats {
  total_orders?: number | string
  pending_orders?: number | string
  completed_orders?: number | string
  today_orders?: number | string
}

interface OrdersStatsDisplayProps {
  stats: OrderStats | null
  isLoading?: boolean
  className?: string
}

// Función auxiliar para convertir cualquier valor a número seguro
function safeNumber(value: any): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed
    }
  }
  return 0
}

export function OrdersStatsDisplay({
  stats,
  isLoading = false,
  className = '',
}: OrdersStatsDisplayProps) {
  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className='animate-pulse'>
            <div className='bg-white border rounded-lg p-6'>
              <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
              <div className='h-8 bg-gray-200 rounded w-1/2'></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // PROTECCIÓN TOTAL: Verificar que stats existe y convertir todos los valores a números seguros
  const safeStats = stats || {}
  const totalOrders = safeNumber(safeStats.total_orders)
  const pendingOrders = safeNumber(safeStats.pending_orders)
  const completedOrders = safeNumber(safeStats.completed_orders)
  const todayOrders = safeNumber(safeStats.today_orders)

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      <div className='bg-white border rounded-lg p-6'>
        <h3 className='text-sm font-medium text-gray-500'>Total Órdenes</h3>
        <p className='text-2xl font-bold'>{totalOrders}</p>
      </div>
      <div className='bg-white border rounded-lg p-6'>
        <h3 className='text-sm font-medium text-gray-500'>Pendientes</h3>
        <p className='text-2xl font-bold'>{pendingOrders}</p>
      </div>
      <div className='bg-white border rounded-lg p-6'>
        <h3 className='text-sm font-medium text-gray-500'>Completadas</h3>
        <p className='text-2xl font-bold'>{completedOrders}</p>
      </div>
      <div className='bg-white border rounded-lg p-6'>
        <h3 className='text-sm font-medium text-gray-500'>Hoy</h3>
        <p className='text-2xl font-bold'>{todayOrders}</p>
      </div>
    </div>
  )
}
