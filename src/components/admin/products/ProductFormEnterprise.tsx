'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AdminCard } from '../ui/AdminCard';
import { ProductImageManagerEnterprise } from './ProductImageManagerEnterprise';
import { ProductVariantManager } from './ProductVariantManager';
import { ProductPricing } from './ProductPricing';
import { ProductInventory } from './ProductInventory';
import { ProductSeo } from './ProductSeo';
import { CategorySelector } from './CategorySelector';
import { cn } from '@/lib/core/utils';
import { Save, X, Eye, Loader2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Enhanced validation schema
const ProductFormEnterpriseSchema = z.object({
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
    id: z.string().optional(),
    url: z.string().url(),
    alt_text: z.string().optional(),
    is_primary: z.boolean().default(false),
  })).optional(),
  
  // Variants
  variants: z.array(z.object({
    name: z.string(),
    options: z.array(z.string()),
  })).optional(),
});

type ProductFormEnterpriseData = z.infer<typeof ProductFormEnterpriseSchema>;

interface ProductFormEnterpriseProps {
  productId?: string;
  initialData?: Partial<ProductFormEnterpriseData>;
  mode?: 'create' | 'edit';
  onSubmit: (data: ProductFormEnterpriseData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}

// Auto-save hook
function useAutoSave(data: any, onSave: (data: any) => void, delay: number = 30000) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!data || !onSave) {return;}

    const timer = setTimeout(async () => {
      try {
        setIsSaving(true);
        await onSave(data);
        setLastSaved(new Date());
        toast.success('Guardado automático completado', { duration: 2000 });
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.error('Error en guardado automático');
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [data, onSave, delay]);

  return { lastSaved, isSaving };
}

// Slug validation API
async function validateSlug(slug: string, productId?: string): Promise<boolean> {
  if (!slug) {return true;}
  
  const response = await fetch(`/api/admin/products/validate-slug`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, productId }),
  });
  
  const result = await response.json();
  return result.available;
}

export function ProductFormEnterprise({
  productId,
  initialData,
  mode = 'create',
  onSubmit,
  onCancel,
  isLoading = false,
  className
}: ProductFormEnterpriseProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [previewMode, setPreviewMode] = useState(false);
  const [slugValidation, setSlugValidation] = useState<{ isValid: boolean; isChecking: boolean }>({
    isValid: true,
    isChecking: false
  });

  const form = useForm<ProductFormEnterpriseData>({
    resolver: zodResolver(ProductFormEnterpriseSchema),
    defaultValues: {
      status: 'draft',
      track_inventory: true,
      allow_backorder: false,
      stock: 0,
      price: 0,
      images: [],
      variants: [],
      ...initialData,
    },
  });

  const { handleSubmit, formState: { errors, isDirty }, watch, setValue, getValues } = form;

  const watchedData = watch();
  const watchedName = watch('name');
  const watchedSlug = watch('slug');

  // Auto-save functionality
  const handleAutoSave = useCallback(async (data: ProductFormEnterpriseData) => {
    if (mode === 'edit' && productId && isDirty) {
      await onSubmit(data);
    }
  }, [mode, productId, isDirty, onSubmit]);

  const { lastSaved, isSaving } = useAutoSave(watchedData, handleAutoSave);

  // Generate slug from name
  useEffect(() => {
    if (watchedName && (!watchedSlug || mode === 'create')) {
      const generatedSlug = watchedName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', generatedSlug);
    }
  }, [watchedName, watchedSlug, mode, setValue]);

  // Validate slug uniqueness
  useEffect(() => {
    if (!watchedSlug) {return;}

    const validateSlugUnique = async () => {
      setSlugValidation({ isValid: true, isChecking: true });
      
      try {
        const isValid = await validateSlug(watchedSlug, productId);
        setSlugValidation({ isValid, isChecking: false });
      } catch (error) {
        console.error('Slug validation error:', error);
        setSlugValidation({ isValid: true, isChecking: false });
      }
    };

    const timer = setTimeout(validateSlugUnique, 500);
    return () => clearTimeout(timer);
  }, [watchedSlug, productId]);

  const tabs = [
    { id: 'general', label: 'General', icon: '📝' },
    { id: 'pricing', label: 'Precios', icon: '💰' },
    { id: 'inventory', label: 'Inventario', icon: '📦' },
    { id: 'images', label: 'Imágenes', icon: '🖼️' },
    { id: 'variants', label: 'Variantes', icon: '🎨' },
    { id: 'seo', label: 'SEO', icon: '🔍' },
  ];

  const handleFormSubmit = async (data: ProductFormEnterpriseData) => {
    if (!slugValidation.isValid) {
      toast.error('El slug debe ser único');
      return;
    }
    
    await onSubmit(data);
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with auto-save status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Crear Producto' : 'Editar Producto'}
          </h2>
          {mode === 'edit' && (
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando automáticamente...</span>
                </>
              ) : lastSaved ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Guardado automático: {lastSaved.toLocaleTimeString()}</span>
                </>
              ) : (
                <>
                  <Clock className="w-4 h-4" />
                  <span>Auto-guardado cada 30 segundos</span>
                </>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Editar' : 'Vista Previa'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                activeTab === tab.id
                  ? "border-blaze-orange-500 text-blaze-orange-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* General Tab */}
        {activeTab === 'general' && (
          <AdminCard className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Información General</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Producto *
                  </label>
                  <input
                    {...form.register('name')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                    placeholder="Ingrese el nombre del producto"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoría *
                  </label>
                  <CategorySelector
                    value={watchedData.category_id}
                    onChange={(value) => setValue('category_id', value)}
                    error={errors.category_id?.message}
                  />
                </div>

                {/* Slug */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL Slug
                  </label>
                  <div className="relative">
                    <input
                      {...form.register('slug')}
                      type="text"
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent",
                        !slugValidation.isValid ? "border-red-300" : "border-gray-300"
                      )}
                      placeholder="url-del-producto"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {slugValidation.isChecking ? (
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                      ) : !slugValidation.isValid ? (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  </div>
                  {!slugValidation.isValid && (
                    <p className="mt-1 text-sm text-red-600">Este slug ya está en uso</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    URL: /productos/{watchedData.slug || 'url-del-producto'}
                  </p>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    {...form.register('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                  >
                    <option value="draft">Borrador</option>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  {...form.register('description')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                  placeholder="Descripción detallada del producto"
                />
              </div>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción Corta
                </label>
                <textarea
                  {...form.register('short_description')}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent"
                  placeholder="Descripción breve para listados"
                />
                {errors.short_description && (
                  <p className="mt-1 text-sm text-red-600">{errors.short_description.message}</p>
                )}
              </div>
            </div>
          </AdminCard>
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
        {activeTab === 'images' && productId && (
          <ProductImageManagerEnterprise
            productId={productId}
            images={watchedData.images || []}
            onChange={(images) => setValue('images', images)}
          />
        )}

        {/* Variants Tab */}
        {activeTab === 'variants' && (
          <ProductVariantManager
            variants={watchedData.variants || []}
            onChange={(variants) => setValue('variants', variants)}
          />
        )}

        {/* SEO Tab */}
        {activeTab === 'seo' && (
          <ProductSeo
            form={form}
            errors={errors}
            productName={watchedData.name}
            productSlug={watchedData.slug}
          />
        )}

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2 inline" />
              Cancelar
            </button>
          )}
          
          <button
            type="submit"
            disabled={isLoading || !slugValidation.isValid || slugValidation.isChecking}
            className="flex items-center gap-2 px-6 py-2 bg-blaze-orange-600 text-white rounded-lg hover:bg-blaze-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}









