'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AdminCard } from '../ui/AdminCard'
import { CategorySelector } from './CategorySelector'
import { BrandSelector } from './BrandSelector'
import { MeasureSelector } from './MeasureSelector'
import { TerminacionSelector } from './TerminacionSelector'
import { ColorPickerField } from './ColorPickerField'
import { VariantBuilder, VariantFormData } from './VariantBuilder'
import { ImageUploadZone } from './ImageUploadZone'
import { ProductImageGallery } from './ProductImageGallery'
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
  discount_percent: z.number().min(0).max(100).optional().nullable(), // ✅ NUEVO: Porcentaje de descuento
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0'),
  
  // Imagen
  image_url: z
    .union([
      z.string().url('URL de imagen inválida'),
      z.literal(''),
      z.null(),
    ])
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
  
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
  // ✅ NUEVO: Exponer funciones para que los botones externos puedan usarlas
  onFormReady?: (submitForm: () => void, isDirty: () => boolean) => void
}

export function ProductFormMinimal({
  initialData,
  productId,
  mode = 'create',
  onSubmit,
  onCancel,
  isLoading = false,
  onFormReady,
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
      const res = await fetch(`/api/products/${productId}/variants`, {
        credentials: 'include',
        cache: 'no-store',
      })
      const json = await res.json()
      return json.data || []
    },
    enabled: !!productId && mode === 'edit',
    staleTime: Infinity, // ✅ CORREGIDO: Los datos son válidos hasta que los actualicemos manualmente
    gcTime: 5 * 60 * 1000, // ✅ Mantener en cache 5 minutos
    refetchOnMount: false, // ✅ No refetchear al montar si hay datos en cache
    refetchOnWindowFocus: false, // ✅ No refetchear al enfocar ventana
  })
  
  // ✅ CORREGIDO: Asegurar que variants siempre sea un array
  const variants = Array.isArray(variantsData) ? variantsData : []
  
  // Mutaciones para variantes
  const createVariantMutation = useMutation({
    mutationFn: async (variant: any) => {
      const res = await fetch('/api/admin/products/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...variant, product_id: productId }),
        credentials: 'include', // ✅ Incluir cookies de autenticación
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
      // ✅ CORREGIDO: Filtrar solo campos permitidos y remover undefined
      const allowedFields = [
        'color_name',
        'color_hex',
        'measure',
        'finish',
        'price_list',
        'price_sale',
        'stock',
        'is_active',
        'is_default',
        'image_url',
        'aikon_id',
      ]
      
      // ✅ CORREGIDO: Incluir image_url y color_hex incluso si es null (para permitir limpiarlos)
      const cleanedData = Object.fromEntries(
        Object.entries(data)
          .filter(([key, value]) => {
            if (!allowedFields.includes(key)) return false
            // ✅ CORREGIDO: Incluir image_url y color_hex incluso si es null
            if (key === 'image_url' || key === 'color_hex') return true
            // Para otros campos, excluir undefined
            return value !== undefined
          })
      )
      
      console.log('🚀 [Frontend] Enviando actualización de variante:', {
        id,
        originalData: data,
        cleanedData,
        dataKeys: Object.keys(cleanedData),
        color_name: cleanedData.color_name,
        color_nameType: typeof cleanedData.color_name,
        color_nameInCleaned: 'color_name' in cleanedData,
        image_url: cleanedData.image_url,
        image_urlType: typeof cleanedData.image_url,
        color_hex: cleanedData.color_hex,
        color_hexType: typeof cleanedData.color_hex,
        stock: cleanedData.stock,
        stockType: typeof cleanedData.stock,
        price_list: cleanedData.price_list,
        price_sale: cleanedData.price_sale,
        allValues: Object.entries(cleanedData).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value.substring(0, 50) : value,
          type: typeof value,
          isNull: value === null,
          isUndefined: value === undefined,
        })),
      })
      
      const res = await fetch(`/api/products/${productId}/variants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData),
        credentials: 'include',
      })
      
      console.log('📡 [Frontend] Respuesta del servidor:', {
        status: res.status,
        ok: res.ok
      })
      
      // ✅ IMPORTANTE: Verificar res.ok ANTES de leer el body
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Error desconocido' }))
        console.error('❌ [Frontend] Error del servidor:', res.status, errorData)
        throw new Error(errorData.error || `Error ${res.status}: Error actualizando variante`)
      }
      
      // Leer el body solo cuando la respuesta es exitosa
      const result = await res.json()
      console.log('✅ [Frontend] Variante actualizada, respuesta:', result)
      return result
    },
    onSuccess: (data) => {
      // ✅ Actualizar el cache directamente con los datos actualizados del backend
      if (data?.data && productId) {
        queryClient.setQueryData(['product-variants', productId], (oldData: any) => {
          if (!Array.isArray(oldData)) {
            // Si no hay datos antiguos, crear array con la variante actualizada
            return [data.data]
          }
          // Actualizar la variante existente o agregarla si no existe
          return oldData.map((v: any) => v.id === data.data.id ? data.data : v)
        })
      }
      
      notifications.showInfoMessage('Variante actualizada', 'La variante se actualizó exitosamente')
    },
    onError: (error: any) => {
      console.error('Error al actualizar variante:', error)
    }
  })
  
  const deleteVariantMutation = useMutation({
    mutationFn: async (variantId: number) => {
      const res = await fetch(`/api/products/${productId}/variants/${variantId}`, {
        method: 'DELETE',
        credentials: 'include', // ✅ Incluir cookies de autenticación
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
        // ✅ CORREGIDO: Extraer category_ids desde product_categories si está presente
        category_ids: (() => {
          // Si ya hay category_ids, usarlos
          if (initialData.category_ids) {
            return Array.isArray(initialData.category_ids) 
              ? initialData.category_ids 
              : [initialData.category_ids]
          }
          
          // Si hay product_categories, extraer los category_id
          const productCategories = (initialData as any).product_categories
          if (productCategories && Array.isArray(productCategories) && productCategories.length > 0) {
            const categoryIds = productCategories
              .map((pc: any) => pc.category_id || pc.category?.id)
              .filter((id: any) => id != null && !isNaN(id))
            if (categoryIds.length > 0) {
              return categoryIds
            }
          }
          
          // Fallback a category_id singular si existe
          if ((initialData as any).category_id) {
            return [(initialData as any).category_id]
          }
          
          return []
        })(),
        // ✅ CORREGIDO: Asegurar que terminaciones siempre sea un array
        terminaciones: Array.isArray(initialData.terminaciones) 
          ? initialData.terminaciones 
          : (initialData.terminaciones ? [initialData.terminaciones] : []),
        // ✅ CORREGIDO: Asegurar que medida siempre sea un array
        medida: (() => {
          const rawMedida = (initialData as any).medida
          if (!rawMedida) return []
          if (Array.isArray(rawMedida)) return rawMedida
          if (typeof rawMedida === 'string') {
            // Intentar parsear si es un string de array JSON
            if (rawMedida.trim().startsWith('[') && rawMedida.trim().endsWith(']')) {
              try {
                const parsed = JSON.parse(rawMedida)
                return Array.isArray(parsed) ? parsed : [parsed]
              } catch {
                return [rawMedida]
              }
            }
            return [rawMedida]
          }
          return [String(rawMedida)]
        })(),
        // ✅ NUEVO: Calcular discount_percent inicial si hay discounted_price
        discount_percent: 
          initialData.discounted_price && initialData.price && initialData.price > 0
            ? Math.round(((initialData.price - initialData.discounted_price) / initialData.price) * 1000) / 10
            : null,
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
      discount_percent: null, // ✅ NUEVO: Porcentaje de descuento
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
    setValue,
  } = form

  const watchedData = watch()
  const formRef = useRef<HTMLFormElement>(null)

  // ✅ NUEVO: Exponer funciones al componente padre para que los botones externos puedan usarlas
  // Usar useRef para almacenar la función checkDirty y evitar re-renders infinitos
  const isDirtyRef = useRef(isDirty)
  isDirtyRef.current = isDirty

  useEffect(() => {
    if (onFormReady) {
      const submitForm = () => {
        if (formRef.current) {
          formRef.current.requestSubmit()
        }
      }
      const checkDirty = () => isDirtyRef.current
      onFormReady(submitForm, checkDirty)
    }
    // ✅ Solo ejecutar cuando onFormReady cambia, NO cuando isDirty cambia
  }, [onFormReady])

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
              credentials: 'include', // ✅ Incluir cookies de autenticación
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
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar el producto'
      if (mode === 'create') {
        notifications.showProductCreationError(errorMessage)
      } else {
        notifications.showProductUpdateError(errorMessage, data.name)
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
      <form 
        id='product-form-minimal' 
        ref={formRef}
        onSubmit={handleSubmit(handleFormSubmit)} 
        className='space-y-6'
      >
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
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Precio *
              </label>
              <div className='relative'>
                <span className='absolute left-3 top-2.5 text-gray-500'>$</span>
                <input
                  type='number'
                  step='0.01'
                  {...register('price', { 
                    valueAsNumber: true,
                    onChange: (e) => {
                      const price = parseFloat(e.target.value) || 0
                      const discountPercent = watch('discount_percent')
                      if (discountPercent && discountPercent > 0 && discountPercent <= 100) {
                        const discountedPrice = price * (1 - discountPercent / 100)
                        setValue('discounted_price', Math.round(discountedPrice * 100) / 100, { shouldDirty: true })
                      }
                    }
                  })}
                  className='w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 text-gray-900'
                  placeholder='0.00'
                />
              </div>
              {errors.price && <p className='text-red-600 text-sm mt-1'>{errors.price.message}</p>}
            </div>

            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Porcentaje de Descuento
              </label>
              <div className='flex gap-2'>
                <div className='relative flex-1'>
                  <input
                    type='number'
                    min='0'
                    max='100'
                    step='0.1'
                    {...register('discount_percent', { 
                      valueAsNumber: true,
                      onChange: (e) => {
                        const discountPercent = parseFloat(e.target.value) || 0
                        const price = watch('price') || 0
                        if (discountPercent > 0 && discountPercent <= 100 && price > 0) {
                          const discountedPrice = price * (1 - discountPercent / 100)
                          setValue('discounted_price', Math.round(discountedPrice * 100) / 100, { shouldDirty: true })
                        } else if (discountPercent === 0 || !discountPercent) {
                          setValue('discounted_price', null, { shouldDirty: true })
                        }
                      }
                    })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 text-gray-900'
                    placeholder='0'
                  />
                  <span className='absolute right-3 top-2.5 text-gray-500 text-sm'>%</span>
                </div>
                <button
                  type='button'
                  onClick={() => {
                    setValue('discount_percent', 0, { shouldDirty: true })
                    setValue('discounted_price', null, { shouldDirty: true })
                  }}
                  className='px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                  title='Limpiar descuento'
                >
                  <X className='w-4 h-4' />
                </button>
              </div>
              {watch('discount_percent') > 0 && watch('price') > 0 && (
                <p className='text-xs text-gray-500 mt-1'>
                  Descuento: ${((watch('price') || 0) * (watch('discount_percent') || 0) / 100).toFixed(2)}
                </p>
              )}
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
                  {...register('discounted_price', { 
                    valueAsNumber: true,
                    onChange: (e) => {
                      const discountedPrice = parseFloat(e.target.value) || 0
                      const price = watch('price') || 0
                      if (discountedPrice > 0 && price > 0) {
                        const calculatedPercent = ((price - discountedPrice) / price) * 100
                        setValue('discount_percent', Math.round(calculatedPercent * 10) / 10, { shouldDirty: true })
                      } else if (!discountedPrice || discountedPrice === 0) {
                        setValue('discount_percent', 0, { shouldDirty: true })
                      }
                    }
                  })}
                  className='w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 text-gray-900'
                  placeholder='0.00'
                />
              </div>
              {watch('discounted_price') && watch('price') && watch('discounted_price') < watch('price') && (
                <p className='text-xs text-green-600 mt-1'>
                  Ahorro: ${((watch('price') || 0) - (watch('discounted_price') || 0)).toFixed(2)}
                </p>
              )}
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
              {variants.length > 0 ? (
                <div className='overflow-x-auto'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr>
                        <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase'>
                          Imagen
                        </th>
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
                          <td className='px-4 py-3'>
                            {variant.image_url ? (
                              <div className='relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200'>
                                <Image
                                  src={variant.image_url}
                                  alt={`${variant.color_name || 'Variante'} ${variant.measure || ''}`}
                                  fill
                                  className='object-cover'
                                  unoptimized
                                />
                              </div>
                            ) : (
                              <div className='w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center'>
                                <span className='text-xs text-gray-400'>Sin imagen</span>
                              </div>
                            )}
                          </td>
                          <td className='px-4 py-3 text-sm text-gray-900'>{variant.color_name || '-'}</td>
                          <td className='px-4 py-3 text-sm text-gray-900'>{variant.measure || '-'}</td>
                          <td className='px-4 py-3 text-sm text-gray-900'>{variant.finish || '-'}</td>
                          <td className='px-4 py-3 text-sm text-gray-900'>
                            ${variant.price_sale?.toLocaleString('es-AR') || variant.price_list?.toLocaleString('es-AR') || '0'}
                          </td>
                          <td className='px-4 py-3 text-sm text-gray-900'>{variant.stock || 0}</td>
                          <td className='px-4 py-3 text-sm text-gray-500 font-mono'>
                            {variant.aikon_id || '-'}
                          </td>
                          <td className='px-4 py-3 text-right space-x-2'>
                            {variant.is_default && (
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 mr-2'>
                                Predeterminada
                              </span>
                            )}
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
              ) : (
                <div className='text-center py-8 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg'>
                  <p>No hay variantes agregadas.</p>
                  <p className='mt-1'>Agrega variantes para ofrecer diferentes opciones de color, medida y precio.</p>
                </div>
              )}

              {/* Botón para agregar nueva variante */}
              <div className='flex justify-end'>
                <button
                  type='button'
                  onClick={openNewVariant}
                  className='inline-flex items-center px-4 py-2 bg-blaze-orange-600 text-white rounded-lg hover:bg-blaze-orange-700 transition-colors'
                >
                  <Plus className='w-4 h-4 mr-2' />
                  Agregar Nueva Variante
                </button>
              </div>

              {/* VariantBuilder para agregar nuevas variantes - Solo mostrar si hay variantes nuevas */}
              {newVariants.length > 0 && (
                <VariantBuilder
                  variants={newVariants}
                  onChange={setNewVariants}
                  measures={watchedData.medida || []}
                  terminaciones={watchedData.terminaciones || []}
                />
              )}
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
        <AdminCard title='Imágenes del Producto'>
          {productId && mode === 'edit' ? (
            // ✅ NUEVO: Galería de imágenes múltiples para productos existentes
            <ProductImageGallery productId={productId} />
          ) : (
            // Modo creación: upload simple o URL
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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

              <div className='space-y-3'>
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
                    Nota: Para crear un producto nuevo, primero guárdalo y luego podrás subir múltiples imágenes arrastrándolas. Las imágenes se procesarán automáticamente a formato 1:1 con fondo blanco.
                  </p>
                </div>

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
          )}
        </AdminCard>
      </form>

      {/* Modal de Variante */}
      {showVariantModal && editingVariant && (
        <VariantModal
          variant={editingVariant}
          productId={productId}
          onSave={async (variant) => {
            try {
              if (variant.id) {
                // Editar existente
                await updateVariantMutation.mutateAsync({ id: variant.id, ...variant })
              } else {
                // Crear nueva
                await createVariantMutation.mutateAsync(variant)
              }
              
              // ✅ El cache ya se actualizó en onSuccess con los datos del backend
              // Solo invalidar otras queries relacionadas para asegurar consistencia
              await queryClient.invalidateQueries({ queryKey: ['default-variant-image', productId] })
              
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
  productId?: string
  onSave: (variant: ProductVariant) => void
  onCancel: () => void
}

function VariantModal({ variant, productId, onSave, onCancel }: VariantModalProps) {
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
      // ✅ CORREGIDO: Normalizar datos antes de guardar para asegurar tipos correctos
      // Solo incluir campos que se pueden actualizar (excluir id, product_id, etc.)
      const normalizedData: any = {
        // Campos de texto
        color_name: formData.color_name?.trim() || undefined,
        // ✅ CORREGIDO: Permitir null para color_hex (puede ser null para limpiar el color)
        color_hex: formData.color_hex && formData.color_hex.trim() !== '' 
          ? formData.color_hex.trim() 
          : (formData.color_hex === null ? null : undefined),
        measure: formData.measure?.trim() || undefined,
        finish: formData.finish || undefined,
        aikon_id: formData.aikon_id?.trim() || undefined,
        // Asegurar que price_list sea número
        price_list: typeof formData.price_list === 'number' 
          ? formData.price_list 
          : parseFloat(String(formData.price_list || 0)) || 0,
        // Asegurar que price_sale sea número o null (no 0 cuando está vacío)
        price_sale: formData.price_sale && formData.price_sale > 0
          ? (typeof formData.price_sale === 'number' 
              ? formData.price_sale 
              : parseFloat(String(formData.price_sale)) || null)
          : null,
        // Asegurar que stock sea número entero
        stock: typeof formData.stock === 'number' 
          ? Math.floor(formData.stock) 
          : parseInt(String(formData.stock || 0), 10) || 0,
        // Asegurar que image_url sea string o null (no string vacío)
        image_url: formData.image_url && formData.image_url.trim() !== '' 
          ? formData.image_url.trim() 
          : null,
        // Campos booleanos
        is_active: formData.is_active !== undefined ? formData.is_active : undefined,
        is_default: formData.is_default !== undefined ? formData.is_default : undefined,
      }
      
      // ✅ CORREGIDO: Remover campos undefined para no enviarlos al backend
      const cleanedData = Object.fromEntries(
        Object.entries(normalizedData).filter(([_, value]) => value !== undefined)
      )
      
      // ✅ DEBUG: Log para verificar datos normalizados
      console.log('💾 [VariantModal] handleSave - formData normalizado:', {
        id: formData.id,
        cleanedData,
        color_name: cleanedData.color_name,
        color_nameType: typeof cleanedData.color_name,
        color_nameInCleaned: 'color_name' in cleanedData,
        image_url: cleanedData.image_url,
        image_urlType: typeof cleanedData.image_url,
        color_hex: cleanedData.color_hex,
        color_hexType: typeof cleanedData.color_hex,
        price_list: cleanedData.price_list,
        price_sale: cleanedData.price_sale,
        stock: cleanedData.stock,
        stockType: typeof cleanedData.stock,
        priceListType: typeof cleanedData.price_list,
        priceSaleType: typeof cleanedData.price_sale,
        allKeys: Object.keys(cleanedData),
        allValues: Object.entries(cleanedData).map(([key, value]) => ({
          key,
          value,
          type: typeof value,
          isNull: value === null,
          isUndefined: value === undefined,
        })),
      })
      
      // ✅ CORREGIDO: Pasar solo los datos limpios (sin id, que va en la URL)
      // Asegurar que image_url se incluya correctamente (puede ser null)
      const finalData = { ...formData, ...cleanedData }
      
      // ✅ CORREGIDO: Si image_url es null, incluirlo explícitamente para que el backend lo procese
      if ('image_url' in cleanedData) {
        finalData.image_url = cleanedData.image_url
      }
      
      console.log('💾 [VariantModal] Datos finales a enviar:', {
        id: finalData.id,
        color_name: finalData.color_name,
        color_nameType: typeof finalData.color_name,
        color_nameInFinal: 'color_name' in finalData,
        image_url: finalData.image_url,
        image_urlType: typeof finalData.image_url,
        allKeys: Object.keys(finalData),
        allValues: Object.entries(finalData).slice(0, 10).map(([key, value]) => ({
          key,
          value: typeof value === 'string' ? value.substring(0, 50) : value,
          type: typeof value,
        })),
      })
      
      onSave(finalData)
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
              <ImageUploadZone
                productId={productId} // Usar productId del producto para el upload
                currentImageUrl={imagePreview || formData.image_url || null}
                onUploadSuccess={(imageUrl) => {
                  // ✅ DEBUG: Log para verificar que la imagen se subió correctamente
                  console.log('📸 [VariantModal] Imagen subida exitosamente:', {
                    imageUrl,
                    previousImageUrl: formData.image_url,
                  })
                  const updatedFormData = { ...formData, image_url: imageUrl || '' }
                  setFormData(updatedFormData)
                  setImagePreview(imageUrl || null)
                  // ✅ DEBUG: Verificar que se actualizó correctamente
                  console.log('📸 [VariantModal] formData actualizado:', {
                    hasImageUrl: !!updatedFormData.image_url,
                    imageUrl: updatedFormData.image_url,
                  })
                }}
                onError={(error) => {
                  console.error('Error al subir imagen:', error)
                }}
              />
              <div className='space-y-3'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    O URL de Imagen
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
                  💡 Tip: Puedes subir una imagen arrastrándola o usar una URL externa
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
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData({ 
                        ...formData, 
                        price_sale: value && value.trim() !== '' 
                          ? parseFloat(value) 
                          : undefined // ✅ Usar undefined en lugar de 0 para que sea opcional
                      })
                    }}
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

