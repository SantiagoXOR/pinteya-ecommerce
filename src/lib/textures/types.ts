/**
 * Tipos centralizados para el Sistema de Texturas
 */

import type { CSSProperties } from 'react'

/**
 * Tipos de textura disponibles en el sistema
 */
export type TextureType = 
  | 'solid'       // Sin efecto (default)
  | 'wood'        // Vetas de madera para impregnantes
  | 'metallic'    // Efecto metalizado con brillo
  | 'chalk'       // Textura rugosa mate tipo pintura a la tiza
  | 'pearl'       // Efecto perlado iridiscente
  | 'gloss'       // Brillo intenso (blanco brillante)
  | 'satin'       // Brillo suave satinado
  | 'matte'       // Acabado completamente mate
  | 'transparent' // Efecto vidrio/cristal (incoloro)
  | 'fluo'        // Colores neón/fluorescentes
  | 'rustic'      // Efecto óxido/hierro antiguo

/**
 * Parámetros para resolver qué textura aplicar
 */
export interface TextureResolutionParams {
  /** Nombre del color (ej: "Incoloro", "Caoba") */
  colorName: string
  /** Categoría del color (ej: "Madera", "Sintético") */
  colorCategory?: string
  /** Tipo de textura explícito del color */
  colorTextureType?: TextureType
  /** Finish/acabado de la variante (ej: "Brillante") */
  colorFinish?: string
  /** Si es producto de madera (impregnante, barniz madera) */
  isWoodProduct?: boolean
  /** Finish actualmente seleccionado por el usuario */
  selectedFinish?: string
}

/**
 * Función generadora de estilos CSS para una textura
 */
export type TextureGeneratorFn = (hex: string) => CSSProperties
