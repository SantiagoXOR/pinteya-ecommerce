'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit, X } from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'
import { MeasureSelectorSingle } from './MeasureSelectorSingle'
import { ColorPickerField } from './ColorPickerField'

export interface VariantFormData {
  id?: number
  color_name: string
  color_hex?: string
  aikon_id: number | null
  measure: string
  finish: string
  price_list: number
  price_sale?: number
  stock: number
  image_url?: string
  is_active?: boolean
  is_default?: boolean
}

interface VariantBuilderProps {
  variants: VariantFormData[]
  onChange: (variants: VariantFormData[]) => void
  measures?: string[]
  terminaciones?: string[]
  className?: string
}

const FINISH_OPTIONS = ['Mate', 'Satinado', 'Brillante'] // Fallback por defecto

export function VariantBuilder({
  variants,
  onChange,
  measures = [],
  terminaciones = [],
  className,
}: VariantBuilderProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<VariantFormData>({
    color_name: '',
    color_hex: undefined,
    aikon_id: null,
    measure: '',
    finish: 'Mate',
    price_list: 0,
    price_sale: 0,
    stock: 0,
    is_active: true,
    is_default: false,
  })

  const handleAdd = () => {
    if (!formData.aikon_id || formData.price_list <= 0) {
      return
    }

    const newVariants = [...variants, { ...formData }]
    onChange(newVariants)
    resetForm()
  }

  const handleEdit = (index: number) => {
    setFormData(variants[index])
    setEditingIndex(index)
  }

  const handleUpdate = () => {
    if (editingIndex === null || !formData.aikon_id || formData.price_list <= 0) {
      return
    }

    const newVariants = [...variants]
    newVariants[editingIndex] = { ...formData }
    onChange(newVariants)
    resetForm()
  }

  const handleDelete = (index: number) => {
    const newVariants = variants.filter((_, i) => i !== index)
    onChange(newVariants)
  }

  const handleSetDefault = (index: number) => {
    const newVariants = variants.map((v, i) => ({
      ...v,
      is_default: i === index,
    }))
    onChange(newVariants)
  }

  const resetForm = () => {
    setFormData({
      color_name: '',
      color_hex: undefined,
      aikon_id: null,
      measure: '',
      finish: 'Mate',
      price_list: 0,
      price_sale: 0,
      stock: 0,
      is_active: true,
      is_default: false,
    })
    setEditingIndex(null)
  }

  const isFormValid = formData.aikon_id && formData.price_list > 0

  return (
    <div className={cn('space-y-4', className)}>
      {/* Variants Table */}
      {variants.length > 0 && (
        <div className='border border-gray-200 rounded-lg overflow-hidden'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Color
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Aikon ID
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Medida
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Terminación
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Precio
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                    Stock
                  </th>
                  <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase'>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {variants.map((variant, index) => (
                  <tr key={index} className={cn('hover:bg-gray-50', variant.is_default && 'bg-amber-50')}>
                    <td className='px-4 py-3 text-sm text-gray-900'>{variant.color_name || '-'}</td>
                    <td className='px-4 py-3 text-sm font-mono text-gray-900'>{variant.aikon_id}</td>
                    <td className='px-4 py-3 text-sm text-gray-900'>{variant.measure}</td>
                    <td className='px-4 py-3 text-sm text-gray-900'>{variant.finish}</td>
                    <td className='px-4 py-3 text-sm text-gray-900'>
                      ${variant.price_list.toLocaleString('es-AR')}
                      {variant.price_sale && variant.price_sale < variant.price_list && (
                        <span className='ml-2 text-xs text-green-600'>
                          (${variant.price_sale.toLocaleString('es-AR')})
                        </span>
                      )}
                    </td>
                    <td className='px-4 py-3 text-sm text-gray-900'>{variant.stock}</td>
                    <td className='px-4 py-3 text-right space-x-2'>
                      {variant.is_default && (
                        <span className='inline-flex items-center px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full mr-2'>
                          ★ Default
                        </span>
                      )}
                      <button
                        type='button'
                        onClick={() => handleEdit(index)}
                        className='inline-flex items-center p-1 text-blue-600 hover:text-blue-800'
                        title='Editar variante'
                      >
                        <Edit className='w-4 h-4' />
                      </button>
                      <button
                        type='button'
                        onClick={() => handleDelete(index)}
                        className='inline-flex items-center p-1 text-red-600 hover:text-red-800'
                        title='Eliminar variante'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      <div className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
        <h3 className='text-sm font-semibold text-gray-900 mb-4'>
          {editingIndex !== null ? 'Editar Variante' : 'Agregar Nueva Variante'}
        </h3>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Color */}
          <ColorPickerField
            colorName={formData.color_name}
            colorHex={formData.color_hex}
            onColorChange={(name, hex) => setFormData({ ...formData, color_name: name, color_hex: hex })}
            label='Color (Opcional)'
            className='text-xs'
          />

          {/* Aikon ID */}
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1'>
              Código Aikon *
            </label>
            <input
              type='text'
              value={formData.aikon_id}
              onChange={(e) => setFormData({ ...formData, aikon_id: e.target.value })}
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 text-gray-900'
              placeholder='AIKON-12345'
            />
          </div>

          {/* Medida */}
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1'>
              Medida (Opcional)
            </label>
            <MeasureSelectorSingle
              value={formData.measure}
              onChange={(measure) => setFormData({ ...formData, measure })}
              placeholder='Selecciona o agrega medida'
            />
          </div>

          {/* Terminación */}
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1'>
              Terminación
            </label>
            <select
              value={formData.finish}
              onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 text-gray-900'
            >
              {(terminaciones.length > 0 ? terminaciones : FINISH_OPTIONS).map((finish) => (
                <option key={finish} value={finish}>
                  {finish}
                </option>
              ))}
            </select>
          </div>

          {/* Precio Lista */}
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1'>
              Precio Lista *
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-2.5 text-gray-500 text-sm'>$</span>
              <input
                type='number'
                step='0.01'
                value={formData.price_list || ''}
                onChange={(e) => setFormData({ ...formData, price_list: parseFloat(e.target.value) || 0 })}
                className='w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 text-gray-900'
                placeholder='0.00'
              />
            </div>
          </div>

          {/* Precio Venta */}
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1'>
              Precio Venta
            </label>
            <div className='relative'>
              <span className='absolute left-3 top-2.5 text-gray-500 text-sm'>$</span>
              <input
                type='number'
                step='0.01'
                value={formData.price_sale || ''}
                onChange={(e) => setFormData({ ...formData, price_sale: parseFloat(e.target.value) || 0 })}
                className='w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 text-gray-900'
                placeholder='0.00'
              />
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1'>
              Stock *
            </label>
            <input
              type='number'
              value={formData.stock || ''}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 text-gray-900'
              placeholder='0'
            />
          </div>

          {/* URL Imagen */}
          <div>
            <label className='block text-xs font-medium text-gray-700 mb-1'>
              URL Imagen
            </label>
            <input
              type='url'
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className='w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 text-gray-900'
              placeholder='https://...'
            />
          </div>
        </div>

        {/* Actions */}
        <div className='flex items-center justify-between mt-4 pt-4 border-t border-gray-200'>
          <div className='flex items-center space-x-2'>
            <input
              type='checkbox'
              checked={formData.is_default || false}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className='w-4 h-4 text-amber-600 rounded focus:ring-amber-500'
            />
            <label className='text-sm text-gray-700'>Marcar como predeterminada</label>
          </div>

          <div className='flex items-center space-x-2'>
            {editingIndex !== null && (
              <button
                type='button'
                onClick={resetForm}
                className='px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700'
              >
                Cancelar
              </button>
            )}
            <button
              type='button'
              onClick={editingIndex !== null ? handleUpdate : handleAdd}
              disabled={!isFormValid}
              className='px-4 py-2 text-sm bg-blaze-orange-600 text-white rounded-lg hover:bg-blaze-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
            >
              <Plus className='w-4 h-4' />
              <span>{editingIndex !== null ? 'Actualizar' : 'Agregar'} Variante</span>
            </button>
          </div>
        </div>
      </div>

      {variants.length === 0 && (
        <div className='text-center py-8 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg'>
          <p>No hay variantes agregadas.</p>
          <p className='mt-1'>Agrega variantes para ofrecer diferentes opciones de color, medida y precio.</p>
        </div>
      )}
    </div>
  )
}

