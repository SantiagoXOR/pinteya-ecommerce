/**
 * Funciones de detección de colores especiales
 * Determina si un color necesita una textura específica basándose en su nombre
 */

import type { TextureType } from './types'

/**
 * Detecta si un color debería usar textura transparente
 * @param colorName - Nombre del color
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
 * @param colorName - Nombre del color
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
 * @param colorName - Nombre del color
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
 * Útil como fallback cuando no hay otra información disponible
 * @param colorName - Nombre del color
 */
export function inferTextureFromColorName(colorName: string): TextureType {
  if (isTransparentColor(colorName)) return 'transparent'
  if (isGlossWhite(colorName)) return 'gloss'
  if (isSatinWhite(colorName)) return 'satin'
  return 'solid'
}
