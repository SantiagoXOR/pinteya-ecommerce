// ===================================
// GET /api/products/related - Productos relacionados (servidor, multitenant)
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { getTenantConfig } from '@/lib/tenant'
import {
  extractBaseName,
  extractMeasure,
  extractImageFromJsonb,
  type RelatedProduct,
  type ProductGroup,
} from '@/lib/api/related-products'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productIdParam = searchParams.get('productId')
    const productId = productIdParam ? parseInt(productIdParam, 10) : NaN

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { success: false, error: 'productId inválido o faltante' },
        { status: 400 }
      )
    }

    const tenant = await getTenantConfig()
    const tenantId = tenant.id
    const supabase = getSupabaseClient()
    const supabaseAdmin = getSupabaseClient(true)

    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      )
    }

    // Obtener producto actual con filtro tenant (solo productos visibles para el tenant)
    const { data: currentProduct, error: currentError } = await supabase
      .from('products')
      .select(
        `
        id,
        name,
        price,
        discounted_price,
        medida,
        stock,
        tenant_products!inner (price, discounted_price, stock)
        `
      )
      .eq('id', productId)
      .eq('is_active', true)
      .eq('tenant_products.tenant_id', tenantId)
      .eq('tenant_products.is_visible', true)
      .single()

    if (currentError || !currentProduct) {
      return NextResponse.json(
        { success: false, error: 'Producto no encontrado o no visible' },
        { status: 404 }
      )
    }

    const baseName = extractBaseName(currentProduct.name)

    // Buscar productos relacionados por nombre (todos por nombre); tenant_products opcional para precio/stock
    const { data: relatedRows, error: relatedError } = await supabase
      .from('products')
      .select(
        `id, name, price, discounted_price, medida, stock, slug, images, brand,
        tenant_products (tenant_id, price, discounted_price, stock)`
      )
      .or(`name.ilike.%${baseName}%,name.eq.${currentProduct.name}`)
      .eq('is_active', true)
      .order('medida')

    if (relatedError) {
      console.warn('[API related] Error obteniendo relacionados:', relatedError)
      return NextResponse.json(
        { success: false, error: 'Error obteniendo productos relacionados' },
        { status: 500 }
      )
    }

    const rows = relatedRows || []
    const productIds = rows.map((r: { id: number }) => r.id)

    // Enriquecer con variantes e imágenes usando cliente admin (evita RLS que bloquea en algunos productos, ej. Impregnante Danzke)
    const clientForEnrich = supabaseAdmin ?? supabase
    const { data: variants } = await clientForEnrich
      .from('product_variants')
      .select('id, product_id, measure, price_list, price_sale, stock, image_url, is_default')
      .in('product_id', productIds)
      .eq('is_active', true)
      .order('is_default', { ascending: false })

    const variantsByProduct: Record<number, { product_id: number; measure?: string; price_list?: number; price_sale?: number; stock?: number; image_url?: string; is_default?: boolean }[]> = {}
    ;(variants || []).forEach((v: { product_id: number; measure?: string; price_list?: number; price_sale?: number; stock?: number; image_url?: string; is_default?: boolean }) => {
      if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = []
      variantsByProduct[v.product_id].push(v)
    })

    const { data: productImagesData } = await clientForEnrich
      .from('product_images')
      .select('product_id, url, is_primary')
      .in('product_id', productIds)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })

    const imageByProductId: Record<number, string | null> = {}
    productImagesData?.forEach((img: { product_id: number; url: string }) => {
      if (imageByProductId[img.product_id] == null) imageByProductId[img.product_id] = img.url
    })

    const mapRowToRelatedProduct = (row: any): RelatedProduct => {
      const tpList = Array.isArray(row.tenant_products) ? row.tenant_products : (row.tenant_products ? [row.tenant_products] : [])
      const tp = tpList.find((t: { tenant_id?: number }) => t?.tenant_id === tenantId) ?? tpList[0]
      const productVariants = variantsByProduct[row.id] || []
      const defaultVariant = productVariants.find((v: { is_default?: boolean }) => v.is_default) || productVariants[0]
      const priceFromTenantOrProduct = tp?.price != null ? Number(tp.price) : Number(row.price ?? 0)
      const discountFromTenantOrProduct = tp?.discounted_price != null ? Number(tp.discounted_price) : (row.discounted_price != null ? Number(row.discounted_price) : null)
      const effectivePrice = priceFromTenantOrProduct > 0 ? priceFromTenantOrProduct : (defaultVariant?.price_list ?? 0)
      const effectiveDiscount = discountFromTenantOrProduct != null && discountFromTenantOrProduct < effectivePrice
        ? discountFromTenantOrProduct
        : (defaultVariant?.price_sale != null && defaultVariant?.price_list != null && defaultVariant.price_sale < defaultVariant.price_list
          ? defaultVariant.price_sale
          : effectivePrice)
      const imageUrl = imageByProductId[row.id] ?? defaultVariant?.image_url ?? extractImageFromJsonb(row.images)
      const measure = (row.medida ?? defaultVariant?.measure ?? extractMeasure(row.name)) || 'Sin medida'
      const stock = typeof tp?.stock === 'number' ? tp.stock : (typeof row.stock === 'number' ? row.stock : (defaultVariant?.stock ?? parseFloat(String(row.stock ?? 0))))
      return {
        id: row.id,
        name: row.name,
        measure,
        price: String(effectivePrice),
        discounted_price: effectiveDiscount < effectivePrice ? String(effectiveDiscount) : undefined,
        stock: Number(stock) || 0,
        brand: row.brand ?? undefined,
        slug: row.slug ?? undefined,
        image: imageUrl ?? undefined,
        variants: productVariants.length ? productVariants : undefined,
        default_variant: defaultVariant ? { measure: defaultVariant.measure, price_list: defaultVariant.price_list, price_sale: defaultVariant.price_sale, stock: defaultVariant.stock } : null,
      }
    }

    const products: RelatedProduct[] = rows.map(mapRowToRelatedProduct)
    const selectedProduct = products.find((p) => p.id === productId) || products[0]

    if (!selectedProduct) {
      return NextResponse.json(
        { success: false, error: 'Sin productos relacionados' },
        { status: 404 }
      )
    }

    const payload: ProductGroup = {
      baseName,
      selectedProduct,
      products,
    }

    return NextResponse.json({ success: true, data: payload })
  } catch (err) {
    console.error('[API related] Error:', err)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
