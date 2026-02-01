// ===================================
// PINTEYA E-COMMERCE - API DE PRODUCTOS RELACIONADOS
// ===================================

import { supabase } from '@/lib/supabase'
import { ProductWithCategory, PaginatedResponse } from '@/types/api'
import { logError } from '@/lib/error-handling/centralized-error-handler'
import { safeApiResponseJson } from '@/lib/json-utils'
import { getApiTenantHeaders } from '@/lib/api/products'

export interface RelatedProduct {
  id: number
  name: string
  measure: string
  price: string
  discounted_price?: string
  stock?: number
  /** URL de imagen cuando viene de la API (opcional) */
  image?: string
  /** Slug cuando viene de la API (para enlaces) */
  slug?: string
  /** Variantes cuando viene de la API (para pills y selector) */
  variants?: any[]
  /** Variante por defecto cuando viene de la API (precio/medida para el card) */
  default_variant?: { measure?: string; price_list?: number; price_sale?: number; stock?: number; [key: string]: unknown } | null
  /** Marca cuando viene de la API */
  brand?: string
}

export interface ProductGroup {
  baseName: string
  selectedProduct: RelatedProduct
  products: RelatedProduct[]
}

/**
 * Extrae el nombre base del producto removiendo la medida
 * Ejemplo: "Cinta Papel Blanca 18mm" -> "Cinta Papel Blanca"
 */
export function extractBaseName(productName: string): string {
  // Remover medidas comunes al final del nombre
  const measurePatterns = [
    /\s+\d+mm$/i,           // 18mm, 24mm, etc.
    /\s+\d+cm$/i,           // 5cm, 10cm, etc.
    /\s+\d+x\d+$/i,         // 5x10, 10x15, etc.
    /\s+\d+"\s*$/i,         // 2", 3", etc.
    /\s+\d+\s*pulgadas?$/i, // 2 pulgadas, 3 pulgada, etc.
    /\s+\d+\s*litros?$/i,   // 1 litro, 4 litros, etc.
    /\s+\d+\s*lts?$/i,      // 1 lt, 4 lts, etc.
    /\s*\d+\s*L$/i,         // 1L, 4L, 20L (con o sin espacio)
    /\s+\d+\s*kg$/i,        // 1kg, 5kg, etc.
    /\s*\d+\s*KG$/i,        // 1KG, 5KG (con o sin espacio)
    /\s+\d+\s*gr?$/i,       // 500g, 1000gr, etc.
  ]
  
  let baseName = productName.trim()
  
  for (const pattern of measurePatterns) {
    baseName = baseName.replace(pattern, '')
  }
  
  return baseName.trim()
}

/**
 * Extrae la primera URL de imagen desde el campo images (JSONB o string)
 */
export function extractImageFromJsonb(images: unknown): string | null {
  if (images == null) return null
  if (typeof images === 'string') {
    const trimmed = images.trim()
    if (!trimmed) return null
    if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('"')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown
        return extractImageFromJsonb(parsed)
      } catch {
        return trimmed || null
      }
    }
    return trimmed || null
  }
  if (Array.isArray(images)) return (images[0] as string)?.trim() || null
  if (typeof images === 'object') {
    const o = images as Record<string, unknown>
    return (o.url as string) || (o.previews as string[])?.[0] || (o.thumbnails as string[])?.[0] || (o.gallery as string[])?.[0] || (o.main as string) || null
  }
  return null
}

/**
 * Extrae la medida del nombre del producto
 * Ejemplo: "Cinta Papel Blanca 18mm" -> "18mm"
 */
