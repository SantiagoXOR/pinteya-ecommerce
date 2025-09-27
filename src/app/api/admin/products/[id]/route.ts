import { NextRequest, NextResponse } from 'next/server'
import { checkCRUDPermissions, logAdminAction, getRequestInfo } from '@/lib/auth/admin-auth'
import { Database } from '@/types/database'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Enterprise middleware imports
import { withErrorHandler } from '@/lib/api/error-handler'
import { withApiLogging } from '@/lib/api/api-logger'
import { withAdminAuth } from '@/lib/auth/api-auth-middleware'
import { withValidation } from '@/lib/validation/admin-schemas'
import { composeMiddlewares } from '@/lib/api/middleware-composer'

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
  status: z.enum(['active', 'inactive', 'draft']).optional(),
})

const ProductParamsSchema = z.object({
  id: z.string().uuid('ID de producto inválido'),
})

// Enterprise imports for error handling
import { ApiError, NotFoundError, ValidationError } from '@/lib/api/error-handler'

// Helper function to get product by ID with enhanced error handling
async function getProductById(
  supabase: ReturnType<typeof createClient<Database>>,
  productId: string
) {
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
      status,
      created_at,
      updated_at,
      categories (
        id,
        name
      )
    `
    )
    .eq('id', productId)
    .single()

  if (error) {
    throw new NotFoundError('Producto')
  }

  // Transform response with enhanced data
  const transformedProduct = {
    ...product,
    category_name: product.categories?.name || null,
    categories: undefined,
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
 * GET /api/admin/products/[id] - Enterprise Handler
 * Obtener producto específico por ID con middleware enterprise
 */
const getHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
  const { supabase } = request as any
  const productId = params.id

  // Validar parámetros
  const paramsValidation = ProductParamsSchema.safeParse({ id: productId })
  if (!paramsValidation.success) {
    throw new ValidationError('ID de producto inválido', paramsValidation.error.errors)
  }

  const product = await getProductById(supabase, productId)

  return NextResponse.json({
    data: product,
    success: true,
    message: 'Producto obtenido exitosamente',
  })
}

/**
 * PUT /api/admin/products/[id] - Enterprise Handler
 * Actualizar producto específico con middleware enterprise
 */
const putHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
  const { supabase, user, validatedData } = request as any
  const productId = params.id

  // Validar parámetros
  const paramsValidation = ProductParamsSchema.safeParse({ id: productId })
  if (!paramsValidation.success) {
    throw new ValidationError('ID de producto inválido', paramsValidation.error.errors)
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
      throw new ValidationError('Categoría no encontrada')
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
      status,
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
const deleteHandler = async (request: NextRequest, { params }: { params: { id: string } }) => {
  const { supabase, user } = request as any
  const productId = params.id

  // Validar parámetros
  const paramsValidation = ProductParamsSchema.safeParse({ id: productId })
  if (!paramsValidation.success) {
    throw new ValidationError('ID de producto inválido', paramsValidation.error.errors)
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
        status: 'inactive',
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

// Aplicar middlewares enterprise y exportar handlers
export const GET = composeMiddlewares(
  withErrorHandler,
  withApiLogging,
  withAdminAuth(['products_read'])
)(getHandler)

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
