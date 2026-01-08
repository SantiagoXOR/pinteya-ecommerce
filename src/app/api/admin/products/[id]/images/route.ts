// 🖼️ Enterprise Product Images API

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { composeMiddlewares } from '@/lib/api/middleware-composer'
import { withErrorHandler, ApiError, ValidationError, NotFoundError } from '@/lib/api/error-handler'
import { withApiLogging, logAdminAction } from '@/lib/api/api-logger'
import { withAdminAuth } from '@/lib/auth/api-auth-middleware'
import { withValidation } from '@/lib/validation/admin-schemas'
import { createClient } from '@supabase/supabase-js'

// ✅ CRÍTICO: Usar runtime nodejs para evitar problemas con body parsing en Vercel
export const runtime = 'nodejs'

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
  id: z.string().regex(/^\d+$/, 'ID de producto inválido'), // ✅ Aceptar IDs numéricos
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
    throw ValidationError('Tipo de archivo no permitido. Use JPG, PNG o WebP')
  }

  if (file.size > maxSize) {
    throw ValidationError('El archivo es demasiado grande. Máximo 5MB')
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
const postHandler = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  // ✅ CORREGIDO: Usar supabaseAdmin directamente
  const { supabaseAdmin } = await import('@/lib/integrations/supabase')
  
  // ✅ CRÍTICO: Verificar Content-Type ANTES de leer el body para diagnóstico en producción
  // En producción (Vercel), el Content-Type puede no estar presente o estar modificado
  const contentType = request.headers.get('content-type') || ''
  console.log('[POST /images] Content-Type recibido:', contentType)
  
  // ✅ CRÍTICO: Leer el body PRIMERO, antes de hacer cualquier otra cosa
  // Esto evita que cualquier acceso al request cause que Next.js intente leer el body
  let formData: FormData
  try {
    formData = await request.formData()
  } catch (error: any) {
    // Si el error es sobre Content-Type, es porque Next.js está validando antes de tiempo
    // En producción, esto puede pasar si Vercel procesa el request de manera diferente
    if (error.message?.includes('Content-Type')) {
      console.error('[POST /images] Error de Content-Type:', {
        contentType,
        error: error.message,
        stack: error.stack,
      })
      // Lanzar error más descriptivo
      throw new ApiError(
        `Error al procesar imagen: Content-Type no válido. Recibido: "${contentType}". Se requiere multipart/form-data`,
        400,
        'INVALID_CONTENT_TYPE',
        { contentType, originalError: error.message }
      )
    } else if (error.message?.includes('already been read') || error.message?.includes('unusable')) {
      console.warn('[POST /images] Body ya fue leído, intentando clonar request')
      try {
        const clonedRequest = request.clone()
        formData = await clonedRequest.formData()
      } catch (cloneError: any) {
        // Si clonar también falla, lanzar el error original
        throw error
      }
    } else {
      throw error
    }
  }
  
  // ✅ FIX: Si BYPASS_AUTH está activo, no intentar leer auth() porque puede causar que se lea el body
  // El middleware withAdminAuth ya verificó la autenticación, así que no necesitamos verificar aquí
  let user = null
  if (process.env.BYPASS_AUTH !== 'true') {
    try {
      // Solo intentar obtener usuario si no es multipart (ya leímos el body arriba)
      const { auth } = await import('@/lib/auth/config')
      const session = await auth()
      user = session?.user || null
    } catch (authError: any) {
      // Si auth() falla, simplemente continuar sin usuario
      console.warn('[POST /images] No se pudo obtener usuario, continuando sin autenticación')
      user = null
    }
  }
  
  const { id } = await context.params
  const productId = id

  // Validate params
  const paramsValidation = ProductParamsSchema.safeParse({ id: productId })
  if (!paramsValidation.success) {
    throw ValidationError('ID de producto inválido', paramsValidation.error.errors)
  }

  // Convert productId to number if it's numeric
  const numericProductId = /^\d+$/.test(productId) ? parseInt(productId, 10) : productId

  // Check if product exists
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, name')
    .eq('id', numericProductId)
    .single()

  if (productError || !product) {
    throw new NotFoundError('Producto')
  }

  // ✅ CRÍTICO: El body ya fue leído arriba, ahora extraer los datos
  const file = formData.get('file') as File
  const altText = formData.get('alt_text') as string
  const isPrimary = formData.get('is_primary') === 'true'

  if (!file) {
    throw ValidationError('No se proporcionó archivo')
  }

  // Validate file
  validateImageFile(file)

  // Generate filename and upload
  const filename = generateImageFilename(file.name, productId)
  const uploadResult = await uploadImageToStorage(file, filename)

  // Save image record to database
  const { data: imageRecord, error: dbError } = await supabaseAdmin
    .from('product_images')
    .insert({
      product_id: numericProductId,
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
    await supabaseAdmin
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', numericProductId)
      .neq('id', imageRecord.id)
  }

  // Log action
  if (user?.id) {
  await logAdminAction(user.id, 'CREATE', 'product_image', imageRecord.id, null, imageRecord)
  }

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
const getHandler = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  // ✅ CORREGIDO: Usar supabaseAdmin directamente en lugar de request.supabase
  const { supabaseAdmin } = await import('@/lib/integrations/supabase')
  const { id } = await context.params
  const productId = id

  // Validate params
  const paramsValidation = ProductParamsSchema.safeParse({ id: productId })
  if (!paramsValidation.success) {
    throw ValidationError('ID de producto inválido', paramsValidation.error.errors)
  }

  // Convert productId to number if it's numeric
  const numericProductId = /^\d+$/.test(productId) ? parseInt(productId, 10) : productId

  // Get images
  const { data: images, error } = await supabaseAdmin
    .from('product_images')
    .select('*')
    .eq('product_id', numericProductId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw new ApiError('Error al obtener imágenes', 500, 'DATABASE_ERROR', error)
  }

  return NextResponse.json({
    data: images || [],
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

// ✅ CRÍTICO: Orden de middlewares optimizado para requests multipart
// withAdminAuth debe ejecutarse PRIMERO para retornar inmediatamente cuando BYPASS_AUTH está activo
// Esto evita que otros middlewares accedan al request antes de que el handler lea el body
export const POST = composeMiddlewares(
  withAdminAuth(['products_update']), // Ejecutar PRIMERO para bypass inmediato
  withErrorHandler,
  withApiLogging
)(postHandler)
