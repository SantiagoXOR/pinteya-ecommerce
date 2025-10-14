// ===================================
// PINTEYA E-COMMERCE - API DE PRODUCTOS RELACIONADOS
// ===================================

import { supabase } from '@/lib/supabase'
import { ProductWithCategory, PaginatedResponse } from '@/types/api'
import { logError } from '@/lib/error-handling/centralized-error-handler'
import { safeApiResponseJson } from '@/lib/json-utils'

export interface RelatedProduct {
  id: number
  name: string
  measure: string
  price: string
  discounted_price?: string
  stock?: number
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
      .select('id, name, price, discounted_price, medida, stock')
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
      .select('id, name, price, discounted_price, medida, stock')
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
          headers: { 'Content-Type': 'application/json' },
        })

        const result = await safeApiResponseJson<PaginatedResponse<ProductWithCategory>>(response)
        if (!result.success || !result.data) {
          console.warn('Fallback /api/products sin resultados válidos:', result.error)
          return null
        }

        const apiProducts = result.data.data || []
        if (apiProducts.length <= 1) {
          console.log('Fallback /api/products: insuficientes productos para agrupar por medida')
          return null
        }

        // Construir lista de RelatedProduct desde API
        const products: RelatedProduct[] = apiProducts.map(p => ({
          id: p.id,
          name: p.name,
          measure: (p as any).medida || extractMeasure(p.name) || 'Sin medida',
          price: String((p as any).price ?? 0),
          discounted_price: (p as any).discounted_price != null ? String((p as any).discounted_price) : undefined,
          stock: typeof (p as any).stock === 'number' ? (p as any).stock : parseFloat(String((p as any).stock ?? 0)),
        }))

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
    
    // Convertir a RelatedProduct usando el campo medida de la base de datos
    const products: RelatedProduct[] = relatedProducts.map(product => ({
      id: product.id,
      name: product.name,
      measure: product.medida || extractMeasure(product.name) || 'Sin medida',
      price: product.price.toString(),
      discounted_price: product.discounted_price?.toString(),
      stock: typeof product.stock === 'number' ? product.stock : parseFloat(String(product.stock ?? 0))
    }))
    
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