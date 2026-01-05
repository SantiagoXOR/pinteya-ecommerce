'use client'

import { AdminCard } from '../ui/AdminCard'
import { Input } from '../ui/Input'
import { SystemSettings } from '@/hooks/admin/useSettings'
import { Truck, Package, ShoppingCart } from '@/lib/optimized-imports'

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

      <AdminCard title='Carrito' description='Configuración de límites de carrito'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Input
            label='Máximo Items en Carrito'
            type='number'
            value={settings.ecommerce.max_cart_items.toString()}
            onChange={(e) => handleChange('max_cart_items', parseInt(e.target.value) || 1)}
            icon={ShoppingCart}
            min={1}
            max={100}
            helperText='Número máximo de productos que se pueden agregar al carrito'
          />
        </div>
      </AdminCard>
    </div>
  )
}
