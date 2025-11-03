import { extractCapacityFromName, extractColorsFromName, formatProductBadges, type ExtractedProductInfo } from '@/utils/product-utils'

export interface FilterBadgesResult {
  measures: string[]
  colors: { name: string; hex: string }[]
}

// Construye opciones de filtros reutilizando la misma lógica de badges del ProductCard
export const buildFilterBadgesFromProducts = (products: any[] | undefined): FilterBadgesResult => {
  const measureSet = new Set<string>()
  const colorMap = new Map<string, string>()

  if (!products || !Array.isArray(products)) {
    return { measures: [], colors: [] }
  }

  for (const p of products) {
    // Armar un ExtractedProductInfo parcial para pasar por formatProductBadges
    const title = String(p?.title || p?.name || '')

    // 1. PRIORIDAD: Extraer desde variantes
    if (Array.isArray(p?.variants)) {
      for (const v of p.variants) {
        // Medidas desde variantes
        if (v?.measure && typeof v.measure === 'string') {
          measureSet.add(v.measure)
        }
        
        // Colores desde variantes con color_hex
        if (v?.color_name && typeof v.color_name === 'string') {
          const n = String(v.color_name).trim()
          if (n && n.toUpperCase() !== 'INCOLORO') {  // Excluir INCOLORO de filtros
            const hex = typeof v.color_hex === 'string' && v.color_hex 
              ? v.color_hex 
              : getColorHex(n) || '#808080'
            if (!colorMap.has(n)) {
              colorMap.set(n, hex)
            }
          }
        }
      }
    }

    // 2. FALLBACK: Solo si NO hay variantes, usar campos legacy y nombre
    if (!p?.variants || p.variants.length === 0) {
      // Medida desde campo legacy o nombre
      let capacity: string | null = null
      if (p?.medida && typeof p.medida === 'string') capacity = p.medida
      if (!capacity) capacity = extractCapacityFromName(title) || null
      
      if (capacity) measureSet.add(capacity)

      // Color desde campo legacy (no desde nombre para evitar colores incorrectos)
      if (p?.color && typeof p.color === 'string') {
        const colorNames = p.color.split(',').map((c: string) => c.trim())
        for (const colorName of colorNames) {
          if (colorName && !colorMap.has(colorName)) {
            const hex = getColorHex(colorName) || '#808080'
            colorMap.set(colorName, hex)
          }
        }
      }
    }
  }
  
  // Importar getColorHex inline si no está disponible
  function getColorHex(colorName: string): string | undefined {
    const map: Record<string, string> = {
      'BLANCO': '#FFFFFF', 'BLANCO BRILL': '#FFFFFF', 'BLANCO MATE': '#F5F5F5', 'BLANCO SAT': '#F8F8FF',
      'NEGRO': '#000000', 'NEGRO BRILL': '#000000', 'NEGRO MATE': '#1a1a1a', 'NEGRO SAT': '#2a2a2a',
      'ROJO TEJA': '#A63A2B', 'AZUL': '#0066CC', 'AZUL MARINO': '#000080', 'AZUL TRAFUL': '#4682B4',
      'AMARILLO': '#FFFF00', 'AMARILLO MEDIANO': '#FFD700',
      'VERDE INGLES': '#355E3B', 'VERDE NOCHE': '#013220',
      'GRIS': '#808080', 'GRIS PERLA': '#C0C0C0',
      'MARRON': '#8B4513', 'NARANJA': '#FFA500', 'BERMELLON': '#E34234',
      'MARFIL': '#FFFFF0', 'TOSTADO': '#D2B48C', 'CELESTE': '#87CEEB',
      'CAOBA': '#8E3B1F', 'CEDRO': '#C26A2B', 'CRISTAL': '#E8D5B5',
      'NOGAL': '#5C3A1A', 'PINO': '#E5B57E', 'ROBLE': '#C7955B',
      'ALUMINIO': '#C0C0C0',
    }
    return map[colorName.toUpperCase()]
  }

  const measures = Array.from(measureSet)
  const colors = Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }))
  return { measures, colors }
}