/**
 * Sistema Unificado de Texturas para Colores
 * 
 * Centraliza la generación de estilos CSS para diferentes tipos de texturas
 * utilizadas en ProductCard, ShopDetailModal y AdvancedColorPicker.
 */

import type { CSSProperties } from 'react'

// ===================================
// TIPOS
// ===================================

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

// ===================================
// UTILIDADES DE COLOR
// ===================================

/**
 * Oscurece un color hex por un factor dado
 */
export const darkenHex = (hex: string, factor: number = 0.35): string => {
  // Remover # si existe
  const cleanHex = hex.replace('#', '')
  
  // Parsear componentes RGB
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  
  // Oscurecer
  const darkerR = Math.round(r * (1 - factor))
  const darkerG = Math.round(g * (1 - factor))
  const darkerB = Math.round(b * (1 - factor))
  
  return `rgb(${darkerR}, ${darkerG}, ${darkerB})`
}

/**
 * Aclara un color hex por un factor dado
 */
export const lightenHex = (hex: string, factor: number = 0.2): string => {
  const cleanHex = hex.replace('#', '')
  
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  
  const lighterR = Math.round(r + (255 - r) * factor)
  const lighterG = Math.round(g + (255 - g) * factor)
  const lighterB = Math.round(b + (255 - b) * factor)
  
  return `rgb(${lighterR}, ${lighterG}, ${lighterB})`
}

// ===================================
// GENERADORES DE TEXTURAS
// ===================================

/**
 * Estilos base que se aplican a todas las texturas
 * para contener los efectos dentro del pill
 */
const BASE_STYLE: CSSProperties = {
  overflow: 'hidden',
  position: 'relative',
}

/**
 * Generadores de estilos CSS para cada tipo de textura
 * NOTA: Efectos reducidos para que el color sea visible
 */
