/**
 * Utilidades para manejo de colores en ShopDetailModal
 * 
 * NOTA: Este archivo es una copia local para evitar dependencias circulares
 * con product-card-commercial. Si necesitas actualizar, sincroniza con:
 * @/components/ui/product-card-commercial/utils/color-utils.ts
 */

// Mapa de colores: nombre -> hex
export const COLOR_MAP: Record<string, string> = {
  // Colores básicos
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
  'cerezo': '#9B2D30',
  'cherry': '#9B2D30',
  'wengue': '#2C1810',
  'wenge': '#2C1810',
  'teca': '#AB8B5A',
  'teak': '#AB8B5A',
  'ebano': '#1A1110',
  'ebony': '#1A1110',
  'algarrobo': '#8B4513',
  'lapacho': '#4A2C2A',
  'quebracho': '#5D3A1A',
  'eucalipto': '#A67B5B',
  'eucalyptus': '#A67B5B',
  'incienso': '#C4A35A',
  'guatambu': '#E8D4A8',
  'guatambú': '#E8D4A8',
  
  // Colores especiales para pinturas
  'transparente': 'transparent',
  'incoloro': 'transparent',
  'clear': 'transparent',
  'satinado': '#F5F5F5',
  'brillante': '#FFFFFF',
  'mate': '#E5E5E5',
  
  // Tonos específicos de pinturas
  'blanco satinado': '#F8F8F8',
  'blanco brillante': '#FFFFFF',
  'blanco mate': '#F0F0F0',
  'gris perla': '#C9C9C9',
  'gris plata': '#B8B8B8',
  'gris oscuro': '#5A5A5A',
  'azul marino': '#1E3A5F',
  'navy': '#1E3A5F',
  'verde bosque': '#228B22',
  'verde oliva': '#808000',
  'verde ingles': '#1B4D3E',
  'verde inglés': '#1B4D3E',
  'terracota': '#E2725B',
  'bordo': '#722F37',
  'burgundy': '#722F37',
  'burdeos': '#722F37',
  'ocre': '#CC7722',
  'mostaza': '#FFDB58',
  'salmon': '#FA8072',
  'salmón': '#FA8072',
  'coral': '#FF7F50',
  'durazno': '#FFCBA4',
  'peach': '#FFCBA4',
  'lavanda': '#E6E6FA',
  'lavender': '#E6E6FA',
  'lila': '#C8A2C8',
  'lilac': '#C8A2C8',
  'dorado': '#FFD700',
  'gold': '#FFD700',
  'plateado': '#C0C0C0',
  'silver': '#C0C0C0',
  'bronce': '#CD7F32',
  'bronze': '#CD7F32',
  'cobre': '#B87333',
  'copper': '#B87333',
  
  // Nuevos colores agregados
  'siena': '#a0522d',
  'sienna': '#a0522d',
  
  // Colores adicionales detectados en BD sin color_hex
  'chocolate': '#7B3F00',
  'roble claro': '#D4A76A',
  'roble-claro': '#D4A76A',
  'roble oscuro': '#5C4033',
  'roble-oscuro': '#5C4033',
  'verde cemento': '#9CAF88',
  'verde-cemento': '#9CAF88',
  'verde claro': '#90EE90',
  'verde-claro': '#90EE90',
  'verde manzana': '#8DB600',
  'verde-manzana': '#8DB600',
  'verde oscuro': '#006400',
  'verde-oscuro': '#006400',
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
