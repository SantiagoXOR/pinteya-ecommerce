// 🖼️ Enterprise Product Images API

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { composeMiddlewares } from '@/lib/api/middleware-composer'
import { withErrorHandler, ApiError, ValidationError, NotFoundError } from '@/lib/api/error-handler'
import { withApiLogging, logAdminAction } from '@/lib/api/api-logger'
import { withAdminAuth } from '@/lib/auth/api-auth-middleware'
import { withValidation } from '@/lib/validation/admin-schemas'
import { createClient } from '@supabase/supabase-js'

// Validation schemas
const ImageUploadSchema = z.object({
  file: z.any(), // File object
  alt_text: z.string().optional(),
  is_primary: z.boolean().default(false),
})

const ImageUpdateSchema = z.object({
  alt_text: z.string().optional(),
  is_primary: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
})

const ProductParamsSchema = z.object({
  id: z.string().uuid('ID de producto inválido'),
})

const ImageParamsSchema = z.object({
  id: z.string().uuid('ID de producto inválido'),
  imageId: z.string().uuid('ID de imagen inválido'),
})

// Helper function to get Supabase Storage client
function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Helper function to validate file
function validateImageFile(file: File) {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError('Tipo de archivo no permitido. Use JPG, PNG o WebP')
  }

  if (file.size > maxSize) {
    throw new ValidationError('El archivo es demasiado grande. Máximo 5MB')
  }
}

// Helper function to generate unique filename
function generateImageFilename(originalName: string, productId: string): string {
  const timestamp = Date.now()
  const extension = originalName.split('.').pop()
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `products/${productId}/${timestamp}_${cleanName}`
}

// Helper function to upload image to Supabase Storage
async function uploadImageToStorage(file: File, filename: string) {
  const supabase = getStorageClient()

  const { data, error } = await supabase.storage.from('product-images').upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new ApiError('Error al subir imagen', 500, 'STORAGE_ERROR', error)
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filename)

  return {
    path: data.path,
    url: urlData.publicUrl,
  }
}

// Helper function to delete image from storage
async function deleteImageFromStorage(path: string) {
  const supabase = getStorageClient()

  const { error } = await supabase.storage.from('product-images').remove([path])

  if (error) {
    console.warn('Error deleting image from storage:', error)
    // Don't throw error, just log warning
  }
}

/**
 * POST /api/admin/products/[id]/images
 * Upload new image for product
 */
const postHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
  const { supabase, user } = request as any
  const productId = params.id

  // Validate params
  const paramsValidation = ProductParamsSchema.safeParse({ id: productId })
  if (!paramsValidation.success) {
    throw new ValidationError('ID de producto inválido', paramsValidation.error.errors)
  }

  // Check if product exists
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    throw new NotFoundError('Producto')
  }

  // Parse form data
  const formData = await request.formData()
  const file = formData.get('file') as File
  const altText = formData.get('alt_text') as string
  const isPrimary = formData.get('is_primary') === 'true'

  if (!file) {
    throw new ValidationError('No se proporcionó archivo')
  }

  // Validate file
  validateImageFile(file)

  // Generate filename and upload
  const filename = generateImageFilename(file.name, productId)
  const uploadResult = await uploadImageToStorage(file, filename)

  // Save image record to database
  const { data: imageRecord, error: dbError } = await supabase
    .from('product_images')
    .insert({
      product_id: productId,
      url: uploadResult.url,
      storage_path: uploadResult.path,
      alt_text: altText || null,
      is_primary: isPrimary,
      file_size: file.size,
      file_type: file.type,
      original_filename: file.name,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (dbError) {
    // Clean up uploaded file if database insert fails
    await deleteImageFromStorage(uploadResult.path)
    throw new ApiError('Error al guardar imagen en base de datos', 500, 'DATABASE_ERROR', dbError)
  }

  // If this is set as primary, update other images
  if (isPrimary) {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId)
      .neq('id', imageRecord.id)
  }

  // Log action
  await logAdminAction(user.id, 'CREATE', 'product_image', imageRecord.id, null, imageRecord)

  return NextResponse.json(
    {
      data: imageRecord,
      success: true,
      message: 'Imagen subida exitosamente',
    },
    { status: 201 }
  )
}

/**
 * GET /api/admin/products/[id]/images
 * Get all images for product
 */
const getHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
  const { supabase } = request as any
  const productId = params.id

  // Validate params
  const paramsValidation = ProductParamsSchema.safeParse({ id: productId })
  if (!paramsValidation.success) {
    throw new ValidationError('ID de producto inválido', paramsValidation.error.errors)
  }

  // Get images
  const { data: images, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new ApiError('Error al obtener imágenes', 500, 'DATABASE_ERROR', error)
  }

  return NextResponse.json({
    data: images,
    success: true,
    message: 'Imágenes obtenidas exitosamente',
  })
}

// Apply enterprise middlewares and export handlers
export const GET = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_read'])
)(getHandler)

export const POST = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_update'])
)(postHandler)
