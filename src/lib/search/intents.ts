// Diccionario de intención y utilidades de búsqueda
// Permite expandir consultas del usuario a sinónimos y términos relacionados

export const INTENT_SYNONYMS: Record<string, string[]> = {
  humedad: ['antihumedad', 'impermeabilizante', 'membrana', 'sellador', 'moho', 'filtración', 'goteras'],
  moho: ['antihongo', 'fungicida', 'antihumedad', 'impermeabilizante'],
  goteras: ['impermeabilizante', 'membrana', 'sellador', 'humedad'],
  filtracion: ['filtración', 'impermeabilizante', 'membrana', 'sellador', 'humedad'],
  madera: ['impregnante', 'protector madera', 'barniz', 'lasur'],
  techo: ['membrana', 'impermeabilizante', 'sellador'],
  latex: ['látex'],
  impregnantes: ['impregnante'],
  impregnante: ['impregnantes'],
}

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

export function expandQueryIntents(raw: string): string[] {
  const normalized = stripDiacritics(raw)
  const results = new Set<string>([raw, normalized])

  const singular = toSingular(normalized)
  if (singular !== normalized) results.add(singular)

  const synonyms = INTENT_SYNONYMS[normalized]
  if (synonyms) {
    for (const s of synonyms) results.add(s)
  }

  return Array.from(results)
}