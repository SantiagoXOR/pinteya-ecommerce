/**
 * A11Y: Utilidades para verificar y mejorar contraste de colores
 * Fase 5: Optimización Performance Lighthouse - Accesibilidad
 * 
 * Cumple con WCAG 2.1 AA (4.5:1 para texto normal, 3:1 para texto grande)
 */

/**
 * Convierte color HEX a RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Calcula la luminancia relativa de un color RGB
 * https://www.w3.org/WAI/GL/wiki/Relative_luminance
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calcula el ratio de contraste entre dos colores
 * https://www.w3.org/WAI/GL/wiki/Contrast_ratio
 * 
 * @param color1 - Color de fondo en formato HEX
 * @param color2 - Color de texto en formato HEX
 * @returns Ratio de contraste (1:1 a 21:1)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    return 1 // Contraste mínimo si no se pueden parsear los colores
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Verifica si el contraste cumple con WCAG AA
 * 
 * @param foreground - Color de texto en formato HEX
 * @param background - Color de fondo en formato HEX
 * @param isLargeText - Si el texto es grande (18pt+ o 14pt+ bold)
 * @returns true si cumple WCAG AA
 */
export function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  const requiredRatio = isLargeText ? 3 : 4.5
  return ratio >= requiredRatio
}

/**
 * Verifica si el contraste cumple con WCAG AAA
 * 
 * @param foreground - Color de texto en formato HEX
 * @param background - Color de fondo en formato HEX
 * @param isLargeText - Si el texto es grande (18pt+ o 14pt+ bold)
 * @returns true si cumple WCAG AAA
 */
export function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background)
  const requiredRatio = isLargeText ? 4.5 : 7
  return ratio >= requiredRatio
}

/**
 * Ajusta un color para mejorar el contraste
 * 
 * @param color - Color base en formato HEX
 * @param targetRatio - Ratio de contraste objetivo
 * @param isDark - Si el color debe ser oscuro (true) o claro (false)
 * @returns Color ajustado en formato HEX
 */
export function adjustColorForContrast(
  color: string,
  targetRatio: number,
  isDark: boolean
): string {
  const rgb = hexToRgb(color)
  if (!rgb) return color

  // Ajustar luminancia para alcanzar el ratio objetivo
  // Esto es una aproximación simple
  const factor = isDark ? 0.1 : -0.1
  let adjusted = { ...rgb }

  for (let i = 0; i < 10; i++) {
    const ratio = getContrastRatio(
      `#${adjusted.r.toString(16).padStart(2, '0')}${adjusted.g.toString(16).padStart(2, '0')}${adjusted.b.toString(16).padStart(2, '0')}`,
      isDark ? '#000000' : '#ffffff'
    )

    if (ratio >= targetRatio) break

    adjusted.r = Math.max(0, Math.min(255, adjusted.r + (isDark ? -10 : 10)))
    adjusted.g = Math.max(0, Math.min(255, adjusted.g + (isDark ? -10 : 10)))
    adjusted.b = Math.max(0, Math.min(255, adjusted.b + (isDark ? -10 : 10)))
  }

  return `#${adjusted.r.toString(16).padStart(2, '0')}${adjusted.g.toString(16).padStart(2, '0')}${adjusted.b.toString(16).padStart(2, '0')}`
}

/**
 * Obtiene el mejor color de texto (blanco o negro) para un fondo dado
 * 
 * @param background - Color de fondo en formato HEX
 * @returns '#000000' o '#ffffff' según el mejor contraste
 */
export function getBestTextColor(background: string): string {
  const blackContrast = getContrastRatio('#000000', background)
  const whiteContrast = getContrastRatio('#ffffff', background)
  return blackContrast > whiteContrast ? '#000000' : '#ffffff'
}
