// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkCRUDPermissions, logAdminAction, getRequestInfo } from '@/lib/auth/admin-auth'
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils'
import { withCriticalValidation } from '@/lib/validation/enterprise-validation-middleware'
import {
  EnterpriseProductSchema,
  EnterpriseProductFiltersSchema,
  EnterprisePaginationSchema,
} from '@/lib/validation/enterprise-schemas'
import { ProductFiltersSchema } from '@/lib/validation/admin-schemas'
import type { ValidatedRequest } from '@/lib/validation/enterprise-validation-middleware'

// Helper function to check admin permissions with proper role verification
async function checkAdminPermissionsForProducts(
  action: 'create' | 'read' | 'update' | 'delete',
  request?: NextRequest
) {
  return await checkCRUDPermissions(action, 'products')
}

/**
 * GET /api/admin/products
 * Obtener lista paginada de productos con filtros (ENTERPRISE)
 */
const getHandler = async (request: ValidatedRequest) => {
  try {
    // ENTERPRISE: Verificar autenticación con contexto completo
    const authResult = await requireAdminAuth(request, ['admin_access', 'products_read'])

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
          enterprise: true,
        },
        { status: authResult.status || 401 }
      )
    }

    const context = authResult.context!

    // LEGACY: Mantener compatibilidad con sistema anterior
    const legacyAuthResult = await checkAdminPermissionsForProducts('read', request)
    if (!legacyAuthResult.success) {
      return NextResponse.json(
        { error: legacyAuthResult.error },
        { status: legacyAuthResult.status }
      )
    }

    const { supabase, user } = authResult
    const { searchParams } = new URL(request.url)

    // Parse query parameters - let schema handle type conversion
    const statusParam = searchParams.get('status')

    const rawParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || searchParams.get('pageSize') || '20',
      search: searchParams.get('search') || undefined,
      category_id: searchParams.get('category') || undefined,
      is_active: statusParam ? statusParam === 'active' : undefined,
      price_min: searchParams.get('priceMin') || undefined,
      price_max: searchParams.get('priceMax') || undefined,
      sort_by: searchParams.get('sortBy') || 'created_at',
      sort_order: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    }

    const filters = ProductFiltersSchema.parse(rawParams)

    // Build query
    let query = supabase.from('products').select(
      `
        id,
        name,
        description,
        price,
        stock,
        category_id,
        images,
        color,
        medida,
        created_at,
        updated_at,
        categories (
          id,
          name
        )
      `,
      { count: 'exact' }
    )

    // Apply filters
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters.price_min !== undefined) {
      query = query.gte('price', filters.price_min)
    }
    if (filters.price_max !== undefined) {
      query = query.lte('price', filters.price_max)
    }

    // Apply sorting
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    // Apply pagination
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    query = query.range(from, to)

    const { data: products, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
    }

    // Transform data to include category name
    const transformedProducts =
      products?.map(product => ({
        ...product,
        category_name: product.categories?.name || null,
        categories: undefined, // Remove nested object
      })) || []

    const total = count || 0
    const totalPages = Math.ceil(total / filters.limit)

    return NextResponse.json({
      data: transformedProducts,
      total,
      page: filters.page,
      pageSize: filters.limit,
      totalPages,
      filters,
      sort: {
        by: filters.sort_by,
        order: filters.sort_order,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/products:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

/**
 * POST /api/admin/products
 * Crear nuevo producto (ENTERPRISE)
 */
const postHandler = async (request: ValidatedRequest) => {
  try {
    // ENTERPRISE: Verificar autenticación con contexto completo
    const authResult = await requireAdminAuth(request, ['admin_access', 'products_create'])

    if (!authResult.success) {
      return NextResponse.json(
        {
          error: authResult.error,
          code: authResult.code,
          enterprise: true,
        },
        { status: authResult.status || 401 }
      )
    }

    const context = authResult.context!

    // LEGACY: Mantener compatibilidad con sistema anterior
    const legacyAuthResult = await checkAdminPermissionsForProducts('create')
    if (!legacyAuthResult.success) {
      return NextResponse.json(
        { error: legacyAuthResult.error },
        { status: legacyAuthResult.status }
      )
    }

    const { supabase, user } = legacyAuthResult

    // ENTERPRISE: Usar datos ya validados por middleware
    const productData = request.validatedBody

    if (!productData) {
      return NextResponse.json(
        {
          error: 'Datos de validación no encontrados',
          code: 'VALIDATION_DATA_MISSING',
          enterprise: true,
        },
        { status: 400 }
      )
    }

    // Verify category exists
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', productData.category_id)
      .single()

    if (categoryError || !category) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 400 })
    }

    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...productData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(
        `
        id,
        name,
        description,
        price,
        stock,
        category_id,
        images,
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
      console.error('Error creating product:', error)
      return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
    }

    // Transform response
    const transformedProduct = {
      ...product,
      category_name: product.categories?.name || null,
      categories: undefined,
    }

    // Log admin action
    await logAdminAction(user.id, 'CREATE', 'product', product.id, null, transformedProduct)

    return NextResponse.json(
      {
        message: 'Producto creado exitosamente',
        data: transformedProduct,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/admin/products:', error)

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        enterprise: true,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

/**
 * POST SIMPLIFICADO /api/admin/products
 * Crear nuevo producto SIN validaciones enterprise complejas
 */
const postHandlerSimple = async (request: NextRequest) => {
  try {
    console.log('🔧 Products API: Creating product (SIMPLE MODE)...')

    // Verificar autenticación básica
    const authResult = await checkCRUDPermissions('create', 'products')

    if (!authResult.allowed) {
      console.log('❌ Auth failed:', authResult.error)
      return NextResponse.json(
        {
          error: authResult.error || 'Autenticación requerida',
          code: 'AUTH_ERROR',
        },
        { status: 401 }
      )
    }

    console.log('✅ Auth successful')
    const { supabase, user } = authResult

    const body = await request.json()
    console.log('📝 Request body:', JSON.stringify(body, null, 2))

    // Validación básica de campos requeridos
    const requiredFields = ['name', 'price']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            error: `Campo requerido: ${field}`,
            code: 'MISSING_FIELD',
          },
          { status: 400 }
        )
      }
    }

    // Mapear datos del frontend al formato de base de datos
    const productData = {
      name: body.name,
      description: body.description || '',
      short_description: body.short_description || '',
      price: parseFloat(body.price),
      discounted_price: body.compare_price ? parseFloat(body.compare_price) : null,
      cost_price: body.cost_price ? parseFloat(body.cost_price) : null,
      stock: parseInt(body.stock) || 0,
      low_stock_threshold: parseInt(body.low_stock_threshold) || 5,
      category_id: body.category_id ? parseInt(body.category_id) : null,
      status: body.status || 'draft',
      is_active: body.status === 'active',
      track_inventory: body.track_inventory !== false,
      allow_backorders: body.allow_backorders === true,
      // Generar slug automático
      slug:
        body.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim() +
        '-' +
        Date.now(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    console.log('🔄 Mapped product data:', JSON.stringify(productData, null, 2))

    // Verificar categoría si se proporciona
    if (productData.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', productData.category_id)
        .single()

      if (categoryError || !category) {
        console.log('❌ Category not found:', categoryError)
        return NextResponse.json(
          {
            error: 'Categoría no encontrada',
            code: 'CATEGORY_NOT_FOUND',
          },
          { status: 400 }
        )
      }
    }

    // Crear producto
    const { data: product, error } = await supabase
      .from('products')
      .insert(productData)
      .select(
        `
        id,
        name,
        description,
        price,
        stock,
        category_id,
        status,
        created_at,
        updated_at
      `
      )
      .single()

    if (error) {
      console.error('❌ Error creating product:', error)
      return NextResponse.json(
        {
          error: 'Error al crear producto',
          code: 'DATABASE_ERROR',
          details: error.message,
        },
        { status: 500 }
      )
    }

    console.log('✅ Product created successfully:', product)

    return NextResponse.json(
      {
        success: true,
        message: 'Producto creado exitosamente',
        data: product,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('❌ Error in POST /api/admin/products (SIMPLE):', error)

    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// USAR VERSIÓN SIMPLIFICADA TEMPORALMENTE PARA DEBUG
export const GET = async (request: NextRequest) => {
  try {
    console.log('🔍 GET /api/admin/products - Starting request')

    // Simple auth check
    const authResult = await checkAdminPermissionsForProducts('read')
    if (!authResult.allowed) {
      console.log('❌ Auth failed:', authResult.error)
      return NextResponse.json({ error: authResult.error || 'Acceso denegado' }, { status: 403 })
    }

    // Get supabase instance
    const { supabaseAdmin } = await import('@/lib/supabase')
    const supabase = supabaseAdmin
    console.log('✅ Auth successful, querying products...')

    // Simple query without complex filters
    const {
      data: products,
      error,
      count,
    } = await supabase
      .from('products')
      .select(
        `
        *,
        categories!inner(name)
      `,
        { count: 'exact' }
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json(
        { error: 'Error al obtener productos', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Products fetched:', products?.length || 0, 'total:', count)

    // Transform data
    const transformedProducts =
      products?.map(product => ({
        ...product,
        category_name: product.categories?.name || null,
        categories: undefined,
      })) || []

    return NextResponse.json({
      data: transformedProducts,
      total: count || 0,
      page: 1,
      pageSize: 20,
      totalPages: Math.ceil((count || 0) / 20),
    })
  } catch (error) {
    console.error('❌ Error in GET /api/admin/products:', error)
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// USAR VERSIÓN SIMPLIFICADA TEMPORALMENTE
export const POST = postHandlerSimple
