'use client'

import { UseFormReturn, FieldErrors } from 'react-hook-form'
import { AdminCard } from '../ui/AdminCard'
import { Calculator, DollarSign, TrendingUp, AlertCircle } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'

interface ProductFormData {
  price: number
  compare_price?: number
  cost_price?: number
}

interface ProductPricingProps {
  form: UseFormReturn<any>
  errors: FieldErrors<any>
  className?: string
}

export function ProductPricing({ form, errors, className }: ProductPricingProps) {
  const { register, watch, setValue } = form
  const watchedData = watch()

  // Calculate profit margin
  const calculateMargin = () => {
    const price = watchedData.price || 0
    const cost = watchedData.cost_price || 0

    if (cost === 0) {
      return 0
    }
    return ((price - cost) / price) * 100
  }

  // Calculate markup
  const calculateMarkup = () => {
    const price = watchedData.price || 0
    const cost = watchedData.cost_price || 0

    if (cost === 0) {
      return 0
    }
    return ((price - cost) / cost) * 100
  }

  // Calculate discount percentage
  const calculateDiscount = () => {
    const price = watchedData.price || 0
    const comparePrice = watchedData.compare_price || 0

    if (comparePrice === 0 || comparePrice <= price) {
      return 0
    }
    return ((comparePrice - price) / comparePrice) * 100
  }

  const margin = calculateMargin()
  const markup = calculateMarkup()
  const discount = calculateDiscount()

  // Pricing suggestions
  const suggestPricing = (cost: number) => {
    if (cost === 0) {
      return []
    }

    return [
      { label: '50% Margen', value: cost / 0.5 },
      { label: '60% Margen', value: cost / 0.4 },
      { label: '70% Margen', value: cost / 0.3 },
    ]
  }

  const suggestions = suggestPricing(watchedData.cost_price || 0)

  return (
    <div className={cn('space-y-6', className)}>
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Main Pricing */}
        <div className='lg:col-span-2 space-y-6'>
          <AdminCard title='Configuración de Precios' className='p-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              {/* Selling Price */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Precio de Venta *
                </label>
                <div className='relative'>
                  <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    {...register('price', { valueAsNumber: true })}
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='0.00'
                  />
                </div>
                {errors.price && (
                  <p className='text-red-600 text-sm mt-1'>{errors.price.message}</p>
                )}
                <p className='text-xs text-gray-500 mt-1'>Precio al que se venderá el producto</p>
              </div>

              {/* Compare Price */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Precio de Comparación
                </label>
                <div className='relative'>
                  <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    {...register('compare_price', { valueAsNumber: true })}
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='0.00'
                  />
                </div>
                {errors.compare_price && (
                  <p className='text-red-600 text-sm mt-1'>{errors.compare_price.message}</p>
                )}
                <p className='text-xs text-gray-500 mt-1'>
                  Precio original para mostrar descuentos
                </p>
              </div>

              {/* Cost Price */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Precio de Costo
                </label>
                <div className='relative'>
                  <DollarSign className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    {...register('cost_price', { valueAsNumber: true })}
                    className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='0.00'
                  />
                </div>
                {errors.cost_price && (
                  <p className='text-red-600 text-sm mt-1'>{errors.cost_price.message}</p>
                )}
                <p className='text-xs text-gray-500 mt-1'>
                  Costo del producto (no visible para clientes)
                </p>
              </div>

              {/* Discount Display */}
              {discount > 0 && (
                <div className='flex items-center space-x-2 p-3 bg-green-50 rounded-lg'>
                  <TrendingUp className='w-5 h-5 text-green-600' />
                  <div>
                    <p className='text-sm font-medium text-green-800'>
                      Descuento: {discount.toFixed(1)}%
                    </p>
                    <p className='text-xs text-green-600'>
                      Ahorro: $
                      {((watchedData.compare_price || 0) - (watchedData.price || 0)).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AdminCard>

          {/* Pricing Suggestions */}
          {suggestions.length > 0 && (
            <AdminCard title='Sugerencias de Precio' className='p-6'>
              <div className='space-y-3'>
                <p className='text-sm text-gray-600'>
                  Basado en tu precio de costo de ${(watchedData.cost_price || 0).toFixed(2)}:
                </p>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type='button'
                      onClick={() => setValue('price', suggestion.value)}
                      className='p-3 border border-gray-200 rounded-lg hover:border-blaze-orange-300 hover:bg-blaze-orange-50 transition-colors text-left'
                    >
                      <div className='text-sm font-medium text-gray-900'>{suggestion.label}</div>
                      <div className='text-lg font-bold text-blaze-orange-600'>
                        ${suggestion.value.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </AdminCard>
          )}
        </div>

        {/* Pricing Analytics */}
        <div className='space-y-6'>
          {/* Profit Metrics */}
          <AdminCard title='Métricas de Rentabilidad' className='p-6'>
            <div className='space-y-4'>
              {/* Profit Margin */}
              <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                <div>
                  <p className='text-sm font-medium text-gray-700'>Margen de Ganancia</p>
                  <p className='text-xs text-gray-500'>Ganancia / Precio de Venta</p>
                </div>
                <div className='text-right'>
                  <p
                    className={cn(
                      'text-lg font-bold',
                      margin >= 50
                        ? 'text-green-600'
                        : margin >= 30
                          ? 'text-yellow-600'
                          : 'text-red-600'
                    )}
                  >
                    {margin.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Markup */}
              <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                <div>
                  <p className='text-sm font-medium text-gray-700'>Markup</p>
                  <p className='text-xs text-gray-500'>Ganancia / Costo</p>
                </div>
                <div className='text-right'>
                  <p className='text-lg font-bold text-gray-900'>{markup.toFixed(1)}%</p>
                </div>
              </div>

              {/* Profit Amount */}
              <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                <div>
                  <p className='text-sm font-medium text-gray-700'>Ganancia por Unidad</p>
                  <p className='text-xs text-gray-500'>Precio - Costo</p>
                </div>
                <div className='text-right'>
                  <p className='text-lg font-bold text-gray-900'>
                    ${((watchedData.price || 0) - (watchedData.cost_price || 0)).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </AdminCard>

          {/* Pricing Alerts */}
          <AdminCard title='Alertas de Precio' className='p-6'>
            <div className='space-y-3'>
              {margin < 20 && watchedData.cost_price > 0 && (
                <div className='flex items-start space-x-2 p-3 bg-red-50 rounded-lg'>
                  <AlertCircle className='w-5 h-5 text-red-500 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-red-800'>Margen Bajo</p>
                    <p className='text-xs text-red-600'>El margen de ganancia es menor al 20%</p>
                  </div>
                </div>
              )}

              {watchedData.compare_price > 0 && watchedData.price >= watchedData.compare_price && (
                <div className='flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg'>
                  <AlertCircle className='w-5 h-5 text-yellow-500 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-yellow-800'>Sin Descuento</p>
                    <p className='text-xs text-yellow-600'>
                      El precio de venta debe ser menor al precio de comparación
                    </p>
                  </div>
                </div>
              )}

              {!watchedData.cost_price && (
                <div className='flex items-start space-x-2 p-3 bg-blue-50 rounded-lg'>
                  <Calculator className='w-5 h-5 text-blue-500 mt-0.5' />
                  <div>
                    <p className='text-sm font-medium text-blue-800'>Agrega el Costo</p>
                    <p className='text-xs text-blue-600'>
                      Ingresa el precio de costo para ver métricas de rentabilidad
                    </p>
                  </div>
                </div>
              )}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  )
}
