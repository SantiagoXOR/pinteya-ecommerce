'use client'

import { AdminCard } from '../ui/AdminCard'
import { Input } from '../ui/Input'
import { SystemSettings } from '@/hooks/admin/useSettings'
import { Receipt, Truck, Package, ShoppingCart, Clock } from '@/lib/optimized-imports'

interface EcommerceSettingsProps {
  settings: SystemSettings
  onChange: (updates: Partial<SystemSettings>) => void
}

export function EcommerceSettings({ settings, onChange }: EcommerceSettingsProps) {
  const handleChange = <K extends keyof SystemSettings['ecommerce']>(
    key: K,
    value: SystemSettings['ecommerce'][K]
  ) => {
    onChange({
      ecommerce: {
        ...settings.ecommerce,
        [key]: value,
      },
    })
  }

  return (
    <div className='space-y-6'>
      <AdminCard title='Impuestos y Precios' description='Configuración de impuestos y precios'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Input
            label='Tasa de Impuesto (%)'
            type='number'
            value={settings.ecommerce.tax_rate.toString()}
            onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) || 0)}
            icon={Receipt}
            min={0}
            max={100}
            step={0.01}
            helperText='Porcentaje de IVA o impuesto aplicado'
          />
        </div>
      </AdminCard>

      <AdminCard title='Envíos' description='Configuración de costos y políticas de envío'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Input
            label='Costo de Envío (ARS)'
            type='number'
            value={settings.ecommerce.shipping_cost.toString()}
            onChange={(e) => handleChange('shipping_cost', parseFloat(e.target.value) || 0)}
            icon={Truck}
            min={0}
            step={0.01}
            prefix='$'
          />

          <Input
            label='Umbral Envío Gratis (ARS)'
            type='number'
            value={settings.ecommerce.free_shipping_threshold.toString()}
            onChange={(e) => handleChange('free_shipping_threshold', parseFloat(e.target.value) || 0)}
            icon={Truck}
            min={0}
            step={0.01}
            prefix='$'
            helperText='Monto mínimo para envío gratis'
          />
        </div>
      </AdminCard>

      <AdminCard title='Inventario' description='Gestión de stock y productos'>
        <div className='space-y-6'>
          <div className='flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg'>
            <div>
              <p className='font-medium text-gray-900'>Tracking de Inventario</p>
              <p className='text-sm text-gray-600'>Rastrear stock disponible de productos</p>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.ecommerce.inventory_tracking}
                onChange={(e) => handleChange('inventory_tracking', e.target.checked)}
                className='sr-only peer'
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Input
              label='Umbral Stock Bajo'
              type='number'
              value={settings.ecommerce.low_stock_threshold.toString()}
              onChange={(e) => handleChange('low_stock_threshold', parseInt(e.target.value) || 0)}
              icon={Package}
              min={0}
              helperText='Número de unidades para alerta de stock bajo'
            />

            <div className='flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg'>
              <div>
                <p className='font-medium text-gray-900'>Permitir Backorders</p>
                <p className='text-sm text-gray-600'>Permitir compras cuando no hay stock</p>
              </div>
              <label className='relative inline-flex items-center cursor-pointer'>
                <input
                  type='checkbox'
                  checked={settings.ecommerce.allow_backorders}
                  onChange={(e) => handleChange('allow_backorders', e.target.checked)}
                  className='sr-only peer'
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </AdminCard>

      <AdminCard title='Reseñas y Carrito' description='Configuración de reseñas y límites de carrito'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div className='flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg'>
            <div>
              <p className='font-medium text-gray-900'>Aprobar Reseñas Automáticamente</p>
              <p className='text-sm text-gray-600'>Las reseñas se publican sin moderación</p>
            </div>
            <label className='relative inline-flex items-center cursor-pointer'>
              <input
                type='checkbox'
                checked={settings.ecommerce.auto_approve_reviews}
                onChange={(e) => handleChange('auto_approve_reviews', e.target.checked)}
                className='sr-only peer'
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <Input
            label='Máximo Items en Carrito'
            type='number'
            value={settings.ecommerce.max_cart_items.toString()}
            onChange={(e) => handleChange('max_cart_items', parseInt(e.target.value) || 1)}
            icon={ShoppingCart}
            min={1}
            max={100}
          />
        </div>
      </AdminCard>

      <AdminCard title='Sesiones' description='Configuración de tiempo de sesión'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Input
            label='Timeout de Sesión (minutos)'
            type='number'
            value={settings.ecommerce.session_timeout.toString()}
            onChange={(e) => handleChange('session_timeout', parseInt(e.target.value) || 30)}
            icon={Clock}
            min={5}
            max={1440}
            helperText='Tiempo de inactividad antes de cerrar sesión'
          />
        </div>
      </AdminCard>
    </div>
  )
}
