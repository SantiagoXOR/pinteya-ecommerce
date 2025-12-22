'use client'

import { AdminCard } from '../ui/AdminCard'
import { Database, Table, BarChart3, Activity } from '@/lib/optimized-imports'
import { DatabaseStats } from '@/hooks/admin/useDatabase'

interface DatabaseOverviewProps {
  stats: DatabaseStats | null
  loading: boolean
}

export function DatabaseOverview({ stats, loading }: DatabaseOverviewProps) {
  if (loading) {
    return (
      <AdminCard title='Resumen de Base de Datos'>
        <div className='flex items-center justify-center py-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
        </div>
      </AdminCard>
    )
  }

  if (!stats) {
    return (
      <AdminCard title='Resumen de Base de Datos'>
        <p className='text-gray-600'>No se pudieron cargar las estadísticas</p>
      </AdminCard>
    )
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      <AdminCard className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Total de Tablas</p>
            <p className='text-3xl font-bold text-gray-900'>{stats.totalTables}</p>
          </div>
          <div className='p-3 bg-blue-500 rounded-lg'>
            <Table className='w-6 h-6 text-white' />
          </div>
        </div>
      </AdminCard>

      <AdminCard className='bg-gradient-to-br from-green-50 to-green-100 border-green-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Total de Registros</p>
            <p className='text-3xl font-bold text-gray-900'>
              {stats.totalRecords.toLocaleString('es-AR')}
            </p>
          </div>
          <div className='p-3 bg-green-500 rounded-lg'>
            <BarChart3 className='w-6 h-6 text-white' />
          </div>
        </div>
      </AdminCard>

      <AdminCard className='bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Esquemas</p>
            <p className='text-3xl font-bold text-gray-900'>{stats.schemas.length}</p>
          </div>
          <div className='p-3 bg-purple-500 rounded-lg'>
            <Database className='w-6 h-6 text-white' />
          </div>
        </div>
      </AdminCard>

      <AdminCard className='bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-gray-600 mb-1'>Estado</p>
            <p className='text-lg font-semibold text-green-700'>Conectado</p>
          </div>
          <div className='p-3 bg-green-500 rounded-lg'>
            <Activity className='w-6 h-6 text-white' />
          </div>
        </div>
      </AdminCard>

      {stats.schemas.length > 0 && (
        <AdminCard title='Esquemas' className='md:col-span-2 lg:col-span-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            {stats.schemas.map((schema) => (
              <div
                key={schema.name}
                className='p-4 bg-gray-50 border border-gray-200 rounded-lg'
              >
                <p className='font-medium text-gray-900'>{schema.name}</p>
                <p className='text-sm text-gray-600 mt-1'>
                  {schema.tableCount} {schema.tableCount === 1 ? 'tabla' : 'tablas'}
                </p>
              </div>
            ))}
          </div>
        </AdminCard>
      )}
    </div>
  )
}
