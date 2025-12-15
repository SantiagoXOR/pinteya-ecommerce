/**
 * Utilidades para generar texturas CSS en ProductCard
 */

import type React from 'react'

/**
 * Genera textura de madera para impregnantes
 */
export const getWoodTexture = (hex: string, darker: string): React.CSSProperties => {
  return {
    backgroundImage: [
      'linear-gradient(0deg, rgba(255,255,255,0.05), rgba(255,255,255,0.05))',
      `repeating-linear-gradient(90deg, ${darker} 0 2px, transparent 2px 10px)`,
      `repeating-linear-gradient(100deg, ${darker} 0 1px, transparent 1px 8px)`,
      `radial-gradient(ellipse at 30% 45%, ${darker.replace('rgb','rgba').replace(')',',0.18)')} 0 3px, rgba(0,0,0,0) 4px)`,
      'radial-gradient(ellipse at 70% 65%, rgba(255,255,255,0.08) 0 2px, rgba(255,255,255,0) 3px)'
    ].join(', '),
    backgroundSize: '100% 100%, 12px 100%, 14px 100%, 100% 100%, 100% 100%',
    backgroundBlendMode: 'multiply' as const
  }
}

/**
 * Genera textura gloss para blanco brillante
 */
export const getGlossTexture = (isBlancoBrillante: boolean, isSelected: boolean): React.CSSProperties => {
  if (!isBlancoBrillante || isSelected) return {}
  
  return {
    backgroundImage: [
      'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 50%, rgba(0,0,0,0.05) 100%)',
      'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
      'radial-gradient(ellipse at top, rgba(255,255,255,0.6) 0%, transparent 50%)'
    ].join(', '),
    backgroundSize: '100% 100%, 20px 20px, 100% 100%',
    backgroundBlendMode: 'overlay' as const
  }
}

/**
 * Genera textura satinada para blanco satinado
 */
export const getSatinTexture = (isBlancoSatinado: boolean, isSelected: boolean): React.CSSProperties => {
  if (!isBlancoSatinado || isSelected) return {}
  
  return {
    backgroundImage: [
      'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 50%, rgba(0,0,0,0.02) 100%)',
      'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%)',
      'radial-gradient(ellipse at top, rgba(255,255,255,0.3) 0%, transparent 50%)'
    ].join(', '),
    backgroundSize: '100% 100%, 30px 30px, 100% 100%',
    backgroundBlendMode: 'soft-light' as const
  }
}

/**
 * Genera textura para colores transparentes/incoloros
 */
export const getTransparentTexture = (): React.CSSProperties => {
  return {
    backgroundImage: 'repeating-linear-gradient(45deg, rgba(200,200,200,0.3) 0px, rgba(200,200,200,0.3) 2px, transparent 2px, transparent 4px)'
  }
}

/**
 * Combina múltiples texturas en un solo objeto de estilos
 */
export const combineTextures = (
  ...textures: React.CSSProperties[]
): React.CSSProperties => {
  const nonEmpty = textures.filter(t => Object.keys(t).length > 0)
  if (nonEmpty.length === 0) return {}
  if (nonEmpty.length === 1) return nonEmpty[0]
  
  // Para múltiples texturas, combinar backgroundImage
  const backgroundImages: string[] = []
  let finalSize = ''
  let finalBlendMode: React.CSSProperties['backgroundBlendMode'] = undefined
  
  for (const texture of nonEmpty) {
    if (texture.backgroundImage) {
      backgroundImages.push(texture.backgroundImage as string)
    }
    if (texture.backgroundSize) {
      finalSize = texture.backgroundSize as string
    }
    if (texture.backgroundBlendMode) {
      finalBlendMode = texture.backgroundBlendMode
    }
  }
  
  return {
    backgroundImage: backgroundImages.join(', '),
    backgroundSize: finalSize,
    backgroundBlendMode: finalBlendMode
  }
}

