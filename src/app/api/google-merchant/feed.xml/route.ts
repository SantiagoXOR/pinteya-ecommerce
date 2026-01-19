// ===================================
// PINTEYA E-COMMERCE - FEED XML PARA GOOGLE MERCHANT CENTER
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/integrations/supabase'

// Función para escapar XML - acepta cualquier tipo y lo convierte a string
function escapeXml(unsafe: unknown): string {
  if (unsafe === null || unsafe === undefined) return ''
  // Convertir a string si no lo es (números, objetos, etc.)
  const str = typeof unsafe === 'string' ? unsafe : String(unsafe)
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Función para obtener URL completa de imagen
function getFullImageUrl(imagePath: unknown, baseUrl: string): string {
  if (!imagePath) return ''
  const path = typeof imagePath === 'string' ? imagePath : String(imagePath)
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) return `${baseUrl}${path}`
  return `${baseUrl}/${path}`
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

// Función para determinar disponibilidad (Google Merchant Center requiere valores específicos)
function getAvailability(stock: number | null | undefined): string {
  if (stock === null || stock === undefined) return 'in stock'
  return stock > 0 ? 'in stock' : 'out of stock'
}

// Función para mapear categorías a Google Product Taxonomy (simplificado)
function getGoogleProductCategory(categoryName: unknown): string {
  if (!categoryName) return 'Home & Garden > Decor > Home Decor'
  const name = typeof categoryName === 'string' ? categoryName : String(categoryName)
  
  // Mapeo básico de categorías comunes a Google Product Taxonomy
  const categoryMap: Record<string, string> = {
    'Pinturas': 'Home & Garden > Decor > Home Decor',
    'Herramientas': 'Hardware > Tools',
    'Accesorios': 'Home & Garden > Decor > Home Decor',
    'Ferretería': 'Hardware',
    'Corralón': 'Home & Garden',
  }
  
  // Buscar coincidencia parcial
  for (const [key, value] of Object.entries(categoryMap)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }
  
  return 'Home & Garden > Decor > Home Decor'
}

// GET /api/google-merchant/feed.xml - Generar feed XML para Google Merchant Center
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

    // Filtrar productos: solo activos Y que NO estén excluidos del feed
    const products = (allProducts || []).filter((p: any) => {
      return p.is_active === true && (p.exclude_from_meta_feed !== true)
    })

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron productos' },
        { status: 404 }
      )
    }

    // Construir XML del feed para Google Merchant Center
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`
    xml += `  <channel>\n`
    xml += `    <title>Pinteya - Catálogo de Productos</title>\n`
    xml += `    <link>${escapeXml(fullBaseUrl)}</link>\n`
    xml += `    <description>Catálogo completo de productos de Pinteya para Google Merchant Center</description>\n`

    // Obtener TODAS las variantes activas para cada producto
    const productIds = products.map((p: any) => p.id)
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, product_id, price_list, price_sale, stock, image_url, is_default, is_active, color_name, measure, finish, aikon_id, variant_slug')
      .in('product_id', productIds)
      .eq('is_active', true)
    
    if (variantsError) {
      console.error('Error obteniendo variantes para feed:', variantsError)
    }
    
    // Filtrar variantes activas
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
      const product = productsMap.get(v.product_id)
      
      // Verificar que el producto padre NO esté excluido del feed
      if (product && product.exclude_from_meta_feed !== true) {
        if (!variantsByProduct.has(v.product_id)) {
          variantsByProduct.set(v.product_id, [])
        }
        variantsByProduct.get(v.product_id).push(v)
      }
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
      
      // Limitar descripción a 5000 caracteres (límite de Google)
      if (description.length > 5000) {
        description = description.substring(0, 4997) + '...'
      }
      
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
          const productSlug = product.slug || `product-${product.id}`
          const productUrl = `${fullBaseUrl}/buy/${productSlug}`
          
          // Usar imagen de variante si existe, sino del producto
          const productWithVariant = { ...product, default_variant: variant }
          const imageUrl = getFullImageUrl(getMainProductImage(productWithVariant), fullBaseUrl)
          
          const price = variant.price_sale || variant.price_list || product.discounted_price || product.price || 0
          const availability = getAvailability(variant.stock ?? product.stock)
          const category = product.category?.name || 'General'
          const brand = product.brand || 'Pinteya'
          
          const variantTitle = buildVariantTitle(product, variant)
          const variantDescription = buildVariantDescription(product, variant)
          
          // Usar ID de variante como ID único del producto
          const itemId = String(variant.id)

          // Campos requeridos por Google Merchant Center
          xml += `    <item>\n`
          xml += `      <g:id>${itemId}</g:id>\n`
          xml += `      <g:title>${escapeXml(variantTitle)}</g:title>\n`
          xml += `      <g:description>${escapeXml(variantDescription)}</g:description>\n`
          xml += `      <g:link>${escapeXml(productUrl)}</g:link>\n`
          
          // g:image_link es obligatorio
          const finalImageUrl = imageUrl || `${fullBaseUrl}/images/products/placeholder.svg`
          xml += `      <g:image_link>${escapeXml(finalImageUrl)}</g:image_link>\n`
          
          // Precio con formato requerido: "valor moneda" (ej: "5000.00 ARS")
          xml += `      <g:price>${price.toFixed(2)} ARS</g:price>\n`
          xml += `      <g:availability>${availability}</g:availability>\n`
          xml += `      <g:condition>new</g:condition>\n`
          
          // google_product_category: usar taxonomía de Google o categoría personalizada
          const googleCategory = getGoogleProductCategory(category)
          xml += `      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>\n`
          
          // Campos recomendados
          xml += `      <g:brand>${escapeXml(brand)}</g:brand>\n`
          
          // product_type: categoría personalizada
          if (product.category?.name) {
            xml += `      <g:product_type>${escapeXml(category)}</g:product_type>\n`
          }
          
          // Información adicional de la variante
          if (variant.color_name) {
            xml += `      <g:color>${escapeXml(variant.color_name)}</g:color>\n`
          }
          
          // MPN (Manufacturer Part Number) o SKU
          if (variant.aikon_id) {
            xml += `      <g:mpn>${escapeXml(variant.aikon_id)}</g:mpn>\n`
          } else {
            // Si no hay MPN, usar el ID de la variante como GTIN alternativo
            xml += `      <g:identifier_exists>no</g:identifier_exists>\n`
          }
          
          // Agregar imágenes adicionales si están disponibles
          if (Array.isArray(product.images) && product.images.length > 1) {
            product.images.slice(1, 6).forEach((img: string) => {
              const additionalImageUrl = getFullImageUrl(img, fullBaseUrl)
              if (additionalImageUrl) {
                xml += `      <g:additional_image_link>${escapeXml(additionalImageUrl)}</g:additional_image_link>\n`
              }
            })
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
        let description = product.description || product.name || ''
        
        // Limitar descripción a 5000 caracteres
        if (description.length > 5000) {
          description = description.substring(0, 4997) + '...'
        }

        // Campos requeridos por Google Merchant Center
        // Usar prefijo 'p-' para productos sin variantes para evitar colisión con IDs de variantes
        xml += `    <item>\n`
        xml += `      <g:id>p-${product.id}</g:id>\n`
        xml += `      <g:title>${escapeXml(product.name)}</g:title>\n`
        xml += `      <g:description>${escapeXml(description)}</g:description>\n`
        xml += `      <g:link>${escapeXml(productUrl)}</g:link>\n`
        
        const finalImageUrl = imageUrl || `${fullBaseUrl}/images/products/placeholder.svg`
        xml += `      <g:image_link>${escapeXml(finalImageUrl)}</g:image_link>\n`
        
        xml += `      <g:price>${price.toFixed(2)} ARS</g:price>\n`
        xml += `      <g:availability>${availability}</g:availability>\n`
        xml += `      <g:condition>new</g:condition>\n`
        
        const googleCategory = getGoogleProductCategory(category)
        xml += `      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>\n`
        
        // Campos recomendados
        xml += `      <g:brand>${escapeXml(brand)}</g:brand>\n`
        
        if (product.category?.name) {
          xml += `      <g:product_type>${escapeXml(category)}</g:product_type>\n`
        }
        
        // Si no hay MPN/GTIN, indicar que no existe
        xml += `      <g:identifier_exists>no</g:identifier_exists>\n`
        
        // Agregar imágenes adicionales si están disponibles
        if (Array.isArray(product.images) && product.images.length > 1) {
          product.images.slice(1, 6).forEach((img: string) => {
            const additionalImageUrl = getFullImageUrl(img, fullBaseUrl)
            if (additionalImageUrl) {
              xml += `      <g:additional_image_link>${escapeXml(additionalImageUrl)}</g:additional_image_link>\n`
            }
          })
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
    console.error('Error generando feed XML para Google Merchant Center:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

