/**
 * Utilidades para manejo de colores en ProductCard
 */

// Mapa de colores: nombre -> hex
export const COLOR_MAP: Record<string, string> = {
  // Colores básicos (blanco con tono gris sutil para diferenciarlo del fondo)
  'blanco': '#F5F5F5',
  'white': '#F5F5F5',
  'negro': '#000000',
  'black': '#000000',
  'rojo': '#DC2626',
  'red': '#DC2626',
  'azul': '#2563EB',
  'blue': '#2563EB',
  'verde': '#16A34A',
  'green': '#16A34A',
  'amarillo': '#EAB308',
  'yellow': '#EAB308',
  'naranja': '#EA580C',
  'orange': '#EA580C',
  'gris': '#9CA3AF',
  'gray': '#9CA3AF',
  'grey': '#9CA3AF',
  'marron': '#92400E',
  'marrón': '#92400E',
  'brown': '#92400E',
  'rosa': '#EC4899',
  'pink': '#EC4899',
  'violeta': '#9333EA',
  'purple': '#9333EA',
  'celeste': '#38BDF8',
  'cyan': '#06B6D4',
  'turquesa': '#14B8A6',
  'teal': '#14B8A6',
  'beige': '#D4C5B9',
  'crema': '#FEF3C7',
  'cream': '#FEF3C7',
  
  // Tonos de madera (Impregnantes)
  'natural': '#D4A574',
  'roble': '#8B4513',
  'oak': '#8B4513',
  'caoba': '#6B3410',
  'mahogany': '#6B3410',
  'cedro': '#D2691E',
  'cedar': '#D2691E',
  'nogal': '#654321',
  'walnut': '#654321',
  'pino': '#DEB887',
  'pine': '#DEB887',
  'teca': '#8B7355',
  'teak': '#8B7355',
  'wengué': '#3C2415',
  'wenge': '#3C2415',
  'cerezo': '#8B4049',
  'cherry': '#8B4049',
  'alerce': '#B8956D',
  'larch': '#B8956D',
  
  // Colores sintéticos adicionales
  'bordó': '#800020',
  'bordo': '#800020',
  'burgundy': '#800020',
  'fucsia': '#FF00FF',
  'magenta': '#D946EF',
  'lima': '#84CC16',
  'lime': '#84CC16',
  'oliva': '#808000',
  'olive': '#808000',
  'plateado': '#C0C0C0',
  'silver': '#C0C0C0',
  'dorado': '#FFD700',
  'gold': '#FFD700',
  'cristal': '#F0F8FF',
  'crystal': '#F0F8FF',
  'transparente': 'rgba(240, 248, 255, 0.85)',
  'transparent': 'rgba(240, 248, 255, 0.85)',
  'incoloro': 'rgba(245, 245, 245, 0.85)',
  'colorless': 'rgba(245, 245, 245, 0.85)',
  
  // Colores adicionales comunes
  'verde oscuro': '#047857',
  'dark green': '#047857',
  'azul oscuro': '#1E3A8A',
  'dark blue': '#1E3A8A',
  'rojo oscuro': '#991B1B',
  'dark red': '#991B1B',
  'verde claro': '#86EFAC',
  'light green': '#86EFAC',
  'azul claro': '#BFDBFE',
  'light blue': '#BFDBFE',
  'terracota': '#C2410C',
  'terracotta': '#C2410C',
  'arena': '#E9D7C3',
  'sand': '#E9D7C3',
  'ocre': '#CC7722',
  'ochre': '#CC7722',
  'marfil': '#F5E6D3',
  'ivory': '#F5E6D3',
  'verde cemento': '#9CAF88',
  'cement green': '#9CAF88',
  'verde inglés': '#4A5B4A',
  'verde ingles': '#4A5B4A',
  'english green': '#4A5B4A',
  'verde manzana': '#8FBC8F',
  'verde manz': '#8FBC8F',
  'apple green': '#8FBC8F',
  'teja': '#B85C38',
  'tile': '#B85C38',
  'chocolate': '#7D5A3C',
  'blanco brillante': '#FFFFFF',
  'blanco brill': '#FFFFFF',
  'white gloss': '#FFFFFF',
  'blanco mate': '#E8E8E8',
  'white matte': '#E8E8E8',
  'blanco satinado': '#F0F0F0',
  'blanco sat': '#F0F0F0',
  'white satin': '#F0F0F0',
  'siena': '#a0522d',
  'sienna': '#a0522d',
}

/**
 * Oscurece un color HEX por un porcentaje dado
 */
export const darkenHex = (hex: string, amount = 0.2): string => {
  try {
    const h = hex.replace('#', '')
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
    const r = Math.max(0, Math.min(255, ((bigint >> 16) & 255) * (1 - amount)))
    const g = Math.max(0, Math.min(255, ((bigint >> 8) & 255) * (1 - amount)))
    const b = Math.max(0, Math.min(255, (bigint & 255) * (1 - amount)))
    return `rgb(${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)})`
  } catch {
    return hex
  }
}

