// Diccionario de intención y utilidades de búsqueda
// Permite expandir consultas del usuario a sinónimos y términos relacionados

export const INTENT_SYNONYMS: Record<string, string[]> = {
  humedad: ['antihumedad', 'impermeabilizante', 'membrana', 'sellador', 'moho', 'filtración', 'goteras'],
  moho: ['antihongo', 'fungicida', 'antihumedad', 'impermeabilizante'],
  goteras: ['impermeabilizante', 'membrana', 'sellador', 'humedad'],
  filtracion: ['filtración', 'impermeabilizante', 'membrana', 'sellador', 'humedad'],
  madera: ['impregnante', 'protector madera', 'barniz', 'lasur'],
  maderas: ['madera', 'impregnante', 'protector madera', 'barniz', 'lasur'],
  metal: ['esmalte metal', 'esmalte', 'metales'],
  metales: ['metal', 'esmalte metal', 'esmalte'],
  techo: ['membrana', 'impermeabilizante', 'sellador'],
  techos: ['techo', 'membrana', 'impermeabilizante', 'sellador'],
  latex: ['látex'],
  impregnantes: ['impregnante'],
  impregnante: ['impregnantes'],
  // Términos relacionados con productos de pintura
  aero: ['aerosol', 'aerosoles'],
  aerosol: ['aero', 'aerosoles'],
  pintura: ['pint', 'pinturas', 'pintar'],
  esmalte: ['esm', 'esmaltes', 'esmaltado'],
  sintetico: ['sintético', 'sintetica', 'sintética'],
  acrilico: ['acrílico', 'acrilica', 'acrílica'],
}

// Sufijos comunes en productos de pintura
const COMMON_SUFFIXES = [
  'ol', 'ol', 'sol', 'sol', 'sol', // aerosol, aerosol
  'te', 'te', 'te', // esmalte, sintético
  'co', 'ca', // acrílico, sintética
  'ura', 'uras', // pintura, pinturas
  'ante', 'antes', // impregnante, impregnantes
]

// Prefijos comunes en productos de pintura
const COMMON_PREFIXES = [
  'aero', 'aerosol',
  'pint', 'pintura',
  'esm', 'esmalte',
  'sint', 'sintetic', 'sintético',
  'acril', 'acrílic',
]

