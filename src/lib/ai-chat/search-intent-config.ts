/**
 * Configuración centralizada para intención → búsqueda del AI Chat.
 * Una sola fuente de verdad para fallbacks en frontend y filtrado de productos.
 * Ver docs/features/AI_CHAT.md.
 */

/** Palabras que excluyen un producto del carrusel (reparadores, masillas, etc.). */
export const EXCLUDE_PRODUCT_KEYWORDS = /reparador|enduido|masilla|sellador/i

/** Si el contexto contiene estos términos, se fuerza suggestedSearch = 'aerosol'. */
export function isAerosolContext(contextText: string): boolean {
  if (/\b(aerosol|aerosoles|spray)\b/.test(contextText)) return true
  if (/\b(maceta|maseta|masetero)\b/.test(contextText) && /\b(aerosol|spray|pintar)\b/.test(contextText)) return true
  return false
}

/** Patrones para normalizar el suggestedSearch que devuelve la IA (sin cambiar aerosol/spray). */
export const NORMALIZE_SEARCH_RULES: { pattern: RegExp; search: string }[] = [
  { pattern: /interior|interiores/, search: 'látex interior' },
  { pattern: /exterior|exteriores|frente|fachada/, search: 'látex exterior' },
  { pattern: /madera|muebles?/, search: 'pintura madera' },
  { pattern: /techo/, search: 'pintura techo' },
]

/**
 * Normaliza un término de búsqueda a uno canónico (látex interior, pintura madera, etc.).
 * No modifica si ya es aerosol/spray ni si ya está en forma canónica.
 */
export function normalizeSuggestedSearch(suggestedSearch: string | null): string | null {
  if (!suggestedSearch || /aerosol|spray/i.test(suggestedSearch)) return suggestedSearch
  const s = suggestedSearch.toLowerCase()
  for (const { pattern, search } of NORMALIZE_SEARCH_RULES) {
    if (pattern.test(s) && !s.includes(search)) return search
  }
  return suggestedSearch
}

/** ¿El mensaje actual es una confirmación corta tipo "mostrame", "dale", "sí"? */
export const SHOW_ME_REGEX = /^(mostrame|mostrá|mostrar|dale|sí|si|ok|okay|ver|muestra?)$/

/** Marcas conocidas para fallback de búsqueda por marca. */
export const BRAND_REGEX = /\b(sinteplast|sherwin|sherwin.?williams|plavicon|petrilac|alba)\b/i

/** Máximo de productos a pedir y a mostrar en el carrusel. */
export const PRODUCTS_LIMIT = 16
export const PRODUCTS_CAROUSEL_MAX = 12

/** Chips de aplicación (Interior, Exterior, etc.) para el inicio del chat. */
export const APPLICATIONS = [
  'Interior',
  'Exterior',
  'Madera',
  'Metal',
  'Paredes',
  'Techos',
  'Muebles',
  'Automotor',
] as const

export type ApplicationChip = (typeof APPLICATIONS)[number]

/**
 * Reglas de fallback: cuando la API no devuelve suggestedSearch/suggestedCategory,
 * se evalúan en orden. La primera que coincida devuelve el término de búsqueda.
 * contextText = mensaje actual + últimos mensajes usuario + últimos del asistente (todo en minúsculas).
 * currentLower = mensaje actual en minúsculas.
 */
export interface FallbackRule {
  test: (contextText: string, currentLower: string) => boolean
  getSearch: (contextText: string, currentLower: string) => string
}

