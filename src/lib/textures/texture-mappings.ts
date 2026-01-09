/**
 * Mapeos de datos a texturas
 * 
 * Este archivo centraliza las relaciones entre:
 * - Finish/acabado → Textura
 * - Tipo de producto → Textura
 * 
 * Fácil de extender sin modificar lógica de código
 */

import type { TextureType } from './types'

/**
 * Mapeo de acabados/terminaciones a su textura correspondiente
 * Basado en los valores de `finish` en product_variants de la DB
 * 
 * @example
 * // Para agregar un nuevo finish:
 * 'nuevo-finish': 'textura-correspondiente',
 */
export const FINISH_TO_TEXTURE: Record<string, TextureType> = {
  // ═══════════════════════════════════════
  // ACABADOS PRINCIPALES
  // ═══════════════════════════════════════
  'brillante': 'gloss',
  'satinado': 'satin',
  'mate': 'matte',
  'a la tiza': 'chalk',
  'metálico': 'metallic',
  'metalico': 'metallic',     // Sin tilde
  'fluo': 'fluo',
  'fluorescente': 'fluo',

  // ═══════════════════════════════════════
  // ACABADOS RÚSTICOS/ÓXIDO
  // ═══════════════════════════════════════
  'rústico': 'rustic',
  'rustico': 'rustic',        // Sin tilde
  'hierro antiguo': 'rustic',
  'antiguo': 'rustic',
  'oxidado': 'rustic',

  // ═══════════════════════════════════════
  // ACABADOS ESPECIALES
  // ═══════════════════════════════════════
  'cerámico': 'satin',        // Similar a satinado
  'ceramico': 'satin',
  'natural': 'matte',
  'perlado': 'pearl',
  'nacarado': 'pearl',

  // ═══════════════════════════════════════
  // VARIANTES DE NOMBRES
  // ═══════════════════════════════════════
  'semi-brillante': 'satin',
  'semi brillante': 'satin',
  'alto brillo': 'gloss',
  'super mate': 'matte',
  'ultra mate': 'matte',
}

/**
 * Mapeo de tipos de producto a su textura por defecto
 * 
 * NOTA: barnices NO usa gloss para no afectar colores de madera
 */
export const PRODUCT_TYPE_TO_TEXTURE: Record<string, TextureType> = {
  'impregnante-madera': 'wood',
  'barnices': 'solid',          // Sin efecto para barnices (madera)
  'esmalte-sintetico': 'satin',
  'pinturas-latex': 'matte',
  'pintura-tiza': 'chalk',
  'metalizado': 'metallic',
  'perlado': 'pearl',
  // Otros tipos usan 'solid' por defecto
}

/**
 * Obtiene la textura correspondiente a un finish
 * @param finish - Nombre del finish/acabado
 * @returns Tipo de textura o 'solid' si no hay mapeo
 */
export function getTextureFromFinish(finish: string | undefined | null): TextureType {
  if (!finish) return 'solid'
  const normalized = finish.toLowerCase().trim()
  return FINISH_TO_TEXTURE[normalized] || 'solid'
}

/**
 * Obtiene la textura correspondiente a un tipo de producto
 * @param productTypeId - ID del tipo de producto
 * @returns Tipo de textura o 'solid' si no hay mapeo
 */
export function getTextureFromProductType(productTypeId: string): TextureType {
  return PRODUCT_TYPE_TO_TEXTURE[productTypeId] || 'solid'
}
