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
    const { data: allProducts, error } = await supabase
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
        is_active,
        exclude_from_meta_feed,
        category:categories(id, name, slug)
      `)
      .order('updated_at', { ascending: false })
      .limit(10000) // Límite razonable para el feed

    if (error) {
      console.error('Error obteniendo productos para feed:', error)
      return NextResponse.json(
        { error: 'Error obteniendo productos' },
        { status: 500 }
      )
    }

    // Filtrar productos: solo activos Y que NO estén excluidos del feed de Meta
    const products = (allProducts || []).filter((p: any) => {
      return p.is_active === true && (p.exclude_from_meta_feed !== true)
    })

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

    // Obtener TODAS las variantes activas para cada producto (en batch)
    const productIds = products.map((p: any) => p.id)
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, product_id, price_list, price_sale, stock, image_url, is_default, is_active, color_name, measure, finish, aikon_id, variant_slug')
      .in('product_id', productIds)
    
    if (variantsError) {
      console.error('Error obteniendo variantes para feed:', variantsError)
    }
    
    // Filtrar variantes activas en memoria (más confiable que el filtro de Supabase con tipos)
    const activeVariants = (variants || []).filter((v: any) => v.is_active === true)
      .sort((a: any, b: any) => {
        // Ordenar por is_default primero (true primero), luego por id
        if (a.is_default !== b.is_default) {
          return b.is_default ? 1 : -1
        }
        return a.id - b.id
      })

    // Crear mapa de productos por ID para acceso rápido
    const productsMap = new Map()
    products.forEach((p: any) => {
      productsMap.set(p.id, p)
    })

    // Crear mapa de variantes agrupadas por producto
    const variantsByProduct = new Map()
    activeVariants.forEach((v: any) => {
      if (!variantsByProduct.has(v.product_id)) {
        variantsByProduct.set(v.product_id, [])
      }
      variantsByProduct.get(v.product_id).push(v)
    })

    // Función para construir título de variante
    const buildVariantTitle = (product: any, variant: any | null): string => {
      const baseName = product.name || 'Producto'
      if (!variant) return baseName

      const parts: string[] = [baseName]
      if (variant.color_name) parts.push(variant.color_name)
      if (variant.measure) parts.push(variant.measure)
      if (variant.finish) parts.push(variant.finish)

      return parts.join(' - ')
    }

    // Función para construir descripción de variante
    const buildVariantDescription = (product: any, variant: any | null): string => {
      let description = product.description || product.name || ''
      
      if (variant) {
        const variantDetails: string[] = []
        if (variant.color_name) variantDetails.push(`Color: ${variant.color_name}`)
        if (variant.measure) variantDetails.push(`Medida: ${variant.measure}`)
        if (variant.finish) variantDetails.push(`Terminación: ${variant.finish}`)
        
        if (variantDetails.length > 0) {
          description += ` | ${variantDetails.join(', ')}`
        }
      }

      return description
    }

    // Agregar cada variante como producto separado al feed
    products.forEach((product: any) => {
      const productVariants = variantsByProduct.get(product.id) || []
      
      // Si el producto tiene variantes, crear un item por cada variante
      if (productVariants.length > 0) {
        productVariants.forEach((variant: any) => {
          const variantSlug = variant.variant_slug || product.slug || `product-${product.id}`
          // URL con variante específica
          const productUrl = `${fullBaseUrl}/buy/${variantSlug}`
          
          // Usar imagen de variante si existe, sino del producto
          const productWithVariant = { ...product, default_variant: variant }
          const imageUrl = getFullImageUrl(getMainProductImage(productWithVariant), fullBaseUrl)
          
          const price = variant.price_sale || variant.price_list || product.discounted_price || product.price || 0
          const availability = getAvailability(variant.stock ?? product.stock)
          const category = product.category?.name || 'General'
          const brand = product.brand || 'Pinteya'
          
          const variantTitle = buildVariantTitle(product, variant)
          const variantDescription = buildVariantDescription(product, variant)
          
          // Usar ID de variante como identificador único para el feed
          const itemId = `variant-${variant.id}`

          xml += `    <item>\n`
          xml += `      <g:id>${itemId}</g:id>\n`
          xml += `      <g:title>${escapeXml(variantTitle)}</g:title>\n`
          xml += `      <g:description>${escapeXml(variantDescription)}</g:description>\n`
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
          
          // Agregar información adicional de la variante si está disponible
          if (variant.color_name) {
            xml += `      <g:color>${escapeXml(variant.color_name)}</g:color>\n`
          }
          
          // Agregar SKU si está disponible
          if (variant.aikon_id) {
            xml += `      <g:mpn>${escapeXml(variant.aikon_id)}</g:mpn>\n`
          }
          
          xml += `    </item>\n`
        })
      } else {
        // Si el producto no tiene variantes, crear un item con el producto base
        const productSlug = product.slug || `product-${product.id}`
        const productUrl = `${fullBaseUrl}/buy/${productSlug}`
        
        const imageUrl = getFullImageUrl(getMainProductImage(product), fullBaseUrl)
        const price = product.discounted_price || product.price || 0
        const availability = getAvailability(product.stock)
        const category = product.category?.name || 'General'
        const brand = product.brand || 'Pinteya'
        const description = product.description || product.name || ''

        xml += `    <item>\n`
        xml += `      <g:id>product-${product.id}</g:id>\n`
        xml += `      <g:title>${escapeXml(product.name)}</g:title>\n`
        xml += `      <g:description>${escapeXml(description)}</g:description>\n`
        xml += `      <g:link>${productUrl}</g:link>\n`
        
        const finalImageUrl = imageUrl || `${fullBaseUrl}/images/products/placeholder.svg`
        xml += `      <g:image_link>${finalImageUrl}</g:image_link>\n`
        
        xml += `      <g:price>${price.toFixed(2)} ARS</g:price>\n`
        xml += `      <g:availability>${availability}</g:availability>\n`
        xml += `      <g:brand>${escapeXml(brand)}</g:brand>\n`
        xml += `      <g:condition>new</g:condition>\n`
        xml += `      <g:google_product_category>${escapeXml(category)}</g:google_product_category>\n`
        
        if (product.category?.name) {
          xml += `      <g:product_type>${escapeXml(category)}</g:product_type>\n`
        }
        
        xml += `    </item>\n`
      }
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

