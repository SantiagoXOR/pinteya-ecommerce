'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Palette, Package, DollarSign, Hash } from '@/lib/optimized-imports'
import { Input } from '../ui/Input'
import { ImageUpload } from '../ui/ImageUpload'
import { Badge } from '../ui/Badge'
import { MeasureSelectorSingle } from './MeasureSelectorSingle'
import { cn } from '@/lib/core/utils'

export interface ProductVariant {
  id?: number
  color_name: string
  color_hex?: string
  measure: string
  finish: string | null
  price_list: number
  price_sale: number | null
  stock: number
  aikon_id: string
  image_url?: string | null
  is_active?: boolean
  is_default?: boolean
}

interface VariantModalProps {
  isOpen: boolean
  onClose: () => void
  variant: ProductVariant | null
  onSave: (variant: ProductVariant) => Promise<void>
  mode: 'create' | 'edit'
  isLoading?: boolean
}

export function VariantModal({
  isOpen,
  onClose,
  variant,
  onSave,
  mode,
  isLoading = false
}: VariantModalProps) {
  const [formData, setFormData] = useState<ProductVariant>(
    variant || {
      color_name: '',
      color_hex: '',
      measure: '',
      finish: 'Mate',
      price_list: 0,
      price_sale: 0,
      stock: 0,
      aikon_id: '',
      image_url: '',
      is_active: true,
      is_default: false,
    }
  )

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Color y medida son opcionales ahora
    if (formData.price_list <= 0) {
      newErrors.price_list = 'El precio debe ser mayor a 0'
    }
    if (formData.stock < 0) {
      newErrors.stock = 'El stock debe ser mayor o igual a 0'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validate()) return
    
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Error saving variant:', error)
    }
  }

  const updateField = (field: keyof ProductVariant, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50'
          />
          
          {/* Modal */}
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className='relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl'
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className='sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 rounded-lg bg-primary/10'>
                      <Package className='h-5 w-5 text-primary' />
                    </div>
                    <div>
                      <h2 className='text-xl font-bold text-gray-900'>
                        {mode === 'create' ? 'Crear Variante' : 'Editar Variante'}
                      </h2>
                      {variant?.id && (
                        <p className='text-sm text-gray-500'>
                          ID: #{variant.id}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className='p-2 rounded-lg hover:bg-gray-100 transition-colors'
                    type='button'
                  >
                    <X className='h-5 w-5' />
                  </button>
                </div>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className='p-6 space-y-6'>
                {/* Status Badges */}
                <div className='flex items-center gap-2'>
                  <label className='flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors'>
                    <input
                      type='checkbox'
                      checked={formData.is_active}
                      onChange={(e) => updateField('is_active', e.target.checked)}
                      className='w-4 h-4 text-primary rounded focus:ring-primary'
                    />
                    <span className='text-sm font-medium'>Activa</span>
                  </label>
                  
                  <label className='flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors'>
                    <input
                      type='checkbox'
                      checked={formData.is_default}
                      onChange={(e) => updateField('is_default', e.target.checked)}
                      className='w-4 h-4 text-primary rounded focus:ring-primary'
                    />
                    <span className='text-sm font-medium'>Predeterminada</span>
                  </label>
                </div>

                {/* Grid de campos */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  {/* Color */}
                  <div className='md:col-span-2'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <Input
                        label='Nombre del Color (Opcional)'
                        value={formData.color_name}
                        onChange={(e) => updateField('color_name', e.target.value)}
                        error={errors.color_name}
                        placeholder='Ej: BLANCO, TERRACOTA'
                        icon={Palette}
                      />
                      
                      <div className='space-y-2'>
                        <label className='block text-sm font-medium text-gray-700'>
                          Código Color (Hex)
                        </label>
                        <div className='flex gap-2'>
                          <input
                            type='color'
                            value={formData.color_hex || '#ffffff'}
                            onChange={(e) => updateField('color_hex', e.target.value)}
                            className='h-11 w-20 rounded-lg border border-gray-300 cursor-pointer'
                          />
                          <Input
                            value={formData.color_hex || ''}
                            onChange={(e) => updateField('color_hex', e.target.value)}
                            placeholder='#FFFFFF'
                            className='flex-1'
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medida */}
                  <div className='space-y-2'>
                    <label className='block text-sm font-medium text-gray-700'>
                      Medida (Opcional)
                    </label>
                    <MeasureSelectorSingle
                      value={formData.measure}
                      onChange={(measure) => updateField('measure', measure)}
                      placeholder='Selecciona o agrega medida'
                      error={errors.measure}
                    />
                  </div>

                  {/* Terminación */}
                  <div className='space-y-2'>
                    <label className='block text-sm font-medium text-gray-700'>
                      Terminación
                    </label>
                    <select
                      value={formData.finish || 'Mate'}
                      onChange={(e) => updateField('finish', e.target.value)}
                      className='w-full h-11 px-3 rounded-lg border border-gray-300 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all'
                    >
                      <option value='Mate'>Mate</option>
                      <option value='Satinado'>Satinado</option>
                      <option value='Semi-brillante'>Semi-brillante</option>
                      <option value='Brillante'>Brillante</option>
                    </select>
                  </div>

                  {/* Precios */}
                  <Input
                    label='Precio Lista'
                    type='number'
                    step='0.01'
                    value={formData.price_list}
                    onChange={(e) => updateField('price_list', parseFloat(e.target.value) || 0)}
                    error={errors.price_list}
                    placeholder='0.00'
                    prefix='$'
                    icon={DollarSign}
                    required
                  />

                  <Input
                    label='Precio Venta'
                    type='number'
                    step='0.01'
                    value={formData.price_sale || 0}
                    onChange={(e) => updateField('price_sale', parseFloat(e.target.value) || 0)}
                    placeholder='0.00'
                    prefix='$'
                    icon={DollarSign}
                  />

                  {/* Stock */}
                  <Input
                    label='Stock'
                    type='number'
                    value={formData.stock}
                    onChange={(e) => updateField('stock', parseInt(e.target.value) || 0)}
                    error={errors.stock}
                    placeholder='0'
                    suffix='unidades'
                    required
                  />

                  {/* Código Aikon */}
                  <Input
                    label='Código Aikon (SKU)'
                    value={formData.aikon_id}
                    onChange={(e) => updateField('aikon_id', e.target.value)}
                    placeholder='Ej: 49'
                    icon={Hash}
                  />
                </div>

                {/* Imagen */}
                <ImageUpload
                  label='Imagen de la Variante'
                  value={formData.image_url}
                  onChange={(url) => updateField('image_url', url)}
                  helperText='URL de la imagen específica para esta variante'
                  preview
                />

                {/* Footer con Acciones */}
                <div className='sticky bottom-0 -mx-6 -mb-6 mt-8 px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between'>
                  <button
                    type='button'
                    onClick={onClose}
                    className='px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:shadow-sm transition-all duration-200'
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type='submit'
                    disabled={isLoading}
                    className='flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
                  >
                    <Save className='h-4 w-4' />
                    {isLoading ? 'Guardando...' : mode === 'create' ? 'Crear Variante' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

