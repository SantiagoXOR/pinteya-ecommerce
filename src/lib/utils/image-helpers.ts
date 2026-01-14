// ===================================
// PINTEYA E-COMMERCE - HELPERS DE IMÁGENES
// ===================================
// ⚠️ DEPRECADO: Este archivo se mantiene solo para compatibilidad hacia atrás
// Todas las funciones ahora usan image-resolver.ts centralizado
// Este archivo será eliminado en una versión futura
// 
// NOTA: Este archivo NO debe ser importado directamente.
// Usa getValidImageUrl desde @/lib/adapters/product-adapter o 
// resolveProductImage desde @/components/ui/product-card-commercial/utils/image-resolver
//
// FIX HMR: Este archivo mantiene exportaciones explícitas para compatibilidad con Turbopack HMR

'use client'

import { resolveProductImage } from '@/components/ui/product-card-commercial/utils/image-resolver'
import type { ProductVariant } from '@/components/ui/product-card-commercial/types'

/**
 * @deprecated Usa resolveProductImage desde image-resolver.ts
 * Extrae la primera imagen válida de un producto, manejando múltiples formatos
 * @param images - Campo images del producto (puede ser array u objeto)
 * @param product - Producto completo (opcional, para buscar en variantes)
 * @returns URL de la primera imagen o placeholder
 */
export function getProductImage(images: any, product?: any): string {
  // Usar image-resolver.ts para mantener consistencia
  const imageSource = {
    image_url: null,
    default_variant: product?.default_variant || product?.variants?.[0] || null,
    variants: (product?.variants || []) as ProductVariant[],
    images: images || null,
    imgs: null
  }
  
  return resolveProductImage(imageSource, {
    logContext: 'image-helpers.getProductImage (deprecated)'
  })
}

/**
 * Valida y sanitiza una URL de imagen
 * También detecta y corrige URLs de Supabase malformadas
 * @param imageUrl - URL de imagen a validar
 * @returns URL válida o placeholder
 */
export function getValidImageUrl(imageUrl: string | undefined | null): string {
  if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.trim()) {
    return '/images/products/placeholder.svg'
  }
  
  const trimmed = imageUrl.trim()
  
  // 🛡️ PROTECCIÓN: Detectar y corregir hostname incorrecto de Supabase
  // Este problema puede ocurrir por extensiones del navegador o errores de red
  const incorrectHostname = 'aaklgwkpb.supabase.co'
  const correctHostname = 'aakzspzfulgftqlgwkpb.supabase.co'
  
  if (trimmed.includes(incorrectHostname)) {
    const correctedUrl = trimmed.replace(incorrectHostname, correctHostname)
    
    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getValidImageUrl] URL malformada detectada y corregida:', {
        original: trimmed,
        corrected: correctedUrl,
        issue: 'hostname_truncado'
      })
    }
    
    return correctedUrl
  }
  
  // Verificar que sea una URL válida
  try {
    new URL(trimmed)
    return trimmed
  } catch {
    return '/images/products/placeholder.svg'
  }
}

// FIX HMR: Exportaciones explícitas para compatibilidad con Turbopack
// Esto asegura que el módulo tenga un factory válido para HMR
export default {
  getProductImage,
  getValidImageUrl
}

