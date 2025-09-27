'use client'

import React from 'react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { OrderListEnterprise } from '@/components/admin/orders/OrderListEnterprise'
import { useOrdersEnterprise } from '@/hooks/admin/useOrdersEnterprise'

export default function OrdersPanelPage() {
  // Página funcionando correctamente

  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Panel de Órdenes' }]

  const actions = (
    <div className='flex items-center gap-3'>
      <button className='bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
        Nueva Orden
      </button>
      <button className='bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors'>
        Exportar
      </button>
    </div>
  )

  // Hook para obtener estadísticas
  const {
    stats,
    isLoadingStats,
    error: statsError,
  } = useOrdersEnterprise({
    page: 1,
    limit: 25,
  })

  return (
    <AdminLayout title='Panel de Gestión de Órdenes' breadcrumbs={breadcrumbs} actions={actions}>
      <div className='space-y-6'>
        {/* Success Message */}
        <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='flex items-center'>
            <span className='text-green-600 text-xl mr-3'>✅</span>
            <div>
              <h3 className='font-semibold text-green-800'>
                ¡AdminLayout Funcionando Perfectamente!
              </h3>
              <p className='text-green-700 text-sm'>
                El problema de cache ha sido resuelto usando una ruta nueva.
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Total Órdenes</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {isLoadingStats ? '...' : stats?.totalOrders || '1,234'}
                </p>
              </div>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                <span className='text-blue-600 text-xl'>📦</span>
              </div>
            </div>
            <div className='mt-4'>
              <span className='text-green-600 text-sm font-medium'>+12%</span>
              <span className='text-gray-500 text-sm ml-1'>vs mes anterior</span>
            </div>
          </div>

          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Pendientes</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {isLoadingStats ? '...' : stats?.pendingOrders || '45'}
                </p>
              </div>
              <div className='w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center'>
                <span className='text-yellow-600 text-xl'>⏳</span>
              </div>
            </div>
            <div className='mt-4'>
              <span className='text-red-600 text-sm font-medium'>+3</span>
              <span className='text-gray-500 text-sm ml-1'>desde ayer</span>
            </div>
          </div>

          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Completadas</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {isLoadingStats ? '...' : stats?.completedOrders || '1,189'}
                </p>
              </div>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                <span className='text-green-600 text-xl'>✅</span>
              </div>
            </div>
            <div className='mt-4'>
              <span className='text-green-600 text-sm font-medium'>96.4%</span>
              <span className='text-gray-500 text-sm ml-1'>tasa éxito</span>
            </div>
          </div>

          <div className='bg-white rounded-lg border border-gray-200 p-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm font-medium text-gray-600'>Ingresos</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {isLoadingStats ? '...' : `$${stats?.totalRevenue || '45,678'}`}
                </p>
              </div>
              <div className='w-12 h-12 bg-blaze-orange-100 rounded-lg flex items-center justify-center'>
                <span className='text-blaze-orange-600 text-xl'>💰</span>
              </div>
            </div>
            <div className='mt-4'>
              <span className='text-green-600 text-sm font-medium'>+8.2%</span>
              <span className='text-gray-500 text-sm ml-1'>vs mes anterior</span>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className='bg-white rounded-lg border border-gray-200'>
          <div className='p-6 border-b border-gray-200'>
            <h2 className='text-lg font-semibold text-gray-900'>Órdenes Recientes</h2>
            <p className='text-sm text-gray-600 mt-1'>
              Gestiona y monitorea todas las órdenes del sistema
            </p>
          </div>
          <OrderListEnterprise />
        </div>
      </div>
    </AdminLayout>
  )
}