export function extractMeasure(productName: string): string {
  const measurePatterns = [
    /(\d+mm)$/i,
    /(\d+cm)$/i,
    /(\d+x\d+)$/i,
    /(\d+")$/i,
    /(\d+\s*pulgadas?)$/i,
    /(\d+\s*litros?)$/i,
    /(\d+\s*lts?)$/i,
    /(\d+\s*L)$/i,      // 1L, 4L, 20L (con o sin espacio)
    /(\d+\s*kg)$/i,
    /(\d+\s*KG)$/i,     // 1KG, 5KG (con o sin espacio)
    /(\d+\s*gr?)$/i,
  ]
  
  for (const pattern of measurePatterns) {
    const match = productName.match(pattern)
    if (match) {
      return match[1]
    }
  }
  
  return ''
}

/**
 * Obtiene productos relacionados por nombre base
 */
export async function getRelatedProducts(productId: number): Promise<ProductGroup | null> {
  try {
    // Primero obtener el producto actual
    const { data: currentProduct, error: currentError } = await supabase
      .from('products')
      .select('id, name, price, discounted_price, medida, stock, brand')
      .eq('id', productId)
      .eq('is_active', true)
      .single()
    
    if (currentError || !currentProduct) {
      if (currentError) {
        // Usar el sistema centralizado de manejo de errores
        logError('Error obteniendo producto actual', {
          errorObject: currentError,
          errorString: JSON.stringify(currentError, null, 2),
          errorMessage: currentError?.message || 'Sin mensaje',
          errorCode: currentError?.code || 'Sin código',
          errorDetails: currentError?.details || 'Sin detalles',
          errorHint: currentError?.hint || 'Sin hint',
          productId,
          timestamp: new Date().toISOString()
        })
      } else {
        console.warn('Producto no encontrado o inactivo:', { productId })
      }
      return null
    }
    
    const baseName = extractBaseName(currentProduct.name)
    const currentMeasure = currentProduct.medida || extractMeasure(currentProduct.name)
    
    console.log('🔍 Buscando productos relacionados:', {
      productId,
      currentName: currentProduct.name,
      baseName,
      currentMeasure,
      medidaField: currentProduct.medida
    })
    
    // Buscar productos con nombre similar o exacto
    const { data: relatedProducts, error: relatedError } = await supabase
      .from('products')
      .select('id, name, price, discounted_price, medida, stock, brand, slug, images')
      .or(`name.ilike.%${baseName}%,name.eq.${currentProduct.name}`)
      .eq('is_active', true)
      .order('medida')
    
    console.log('🔍 Query SQL ejecutada:', {
      baseName,
      currentProductName: currentProduct.name,
      queryCondition: `name.ilike.%${baseName}%,name.eq.${currentProduct.name}`,
      resultCount: relatedProducts?.length || 0
    })
    
    if (relatedError) {
      logError('Error obteniendo productos relacionados:', relatedError)
      return null
    }
    
    if (!relatedProducts || relatedProducts.length <= 1) {
      console.log('🟡 Fallback: intentando buscar relacionados vía API /api/products usando baseName')

      try {
        const search = encodeURIComponent(baseName)
        const response = await fetch(`/api/products?search=${search}&limit=20`, {
          method: 'GET',
          headers: getApiTenantHeaders(),
        })

        const result = await safeApiResponseJson<PaginatedResponse<ProductWithCategory>>(response)
        if (!result.success || !result.data) {
          console.warn('Fallback /api/products sin resultados válidos:', result.error)
          return null
        }

        // PaginatedResponse tiene data: T[] (array directo), no data.data
        const apiProducts = Array.isArray(result.data) ? result.data : (result.data as any)?.data ?? []
        if (apiProducts.length <= 1) {
          console.log('Fallback /api/products: insuficientes productos para agrupar por medida')
          return null
        }

        // Construir lista de RelatedProduct desde API (precio, imagen, variantes y default_variant para el ProductCard)
        const products: RelatedProduct[] = apiProducts.map((p: any) => {
          const def = p.default_variant
          const priceVal =
            p.price ??
            p.discounted_price ??
            def?.price_sale ??
            def?.price_list ??
            p.price_sale ??
            p.price_list ??
            0
          const numPrice = Number(priceVal) || 0
          const discountNum = p.discounted_price != null ? Number(p.discounted_price) : (def?.price_sale ?? numPrice)
          const imageUrl = p.image_url ?? p.images?.previews?.[0] ?? p.images?.thumbnails?.[0] ?? p.image ?? ''
          return {
            id: p.id,
            name: p.name,
            measure: p.medida || def?.measure || extractMeasure(p.name) || 'Sin medida',
            price: String(numPrice),
            discounted_price: discountNum > 0 && discountNum < numPrice ? String(discountNum) : undefined,
            stock: typeof p.stock === 'number' ? p.stock : parseFloat(String(p.stock ?? 0)),
            image: imageUrl || undefined,
            slug: p.slug,
            variants: p.variants,
            default_variant: p.default_variant ?? null,
            brand: p.brand ?? undefined,
          }
        })

        const selectedProduct = products.find(pr => pr.id === productId) || products[0]

        console.log('✅ Fallback relacionados por API listo:', {
          baseName,
          totalProducts: products.length,
          selectedProduct: selectedProduct?.name,
          measures: products.map(p => p.measure),
        })

        return {
          baseName,
          selectedProduct,
          products,
        }
      } catch (fallbackError) {
        logError('Error en fallback getRelatedProducts vía /api/products', fallbackError)
        return null
      }
    }
    
    // Enriquecer con variantes e imágenes (igual que API) para que las tarjetas muestren precio, imagen y medida
    const productIds = relatedProducts.map(p => p.id)
    const { data: variants } = await supabase
      .from('product_variants')
      .select('id, product_id, measure, price_list, price_sale, stock, image_url, is_default')
      .in('product_id', productIds)
      .eq('is_active', true)
      .order('is_default', { ascending: false })

    const variantsByProduct = (variants || []).reduce((acc, v) => {
      if (!acc[v.product_id]) acc[v.product_id] = []
      acc[v.product_id].push(v)
      return acc
    }, {} as Record<number, { product_id: number; measure?: string; price_list?: number; price_sale?: number; stock?: number; image_url?: string; is_default?: boolean }[]>)

    const { data: productImagesData } = await supabase
      .from('product_images')
      .select('product_id, url, is_primary')
      .in('product_id', productIds)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true })

    const imageByProductId: Record<number, string | null> = {}
    productImagesData?.forEach((img: { product_id: number; url: string }) => {
      if (imageByProductId[img.product_id] == null) imageByProductId[img.product_id] = img.url
    })

    const products: RelatedProduct[] = relatedProducts.map(product => {
      const productVariants = variantsByProduct[product.id] || []
      const defaultVariant = productVariants.find((v: { is_default?: boolean }) => v.is_default) || productVariants[0]
      const numPrice = Number(product.price) || defaultVariant?.price_list || 0
      const numDiscount = product.discounted_price != null ? Number(product.discounted_price) : (defaultVariant?.price_sale ?? numPrice)
      const effectivePrice = numPrice > 0 ? numPrice : (defaultVariant?.price_list ?? 0)
      const effectiveDiscount = numDiscount > 0 && numDiscount < effectivePrice ? numDiscount : (defaultVariant?.price_sale != null && defaultVariant?.price_list != null && defaultVariant.price_sale < defaultVariant.price_list ? defaultVariant.price_sale : effectivePrice)
      const imageUrl = imageByProductId[product.id] ?? defaultVariant?.image_url ?? extractImageFromJsonb((product as any).images)
      const measure = (product.medida ?? defaultVariant?.measure ?? extractMeasure(product.name)) || 'Sin medida'
      const stock = typeof product.stock === 'number' ? product.stock : (defaultVariant?.stock ?? parseFloat(String(product.stock ?? 0)))
      return {
        id: product.id,
        name: product.name,
        measure,
        price: String(effectivePrice),
        discounted_price: effectiveDiscount < effectivePrice ? String(effectiveDiscount) : undefined,
        stock: Number(stock) || 0,
        brand: (product as any).brand ?? undefined,
        slug: (product as any).slug ?? undefined,
        image: imageUrl ?? undefined,
        variants: productVariants.length ? productVariants : undefined,
        default_variant: defaultVariant ? { measure: defaultVariant.measure, price_list: defaultVariant.price_list, price_sale: defaultVariant.price_sale, stock: defaultVariant.stock } : null,
      }
    })

    // Encontrar el producto seleccionado actual
    const selectedProduct = products.find(p => p.id === productId) || products[0]
    
    console.log('✅ Productos relacionados encontrados:', {
      baseName,
      totalProducts: products.length,
      selectedProduct: selectedProduct.name,
      measures: products.map(p => p.measure)
    })
    
    return {
      baseName,
      selectedProduct,
      products
    }
    
  } catch (error) {
    logError('Error en getRelatedProducts:', error)
    return null
  }
}

