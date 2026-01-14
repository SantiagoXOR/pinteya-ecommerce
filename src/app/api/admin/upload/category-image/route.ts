/**
 * Category Image Upload API
 * Pinteya E-commerce - Upload and optimize category images
 * 
 * Uploads category images to Supabase Storage, optimizes them to WebP format,
 * and stores them in the categories folder.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { Readable } from 'stream'

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
    return { error: 'Tipo de archivo no permitido. Use JPG, PNG o WebP' }
  }

  if (file.size > maxSize) {
    return { error: 'El archivo es demasiado grande. Máximo 5MB' }
  }

  return { valid: true }
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
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación de admin
    const authResult = await requireAdminAuth(request, ['categories_create'])

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
          enterprise: true,
          timestamp: new Date().toISOString(),
        },
        { status: authResult.status || 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        {
          error: 'No se proporcionó archivo',
          code: 'NO_FILE',
        },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      )
    }

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
  } catch (error) {
    console.error('Error uploading category image:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al subir imagen de categoría',
        code: 'UPLOAD_ERROR',
      },
      { status: 500 }
    )
  }
}