export const TEXTURE_GENERATORS: Record<TextureType, (hex: string) => CSSProperties> = {
  /**
   * Sin efecto - solo color sólido
   */
  solid: (hex: string) => ({
    ...BASE_STYLE,
    backgroundColor: hex,
    boxShadow: hex.toUpperCase() === '#FFFFFF' ? 'inset 0 0 0 1px #E5E7EB' : 'none',
  }),

  /**
   * Textura de madera con vetas verticales para impregnantes
   * Efecto SUTIL - el color debe ser visible
   */
  wood: (hex: string) => {
    const darker = darkenHex(hex, 0.25)
    return {
      ...BASE_STYLE,
      backgroundColor: hex,
      backgroundImage: [
        // Vetas verticales sutiles
        `repeating-linear-gradient(90deg, ${darker} 0 1px, transparent 1px 8px)`,
        // Vetas secundarias más finas
        `repeating-linear-gradient(95deg, ${darker} 0 1px, transparent 1px 12px)`,
      ].join(', '),
      backgroundSize: '10px 100%, 14px 100%',
      backgroundBlendMode: 'multiply' as const,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
    }
  },

  /**
   * Efecto metalizado SUTIL para pinturas metalizadas
   * Líneas horizontales suaves que no ocultan el color
   */
  metallic: (hex: string) => {
    const lighter = lightenHex(hex, 0.25)
    return {
      ...BASE_STYLE,
      backgroundColor: hex,
      backgroundImage: [
        // Gradiente sutil de metal
        `linear-gradient(135deg, ${lighter} 0%, ${hex} 50%, ${lighter} 100%)`,
        // Líneas horizontales muy sutiles
        `repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 3px)`,
      ].join(', '),
      backgroundSize: '100% 100%, 100% 4px',
      backgroundBlendMode: 'overlay' as const,
      boxShadow: [
        'inset 0 1px 2px rgba(255,255,255,0.4)',
        'inset 0 -1px 2px rgba(0,0,0,0.15)',
      ].join(', '),
    }
  },

  /**
   * Textura rugosa mate tipo pintura a la tiza (chalk paint)
   * Efecto SUTIL de textura granulada
   */
  chalk: (hex: string) => {
    const darker = darkenHex(hex, 0.1)
    return {
      ...BASE_STYLE,
      backgroundColor: hex,
      backgroundImage: [
        // Textura granulada sutil
        `repeating-radial-gradient(circle at 30% 30%, ${darker} 0px, transparent 1px, transparent 4px)`,
        `repeating-radial-gradient(circle at 70% 70%, ${darker} 0px, transparent 1px, transparent 5px)`,
      ].join(', '),
      backgroundSize: '8px 8px, 10px 10px',
      backgroundBlendMode: 'multiply' as const,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
      filter: 'saturate(0.95)',
    }
  },

  /**
   * Efecto perlado iridiscente SUTIL
   */
  pearl: (hex: string) => ({
    ...BASE_STYLE,
    backgroundColor: hex,
    backgroundImage: [
      'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,200,220,0.1) 50%, rgba(200,220,255,0.1) 100%)',
    ].join(', '),
    backgroundSize: '100% 100%',
    backgroundBlendMode: 'overlay' as const,
    boxShadow: 'inset 0 1px 3px rgba(255,255,255,0.3)',
  }),

  /**
   * Brillo intenso SUTIL para brillante
   */
  gloss: (hex: string) => ({
    ...BASE_STYLE,
    backgroundColor: hex,
    backgroundImage: [
      'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%, rgba(0,0,0,0.03) 100%)',
    ].join(', '),
    backgroundSize: '100% 100%',
    backgroundBlendMode: 'overlay' as const,
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.5)',
  }),

  /**
   * Brillo suave satinado SUTIL
   */
  satin: (hex: string) => ({
    ...BASE_STYLE,
    backgroundColor: hex,
    backgroundImage: [
      'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.02) 100%)',
    ].join(', '),
    backgroundSize: '100% 100%',
    backgroundBlendMode: 'soft-light' as const,
    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.2)',
  }),

  /**
   * Acabado completamente mate (sin brillo)
   */
  matte: (hex: string) => ({
    ...BASE_STYLE,
    backgroundColor: hex,
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)',
    filter: 'saturate(0.98)',
  }),

  /**
   * Efecto transparente/vidrio para incoloro
   */
  transparent: (hex: string) => ({
    ...BASE_STYLE,
    backgroundColor: hex || 'rgba(245,245,245,0.85)',
    backgroundImage: [
      // Patrón de transparencia (cuadritos) sutil
      'repeating-linear-gradient(45deg, rgba(200,200,200,0.15) 0px, rgba(200,200,200,0.15) 2px, transparent 2px, transparent 4px)',
    ].join(', '),
    backgroundSize: '6px 6px',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
  }),

  /**
   * Efecto neón/fluorescente para colores fluo
   * Glow exterior contenido
   */
  fluo: (hex: string) => {
    const lighter = lightenHex(hex, 0.2)
    return {
      ...BASE_STYLE,
      backgroundColor: hex,
      backgroundImage: [
        `radial-gradient(ellipse at 50% 30%, ${lighter} 0%, ${hex} 70%)`,
      ].join(', '),
      backgroundSize: '100% 100%',
      boxShadow: [
        `0 0 4px ${hex}`,
        'inset 0 1px 2px rgba(255,255,255,0.4)',
      ].join(', '),
      filter: 'saturate(1.15) brightness(1.02)',
    }
  },

  /**
   * Efecto óxido/hierro antiguo para acabado rústico
   * Simula metal oxidado con textura irregular
   */
  rustic: (hex: string) => {
    const darker = darkenHex(hex, 0.2)
    const lighter = lightenHex(hex, 0.15)
    return {
      ...BASE_STYLE,
      backgroundColor: hex,
      backgroundImage: [
        // Manchas irregulares de óxido
        `radial-gradient(ellipse at 20% 30%, ${darker} 0%, transparent 40%)`,
        `radial-gradient(ellipse at 70% 60%, ${lighter} 0%, transparent 35%)`,
        `radial-gradient(ellipse at 50% 80%, ${darker} 0%, transparent 30%)`,
        // Textura granulada de óxido
        `repeating-radial-gradient(circle at 40% 40%, ${darker} 0px, transparent 1px, transparent 3px)`,
      ].join(', '),
      backgroundSize: '100% 100%, 100% 100%, 100% 100%, 5px 5px',
      backgroundBlendMode: 'multiply' as const,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
      filter: 'saturate(0.9) contrast(1.05)',
    }
  },
}

// ===================================
// MAPEO PRODUCTO -> TEXTURA
// ===================================

/**
 * Mapeo de tipos de producto a su textura correspondiente
 * NOTA: barnices NO usa gloss para no afectar colores de madera
 */
export const PRODUCT_TYPE_TEXTURES: Record<string, TextureType> = {
  'impregnante-madera': 'wood',
  'barnices': 'solid',          // Sin efecto para barnices (madera)
  'esmalte-sintetico': 'satin',
  'pinturas-latex': 'matte',
  'pintura-tiza': 'chalk',
  'metalizado': 'metallic',
  'perlado': 'pearl',
  // Otros tipos usan 'solid' por defecto
}

