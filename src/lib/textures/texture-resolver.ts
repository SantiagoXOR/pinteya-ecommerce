/**
 * Resolvedor de Texturas
 * 
 * Centraliza la lógica de prioridad para determinar qué textura aplicar.
 * Esta es la función principal que usan los componentes.
 */

import type { TextureType, TextureResolutionParams } from './types'
import { isTransparentColor, inferTextureFromColorName } from './color-detection'
import { getTextureFromFinish } from './texture-mappings'

/**
 * Resuelve qué textura aplicar según las reglas de prioridad.
 * 
 * ## Orden de Prioridad (de mayor a menor):
 * 
 * 1. **Incoloro/Transparente** → `'transparent'` (SIEMPRE)
 * 2. **Producto de madera** → `'wood'` (SIEMPRE)
 * 3. **Finish seleccionado** por usuario → textura dinámica
 * 4. **textureType explícito** del color
 * 5. **Finish de la variante** (de la DB)
 * 6. **Inferir del nombre** del color (fallback)
 * 
 * @param params - Parámetros para resolver la textura
 * @returns Tipo de textura a aplicar
 * 
 * @example
 * ```tsx
 * // En ColorPill
 * const textureType = resolveTextureType({
 *   colorName: colorData.name,
 *   colorTextureType: colorData.textureType,
 *   colorFinish: colorData.finish,
 *   isWoodProduct: isImpregnante,
 *   selectedFinish,
 * })
 * ```
 * 
 * @example
 * ```tsx
 * // En ColorSwatch
 * const textureType = resolveTextureType({
 *   colorName: color.name,
 *   colorCategory: color.category,
 *   colorTextureType: color.textureType,
 *   colorFinish: color.finish,
 *   selectedFinish,
 * })
 * ```
 */
export function resolveTextureType(params: TextureResolutionParams): TextureType {
  const { 
    colorName, 
    colorCategory, 
    colorTextureType, 
    colorFinish, 
    isWoodProduct, 
    selectedFinish 
  } = params

  // ═══════════════════════════════════════════════════════════
  // PRIORIDAD 1: Incoloro/Transparente → SIEMPRE transparent
  // ═══════════════════════════════════════════════════════════
  if (isTransparentColor(colorName)) {
    return 'transparent'
  }

  // ═══════════════════════════════════════════════════════════
  // PRIORIDAD 2: Productos de madera → SIEMPRE wood
  // ═══════════════════════════════════════════════════════════
  if (isWoodProduct || colorCategory === 'Madera' || colorTextureType === 'wood') {
    return 'wood'
  }

  // ═══════════════════════════════════════════════════════════
  // PRIORIDAD 3: Finish seleccionado por usuario → DINÁMICO
  // ═══════════════════════════════════════════════════════════
  if (selectedFinish) {
    const texture = getTextureFromFinish(selectedFinish)
    if (texture !== 'solid') {
      return texture
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PRIORIDAD 4: textureType explícito del color
  // ═══════════════════════════════════════════════════════════
  if (colorTextureType) {
    return colorTextureType
  }

  // ═══════════════════════════════════════════════════════════
  // PRIORIDAD 5: Finish de la variante (de la DB)
  // ═══════════════════════════════════════════════════════════
  if (colorFinish) {
    const texture = getTextureFromFinish(colorFinish)
    if (texture !== 'solid') {
      return texture
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PRIORIDAD 6: Inferir del nombre del color (fallback)
  // ═══════════════════════════════════════════════════════════
  return inferTextureFromColorName(colorName)
}
