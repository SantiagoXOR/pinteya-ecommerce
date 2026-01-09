// 📄 Enterprise Product Technical Sheet API
// Handles PDF technical sheet uploads for products

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { composeMiddlewares } from '@/lib/api/middleware-composer'
import { withErrorHandler, ApiError, ValidationError, NotFoundError } from '@/lib/api/error-handler'
import { withApiLogging, logAdminAction } from '@/lib/api/api-logger'
import { withAdminAuth } from '@/lib/auth/api-auth-middleware'
import { createClient } from '@supabase/supabase-js'

// Use nodejs runtime for formData handling
export const runtime = 'nodejs'

// Validation schemas
const ProductParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID de producto inválido'),
})

// Helper function to get Supabase Storage client
function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Helper function to validate PDF file
function validatePdfFile(file: File) {
  const allowedTypes = ['application/pdf']
  const maxSize = 10 * 1024 * 1024 // 10MB for PDFs

  if (!allowedTypes.includes(file.type)) {
    throw ValidationError('Solo se permiten archivos PDF')
  }

  if (file.size > maxSize) {
    throw ValidationError('El archivo es demasiado grande. Máximo 10MB')
  }
}

// Helper function to generate unique filename for PDF
function generatePdfFilename(originalName: string, productId: string): string {
  const timestamp = Date.now()
  const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50)
  return `products/${productId}/technical-sheets/${timestamp}_${cleanName}`
}

// Helper function to upload PDF to Supabase Storage
async function uploadPdfToStorage(file: File, filename: string) {
  const supabase = getStorageClient()

  const { data, error } = await supabase.storage.from('product-documents').upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: 'application/pdf',
  })

  if (error) {
    throw new ApiError('Error al subir PDF', 500, 'STORAGE_ERROR', error)
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from('product-documents').getPublicUrl(filename)

  return {
    path: data.path,
    url: urlData.publicUrl,
  }
}

// Helper function to delete PDF from storage
async function deletePdfFromStorage(path: string) {
  const supabase = getStorageClient()

  const { error } = await supabase.storage.from('product-documents').remove([path])

  if (error) {
    console.warn('Error deleting PDF from storage:', error)
  }
}

/**
 * POST /api/admin/products/[id]/technical-sheet
 * Upload technical sheet PDF for product
 */
