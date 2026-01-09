/**
 * Utilidades de manipulación de color para el Sistema de Texturas
 */

/**
 * Oscurece un color hex por un factor dado
 * @param hex - Color en formato hexadecimal (ej: "#8B4513")
 * @param factor - Factor de oscurecimiento (0-1, default: 0.35)
 * @returns Color en formato rgb()
 */
export function darkenHex(hex: string, factor: number = 0.35): string {
  const cleanHex = hex.replace('#', '')
  
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  
  const darkerR = Math.round(r * (1 - factor))
  const darkerG = Math.round(g * (1 - factor))
  const darkerB = Math.round(b * (1 - factor))
  
  return `rgb(${darkerR}, ${darkerG}, ${darkerB})`
}

/**
 * Aclara un color hex por un factor dado
 * @param hex - Color en formato hexadecimal (ej: "#8B4513")
 * @param factor - Factor de aclarado (0-1, default: 0.2)
 * @returns Color en formato rgb()
 */
export function lightenHex(hex: string, factor: number = 0.2): string {
  const cleanHex = hex.replace('#', '')
  
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  
  const lighterR = Math.round(r + (255 - r) * factor)
  const lighterG = Math.round(g + (255 - g) * factor)
  const lighterB = Math.round(b + (255 - b) * factor)
  
  return `rgb(${lighterR}, ${lighterG}, ${lighterB})`
}
