// =====================================================
// TENANT PRODUCT SERVICE
// Descripción: Servicio para obtener productos con
// stock y precios específicos del tenant
// =====================================================

import { createAdminClient } from '@/lib/supabase/server'
import { getTenantConfig } from '@/lib/tenant'
import type { TenantConfig } from '@/lib/tenant/types'

// ============================================================================
// TYPES
// ============================================================================

export interface TenantProduct {
  id: number
  name: string
  slug: string
  description: string | null
  price: number
  discountedPrice: number | null
  stock: number
  isSharedStock: boolean
  isVisible: boolean
  isFeatured: boolean
  isNew: boolean
  sortOrder: number
  customName: string | null
  customDescription: string | null
  // Datos del producto global
  images: string[]
  categoryId: number | null
  brandId: number | null
  aikonId: string | null
}

export interface TenantProductWithDetails extends TenantProduct {
  category: {
    id: number
    name: string
    slug: string
  } | null
  brand: {
    id: number
    name: string
    slug: string
  } | null
  variants: Array<{
    id: number
    color: string | null
    colorHex: string | null
    measure: string | null
    finish: string | null
    price: number
    discountedPrice: number | null
    stock: number
    aikonId: string | null
  }>
}

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

/**
 * Obtiene todos los productos visibles para un tenant
 */
export async function getTenantProducts(
  tenantId?: string,
  options?: {
    limit?: number
    offset?: number
    categoryId?: number
    brandId?: number
    featured?: boolean
    orderBy?: 'price' | 'name' | 'created_at' | 'sort_order'
    orderDir?: 'asc' | 'desc'
  }
): Promise<TenantProduct[]> {
  const supabase = createAdminClient()
  
  // Si no se proporciona tenantId, obtener del contexto
  let effectiveTenantId = tenantId
  if (!effectiveTenantId) {
    const tenant = await getTenantConfig()
    effectiveTenantId = tenant.id
  }
  
  // Query principal
  let query = supabase
    .from('tenant_products')
    .select(`
      id,
      product_id,
      price,
      discounted_price,
      stock,
      shared_pool_id,
      is_visible,
      is_featured,
      is_new,
      sort_order,
      custom_name,
      custom_description,
      products (
        id,
        name,
        slug,
        description,
        images,
        category_id,
        brand_id,
        aikon_id
      )
    `)
    .eq('tenant_id', effectiveTenantId)
    .eq('is_visible', true)
  
  // Filtros opcionales
  if (options?.featured) {
    query = query.eq('is_featured', true)
  }
  
  // Ordenamiento
  const orderBy = options?.orderBy || 'sort_order'
  const orderDir = options?.orderDir || 'asc'
  query = query.order(orderBy, { ascending: orderDir === 'asc' })
  
  // Paginación
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1)
  }
  
  const { data, error } = await query
  
  if (error) {
    console.error('[TenantProductService] Error fetching products:', error)
    return []
  }
  
  // Resolver stock de pools compartidos
  const products: TenantProduct[] = await Promise.all(
    (data || []).map(async (tp: any) => {
      let resolvedStock = tp.stock || 0
      const isSharedStock = !!tp.shared_pool_id
      
      // Si usa pool compartido, obtener stock del pool
      if (isSharedStock && tp.shared_pool_id) {
        const { data: poolStock } = await supabase
          .from('shared_pool_stock')
          .select('stock, reserved_stock')
          .eq('pool_id', tp.shared_pool_id)
          .eq('product_id', tp.product_id)
          .single()
        
        if (poolStock) {
          resolvedStock = (poolStock.stock || 0) - (poolStock.reserved_stock || 0)
        }
      }
      
      return {
        id: tp.products?.id || tp.product_id,
        name: tp.custom_name || tp.products?.name || '',
        slug: tp.products?.slug || '',
        description: tp.custom_description || tp.products?.description || null,
        price: tp.price,
        discountedPrice: tp.discounted_price,
        stock: resolvedStock,
        isSharedStock,
        isVisible: tp.is_visible,
        isFeatured: tp.is_featured,
        isNew: tp.is_new,
        sortOrder: tp.sort_order,
        customName: tp.custom_name,
        customDescription: tp.custom_description,
        images: tp.products?.images || [],
        categoryId: tp.products?.category_id,
        brandId: tp.products?.brand_id,
        aikonId: tp.products?.aikon_id,
      }
    })
  )
  
  // Filtros post-query (category, brand)
  let filteredProducts = products
  if (options?.categoryId) {
    filteredProducts = filteredProducts.filter(p => p.categoryId === options.categoryId)
  }
  if (options?.brandId) {
    filteredProducts = filteredProducts.filter(p => p.brandId === options.brandId)
  }
  
  return filteredProducts
}

/**
 * Obtiene un producto específico con detalles completos
 */
