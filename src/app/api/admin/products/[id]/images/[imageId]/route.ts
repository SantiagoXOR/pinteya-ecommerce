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
  id: z.string().regex(/^\d+$/, 'ID de producto inválido'), // ✅ Aceptar IDs numéricos
  imageId: z.string().uuid('ID de imagen inválido'), // Las imágenes sí usan UUID
})

// Helper function to get Supabase Storage client
function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Helper function to delete image from storage
async function deleteImageFromStorage(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getStorageClient()
    
    // ✅ CORREGIDO: Verificar que el path no esté vacío
    if (!path || path.trim() === '') {
      console.warn('⚠️ [deleteImageFromStorage] Path vacío, no se puede eliminar')
      return { success: false, error: 'Path vacío' }
    }
    
    console.log('🗑️ [deleteImageFromStorage] Eliminando archivo:', {
      bucket: 'product-images',
      path,
    })
    
    const { data, error } = await supabase.storage.from('product-images').remove([path])
    
    if (error) {
      console.error('❌ [deleteImageFromStorage] Error al eliminar:', {
        error: error.message,
        path,
        bucket: 'product-images',
      })
      return { success: false, error: error.message }
    }
    
    console.log('✅ [deleteImageFromStorage] Archivo eliminado exitosamente:', {
      path,
      deletedFiles: data,
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('❌ [deleteImageFromStorage] Excepción al eliminar:', {
      error: error.message,
      stack: error.stack,
      path,
    })
    return { success: false, error: error.message }
  }
}

// Helper function to get image by ID
async function getImageById(
  supabase: ReturnType<typeof createClient<Database>>,
  productId: string | number,
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
  context: { params: Promise<{ id: string; imageId: string }> }
) => {
  // ✅ CORREGIDO: Usar supabaseAdmin directamente
  const { supabaseAdmin } = await import('@/lib/integrations/supabase')
  const { id: productId, imageId } = await context.params

  // Validate params
  const paramsValidation = ImageParamsSchema.safeParse({ id: productId, imageId })
  if (!paramsValidation.success) {
    throw ValidationError('Parámetros inválidos', paramsValidation.error.errors)
  }

  const image = await getImageById(supabaseAdmin, productId, imageId)

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
  context: { params: Promise<{ id: string; imageId: string }> }
) => {
  // ✅ CORREGIDO: Usar supabaseAdmin directamente y obtener user del auth
  const { supabaseAdmin } = await import('@/lib/integrations/supabase')
  const { auth } = await import('@/lib/auth/config')
  const session = await auth()
  const user = session?.user
  
  const { validatedData } = request as any
  const { id: productId, imageId } = await context.params

  // Validate params
  const paramsValidation = ImageParamsSchema.safeParse({ id: productId, imageId })
  if (!paramsValidation.success) {
    throw ValidationError('Parámetros inválidos', paramsValidation.error.errors)
  }

  // Convert productId to number if it's numeric
  const numericProductId = /^\d+$/.test(productId) ? parseInt(productId, 10) : productId

  // Check if image exists
  const existingImage = await getImageById(supabaseAdmin, numericProductId.toString(), imageId)

  // If setting as primary, update other images first
  if (validatedData.is_primary === true) {
    await supabaseAdmin
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', numericProductId)
      .neq('id', imageId)
  }

  // Update image
  const { data: updatedImage, error } = await supabaseAdmin
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
  if (user?.id) {
    await logAdminAction(user.id, 'UPDATE', 'product_image', imageId, existingImage, updatedImage)
  }

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
  context: { params: Promise<{ id: string; imageId: string }> }
) => {
  // ✅ CORREGIDO: Usar supabaseAdmin directamente y obtener user del auth
  const { supabaseAdmin } = await import('@/lib/integrations/supabase')
  const { auth } = await import('@/lib/auth/config')
  const session = await auth()
  const user = session?.user
  
  const { id: productId, imageId } = await context.params

  // Validate params
  const paramsValidation = ImageParamsSchema.safeParse({ id: productId, imageId })
  if (!paramsValidation.success) {
    throw ValidationError('Parámetros inválidos', paramsValidation.error.errors)
  }

  // Convert productId to number if it's numeric
  const numericProductId = /^\d+$/.test(productId) ? parseInt(productId, 10) : productId

  // Check if image exists
  const existingImage = await getImageById(supabaseAdmin, numericProductId.toString(), imageId)

  // ✅ DEBUG: Log antes de eliminar
  console.log('🗑️ [DELETE Image] Eliminando imagen:', {
    productId: numericProductId,
    imageId,
    storagePath: existingImage.storage_path,
  })

  // Delete from database first
  const { error: dbError, data: deletedData } = await supabaseAdmin
    .from('product_images')
    .delete()
    .eq('id', imageId)
    .eq('product_id', numericProductId)
    .select()

  if (dbError) {
    console.error('❌ [DELETE Image] Error al eliminar de BD:', dbError)
    throw new ApiError('Error al eliminar imagen de base de datos', 500, 'DATABASE_ERROR', dbError)
  }

  console.log('✅ [DELETE Image] Imagen eliminada de BD:', { deletedCount: deletedData?.length || 0 })

  // Delete from storage
  if (existingImage.storage_path) {
    console.log('🗑️ [DELETE Image] Eliminando de storage:', existingImage.storage_path)
    const storageResult = await deleteImageFromStorage(existingImage.storage_path)
    
    if (!storageResult.success) {
      // ✅ CORREGIDO: Log el error pero no fallar la eliminación de la DB
      // La imagen ya fue eliminada de la DB, así que continuamos
      console.error('⚠️ [DELETE Image] Error al eliminar de storage (continuando):', {
        error: storageResult.error,
        storagePath: existingImage.storage_path,
        note: 'La imagen fue eliminada de la DB pero no del storage. Puede requerir limpieza manual.',
      })
    } else {
      console.log('✅ [DELETE Image] Imagen eliminada de storage exitosamente')
    }
  } else {
    console.warn('⚠️ [DELETE Image] No hay storage_path, saltando eliminación de storage')
  }

  // If this was the primary image, set another image as primary
  if (existingImage.is_primary) {
    const { data: otherImages } = await supabaseAdmin
      .from('product_images')
      .select('id')
      .eq('product_id', numericProductId)
      .limit(1)

    if (otherImages && otherImages.length > 0) {
      await supabaseAdmin.from('product_images').update({ is_primary: true }).eq('id', otherImages[0].id)
    }
  }

  // Log action
  if (user?.id) {
    await logAdminAction(user.id, 'DELETE', 'product_image', imageId, existingImage, null)
  }

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