/**
 * Convierte un nombre de color a código hexadecimal
 */
export const getColorHexFromName = (colorName: string): string => {
  // Normalizar el nombre: convertir a minúsculas, eliminar espacios múltiples, y trim
  const normalized = colorName.toLowerCase().trim().replace(/\s+/g, ' ')
  
  // Buscar coincidencia exacta primero
  if (COLOR_MAP[normalized]) {
    return COLOR_MAP[normalized]
  }
  
  // Buscar coincidencia sin espacios
  const noSpaces = normalized.replace(/\s+/g, '')
  if (COLOR_MAP[noSpaces]) {
    return COLOR_MAP[noSpaces]
  }
  
  // Buscar coincidencia parcial (para casos como "verde ingles" vs "verde inglés")
  for (const [key, value] of Object.entries(COLOR_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value
    }
  }
  
  return '#9CA3AF' // gris por defecto
}

/**
 * Calcula la luminosidad relativa de un color HEX (WCAG)
 */
export const getLuminance = (hex: string): number => {
  const rgbMatch = hex.replace('#', '').match(/.{2}/g)
  if (!rgbMatch || rgbMatch.length !== 3) return 0.5
  
  const r = parseInt(rgbMatch[0] || '00', 16) / 255
  const g = parseInt(rgbMatch[1] || '00', 16) / 255
  const b = parseInt(rgbMatch[2] || '00', 16) / 255
  
  // Aplicar gamma correction
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)
  
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/**
 * Lista de colores claros que requieren texto oscuro
 */
const LIGHT_COLOR_NAMES = [
  'blanco', 'white', 'crema', 'cream', 'beige', 'arena', 'sand', 'marfil', 'ivory'
]

/**
 * Determina el color del texto según el fondo y estado seleccionado
 */
export const getTextColorForBackground = (
  hex: string,
  isSelected: boolean,
  colorName: string
): string => {
  // Cuando está seleccionado, siempre usar texto naranja (fondo será blanco)
  if (isSelected) return 'text-[#EA5A17]'
  
  // Calcular luminosidad del color
  const bgHex = hex === '#FFFFFF' || hex === '#ffffff' ? '#F5F5F5' : hex
  const luminance = getLuminance(bgHex)
  
  // Para colores claros (luminosidad > 0.6), usar texto oscuro
  const colorNameLower = colorName.toLowerCase()
  if (luminance > 0.6 || LIGHT_COLOR_NAMES.some(name => colorNameLower.includes(name))) {
    return 'text-gray-800'
  }
  
  // Para colores oscuros, usar texto blanco
  return 'text-white'
}

/**
 * Determina el color de fondo para un pill de color
 */
export const getBackgroundColorForPill = (hex: string, isSelected: boolean): string => {
  // Cuando está seleccionado, usar fondo blanco para mejor contraste con texto naranja
  if (isSelected) {
    return '#FFFFFF'
  }
  // Cuando no está seleccionado, usar el color original
  return hex === '#FFFFFF' || hex === '#ffffff' ? '#F5F5F5' : hex
}

/**
 * Verifica si un color es blanco brillante
 */
export const isBlancoBrillante = (colorName: string): boolean => {
  const lower = colorName.toLowerCase()
  return lower.includes('blanco brill') || lower.includes('white gloss')
}

/**
 * Verifica si un color es blanco satinado
 */
export const isBlancoSatinado = (colorName: string): boolean => {
  const lower = colorName.toLowerCase()
  return lower.includes('blanco sat') || lower.includes('white satin')
}

/**
 * Verifica si un color es transparente/incoloro
 */
export const isTransparentColor = (colorName: string): boolean => {
  const lower = colorName.toLowerCase()
  return lower.includes('incoloro') || 
         lower.includes('transparente') || 
         lower.includes('transparent')
}

/**
 * Limpia el título del producto removiendo terminaciones (Brillante, Satinado, Mate)
 * cuando el producto es incoloro. Esto es necesario porque para productos incoloros,
 * la terminación debe mostrarse solo en el selector de finish, no en el título.
 */
export const cleanTitleForIncoloroProduct = (title: string): string => {
  if (!title) return title
  
  // Lista de terminaciones a remover (case-insensitive)
  const finishes = [
    /\s+brillante\s*$/i,
    /^brillante\s+/i,
    /\s+brill\s*$/i,
    /^brill\s+/i,
    /\s+satinado\s*$/i,
    /^satinado\s+/i,
    /\s+sat\s*$/i,
    /^sat\s+/i,
    /\s+mate\s*$/i,
    /^mate\s+/i,
    /\s+matte\s*$/i,
    /^matte\s+/i,
  ]
  
  let cleaned = title.trim()
  
  // Aplicar cada patrón de terminación
  for (const pattern of finishes) {
    cleaned = cleaned.replace(pattern, ' ')
  }
  
  // Limpiar espacios múltiples y espacios al inicio/fin
  cleaned = cleaned.replace(/\s+/g, ' ').trim()
  
  return cleaned
}

