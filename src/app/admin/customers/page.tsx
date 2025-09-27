'use client'

import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminCard } from '@/components/admin/ui/AdminCard'
import { Users, UserCheck, UserX, UserPlus, AlertTriangle, Mail, Phone } from 'lucide-react'

export default function CustomersPage() {
  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Clientes' }]

  // Datos de ejemplo para mostrar
  const customerStats = [
    {
      title: 'Total Clientes',
      value: '1,247',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
    },
    {
      title: 'Activos',
      value: '1,156',
      change: '+8%',
      changeType: 'positive' as const,
      icon: UserCheck,
    },
    {
      title: 'Nuevos (30d)',
      value: '89',
      change: '+15%',
      changeType: 'positive' as const,
      icon: UserPlus,
    },
    {
      title: 'Inactivos',
      value: '91',
      change: '-5%',
      changeType: 'negative' as const,
      icon: UserX,
    },
  ]

  const mockCustomers = [
    {
      id: 'cust_1',
      name: 'Juan Pérez',
      email: 'juan@example.com',
      phone: '+54 11 1234-5678',
      status: 'active',
      orders: 5,
      totalSpent: '$45,000',
      lastOrder: '2025-01-03',
    },
    {
      id: 'cust_2',
      name: 'María García',
      email: 'maria@example.com',
      phone: '+54 11 9876-5432',
      status: 'active',
      orders: 3,
      totalSpent: '$28,500',
      lastOrder: '2024-12-28',
    },
    {
      id: 'cust_3',
      name: 'Carlos López',
      email: 'carlos@example.com',
      phone: '+54 351 555-0123',
      status: 'inactive',
      orders: 1,
      totalSpent: '$12,000',
      lastOrder: '2024-10-15',
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

  return (
    <AdminLayout title='Gestión de Clientes' breadcrumbs={breadcrumbs}>
      <div className='space-y-6'>
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

        {/* Aviso de funcionalidad en desarrollo */}
        <AdminCard className='p-6'>
          <div className='flex items-center space-x-4'>
            <div className='flex-shrink-0'>
              <AlertTriangle className='w-8 h-8 text-yellow-500' />
            </div>
            <div>
              <h3 className='text-lg font-medium text-gray-900'>Módulo en Desarrollo</h3>
              <p className='text-gray-600 mt-1'>
                La gestión completa de clientes estará disponible en una próxima versión.
                Actualmente puedes ver las estadísticas básicas y datos de ejemplo.
              </p>
            </div>
          </div>
        </AdminCard>

        {/* Lista de clientes de ejemplo */}
        <AdminCard
          title='Clientes Recientes'
          description='Vista previa de los últimos clientes (datos de ejemplo)'
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
                {mockCustomers.map(customer => (
                  <tr key={customer.id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='w-10 h-10 bg-blaze-orange-100 rounded-full flex items-center justify-center'>
                          <span className='text-sm font-medium text-blaze-orange-600'>
                            {customer.name.charAt(0)}
                          </span>
                        </div>
                        <div className='ml-4'>
                          <div className='text-sm font-medium text-gray-900'>{customer.name}</div>
                          <div className='text-sm text-gray-500'>ID: {customer.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='space-y-1'>
                        <div className='flex items-center text-sm text-gray-900'>
                          <Mail className='w-4 h-4 text-gray-400 mr-2' />
                          {customer.email}
                        </div>
                        <div className='flex items-center text-sm text-gray-500'>
                          <Phone className='w-4 h-4 text-gray-400 mr-2' />
                          {customer.phone}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {getStatusBadge(customer.status)}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {customer.orders}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {customer.totalSpent}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {customer.lastOrder}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  )
}
