// Configuración para Node.js Runtime
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { checkCRUDPermissions, logAdminAction, getRequestInfo } from '@/lib/auth/admin-auth'
import { requireAdminAuth } from '@/lib/auth/enterprise-auth-utils'
import { withCriticalValidation } from '@/lib/validation/enterprise-validation-middleware'
import { supabaseAdmin } from '@/lib/integrations/supabase'
import {
  EnterpriseProductSchema,
  EnterpriseProductFiltersSchema,
  EnterprisePaginationSchema,
} from '@/lib/validation/enterprise-schemas'
import { ProductFiltersSchema } from '@/lib/validation/admin-schemas'
import type { ValidatedRequest } from '@/lib/validation/enterprise-validation-middleware'
import { logger } from '@/lib/utils/logger'

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

    const { user } = authResult
    const { searchParams } = new URL(request.url)

    // Parse query parameters - let schema handle type conversion
    const statusParam = searchParams.get('status')

    const rawParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || searchParams.get('pageSize') || '20',
      search: searchParams.get('search') || undefined,
      category_id: searchParams.get('category') || searchParams.get('category_id') || undefined,
      brand: searchParams.get('brand') || undefined, // ✅ NUEVO: Filtro de marca
      is_active: statusParam ? statusParam === 'active' : undefined,
      price_min: searchParams.get('priceMin') || undefined,
      price_max: searchParams.get('priceMax') || undefined,
      sort_by: searchParams.get('sortBy') || searchParams.get('sort_by') || 'created_at',
      sort_order: (searchParams.get('sortOrder') || searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
    }

    const filters = ProductFiltersSchema.parse(rawParams)

    // ✅ DIAGNÓSTICO: Log de filtros recibidos
    console.log('🔍 [API /admin/products] Filtros recibidos:', {
      page: filters.page,
      limit: filters.limit,
      stock_status: searchParams.get('stock_status'),
      rawParams,
    })

    // Build query con supabaseAdmin
    let query = supabaseAdmin.from('products').select(
      `
        id,
        name,
        slug,
        description,
        price,
        discounted_price,
        stock,
        category_id,
        images,
        color,
        medida,
        brand,
        aikon_id,
        is_active,
        created_at,
        updated_at,
        category:categories (
          id,
          name
        ),
        product_categories (
          category:categories (
            id,
            name,
            slug
          )
        )
      `,
      { count: 'exact' }
    )

    // ✅ BÚSQUEDA MULTI-CAMPO MEJORADA
    // Busca en: nombre, descripción, marca, SKU (aikon_id)
    if (filters.search) {
      const searchTerm = filters.search.trim()
      query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,brand.ilike.%${searchTerm}%,aikon_id.ilike.%${searchTerm}%`)
      console.log('🔍 [API] Búsqueda multi-campo aplicada:', searchTerm)
    }
    
    // ✅ ACTUALIZADO: Filtrar usando product_categories para soportar múltiples categorías
    if (filters.category_id) {
      const { data: productIdsData } = await supabaseAdmin
        .from('product_categories')
        .select('product_id')
        .eq('category_id', filters.category_id)
      
      if (productIdsData && productIdsData.length > 0) {
        const productIds = productIdsData.map(pc => pc.product_id)
        query = query.in('id', productIds)
      } else {
        // Si no hay productos con esta categoría, retornar vacío
        query = query.eq('id', -1)
      }
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
    
    // ✅ NUEVO: Filtro de marca
    const brandFilter = searchParams.get('brand')
    if (brandFilter && brandFilter.trim()) {
      query = query.ilike('brand', `%${brandFilter.trim()}%`)
      console.log('🔍 [API] Filtro de marca aplicado:', brandFilter)
    }
    
    // ✅ NUEVO: Filtro de stock status
    const stockStatus = searchParams.get('stock_status')
    console.log('🔍 [API] stock_status recibido:', stockStatus)
    
    if (stockStatus === 'low_stock') {
      query = query.gt('stock', 0).lte('stock', 10)
      console.log('🔍 [API] Filtro LOW_STOCK aplicado: stock > 0 AND stock <= 10')
    } else if (stockStatus === 'out_of_stock') {
      query = query.or('stock.eq.0,stock.is.null')
      console.log('🔍 [API] Filtro OUT_OF_STOCK aplicado: stock = 0 OR stock IS NULL')
    } else {
      console.log('🔍 [API] Sin filtro de stock (mostrando todos)')
    }
    // Si es 'all' o no se especifica, no aplicar filtro de stock

    // Apply pagination BEFORE sorting (más eficiente)
    const from = (filters.page - 1) * filters.limit
    const to = from + filters.limit - 1
    
    console.log('🔥 [API] Aplicando .range():', {
      page: filters.page,
      limit: filters.limit,
      from,
      to,
      calculation: `(${filters.page} - 1) * ${filters.limit} = ${from}, hasta ${to}`,
    })
    
    query = query.range(from, to)

    // Apply sorting AFTER range
    query = query.order(filters.sort_by, { ascending: filters.sort_order === 'asc' })

    const { data: products, error, count } = await query
    
    if (error) {
      console.error('🔥 [API] Error en query:', error)
      return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
    }
    
    console.log('🔥 [API] Productos retornados con .range():', {
      cantidad: products?.length,
      totalCount: count,
      IDs: products?.map(p => p.id) || [],
      primeros3: products?.slice(0, 3).map(p => `${p.id}:${p.name?.substring(0, 15)}`) || [],
      ultimos3: products?.slice(-3).map(p => `${p.id}:${p.name?.substring(0, 15)}`) || [],
    })

    // Transform data to include category name and all fields
    const transformedProducts =
      products?.map(product => ({
        ...product,
        category_name: product.category?.name || null,
        category: undefined, // Remove nested object
        // Transform images JSONB to image_url
        image_url: 
          product.images?.previews?.[0] || 
          product.images?.thumbnails?.[0] ||
          product.images?.main ||
          null,
        // Derive status from is_active (status column doesn't exist in DB)
        status: product.is_active ? 'active' : 'inactive',
      })) || []

    const total = count || 0
    const totalPages = Math.ceil(total / filters.limit)

    return NextResponse.json({
      products: transformedProducts,
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
        category:categories (
          id,
          name
        ),
        product_categories (
          category:categories (
            id,
            name,
            slug
          )
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
      category_name: product.category?.name || null,
      category: undefined,
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
    // Usar supabaseAdmin directamente ya que checkCRUDPermissions no retorna supabase
    const supabase = supabaseAdmin

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
      price: parseFloat(body.price),
      discounted_price: body.compare_price ? parseFloat(body.compare_price) : null,
      stock: parseInt(body.stock) || 0,
      category_id: body.category_id ? parseInt(body.category_id) : null,
      is_active: body.status === 'active' || true,
      brand: body.brand || '',
      color: body.color || '',
      medida: body.medida || '',
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
        is_active,
        brand,
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

// Export GET handler - Versión simplificada con paginación funcionando
export const GET = async (request: NextRequest) => {
  try {
    logger.api('GET', '/api/admin/products')

    // Auth check simple
    const authResult = await checkAdminPermissionsForProducts('read')
    if (!authResult.allowed) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'
    const stockStatus = searchParams.get('stock_status')
    const search = searchParams.get('search')

    logger.dev('[API] Parámetros:', { page, limit, sortBy, sortOrder, stockStatus, search })

    // Validar supabaseAdmin
    if (!supabaseAdmin) {
      logger.error('[API] supabaseAdmin is not initialized')
      return NextResponse.json({ error: 'Error de configuración del servidor' }, { status: 500 })
    }

    // Build query
    let query = supabaseAdmin.from('products').select(
      `
        id,
        name,
        slug,
        description,
        price,
        discounted_price,
        stock,
        category_id,
        images,
        color,
        medida,
        brand,
        aikon_id,
        is_active,
        created_at,
        updated_at,
        category:categories (
          id,
          name
        ),
        product_categories (
          category:categories (
            id,
            name,
            slug
          )
        )
      `,
      { count: 'exact' }
    )

    // Apply filters
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    
    // Stock status filter
    if (stockStatus === 'low_stock') {
      query = query.gt('stock', 0).lte('stock', 10)
      logger.dev('[API] Filtro LOW_STOCK aplicado')
    } else if (stockStatus === 'out_of_stock') {
      query = query.or('stock.eq.0,stock.is.null')
      logger.dev('[API] Filtro OUT_OF_STOCK aplicado')
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    
    logger.db('range', 'products', { from, to, page, limit })
    
    query = query.range(from, to)

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    const { data: products, error, count } = await query
    
    logger.dev('[API] Resultado:', {
      productsLength: products?.length,
      count,
      primeros5IDs: products?.slice(0, 5).map(p => p.id) || [],
    })

    if (error) {
      logger.error('[API] Database error:', error)
      return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
    }

    // Obtener conteo de variantes para cada producto
    const productIds = products?.map(p => p.id) || []
    let variantCounts: Record<number, number> = {}
    
    if (productIds.length > 0) {
      const { data: variantCountData } = await supabaseAdmin
        .from('product_variants')
        .select('product_id')
        .in('product_id', productIds)
        .eq('is_active', true)
      
      variantCountData?.forEach(v => {
        variantCounts[v.product_id] = (variantCounts[v.product_id] || 0) + 1
      })
    }
    
    // Transform data - COMPLETO
    const transformedProducts = products?.map(product => ({
      ...product,
      category_name: product.category?.name || null,
      category: undefined,
      // Agregar conteo de variantes
      variant_count: variantCounts[product.id] || 0,
      // Transform images JSONB to image_url
      image_url: 
        product.images?.previews?.[0] || 
        product.images?.thumbnails?.[0] ||
        product.images?.main ||
        null,
      // Default status si es null
      status: product.status || (product.is_active ? 'active' : 'inactive'),
    })) || []

    return NextResponse.json({
      products: transformedProducts,
      data: transformedProducts,
      total: count || 0,
      page,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    logger.error('[API] Error en GET /api/admin/products:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// USAR VERSIÓN SIMPLIFICADA TEMPORALMENTE
export const POST = postHandlerSimple
