import { NextRequest, NextResponse } from 'next/server'
import { checkCRUDPermissions, logAdminAction, getRequestInfo } from '@/lib/auth/admin-auth'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import { Database } from '@/types/database'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Enterprise middleware imports
import { withErrorHandler } from '@/lib/api/error-handler'
import { withApiLogging } from '@/lib/api/api-logger'
import { withAdminAuth } from '@/lib/auth/api-auth-middleware'
import { withValidation } from '@/lib/validation/admin-schemas'
import { composeMiddlewares } from '@/lib/api/middleware-composer'

// Helper function to check admin permissions
async function checkAdminPermissionsForProducts(
  action: 'create' | 'read' | 'update' | 'delete',
  request?: NextRequest
) {
  return await checkCRUDPermissions(action, 'products')
}

// Validation schemas
const UpdateProductSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255, 'Máximo 255 caracteres').optional(),
  description: z.string().optional(),
  short_description: z.string().max(500, 'Máximo 500 caracteres').optional(),
  price: z.number().min(0, 'El precio debe ser mayor a 0').optional(),
  discounted_price: z.number().min(0).optional(),
  stock: z.number().min(0, 'El stock debe ser mayor o igual a 0').optional(),
  low_stock_threshold: z.number().min(0).optional(),
  category_id: z.string().uuid('ID de categoría inválido').optional(),
  brand: z.string().optional(),
  images: z
    .array(
      z.object({
        url: z.string().url(),
        alt_text: z.string().optional(),
        is_primary: z.boolean().default(false),
      })
    )
    .optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
})

const ProductParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID debe ser un número entero positivo'),
})

// Enterprise imports for error handling
import { ApiError, NotFoundError, ValidationError } from '@/lib/api/error-handler'

// Helper function to get product by ID - Returns null if not found
async function getProductById(
  supabase: ReturnType<typeof createClient<Database>>,
  productId: string
) {
  console.log('🔥🔥 getProductById: Iniciando con ID:', productId)
  
  // Convert string ID to integer for DB query
  const numericId = parseInt(productId, 10)
  console.log('🔥🔥 Numeric ID:', numericId, 'tipo:', typeof numericId)
  
  const { data: product, error } = await supabase
    .from('products')
    .select(
      `
      id,
      name,
      slug,
      description,
      short_description,
      price,
      discounted_price,
      stock,
      low_stock_threshold,
      category_id,
      brand,
      images,
      is_active,
      is_featured,
      created_at,
      updated_at,
      categories (
        id,
        name
      )
    `
    )
    .eq('id', numericId)
    .single()

  console.log('🔥🔥 Supabase result:', { hasData: !!product, hasError: !!error, productId: product?.id })
  
  if (error || !product) {
    console.log('🔥🔥 Retornando NULL - Error:', error?.message)
    return null  // Return null instead of throwing
  }

  // Transform response with enhanced data
  const transformedProduct = {
    ...product,
    category_name: product.categories?.name || null,
    categories: undefined,
    // Transform images JSONB to image_url
    image_url: 
      product.images?.previews?.[0] || 
      product.images?.thumbnails?.[0] ||
      product.images?.main ||
      null,
      // Derive status from is_active (status column doesn't exist in DB)
      status: product.is_active ? 'active' : 'inactive',
    // Defaults para campos opcionales
    cost_price: product.cost_price ?? null,
    compare_price: product.compare_price ?? product.discounted_price ?? null,
    track_inventory: product.track_inventory ?? true,
    allow_backorder: product.allow_backorder ?? false,
  }

  return transformedProduct
}

// Helper function to generate unique slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * GET /api/admin/products/[id] - Simplified Handler
 * Obtener producto específico por ID
 */
const getHandler = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  console.log('🔥 [GET /api/admin/products/[id]] Iniciando...')
  
  // Auth check
  const authResult = await checkAdminPermissionsForProducts('read')
  if (!authResult.allowed) {
    console.log('🔥 Auth denegado')
    return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
  }

  const { id } = await context.params
  const productId = id
  console.log('🔥 Product ID recibido:', productId, 'tipo:', typeof productId)

  // Validar parámetros
  const paramsValidation = ProductParamsSchema.safeParse({ id: productId })
  if (!paramsValidation.success) {
    console.log('🔥 Validación falló:', paramsValidation.error)
    return NextResponse.json(
      { error: 'ID de producto inválido', details: paramsValidation.error.errors },
      { status: 400 }
    )
  }

  console.log('🔥 Llamando getProductById con supabaseAdmin...')
  // Usar supabaseAdmin directamente
  const product = await getProductById(supabaseAdmin, productId)
  console.log('🔥 Producto retornado:', product ? `ID:${product.id} Name:${product.name}` : 'NULL')

  if (!product) {
    console.log('🔥 Producto no encontrado, retornando 404')
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  }

  console.log('🔥 Retornando producto exitosamente')
  return NextResponse.json({
    data: product,
    product: product, // Para compatibilidad
    success: true,
    message: 'Producto obtenido exitosamente',
  })
}

/**
 * PUT /api/admin/products/[id] - Enterprise Handler
 * Actualizar producto específico con middleware enterprise
 */
