/**
 * Create Category Modal
 * Pinteya E-commerce - Modal for creating new categories
 * 
 * This modal allows admins to create new categories with:
 * - Name (required)
 * - Slug (auto-generated from name)
 * - Image (required, optimized to WebP)
 */

'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CategoryImageUpload } from './CategoryImageUpload'
import { Loader2, X, Save } from '@/lib/optimized-imports'
import { generateCategorySlug } from '@/lib/categories/adapters'
import { createCategory } from '@/lib/categories/api/client'
import { useQueryClient } from '@tanstack/react-query'
import { categoryQueryKeys } from '@/lib/categories/hooks/useCategories'

// Validation schema
const createCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre es muy largo'),
  slug: z
    .string()
    .min(1, 'El slug es requerido')
    .max(100, 'El slug es muy largo')
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones')
    .optional(),
  description: z.string().max(500, 'La descripción es muy larga').optional(),
  image_url: z.string().url('URL de imagen inválida').min(1, 'La imagen es requerida'),
})

type CreateCategoryFormData = z.infer<typeof createCategorySchema>

interface CreateCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (category: any) => void
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCategoryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateCategoryFormData>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      image_url: '',
    },
  })

  const watchedName = watch('name')

  // Auto-generate slug from name
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const name = e.target.value
      setValue('name', name)
      
      // Auto-generate slug if name is provided and slug is empty
      if (name && !watch('slug')) {
        const generatedSlug = generateCategorySlug(name)
        setValue('slug', generatedSlug)
      }
    },
    [setValue, watch]
  )

  // Handle image upload
  const handleImageUpload = useCallback(
    (url: string) => {
      setImageUrl(url)
      setValue('image_url', url, { shouldValidate: true })
    },
    [setValue]
  )

  // Handle form submission
  const onSubmit = useCallback(
    async (data: CreateCategoryFormData) => {
      if (!imageUrl) {
        return
      }

      setIsSubmitting(true)

      try {
        // Generate slug if not provided
        const slug = data.slug || generateCategorySlug(data.name)

        // Create category via API
        const newCategory = await createCategory({
          name: data.name,
          slug,
          description: data.description,
          image_url: imageUrl,
          parent_id: null, // No crear categorías hijas
        })

        // Invalidate categories cache to refresh list
        queryClient.invalidateQueries({ queryKey: categoryQueryKeys.all })

        // Reset form
        reset()
        setImageUrl('')

        // Call success callback
        onSuccess?.(newCategory)

        // Close modal
        onClose()
      } catch (error) {
        console.error('Error creating category:', error)
        alert(error instanceof Error ? error.message : 'Error al crear categoría')
      } finally {
        setIsSubmitting(false)
      }
    },
    [imageUrl, queryClient, reset, onSuccess, onClose]
  )

  // Handle close
  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      reset()
      setImageUrl('')
      onClose()
    }
  }, [isSubmitting, reset, onClose])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent size="lg" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nueva Categoría</DialogTitle>
          <DialogDescription>
            Completa el formulario para crear una nueva categoría. La imagen será optimizada automáticamente a WebP.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Categoría *
            </label>
            <Input
              id="name"
              {...register('name')}
              onChange={handleNameChange}
              placeholder="Ej: Pinturas para Paredes"
              className={errors.name ? 'border-red-300' : ''}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL) *
            </label>
            <Input
              id="slug"
              {...register('slug')}
              placeholder="Se genera automáticamente desde el nombre"
              className={errors.slug ? 'border-red-300' : ''}
              disabled={isSubmitting}
            />
            {errors.slug && (
              <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              El slug se genera automáticamente. Puedes editarlo si lo deseas.
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (Opcional)
            </label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              placeholder="Descripción de la categoría..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-orange-500 focus:border-transparent ${
                errors.description ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={isSubmitting}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen de la Categoría *
            </label>
            <CategoryImageUpload
              currentImageUrl={imageUrl}
              onUploadSuccess={handleImageUpload}
              onError={(error) => {
                console.error('Image upload error:', error)
                alert(error)
              }}
              maxSizeMB={5}
              allowedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp']}
            />
            {errors.image_url && (
              <p className="mt-1 text-sm text-red-600">{errors.image_url.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !imageUrl}
              className="bg-blaze-orange-600 hover:bg-blaze-orange-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Categoría
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
