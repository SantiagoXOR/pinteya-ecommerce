'use client'

import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminCard } from '@/components/admin/ui/AdminCard'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Users, UserCheck, UserX, UserPlus, Mail, Phone, RefreshCw, Search, ChevronLeft, ChevronRight } from '@/lib/optimized-imports'
import { useCustomers } from '@/hooks/admin/useCustomers'
import { formatCurrency } from '@/lib/utils/format'

export default function CustomersPage() {
  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Clientes' }]

  const {
    customers,
    stats,
    loading,
    loadingStats,
    isLoading,
    error,
    filters,
    pagination,
    updateFilters,
    resetFilters,
    goToPage,
    nextPage,
    previousPage,
    refreshCustomers,
  } = useCustomers()

  // Estadísticas dinámicas basadas en datos reales
  const customerStats = [
    {
      title: 'Total Clientes',
      value: loadingStats ? '...' : stats?.total_users?.toString() || '0',
      change: `${stats?.new_users_30d || 0} nuevos`,
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      title: 'Activos',
      value: loadingStats ? '...' : stats?.active_users?.toString() || '0',
      change: `${Math.round(((stats?.active_users || 0) / (stats?.total_users || 1)) * 100)}% del total`,
      changeType: 'positive' as const,
      icon: UserCheck,
    },
    {
      title: 'Nuevos (30d)',
      value: loadingStats ? '...' : stats?.new_users_30d?.toString() || '0',
      change: 'Último mes',
      changeType: 'positive' as const,
      icon: UserPlus,
    },
    {
      title: 'Inactivos',
      value: loadingStats ? '...' : stats?.inactive_users?.toString() || '0',
      change: `${Math.round(((stats?.inactive_users || 0) / (stats?.total_users || 1)) * 100)}% del total`,
      changeType: 'negative' as const,
      icon: UserX,
    },
  ]

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Activo', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactivo', className: 'bg-gray-100 text-gray-800' },
      blocked: { label: 'Bloqueado', className: 'bg-red-100 text-red-800' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active

    return (
      <span
        className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${config.className}`}
      >
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nunca'
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <AdminLayout title='Gestión de Clientes' breadcrumbs={breadcrumbs}>
      <AdminContentWrapper>
        <div className='space-y-6'>
        {/* Header con acciones */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Gestión de Clientes</h1>
            <p className='text-gray-600 mt-1'>
              Administra tus clientes y visualiza sus estadísticas
            </p>
          </div>
          <Button
            variant='outline'
            onClick={refreshCustomers}
            disabled={isLoading}
            className='flex items-center space-x-2'
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <AdminCard className='border-red-200 bg-red-50'>
            <div className='flex items-center space-x-2 text-red-700'>
              <span>Error: {error}</span>
            </div>
          </AdminCard>
        )}

        {/* Estadísticas rápidas */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {customerStats.map(stat => (
            <AdminCard key={stat.title} className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>{stat.title}</p>
                  <p className='text-2xl font-bold text-gray-900 mt-1'>{stat.value}</p>
                  <p
                    className={`text-sm mt-1 ${
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : stat.changeType === 'negative'
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {stat.change} desde el mes pasado
                  </p>
                </div>
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    stat.changeType === 'positive'
                      ? 'bg-green-100'
                      : stat.changeType === 'negative'
                        ? 'bg-red-100'
                        : 'bg-gray-100'
                  }`}
                >
                  {stat && stat.icon && (
                    <stat.icon
                      className={`w-6 h-6 ${
                        stat.changeType === 'positive'
                          ? 'text-green-600'
                          : stat.changeType === 'negative'
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}
                    />
                  )}
                </div>
              </div>
            </AdminCard>
          ))}
        </div>

        {/* Filtros y búsqueda */}
        <AdminCard className='p-6'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  type='text'
                  placeholder='Buscar por nombre, email o teléfono...'
                  value={filters.search}
                  onChange={(e) => updateFilters({ search: e.target.value })}
                  className='pl-10'
                />
              </div>
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => updateFilters({ status: value as any })}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue placeholder='Estado' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>Todos</SelectItem>
                <SelectItem value='active'>Activos</SelectItem>
                <SelectItem value='inactive'>Inactivos</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='outline' onClick={resetFilters}>
              Limpiar
            </Button>
          </div>
        </AdminCard>

        {/* Lista de clientes */}
        <AdminCard
          title='Lista de Clientes'
          description={`Mostrando ${customers.length} de ${pagination.total} clientes`}
          padding='none'
        >
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Cliente
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Contacto
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Estado
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Órdenes
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Total Gastado
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Última Orden
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {loading ? (
                  <tr>
                    <td colSpan={6} className='px-6 py-12 text-center text-gray-500'>
                      <RefreshCw className='w-6 h-6 animate-spin mx-auto mb-2' />
                      Cargando clientes...
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className='px-6 py-12 text-center text-gray-500'>
                      No se encontraron clientes
                    </td>
                  </tr>
                ) : (
                  customers.map(customer => {
                    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Sin nombre'
                    const initials = fullName.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase()
                    
                    return (
                      <tr key={customer.id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='flex items-center'>
                            <div className='w-10 h-10 bg-blaze-orange-100 rounded-full flex items-center justify-center'>
                              <span className='text-sm font-medium text-blaze-orange-600'>
                                {initials}
                              </span>
                            </div>
                            <div className='ml-4'>
                              <div className='text-sm font-medium text-gray-900'>{fullName}</div>
                              <div className='text-sm text-gray-500'>ID: {customer.id.substring(0, 8)}...</div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='space-y-1'>
                            <div className='flex items-center text-sm text-gray-900'>
                              <Mail className='w-4 h-4 text-gray-400 mr-2' />
                              {customer.email}
                            </div>
                            {customer.phone && (
                              <div className='flex items-center text-sm text-gray-500'>
                                <Phone className='w-4 h-4 text-gray-400 mr-2' />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          {getStatusBadge(customer.is_active ? 'active' : 'inactive')}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {customer.total_orders}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                          {formatCurrency(customer.total_spent)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                          {formatDate(customer.last_order_date)}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className='px-6 py-4 border-t border-gray-200 flex items-center justify-between'>
              <div className='text-sm text-gray-700'>
                Página {pagination.page} de {pagination.totalPages} ({pagination.total} clientes totales)
              </div>
              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={previousPage}
                  disabled={!pagination.hasPreviousPage || loading}
                >
                  <ChevronLeft className='w-4 h-4' />
                  Anterior
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={nextPage}
                  disabled={!pagination.hasNextPage || loading}
                >
                  Siguiente
                  <ChevronRight className='w-4 h-4' />
                </Button>
              </div>
            </div>
          )}
        </AdminCard>
        </div>
      </AdminContentWrapper>
    </AdminLayout>
  )
}
