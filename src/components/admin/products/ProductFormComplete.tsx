'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AdminCard } from '../ui/AdminCard'
import { ProductImageManager } from './ProductImageManager'
import { ProductVariantManager } from './ProductVariantManager'
import { ProductPricing } from './ProductPricing'
import { ProductInventory } from './ProductInventory'
import { ProductSeo } from './ProductSeo'
import { CategorySelector } from './CategorySelector'
import { ProductBadgePreview } from './ProductBadgePreview'
import { TechnicalSheetUpload } from './TechnicalSheetUpload'
import { useProductNotifications } from '@/hooks/admin/useProductNotifications'
import { useProductFormReducer } from '@/hooks/optimization/useProductFormReducer'
import { cn } from '@/lib/core/utils'
import { Save, X, Eye, Loader2 } from '@/lib/optimized-imports'

// Validation schema
const ProductFormSchema = z
  .object({
    // Basic Information
    name: z
      .string()
      .min(1, 'El nombre es requerido')
      .max(255, 'Máximo 255 caracteres')
      .regex(/^[a-zA-Z0-9\s\-_.,()]+$/, 'El nombre contiene caracteres no válidos'),

    description: z.string().max(5000, 'Máximo 5000 caracteres').optional(),

    short_description: z.string().max(500, 'Máximo 500 caracteres').optional(),

    category_id: z.number().int().positive('Selecciona una categoría válida'),

    status: z.enum(['active', 'inactive', 'draft']),

    // Product Details
    brand: z.string().max(100, 'Máximo 100 caracteres').optional(),
    model: z.string().max(100, 'Máximo 100 caracteres').optional(),
    sku: z
      .string()
      .max(50, 'Máximo 50 caracteres')
      .regex(
        /^[A-Z0-9\-_]+$/,
        'SKU debe contener solo letras mayúsculas, números, guiones y guiones bajos'
      )
      .optional(),
    barcode: z.string().max(50, 'Máximo 50 caracteres').optional(),

    // Pricing with validation
    price: z
      .number()
      .min(0.01, 'El precio debe ser mayor a 0')
      .max(999999.99, 'Precio máximo excedido'),

    compare_price: z
      .number()
      .min(0)
      .max(999999.99, 'Precio máximo excedido')
      .optional()
      .refine((val, ctx) => {
        const price = ctx.parent.price
        return !val || val >= price
      }, 'El precio de comparación debe ser mayor o igual al precio base'),

    cost_price: z
      .number()
      .min(0)
      .max(999999.99, 'Precio máximo excedido')
      .optional()
      .refine((val, ctx) => {
        const price = ctx.parent.price
        return !val || val <= price
      }, 'El precio de costo debe ser menor o igual al precio de venta'),

    // Tax and shipping
    tax_rate: z.number().min(0).max(100, 'Tasa de impuesto máxima 100%').optional(),
    requires_shipping: z.boolean().default(true),
    weight: z.number().min(0, 'El peso debe ser mayor o igual a 0').optional(),
    dimensions: z
      .object({
        length: z.number().min(0).optional(),
        width: z.number().min(0).optional(),
        height: z.number().min(0).optional(),
      })
      .optional(),

    // Inventory with enhanced validation
    track_inventory: z.boolean().default(true),
    stock: z
      .number()
      .min(0, 'El stock debe ser mayor o igual a 0')
      .max(999999, 'Stock máximo excedido'),

    low_stock_threshold: z
      .number()
      .min(0)
      .max(1000, 'Umbral máximo excedido')
      .optional()
      .refine((val, ctx) => {
        const stock = ctx.parent.stock
        return !val || val <= stock
      }, 'El umbral debe ser menor o igual al stock actual'),

    allow_backorder: z.boolean().default(false),

    // SEO with enhanced validation
    seo_title: z.string().max(60, 'Máximo 60 caracteres para mejor SEO').optional(),

    seo_description: z.string().max(160, 'Máximo 160 caracteres para mejor SEO').optional(),

    slug: z
      .string()
      .max(255, 'Máximo 255 caracteres')
      .regex(/^[a-z0-9\-]+$/, 'El slug debe contener solo letras minúsculas, números y guiones')
      .optional(),

    meta_keywords: z.array(z.string().max(50)).max(10, 'Máximo 10 palabras clave').optional(),

    // Images with enhanced validation
    images: z
      .array(
        z.object({
          id: z.string().optional(),
          url: z.string().url('URL de imagen inválida'),
          alt: z.string().max(255, 'Máximo 255 caracteres').optional(),
          is_primary: z.boolean().default(false),
          sort_order: z.number().min(0).optional(),
          size: z.number().max(10485760, 'Imagen muy grande (máximo 10MB)').optional(), // 10MB
        })
      )
      .max(10, 'Máximo 10 imágenes por producto')
      .optional(),

    // Variants with enhanced validation
    variants: z
      .array(
        z.object({
          id: z.string().optional(),
          name: z.string().min(1, 'Nombre de variante requerido').max(100, 'Máximo 100 caracteres'),
          options: z
            .array(z.string().min(1, 'Opción no puede estar vacía').max(50, 'Máximo 50 caracteres'))
            .min(1, 'Al menos una opción requerida')
            .max(20, 'Máximo 20 opciones por variante'),
          required: z.boolean().default(false),
        })
      )
      .max(5, 'Máximo 5 variantes por producto')
      .optional(),

    // Additional fields
    tags: z.array(z.string().max(30)).max(20, 'Máximo 20 etiquetas').optional(),
    featured: z.boolean().default(false),
    digital: z.boolean().default(false),
    downloadable_files: z
      .array(
        z.object({
          name: z.string(),
          url: z.string().url(),
          size: z.number().optional(),
        })
      )
      .optional(),

    // Technical Sheet (PDF)
    technical_sheet: z
      .object({
        id: z.string().optional(),
        url: z.string().url('URL de ficha técnica inválida'),
        title: z.string().optional(),
        original_filename: z.string().optional(),
        file_size: z.number().optional(),
      })
      .optional()
      .nullable(),
  })
  .refine(
    data => {
      // Ensure at least one image is primary if images exist
      if (data.images && data.images.length > 0) {
        const primaryImages = data.images.filter(img => img.is_primary)
        return primaryImages.length <= 1
      }
      return true
    },
    {
      message: 'Solo puede haber una imagen principal',
      path: ['images'],
    }
  )

