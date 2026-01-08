// 🖼️ Generic Image Upload API (for products without ID yet)

import { NextRequest, NextResponse } from 'next/server'
import { checkCRUDPermissions } from '@/lib/auth/admin-auth'
import { createClient } from '@supabase/supabase-js'

// Configurar runtime para Node.js (necesario para formData)
export const runtime = 'nodejs'

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
    return { error: 'Tipo de archivo no permitido. Use JPG, PNG o WebP' }
  }

  if (file.size > maxSize) {
    return { error: 'El archivo es demasiado grande. Máximo 5MB' }
  }

  return { valid: true }
}

// Helper function to generate unique filename
function generateImageFilename(originalName: string): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 9)
  const extension = originalName.split('.').pop()?.toLowerCase() || 'webp'
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50)
  return `temp/${timestamp}_${randomId}_${cleanName}`
}

// Helper function to upload image to Supabase Storage
async function uploadImageToStorage(file: File, filename: string) {
  const supabase = getStorageClient()

  const { data, error } = await supabase.storage.from('product-images').upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) {
    throw new Error(`Error al subir imagen: ${error.message}`)
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filename)

  return {
    path: data.path,
    url: urlData.publicUrl,
  }
}

/**
 * POST /api/admin/upload/image
 * Upload image to temporary storage (for products without ID yet)
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const authResult = await checkCRUDPermissions('create', 'products')

    if (!authResult.allowed) {
      return NextResponse.json(
        {
          error: authResult.error || 'Autenticación requerida',
          code: 'AUTH_ERROR',
        },
        { status: 401 }
      )
    }

    // Verificar Content-Type
    const contentType = request.headers.get('content-type')
    if (!contentType || !contentType.includes('multipart/form-data')) {
      console.error('❌ [Upload] Content-Type inválido:', contentType)
      return NextResponse.json(
        {
          error: 'Content-Type debe ser multipart/form-data',
          code: 'INVALID_CONTENT_TYPE',
          received: contentType,
        },
        { status: 400 }
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

    // Generate filename and upload
    const filename = generateImageFilename(file.name)
    const uploadResult = await uploadImageToStorage(file, filename)

    return NextResponse.json(
      {
        data: {
          url: uploadResult.url,
          path: uploadResult.path,
        },
        success: true,
        message: 'Imagen subida exitosamente',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Error al subir imagen',
        code: 'UPLOAD_ERROR',
      },
      { status: 500 }
    )
  }
}
