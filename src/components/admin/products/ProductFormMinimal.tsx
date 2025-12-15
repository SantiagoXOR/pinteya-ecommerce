'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminCard } from '../ui/AdminCard'
import { CategorySelector } from './CategorySelector'
import { BrandSelector } from './BrandSelector'
import { MeasureSelector } from './MeasureSelector'
import { TerminacionSelector } from './TerminacionSelector'
import { ColorPickerField } from './ColorPickerField'
import { VariantBuilder, VariantFormData } from './VariantBuilder'
import { ImageUploadZone } from './ImageUploadZone'
import { useProductNotifications } from '@/hooks/admin/useProductNotifications'
import { Save, X, Upload, Plus, Edit, Trash2 } from '@/lib/optimized-imports'
import Image from 'next/image'
import { cn } from '@/lib/core/utils'

// Schema de validación minimalista
const ProductSchema = z.object({
  // Información Básica
  name: z.string().min(1, 'El nombre es requerido').max(255),
  description: z.string().max(5000).optional(),
  brand: z.string().max(100).optional(),
  category_ids: z.array(z.number().int().positive()).min(1, 'Selecciona al menos una categoría'),
  is_active: z.boolean().default(true),
  
  // Metadata
  aikon_id: z.string().max(50).optional(),
  color: z.string().max(100).optional(),
  medida: z.array(z.string()).optional(),
  terminaciones: z.array(z.string()).optional(),
  
  // Precios & Stock
  price: z.number().min(0.01, 'El precio debe ser mayor a 0'),
  discounted_price: z.number().min(0).optional().nullable(),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0'),
  
  // Imagen
  image_url: z.string().url().optional().nullable(),
  
  // Para badges
  featured: z.boolean().default(false),
  created_at: z.string().optional(),
})

type ProductFormData = z.infer<typeof ProductSchema>

interface ProductVariant {
  id?: number
  color_name: string
  color_hex?: string
  measure: string
  finish: string
  price_list: number
  price_sale: number
  stock: number
  aikon_id: string
  image_url?: string
  is_active?: boolean
  is_default?: boolean
}

interface ProductFormMinimalProps {
  initialData?: Partial<ProductFormData>
  productId?: string
  mode?: 'create' | 'edit'
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
}

