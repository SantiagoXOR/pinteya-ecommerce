/**
 * Obtiene un resumen del catálogo de productos del tenant para inyectar en el prompt del chat.
 * Formato compacto (nombre, marca, categoría) para que la IA pueda referenciar productos reales.
 */

import { getSupabaseClient } from '@/lib/integrations/supabase'

const MAX_PRODUCTS = 280
const MAX_CHARS = 12000

export interface ProductSummaryRow {
  name: string
  brand: string | null
  category_slug: string | null
  category_name: string | null
}

/**
 * Genera un resumen en texto del catálogo para el prompt.
 * Incluye nombre, marca y categoría de cada producto (hasta MAX_PRODUCTS).
 */
export async function getProductCatalogSummaryForPrompt(
  tenantId: string | number
): Promise<string> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return ''
  }

  try {
    const { data: rows, error } = await supabase
      .from('products')
      .select(
        `
        name,
        brand,
        categories:product_categories(category:categories(slug, name)),
        tenant_products!inner(tenant_id, is_visible)
        `
      )
      .eq('is_active', true)
      .eq('tenant_products.tenant_id', tenantId)
      .eq('tenant_products.is_visible', true)
      .order('updated_at', { ascending: false })
      .limit(MAX_PRODUCTS * 2)

    if (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AI Chat] Error fetching catalog summary:', error.message)
      }
      return ''
    }

    const products = (rows || []).slice(0, MAX_PRODUCTS)
    if (products.length === 0) return ''

    const lines: string[] = [
      '<catalogo>',
      'Productos disponibles (nombre, marca, categoría). Usá estos datos para recomendar y nombrar productos reales.',
      '',
    ]

    for (const p of products as any[]) {
      const name = p?.name ?? ''
      const brand = p?.brand ?? ''
      let catSlug = ''
      let catName = ''
      const cats = p?.categories ?? []
      const firstCat = Array.isArray(cats) ? cats[0] : null
      if (firstCat?.category) {
        catSlug = firstCat.category.slug ?? ''
        catName = firstCat.category.name ?? ''
      }
      if (!name) continue
      const line = `  <producto nombre="${escapeXml(name)}" marca="${escapeXml(brand)}" categoria="${escapeXml(catSlug)}" categoria_nombre="${escapeXml(catName)}" />`
      lines.push(line)
    }

    lines.push('</catalogo>')
    const text = lines.join('\n')
    return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + '\n...' : text
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AI Chat] getProductCatalogSummaryForPrompt error:', e)
    }
    return ''
  }
}

function escapeXml(unsafe: string | null | undefined): string {
  if (unsafe == null) return ''
  const s = String(unsafe)
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
