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
import { normalizeProductTitle } from '@/lib/core/utils'
import {
  transformProducts,
  groupVariantsByProductId,
  type DatabaseProduct,
  type ProductVariant,
} from '@/lib/services/product-service'
import {
  getAllVariantAikonIds,
  getAllVariantAikonIdsFormatted,
  getProductAikonId,
  getProductAikonIdFormatted,
} from '@/lib/products/aikon-id-utils'

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

    // Intentar parsear JSON si corresponde (puede estar doblemente escapado)
    if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"')) {
      try {
        // Intentar parsear directamente
        const parsed = JSON.parse(trimmed)
        return extractImageUrl(parsed)
      } catch {
        try {
          // Si falla, intentar parsear como string escapado
          const unescaped = JSON.parse(`"${trimmed}"`)
          return extractImageUrl(unescaped)
      } catch {
        return normalize(trimmed)
        }
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
      normalize(images.url) || // ✅ NUEVO: Soporte para formato {url, is_primary}
      normalize((images as any).url) // ✅ NUEVO: Extra soporte para formato simple
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

    // Convertir status a is_active: 'active' -> true, 'inactive' -> false, 'all' o undefined -> undefined
    let isActiveValue: boolean | undefined = undefined
    if (statusParam === 'active') {
      isActiveValue = true
    } else if (statusParam === 'inactive') {
      isActiveValue = false
    }

    const rawParams = {
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || searchParams.get('pageSize') || '20',
      search: searchParams.get('search') || undefined,
      category_id: searchParams.get('category') || searchParams.get('category_id') || undefined,
      brand: searchParams.get('brand') || undefined, // ✅ NUEVO: Filtro de marca
      is_active: isActiveValue,
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
    const brandFilter = filters.brand || searchParams.get('brand')
    if (brandFilter && brandFilter.trim() !== '') {
      query = query.ilike('brand', `%${brandFilter.trim()}%`)
      console.log('🔍 [API] Filtro de marca aplicado:', brandFilter)
    }
    
    // ✅ NUEVO: Filtro de stock status (se aplicará DESPUÉS de calcular stock efectivo)
    // No aplicar filtro SQL aquí porque necesitamos considerar el stock de las variantes
    const stockStatus = searchParams.get('stock_status')
    console.log('🔍 [API] stock_status recibido:', stockStatus, '(se aplicará después de calcular stock efectivo)')

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

    // ✅ REFACTORIZADO: Obtener todas las medidas, colores y aikon_id de variantes
    const productIds = products?.map(p => p.id) || []
    const variantMeasures: Record<number, string[]> = {} // ✅ Array de medidas
    const variantColors: Record<number, string[]> = {} // ✅ Array de colores
    const variantAikonIdsByProduct: Record<number, number[]> = {} // ✅ NUEVO: Todos los aikon_id de variantes por producto
    const productImagesFromTable: Record<number, string | null> = {} // ✅ NUEVO: Imágenes desde product_images
    const variantTotalStocks: Record<number, number> = {} // ✅ NUEVO: Stock total de variantes por producto
    let variantData: ProductVariant[] = [] // ✅ NUEVO: Guardar variantData tipado
    
    if (productIds.length > 0) {
      // ✅ NUEVO: Obtener imágenes desde product_images (prioridad sobre campo images JSONB)
      const { data: productImagesData } = await supabaseAdmin
        .from('product_images')
        .select('product_id, url, is_primary')
        .in('product_id', productIds)
        .order('is_primary', { ascending: false })
        .order('display_order', { ascending: true })
      
      // Agrupar por product_id y tomar la primera (primaria o primera disponible)
      productImagesData?.forEach((img: any) => {
        if (!productImagesFromTable[img.product_id]) {
          productImagesFromTable[img.product_id] = img.url
        }
      })
      
      // ✅ OPTIMIZADO: Obtener solo campos necesarios de variantes para mejor performance
      const { data: variantDataResult, error: variantError } = await supabaseAdmin
        .from('product_variants')
        .select('id,product_id,is_default,measure,color_name,aikon_id,stock,is_active')
        .in('product_id', productIds)
        .eq('is_active', true)
        .order('product_id', { ascending: true })
        .order('is_default', { ascending: false })
      
      // ✅ REFACTORIZADO: Guardar variantData tipado
      variantData = (variantDataResult || []) as ProductVariant[]
      
      // ✅ REFACTORIZADO: Procesar variantes usando utilidades
      variantData.forEach(variant => {
        const productId = variant.product_id
        
        // Calcular stock total de variantes por producto
        const variantStockValue = Number(variant.stock) || 0
        if (!variantTotalStocks[productId]) {
          variantTotalStocks[productId] = 0
        }
        variantTotalStocks[productId] += variantStockValue
        
        // Obtener TODAS las medidas únicas de las variantes
        if (variant.measure && variant.measure.trim() !== '') {
          if (!variantMeasures[productId]) {
            variantMeasures[productId] = []
          }
          if (!variantMeasures[productId].includes(variant.measure)) {
            variantMeasures[productId].push(variant.measure)
          }
        }
        
        // Obtener TODOS los colores únicos de las variantes
        if (variant.color_name && variant.color_name.trim() !== '') {
          if (!variantColors[productId]) {
            variantColors[productId] = []
          }
          if (!variantColors[productId].includes(variant.color_name)) {
            variantColors[productId].push(variant.color_name)
          }
        }
        
        // ✅ NUEVO: Obtener TODOS los aikon_id de las variantes (no solo el predeterminado)
        if (variant.aikon_id !== null && variant.aikon_id !== undefined) {
          if (!variantAikonIdsByProduct[productId]) {
            variantAikonIdsByProduct[productId] = []
          }
          // Asegurar que sea número (puede venir como string desde la BD antes de la migración)
          const aikonIdNum = typeof variant.aikon_id === 'string' 
            ? parseInt(variant.aikon_id, 10) 
            : Number(variant.aikon_id)
          if (!isNaN(aikonIdNum) && aikonIdNum >= 0 && aikonIdNum <= 999999) {
            variantAikonIdsByProduct[productId].push(aikonIdNum)
          }
        }
      })
    }
    
    // ✅ REFACTORIZADO: Agrupar variantes por product_id para usar con el servicio
    const variantsByProductId = groupVariantsByProductId(variantData)

    // Transform data to include category name and all fields
    const transformedProducts =
      products?.map(product => {
        // ✅ NUEVO: Prioridad: product_images > images JSONB
        const primaryImageFromTable = productImagesFromTable[product.id]
        const resolvedImage = extractImageUrl(product.images)
        
        // Transform product_categories to categories array
        const categories = product.product_categories
          ?.map((pc: any) => pc.category)
          .filter((cat: any) => cat != null) || []
        
        // ✅ NUEVO: Combinar medida del producto con todas las medidas de variantes
        // ✅ CORREGIDO: Parsear medida si viene como string de array
        let parsedMedida: string[] = []
        if (product.medida) {
          if (typeof product.medida === 'string') {
            // Intentar parsear si es un string de array JSON
            if (product.medida.trim().startsWith('[') && product.medida.trim().endsWith(']')) {
              try {
                const parsed = JSON.parse(product.medida)
                parsedMedida = Array.isArray(parsed) ? parsed : [parsed]
              } catch {
                parsedMedida = [product.medida]
              }
            } else {
              parsedMedida = [product.medida]
            }
          } else if (Array.isArray(product.medida)) {
            parsedMedida = product.medida
          } else {
            parsedMedida = [String(product.medida)]
          }
        }
        const variantMeasuresList = variantMeasures[product.id] || []
        const allMeasures = Array.from(new Set([...parsedMedida, ...variantMeasuresList]))
        
        // ✅ NUEVO: Combinar color del producto con todos los colores de variantes
        const productColor = product.color ? [product.color] : []
        const variantColorsList = variantColors[product.id] || []
        const allColors = Array.from(new Set([...productColor, ...variantColorsList]))
        
        // ✅ REFACTORIZADO: Usar utilidades para obtener aikon_id
        const variants = variantsByProductIdForTransform[product.id] || []
        const aikonId = getProductAikonId(product as DatabaseProduct, variants)
        const aikonIdFormatted = getProductAikonIdFormatted(product as DatabaseProduct, variants)
        const variantAikonIds = variantAikonIdsByProduct[product.id] || []
        const variantAikonIdsFormatted = getAllVariantAikonIdsFormatted(variants)
        
        // ✅ NUEVO: Calcular stock efectivo (suma de variantes si hay, sino stock del producto)
        // ✅ CORREGIDO: Si hay variantes con stock, SIEMPRE usar la suma de stock de variantes
        const variantStock = variantTotalStocks[product.id] || 0
        // ✅ CORREGIDO: Verificar si hay variantes activas con stock
        const hasVariantsWithStock = hasActiveVariantsWithStock[product.id] || false
        
        // ✅ CORREGIDO: Si hay variantes con stock, SIEMPRE usar la suma (sin importar product.stock)
        // Si variantStock > 0, significa que hay variantes y se sumaron correctamente
        // ✅ MEJORADO: Asegurar que variantStock sea número
        const numericVariantStock = typeof variantStock === 'string' 
          ? parseInt(variantStock, 10) || 0 
          : Number(variantStock) || 0
        
        // ✅ CRÍTICO: Si hay variantes con stock, SIEMPRE usar la suma, incluso si product.stock > 0
        // Si hay variantes, usar la suma; si no hay variantes, usar el stock del producto
        const effectiveStock = numericVariantStock > 0
          ? numericVariantStock  // Suma de todas las variantes
          : (product.stock !== null && product.stock !== undefined ? Number(product.stock) || 0 : 0)

        return {
          ...product,
          // ✅ NUEVO: Normalizar título del producto a formato capitalizado
          name: normalizeProductTitle(product.name),
          // ✅ CRÍTICO: Stock efectivo (suma de variantes si hay, sino stock del producto)
          // IMPORTANTE: Debe ir después del spread para sobrescribir product.stock
          stock: effectiveStock,
          category_name: product.category?.name || categories[0]?.name || null,
          category: undefined, // Remove nested object
          product_categories: undefined, // Remove nested object
          // Transform product_categories to categories array
          categories: categories,
          // Transform images JSONB/legacy formats to image_url
          // ✅ CORREGIDO: Prioridad: product_images > images JSONB
          image_url: primaryImageFromTable || resolvedImage,
          // Derive status from is_active (status column doesn't exist in DB)
          status: product.is_active ? 'active' : 'inactive',
          // ✅ NUEVO: Array de todas las medidas (producto + variantes)
          medida: allMeasures.length > 0 ? allMeasures[0] : null, // Mantener compatibilidad con campo string
          medidas: allMeasures, // ✅ NUEVO: Array de todas las medidas
          // ✅ NUEVO: Array de todos los colores (producto + variantes)
          color: allColors.length > 0 ? allColors[0] : null, // Mantener compatibilidad con campo string
          colores: allColors, // ✅ NUEVO: Array de todos los colores
          // ✅ NUEVO: Terminaciones del producto (array de texto)
          terminaciones: product.terminaciones && Array.isArray(product.terminaciones) 
            ? product.terminaciones.filter((t: string) => t && t.trim() !== '')
            : [],
          // ✅ REFACTORIZADO: aikon_id como número y formateado, más arrays de variantes
          aikon_id: aikonId,
          aikon_id_formatted: aikonIdFormatted,
          variant_aikon_ids: variantAikonIds,
          variant_aikon_ids_formatted: variantAikonIdsFormatted,
          has_variants: variants.length > 0,
        }
      }) || []

    // ✅ NUEVO: Aplicar filtro de stock DESPUÉS de calcular el stock efectivo
    let filteredProducts = transformedProducts
    if (stockStatus === 'out_of_stock') {
      // ✅ CORREGIDO: Filtrar productos con stock efectivo <= 0 (incluye null/undefined)
      filteredProducts = transformedProducts.filter(p => (p.stock || 0) <= 0)
      console.log('🔍 [API] Filtro OUT_OF_STOCK aplicado post-transformación:', filteredProducts.length, 'productos')
    } else if (stockStatus === 'low_stock') {
      filteredProducts = transformedProducts.filter(p => p.stock > 0 && p.stock <= 10)
      console.log('🔍 [API] Filtro LOW_STOCK aplicado post-transformación:', filteredProducts.length, 'productos')
    }

    // ✅ CORREGIDO: Usar el total filtrado si hay filtro de stock
    const filteredTotal = stockStatus ? filteredProducts.length : (count || 0)
    const totalPages = Math.ceil(filteredTotal / filters.limit)

    return NextResponse.json({
      products: filteredProducts,
      data: filteredProducts,
      total: filteredTotal,
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
    // Normalizar terminaciones: convertir array a formato PostgreSQL TEXT[]
    const terminaciones = (productData as any).terminaciones 
      ? Array.isArray((productData as any).terminaciones) 
        ? (productData as any).terminaciones.filter((t: string) => t && t.trim() !== '')
        : []
      : []

    const productDataWithCategory = {
      ...productData,
      category_id: categoryIds.length > 0 ? categoryIds[0] : (productData as any).category_id || null,
      terminaciones: terminaciones.length > 0 ? terminaciones : null, // null en lugar de array vacío para mejor rendimiento
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
        terminaciones,
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
      // ✅ NUEVO: Normalizar título del producto a formato capitalizado
      name: normalizeProductTitle(product.name),
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
    // ✅ price es opcional si el producto tiene variantes (el precio se define en las variantes)
    const requiredFields = ['name']
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
    
    // ✅ Validar que si no hay variantes, entonces price es requerido
    // (Las variantes se crean después de crear el producto, así que no podemos verificar aquí)
    // Por ahora, permitimos que price sea opcional y se valida en el frontend

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
    // ✅ price y stock son opcionales si el producto tiene variantes
    const productData = {
      name: body.name,
      description: body.description || '',
      price: body.price !== undefined && body.price !== null && body.price !== '' 
        ? parseFloat(String(body.price)) 
        : null, // ✅ Permitir null si no se proporciona
      discounted_price: body.discounted_price !== undefined && body.discounted_price !== null 
        ? parseFloat(String(body.discounted_price)) 
        : (body.compare_price ? parseFloat(String(body.compare_price)) : null),
      stock: body.stock !== undefined && body.stock !== null && body.stock !== '' 
        ? parseInt(String(body.stock)) 
        : null, // ✅ Permitir null si no se proporciona
      category_id: categoryIds.length > 0 ? categoryIds[0] : null, // Mantener category_id para retrocompatibilidad
      is_active: body.is_active !== undefined 
        ? Boolean(body.is_active) 
        : (body.status === 'active' ? true : (body.status === 'inactive' ? false : true)), // Si no se especifica status, por defecto es activo
      brand: body.brand || '',
      color: body.color || '',
      // ✅ CORREGIDO: Normalizar medida - convertir array a string (tomar primera medida) o null
      medida: (() => {
        if (Array.isArray(body.medida)) {
          return body.medida.length > 0 ? body.medida[0] : null
        }
        return typeof body.medida === 'string' && body.medida.trim() !== '' 
          ? body.medida 
          : null
      })(),
      // ✅ NUEVO: Incluir terminaciones como array de texto
      terminaciones: body.terminaciones && Array.isArray(body.terminaciones) 
        ? body.terminaciones.filter((t: string) => t && t.trim() !== '')
        : null,
      // ✅ NUEVO: Incluir image_url en el campo images (JSONB) para retrocompatibilidad
      images: body.image_url 
        ? JSON.stringify({ url: body.image_url, is_primary: true })
        : null,
      // ✅ CORREGIDO: Generar slug único sin timestamp
      slug: await (async () => {
        const { generateCleanSlug } = await import('@/lib/products/slug-utils')
        const baseSlug = generateCleanSlug(body.name)
        
        // Verificar si el slug ya existe
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('slug', baseSlug)
          .limit(1)
        
        // Si no existe, usarlo
        if (!existing || existing.length === 0) {
          return baseSlug
        }
        
        // Si existe, agregar sufijo numérico
        let counter = 1
        let uniqueSlug = `${baseSlug}-${counter}`
        
        while (true) {
          const { data: existingWithSuffix } = await supabase
            .from('products')
            .select('id')
            .eq('slug', uniqueSlug)
            .limit(1)
          
          if (!existingWithSuffix || existingWithSuffix.length === 0) {
            return uniqueSlug
          }
          
          counter++
          uniqueSlug = `${baseSlug}-${counter}`
          
          // Protección contra loops infinitos
          if (counter > 10000) {
            throw new Error(`No se pudo generar slug único para "${body.name}" después de 10000 intentos.`)
          }
        }
      })(),
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

    // ✅ NUEVO: Normalizar título del producto antes de devolverlo
    const normalizedProduct = product ? {
      ...product,
      name: normalizeProductTitle(product.name),
    } : product

    return NextResponse.json(
      {
        success: true,
        message: 'Producto creado exitosamente',
        data: normalizedProduct,
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
    const statusParam = searchParams.get('status')
    const brandParam = searchParams.get('brand')
    const categoryIdParam = searchParams.get('category_id') || searchParams.get('category')

    logger.dev('[API] Parámetros:', { page, limit, sortBy, sortOrder, stockStatus, search, status: statusParam, brand: brandParam, category_id: categoryIdParam })

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
    
    // Status filter (active/inactive)
    if (statusParam === 'active') {
      query = query.eq('is_active', true)
      logger.dev('[API] Filtro STATUS=active aplicado')
    } else if (statusParam === 'inactive') {
      query = query.eq('is_active', false)
      logger.dev('[API] Filtro STATUS=inactive aplicado')
    }
    
    // Brand filter
    if (brandParam && brandParam.trim() !== '') {
      query = query.ilike('brand', `%${brandParam.trim()}%`)
      logger.dev('[API] Filtro BRAND aplicado:', brandParam)
    }
    
    // Category filter
    if (categoryIdParam) {
      const categoryId = parseInt(categoryIdParam)
      if (!isNaN(categoryId)) {
        // Obtener productos de esta categoría a través de product_categories
        const { data: productIdsData } = await supabaseAdmin
          .from('product_categories')
          .select('product_id')
          .eq('category_id', categoryId)
        
        if (productIdsData && productIdsData.length > 0) {
          const productIds = productIdsData.map(pc => pc.product_id)
          query = query.in('id', productIds)
          logger.dev('[API] Filtro CATEGORY aplicado:', categoryId, 'productos encontrados:', productIds.length)
        } else {
          // Si no hay productos con esta categoría, retornar vacío
          query = query.eq('id', -1)
          logger.dev('[API] Filtro CATEGORY: No hay productos con esta categoría')
        }
      }
    }
    
    // ✅ CORREGIDO: NO aplicar filtro de stock aquí porque necesitamos calcular stock efectivo primero
    // El filtro se aplicará DESPUÉS de calcular el stock efectivo considerando variantes
    // if (stockStatus === 'low_stock') {
    //   query = query.gt('stock', 0).lte('stock', 10)
    //   logger.dev('[API] Filtro LOW_STOCK aplicado')
    // } else if (stockStatus === 'out_of_stock') {
    //   query = query.or('stock.eq.0,stock.is.null')
    //   logger.dev('[API] Filtro OUT_OF_STOCK aplicado')
    // }

    // ✅ CORREGIDO: Si hay filtro de stock, NO aplicar paginación aquí
    // Necesitamos obtener más productos para poder filtrar correctamente después de calcular stock efectivo
    // La paginación se aplicará DESPUÉS del filtro de stock
    if (!stockStatus) {
      // Solo aplicar paginación si NO hay filtro de stock
      const from = (page - 1) * limit
      const to = from + limit - 1
      
      logger.db('range', 'products', { from, to, page, limit })
      
      query = query.range(from, to)
    } else {
      // Si hay filtro de stock, obtener más productos (hasta 500 para asegurar que encontremos todos los que cumplen el criterio)
      query = query.range(0, 499)
      logger.dev('[API] Filtro de stock activo, obteniendo más productos para filtrar correctamente')
    }

    // Apply sorting - IMPORTANTE: Asegurar que el ordenamiento se aplique correctamente
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    
    // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga

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
    
    // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga
    
    logger.dev('[API] Resultado:', {
      productsLength: products?.length,
      count,
      primeros5IDs: products?.slice(0, 5).map(p => p.id) || [],
      todosLosIDs: products?.map(p => p.id) || [],
      tieneProducto256: products?.some(p => p.id === 256) || false,
      tieneProducto257: products?.some(p => p.id === 257) || false,
      tieneProducto258: products?.some(p => p.id === 258) || false,
    })
    
    // ⚡ FASE 11-16: Código de debugging deshabilitado en producción
// Los requests a 127.0.0.1:7242 estaban causando timeouts y bloqueando la carga

    if (error) {
      logger.error('[API] Database error:', error)
      return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
    }

    const productIds = products?.map(p => p.id) || []
    const variantCounts: Record<number, number> = {}
    const variantImages: Record<number, string | null> = {}
    const variantMeasures: Record<number, string[]> = {} // ✅ Array de medidas
    const variantColors: Record<number, string[]> = {} // ✅ Array de colores
    const variantAikonIdsByProduct: Record<number, number[]> = {} // ✅ NUEVO: Todos los aikon_id de variantes por producto
    const productImagesFromTable: Record<number, string | null> = {} // ✅ NUEVO: Imágenes desde product_images
    const variantTotalStocks: Record<number, number> = {} // ✅ NUEVO: Stock total de variantes por producto
    const hasActiveVariantsWithStock: Record<number, boolean> = {} // ✅ NUEVO: Indica si hay variantes activas con stock
    let variantDataForTransform: ProductVariant[] = [] // ✅ NUEVO: Declarar fuera del if para que esté disponible siempre
    
    if (productIds.length > 0) {
      // ✅ NUEVO: Obtener imágenes desde product_images (prioridad sobre campo images JSONB)
      const { data: productImagesData } = await supabaseAdmin
        .from('product_images')
        .select('product_id, url, is_primary')
        .in('product_id', productIds)
        .order('is_primary', { ascending: false })
        .order('display_order', { ascending: true })
      
      // Agrupar por product_id y tomar la primera (primaria o primera disponible)
      productImagesData?.forEach((img: any) => {
        if (!productImagesFromTable[img.product_id]) {
          productImagesFromTable[img.product_id] = img.url
        }
      })
      
      const { data: variantData, error: variantError } = await supabaseAdmin
        .from('product_variants')
        .select('id,product_id,image_url,is_default,measure,color_name,aikon_id,stock,is_active') // ✅ AGREGADO: id, color_name, aikon_id, stock, is_active
        .in('product_id', productIds)
        .eq('is_active', true)
      
      // ✅ REFACTORIZADO: Guardar variantData tipado para usar con el servicio
      variantDataForTransform = (variantData || []) as ProductVariant[]
      
      variantDataForTransform.forEach(variant => {
        const productId = variant.product_id
        const normalizedImage = extractImageUrl(variant.image_url)
        variantCounts[productId] = (variantCounts[productId] || 0) + 1

        if (!variantImages[productId] && normalizedImage) {
          variantImages[productId] = normalizedImage
        }

        if (variant.is_default && normalizedImage) {
          variantImages[productId] = normalizedImage
        }
        
        // ✅ NUEVO: Calcular stock total de variantes por producto
        const variantStockValue = Number(variant.stock) || 0
        if (!variantTotalStocks[productId]) {
          variantTotalStocks[productId] = 0
        }
        variantTotalStocks[productId] += variantStockValue
        
        // ✅ NUEVO: Verificar si hay variantes activas con stock
        if (variantStockValue > 0 && variant.is_active) {
          hasActiveVariantsWithStock[productId] = true
        }
        
        // ✅ Obtener TODAS las medidas únicas de las variantes
        if (variant.measure && variant.measure.trim() !== '') {
          if (!variantMeasures[productId]) {
            variantMeasures[productId] = []
          }
          if (!variantMeasures[productId].includes(variant.measure)) {
            variantMeasures[productId].push(variant.measure)
          }
        }
        
        // ✅ Obtener TODOS los colores únicos de las variantes
        if (variant.color_name && variant.color_name.trim() !== '') {
          if (!variantColors[productId]) {
            variantColors[productId] = []
          }
          if (!variantColors[productId].includes(variant.color_name)) {
            variantColors[productId].push(variant.color_name)
          }
        }
        
        // ✅ REFACTORIZADO: Obtener TODOS los aikon_id de las variantes
        if (variant.aikon_id !== null && variant.aikon_id !== undefined) {
          if (!variantAikonIdsByProduct[productId]) {
            variantAikonIdsByProduct[productId] = []
          }
          // Asegurar que sea número (puede venir como string desde la BD antes de la migración)
          const aikonIdNum = typeof variant.aikon_id === 'string' 
            ? parseInt(variant.aikon_id, 10) 
            : Number(variant.aikon_id)
          if (!isNaN(aikonIdNum) && aikonIdNum >= 0 && aikonIdNum <= 999999) {
            variantAikonIdsByProduct[productId].push(aikonIdNum)
          }
        }
      })
    }
    
    // ✅ REFACTORIZADO: Agrupar variantes por product_id para usar con el servicio
    const variantsByProductIdForTransform = groupVariantsByProductId(variantDataForTransform)
    
    const transformedProducts =
      products?.map(product => {
        // ✅ NUEVO: Prioridad: product_images > variante > images JSONB
        const primaryImageFromTable = productImagesFromTable[product.id]
        const variantImage = variantImages[product.id]
        const fallbackImage = extractImageUrl(product.images)
        
        // Transform product_categories to categories array
        const categories = product.product_categories
          ?.map((pc: any) => pc.category)
          .filter((cat: any) => cat != null) || []
        
        // ✅ NUEVO: Combinar medida del producto con todas las medidas de variantes
        // ✅ CORREGIDO: Parsear medida si viene como string de array
        let parsedMedida: string[] = []
        if (product.medida) {
          if (typeof product.medida === 'string') {
            // Intentar parsear si es un string de array JSON
            if (product.medida.trim().startsWith('[') && product.medida.trim().endsWith(']')) {
              try {
                const parsed = JSON.parse(product.medida)
                parsedMedida = Array.isArray(parsed) ? parsed : [parsed]
              } catch {
                parsedMedida = [product.medida]
              }
            } else {
              parsedMedida = [product.medida]
            }
          } else if (Array.isArray(product.medida)) {
            parsedMedida = product.medida
          } else {
            parsedMedida = [String(product.medida)]
          }
        }
        const variantMeasuresList = variantMeasures[product.id] || []
        const allMeasures = Array.from(new Set([...parsedMedida, ...variantMeasuresList]))
        
        // ✅ NUEVO: Combinar color del producto con todos los colores de variantes
        const productColor = product.color ? [product.color] : []
        const variantColorsList = variantColors[product.id] || []
        const allColors = Array.from(new Set([...productColor, ...variantColorsList]))
        
        // ✅ REFACTORIZADO: Usar utilidades para obtener aikon_id
        const variants = variantsByProductIdForTransform[product.id] || []
        const aikonId = getProductAikonId(product as DatabaseProduct, variants)
        const aikonIdFormatted = getProductAikonIdFormatted(product as DatabaseProduct, variants)
        const variantAikonIds = variantAikonIdsByProduct[product.id] || []
        const variantAikonIdsFormatted = getAllVariantAikonIdsFormatted(variants)
        
        // ✅ NUEVO: Calcular stock efectivo (suma de variantes si hay, sino stock del producto)
        const variantStock = variantTotalStocks[product.id] || 0
        const numericVariantStock = typeof variantStock === 'string' 
          ? parseInt(variantStock, 10) || 0 
          : Number(variantStock) || 0
        const effectiveStock = numericVariantStock > 0
          ? numericVariantStock  // Suma de todas las variantes
          : (product.stock !== null && product.stock !== undefined ? Number(product.stock) || 0 : 0)
        
        return {
          ...product,
          // ✅ CRÍTICO: Stock efectivo (suma de variantes si hay, sino stock del producto)
          stock: effectiveStock,
          category_name: product.category?.name || categories[0]?.name || null,
          category: undefined,
          product_categories: undefined, // Remove nested object
          // Transform product_categories to categories array
          categories: categories,
          // Agregar conteo de variantes
          variant_count: variantCounts[product.id] || 0,
          // Imagen priorizando variantes
          // ✅ CORREGIDO: Prioridad: product_images > variante > images JSONB
          image_url: primaryImageFromTable || variantImage || fallbackImage,
          // Default status si es null
          status: product.status || (product.is_active ? 'active' : 'inactive'),
          // ✅ NUEVO: Array de todas las medidas (producto + variantes)
          medida: allMeasures.length > 0 ? allMeasures[0] : null, // Mantener compatibilidad con campo string
          medidas: allMeasures, // ✅ NUEVO: Array de todas las medidas
          // ✅ NUEVO: Array de todos los colores (producto + variantes)
          color: allColors.length > 0 ? allColors[0] : null, // Mantener compatibilidad con campo string
          colores: allColors, // ✅ NUEVO: Array de todos los colores
          // ✅ NUEVO: Terminaciones del producto (array de texto)
          terminaciones: product.terminaciones && Array.isArray(product.terminaciones) 
            ? product.terminaciones.filter((t: string) => t && t.trim() !== '')
            : [],
          // ✅ REFACTORIZADO: aikon_id como número y formateado, más arrays de variantes
          aikon_id: aikonId,
          aikon_id_formatted: aikonIdFormatted,
          variant_aikon_ids: variantAikonIds,
          variant_aikon_ids_formatted: variantAikonIdsFormatted,
          has_variants: variants.length > 0,
        }
      }) || []

    // ✅ CORREGIDO: Aplicar filtro de stock DESPUÉS de calcular el stock efectivo
    let filteredProducts = transformedProducts
    if (stockStatus === 'out_of_stock') {
      // Filtrar productos con stock efectivo <= 0 (considerando variantes)
      filteredProducts = transformedProducts.filter(p => (p.stock || 0) <= 0)
      logger.dev('[API] Filtro OUT_OF_STOCK aplicado post-transformación:', filteredProducts.length, 'productos')
    } else if (stockStatus === 'low_stock') {
      // Filtrar productos con stock efectivo entre 1 y 10
      filteredProducts = transformedProducts.filter(p => p.stock > 0 && p.stock <= 10)
      logger.dev('[API] Filtro LOW_STOCK aplicado post-transformación:', filteredProducts.length, 'productos')
    }

    // ✅ CORREGIDO: Aplicar paginación DESPUÉS del filtro de stock
    let paginatedProducts = filteredProducts
    if (stockStatus) {
      // Si hay filtro de stock, aplicar paginación después del filtro
      const from = (page - 1) * limit
      const to = from + limit
      paginatedProducts = filteredProducts.slice(from, to)
      logger.dev('[API] Paginación aplicada después del filtro de stock:', {
        totalFiltrados: filteredProducts.length,
        pagina: page,
        desde: from,
        hasta: to,
        productosEnPagina: paginatedProducts.length
      })
    }

    // ✅ CORREGIDO: Ajustar conteo total después del filtro
    const filteredTotal = stockStatus ? filteredProducts.length : (count || 0)
    const totalPages = Math.ceil(filteredTotal / limit)

    return NextResponse.json({
      products: paginatedProducts,
      data: paginatedProducts,
      total: filteredTotal,
      page,
      pageSize: limit,
      totalPages,
    })
  } catch (error) {
    logger.error('[API] Error en GET /api/admin/products:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// USAR VERSIÓN SIMPLIFICADA TEMPORALMENTE
export const POST = postHandlerSimple
