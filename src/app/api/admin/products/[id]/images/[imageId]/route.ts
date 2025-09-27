// 🖼️ Enterprise Individual Product Image API

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { composeMiddlewares } from '@/lib/api/middleware-composer'
import { withErrorHandler, ApiError, ValidationError, NotFoundError } from '@/lib/api/error-handler'
import { withApiLogging, logAdminAction } from '@/lib/api/api-logger'
import { withAdminAuth } from '@/lib/auth/api-auth-middleware'
import { withValidation } from '@/lib/validation/admin-schemas'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Validation schemas
const ImageUpdateSchema = z.object({
  alt_text: z.string().optional(),
  is_primary: z.boolean().optional(),
  display_order: z.number().int().min(0).optional(),
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

// Helper function to delete image from storage
async function deleteImageFromStorage(path: string) {
  const supabase = getStorageClient()

  const { error } = await supabase.storage.from('product-images').remove([path])

  if (error) {
    console.warn('Error deleting image from storage:', error)
    // Don't throw error, just log warning
  }
}

// Helper function to get image by ID
async function getImageById(
  supabase: ReturnType<typeof createClient<Database>>,
  productId: string,
  imageId: string
) {
  const { data: image, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('id', imageId)
    .eq('product_id', productId)
    .single()

  if (error || !image) {
    throw new NotFoundError('Imagen')
  }

  return image
}

/**
 * GET /api/admin/products/[id]/images/[imageId]
 * Get specific image
 */
const getHandler = async (
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) => {
  const { supabase } = request as any
  const { id: productId, imageId } = params

  // Validate params
  const paramsValidation = ImageParamsSchema.safeParse({ id: productId, imageId })
  if (!paramsValidation.success) {
    throw new ValidationError('Parámetros inválidos', paramsValidation.error.errors)
  }

  const image = await getImageById(supabase, productId, imageId)

  return NextResponse.json({
    data: image,
    success: true,
    message: 'Imagen obtenida exitosamente',
  })
}

/**
 * PUT /api/admin/products/[id]/images/[imageId]
 * Update image metadata
 */
const putHandler = async (
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) => {
  const { supabase, user, validatedData } = request as any
  const { id: productId, imageId } = params

  // Validate params
  const paramsValidation = ImageParamsSchema.safeParse({ id: productId, imageId })
  if (!paramsValidation.success) {
    throw new ValidationError('Parámetros inválidos', paramsValidation.error.errors)
  }

  // Check if image exists
  const existingImage = await getImageById(supabase, productId, imageId)

  // If setting as primary, update other images first
  if (validatedData.is_primary === true) {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', productId)
      .neq('id', imageId)
  }

  // Update image
  const { data: updatedImage, error } = await supabase
    .from('product_images')
    .update({
      ...validatedData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', imageId)
    .eq('product_id', productId)
    .select()
    .single()

  if (error) {
    throw new ApiError('Error al actualizar imagen', 500, 'DATABASE_ERROR', error)
  }

  // Log action
  await logAdminAction(user.id, 'UPDATE', 'product_image', imageId, existingImage, updatedImage)

  return NextResponse.json({
    data: updatedImage,
    success: true,
    message: 'Imagen actualizada exitosamente',
  })
}

/**
 * DELETE /api/admin/products/[id]/images/[imageId]
 * Delete image
 */
const deleteHandler = async (
  request: NextRequest,
  { params }: { params: { id: string; imageId: string } }
) => {
  const { supabase, user } = request as any
  const { id: productId, imageId } = params

  // Validate params
  const paramsValidation = ImageParamsSchema.safeParse({ id: productId, imageId })
  if (!paramsValidation.success) {
    throw new ValidationError('Parámetros inválidos', paramsValidation.error.errors)
  }

  // Check if image exists
  const existingImage = await getImageById(supabase, productId, imageId)

  // Delete from database first
  const { error: dbError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', imageId)
    .eq('product_id', productId)

  if (dbError) {
    throw new ApiError('Error al eliminar imagen de base de datos', 500, 'DATABASE_ERROR', dbError)
  }

  // Delete from storage (non-blocking)
  if (existingImage.storage_path) {
    deleteImageFromStorage(existingImage.storage_path).catch(error => {
      console.error('Failed to delete image from storage:', error)
    })
  }

  // If this was the primary image, set another image as primary
  if (existingImage.is_primary) {
    const { data: otherImages } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', productId)
      .limit(1)

    if (otherImages && otherImages.length > 0) {
      await supabase.from('product_images').update({ is_primary: true }).eq('id', otherImages[0].id)
    }
  }

  // Log action
  await logAdminAction(user.id, 'DELETE', 'product_image', imageId, existingImage, null)

  return NextResponse.json({
    success: true,
    message: 'Imagen eliminada exitosamente',
  })
}

// Apply enterprise middlewares and export handlers
export const GET = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_read'])
)(getHandler)

export const PUT = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_update']),
  withValidation(ImageUpdateSchema)
)(putHandler)

export const DELETE = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_delete'])
)(deleteHandler)
