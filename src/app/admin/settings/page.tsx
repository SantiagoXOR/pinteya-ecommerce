'use client';

import { AdminLayout } from '@/components/admin/layout/AdminLayout';
import { AdminCard } from '@/components/admin/ui/AdminCard';
import { Settings, Store, CreditCard, Truck, Bell, Shield, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const breadcrumbs = [
    { label: 'Admin', href: '/admin' },
    { label: 'Configuración' },
  ];

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
      disabled: true,
    },
    {
      title: 'Envíos y Logística',
      description: 'Zonas de entrega, costos y tiempos',
      icon: Truck,
      color: 'bg-purple-500',
      disabled: true,
    },
    {
      title: 'Notificaciones',
      description: 'Emails, SMS y alertas del sistema',
      icon: Bell,
      color: 'bg-yellow-500',
      disabled: true,
    },
    {
      title: 'Seguridad',
      description: 'Usuarios, roles y permisos',
      icon: Shield,
      color: 'bg-red-500',
      disabled: true,
    },
  ];

  const currentSettings = {
    store_name: 'Pinteya E-commerce',
    store_email: 'info@pinteya.com',
    store_phone: '+54 351 123-4567',
    store_address: 'Córdoba Capital, Argentina',
    currency: 'ARS',
    timezone: 'America/Argentina/Cordoba',
    tax_rate: '21.0%',
    shipping_enabled: true,
    payment_methods: ['MercadoPago', 'Transferencia', 'Efectivo'],
  };

  return (
    <AdminLayout
      title="Configuración del Sistema"
      breadcrumbs={breadcrumbs}
    >
      <div className="space-y-6">
        {/* Aviso de funcionalidad en desarrollo */}
        <AdminCard className="p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Módulo en Desarrollo
              </h3>
              <p className="text-gray-600 mt-1">
                La configuración completa del sistema estará disponible en una próxima versión. 
                Actualmente puedes ver la configuración actual de solo lectura.
              </p>
            </div>
          </div>
        </AdminCard>

        {/* Configuración actual */}
        <AdminCard
          title="Configuración Actual"
          description="Vista de solo lectura de la configuración del sistema"
          className="p-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Información de la Tienda</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Nombre:</span>
                  <span className="text-sm font-medium text-gray-900">{currentSettings.store_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Email:</span>
                  <span className="text-sm font-medium text-gray-900">{currentSettings.store_email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Teléfono:</span>
                  <span className="text-sm font-medium text-gray-900">{currentSettings.store_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Dirección:</span>
                  <span className="text-sm font-medium text-gray-900">{currentSettings.store_address}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Configuración Regional</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Moneda:</span>
                  <span className="text-sm font-medium text-gray-900">{currentSettings.currency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Zona Horaria:</span>
                  <span className="text-sm font-medium text-gray-900">{currentSettings.timezone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">IVA:</span>
                  <span className="text-sm font-medium text-gray-900">{currentSettings.tax_rate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Envíos:</span>
                  <span className={`text-sm font-medium ${currentSettings.shipping_enabled ? 'text-green-600' : 'text-red-600'}`}>
                    {currentSettings.shipping_enabled ? 'Habilitado' : 'Deshabilitado'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Métodos de Pago</h4>
            <div className="flex flex-wrap gap-2">
              {currentSettings.payment_methods.map((method) => (
                <span
                  key={method}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium bg-blaze-orange-100 text-blaze-orange-800 rounded-full"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </AdminCard>

        {/* Categorías de configuración */}
        <AdminCard
          title="Categorías de Configuración"
          description="Módulos de configuración disponibles (próximamente)"
          padding="none"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {settingsCategories.map((category) => (
              <div
                key={category.title}
                className={`relative p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${
                  category.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${category.color}`}>
                    {category && category.icon && <category.icon className="w-6 h-6 text-white" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {category.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {category.description}
                    </p>
                  </div>
                </div>
                
                {category.disabled && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Próximamente
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </AdminCard>
      </div>
    </AdminLayout>
  );
}
