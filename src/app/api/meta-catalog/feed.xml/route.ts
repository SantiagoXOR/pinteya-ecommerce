// ===================================
// PINTEYA E-COMMERCE - FEED XML PARA META COMMERCE MANAGER
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'

// Función para escapar XML
function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return ''
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Función para obtener URL completa de imagen
function getFullImageUrl(imagePath: string | null | undefined, baseUrl: string): string {
  if (!imagePath) return ''
  if (imagePath.startsWith('http')) return imagePath
  if (imagePath.startsWith('/')) return `${baseUrl}${imagePath}`
  return `${baseUrl}/${imagePath}`
}

// Función para obtener imagen principal del producto
function getMainProductImage(product: any): string {
  // Priorizar imagen de variante por defecto
  if (product.default_variant?.image_url) {
    return product.default_variant.image_url
  }
  
  // Luego imágenes del producto
  if (Array.isArray(product.images) && product.images[0]) {
    return product.images[0]
  }
  
  if (product.images?.main) {
    return product.images.main
  }
  
  if (product.images?.previews?.[0]) {
    return product.images.previews[0]
  }
  
  return ''
}

// Función para determinar disponibilidad
function getAvailability(stock: number | null | undefined): string {
  if (stock === null || stock === undefined) return 'in stock'
  return stock > 0 ? 'in stock' : 'out of stock'
}

// GET /api/meta-catalog/feed.xml - Generar feed XML para Meta Commerce Manager
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Servicio de base de datos no disponible' },
        { status: 503 }
      )
    }

    // Obtener base URL del sitio
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.pinteya.com'
    const protocol = baseUrl.startsWith('https') ? 'https' : 'http'
    const domain = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')
    const fullBaseUrl = `${protocol}://${domain}`

    // Obtener todos los productos activos con sus categorías
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        slug,
        description,
        price,
        discounted_price,
        stock,
        brand,
        images,
        category:categories(id, name, slug)
      `)
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(10000) // Límite razonable para el feed

    if (error) {
      console.error('Error obteniendo productos para feed:', error)
      return NextResponse.json(
        { error: 'Error obteniendo productos' },
        { status: 500 }
      )
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron productos' },
        { status: 404 }
      )
    }

    // Construir XML del feed
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`
    xml += `  <channel>\n`
    xml += `    <title>Pinteya - Catálogo de Productos</title>\n`
    xml += `    <link>${fullBaseUrl}</link>\n`
    xml += `    <description>Catálogo completo de productos de Pinteya</description>\n`

    // Obtener variantes por defecto para cada producto (en batch)
    const productIds = products.map((p: any) => p.id)
    const { data: variants } = await supabase
      .from('product_variants')
      .select('product_id, price_list, price_sale, stock, image_url, is_default')
      .in('product_id', productIds)
      .eq('is_active', true)
      .eq('is_default', true)

    // Crear mapa de variantes por producto
    const variantsMap = new Map()
    if (variants) {
      variants.forEach((v: any) => {
        variantsMap.set(v.product_id, v)
      })
    }

    // Agregar cada producto al feed
    products.forEach((product: any) => {
      const productSlug = product.slug || `product-${product.id}`
      // URL directa al checkout: agregar producto al carrito y redirigir
      const productUrl = `${fullBaseUrl}/buy/${productSlug}`
      const defaultVariant = variantsMap.get(product.id)
      
      // Usar imagen de variante si existe, sino del producto
      const productWithVariant = { ...product, default_variant: defaultVariant }
      const imageUrl = getFullImageUrl(getMainProductImage(productWithVariant), fullBaseUrl)
      
      const price = defaultVariant?.price_sale || product.discounted_price || defaultVariant?.price_list || product.price || 0
      const availability = getAvailability(defaultVariant?.stock ?? product.stock)
      const category = product.category?.name || 'General'
      const brand = product.brand || 'Pinteya'
      const description = product.description || product.name || ''

      xml += `    <item>\n`
      xml += `      <g:id>${product.id}</g:id>\n`
      xml += `      <g:title>${escapeXml(product.name)}</g:title>\n`
      xml += `      <g:description>${escapeXml(description)}</g:description>\n`
      xml += `      <g:link>${productUrl}</g:link>\n`
      
      // g:image_link es obligatorio, usar placeholder si no hay imagen
      const finalImageUrl = imageUrl || `${fullBaseUrl}/images/products/placeholder.svg`
      xml += `      <g:image_link>${finalImageUrl}</g:image_link>\n`
      
      xml += `      <g:price>${price.toFixed(2)} ARS</g:price>\n`
      xml += `      <g:availability>${availability}</g:availability>\n`
      xml += `      <g:brand>${escapeXml(brand)}</g:brand>\n`
      xml += `      <g:condition>new</g:condition>\n`
      xml += `      <g:google_product_category>${escapeXml(category)}</g:google_product_category>\n`
      
      // Agregar categoría personalizada si existe
      if (product.category?.name) {
        xml += `      <g:product_type>${escapeXml(category)}</g:product_type>\n`
      }
      
      xml += `    </item>\n`
    })

    xml += `  </channel>\n`
    xml += `</rss>`

    // Retornar XML con headers apropiados
    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error: any) {
    console.error('Error generando feed XML:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

