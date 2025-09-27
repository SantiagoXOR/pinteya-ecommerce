// ===================================
// PINTEYA E-COMMERCE - API DE VARIANTES DE PRODUCTO
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient, handleSupabaseError } from '@/lib/integrations/supabase'
import { ApiResponse } from '@/types/api'

// Tipo para variante de producto
interface ProductVariant {
  id: number
  name: string
  price: string
  discounted_price: string | null
  capacity: string
  stock: number
  is_active: boolean
}

// Función para extraer capacidad del nombre del producto
function extractCapacity(productName: string): string {
  // Buscar patrones de capacidad más específicos
  const capacityMatch = productName.match(/(\d+(?:\.\d+)?)\s*(kg|L|litros?|galones?)/i)
  if (capacityMatch) {
    const value = capacityMatch[1]
    const unit = capacityMatch[2].toLowerCase()

    // Normalizar unidades
    if (unit === 'litros' || unit === 'litro') {
      return `${value}L`
    } else if (unit === 'galones' || unit === 'galon') {
      return `${value}gal`
    } else {
      return `${value}${unit}`
    }
  }

  return 'Sin especificar'
}

// Función para generar nombre base del producto
function generateBaseName(productName: string): string {
  return productName
    .replace(/\s*(\d+L|\d+\s*litros?|\d+\s*galones?)\s*/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ===================================
// GET /api/products/[id]/variants - Obtener variantes de un producto
// ===================================
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const id = parseInt(params.id, 10)

    if (isNaN(id) || id <= 0) {
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'ID de producto inválido',
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const supabase = getSupabaseClient()

    if (!supabase) {
      console.error('Cliente de Supabase no disponible en GET /api/products/[id]/variants')
      const errorResponse: ApiResponse<null> = {
        data: null,
        success: false,
        error: 'Servicio de base de datos no disponible',
      }
      return NextResponse.json(errorResponse, { status: 503 })
    }

    // Primero obtener el producto original
    const { data: originalProduct, error: originalError } = await supabase
      .from('products')
      .select('id, name, price, discounted_price, stock, is_active')
      .eq('id', id)
      .single()

    if (originalError) {
      if (originalError.code === 'PGRST116') {
        const notFoundResponse: ApiResponse<null> = {
          data: null,
          success: false,
          error: 'Producto no encontrado',
        }
        return NextResponse.json(notFoundResponse, { status: 404 })
      }
      handleSupabaseError(originalError, `GET /api/products/${id}/variants`)
    }

    // Generar nombre base para buscar variantes
    const baseName = generateBaseName(originalProduct.name)

    // Extraer marca y tipo del producto (ej: "Poximix Exterior" de "Poximix Exterior 5kg")
    const productParts = originalProduct.name.split(' ')
    let searchTerm = ''

    if (productParts.length >= 2) {
      // Para productos como "Poximix Exterior 5kg", usar "Poximix Exterior"
      searchTerm = productParts.slice(0, 2).join(' ')
    } else {
      // Fallback al nombre base
      searchTerm = baseName
    }

    // Buscar productos con nombres similares (variantes)
    const { data: variants, error: variantsError } = await supabase
      .from('products')
      .select('id, name, price, discounted_price, stock, is_active')
      .ilike('name', `${searchTerm}%`)
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (variantsError) {
      handleSupabaseError(variantsError, `GET /api/products/${id}/variants - variants search`)
    }

    // Filtrar y transformar variantes
    const processedVariants: ProductVariant[] = (variants || [])
      .map(variant => ({
        id: variant.id,
        name: variant.name,
        price: variant.price,
        discounted_price: variant.discounted_price,
        capacity: extractCapacity(variant.name),
        stock: variant.stock,
        is_active: variant.is_active,
      }))
      .sort((a, b) => {
        // Ordenar por capacidad numérica
        const aNum = parseInt(a.capacity.replace(/[^\d]/g, '')) || 0
        const bNum = parseInt(b.capacity.replace(/[^\d]/g, '')) || 0
        return aNum - bNum
      })

    // Si no se encontraron variantes, devolver solo el producto original
    if (processedVariants.length === 0) {
      processedVariants.push({
        id: originalProduct.id,
        name: originalProduct.name,
        price: originalProduct.price,
        discounted_price: originalProduct.discounted_price,
        capacity: extractCapacity(originalProduct.name),
        stock: originalProduct.stock,
        is_active: originalProduct.is_active,
      })
    }

    const response: ApiResponse<ProductVariant[]> = {
      data: processedVariants,
      success: true,
      message: `${processedVariants.length} variantes encontradas`,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error en GET /api/products/[id]/variants:', error)

    const errorResponse: ApiResponse<null> = {
      data: null,
      success: false,
      error: error.message || 'Error interno del servidor',
    }

    return NextResponse.json(errorResponse, { status: 500 })
  }
}
