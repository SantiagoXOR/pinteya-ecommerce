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

    // Medida desde DB o nombre
    let capacity: string | null = null
    if (p?.medida && typeof p.medida === 'string') capacity = p.medida
    if (!capacity) capacity = extractCapacityFromName(title) || null

    // Color desde DB, nombre o variantes
    let color: string | null = null
    if (p?.color && typeof p.color === 'string') color = p.color
    if (!color) {
      const extractedColors = extractColorsFromName(title)
      if (extractedColors && extractedColors.length) color = extractedColors.join(', ')
    }

    // Construcción de extractedInfo mínima
    const extractedInfo: ExtractedProductInfo = {
      capacity: capacity || undefined,
      color: color || undefined,
      finish: undefined,
      material: undefined,
      grit: undefined,
      dimensions: undefined,
      weight: undefined,
      brand: undefined,
    }

    const badges = formatProductBadges(extractedInfo, {
      showCapacity: true,
      showColor: true,
      showFinish: false,
      showMaterial: false,
      showGrit: false,
      showDimensions: true,
      showWeight: false,
      showBrand: false,
      maxBadges: 8,
    })

    // Recoger medidas (capacidad y dimensiones)
    for (const b of badges) {
      if ((b.type === 'capacity' || b.type === 'dimensions') && b.displayText) {
        measureSet.add(b.displayText)
      }
    }

    // Recoger colores (circular)
    for (const b of badges) {
      if (b.type === 'color-circle' && b.displayText && b.circleColor) {
        const name = b.displayText.trim()
        if (!colorMap.has(name)) {
          colorMap.set(name, b.circleColor)
        }
      }
    }

    // Variantes: asegurar incorporación de measure/color adicionales
    if (Array.isArray(p?.variants)) {
      for (const v of p.variants) {
        if (v?.measure && typeof v.measure === 'string') measureSet.add(v.measure)
        if (v?.color_name && typeof v.color_name === 'string') {
          const n = String(v.color_name).trim()
          const hex = typeof v.color_hex === 'string' ? v.color_hex : undefined
          if (n && !colorMap.has(n)) colorMap.set(n, hex || '#007639')
        }
      }
    }
  }

  const measures = Array.from(measureSet)
  const colors = Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }))
  return { measures, colors }
}