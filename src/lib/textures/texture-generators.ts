/**
 * Generadores de estilos CSS para cada tipo de textura
 * 
 * Cada generador recibe un color hex y retorna CSSProperties
 * con los estilos necesarios para simular la textura visualmente.
 */

import type { CSSProperties } from 'react'
import type { TextureType, TextureGeneratorFn } from './types'
import { darkenHex, lightenHex } from './utils'

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
 */
export const TEXTURE_GENERATORS: Record<TextureType, TextureGeneratorFn> = {
  /**
   * Sin efecto - solo color sólido
   */
  solid: (hex: string) => ({
    ...BASE_STYLE,
    backgroundColor: hex,
    boxShadow: hex.toUpperCase() === '#FFFFFF' ? 'inset 0 0 0 1px #E5E7EB' : 'none',
  }),

  /**
   * Textura de madera con vetas verticales
   * Solo vetas, sin efectos adicionales
   */
  wood: (hex: string) => {
    const darker = darkenHex(hex, 0.25)
    return {
      ...BASE_STYLE,
      backgroundColor: hex,
      backgroundImage: [
        `repeating-linear-gradient(90deg, ${darker} 0 1px, transparent 1px 8px)`,
        `repeating-linear-gradient(95deg, ${darker} 0 1px, transparent 1px 12px)`,
      ].join(', '),
      backgroundSize: '10px 100%, 14px 100%',
      backgroundBlendMode: 'multiply' as const,
    }
  },

  /**
   * Efecto metalizado sutil
   * Líneas horizontales suaves que no ocultan el color
   */
  metallic: (hex: string) => {
    const lighter = lightenHex(hex, 0.25)
    return {
      ...BASE_STYLE,
      backgroundColor: hex,
      backgroundImage: [
        `linear-gradient(135deg, ${lighter} 0%, ${hex} 50%, ${lighter} 100%)`,
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
   * Textura rugosa mate tipo pintura a la tiza
   * Efecto sutil de textura granulada
   */
  chalk: (hex: string) => {
    const darker = darkenHex(hex, 0.1)
    return {
      ...BASE_STYLE,
      backgroundColor: hex,
      backgroundImage: [
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
   * Efecto perlado iridiscente sutil
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
   * Brillo intenso sutil para brillante
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
   * Brillo suave satinado sutil
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
   * Líneas diagonales que simulan transparencia
   */
  transparent: (hex: string) => ({
    ...BASE_STYLE,
    backgroundColor: hex || 'rgba(245,245,245,0.85)',
    backgroundImage: [
      'repeating-linear-gradient(45deg, rgba(200,200,200,0.15) 0px, rgba(200,200,200,0.15) 2px, transparent 2px, transparent 4px)',
    ].join(', '),
    backgroundSize: '6px 6px',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
  }),

  /**
   * Efecto neón/fluorescente
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
   * Efecto óxido/hierro antiguo
   * Simula metal oxidado con textura irregular
   */
  rustic: (hex: string) => {
    const darker = darkenHex(hex, 0.2)
    const lighter = lightenHex(hex, 0.15)
    return {
      ...BASE_STYLE,
      backgroundColor: hex,
      backgroundImage: [
        `radial-gradient(ellipse at 20% 30%, ${darker} 0%, transparent 40%)`,
        `radial-gradient(ellipse at 70% 60%, ${lighter} 0%, transparent 35%)`,
        `radial-gradient(ellipse at 50% 80%, ${darker} 0%, transparent 30%)`,
        `repeating-radial-gradient(circle at 40% 40%, ${darker} 0px, transparent 1px, transparent 3px)`,
      ].join(', '),
      backgroundSize: '100% 100%, 100% 100%, 100% 100%, 5px 5px',
      backgroundBlendMode: 'multiply' as const,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.1)',
      filter: 'saturate(0.9) contrast(1.05)',
    }
  },
}

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
