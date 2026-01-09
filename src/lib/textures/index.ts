/**
 * Sistema Unificado de Texturas
 * 
 * Centraliza la generación de efectos visuales CSS para los selectores
 * de color (pills y swatches) en toda la aplicación.
 * 
 * @example
 * ```tsx
 * import { resolveTextureType, getTextureStyle } from '@/lib/textures'
 * 
 * const textureType = resolveTextureType({
 *   colorName: 'Caoba',
 *   isWoodProduct: true,
 * })
 * 
 * const style = getTextureStyle('#8B4513', textureType)
 * ```
 * 
 * @see docs/TEXTURE-SYSTEM.md para documentación completa
 */

// ═══════════════════════════════════════════════════════════
// TIPOS
// ═══════════════════════════════════════════════════════════
export type { 
  TextureType, 
  TextureResolutionParams,
  TextureGeneratorFn,
} from './types'

// ═══════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL - Resolver textura
// ═══════════════════════════════════════════════════════════
export { resolveTextureType } from './texture-resolver'

// ═══════════════════════════════════════════════════════════
// GENERADORES DE ESTILOS CSS
// ═══════════════════════════════════════════════════════════
export { getTextureStyle, TEXTURE_GENERATORS } from './texture-generators'

// ═══════════════════════════════════════════════════════════
// DETECCIÓN DE COLORES
// ═══════════════════════════════════════════════════════════
export { 
  isTransparentColor, 
  isGlossWhite, 
  isSatinWhite,
  inferTextureFromColorName,
} from './color-detection'

// ═══════════════════════════════════════════════════════════
// MAPEOS
// ═══════════════════════════════════════════════════════════
export { 
  FINISH_TO_TEXTURE,
  PRODUCT_TYPE_TO_TEXTURE,
  getTextureFromFinish,
  getTextureFromProductType,
} from './texture-mappings'

// ═══════════════════════════════════════════════════════════
// UTILIDADES DE COLOR
// ═══════════════════════════════════════════════════════════
export { darkenHex, lightenHex } from './utils'

// ═══════════════════════════════════════════════════════════
// ALIASES PARA COMPATIBILIDAD CON CÓDIGO EXISTENTE
// ═══════════════════════════════════════════════════════════
export { getTextureFromFinish as getTextureForFinish } from './texture-mappings'
export { getTextureFromProductType as getTextureForProductType } from './texture-mappings'
