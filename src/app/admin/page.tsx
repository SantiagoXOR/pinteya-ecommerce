import Link from 'next/link';
import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminCard } from '@/components/admin/ui/AdminCard';
import {
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Database,
  CreditCard,
  Search,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function AdminPage() {
  const adminSections = [
    {
      title: 'Productos',
      description: 'Gestionar catálogo de productos, precios y stock',
      href: '/admin/products',
      icon: Package,
      color: 'bg-blue-500',
      stats: '156 productos'
    },
    {
      title: 'Órdenes',
      description: 'Gestionar pedidos, estados y fulfillment',
      href: '/admin/orders',
      icon: ShoppingCart,
      color: 'bg-green-500',
      stats: '23 pendientes',
      badge: 'Beta'
    },
    {
      title: 'Clientes',
      description: 'Gestionar usuarios y perfiles de clientes',
      href: '/admin/customers',
      icon: Users,
      color: 'bg-purple-500',
      stats: '1,247 usuarios',
      badge: 'Beta'
    },
    {
      title: 'Analytics',
      description: 'Métricas avanzadas y reportes de rendimiento',
      href: '/admin/analytics',
      icon: BarChart3,
      color: 'bg-yellow-500',
      stats: 'Tiempo real'
    },
    {
      title: 'MercadoPago',
      description: 'Configuración y métricas de pagos',
      href: '/admin/mercadopago',
      icon: CreditCard,
      color: 'bg-indigo-500',
      stats: 'Enterprise'
    },
    {
      title: 'Diagnósticos',
      description: 'Herramientas de debugging y verificación del sistema',
      href: '/admin/diagnostics',
      icon: Search,
      color: 'bg-red-500',
      stats: 'Sistema OK'
    },
    {
      title: 'Configuración',
      description: 'Configurar parámetros del sistema',
      href: '/admin/settings',
      icon: Settings,
      color: 'bg-gray-500',
      stats: 'Solo lectura',
      badge: 'Beta'
    },
    {
      title: 'Base de Datos',
      description: 'Herramientas de gestión de base de datos',
      href: '/admin/database',
      icon: Database,
      color: 'bg-orange-500',
      stats: 'Próximamente',
      disabled: true
    }
  ];

  // Quick stats data
  const quickStats = [
    {
      title: 'Ventas Hoy',
      value: '$12,450',
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: TrendingUp,
    },
    {
      title: 'Órdenes Pendientes',
      value: '23',
      change: '+3',
      changeType: 'neutral' as const,
      icon: ShoppingCart,
    },
    {
      title: 'Stock Bajo',
      value: '8',
      change: '-2',
      changeType: 'negative' as const,
      icon: AlertTriangle,
    },
    {
      title: 'Usuarios Activos',
      value: '1,247',
      change: '+12%',
      changeType: 'positive' as const,
      icon: Users,
    },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <AdminCard className="bg-gradient-to-r from-blaze-orange-500 to-blaze-orange-600 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                ¡Bienvenido al Panel Administrativo!
              </h1>
              <p className="text-blaze-orange-100">
                Gestiona y monitorea tu tienda de e-commerce desde aquí
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <BarChart3 className="w-8 h-8" />
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat) => (
            <AdminCard key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                  <p className={`text-sm mt-1 ${
                    stat.changeType === 'positive'
                      ? 'text-green-600'
                      : stat.changeType === 'negative'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {stat.change} desde ayer
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  stat.changeType === 'positive'
                    ? 'bg-green-100'
                    : stat.changeType === 'negative'
                    ? 'bg-red-100'
                    : 'bg-gray-100'
                }`}>
                  {stat && stat.icon && (
                    <stat.icon className={`w-6 h-6 ${
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : stat.changeType === 'negative'
                        ? 'text-red-600'
                        : 'text-gray-600'
                    }`} />
                  )}
                </div>
              </div>
            </AdminCard>
          ))}
        </div>

        {/* Admin Sections Grid */}
        <AdminCard
          title="Módulos Administrativos"
          description="Accede a las diferentes secciones del panel"
          padding="none"
        >
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adminSections.map((section) => {
                const IconComponent = section && section.icon ? section.icon : null;

                return (
                  <div
                    key={section.title}
                    className={`bg-gray-50 rounded-lg border p-6 transition-all ${
                      section.disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:shadow-md hover:bg-white cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 ${section.color} rounded-lg flex items-center justify-center text-white`}>
                        {IconComponent && <IconComponent className="w-6 h-6" />}
                      </div>
                      {section.disabled ? (
                        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                          Próximamente
                        </span>
                      ) : section.badge ? (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                          {section.badge}
                        </span>
                      ) : (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                          {section.stats}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {section.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {section.description}
                    </p>

                    {section.disabled ? (
                      <div className="text-gray-400 text-sm">
                        Funcionalidad en desarrollo
                      </div>
                    ) : (
                      <Link
                        href={section.href}
                        className="inline-flex items-center text-blaze-orange-600 hover:text-blaze-orange-800 text-sm font-medium"
                      >
                        {section.badge ? 'Ver Preview →' : 'Acceder →'}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </AdminCard>

        {/* System Status */}
        <AdminCard
          title="Estado del Sistema"
          description="Monitoreo en tiempo real del estado de la aplicación"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✅</span>
              </div>
              <div className="text-sm font-medium text-green-800">Sistema Operativo</div>
              <div className="text-xs text-green-600 mt-1">Todos los servicios funcionando</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔄</span>
              </div>
              <div className="text-sm font-medium text-blue-800">Sincronización Activa</div>
              <div className="text-xs text-blue-600 mt-1">Última sync: hace 2 min</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">⚡</span>
              </div>
              <div className="text-sm font-medium text-yellow-800">Performance Óptimo</div>
              <div className="text-xs text-yellow-600 mt-1">Tiempo respuesta: 120ms</div>
            </div>
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