export function ProductFormMinimal({
  initialData,
  productId,
  mode = 'create',
  onSubmit,
  onCancel,
  isLoading = false,
}: ProductFormMinimalProps) {
  const notifications = useProductNotifications()
  const queryClient = useQueryClient()
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image_url || null)
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null)
  const [showVariantModal, setShowVariantModal] = useState(false)
  const [newVariants, setNewVariants] = useState<VariantFormData[]>([])

  const openNewVariant = () => {
    setEditingVariant({
      color_name: '',
      color_hex: undefined,
      measure: '',
      finish: 'Mate',
      price_list: 0,
      price_sale: 0,
      stock: 0,
      aikon_id: '',
      is_active: true,
      is_default: false,
    })
    setShowVariantModal(true)
  }
  
  // Fetch variantes desde BD
  const { data: variantsData, isLoading: variantsLoading } = useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/variants`)
      const json = await res.json()
      return json.data || []
    },
    enabled: !!productId && mode === 'edit'
  })
  
  const variants = variantsData || []
  
  // Mutaciones para variantes
  const createVariantMutation = useMutation({
    mutationFn: async (variant: any) => {
      const res = await fetch('/api/admin/products/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...variant, product_id: productId })
      })
      if (!res.ok) throw new Error('Error creando variante')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      notifications.showInfoMessage('Variante creada', 'La variante se creó exitosamente')
    },
    onError: (error: any) => {
      console.error('Error al crear variante:', error)
    }
  })
  
  const updateVariantMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      console.log('🚀 [Frontend] Enviando actualización de variante:', {
        id,
        data,
        dataKeys: Object.keys(data),
        stock: data.stock,
        stockType: typeof data.stock
      })
      
      const res = await fetch(`/api/products/${productId}/variants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      
      console.log('📡 [Frontend] Respuesta del servidor:', {
        status: res.status,
        ok: res.ok
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('❌ [Frontend] Error del servidor:', res.status, errorData)
        throw new Error(errorData.error || `Error ${res.status}: Error actualizando variante`)
      }
      
      const result = await res.json()
      console.log('✅ [Frontend] Variante actualizada, respuesta:', result)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      notifications.showInfoMessage('Variante actualizada', 'La variante se actualizó exitosamente')
    },
    onError: (error: any) => {
      console.error('Error al actualizar variante:', error)
    }
  })
  
  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: number) => {
      const res = await fetch(`/api/products/${productId}/variants/${variantId}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error eliminando variante')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] })
      notifications.showInfoMessage('Variante eliminada', 'La variante se eliminó exitosamente')
    },
    onError: (error: any) => {
      console.error('Error al eliminar variante:', error)
    }
  })

  // Normalizar initialData para convertir category_id a category_ids si es necesario
  const normalizedInitialData = initialData
    ? {
        ...initialData,
        category_ids: initialData.category_ids
          ? initialData.category_ids
          : (initialData as any).category_id
          ? [(initialData as any).category_id]
          : [],
        terminaciones: initialData.terminaciones || [],
      }
    : {}

  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      is_active: true,
      stock: 0,
      price: 0,
      featured: false,
      discounted_price: null,
      image_url: null,
      medida: [],
      terminaciones: [],
      category_ids: [],
      created_at: new Date().toISOString(),
      ...normalizedInitialData,
    },
  })

  const {
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    register,
  } = form

  const watchedData = watch()

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      notifications.showProcessingInfo(
        mode === 'create' ? 'Creando producto...' : 'Actualizando producto...'
      )
      
      // Primero guardar/actualizar el producto
      const result = await onSubmit(data)
      
      // Obtener productId del resultado o usar el existente
      const finalProductId = (result as any)?.id || productId || (result as any)?.data?.id
      
      // Si hay variantes nuevas y tenemos productId, crearlas
      if (newVariants.length > 0 && finalProductId) {
        notifications.showProcessingInfo('Creando variantes...')
        
        for (const variant of newVariants) {
          try {
            const response = await fetch('/api/admin/products/variants', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_id: parseInt(String(finalProductId)),
                aikon_id: variant.aikon_id,
                color_name: variant.color_name || null,
                color_hex: variant.color_hex || null,
                measure: variant.measure,
                finish: variant.finish || 'Mate',
                price_list: variant.price_list,
                price_sale: variant.price_sale || null,
                stock: variant.stock,
                image_url: variant.image_url || null,
                is_active: variant.is_active !== false,
                is_default: variant.is_default || false,
              }),
            })

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }))
              throw new Error(errorData.error || 'Error creando variante')
            }
          } catch (error) {
            console.error('Error creando variante:', error)
            notifications.showInfoMessage(
              'Error creando variante',
              error instanceof Error ? error.message : 'Error desconocido'
            )
          }
        }

        // Limpiar variantes después de crearlas
        setNewVariants([])
        queryClient.invalidateQueries({ queryKey: ['product-variants', finalProductId] })
      }
      
      if (mode === 'create') {
        notifications.showProductCreated({ productName: data.name })
      } else {
        notifications.showProductUpdated({ productName: data.name })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      if (mode === 'create') {
        notifications.showProductCreationError('Error al guardar el producto')
      } else {
        notifications.showProductUpdateError('Error al guardar el producto', data.name)
      }
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImagePreview(url || null)
  }

  // Variant modal handlers
  const openCreateVariant = () => {
    setEditingVariant({
      color_name: '',
      measure: '',
      finish: 'Mate',
      price_list: 0,
      price_sale: 0,
      stock: 0,
      aikon_id: '',
      image_url: '',
      is_active: true,
      is_default: false,
    })
    setShowVariantModal(true)
  }

  const openEditVariant = (variant: ProductVariant) => {
    setEditingVariant(variant)
    setShowVariantModal(true)
  }

  const deleteVariant = async (index: number) => {
    const variant = variants[index]
    if (variant?.id && confirm('¿Eliminar esta variante?')) {
      await deleteVariantMutation.mutateAsync(variant.id)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Header Sticky */}
      <div className='sticky top-0 z-10 bg-white border-b border-gray-200 -mx-6 px-6 py-4 shadow-sm'>
        <div className='flex items-center justify-between'>
          <h1 className='text-2xl font-bold text-gray-900'>
            {mode === 'create' ? 'Crear Producto' : 'Editar Producto'}
          </h1>
          <div className='flex items-center space-x-3'>
            {onCancel && (
              <button
                type='button'
                onClick={onCancel}
                className='flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900'
              >
                <X className='w-4 h-4' />
                <span>Cancelar</span>
              </button>
            )}
            <button
              type='submit'
              form='product-form-minimal'
              disabled={isLoading || !isDirty}
              className='flex items-center space-x-2 px-4 py-2 bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white rounded-lg disabled:opacity-50'
            >
              <Save className='w-4 h-4' />
              <span>{mode === 'create' ? 'Crear' : 'Guardar'}</span>
            </button>
          </div>
        </div>
      </div>

      <form id='product-form-minimal' onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
        {/* Información Básica */}
        <AdminCard title='Información Básica'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <div className='lg:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Nombre del Producto *
              </label>
              <input
                {...register('name')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500'
                placeholder='Ej: Látex Interior Blanco 4L'
              />
              {errors.name && <p className='text-red-600 text-sm mt-1'>{errors.name.message}</p>}
            </div>

            <div className='lg:col-span-2'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Descripción</label>
              <textarea
                {...register('description')}
                rows={4}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500'
                placeholder='Descripción del producto'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Marca</label>
              <BrandSelector
                value={watchedData.brand || ''}
                onChange={(brand) => form.setValue('brand', brand, { shouldDirty: true })}
                placeholder='Selecciona o crea una marca'
                allowCreate={true}
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Categorías *
              </label>
              <CategorySelector
                value={watchedData.category_ids || []}
                onChange={(categoryIds) => form.setValue('category_ids', Array.isArray(categoryIds) ? categoryIds : [categoryIds], { shouldDirty: true })}
                multiple={true}
                {...(errors.category_ids?.message && { error: errors.category_ids.message })}
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Código Aikon (SKU)
              </label>
              <input
                {...register('aikon_id')}
                className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500'
                placeholder='Ej: AIKON-12345'
              />
            </div>

            <ColorPickerField
              colorName={watchedData.color || ''}
              onColorChange={(name) => form.setValue('color', name, { shouldDirty: true })}
              label='Color del Producto'
            />

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Medidas
              </label>
              <MeasureSelector
                value={watchedData.medida || []}
                onChange={(measures) => form.setValue('medida', measures, { shouldDirty: true })}
                placeholder='Selecciona o agrega medidas'
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Terminaciones
              </label>
              <TerminacionSelector
                value={watchedData.terminaciones || []}
                onChange={(terminaciones) => form.setValue('terminaciones', terminaciones, { shouldDirty: true })}
                placeholder='Selecciona o agrega terminaciones'
              />
            </div>

            <div className='flex items-center space-x-2'>
              <input
                type='checkbox'
                {...register('is_active')}
                className='w-4 h-4 text-blaze-orange-600 rounded focus:ring-blaze-orange-500'
              />
              <label className='text-sm font-medium text-gray-700'>Producto Activo</label>
            </div>
          </div>
        </AdminCard>

        {/* Precios & Stock */}
        <AdminCard title='Precios & Stock'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Precio *
              </label>
              <div className='relative'>
                <span className='absolute left-3 top-2.5 text-gray-500'>$</span>
                <input
                  type='number'
                  step='0.01'
                  {...register('price', { valueAsNumber: true })}
                  className='w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 text-gray-900'
                  placeholder='0.00'
                />
              </div>
              {errors.price && <p className='text-red-600 text-sm mt-1'>{errors.price.message}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Precio con Descuento
              </label>
              <div className='relative'>
                <span className='absolute left-3 top-2.5 text-gray-500'>$</span>
                <input
                  type='number'
                  step='0.01'
                  {...register('discounted_price', { valueAsNumber: true })}
                  className='w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 text-gray-900'
                  placeholder='0.00'
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Stock *</label>
                <input
                  type='number'
                  {...register('stock', { valueAsNumber: true })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 text-gray-900'
                  placeholder='0'
                />
              {errors.stock && <p className='text-red-600 text-sm mt-1'>{errors.stock.message}</p>}
            </div>
          </div>
        </AdminCard>

        {/* Variantes - Usar VariantBuilder para creación inline */}
        <AdminCard title='Variantes del Producto'>
          {productId && mode === 'edit' ? (
            // Modo edición: mostrar variantes existentes y permitir agregar nuevas
            <div className='space-y-4'>
              {variants.length > 0 && (
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Color
                        </th>
                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Capacidad
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
                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Código Aikon
                        </th>
                        <th className='px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase'>
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {variants.map((variant: ProductVariant, index: number) => (
                        <tr key={variant.id || index} className='hover:bg-gray-50'>
                          <td className='px-4 py-3 text-sm text-gray-900'>{variant.color_name}</td>
                          <td className='px-4 py-3 text-sm text-gray-900'>{variant.measure}</td>
                          <td className='px-4 py-3 text-sm text-gray-900'>{variant.finish}</td>
                          <td className='px-4 py-3 text-sm text-gray-900'>
                            ${variant.price_sale.toLocaleString('es-AR')}
                          </td>
                          <td className='px-4 py-3 text-sm text-gray-900'>{variant.stock}</td>
                          <td className='px-4 py-3 text-sm text-gray-500 font-mono'>
                            {variant.aikon_id}
                          </td>
                          <td className='px-4 py-3 text-right space-x-2'>
                            <button
                              type='button'
                              onClick={() => openEditVariant(variant)}
                              className='inline-flex items-center p-1 text-blue-600 hover:text-blue-800'
                            >
                              <Edit className='w-4 h-4' />
                            </button>
                            <button
                              type='button'
                              onClick={() => deleteVariant(index)}
                              className='inline-flex items-center p-1 text-red-600 hover:text-red-800'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* VariantBuilder para agregar nuevas variantes */}
              <VariantBuilder
                variants={newVariants}
                onChange={setNewVariants}
                measures={watchedData.medida || []}
                terminaciones={watchedData.terminaciones || []}
              />
            </div>
          ) : (
            // Modo creación: solo VariantBuilder (las variantes se crearán después de guardar el producto)
            <VariantBuilder
              variants={newVariants}
              onChange={setNewVariants}
              measures={watchedData.medida || []}
              terminaciones={watchedData.terminaciones || []}
            />
          )}
        </AdminCard>

        {/* Imagen */}
        <AdminCard title='Imagen del Producto'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {productId && mode === 'edit' ? (
              <ImageUploadZone
                productId={productId}
                currentImageUrl={imagePreview || watchedData.image_url || null}
                onUploadSuccess={(imageUrl) => {
                  setImagePreview(imageUrl)
                  form.setValue('image_url', imageUrl || null, { shouldDirty: true })
                }}
                onError={(error) => {
                  notifications.showInfoMessage('Error al subir imagen', error)
                }}
              />
            ) : (
              <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300'>
                {imagePreview || watchedData.image_url ? (
                  <Image
                    src={imagePreview || watchedData.image_url || ''}
                    alt={watchedData.name || 'Producto'}
                    width={400}
                    height={400}
                    className='w-full h-full object-cover'
                    unoptimized
                  />
                ) : (
                  <div className='text-center text-gray-400'>
                    <Upload className='w-12 h-12 mx-auto mb-2' />
                    <p className='text-sm'>Sin imagen</p>
                  </div>
                )}
              </div>
            )}

            <div className='space-y-3'>
              {(!productId || mode === 'create') && (
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    URL de Imagen
                  </label>
                  <input
                    type='url'
                    {...register('image_url')}
                    onChange={handleImageChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500'
                    placeholder='https://ejemplo.com/imagen.jpg'
                  />
                  {errors.image_url && (
                    <p className='text-red-600 text-sm mt-1'>{errors.image_url.message}</p>
                  )}
                  <p className='text-xs text-gray-500 mt-2'>
                    Nota: Para crear un producto nuevo, primero guárdalo y luego podrás subir imágenes arrastrándolas.
                  </p>
                </div>
              )}

              <div className='flex items-center space-x-2 mt-4'>
                <input
                  type='checkbox'
                  {...register('featured')}
                  className='w-4 h-4 text-blaze-orange-600 rounded focus:ring-blaze-orange-500'
                />
                <label className='text-sm font-medium text-gray-700'>
                  Marcar como Destacado ⭐
                </label>
              </div>
            </div>
          </div>
        </AdminCard>
      </form>

      {/* Modal de Variante */}
      {showVariantModal && editingVariant && (
        <VariantModal
          variant={editingVariant}
          onSave={async (variant) => {
            try {
              if (variant.id) {
                // Editar existente
                await updateVariantMutation.mutateAsync({ id: variant.id, ...variant })
              } else {
                // Crear nueva
                await createVariantMutation.mutateAsync(variant)
              }
              setShowVariantModal(false)
              setEditingVariant(null)
            } catch (error) {
              // Error ya manejado en las mutaciones
              console.error('Error guardando variante:', error)
            }
          }}
          onCancel={() => {
            setShowVariantModal(false)
            setEditingVariant(null)
          }}
        />
      )}
    </div>
  )
}

// Modal de Variante
interface VariantModalProps {
  variant: ProductVariant
  onSave: (variant: ProductVariant) => void
  onCancel: () => void
}

function VariantModal({ variant, onSave, onCancel }: VariantModalProps) {
  const [formData, setFormData] = useState(variant)
  const [imagePreview, setImagePreview] = useState<string | null>(variant.image_url || null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.color_name || formData.color_name.trim() === '') {
      newErrors.color_name = 'El color es requerido'
    }
    
    if (!formData.measure || formData.measure.trim() === '') {
      newErrors.measure = 'La capacidad es requerida'
    }
    
    if (!formData.aikon_id || formData.aikon_id.trim() === '') {
      newErrors.aikon_id = 'El código Aikon es requerido'
    }
    
    if (!formData.price_list || formData.price_list <= 0) {
      newErrors.price_list = 'El precio de lista debe ser mayor a 0'
    }
    
    if (formData.stock < 0) {
      newErrors.stock = 'El stock no puede ser negativo'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (validateForm()) {
      onSave(formData)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setFormData({ ...formData, image_url: url })
    setImagePreview(url || null)
  }

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto'>
        <div className='p-6 border-b border-gray-200 sticky top-0 bg-white z-10'>
          <div className='flex items-center justify-between'>
            <h2 className='text-xl font-bold text-gray-900'>
              {variant.id ? 'Editar Variante' : 'Crear Variante'}
            </h2>
            {formData.is_default && (
              <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800'>
                ★ Predeterminada
              </span>
            )}
          </div>
        </div>

        <div className='p-6 space-y-6'>
          {/* Imagen de la Variante */}
          <div className='border-b border-gray-200 pb-6'>
            <h3 className='text-sm font-semibold text-gray-900 mb-4'>Imagen de la Variante</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='aspect-square bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300'>
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt={formData.color_name || 'Variante'}
                    width={300}
                    height={300}
                    className='w-full h-full object-cover'
                    unoptimized
                  />
                ) : (
                  <div className='text-center text-gray-400'>
                    <Upload className='w-12 h-12 mx-auto mb-2' />
                    <p className='text-sm'>Sin imagen</p>
                  </div>
                )}
              </div>
              <div className='space-y-3'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    URL de Imagen
                  </label>
                  <input
                    type='url'
                    value={formData.image_url || ''}
                    onChange={handleImageChange}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500'
                    placeholder='https://ejemplo.com/imagen.jpg'
                  />
                </div>
                <p className='text-xs text-gray-500'>
                  💡 Tip: Usa imágenes específicas para cada color/variante
                </p>
              </div>
            </div>
          </div>

          {/* Información Básica */}
          <div>
            <h3 className='text-sm font-semibold text-gray-900 mb-4'>Información Básica</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <ColorPickerField
                colorName={formData.color_name}
                colorHex={formData.color_hex}
                onColorChange={(name, hex) => {
                  setFormData({ ...formData, color_name: name, color_hex: hex })
                  if (errors.color_name) setErrors({ ...errors, color_name: '' })
                }}
                label='Color *'
                error={errors.color_name}
              />

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Capacidad *
                </label>
                <input
                  value={formData.measure || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, measure: e.target.value })
                    if (errors.measure) setErrors({ ...errors, measure: '' })
                  }}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2',
                    errors.measure
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blaze-orange-500'
                  )}
                  placeholder='Ej: 1L, 4L, 20L'
                />
                {errors.measure && (
                  <p className='text-red-600 text-sm mt-1'>{errors.measure}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Terminación
                </label>
                <select
                  value={formData.finish || 'Mate'}
                  onChange={(e) => setFormData({ ...formData, finish: e.target.value })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500'
                >
                  <option value='Mate'>Mate</option>
                  <option value='Satinado'>Satinado</option>
                  <option value='Brillante'>Brillante</option>
                  <option value='Rústico'>Rústico</option>
                </select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Código Aikon (SKU) *
                </label>
                <input
                  value={formData.aikon_id || ''}
                  onChange={(e) => {
                    setFormData({ ...formData, aikon_id: e.target.value })
                    if (errors.aikon_id) setErrors({ ...errors, aikon_id: '' })
                  }}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2',
                    errors.aikon_id
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blaze-orange-500'
                  )}
                  placeholder='SKU único'
                />
                {errors.aikon_id && (
                  <p className='text-red-600 text-sm mt-1'>{errors.aikon_id}</p>
                )}
              </div>
            </div>
          </div>

          {/* Precios y Stock */}
          <div>
            <h3 className='text-sm font-semibold text-gray-900 mb-4'>Precios y Stock</h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Precio Lista *
                </label>
                <div className='relative'>
                  <span className='absolute left-3 top-2.5 text-gray-500'>$</span>
                  <input
                    type='number'
                    step='0.01'
                    value={formData.price_list || 0}
                    onChange={(e) => {
                      setFormData({ ...formData, price_list: parseFloat(e.target.value) || 0 })
                      if (errors.price_list) setErrors({ ...errors, price_list: '' })
                    }}
                    className={cn(
                      'w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2',
                      errors.price_list
                        ? 'border-red-300 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blaze-orange-500'
                    )}
                    placeholder='0.00'
                  />
                </div>
                {errors.price_list && (
                  <p className='text-red-600 text-sm mt-1'>{errors.price_list}</p>
                )}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Precio Venta
                </label>
                <div className='relative'>
                  <span className='absolute left-3 top-2.5 text-gray-500'>$</span>
                  <input
                    type='number'
                    step='0.01'
                    value={formData.price_sale || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, price_sale: e.target.value ? parseFloat(e.target.value) : 0 })
                    }
                    className='w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500'
                    placeholder='0.00'
                  />
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Stock *</label>
                <input
                  type='number'
                  value={formData.stock || 0}
                  onChange={(e) => {
                    setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                    if (errors.stock) setErrors({ ...errors, stock: '' })
                  }}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:ring-2',
                    errors.stock
                      ? 'border-red-300 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blaze-orange-500'
                  )}
                  placeholder='0'
                />
                {errors.stock && (
                  <p className='text-red-600 text-sm mt-1'>{errors.stock}</p>
                )}
              </div>
            </div>
          </div>

          {/* Estado y Configuración */}
          <div>
            <h3 className='text-sm font-semibold text-gray-900 mb-4'>Estado y Configuración</h3>
            <div className='space-y-4'>
              <div className='flex items-center justify-between p-4 bg-gray-50 rounded-lg'>
                <div className='flex-1'>
                  <label className='text-sm font-medium text-gray-900'>Variante Activa</label>
                  <p className='text-xs text-gray-500 mt-1'>
                    Las variantes inactivas no se mostrarán en la tienda
                  </p>
                </div>
                <button
                  type='button'
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    formData.is_active ? 'bg-green-600' : 'bg-gray-300'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                      formData.is_active ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>

              <div className='flex items-center p-4 bg-amber-50 rounded-lg border border-amber-200'>
                <input
                  type='checkbox'
                  checked={formData.is_default || false}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className='w-4 h-4 text-amber-600 rounded focus:ring-amber-500'
                />
                <div className='ml-3 flex-1'>
                  <label className='text-sm font-medium text-gray-900'>
                    Marcar como predeterminada
                  </label>
                  <p className='text-xs text-gray-500 mt-1'>
                    Esta variante se seleccionará por defecto en la tienda
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className='p-6 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 sticky bottom-0'>
          <button
            type='button'
            onClick={onCancel}
            className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors'
          >
            Cancelar
          </button>
          <button
            type='button'
            onClick={handleSave}
            className='px-4 py-2 bg-blaze-orange-600 text-white rounded-lg hover:bg-blaze-orange-700 transition-colors'
          >
            Guardar Variante
          </button>
        </div>
      </div>
    </div>
  )
}

