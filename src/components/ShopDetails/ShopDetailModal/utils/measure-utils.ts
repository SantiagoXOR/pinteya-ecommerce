/**
 * Utilidades para manejo de medidas en ShopDetailModal
 * 
 * NOTA: Este archivo es una copia local para evitar dependencias circulares
 * con product-card-commercial. Si necesitas actualizar, sincroniza con:
 * @/components/ui/product-card-commercial/utils/measure-utils.ts
 */

/**
 * Normaliza un valor de medida para comparaciones
 * Convierte variaciones como "4LT", "4 Litros", "4L" a formato canónico
 */
export const normalizeMeasure = (value?: string | null): string => {
  if (!value) return ''
  
  const up = value.toString().trim().toUpperCase()
  const noSpaces = up.replace(/\s+/g, '')
  const noPunct = noSpaces.replace(/[.\-_/]/g, '')
  
  // Extraer número y unidad
  const match = noPunct.match(/^(\d+(?:\.\d+)?)\s*(.*)$/)
  if (!match || !match[1]) return noPunct
  
  const num = match[1]
  let unit = (match[2] || '').toUpperCase()
  
  // Normalizar variaciones comunes de unidades
  const unitNormalizations: Record<string, string> = {
    'LITROS': 'L',
    'LITRO': 'L',
    'LTS': 'L',
    'LT': 'L',
    'KILOS': 'KG',
    'KILO': 'KG',
    'KILOGRAMOS': 'KG',
    'KILOGRAMO': 'KG',
    'KGS': 'KG',
    'GRAMOS': 'G',
    'GRAMO': 'G',
    'GRS': 'G',
    'GR': 'G',
    'METROS': 'M',
    'METRO': 'M',
    'MTS': 'M',
    'MT': 'M',
    'CENTIMETROS': 'CM',
    'CENTIMETRO': 'CM',
    'CMS': 'CM',
    'MILIMETROS': 'MM',
    'MILIMETRO': 'MM',
    'MMS': 'MM',
    'PULGADAS': 'IN',
    'PULGADA': 'IN',
    'PULG': 'IN',
    '"': 'IN',
  }
  
  // Normalizar la unidad si hay una variación conocida
  if (unitNormalizations[unit]) {
    unit = unitNormalizations[unit]
  }
  
  return `${num}${unit}`
}
