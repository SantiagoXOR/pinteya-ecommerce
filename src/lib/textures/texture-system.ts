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
 * Generadores de estilos CSS para cada tipo de textura
 */
export const TEXTURE_GENERATORS: Record<TextureType, (hex: string) => CSSProperties> = {
  /**
   * Sin efecto - solo color sólido
   */
  solid: (hex: string) => ({
    backgroundColor: hex,
    boxShadow: hex.toUpperCase() === '#FFFFFF' ? 'inset 0 0 0 1px #E5E7EB' : 'none',
  }),

  /**
   * Textura de madera con vetas verticales para impregnantes
   * Restaurada la textura original con vetas a 90° que simula mejor la fibra de madera
   */
  wood: (hex: string) => {
    const darker = darkenHex(hex, 0.35)
    // Convertir darker rgb a rgba para el radial gradient
    const darkerRgba = darker.replace('rgb', 'rgba').replace(')', ', 0.18)')
    return {
      backgroundColor: hex,
      backgroundImage: [
        'linear-gradient(0deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05))',
        // Vetas verticales principales (90°) - simula la fibra de la madera
        `repeating-linear-gradient(90deg, ${darker} 0 2px, transparent 2px 10px)`,
        // Vetas secundarias ligeramente inclinadas (100°)
        `repeating-linear-gradient(100deg, ${darker} 0 1px, transparent 1px 8px)`,
        // Nudos sutiles
        `radial-gradient(ellipse at 30% 45%, ${darkerRgba} 0 3px, rgba(0,0,0,0) 4px)`,
        'radial-gradient(ellipse at 70% 65%, rgba(255,255,255,0.08) 0 2px, rgba(255,255,255,0) 3px)',
      ].join(', '),
      backgroundSize: '100% 100%, 12px 100%, 14px 100%, 100% 100%, 100% 100%',
      backgroundBlendMode: 'multiply' as const,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.10)',
    }
  },

  /**
   * Efecto metalizado con brillo para pinturas metalizadas
   * Simula metal cepillado con líneas horizontales y reflejos
   */
  metallic: (hex: string) => {
    const lighter = lightenHex(hex, 0.4)
    const darker = darkenHex(hex, 0.2)
    return {
      backgroundColor: hex,
      backgroundImage: [
        // Gradiente principal de metal
        `linear-gradient(135deg, ${lighter} 0%, ${hex} 25%, ${lighter} 50%, ${hex} 75%, ${lighter} 100%)`,
        // Líneas horizontales tipo metal cepillado
        `repeating-linear-gradient(90deg, ${darker} 0px, transparent 1px, transparent 2px)`,
        // Líneas secundarias más finas
        `repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 4px)`,
        // Reflejo superior brillante
        'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.6) 0%, transparent 50%)',
        // Reflejo lateral
        'radial-gradient(ellipse at 0% 50%, rgba(255,255,255,0.3) 0%, transparent 40%)',
      ].join(', '),
      backgroundSize: '100% 100%, 3px 100%, 5px 100%, 100% 60%, 40% 100%',
      backgroundBlendMode: 'overlay' as const,
      boxShadow: [
        'inset 0 2px 4px rgba(255,255,255,0.6)',
        'inset 0 -2px 4px rgba(0,0,0,0.3)',
        'inset 1px 0 2px rgba(255,255,255,0.2)',
        '0 1px 3px rgba(0,0,0,0.3)',
      ].join(', '),
    }
  },

  /**
   * Textura rugosa mate tipo pintura a la tiza (chalk paint)
   * Efecto de superficie porosa y sin brillo característico de chalk paint
   */
  chalk: (hex: string) => {
    const darker = darkenHex(hex, 0.15)
    return {
      backgroundColor: hex,
      backgroundImage: [
        // Ruido granulado más visible (SVG noise)
        'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.12\'/%3E%3C/svg%3E")',
        // Textura de poros/grano grueso
        `repeating-radial-gradient(circle at 25% 25%, ${darker} 0px, transparent 1px, transparent 3px)`,
        `repeating-radial-gradient(circle at 75% 75%, ${darker} 0px, transparent 1px, transparent 4px)`,
        // Textura rugosa diagonal
        'repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 1px, transparent 1px, transparent 2px)',
        'repeating-linear-gradient(-45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 3px)',
      ].join(', '),
      backgroundSize: '80px 80px, 6px 6px, 8px 8px, 3px 3px, 4px 4px',
      backgroundBlendMode: 'multiply' as const,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
      // Efecto mate sin brillo - desaturado ligeramente
      filter: 'saturate(0.92) brightness(0.98)',
    }
  },

  /**
   * Efecto perlado iridiscente
   */
  pearl: (hex: string) => ({
    backgroundColor: hex,
    backgroundImage: [
      'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,200,220,0.2) 25%, rgba(200,220,255,0.2) 50%, rgba(220,255,200,0.2) 75%, rgba(255,255,255,0.3) 100%)',
      'radial-gradient(ellipse at 25% 25%, rgba(255,255,255,0.6) 0%, transparent 50%)',
      'radial-gradient(ellipse at 75% 75%, rgba(255,240,250,0.4) 0%, transparent 50%)',
    ].join(', '),
    backgroundSize: '100% 100%, 80% 80%, 60% 60%',
    backgroundBlendMode: 'overlay' as const,
    boxShadow: [
      'inset 0 0 10px rgba(255,255,255,0.3)',
      '0 0 5px rgba(255,255,255,0.2)',
    ].join(', '),
  }),

  /**
   * Brillo intenso para blanco brillante
   */
  gloss: (hex: string) => ({
    backgroundColor: hex,
    backgroundImage: [
      'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.05) 100%)',
      'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
      'radial-gradient(ellipse at top, rgba(255,255,255,0.6) 0%, transparent 50%)',
    ].join(', '),
    backgroundSize: '100% 100%, 20px 20px, 100% 100%',
    backgroundBlendMode: 'overlay' as const,
    boxShadow: [
      'inset 0 1px 3px rgba(255,255,255,0.8)',
      '0 1px 2px rgba(0,0,0,0.1)',
    ].join(', '),
  }),

  /**
   * Brillo suave satinado
   */
  satin: (hex: string) => ({
    backgroundColor: hex,
    backgroundImage: [
      'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.02) 100%)',
      'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
      'radial-gradient(ellipse at top, rgba(255,255,255,0.3) 0%, transparent 50%)',
    ].join(', '),
    backgroundSize: '100% 100%, 30px 30px, 100% 100%',
    backgroundBlendMode: 'soft-light' as const,
    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)',
  }),

  /**
   * Acabado completamente mate (sin brillo)
   */
  matte: (hex: string) => ({
    backgroundColor: hex,
    backgroundImage: [
      'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.01) 100%)',
    ].join(', '),
    backgroundSize: '100% 100%',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.03)',
    // Sin brillo visual
    filter: 'saturate(0.98) brightness(0.99)',
  }),

  /**
   * Efecto transparente/vidrio para incoloro
   */
  transparent: (hex: string) => ({
    backgroundColor: hex || 'rgba(255,255,255,0.1)',
    backgroundImage: [
      'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.2) 100%)',
      'linear-gradient(45deg, rgba(255,255,255,0.6) 0%, transparent 30%, transparent 70%, rgba(255,255,255,0.3) 100%)',
      'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.5) 0%, transparent 50%)',
      'radial-gradient(ellipse at 70% 70%, rgba(255,255,255,0.3) 0%, transparent 60%)',
      // Patrón de transparencia (cuadritos)
      'repeating-linear-gradient(45deg, rgba(200,200,200,0.3) 0px, rgba(200,200,200,0.3) 2px, transparent 2px, transparent 4px)',
    ].join(', '),
    backgroundSize: '100% 100%, 100% 100%, 60% 60%, 50% 50%, 8px 8px',
    backgroundBlendMode: 'overlay' as const,
    boxShadow: [
      'inset 0 0 0 1px rgba(255,255,255,0.3)',
      '0 0 8px rgba(255,255,255,0.2)',
      'inset 0 1px 2px rgba(255,255,255,0.4)',
    ].join(', '),
  }),

  /**
   * Efecto neón/fluorescente para colores fluo
   * Simula el brillo intenso característico de pinturas fluorescentes
   */
  fluo: (hex: string) => {
    const lighter = lightenHex(hex, 0.3)
    return {
      backgroundColor: hex,
      backgroundImage: [
        // Brillo central intenso
        `radial-gradient(ellipse at 50% 50%, ${lighter} 0%, ${hex} 60%, ${hex} 100%)`,
        // Efecto de "glow" interno
        `radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.5) 0%, transparent 50%)`,
        // Borde luminoso
        `linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.1) 100%)`,
      ].join(', '),
      backgroundSize: '100% 100%, 100% 100%, 100% 100%',
      backgroundBlendMode: 'screen' as const,
      boxShadow: [
        // Glow exterior (efecto neón)
        `0 0 8px ${hex}`,
        `0 0 4px ${lighter}`,
        // Brillo interno
        'inset 0 1px 3px rgba(255,255,255,0.5)',
        'inset 0 -1px 2px rgba(0,0,0,0.1)',
      ].join(', '),
      // Aumentar saturación para efecto más vibrante
      filter: 'saturate(1.3) brightness(1.05)',
    }
  },
}

// ===================================
// MAPEO PRODUCTO -> TEXTURA
// ===================================

/**
 * Mapeo de tipos de producto a su textura correspondiente
 */
export const PRODUCT_TYPE_TEXTURES: Record<string, TextureType> = {
  'impregnante-madera': 'wood',
  'barnices': 'gloss',
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
  'rústico': 'wood',
  'rustico': 'wood', // Sin tilde
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
