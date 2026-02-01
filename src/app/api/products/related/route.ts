// ===================================
// GET /api/products/related - Productos relacionados (servidor, multitenant)
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'
import { getTenantConfig } from '@/lib/tenant'
import {
  extractBaseName,
  extractMeasure,
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

    // Buscar productos relacionados por nombre (mismo tenant)
    const { data: relatedRows, error: relatedError } = await supabase
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
      .or(`name.ilike.%${baseName}%,name.eq.${currentProduct.name}`)
      .eq('is_active', true)
      .eq('tenant_products.tenant_id', tenantId)
      .eq('tenant_products.is_visible', true)
      .order('medida')

    if (relatedError) {
      console.warn('[API related] Error obteniendo relacionados:', relatedError)
      return NextResponse.json(
        { success: false, error: 'Error obteniendo productos relacionados' },
        { status: 500 }
      )
    }

    const mapRowToRelatedProduct = (row: any): RelatedProduct => {
      const tp = Array.isArray(row.tenant_products) ? row.tenant_products[0] : row.tenant_products
      const price = tp?.price != null ? String(tp.price) : String(row.price ?? 0)
      const discounted_price = tp?.discounted_price != null ? String(tp.discounted_price) : row.discounted_price?.toString()
      const stock = typeof tp?.stock === 'number' ? tp.stock : (typeof row.stock === 'number' ? row.stock : parseFloat(String(row.stock ?? 0)))
      return {
        id: row.id,
        name: row.name,
        measure: row.medida || extractMeasure(row.name) || 'Sin medida',
        price,
        discounted_price: discounted_price || undefined,
        stock,
      }
    }

    const products: RelatedProduct[] = (relatedRows || []).map(mapRowToRelatedProduct)
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