/**
 * Obtiene las medidas disponibles de una lista de productos relacionados
 */
export function getAvailableMeasures(products: RelatedProduct[]): string[] {
  const measures = products
    .map(product => product.measure)
    .filter(measure => measure && measure !== 'Sin medida')
    .filter((measure, index, self) => self.indexOf(measure) === index)
    .sort((a, b) => {
      // Extraer el primer número de la medida para ordenar
      const numA = parseInt(a.replace(/\D/g, ''))
      const numB = parseInt(b.replace(/\D/g, ''))
      return numA - numB
    })
  
  console.log('📏 getAvailableMeasures - Input products:', products.map(p => ({ id: p.id, name: p.name, measure: p.measure })))
  console.log('📏 getAvailableMeasures - Output measures:', measures)
  
  return measures
}

/**
 * Encuentra un producto por medida específica
 */
export function findProductByMeasure(products: RelatedProduct[], measure: string): RelatedProduct | null {
  const normalize = (v?: string | null): string => {
    if (!v) return ''
    const up = v.trim().toUpperCase()
    const noSpaces = up.replace(/\s+/g, '')
    const kg = noSpaces.replace(/(KGS|KILO|KILOS)$/i, 'KG')
    const l = kg.replace(/(LT|LTS|LITRO|LITROS)$/i, 'L')
    return l
  }
  const target = normalize(measure)
  return products.find(product => normalize(product.measure) === target) || null
}