export async function getTenantProductBySlug(
  slug: string,
  tenantId?: string
): Promise<TenantProductWithDetails | null> {
  const supabase = createAdminClient()
  
  let effectiveTenantId = tenantId
  if (!effectiveTenantId) {
    const tenant = await getTenantConfig()
    effectiveTenantId = tenant.id
  }
  
  // Primero obtener el producto global por slug
  const { data: globalProduct, error: productError } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      description,
      images,
      category_id,
      brand_id,
      aikon_id,
      categories (id, name, slug),
      brands (id, name, slug)
    `)
    .eq('slug', slug)
    .single()
  
  if (productError || !globalProduct) {
    return null
  }
  
  // Obtener configuración del tenant para este producto
  const { data: tenantConfig, error: configError } = await supabase
    .from('tenant_products')
    .select('*')
    .eq('tenant_id', effectiveTenantId)
    .eq('product_id', globalProduct.id)
    .eq('is_visible', true)
    .single()
  
  if (configError || !tenantConfig) {
    return null
  }
  
  // Resolver stock
  let resolvedStock = tenantConfig.stock || 0
  const isSharedStock = !!tenantConfig.shared_pool_id
  
  if (isSharedStock && tenantConfig.shared_pool_id) {
    const { data: poolStock } = await supabase
      .from('shared_pool_stock')
      .select('stock, reserved_stock')
      .eq('pool_id', tenantConfig.shared_pool_id)
      .eq('product_id', globalProduct.id)
      .single()
    
    if (poolStock) {
      resolvedStock = (poolStock.stock || 0) - (poolStock.reserved_stock || 0)
    }
  }
  
  // Obtener variantes
  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', globalProduct.id)
  
  return {
    id: globalProduct.id,
    name: tenantConfig.custom_name || globalProduct.name,
    slug: globalProduct.slug,
    description: tenantConfig.custom_description || globalProduct.description,
    price: tenantConfig.price,
    discountedPrice: tenantConfig.discounted_price,
    stock: resolvedStock,
    isSharedStock,
    isVisible: tenantConfig.is_visible,
    isFeatured: tenantConfig.is_featured,
    isNew: tenantConfig.is_new,
    sortOrder: tenantConfig.sort_order,
    customName: tenantConfig.custom_name,
    customDescription: tenantConfig.custom_description,
    images: globalProduct.images || [],
    categoryId: globalProduct.category_id,
    brandId: globalProduct.brand_id,
    aikonId: globalProduct.aikon_id,
    category: globalProduct.categories ? {
      id: (globalProduct.categories as any).id,
      name: (globalProduct.categories as any).name,
      slug: (globalProduct.categories as any).slug,
    } : null,
    brand: globalProduct.brands ? {
      id: (globalProduct.brands as any).id,
      name: (globalProduct.brands as any).name,
      slug: (globalProduct.brands as any).slug,
    } : null,
    variants: (variants || []).map(v => ({
      id: v.id,
      color: v.color,
      colorHex: v.color_hex,
      measure: v.measure,
      finish: v.finish,
      price: v.price,
      discountedPrice: v.discounted_price,
      stock: v.stock,
      aikonId: v.aikon_id,
    })),
  }
}

/**
 * Busca un producto por código externo (ERP)
 */
export async function findProductByExternalCode(
  externalCode: string,
  systemCode: string = 'AIKON',
  tenantId?: string
): Promise<TenantProduct | null> {
  const supabase = createAdminClient()
  
  let effectiveTenantId = tenantId
  if (!effectiveTenantId) {
    const tenant = await getTenantConfig()
    effectiveTenantId = tenant.id
  }
  
  // Buscar en tenant_product_external_ids
  const { data, error } = await supabase
    .from('tenant_product_external_ids')
    .select(`
      product_id,
      external_code,
      external_systems!inner (code)
    `)
    .eq('tenant_id', effectiveTenantId)
    .eq('external_code', externalCode)
    .eq('external_systems.code', systemCode)
    .single()
  
  if (error || !data) {
    return null
  }
  
  // Obtener el producto completo
  const products = await getTenantProducts(effectiveTenantId)
  return products.find(p => p.id === data.product_id) || null
}

/**
 * Obtiene el stock disponible de un producto para un tenant
 */
export async function getTenantProductStock(
  productId: number,
  tenantId?: string
): Promise<number> {
  const supabase = createAdminClient()
  
  let effectiveTenantId = tenantId
  if (!effectiveTenantId) {
    const tenant = await getTenantConfig()
    effectiveTenantId = tenant.id
  }
  
  // Obtener configuración del tenant
  const { data: config } = await supabase
    .from('tenant_products')
    .select('stock, shared_pool_id')
    .eq('tenant_id', effectiveTenantId)
    .eq('product_id', productId)
    .single()
  
  if (!config) {
    return 0
  }
  
  // Si usa pool compartido
  if (config.shared_pool_id) {
    const { data: poolStock } = await supabase
      .from('shared_pool_stock')
      .select('stock, reserved_stock')
      .eq('pool_id', config.shared_pool_id)
      .eq('product_id', productId)
      .single()
    
    if (poolStock) {
      return (poolStock.stock || 0) - (poolStock.reserved_stock || 0)
    }
  }
  
  return config.stock || 0
}

/**
 * Obtiene productos destacados del tenant
 */
export async function getTenantFeaturedProducts(
  tenantId?: string,
  limit: number = 8
): Promise<TenantProduct[]> {
  return getTenantProducts(tenantId, {
    featured: true,
    limit,
    orderBy: 'sort_order',
    orderDir: 'asc',
  })
}