// ===================================
// MAPEO FINISH (ACABADO) -> TEXTURA
// ===================================

/**
 * Mapeo de acabados/terminaciones de variantes a su textura correspondiente
 * Basado en los valores de finish en product_variants de la DB
 */
export const FINISH_TEXTURES: Record<string, TextureType> = {
  // Acabados principales
  'brillante': 'gloss',
  'satinado': 'satin',
  'mate': 'matte',
  'a la tiza': 'chalk',
  'metálico': 'metallic',
  'metalico': 'metallic', // Sin tilde
  'fluo': 'fluo',
  'fluorescente': 'fluo',
  // Acabados secundarios
  'rústico': 'rustic',       // ✅ Efecto óxido, no madera
  'rustico': 'rustic',       // Sin tilde
  'hierro antiguo': 'rustic', // Hierro antiguo también es óxido
  'antiguo': 'rustic',
  'oxidado': 'rustic',
  'cerámico': 'satin', // Similar a satinado
  'ceramico': 'satin',
  'natural': 'matte',
  'perlado': 'pearl',
  'nacarado': 'pearl',
  // Variantes de nombres
  'semi-brillante': 'satin',
  'semi brillante': 'satin',
  'alto brillo': 'gloss',
  'super mate': 'matte',
  'ultra mate': 'matte',
}

// ===================================
// FUNCIÓN PRINCIPAL
// ===================================

/**
 * Obtiene los estilos CSS para una textura específica
 * 
 * @param hex - Color en formato hexadecimal
 * @param textureType - Tipo de textura a aplicar (default: 'solid')
 * @returns Objeto con propiedades CSS para aplicar la textura
 * 
 * @example
 * ```tsx
 * const style = getTextureStyle('#8B4513', 'wood')
 * return <div style={style}>Color madera</div>
 * ```
 */
export function getTextureStyle(
  hex: string, 
  textureType: TextureType = 'solid'
): CSSProperties {
  const generator = TEXTURE_GENERATORS[textureType] || TEXTURE_GENERATORS.solid
  return generator(hex)
}

/**
 * Obtiene la textura apropiada basada en el tipo de producto
 * 
 * @param productTypeId - ID del tipo de producto
 * @returns El tipo de textura correspondiente
 * 
 * @example
 * ```tsx
 * const textureType = getTextureForProductType('impregnante-madera') // 'wood'
 * ```
 */
export function getTextureForProductType(productTypeId: string): TextureType {
  return PRODUCT_TYPE_TEXTURES[productTypeId] || 'solid'
}

/**
 * Obtiene la textura apropiada basada en el finish/acabado de la variante
 * 
 * @param finish - Acabado de la variante (ej: "Brillante", "Satinado", "Metálico")
 * @returns El tipo de textura correspondiente
 * 
 * @example
 * ```tsx
 * const textureType = getTextureForFinish('Metálico') // 'metallic'
 * const textureType = getTextureForFinish('A La Tiza') // 'chalk'
 * ```
 */
export function getTextureForFinish(finish: string | undefined | null): TextureType {
  if (!finish) return 'solid'
  const normalizedFinish = finish.toLowerCase().trim()
  return FINISH_TEXTURES[normalizedFinish] || 'solid'
}

/**
 * Detecta si un color debería usar textura transparente
 */
export function isTransparentColor(colorName: string): boolean {
  const normalizedName = colorName.toLowerCase()
  return (
    normalizedName === 'incoloro' ||
    normalizedName === 'transparente' ||
    normalizedName === 'cristal' ||
    normalizedName.includes('transparent')
  )
}

/**
 * Detecta si un color es blanco brillante
 */
export function isGlossWhite(colorName: string): boolean {
  const normalizedName = colorName.toLowerCase()
  return (
    normalizedName === 'blanco brillante' ||
    normalizedName === 'blanco-brillante' ||
    normalizedName.includes('brillante')
  )
}

/**
 * Detecta si un color es blanco satinado
 */
export function isSatinWhite(colorName: string): boolean {
  const normalizedName = colorName.toLowerCase()
  return (
    normalizedName === 'blanco satinado' ||
    normalizedName === 'blanco-satinado' ||
    normalizedName.includes('satinado')
  )
}

/**
 * Infiere el tipo de textura basándose en el nombre del color
 * Útil cuando no se conoce el tipo de producto
 */
export function inferTextureFromColorName(colorName: string): TextureType {
  if (isTransparentColor(colorName)) return 'transparent'
  if (isGlossWhite(colorName)) return 'gloss'
  if (isSatinWhite(colorName)) return 'satin'
  return 'solid'
}
