'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AdminCard } from '../ui/AdminCard';
import { ProductImageManager } from './ProductImageManager';
import { ProductVariantManager } from './ProductVariantManager';
import { ProductPricing } from './ProductPricing';
import { ProductInventory } from './ProductInventory';
import { ProductSeo } from './ProductSeo';
import { CategorySelector } from './CategorySelector';
import { cn } from '@/lib/utils';
import { Save, X, Eye, Loader2 } from 'lucide-react';

// Validation schema
const ProductFormSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres'),
  description: z.string().optional(),
  short_description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  category_id: z.string().uuid('Selecciona una categoría válida'),
  status: z.enum(['active', 'inactive', 'draft']),
  
  // Pricing
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  compare_price: z.number().min(0).optional(),
  cost_price: z.number().min(0).optional(),
  
  // Inventory
  track_inventory: z.boolean().default(true),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0'),
  low_stock_threshold: z.number().min(0).optional(),
  allow_backorder: z.boolean().default(false),
  
  // SEO
  seo_title: z.string().max(60, 'Máximo 60 caracteres').optional(),
  seo_description: z.string().max(160, 'Máximo 160 caracteres').optional(),
  slug: z.string().optional(),
  
  // Images
  images: z.array(z.object({
    url: z.string().url(),
    alt: z.string().optional(),
    is_primary: z.boolean().default(false),
  })).optional(),
  
  // Variants
  variants: z.array(z.object({
    name: z.string(),
    options: z.array(z.string()),
  })).optional(),
});

type ProductFormData = z.infer<typeof ProductFormSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  mode?: 'create' | 'edit';
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ProductForm({
  initialData,
  mode = 'create',
  onSubmit,
  onCancel,
  isLoading = false,
  className
}: ProductFormProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [previewMode, setPreviewMode] = useState(false);

  const form = useForm<ProductFormData>({
    resolver: zodResolver(ProductFormSchema),
    defaultValues: {
      status: 'draft',
      track_inventory: true,
      allow_backorder: false,
      stock: 0,
      price: 0,
      ...initialData,
    },
  });

  const { handleSubmit, formState: { errors, isDirty }, watch, setValue } = form;

  const watchedData = watch();

  const tabs = [
    { id: 'general', label: 'General', icon: '📝' },
    { id: 'pricing', label: 'Precios', icon: '💰' },
    { id: 'inventory', label: 'Inventario', icon: '📦' },
    { id: 'images', label: 'Imágenes', icon: '🖼️' },
    { id: 'variants', label: 'Variantes', icon: '🎨' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
  ];

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setValue('name', name);
    if (!watchedData.slug || mode === 'create') {
      setValue('slug', generateSlug(name));
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Crear Producto' : 'Editar Producto'}
          </h1>
          <p className="text-gray-600 mt-1">
            {mode === 'create' 
              ? 'Completa la información para crear un nuevo producto'
              : 'Modifica la información del producto'
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>{previewMode ? 'Editar' : 'Vista Previa'}</span>
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
          )}
          
          <button
            type="submit"
            form="product-form"
            disabled={isLoading || !isDirty}
            className="flex items-center space-x-2 px-4 py-2 bg-blaze-orange-600 hover:bg-blaze-orange-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-blaze-orange-500 text-blaze-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {errors && Object.keys(errors).some(key => {
                // Check if this tab has errors
                const tabFields = {
                  general: ['name', 'description', 'short_description', 'category_id', 'status'],
                  pricing: ['price', 'compare_price', 'cost_price'],
                  inventory: ['track_inventory', 'stock', 'low_stock_threshold', 'allow_backorder'],
                  images: ['images'],
                  variants: ['variants'],
                  seo: ['seo_title', 'seo_description', 'slug'],
                };
                return tabFields[tab.id as keyof typeof tabFields]?.includes(key);
              }) && (
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Form */}
      <form id="product-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <AdminCard title="Información General">
                <div className="space-y-4">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      {...form.register('name')}
                      onChange={(e) => handleNameChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                      placeholder="Ej: Pintura Látex Interior Blanco 4L"
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Short Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción Corta
                    </label>
                    <textarea
                      {...form.register('short_description')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                      placeholder="Descripción breve para listados de productos"
                    />
                    {errors.short_description && (
                      <p className="text-red-600 text-sm mt-1">{errors.short_description.message}</p>
                    )}
                  </div>

                  {/* Full Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción Completa
                    </label>
                    <textarea
                      {...form.register('description')}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                      placeholder="Descripción detallada del producto, características, usos, etc."
                    />
                    {errors.description && (
                      <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              </AdminCard>
            </div>

            <div className="space-y-6">
              {/* Category */}
              <AdminCard title="Categoría">
                <CategorySelector
                  value={watchedData.category_id}
                  onChange={(categoryId) => setValue('category_id', categoryId)}
                  error={errors.category_id?.message}
                />
              </AdminCard>

              {/* Status */}
              <AdminCard title="Estado">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado del Producto
                  </label>
                  <select
                    {...form.register('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                  >
                    <option value="draft">Borrador</option>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                  {errors.status && (
                    <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>
                  )}
                </div>
              </AdminCard>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <ProductPricing
            form={form}
            errors={errors}
          />
        )}

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <ProductInventory
            form={form}
            errors={errors}
          />
        )}

        {/* Images Tab */}
        {activeTab === 'images' && (
          <ProductImageManager
            images={watchedData.images || []}
            onChange={(images) => setValue('images', images)}
            error={errors.images?.message}
          />
        )}

        {/* Variants Tab */}
        {activeTab === 'variants' && (
          <ProductVariantManager
            variants={watchedData.variants || []}
            onChange={(variants) => setValue('variants', variants)}
            error={errors.variants?.message}
          />
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <ProductSeo
            form={form}
            errors={errors}
            productName={watchedData.name}
          />
        )}
      </form>
    </div>
  );
}