export const FALLBACK_INTENT_RULES: FallbackRule[] = [
  // Marca + contexto exterior/interior
  {
    test: (ctx, cur) => BRAND_REGEX.test(cur),
    getSearch: (ctx, cur) => {
      const m = cur.match(BRAND_REGEX)
      const brand = m ? m[0] ?? '' : ''
      if (/\b(exterior|exteriores|frente|fachada)\b/.test(ctx)) return `${brand} látex exterior`
      if (/\b(interior|interiores)\b/.test(ctx)) return `${brand} látex interior`
      return brand
    },
  },
  // "Más vendidos" / "mejores" → según contexto
  {
    test: (_, cur) => /\b(mas\s+vendidos|más\s+vendidos|mejores|best\s*seller)\b/.test(cur),
    getSearch: (ctx) => {
      if (/\b(exterior|exteriores|frente|fachada)\b/.test(ctx)) return 'látex exterior'
      if (/\b(interior|interiores)\b/.test(ctx)) return 'látex interior'
      if (/\b(madera|muebles?)\b/.test(ctx)) return 'pintura madera'
      return 'látex'
    },
  },
  // Asesoramiento: "qué hace falta", "que necesito", "revoque", "sin mano de pintura" → derivar del contexto
  {
    test: (ctx) =>
      /\b(que\s+hace\s+falta|qué\s+hace\s+falta|que\s+necesito|qué\s+necesito|revoque|revoques|sin\s+mano)\b/i.test(ctx),
    getSearch: (ctx) => {
      if (/\b(exterior|exteriores|frente|fachada|revestimiento)\b/.test(ctx)) return 'látex exterior'
      if (/\b(interior|interiores)\b/.test(ctx)) return 'látex interior'
      if (/\b(madera|muebles?)\b/.test(ctx)) return 'pintura madera'
      if (/\b(pared|muro|revoque)\b/.test(ctx)) return 'látex'
      return 'látex'
    },
  },
  // Complementos / herramientas
  {
    test: (ctx, cur) =>
      /\b(complementos?|accesorios|rodillos?|pinceles?|brochas?|cintas?|bandejas?|herramientas?)\b/.test(ctx),
    getSearch: (ctx) => {
      if (/\b(rodillos?|rodillo)\b/.test(ctx)) return 'rodillo'
      if (/\b(pinceles?|pincel)\b/.test(ctx)) return 'pincel'
      if (/\b(brochas?|brocha)\b/.test(ctx)) return 'brocha'
      if (/\b(cintas?|cinta)\b/.test(ctx)) return 'cinta'
      if (/\b(bandejas?|bandeja)\b/.test(ctx)) return 'bandeja'
      return 'rodillo pincel'
    },
  },
  // Por tipo de superficie / uso
  { test: (ctx) => /\b(madera|muebles?)\b/.test(ctx), getSearch: () => 'pintura madera' },
  { test: (ctx) => /\b(interior(es?)?|habitacion(es?)?|cuarto)\b/.test(ctx), getSearch: () => 'látex interior' },
  { test: (ctx) => /\b(exterior(es?)?|frente|fachada|revestimiento)\b/.test(ctx), getSearch: () => 'látex exterior' },
  { test: (ctx) => /\bmetal\b/.test(ctx), getSearch: () => 'esmalte metal' },
  { test: (ctx) => /\b(techos?|techo)\b/.test(ctx), getSearch: () => 'pintura techo' },
  { test: (ctx) => /\bautomotor\b/.test(ctx), getSearch: () => 'pintura automotor' },
  { test: (ctx) => /\b(paredes?|muros?)\b/.test(ctx), getSearch: () => 'látex' },
  { test: (ctx) => /\b(pintar|pintura)\b/.test(ctx), getSearch: () => 'látex' },
]

/**
 * Obtiene suggestedSearch por fallback cuando la API no devolvió categoría ni búsqueda.
 * conversationForIntent: si el mensaje es "mostrame"/"dale" etc. usar contextText, si no currentLower.
 */
export function getFallbackSuggestedSearch(
  contextText: string,
  currentLower: string
): string | null {
  const isShowMe = SHOW_ME_REGEX.test(currentLower.trim())
  const textForIntent = isShowMe ? contextText : currentLower
  for (const rule of FALLBACK_INTENT_RULES) {
    if (rule.test(contextText, textForIntent)) return rule.getSearch(contextText, currentLower)
  }
  return null
}

/** Regex para detectar productos tipo aerosol en nombre/título (priorización en carrusel). */
export const AEROSOL_PRODUCT_REGEX = /aerosol|spray|krylon|tableros y vinilicos|plastico y acrilicos/i