const postHandler = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { supabaseAdmin } = await import('@/lib/integrations/supabase')
  
  const contentType = request.headers.get('content-type') || ''
  console.log('[POST /technical-sheet] Content-Type recibido:', contentType)
  
  // Read form data first
  let formData: FormData
  try {
    formData = await request.formData()
  } catch (error: any) {
    if (error.message?.includes('Content-Type')) {
      throw new ApiError(
        `Error al procesar PDF: Content-Type no válido. Recibido: "${contentType}". Se requiere multipart/form-data`,
        400,
        'INVALID_CONTENT_TYPE',
        { contentType, originalError: error.message }
      )
    } else if (error.message?.includes('already been read') || error.message?.includes('unusable')) {
      try {
        const clonedRequest = request.clone()
        formData = await clonedRequest.formData()
      } catch {
        throw error
      }
    } else {
      throw error
    }
  }
  
  // Get user for logging
  let user = null
  if (process.env.BYPASS_AUTH !== 'true') {
    try {
      const { auth } = await import('@/lib/auth/config')
      const session = await auth()
      user = session?.user || null
    } catch {
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

  const numericProductId = parseInt(productId, 10)

  // Check if product exists
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .select('id, name')
    .eq('id', numericProductId)
    .single()

  if (productError || !product) {
    throw new NotFoundError('Producto')
  }

  // Extract form data
  const file = formData.get('file') as File
  const title = (formData.get('title') as string) || file?.name?.replace('.pdf', '') || 'Ficha Técnica'

  if (!file) {
    throw ValidationError('No se proporcionó archivo')
  }

  // Validate file
  validatePdfFile(file)

  // Check if product already has a technical sheet
  const { data: existingSheet } = await supabaseAdmin
    .from('product_technical_sheets')
    .select('id, storage_path')
    .eq('product_id', numericProductId)
    .single()

  // If exists, delete old file from storage
  if (existingSheet?.storage_path) {
    await deletePdfFromStorage(existingSheet.storage_path)
  }

  // Generate filename and upload
  const filename = generatePdfFilename(file.name, productId)
  const uploadResult = await uploadPdfToStorage(file, filename)

  // Save or update record in database
  let sheetRecord
  if (existingSheet) {
    // Update existing record
    const { data, error: dbError } = await supabaseAdmin
      .from('product_technical_sheets')
      .update({
        url: uploadResult.url,
        storage_path: uploadResult.path,
        title: title,
        original_filename: file.name,
        file_size: file.size,
        file_type: file.type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSheet.id)
      .select()
      .single()

    if (dbError) {
      await deletePdfFromStorage(uploadResult.path)
      throw new ApiError('Error al actualizar ficha técnica en base de datos', 500, 'DATABASE_ERROR', dbError)
    }
    sheetRecord = data
  } else {
    // Insert new record
    const { data, error: dbError } = await supabaseAdmin
      .from('product_technical_sheets')
      .insert({
        product_id: numericProductId,
        url: uploadResult.url,
        storage_path: uploadResult.path,
        title: title,
        original_filename: file.name,
        file_size: file.size,
        file_type: file.type,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (dbError) {
      await deletePdfFromStorage(uploadResult.path)
      throw new ApiError('Error al guardar ficha técnica en base de datos', 500, 'DATABASE_ERROR', dbError)
    }
    sheetRecord = data
  }

  // Log action
  if (user?.id) {
    await logAdminAction(
      user.id, 
      existingSheet ? 'UPDATE' : 'CREATE', 
      'product_technical_sheet', 
      sheetRecord.id, 
      existingSheet || null, 
      sheetRecord
    )
  }

  return NextResponse.json(
    {
      data: sheetRecord,
      success: true,
      message: 'Ficha técnica subida exitosamente',
    },
    { status: 201 }
  )
}

/**
 * GET /api/admin/products/[id]/technical-sheet
 * Get technical sheet for product
 */
const getHandler = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { supabaseAdmin } = await import('@/lib/integrations/supabase')
  const { id } = await context.params
  const productId = id

  // Validate params
  const paramsValidation = ProductParamsSchema.safeParse({ id: productId })
  if (!paramsValidation.success) {
    throw ValidationError('ID de producto inválido', paramsValidation.error.errors)
  }

  const numericProductId = parseInt(productId, 10)

  // Get technical sheet
  const { data: sheet, error } = await supabaseAdmin
    .from('product_technical_sheets')
    .select('*')
    .eq('product_id', numericProductId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new ApiError('Error al obtener ficha técnica', 500, 'DATABASE_ERROR', error)
  }

  return NextResponse.json({
    data: sheet || null,
    success: true,
    message: sheet ? 'Ficha técnica obtenida exitosamente' : 'No hay ficha técnica para este producto',
  })
}

/**
 * DELETE /api/admin/products/[id]/technical-sheet
 * Delete technical sheet for product
 */
const deleteHandler = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { supabaseAdmin } = await import('@/lib/integrations/supabase')
  const { id } = await context.params
  const productId = id

  // Get user for logging
  let user = null
  if (process.env.BYPASS_AUTH !== 'true') {
    try {
      const { auth } = await import('@/lib/auth/config')
      const session = await auth()
      user = session?.user || null
    } catch {
      user = null
    }
  }

  // Validate params
  const paramsValidation = ProductParamsSchema.safeParse({ id: productId })
  if (!paramsValidation.success) {
    throw ValidationError('ID de producto inválido', paramsValidation.error.errors)
  }

  const numericProductId = parseInt(productId, 10)

  // Get existing sheet
  const { data: existingSheet, error: getError } = await supabaseAdmin
    .from('product_technical_sheets')
    .select('*')
    .eq('product_id', numericProductId)
    .single()

  if (getError || !existingSheet) {
    throw new NotFoundError('Ficha técnica')
  }

  // Delete from storage
  if (existingSheet.storage_path) {
    await deletePdfFromStorage(existingSheet.storage_path)
  }

  // Delete from database
  const { error: deleteError } = await supabaseAdmin
    .from('product_technical_sheets')
    .delete()
    .eq('id', existingSheet.id)

  if (deleteError) {
    throw new ApiError('Error al eliminar ficha técnica', 500, 'DATABASE_ERROR', deleteError)
  }

  // Log action
  if (user?.id) {
    await logAdminAction(user.id, 'DELETE', 'product_technical_sheet', existingSheet.id, existingSheet, null)
  }

  return NextResponse.json({
    success: true,
    message: 'Ficha técnica eliminada exitosamente',
  })
}

// Apply enterprise middlewares and export handlers
export const GET = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_read'])
)(getHandler)

export const POST = composeMiddlewares(
  withAdminAuth(['products_update']),
  withErrorHandler,
  withApiLogging
)(postHandler)

export const DELETE = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_update'])
)(deleteHandler)
