// Utilidad para normalizar etiquetas de variantes en toda la UI
// - Unifica capitalización
// - Convierte guiones/underscores a espacios
// - Aplica aliases para colores comunes

export type VariantType = 'color' | 'capacity' | 'size' | 'grain' | 'width' | 'medida' | 'finish'

const stripDiacritics = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function normalizeVariantLabel(value?: string | number | null, type?: VariantType): string | undefined {
  if (value === undefined || value === null) return undefined
  let s = String(value)
  s = s.replace(/[_-]+/g, ' ')
  s = stripDiacritics(s)
  s = s.trim()

  if (type === 'capacity' || type === 'medida') {
    // Unificar 5 kg -> 5KG, 1 l -> 1L
    return s.replace(/\s+/g, '').toUpperCase()
  }

  if (type === 'color') {
    const low = s.toLowerCase()
    const colorMap: Array<{ re: RegExp; out: string }> = [
      { re: /(blanco\s?puro|blanco-puro|blanco)/i, out: 'BLANCO' },
      { re: /(negro intenso|negro)/i, out: 'NEGRO' },
      { re: /(azul marino|azul)/i, out: 'AZUL' },
      { re: /(rojo)/i, out: 'ROJO' },
      { re: /(verde)/i, out: 'VERDE' },
      { re: /(amarillo)/i, out: 'AMARILLO' },
      { re: /(gris)/i, out: 'GRIS' },
      { re: /(naranja)/i, out: 'NARANJA' },
      { re: /(violeta|purpura|púrpura)/i, out: 'VIOLETA' },
      { re: /(marron|cafe|castaño)/i, out: 'MARRÓN' },
    ]

    for (const { re, out } of colorMap) {
      if (re.test(low)) return out
    }
  }

  if (type === 'finish') {
    const low = s.toLowerCase()
    // Normalizar acabados comunes
    if (/mate/.test(low)) return 'MATE'
    if (/(sat(i|í)nado)/.test(low)) return 'SATINADO'
    if (/(brillante|gloss|brillo)/.test(low)) return 'BRILLANTE'
    if (/(semimate|semi\s*mate)/.test(low)) return 'SEMIMATE'
  }

  return s.toUpperCase()
}

export function normalizeAttributes(attrs?: { color?: string; medida?: string; finish?: string }): { color?: string; medida?: string; finish?: string } | undefined {
  if (!attrs) return undefined
  const color = normalizeVariantLabel(attrs.color, 'color')
  const medida = normalizeVariantLabel(attrs.medida, 'medida')
  const finish = normalizeVariantLabel(attrs.finish, 'finish')
  return { ...(color ? { color } : {}), ...(medida ? { medida } : {}), ...(finish ? { finish } : {}) }
}