const putHandler = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { supabase, user, validatedData } = request as any
  const { id } = await context.params
  const productId = id

  // Validar parámetros
  const paramsValidation = ProductParamsSchema.safeParse({ id: productId })
  if (!paramsValidation.success) {
    throw ValidationError('ID de producto inválido', paramsValidation.error.errors)
  }

  // Verificar que el producto existe
  const existingProduct = await getProductById(supabase, productId)

  // Verificar categoría si se está actualizando
  if (validatedData.category_id) {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', validatedData.category_id)
      .single()

    if (categoryError || !category) {
      throw ValidationError('Categoría no encontrada')
    }
  }

  // Generar slug si se actualiza el nombre
  const updateData = {
    ...validatedData,
    updated_at: new Date().toISOString(),
  }

  if (validatedData.name) {
    updateData.slug = generateSlug(validatedData.name)
  }

  // Actualizar producto
  const { data: updatedProduct, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', productId)
    .select(
      `
      id,
      name,
      slug,
      description,
      short_description,
      price,
      discounted_price,
      stock,
      low_stock_threshold,
      category_id,
      brand,
      images,
      is_active,
      is_featured,
      created_at,
      updated_at,
      categories (
        id,
        name
      )
    `
    )
    .single()

  if (error) {
    throw new ApiError('Error al actualizar producto', 500, 'DATABASE_ERROR', error)
  }

  // Log de auditoría
  await logAdminAction(user.id, 'UPDATE', 'product', productId, existingProduct, updatedProduct)

  // Transform response
  const transformedProduct = {
    ...updatedProduct,
    category_name: updatedProduct.categories?.name || null,
    categories: undefined,
  }

  return NextResponse.json({
    data: transformedProduct,
    success: true,
    message: 'Producto actualizado exitosamente',
  })
}

/**
 * DELETE /api/admin/products/[id] - Enterprise Handler
 * Eliminar producto específico con middleware enterprise
 */
const deleteHandler = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const { supabase, user } = request as any
  const { id } = await context.params
  const productId = id

  // Validar parámetros
  const paramsValidation = ProductParamsSchema.safeParse({ id: productId })
  if (!paramsValidation.success) {
    throw ValidationError('ID de producto inválido', paramsValidation.error.errors)
  }

  // Verificar que el producto existe
  const existingProduct = await getProductById(supabase, productId)

  // Verificar si el producto está referenciado en órdenes
  const { data: orderItems, error: orderCheckError } = await supabase
    .from('order_items')
    .select('id')
    .eq('product_id', productId)
    .limit(1)

  if (orderCheckError) {
    console.warn('Error checking order references:', orderCheckError)
    // Continuar con eliminación aunque falle la verificación
  }

  let deletionResult
  let isHardDelete = false

  if (orderItems && orderItems.length > 0) {
    // Soft delete: marcar como inactivo
    const { error: updateError } = await supabase
      .from('products')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)

    if (updateError) {
      throw new ApiError('Error al eliminar producto', 500, 'DATABASE_ERROR', updateError)
    }

    deletionResult = {
      message: 'Producto marcado como inactivo (tiene órdenes asociadas)',
      soft_delete: true,
    }
  } else {
    // Hard delete si no hay referencias
    const { error } = await supabase.from('products').delete().eq('id', productId)

    if (error) {
      throw new ApiError('Error al eliminar producto', 500, 'DATABASE_ERROR', error)
    }

    isHardDelete = true
    deletionResult = {
      message: 'Producto eliminado exitosamente',
      hard_delete: true,
    }
  }

  // Log de auditoría
  await logAdminAction(
    user.id,
    isHardDelete ? 'DELETE' : 'SOFT_DELETE',
    'product',
    productId,
    existingProduct,
    null
  )

  return NextResponse.json({
    ...deletionResult,
    success: true,
  })
}

// Export GET handler - Completamente simplificado
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔥🔥🔥 GET SIMPLIFICADO - Iniciando')
    
    // Auth simple
    const authResult = await checkAdminPermissionsForProducts('read')
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }
    
    const { id } = await context.params
    console.log('🔥🔥🔥 ID recibido:', id)
    
    const productId = parseInt(id, 10)
    console.log('🔥🔥🔥 ID parseado:', productId)
    
    // Query directa
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        categories (id, name)
      `)
      .eq('id', productId)
      .single()
    
    console.log('🔥🔥🔥 Query result:', { hasData: !!data, error: error?.message, productId: data?.id })
    
    if (error || !data) {
      console.log('🔥🔥🔥 Retornando 404')
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }
    
    // Obtener variantes reales de la BD
    const { data: variants } = await supabaseAdmin
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
    
    const defaultVariant = variants?.find(v => v.is_default) || variants?.[0]
    
    // Transform ALL fields para compatibilidad con frontend
    const transformedData = {
      ...data,
      category_name: data.categories?.name || null,
      categories: undefined,
      // Incluir variantes
      variants: variants || [],
      variant_count: variants?.length || 0,
      default_variant: defaultVariant,
      // Transform images JSONB to image_url (priorizar variante default)
      image_url: 
        defaultVariant?.image_url ||
        data.images?.previews?.[0] || 
        data.images?.thumbnails?.[0] ||
        data.images?.main ||
        null,
      // Derive status from is_active (status column doesn't exist in DB)
      status: data.is_active ? 'active' : 'inactive',
      // Usar precio/stock de variante default si existe
      price: defaultVariant?.price_list || data.price,
      discounted_price: defaultVariant?.price_sale || data.discounted_price,
      stock: defaultVariant?.stock || data.stock,
      // Defaults para campos opcionales
      cost_price: data.cost_price ?? null,
      compare_price: data.compare_price ?? data.discounted_price ?? null,
      track_inventory: data.track_inventory ?? true,
      allow_backorder: data.allow_backorder ?? false,
    }
    
    console.log('🔥🔥🔥 Retornando producto:', data.name, 'status:', transformedData.status, 'image_url:', transformedData.image_url)
    return NextResponse.json({
      data: transformedData,
      product: transformedData,
      success: true,
    })
  } catch (err) {
    console.error('🔥🔥🔥 Error en GET:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export const PUT = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_update']),
  withValidation(UpdateProductSchema)
)(putHandler)

export const DELETE = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_delete'])
)(deleteHandler)
