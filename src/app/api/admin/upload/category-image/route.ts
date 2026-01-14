/**
 * Category Image Upload API
 * Pinteya E-commerce - Upload and optimize category images
 * 
 * Uploads category images to Supabase Storage, optimizes them to WebP format,
 * and stores them in the categories folder.
 */

import { NextRequest, NextResponse } from 'next/server'
import { composeMiddlewares } from '@/lib/api/middleware-composer'
import { withErrorHandler, ApiError, ValidationError } from '@/lib/api/error-handler'
import { withApiLogging } from '@/lib/api/api-logger'
import { withAdminAuth } from '@/lib/auth/api-auth-middleware'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

// Configurar runtime para Node.js (necesario para formData y sharp)
export const runtime = 'nodejs'

// Helper function to get Supabase Storage client
function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing')
  }

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

// Helper function to generate unique filename for category image
function generateCategoryImageFilename(originalName: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 9)
  const cleanName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50)
    .toLowerCase()
  
  // Always use .webp extension since we convert to WebP
  return `categories/${timestamp}_${randomId}_${cleanName.replace(/\.[^/.]+$/, '')}.webp`
}

// Helper function to optimize image to WebP
async function optimizeImageToWebP(file: File): Promise<Buffer> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Optimize image with Sharp
    // For category icons, we want:
    // - Max size: 400x400px (icons are typically small)
    // - Format: WebP
    // - Quality: 85 (good balance)
    // - Maintain aspect ratio
    // - Transparent background preserved
    const optimized = await sharp(buffer)
      .resize(400, 400, {
        fit: 'inside',
        withoutEnlargement: true, // Don't enlarge if smaller
      })
      .webp({
        quality: 85,
        effort: 6, // Higher effort = better compression
        alphaQuality: 100, // Preserve transparency quality
      })
      .toBuffer()

    return optimized
  } catch (error) {
    console.error('Error optimizing image:', error)
    throw new Error(`Error al optimizar imagen: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function to upload image to Supabase Storage
async function uploadImageToStorage(
  imageBuffer: Buffer,
  filename: string
): Promise<{ path: string; url: string }> {
  const supabase = getStorageClient()

  // Upload to product-images bucket in categories folder
  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filename, imageBuffer, {
      contentType: 'image/webp',
      cacheControl: '3600',
      upsert: false, // Don't overwrite existing files
    })

  if (error) {
    throw new Error(`Error al subir imagen: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filename)

  return {
    path: data.path,
    url: urlData.publicUrl,
  }
}

/**
 * POST /api/admin/upload/category-image
 * Upload and optimize category image
 */
const postHandler = async (request: NextRequest) => {
  // ✅ CRÍTICO: Verificar Content-Type ANTES de leer el body para diagnóstico en producción
  const contentType = request.headers.get('content-type') || ''
  console.log('[POST /category-image] Content-Type recibido:', contentType)

  // ✅ CRÍTICO: Leer el body PRIMERO, antes de hacer cualquier otra cosa
  // Esto evita que cualquier acceso al request cause que Next.js intente leer el body
  let formData: FormData
  try {
    formData = await request.formData()
  } catch (error: any) {
    // Si el error es sobre Content-Type, es porque Next.js está validando antes de tiempo
    if (error.message?.includes('Content-Type')) {
      console.error('[POST /category-image] Error de Content-Type:', {
        contentType,
        error: error.message,
        stack: error.stack,
      })
      throw new ApiError(
        `Error al procesar imagen: Content-Type no válido. Recibido: "${contentType}". Se requiere multipart/form-data`,
        400,
        'INVALID_CONTENT_TYPE',
        { contentType, originalError: error.message }
      )
    } else if (error.message?.includes('already been read') || error.message?.includes('unusable')) {
      console.warn('[POST /category-image] Body ya fue leído, intentando clonar request')
      try {
        const clonedRequest = request.clone()
        formData = await clonedRequest.formData()
      } catch (cloneError: any) {
        throw error
      }
    } else {
      throw error
    }
  }

  // ✅ FIX: Si BYPASS_AUTH está activo, no intentar leer auth() porque puede causar que se lea el body
  // El middleware withAdminAuth ya verificó la autenticación
  let user = null
  if (process.env.BYPASS_AUTH !== 'true') {
    try {
      const { auth } = await import('@/lib/auth/config')
      const session = await auth()
      user = session?.user || null
    } catch (authError: any) {
      console.warn('[POST /category-image] No se pudo obtener usuario, continuando sin autenticación')
      user = null
    }
  }

  // ✅ CRÍTICO: El body ya fue leído arriba, ahora extraer los datos
  const file = formData.get('file') as File

  if (!file) {
    throw ValidationError('No se proporcionó archivo')
  }

  // Validate file
  validateImageFile(file)

  // Optimize image to WebP
  const optimizedBuffer = await optimizeImageToWebP(file)

  // Generate filename
  const filename = generateCategoryImageFilename(file.name)

  // Upload to Supabase Storage
  const uploadResult = await uploadImageToStorage(optimizedBuffer, filename)

  return NextResponse.json(
    {
      data: {
        url: uploadResult.url,
        path: uploadResult.path,
      },
      success: true,
      message: 'Imagen de categoría subida y optimizada exitosamente',
    },
    { status: 201 }
  )
}

// ✅ CRÍTICO: Orden de middlewares optimizado para requests multipart
// withAdminAuth debe ejecutarse PRIMERO para retornar inmediatamente cuando BYPASS_AUTH está activo
// Esto evita que otros middlewares accedan al request antes de que el handler lea el body
export const POST = composeMiddlewares(
  withAdminAuth(['categories_create']), // Ejecutar PRIMERO para bypass inmediato
  withErrorHandler,
  withApiLogging
)(postHandler)
