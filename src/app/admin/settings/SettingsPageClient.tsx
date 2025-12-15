'use client'

import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { AdminCard } from '@/components/admin/ui/AdminCard'
import { AdminContentWrapper } from '@/components/admin/layout/AdminContentWrapper'
import { Settings, Store, CreditCard, Truck, Bell, Shield, AlertTriangle } from '@/lib/optimized-imports'

export function SettingsPageClient() {
  const breadcrumbs = [{ label: 'Admin', href: '/admin' }, { label: 'Configuración' }]

  const settingsCategories = [
    {
      title: 'Configuración de Tienda',
      description: 'Información básica, horarios y políticas',
      icon: Store,
      color: 'bg-blue-500',
      disabled: true,
    },
    {
      title: 'Métodos de Pago',
      description: 'MercadoPago, transferencias y configuración',
      icon: CreditCard,
      color: 'bg-green-500',
      href: '/admin/mercadopago',
    },
    {
      title: 'Logística y Envíos',
      description: 'Configuración de envíos, zonas y costos',
      icon: Truck,
      color: 'bg-orange-500',
      disabled: true,
    },
    {
      title: 'Notificaciones',
      description: 'Email, SMS y configuración de alertas',
      icon: Bell,
      color: 'bg-purple-500',
      disabled: true,
    },
    {
      title: 'Seguridad',
      description: 'Permisos, roles y configuración de acceso',
      icon: Shield,
      color: 'bg-red-500',
      disabled: true,
    },
    {
      title: 'Sistema',
      description: 'Configuración avanzada del sistema',
      icon: Settings,
      color: 'bg-gray-500',
      disabled: true,
    },
  ]

  return (
    <AdminLayout title='Configuración del Sistema' breadcrumbs={breadcrumbs}>
      <AdminContentWrapper>
        <div className='space-y-6'>
        {/* Header */}
        <div className='bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-4 sm:p-6 text-white'>
          <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0'>
            <div>
              <div className='flex items-center space-x-3 mb-2'>
                <Settings className='w-6 h-6 sm:w-8 sm:h-8' />
                <h1 className='text-2xl sm:text-3xl font-bold'>Configuración del Sistema</h1>
              </div>
              <p className='text-blue-100 text-sm sm:text-base'>
                Gestiona la configuración de tu tienda y sistema
              </p>
            </div>
            <div className='hidden md:block'>
              <div className='w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center'>
                <Settings className='w-8 h-8' />
              </div>
            </div>
          </div>
        </div>

        {/* Advertencia de funcionalidad limitada */}
        <AdminCard className='border-yellow-200 bg-yellow-50'>
          <div className='flex items-center space-x-2 text-yellow-700'>
            <AlertTriangle className='h-5 w-5' />
            <span>
              <strong>Nota:</strong> La mayoría de las configuraciones están en desarrollo. 
              Solo MercadoPago está disponible actualmente.
            </span>
          </div>
        </AdminCard>

        {/* Categorías de configuración */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {settingsCategories.map(category => {
            const IconComponent = category.icon

            return (
              <div
                key={category.title}
                className={`bg-gray-50 rounded-lg border p-6 transition-all ${
                  category.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:shadow-md hover:bg-white cursor-pointer'
                }`}
              >
                <div className='flex items-start justify-between mb-4'>
                  <div
                    className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center text-white`}
                  >
                    <IconComponent className='w-6 h-6' />
                  </div>
                  {category.disabled ? (
                    <span className='bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-medium'>
                      Próximamente
                    </span>
                  ) : (
                    <span className='bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium'>
                      Disponible
                    </span>
                  )}
                </div>

                <h3 className='text-lg font-semibold text-gray-900 mb-2'>{category.title}</h3>
                <p className='text-gray-600 text-sm mb-4'>{category.description}</p>

                {category.disabled ? (
                  <div className='text-gray-400 text-sm'>Funcionalidad en desarrollo</div>
                ) : (
                  <a
                    href={category.href}
                    className='inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium'
                  >
                    Configurar →
                  </a>
                )}
              </div>
            )
          })}
        </div>

        {/* Información del sistema */}
        <AdminCard title='Información del Sistema'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div>
              <h4 className='text-sm font-medium text-gray-900 mb-3'>Versión del Sistema</h4>
              <div className='space-y-2 text-sm text-gray-600'>
                <div>Versión: 1.0.0</div>
                <div>Última actualización: {new Date().toLocaleDateString()}</div>
                <div>Entorno: {process.env.NODE_ENV}</div>
              </div>
            </div>
            <div>
              <h4 className='text-sm font-medium text-gray-900 mb-3'>Estado de Servicios</h4>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <span className='text-gray-600'>Base de datos: Conectada</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                  <span className='text-gray-600'>MercadoPago: Activo</span>
                </div>
                <div className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-yellow-500 rounded-full'></div>
                  <span className='text-gray-600'>Email: En desarrollo</span>
                </div>
              </div>
            </div>
          </div>
        </AdminCard>
        </div>
      </AdminContentWrapper>
    </AdminLayout>
  )
}
