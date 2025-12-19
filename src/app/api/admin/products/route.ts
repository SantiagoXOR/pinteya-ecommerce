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

// =====================================================
// HELPERS
// =====================================================

function extractImageUrl(images: any): string | null {
  const normalize = (value?: string | null) => {
    if (!value || typeof value !== 'string') return null
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  if (!images) {
    return null
  }

  if (typeof images === 'string') {
    const trimmed = images.trim()
    if (!trimmed) return null

    // Intentar parsear JSON si corresponde
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return extractImageUrl(JSON.parse(trimmed))
      } catch {
        return normalize(trimmed)
      }
    }

    return normalize(trimmed)
  }

  if (Array.isArray(images)) {
    return normalize(images[0])
  }

  if (typeof images === 'object') {
    return (
      normalize(images.preview) ||
      normalize(images.previews?.[0]) ||
      normalize(images.thumbnails?.[0]) ||
      normalize(images.gallery?.[0]) ||
      normalize(images.main) ||
      normalize(images.url)
    )
  }

  return null
}

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

    // ✅ NUEVO: Obtener TODAS las medidas y colores únicos de variantes, y solo el código aikon de la variante predeterminada
    const productIds = products?.map(p => p.id) || []
    const variantMeasures: Record<number, string[]> = {} // ✅ Array de medidas
    const variantColors: Record<number, string[]> = {} // ✅ Array de colores
    const variantAikonIds: Record<number, string | null> = {} // ✅ CAMBIADO: Solo el código aikon de la variante predeterminada
    
    if (productIds.length > 0) {
      const { data: variantData, error: variantError } = await supabaseAdmin
        .from('product_variants')
        .select('product_id,is_default,measure,color_name,aikon_id')
        .in('product_id', productIds)
        .eq('is_active', true)
      
      variantData?.forEach(variant => {
        // Obtener TODAS las medidas únicas de las variantes
        if (variant.measure && variant.measure.trim() !== '') {
          if (!variantMeasures[variant.product_id]) {
            variantMeasures[variant.product_id] = []
          }
          if (!variantMeasures[variant.product_id].includes(variant.measure)) {
            variantMeasures[variant.product_id].push(variant.measure)
          }
        }
        
        // ✅ Obtener TODOS los colores únicos de las variantes
        if (variant.color_name && variant.color_name.trim() !== '') {
          if (!variantColors[variant.product_id]) {
            variantColors[variant.product_id] = []
          }
          if (!variantColors[variant.product_id].includes(variant.color_name)) {
            variantColors[variant.product_id].push(variant.color_name)
          }
        }
        
        // ✅ CAMBIADO: Obtener SOLO el código aikon de la variante predeterminada
        if (variant.is_default && variant.aikon_id && variant.aikon_id.trim() !== '') {
          variantAikonIds[variant.product_id] = variant.aikon_id
        }
      })
    }

    // Transform data to include category name and all fields
    const transformedProducts =
      products?.map(product => {
        const resolvedImage = extractImageUrl(product.images)
        
        // Transform product_categories to categories array
        const categories = product.product_categories
          ?.map((pc: any) => pc.category)
          .filter((cat: any) => cat != null) || []
        
        // ✅ NUEVO: Combinar medida del producto con todas las medidas de variantes
        const productMedida = product.medida ? [product.medida] : []
        const variantMeasuresList = variantMeasures[product.id] || []
        const allMeasures = Array.from(new Set([...productMedida, ...variantMeasuresList]))
        
        // ✅ NUEVO: Combinar color del producto con todos los colores de variantes
        const productColor = product.color ? [product.color] : []
        const variantColorsList = variantColors[product.id] || []
        const allColors = Array.from(new Set([...productColor, ...variantColorsList]))
        
        // ✅ CAMBIADO: Usar el código aikon del producto o el de la variante predeterminada
        const defaultAikonId = variantAikonIds[product.id] || product.aikon_id || null

        return {
          ...product,
          category_name: product.category?.name || categories[0]?.name || null,
          category: undefined, // Remove nested object
          product_categories: undefined, // Remove nested object
          // Transform product_categories to categories array
          categories: categories,
          // Transform images JSONB/legacy formats to image_url
          image_url: resolvedImage,
          // Derive status from is_active (status column doesn't exist in DB)
          status: product.is_active ? 'active' : 'inactive',
          // ✅ NUEVO: Array de todas las medidas (producto + variantes)
          medida: allMeasures.length > 0 ? allMeasures[0] : null, // Mantener compatibilidad con campo string
          medidas: allMeasures, // ✅ NUEVO: Array de todas las medidas
          // ✅ NUEVO: Array de todos los colores (producto + variantes)
          color: allColors.length > 0 ? allColors[0] : null, // Mantener compatibilidad con campo string
          colores: allColors, // ✅ NUEVO: Array de todos los colores
          // ✅ CAMBIADO: Solo el código aikon de la variante predeterminada
          aikon_id: defaultAikonId,
        }
      }) || []

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

    // Normalizar category_ids: soportar tanto category_id como category_ids para retrocompatibilidad
    let categoryIds: number[] = []
    if ((productData as any).category_ids && Array.isArray((productData as any).category_ids)) {
      categoryIds = (productData as any).category_ids.map((id: any) => parseInt(String(id))).filter((id: number) => !isNaN(id))
    } else if ((productData as any).category_id) {
      categoryIds = [parseInt(String((productData as any).category_id))].filter((id: number) => !isNaN(id))
    }

    // Validar categorías si se proporcionan
    if (categoryIds.length > 0) {
      const { data: categories, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .in('id', categoryIds)

      if (categoryError) {
        return NextResponse.json(
          {
            error: 'Error al validar categorías',
            code: 'CATEGORY_VALIDATION_ERROR',
            enterprise: true,
          },
          { status: 400 }
        )
      }

      if (!categories || categories.length !== categoryIds.length) {
        return NextResponse.json(
          {
            error: 'Una o más categorías no fueron encontradas',
            code: 'CATEGORY_NOT_FOUND',
            enterprise: true,
          },
          { status: 400 }
        )
      }
    }

    // Mantener category_id para retrocompatibilidad (usar primera categoría)
    const productDataWithCategory = {
      ...productData,
      category_id: categoryIds.length > 0 ? categoryIds[0] : (productData as any).category_id || null,
    }

    // Create product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        ...productDataWithCategory,
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

    // Insertar relaciones en product_categories si hay categorías
    if (categoryIds.length > 0 && product?.id) {
      const categoryInserts = categoryIds.map(catId => ({
        product_id: product.id,
        category_id: catId,
      }))

      const { error: categoryRelationError } = await supabase
        .from('product_categories')
        .insert(categoryInserts)

      if (categoryRelationError) {
        console.error('Error creating product_categories relations:', categoryRelationError)
        // No fallar la creación del producto si falla la relación de categorías
        // pero loguear el error
      } else {
        console.log(`✅ Created ${categoryIds.length} product category relation(s)`)
      }
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

    // Normalizar category_ids: soportar tanto category_id como category_ids para retrocompatibilidad
    let categoryIds: number[] = []
    if (body.category_ids && Array.isArray(body.category_ids)) {
      categoryIds = body.category_ids.map(id => parseInt(String(id))).filter(id => !isNaN(id))
    } else if (body.category_id) {
      categoryIds = [parseInt(String(body.category_id))].filter(id => !isNaN(id))
    }

    // Validar categorías si se proporcionan
    if (categoryIds.length > 0) {
      const { data: categories, error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .in('id', categoryIds)

      if (categoryError) {
        console.log('❌ Error fetching categories:', categoryError)
        return NextResponse.json(
          {
            error: 'Error al validar categorías',
            code: 'CATEGORY_VALIDATION_ERROR',
          },
          { status: 400 }
        )
      }

      if (!categories || categories.length !== categoryIds.length) {
        console.log('❌ Some categories not found')
        return NextResponse.json(
          {
            error: 'Una o más categorías no fueron encontradas',
            code: 'CATEGORY_NOT_FOUND',
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
      category_id: categoryIds.length > 0 ? categoryIds[0] : null, // Mantener category_id para retrocompatibilidad
      is_active: body.status === 'active' ? true : (body.status === 'inactive' ? false : true), // Si no se especifica status, por defecto es activo
      brand: body.brand || '',
      color: body.color || '',
      medida: body.medida || '',
      // NO incluir terminaciones - esa columna no existe en la tabla products
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

    // Insertar relaciones en product_categories si hay categorías
    if (categoryIds.length > 0 && product?.id) {
      const categoryInserts = categoryIds.map(catId => ({
        product_id: product.id,
        category_id: catId,
      }))

      const { error: categoryRelationError } = await supabase
        .from('product_categories')
        .insert(categoryInserts)

      if (categoryRelationError) {
        console.error('❌ Error creating product_categories relations:', categoryRelationError)
        // No fallar la creación del producto si falla la relación de categorías
        // pero loguear el error
      } else {
        console.log(`✅ Created ${categoryIds.length} product category relation(s)`)
      }
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

    // Apply sorting - IMPORTANTE: Asegurar que el ordenamiento se aplique correctamente
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:GET-before-execute-query',message:'Antes de ejecutar query',data:{page,limit,sortBy,sortOrder,from,to},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    const { data: products, error, count } = await query
    
    // ✅ DIAGNÓSTICO: Verificar si el producto #294 está en los resultados
    const tieneProducto294 = products?.some(p => p.id === 294) || false
    const primeros5IDs = products?.slice(0, 5).map(p => p.id) || []
    console.log('🔍 [API GET /admin/products] Productos devueltos:', {
      total: products?.length,
      count,
      primeros5IDs,
      tieneProducto294,
      todosLosIDs: products?.map(p => p.id) || [],
    })
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:GET-after-execute-query',message:'Después de ejecutar query',data:{productsLength:products?.length,count,error:error?.message,primeros3IDs:products?.slice(0,3).map(p=>p.id)||[],tieneProducto294,tieneProducto257:products?.some(p=>p.id===257)||false,tieneProducto258:products?.some(p=>p.id===258)||false},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    
    logger.dev('[API] Resultado:', {
      productsLength: products?.length,
      count,
      primeros5IDs: products?.slice(0, 5).map(p => p.id) || [],
      todosLosIDs: products?.map(p => p.id) || [],
      tieneProducto256: products?.some(p => p.id === 256) || false,
      tieneProducto257: products?.some(p => p.id === 257) || false,
      tieneProducto258: products?.some(p => p.id === 258) || false,
    })
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/b2bb30a6-4e88-4195-96cd-35106ab29a7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:GET-after-query',message:'Query ejecutada',data:{productsLength:products?.length,count,page,limit,from,to,sortBy,sortOrder,primeros5IDs:products?.slice(0,5).map(p=>p.id)||[],tieneProducto256:products?.some(p=>p.id===256)||false,tieneProducto257:products?.some(p=>p.id===257)||false,tieneProducto258:products?.some(p=>p.id===258)||false,error:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    if (error) {
      logger.error('[API] Database error:', error)
      return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
    }

    const productIds = products?.map(p => p.id) || []
    const variantCounts: Record<number, number> = {}
    const variantImages: Record<number, string | null> = {}
    const variantMeasures: Record<number, string[]> = {} // ✅ Array de medidas
    const variantColors: Record<number, string[]> = {} // ✅ Array de colores
    const variantAikonIds: Record<number, string | null> = {} // ✅ CAMBIADO: Solo el código aikon de la variante predeterminada
    
    if (productIds.length > 0) {
      const { data: variantData, error: variantError } = await supabaseAdmin
        .from('product_variants')
        .select('product_id,image_url,is_default,measure,color_name,aikon_id') // ✅ AGREGADO: color_name, aikon_id
        .in('product_id', productIds)
        .eq('is_active', true)
      
      variantData?.forEach(variant => {
        const normalizedImage = extractImageUrl(variant.image_url)
        variantCounts[variant.product_id] = (variantCounts[variant.product_id] || 0) + 1

        if (!variantImages[variant.product_id] && normalizedImage) {
          variantImages[variant.product_id] = normalizedImage
        }

        if (variant.is_default && normalizedImage) {
          variantImages[variant.product_id] = normalizedImage
        }
        
        // ✅ Obtener TODAS las medidas únicas de las variantes
        if (variant.measure && variant.measure.trim() !== '') {
          if (!variantMeasures[variant.product_id]) {
            variantMeasures[variant.product_id] = []
          }
          if (!variantMeasures[variant.product_id].includes(variant.measure)) {
            variantMeasures[variant.product_id].push(variant.measure)
          }
        }
        
        // ✅ Obtener TODOS los colores únicos de las variantes
        if (variant.color_name && variant.color_name.trim() !== '') {
          if (!variantColors[variant.product_id]) {
            variantColors[variant.product_id] = []
          }
          if (!variantColors[variant.product_id].includes(variant.color_name)) {
            variantColors[variant.product_id].push(variant.color_name)
          }
        }
        
        // ✅ CAMBIADO: Obtener SOLO el código aikon de la variante predeterminada
        if (variant.is_default && variant.aikon_id && variant.aikon_id.trim() !== '') {
          variantAikonIds[variant.product_id] = variant.aikon_id
        }
      })
    }
    
    const transformedProducts =
      products?.map(product => {
        const variantImage = variantImages[product.id]
        const fallbackImage = extractImageUrl(product.images)
        
        // Transform product_categories to categories array
        const categories = product.product_categories
          ?.map((pc: any) => pc.category)
          .filter((cat: any) => cat != null) || []
        
        // ✅ NUEVO: Combinar medida del producto con todas las medidas de variantes
        const productMedida = product.medida ? [product.medida] : []
        const variantMeasuresList = variantMeasures[product.id] || []
        const allMeasures = Array.from(new Set([...productMedida, ...variantMeasuresList]))
        
        // ✅ NUEVO: Combinar color del producto con todos los colores de variantes
        const productColor = product.color ? [product.color] : []
        const variantColorsList = variantColors[product.id] || []
        const allColors = Array.from(new Set([...productColor, ...variantColorsList]))
        
        // ✅ CAMBIADO: Usar el código aikon del producto o el de la variante predeterminada
        const defaultAikonId = variantAikonIds[product.id] || product.aikon_id || null
        
        return {
          ...product,
          category_name: product.category?.name || categories[0]?.name || null,
          category: undefined,
          product_categories: undefined, // Remove nested object
          // Transform product_categories to categories array
          categories: categories,
          // Agregar conteo de variantes
          variant_count: variantCounts[product.id] || 0,
          // Imagen priorizando variantes
          image_url: variantImage || fallbackImage,
          // Default status si es null
          status: product.status || (product.is_active ? 'active' : 'inactive'),
          // ✅ NUEVO: Array de todas las medidas (producto + variantes)
          medida: allMeasures.length > 0 ? allMeasures[0] : null, // Mantener compatibilidad con campo string
          medidas: allMeasures, // ✅ NUEVO: Array de todas las medidas
          // ✅ NUEVO: Array de todos los colores (producto + variantes)
          color: allColors.length > 0 ? allColors[0] : null, // Mantener compatibilidad con campo string
          colores: allColors, // ✅ NUEVO: Array de todos los colores
          // ✅ CAMBIADO: Solo el código aikon de la variante predeterminada
          aikon_id: defaultAikonId,
        }
      }) || []

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