export function stripDiacritics(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function toSingular(term: string): string {
  // Heurística simple para español: eliminar sufijos comunes
  if (term.length > 4 && /es$/i.test(term)) return term.replace(/es$/i, '')
  if (term.length > 3 && /s$/i.test(term)) return term.replace(/s$/i, '')
  return term
}

/**
 * Genera variaciones de prefijos para una búsqueda
 * Ejemplo: "aero" → ["aero", "aer", "aerosol"]
 */
export function generatePrefixVariations(term: string): string[] {
  const results = new Set<string>([term])
  const normalized = stripDiacritics(term.toLowerCase())
  
  // Si el término es corto (menos de 4 caracteres), no generar variaciones
  if (normalized.length < 3) {
    return [term]
  }
  
  // Agregar término sin última letra si tiene al menos 3 caracteres
  if (normalized.length >= 3) {
    results.add(normalized.slice(0, -1))
  }
  
  // Agregar término sin últimas 2 letras si tiene al menos 4 caracteres
  if (normalized.length >= 4) {
    results.add(normalized.slice(0, -2))
  }
  
  return Array.from(results)
}

/**
 * Genera variaciones con sufijos comunes
 * Ejemplo: "aero" → ["aerosol", "aerodinamico"]
 */
export function generateSuffixVariations(term: string): string[] {
  const results = new Set<string>([term])
  const normalized = stripDiacritics(term.toLowerCase())
  
  // Solo generar sufijos si el término tiene al menos 3 caracteres
  if (normalized.length < 3) {
    return [term]
  }
  
  // Agregar sufijos comunes relevantes para productos de pintura
  const relevantSuffixes = ['sol', 'ol', 'te', 'co', 'ca', 'ura']
  
  for (const suffix of relevantSuffixes) {
    // Solo agregar si el término no termina ya con ese sufijo
    if (!normalized.endsWith(suffix)) {
      results.add(normalized + suffix)
    }
  }
  
  return Array.from(results)
}

export function expandQueryIntents(raw: string): string[] {
  const normalized = stripDiacritics(raw)
  const results = new Set<string>([raw, normalized])

  // Singularización
  const singular = toSingular(normalized)
  if (singular !== normalized) results.add(singular)

  // Sinónimos del diccionario
  const synonyms = INTENT_SYNONYMS[normalized]
  if (synonyms) {
    for (const s of synonyms) results.add(s)
  }

  // Variaciones de prefijos (solo si el término tiene al menos 3 caracteres)
  if (normalized.length >= 3) {
    const prefixVariations = generatePrefixVariations(normalized)
    for (const variation of prefixVariations) {
      results.add(variation)
    }
  }

  // Variaciones con sufijos (solo si el término tiene al menos 3 caracteres)
  if (normalized.length >= 3) {
    const suffixVariations = generateSuffixVariations(normalized)
    for (const variation of suffixVariations) {
      results.add(variation)
    }
  }

  return Array.from(results)
}

/** Stopwords en español a ignorar al expandir por palabras */
const STOPWORDS = new Set(['y', 'e', 'o', 'u', 'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'en', 'con', 'para', 'por', 'al', 'a', 'que', 'es', 'son'])

/**
 * Expande la query dividiendo por palabras y expandiendo cada una.
 * Útil para búsquedas como "metales y maderas" donde cada palabra debe buscarse por separado (OR).
 * Ej: "metales y maderas" → ["metales", "maderas", "metal", "esmalte", "madera", "impregnante", "barniz", ...]
 */
export function expandQueryIntentsByWords(raw: string): string[] {
  const results = new Set<string>()
  const words = raw.trim().toLowerCase().split(/\s+/).filter(Boolean)

  for (const word of words) {
    const normalized = stripDiacritics(word)
    if (STOPWORDS.has(normalized) || normalized.length < 2) continue

    results.add(normalized)
    results.add(word)

    const singular = toSingular(normalized)
    if (singular !== normalized) results.add(singular)

    const synonyms = INTENT_SYNONYMS[normalized]
    if (synonyms) {
      for (const s of synonyms) results.add(s)
    }

    if (normalized.length >= 3) {
      const prefixVariations = generatePrefixVariations(normalized)
      for (const v of prefixVariations) results.add(v)
      const suffixVariations = generateSuffixVariations(normalized)
      for (const v of suffixVariations) results.add(v)
    }
  }

  return Array.from(results)
}

/**
 * Mapea una búsqueda a slug de categoría si es reconocible.
 * Ej: "metales y maderas" → "metales-y-maderas", "techos" → "techos"
 */
export function mapSearchToCategory(query: string): string | null {
  const normalized = stripDiacritics(query.trim().toLowerCase())
  if (!normalized) return null

  const CATEGORY_MAP: Record<string, string> = {
    'metales y maderas': 'metales-y-maderas',
    'metales': 'metales-y-maderas',
    'maderas': 'metales-y-maderas',
    'metal': 'metales-y-maderas',
    'madera': 'metales-y-maderas',
    'techos': 'techos',
    'techo': 'techos',
    'paredes': 'paredes',
    'pared': 'paredes',
    'complementos': 'complementos',
    'complemento': 'complementos',
    'antihumedad': 'antihumedad',
    'piscinas': 'piscinas',
    'piscina': 'piscinas',
    'reparaciones': 'reparaciones',
    'reparacion': 'reparaciones',
    'pisos': 'pisos',
    'piso': 'pisos',
    'humedad': 'antihumedad',
    'goteras': 'techos',
    'impermeabilizante': 'techos',
  }

  if (CATEGORY_MAP[normalized]) return CATEGORY_MAP[normalized]

  for (const [key, slug] of Object.entries(CATEGORY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) return slug
  }

  return null
}