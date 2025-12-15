/**
 * Utilidades para manejo de medidas en ProductCard
 */

export interface ParsedMeasure {
  number: string
  unit: string
}

/**
 * Separa número y unidad de una medida
 * Ejemplos:
 * - "4L" -> { number: "4", unit: "L" }
 * - "N°10" -> { number: "10", unit: "N°" }
 * - "Grano 60" -> { number: "60", unit: "Grano" }
 */
export const parseMeasure = (measure: string): ParsedMeasure => {
  // Para "N°10", "N°15", etc. (pinceles/brochas) o "N120", "N180" (lijas)
  const nMatch = measure.match(/^(N°|Nº|n°|nº|N|n)\s*(\d+)$/i)
  if (nMatch && nMatch[2]) {
    return { number: nMatch[2], unit: 'N°' }
  }
  
  // Para "Grano 60", "Grano 80", etc.
  const granoMatch = measure.match(/^(grano)\s*(\d+)$/i)
  if (granoMatch && granoMatch[2]) {
    return { number: granoMatch[2], unit: 'Grano' }
  }
  
  // Regex para separar número de unidad (ej: "4L" -> "4" + "L")
  const match = measure.match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
  if (match && match[1]) {
    return { number: match[1], unit: (match[2] || '').toUpperCase() }
  }
  
  return { number: measure, unit: '' }
}

/**
 * Normaliza un valor de medida para comparaciones
 * Convierte variaciones como "4LT", "4 Litros", "4L" a formato canónico
 */
export const normalizeMeasure = (value?: string | null): string => {
  if (!value) return ''
  
  const up = value.toString().trim().toUpperCase()
  const noSpaces = up.replace(/\s+/g, '')
  const noPunct = noSpaces.replace(/[.\-_/]/g, '')
  const replacedKg = noPunct.replace(/(KGS|KILO|KILOS)$/i, 'KG')
  const replacedL = replacedKg.replace(/(LT|LTS|LITRO|LITROS)$/i, 'L')
  
  return replacedL
}

/**
 * Obtiene la unidad común de un array de medidas
 */
export const getCommonUnit = (measures: string[]): string => {
  if (measures.length === 0 || !measures[0]) return ''
  const { unit } = parseMeasure(measures[0])
  return unit
}

/**
 * Formatea una medida para mostrar
 * @param measure La medida original (ej: "4L")
 * @returns La medida formateada (ej: "4 Litro" o "4 L")
 */
export const formatMeasureDisplay = (measure: string): string => {
  const { number, unit } = parseMeasure(measure)
  
  // Formatear la unidad: si es "L" o "LITRO", usar "Litro" o "L" según corresponda
  const displayUnit = unit === 'L' || unit === 'LT' || unit === 'LITRO' || unit === 'LITROS' 
    ? (number === '1' ? 'Litro' : 'L')
    : unit
  
  return displayUnit ? `${number} ${displayUnit}` : number
}

/**
 * Ordena medidas numéricamente
 */
export const sortMeasures = (measures: string[]): string[] => {
  return [...measures].sort((a, b) => {
    const numA = parseFloat(a)
    const numB = parseFloat(b)
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB
    return a.localeCompare(b)
  })
}

/**
 * Extrae medidas únicas de un array de variantes
 */
export const extractUniqueMeasures = (
  variants: Array<{ measure?: string }> | undefined
): string[] => {
  if (!variants || variants.length === 0) return []
  
  const measures = variants
    .map(v => v.measure)
    .filter((m): m is string => Boolean(m))
  
  // Eliminar duplicados y ordenar
  return sortMeasures(Array.from(new Set(measures)))
}

