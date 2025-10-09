// ===================================
// PINTEYA E-COMMERCE - API DE PRODUCTOS RELACIONADOS
// ===================================

import { supabase } from '@/lib/supabase'
import { ProductWithCategory } from '@/types/api'
import { logError } from '@/lib/error-handling/centralized-error-handler'

export interface RelatedProduct {
  id: number
  name: string
  measure: string
  price: string
  discounted_price?: string
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
    /\s+\d+\s*kg$/i,        // 1kg, 5kg, etc.
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
    /(\d+\s*kg)$/i,
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
      .select('id, name, price, discounted_price, medida')
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
      .select('id, name, price, discounted_price, medida')
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
      console.log('No se encontraron productos relacionados suficientes')
      return null
    }
    
    // Convertir a RelatedProduct usando el campo medida de la base de datos
    const products: RelatedProduct[] = relatedProducts.map(product => ({
      id: product.id,
      name: product.name,
      measure: product.medida || extractMeasure(product.name) || 'Sin medida',
      price: product.price.toString(),
      discounted_price: product.discounted_price?.toString()
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
  return products.find(product => product.measure === measure) || null
}