type ProductFormData = z.infer<typeof ProductFormSchema>

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  mode?: 'create' | 'edit'
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  className?: string
}

export function ProductForm({
  initialData,
  mode = 'create',
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: ProductFormProps) {
  const { state, actions } = useProductFormReducer({
    activeTab: 'general',
    previewMode: false,
    isDirty: false,
    validationErrors: {},
    uploadProgress: 0,
    isUploading: false,
  })
  const notifications = useProductNotifications()

  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      status: 'draft',
      track_inventory: true,
      allow_backorder: false,
      requires_shipping: true,
      stock: 0,
      price: 0,
      featured: false,
      digital: false,
      tax_rate: 0,
      weight: 0,
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
      },
      images: [],
      variants: [],
      tags: [],
      meta_keywords: [],
      downloadable_files: [],
      technical_sheet: null,
      ...initialData,
    },
  })

  const {
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = form

  const watchedData = watch()

  const tabs = [
    { id: 'general', label: 'General', icon: '📝' },
    { id: 'details', label: 'Detalles', icon: '📋' },
    { id: 'pricing', label: 'Precios', icon: '💰' },
    { id: 'inventory', label: 'Inventario', icon: '📦' },
    { id: 'shipping', label: 'Envío', icon: '🚚' },
    { id: 'images', label: 'Imágenes', icon: '🖼️' },
    { id: 'variants', label: 'Variantes', icon: '🎨' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
    { id: 'advanced', label: 'Avanzado', icon: '⚙️' },
  ]

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      notifications.showInfo(mode === 'create' ? 'Creando producto...' : 'Actualizando producto...')

      await onSubmit(data)

      notifications.showSuccess(
        mode === 'create'
          ? `Producto "${data.name}" creado exitosamente`
          : `Producto "${data.name}" actualizado exitosamente`
      )
    } catch (error) {
      console.error('Error submitting form:', error)
      notifications.showError(
        mode === 'create'
          ? 'Error al crear el producto. Por favor, intenta nuevamente.'
          : 'Error al actualizar el producto. Por favor, intenta nuevamente.'
      )
    }
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD') // Normalize unicode characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .substring(0, 100) // Limit length
  }

  const handleNameChange = (name: string) => {
    setValue('name', name)
    if (!watchedData.slug || mode === 'create') {
      setValue('slug', generateSlug(name))
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>
            {mode === 'create' ? 'Crear Producto' : 'Editar Producto'}
          </h1>
          <p className='text-gray-600 mt-1'>
            {mode === 'create'
              ? 'Completa la información para crear un nuevo producto'
              : 'Modifica la información del producto'}
          </p>
        </div>

        <div className='flex items-center space-x-3'>
          <button
            type='button'
            onClick={() => actions.setPreviewMode(!state.previewMode)}
            className='flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
          >
            <Eye className='w-4 h-4' />
            <span>{state.previewMode ? 'Editar' : 'Vista Previa'}</span>
          </button>

          {onCancel && (
            <button
              type='button'
              onClick={onCancel}
              className='flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            >
              <X className='w-4 h-4' />
              <span>Cancelar</span>
            </button>
          )}

          <button
            type='submit'
            form='product-form'
            disabled={isLoading || !isDirty}
            className='flex items-center space-x-2 px-4 py-2 bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? (
              <Loader2 className='w-4 h-4 animate-spin' />
            ) : (
              <Save className='w-4 h-4' />
            )}
            <span>{mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* Badge Preview */}
      <ProductBadgePreview
        product={{
          created_at: (initialData as any)?.created_at || new Date().toISOString(),
          featured: watchedData.featured || false,
          price: watchedData.price || 0,
          compare_price: watchedData.compare_price || undefined,
          stock: watchedData.stock || 0,
        }}
      />

      {/* Tabs */}
      <div className='border-b border-gray-200'>
        <nav className='flex space-x-8'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => actions.setActiveTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors',
                state.activeTab === tab.id
                  ? 'border-blaze-orange-500 text-blaze-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {errors &&
                Object.keys(errors).some(key => {
                  // Check if this tab has errors
                  const tabFields = {
                    general: ['name', 'description', 'short_description', 'category_id', 'status'],
                    details: ['brand', 'model', 'sku', 'barcode', 'tags', 'featured', 'digital'],
                    pricing: ['price', 'compare_price', 'cost_price', 'tax_rate'],
                    inventory: [
                      'track_inventory',
                      'stock',
                      'low_stock_threshold',
                      'allow_backorder',
                    ],
                    shipping: ['requires_shipping', 'weight', 'dimensions'],
                    images: ['images'],
                    variants: ['variants'],
                    seo: ['seo_title', 'seo_description', 'slug', 'meta_keywords'],
                    advanced: ['downloadable_files'],
                  }
                  return tabFields[tab.id as keyof typeof tabFields]?.includes(key)
                }) && <span className='w-2 h-2 bg-red-500 rounded-full'></span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Form */}
      <form id='product-form' onSubmit={handleSubmit(handleFormSubmit)} className='space-y-6'>
        {/* General Tab */}
        {state.activeTab === 'general' && (
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <div className='lg:col-span-2 space-y-6'>
              <AdminCard title='Información General'>
                <div className='space-y-4'>
                  {/* Product Name */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Nombre del Producto *
                    </label>
                    <input
                      type='text'
                      {...form.register('name')}
                      onChange={e => handleNameChange(e.target.value)}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                      placeholder='Ej: Pintura Látex Interior Blanco 4L'
                    />
                    {errors.name && (
                      <p className='text-red-600 text-sm mt-1'>{errors.name.message}</p>
                    )}
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Descripción Corta
                    </label>
                    <textarea
                      {...form.register('short_description')}
                      rows={2}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                      placeholder='Descripción breve para listados de productos'
                    />
                    {errors.short_description && (
                      <p className='text-red-600 text-sm mt-1'>
                        {errors.short_description.message}
                      </p>
                    )}
                  </div>

                  {/* Full Description */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      Descripción Completa
                    </label>
                    <textarea
                      {...form.register('description')}
                      rows={6}
                      className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                      placeholder='Descripción detallada del producto, características, usos, etc.'
                    />
                    {errors.description && (
                      <p className='text-red-600 text-sm mt-1'>{errors.description.message}</p>
                    )}
                  </div>
                </div>
              </AdminCard>
            </div>

            <div className='space-y-6'>
              {/* Category */}
              <AdminCard title='Categoría'>
                <CategorySelector
                  value={watchedData.category_id}
                  onChange={categoryId => setValue('category_id', categoryId)}
                  error={errors.category_id?.message}
                  allowCreate={true}
                />
              </AdminCard>

              {/* Status */}
              <AdminCard title='Estado'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Estado del Producto
                  </label>
                  <select
                    {...form.register('status')}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                  >
                    <option value='draft'>Borrador</option>
                    <option value='active'>Activo</option>
                    <option value='inactive'>Inactivo</option>
                  </select>
                  {errors.status && (
                    <p className='text-red-600 text-sm mt-1'>{errors.status.message}</p>
                  )}
                </div>
              </AdminCard>
            </div>
          </div>
        )}

        {/* Details Tab */}
        {state.activeTab === 'details' && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <AdminCard title='Información del Producto'>
              <div className='space-y-4'>
                {/* Brand */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Marca</label>
                  <input
                    type='text'
                    {...form.register('brand')}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='Ej: Sherwin Williams'
                  />
                  {errors.brand && (
                    <p className='text-red-600 text-sm mt-1'>{errors.brand.message}</p>
                  )}
                </div>

                {/* Model */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Modelo</label>
                  <input
                    type='text'
                    {...form.register('model')}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='Ej: ProClassic Interior'
                  />
                  {errors.model && (
                    <p className='text-red-600 text-sm mt-1'>{errors.model.message}</p>
                  )}
                </div>

                {/* SKU */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    SKU (Código de Producto)
                  </label>
                  <input
                    type='text'
                    {...form.register('sku')}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='Ej: SW-PC-INT-4L-WHT'
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errors.sku && <p className='text-red-600 text-sm mt-1'>{errors.sku.message}</p>}
                </div>

                {/* Barcode */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Código de Barras
                  </label>
                  <input
                    type='text'
                    {...form.register('barcode')}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='Ej: 1234567890123'
                  />
                  {errors.barcode && (
                    <p className='text-red-600 text-sm mt-1'>{errors.barcode.message}</p>
                  )}
                </div>
              </div>
            </AdminCard>

            <AdminCard title='Configuración'>
              <div className='space-y-4'>
                {/* Featured Product */}
                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    {...form.register('featured')}
                    className='w-4 h-4 text-blaze-orange-600 border-gray-300 rounded focus:ring-blaze-orange-500'
                  />
                  <div>
                    <label className='text-sm font-medium text-gray-700'>Producto Destacado</label>
                    <p className='text-xs text-gray-500'>
                      Mostrar en secciones destacadas del sitio
                    </p>
                  </div>
                </div>

                {/* Digital Product */}
                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    {...form.register('digital')}
                    className='w-4 h-4 text-blaze-orange-600 border-gray-300 rounded focus:ring-blaze-orange-500'
                  />
                  <div>
                    <label className='text-sm font-medium text-gray-700'>Producto Digital</label>
                    <p className='text-xs text-gray-500'>No requiere envío físico</p>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Etiquetas</label>
                  <input
                    type='text'
                    placeholder='Separar con comas: pintura, interior, blanco'
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    onChange={e => {
                      const tags = e.target.value
                        .split(',')
                        .map(tag => tag.trim())
                        .filter(tag => tag.length > 0)
                      setValue('tags', tags)
                    }}
                    defaultValue={watchedData.tags?.join(', ') || ''}
                  />
                  {errors.tags && (
                    <p className='text-red-600 text-sm mt-1'>{errors.tags.message}</p>
                  )}
                  <p className='text-xs text-gray-500 mt-1'>
                    Máximo 20 etiquetas, 30 caracteres cada una
                  </p>
                </div>
              </div>
            </AdminCard>
          </div>
        )}

        {/* Pricing Tab */}
        {state.activeTab === 'pricing' && <ProductPricing form={form} errors={errors} />}

        {/* Inventory Tab */}
        {state.activeTab === 'inventory' && <ProductInventory form={form} errors={errors} />}

        {/* Shipping Tab */}
        {state.activeTab === 'shipping' && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <AdminCard title='Configuración de Envío'>
              <div className='space-y-4'>
                {/* Requires Shipping */}
                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    {...form.register('requires_shipping')}
                    className='w-4 h-4 text-blaze-orange-600 border-gray-300 rounded focus:ring-blaze-orange-500'
                  />
                  <div>
                    <label className='text-sm font-medium text-gray-700'>Requiere Envío</label>
                    <p className='text-xs text-gray-500'>
                      Desmarcar para productos digitales o servicios
                    </p>
                  </div>
                </div>

                {/* Weight */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Peso (kg)</label>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    {...form.register('weight', { valueAsNumber: true })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='0.00'
                  />
                  {errors.weight && (
                    <p className='text-red-600 text-sm mt-1'>{errors.weight.message}</p>
                  )}
                </div>

                {/* Tax Rate */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Tasa de Impuesto (%)
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    max='100'
                    {...form.register('tax_rate', { valueAsNumber: true })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='0.00'
                  />
                  {errors.tax_rate && (
                    <p className='text-red-600 text-sm mt-1'>{errors.tax_rate.message}</p>
                  )}
                </div>
              </div>
            </AdminCard>

            <AdminCard title='Dimensiones'>
              <div className='space-y-4'>
                <p className='text-sm text-gray-600 mb-4'>
                  Las dimensiones ayudan a calcular costos de envío más precisos
                </p>

                {/* Length */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Largo (cm)</label>
                  <input
                    type='number'
                    step='0.1'
                    min='0'
                    {...form.register('dimensions.length', { valueAsNumber: true })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='0.0'
                  />
                  {errors.dimensions?.length && (
                    <p className='text-red-600 text-sm mt-1'>{errors.dimensions.length.message}</p>
                  )}
                </div>

                {/* Width */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Ancho (cm)</label>
                  <input
                    type='number'
                    step='0.1'
                    min='0'
                    {...form.register('dimensions.width', { valueAsNumber: true })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='0.0'
                  />
                  {errors.dimensions?.width && (
                    <p className='text-red-600 text-sm mt-1'>{errors.dimensions.width.message}</p>
                  )}
                </div>

                {/* Height */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>Alto (cm)</label>
                  <input
                    type='number'
                    step='0.1'
                    min='0'
                    {...form.register('dimensions.height', { valueAsNumber: true })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='0.0'
                  />
                  {errors.dimensions?.height && (
                    <p className='text-red-600 text-sm mt-1'>{errors.dimensions.height.message}</p>
                  )}
                </div>

                {/* Volume calculation */}
                {watchedData.dimensions?.length &&
                  watchedData.dimensions?.width &&
                  watchedData.dimensions?.height && (
                    <div className='mt-4 p-3 bg-gray-50 rounded-lg'>
                      <p className='text-sm text-gray-600'>
                        <strong>Volumen:</strong>{' '}
                        {(
                          ((watchedData.dimensions.length || 0) *
                            (watchedData.dimensions.width || 0) *
                            (watchedData.dimensions.height || 0)) /
                          1000
                        ).toFixed(2)}{' '}
                        litros
                      </p>
                    </div>
                  )}
              </div>
            </AdminCard>
          </div>
        )}

        {/* Images Tab */}
        {state.activeTab === 'images' && (
          <div className='space-y-6'>
            <ProductImageManager
              images={watchedData.images || []}
              onChange={images => setValue('images', images)}
              error={errors.images?.message}
            />

            {/* Technical Sheet Upload */}
            <AdminCard title='Ficha Técnica'>
              <div className='space-y-4'>
                <p className='text-sm text-gray-600'>
                  Sube la ficha técnica del producto en formato PDF. Esta información estará disponible para los clientes.
                </p>
                <TechnicalSheetUpload
                  productId={(initialData as any)?.id?.toString()}
                  existingSheet={watchedData.technical_sheet || undefined}
                  onUploadSuccess={data => {
                    setValue('technical_sheet', {
                      id: data.id,
                      url: data.url,
                      title: data.title,
                      original_filename: data.original_filename,
                      file_size: data.file_size,
                    })
                  }}
                  onDelete={() => {
                    setValue('technical_sheet', null)
                  }}
                  onError={error => {
                    console.error('Error uploading technical sheet:', error)
                  }}
                />
              </div>
            </AdminCard>
          </div>
        )}

        {/* Variants Tab */}
        {state.activeTab === 'variants' && (
          <ProductVariantManager
            variants={watchedData.variants || []}
            onChange={variants => setValue('variants', variants)}
            error={errors.variants?.message}
          />
        )}

        {/* SEO Tab */}
        {state.activeTab === 'seo' && (
          <ProductSeo form={form} errors={errors} productName={watchedData.name} />
        )}

        {/* Advanced Tab */}
        {state.activeTab === 'advanced' && (
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <AdminCard title='Configuración Avanzada'>
              <div className='space-y-4'>
                {/* Digital Product */}
                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    {...form.register('digital')}
                    className='w-4 h-4 text-blaze-orange-600 border-gray-300 rounded focus:ring-blaze-orange-500'
                  />
                  <div>
                    <label className='text-sm font-medium text-gray-700'>Producto Digital</label>
                    <p className='text-xs text-gray-500'>No requiere envío físico</p>
                  </div>
                </div>

                {/* Featured Product */}
                <div className='flex items-center space-x-3'>
                  <input
                    type='checkbox'
                    {...form.register('featured')}
                    className='w-4 h-4 text-blaze-orange-600 border-gray-300 rounded focus:ring-blaze-orange-500'
                  />
                  <div>
                    <label className='text-sm font-medium text-gray-700'>Producto Destacado</label>
                    <p className='text-xs text-gray-500'>Aparecerá en secciones destacadas</p>
                  </div>
                </div>

                {/* Meta Keywords */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    Palabras Clave Meta
                  </label>
                  <input
                    type='text'
                    {...form.register('meta_keywords')}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='palabra1, palabra2, palabra3'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Separar con comas. Máximo 10 palabras clave.
                  </p>
                  {errors.meta_keywords && (
                    <p className='text-red-600 text-sm mt-1'>{errors.meta_keywords.message}</p>
                  )}
                </div>
              </div>
            </AdminCard>

            <AdminCard title='Archivos Descargables'>
              <div className='space-y-4'>
                <p className='text-sm text-gray-600 mb-4'>
                  Para productos digitales que requieren descarga
                </p>

                {/* Downloadable Files */}
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-2'>
                    URLs de Descarga
                  </label>
                  <textarea
                    {...form.register('downloadable_files')}
                    rows={4}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent'
                    placeholder='https://ejemplo.com/archivo1.pdf&#10;https://ejemplo.com/archivo2.zip&#10;Una URL por línea'
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Una URL por línea. Solo para productos digitales.
                  </p>
                  {errors.downloadable_files && (
                    <p className='text-red-600 text-sm mt-1'>{errors.downloadable_files.message}</p>
                  )}
                </div>

                {/* File Upload Area */}
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
                  <div className='space-y-2'>
                    <svg
                      className='mx-auto h-12 w-12 text-gray-400'
                      stroke='currentColor'
                      fill='none'
                      viewBox='0 0 48 48'
                    >
                      <path
                        d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
                        strokeWidth={2}
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                    <div className='text-sm text-gray-600'>
                      <p className='font-medium'>Subir archivos digitales</p>
                      <p>Arrastra archivos aquí o haz clic para seleccionar</p>
                    </div>
                    <p className='text-xs text-gray-500'>
                      PDF, ZIP, DOC, etc. Máximo 50MB por archivo
                    </p>
                  </div>
                </div>

                {/* File List Placeholder */}
                <div className='space-y-2'>
                  <p className='text-sm font-medium text-gray-700'>Archivos subidos:</p>
                  <div className='text-sm text-gray-500 italic'>No hay archivos subidos</div>
                </div>
              </div>
            </AdminCard>
          </div>
        )}
      </form>
    </div>
  )
}

// Export alias para compatibilidad
export { ProductForm as ProductFormComplete }
