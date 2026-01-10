// Utilidades para manejo de productos

export interface ProductType {
  id: string
  name: string
  hasColorSelector: boolean
  capacityUnit: 'litros' | 'kg' | 'unidades' | 'metros'
  defaultCapacities: string[]
  category: string
  // Nuevos selectores específicos
  hasGrainSelector?: boolean // Para lijas
  hasSizeSelector?: boolean // Para pinceles
  hasWidthSelector?: boolean // Para cintas de papel
  grainOptions?: string[] // Opciones de grano para lijas
  sizeOptions?: string[] // Opciones de tamaño para pinceles
  widthOptions?: string[] // Opciones de ancho para cintas
  // Configuración de colores permitidos
  allowedColorCategories?: string[] // Categorías de colores permitidas para este tipo de producto
}

// Configuración de tipos de productos
export const PRODUCT_TYPES: ProductType[] = [
  {
    id: 'pinturas-latex',
    name: 'Pinturas Látex',
    hasColorSelector: true,
    capacityUnit: 'litros',
    defaultCapacities: ['1L', '4L', '10L', '20L'],
    category: 'pinturas',
    allowedColorCategories: ['Neutros', 'Cálidos', 'Fríos', 'Tierras'], // Látex tiene todos los colores generales
  },
  {
    id: 'pinturas-esmalte',
    name: 'Pinturas Esmalte',
    hasColorSelector: true,
    capacityUnit: 'litros',
    defaultCapacities: ['1L', '4L', '10L', '20L'],
    category: 'pinturas',
    allowedColorCategories: ['Neutros', 'Cálidos', 'Fríos', 'Tierras', 'Sintético'], // Esmalte sintético incluye más colores
  },
  {
    id: 'impregnante-madera',
    name: 'Impregnante para Madera',
    hasColorSelector: true,
    capacityUnit: 'litros',
    defaultCapacities: ['1L', '4L', '10L'],
    category: 'protectores',
    allowedColorCategories: ['Madera'], // Solo colores de madera
  },
  {
    id: 'poximix',
    name: 'Poximix',
    hasColorSelector: false, // Solo viene en gris
    capacityUnit: 'kg',
    defaultCapacities: ['0.5kg', '1.25kg', '3kg', '5kg'],
    category: 'adhesivos',
  },
  {
    id: 'lijas',
    name: 'Lijas',
    hasColorSelector: false,
    capacityUnit: 'unidades',
    defaultCapacities: ['1', '5', '10'],
    category: 'herramientas',
    hasGrainSelector: true,
    grainOptions: ['40', '50', '80', '120', '180'],
  },
  {
    id: 'bandejas',
    name: 'Bandejas',
    hasColorSelector: false,
    capacityUnit: 'unidades',
    defaultCapacities: ['1'],
    category: 'accesorios',
  },
  {
    id: 'pinceles',
    name: 'Pinceles',
    hasColorSelector: false,
    capacityUnit: 'unidades',
    defaultCapacities: ['1'],
    category: 'herramientas',
    hasSizeSelector: true,
    sizeOptions: ['1/2"', '1"', '1 1/2"', '2"', '2 1/2"', '3"', '4"'],
  },
  {
    id: 'pinceles-persianeros',
    name: 'Pinceles Persianeros',
    hasColorSelector: false,
    capacityUnit: 'unidades',
    defaultCapacities: ['1'],
    category: 'herramientas',
    hasSizeSelector: false,
  },
  {
    id: 'rodillos',
    name: 'Rodillos',
    hasColorSelector: false,
    capacityUnit: 'unidades',
    defaultCapacities: ['1'],
    category: 'herramientas',
  },
  {
    id: 'cintas-papel',
    name: 'Cintas de Papel',
    hasColorSelector: false,
    capacityUnit: 'unidades',
    defaultCapacities: ['1'],
    category: 'accesorios',
    hasWidthSelector: true,
    widthOptions: ['18mm', '24mm', '36mm', '48mm'],
  },
  {
    id: 'terminaciones',
    name: 'Terminaciones',
    hasColorSelector: true,
    capacityUnit: 'litros',
    defaultCapacities: ['1L', '4L', '10L', '20L'],
    category: 'terminaciones',
    allowedColorCategories: ['Madera'], // Solo colores de madera para terminaciones
  },
]

// Función para detectar el tipo de producto basado en nombre y categoría
export const detectProductType = (productName: string, category?: string): ProductType => {
  const name = productName.toLowerCase()

  // Detección específica por nombre
  if (name.includes('poximix')) {
    return PRODUCT_TYPES.find(type => type.id === 'poximix')!
  }

  // Detección de impregnantes para madera (como Danzke)
  if (
    name.includes('impregnante') ||
    name.includes('danzke') ||
    (name.includes('protector') && name.includes('madera'))
  ) {
    return PRODUCT_TYPES.find(type => type.id === 'impregnante-madera')!
  }

  // Detección específica para Sintético Converlux
  if (name.includes('converlux') || name.includes('sintético') || name.includes('sintetico')) {
    return PRODUCT_TYPES.find(type => type.id === 'pinturas-esmalte')!
  }

  // Detección de terminaciones (barnices, lacas, etc.)
  if (
    name.includes('barniz') ||
    name.includes('laca') ||
    name.includes('terminacion') ||
    name.includes('terminación') ||
    name.includes('acabado')
  ) {
    return PRODUCT_TYPES.find(type => type.id === 'terminaciones')!
  }

  // Detección de productos sintéticos (esmaltes, converlux, etc.)
  if (
    name.includes('esmalte') ||
    name.includes('sintetico') ||
    name.includes('sintético') ||
    name.includes('converlux') ||
    name.includes('convertidor') ||
    (name.includes('metal') && name.includes('madera'))
  ) {
    return PRODUCT_TYPES.find(type => type.id === 'pinturas-esmalte')!
  }

  // Detección de pinturas látex (recuplast, interior, etc.)
  if (
    name.includes('latex') ||
    name.includes('látex') ||
    name.includes('recuplast') ||
    name.includes('interior') ||
    name.includes('exterior') ||
    name.includes('acrilico') ||
    name.includes('acrílico')
  ) {
    return PRODUCT_TYPES.find(type => type.id === 'pinturas-latex')!
  }

  if (name.includes('lija')) {
    return PRODUCT_TYPES.find(type => type.id === 'lijas')!
  }

  if (name.includes('bandeja')) {
    return PRODUCT_TYPES.find(type => type.id === 'bandejas')!
  }

  // Detección específica para pinceles persianeros
  if (name.includes('pincel') && name.includes('persianero')) {
    return PRODUCT_TYPES.find(type => type.id === 'pinceles-persianeros')!
  }

  // Detección de pinceles genéricos (EXCLUIR "pinceleta" que es precio único)
  if (name.includes('pincel') && !name.includes('pinceleta')) {
    return PRODUCT_TYPES.find(type => type.id === 'pinceles')!
  }

  // Pinceletas: producto de precio único, sin selector de tamaño
  if (name.includes('pinceleta')) {
    return PRODUCT_TYPES.find(type => type.id === 'pinceles-persianeros')! // Reutilizar tipo sin selector
  }

  if (name.includes('rodillo')) {
    return PRODUCT_TYPES.find(type => type.id === 'rodillos')!
  }

  if (name.includes('cinta') && (name.includes('papel') || name.includes('enmascarar'))) {
    return PRODUCT_TYPES.find(type => type.id === 'cintas-papel')!
  }

  // Detección por categoría
  if (category) {
    const cat = category.toLowerCase()

    if (cat.includes('pintura') || cat.includes('latex') || cat.includes('esmalte')) {
      // Distinguir entre esmalte sintético y látex
      if (
        name.includes('esmalte') ||
        name.includes('sintetico') ||
        name.includes('sintético') ||
        name.includes('converlux')
      ) {
        return PRODUCT_TYPES.find(type => type.id === 'pinturas-esmalte')!
      }
      return PRODUCT_TYPES.find(type => type.id === 'pinturas-latex')!
    }

    if (cat.includes('protector') || cat.includes('impregnante')) {
      return PRODUCT_TYPES.find(type => type.id === 'impregnante-madera')!
    }

    if (cat.includes('terminacion') || cat.includes('terminación')) {
      return PRODUCT_TYPES.find(type => type.id === 'terminaciones')!
    }

    if (cat.includes('adhesivo') || cat.includes('pegamento')) {
      return PRODUCT_TYPES.find(type => type.id === 'poximix')!
    }

    if (cat.includes('herramienta')) {
      return PRODUCT_TYPES.find(type => type.id === 'pinceles')!
    }

    if (cat.includes('accesorio')) {
      return PRODUCT_TYPES.find(type => type.id === 'bandejas')!
    }
  }

  // Por defecto, asumir que es pintura látex
  return PRODUCT_TYPES.find(type => type.id === 'pinturas-latex')!
}

// Función para obtener capacidades formateadas según la unidad
export const formatCapacity = (capacity: string, unit: string): string => {
  // Si la capacidad es "Sin especificar", devolverla tal como está
  if (capacity === 'Sin especificar') {
    return capacity
  }

  // Normalización global previa: arreglar combinaciones incorrectas de unidades
  // - "KGL" => "KG"
  // - "KG L" / "KG LT" / "KG LTS" / "KG LITRO(S)" => "KG"
  capacity = capacity
    .replace(/KGL/gi, 'KG')
    .replace(/\bKG\s*(L|LT|LTS|LITRO|LITROS)\b/gi, 'KG')

  switch (unit) {
    case 'litros':
      {
        // Normalizar y evitar mezclar unidades (ej: "5KG" + "L" => "5KG")
        const raw = capacity.trim()
        const up = raw.toUpperCase()

        // Fijar casos erróneos: sufijo combinado "KGL" (ya saneado arriba) o "KG" seguido de litros
        if (/KG/i.test(up)) {
          const normalized = up
            .replace(/KGL/gi, 'KG')
            .replace(/\s*(L|LT|LTS|LITRO|LITROS)\s*$/i, '')
          return normalized
        }

        // Si el texto ya contiene KG/KILO, respetar y normalizar a KG
        if (/\b(KG|KGS|KILO|KILOS)\b/i.test(up)) {
          const withoutKg = up.replace(/\s*(KG|KGS|KILO|KILOS)\s*$/i, '')
          return `${withoutKg}KG`
        }

        // Si el texto parece una medida compuesta (mm/cm/m, con "x"), normalizar unidades y no agregar sufijo adicional
        if (/(MM|CM|\bM\b)/i.test(up) || /x/i.test(up)) {
          let s = raw
            .replace(/(?<=\d)MM/gi, 'mm')
            .replace(/(?<=\d)CM/gi, 'cm')
            .replace(/(?<=\d)\s*M\b/gi, 'm')
            .replace(/\s*[xX]\s*/g, ' x ')
            .replace(/\s*(?:METROS?|M)\s*$/i, 'm')
            .replace(/\s+/g, ' ')
            .trim()
          return s
        }

        // Caso normal: unificar a sufijo "L"
        const withoutL = up.replace(/\s*(L|LT|LTS|LITRO|LITROS)\s*$/i, '')
        return `${withoutL}L`
      }
    case 'kg':
      {
        // Normalizar, y si contiene litros, respetar y normalizar a L
        const raw = capacity.trim()
        const up = raw.toUpperCase()
        // Si tiene alguna referencia a litros en cualquier posición, eliminarla
        if (/(L|LT|LTS|LITRO|LITROS)/i.test(up)) {
          const withoutL = up.replace(/\s*(L|LT|LTS|LITRO|LITROS)\s*$/gi, '')
          // Evitar repetir sufijos si ya termina en KG
          const cleaned = /KG\s*$/i.test(withoutL) ? withoutL : `${withoutL}KG`
          return cleaned
        }
        // Quitar variantes: KG, KGS, KILO, KILOS al final si existen y unificar
        const withoutKg = up.replace(/\s*(KG|KGS|KILO|KILOS)\s*$/i, '')
        return `${withoutKg}KG`
      }
    case 'metros':
      {
        const raw = capacity.trim()
        // Normalizar tokens internos: mm/cm/m y el separador "x"
        let s = raw
          .replace(/(?<=\d)MM/gi, 'mm')
          .replace(/(?<=\d)CM/gi, 'cm')
          .replace(/(?<=\d)\s*M\b/gi, 'm')
          .replace(/\s*[xX]\s*/g, ' x ')
          .replace(/\s+/g, ' ')
          .trim()

        // Si ya contiene alguna unidad (mm/cm/m) o una composición con "x", no agregar sufijo extra
        if (/(\bmm\b|\bcm\b|\bm\b)/i.test(s) || /\sx\s/i.test(s)) {
          // Estandarizar posible sufijo final a "m"
          s = s.replace(/\s*(?:METROS?|M)\s*$/i, 'm')
          return s
        }

        // Valor simple: unificar sufijo final a "m"
        const up = s.toUpperCase()
        const withoutM = up.replace(/\s*(M|METRO|METROS)\s*$/i, '')
        return `${withoutM}m`
      }
    case 'unidades':
      {
        const txt = capacity.trim()
        // Remover "unidad" o "unidades" si ya están presentes
        const withoutUnidad = txt.replace(/\s*unidad(es)?$/i, '')
        
        // Para cintas de papel, si ya contiene medidas (mm, cm, m), no agregar "unidades"
        if (/(mm|cm|\bm\b)/i.test(withoutUnidad) || /\sx\s/i.test(withoutUnidad)) {
          // Si contiene "x 40m", extraer solo la parte del ancho
          if (/\sx\s.*m/i.test(withoutUnidad)) {
            return withoutUnidad.split(' x ')[0]
          }
          return withoutUnidad
        }
        
        return withoutUnidad
      }
    default:
      return capacity
  }
}

// Función para obtener el color por defecto según el tipo de producto
export const getDefaultColor = (productType: ProductType): string => {
  if (!productType.hasColorSelector) {
    // Productos sin selector de color tienen un color fijo
    if (productType.id === 'poximix') return 'gris'
    return 'natural'
  }

  return 'BLANCO' // Color por defecto para productos con selector (normalizado)
}

// ============================================================================
// SISTEMA DE BADGES INTELIGENTE
// ============================================================================

// Mapeo de colores a códigos hexadecimales
const COLOR_HEX_MAP: Record<string, string> = {
  // Colores básicos
  'blanco': '#FFFFFF',
  'blanco-puro': '#FFFFFF',
  'negro': '#000000',
  'gris': '#808080',
  'rojo': '#FF0000',
  // Variantes específicas de rojo
  'rojo teja': '#A63A2B',
  'rojo-teja': '#A63A2B',
  'teja': '#A63A2B',
  'azul': '#0000FF',
  'verde': '#008000',
  'amarillo': '#FFFF00',
  'naranja': '#FFA500',
  'rosa': '#FFC0CB',
  'violeta': '#8A2BE2',
  'marrón': '#A52A2A',
  'beige': '#F5F5DC',
  
  // Colores de madera
  'roble': '#C7955B',
  'caoba': '#8E3B1F',
  'cerezo': '#8B0000',
  'nogal': '#5C3A1A',
  'pino': '#E5B57E',
  'cedro': '#C26A2B',
  'teca': '#B67828',
  'teka': '#B67828',
  'eucalipto': '#B8860B',
  'castaño': '#954535',
  'ebano': '#2C1810',
  'haya': '#F5DEB3',
  'fresno': '#E6D3A3',
  'maple': '#D2B48C',
  'bambú': '#DAA520',
  // Colores adicionales de madera (impregnantes)
  'viraro': '#C35817',
  'virar': '#C35817',
  'viraró': '#C35817',
  'habano': '#8B7355',
  'algarrobo': '#A0522D',
  'peteribi': '#D4A76A',
  'peteribí': '#D4A76A',
  'medio': '#A0522D',
  'oscuro': '#4A2C2A',
  
  // Colores sintéticos
  'aluminio': '#C0C0C0',
  'cobre': '#B87333',
  'bronce': '#CD7F32',
  'oro': '#FFD700',
  'plata': '#C0C0C0',
  'acero': '#71797E',
  'hierro': '#464451',
  
  // Colores neutros
  'crema': '#FFFDD0',
  'marfil': '#FFFFF0',
  'hueso': '#F9F6EE',
  
  // Colores cálidos
  'terracota': '#E2725B',
  'ocre': '#CC7722',
  'siena': '#A0522D',
  
  // Colores fríos
  'turquesa': '#40E0D0',
  'aguamarina': '#7FFFD4',
  'celeste': '#87CEEB',
  
  // Colores tierra
  'tierra': '#8B4513',
  'arcilla': '#CD853F',
  'arena': '#F4A460',
  
  // Materiales de construcción
  'cemento': '#A8A8A8',
  'concreto': '#A8A8A8',
  'ladrillo': '#B22222',
  'piedra': '#696969',
  'mármol': '#F8F8FF',
  'granito': '#2F4F4F',
  
  // Colores especiales
  'natural': '#DEB887',
  'transparente': 'rgba(255,255,255,0.1)',
  'incoloro': 'rgba(255,255,255,0.1)',
  // Impregnantes especiales
  'cristal': '#E8D5B5',
  
  // Colores SINTETICO CONVERLUX (20 colores completos de la BD)
  'aluminio': '#A8A8A8',
  'amarillo': '#FFFF00',
  'amarillo mediano': '#FFD700',
  'amarillo-mediano': '#FFD700',
  'azul marino': '#000080',
  'azul-marino': '#000080',
  'azul traful': '#4682B4',
  'azul-traful': '#4682B4',
  'bermellon': '#E34234',
  'bermellón': '#E34234',
  'blanco': '#FFFFFF',
  'blanco brill': '#FFFFFF',
  'blanco-brill': '#FFFFFF',
  'blanco brillante': '#FFFFFF',
  'blanco-brillante': '#FFFFFF',
  'blanco mate': '#F5F5F5',
  'blanco-mate': '#F5F5F5',
  'blanco sat': '#F8F8FF',
  'blanco-sat': '#F8F8FF',
  'blanco satinado': '#F8F8FF',
  'blanco-satinado': '#F8F8FF',
  'gris': '#808080',
  'gris espacial': '#696969',
  'gris-espacial': '#696969',
  'gris perla': '#C0C0C0',
  'gris-perla': '#C0C0C0',
  'marfil': '#FFFFF0',
  'marron': '#8B4513',
  'marrón': '#8B4513',
  'naranja': '#FF8C00',
  'negro': '#000000',
  'negro brill': '#000000',
  'negro-brill': '#000000',
  'negro brillante': '#000000',
  'negro-brillante': '#000000',
  'negro mate': '#000000',
  'negro-mate': '#000000',
  'negro sat': '#000000',
  'negro-sat': '#000000',
  'negro satinado': '#000000',
  'negro-satinado': '#000000',
  'tostado': '#D2B48C',
  'verde ingles': '#355E3B',
  'verde-ingles': '#355E3B',
  'verde inglés': '#355E3B',
  'verde-inglés': '#355E3B',
  'verde noche': '#013220',
  'verde-noche': '#013220',
  
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
  'wengue': '#3C2415',
  'wenge': '#3C2415'
}

/**
 * Obtiene el código hexadecimal de un color
 */
export const getColorHex = (colorName: string): string | undefined => {
  const normalizedColor = colorName.toLowerCase().trim()
  return COLOR_HEX_MAP[normalizedColor]
}

// Interfaces para badges
export interface ProductBadgeInfo {
  type: 'capacity' | 'color' | 'finish' | 'new' | 'discount' | 'shipping' | 'material' | 'grit' | 'dimension' | 'color-circle'
  value: string
  displayText: string
  color: string
  bgColor: string
  isCircular?: boolean
  circleColor?: string
}

export interface ExtractedProductInfo {
  capacity?: string
  color?: string
  finish?: string
  material?: string
  grit?: string
  dimensions?: string
  weight?: string
  brand?: string
}

// Interfaces para datos estructurados de la base de datos
export interface ProductDatabaseData {
  features?: Record<string, any>
  specifications?: Record<string, any>
  dimensions?: Record<string, any>
  weight?: number
  brand?: string
  // Campos directos de la base de datos
  color?: string
  medida?: string
}

// Funciones auxiliares para extraer datos de la base de datos

/**
 * Extrae información desde el campo features
 */
const extractFromFeatures = (features: Record<string, any>, type: string): string | undefined => {
  const normalizedType = type.toLowerCase()
  
  // Buscar por claves comunes
  const commonKeys = {
    capacity: ['capacity', 'volume', 'size', 'cantidad', 'volumen', 'tamaño', 'medida'],
    color: ['color', 'colour', 'tint', 'shade', 'tinte', 'matiz'],
    finish: ['finish', 'acabado', 'terminacion', 'surface', 'superficie'],
    material: ['material', 'composition', 'composicion', 'type', 'tipo'],
    grit: ['grit', 'grain', 'granulado', 'grano', 'textura', 'texture']
  }

  const keys = commonKeys[normalizedType as keyof typeof commonKeys] || [normalizedType]
  
  for (const key of keys) {
    if (features[key]) {
      return normalizeValue(String(features[key]))
    }
  }

  return undefined
}

/**
 * Extrae información desde el campo specifications
 */
const extractFromSpecifications = (specifications: Record<string, any>, type: string): string | undefined => {
  const normalizedType = type.toLowerCase()
  
  // Buscar por claves comunes en especificaciones
  const specKeys = {
    capacity: ['capacity', 'volume', 'content', 'contenido', 'volumen', 'litros', 'ml', 'kg'],
    color: ['color', 'colour', 'tint', 'pigment', 'pigmento', 'tinte'],
    finish: ['finish', 'sheen', 'gloss', 'brillo', 'acabado', 'terminacion'],
    material: ['base', 'material', 'binder', 'aglutinante', 'resina', 'resin'],
    grit: ['grit', 'abrasive', 'abrasivo', 'granulometria', 'mesh']
  }

  const keys = specKeys[normalizedType as keyof typeof specKeys] || [normalizedType]
  
  for (const key of keys) {
    if (specifications[key]) {
      return normalizeValue(String(specifications[key]))
    }
  }

  return undefined
}

/**
 * Extrae información de dimensiones
 */
const extractDimensionsInfo = (dimensions: Record<string, any>): string => {
  const parts: string[] = []
  
  // Buscar dimensiones comunes
  const width = findDimensionValue(dimensions, ['width', 'ancho', 'w'])
  const height = findDimensionValue(dimensions, ['height', 'alto', 'h'])
  const depth = findDimensionValue(dimensions, ['depth', 'profundidad', 'largo', 'length', 'd', 'l'])
  const diameter = findDimensionValue(dimensions, ['diameter', 'diametro', 'dia'])

  if (diameter) {
    parts.push(`⌀${diameter}`)
  } else {
    if (width) parts.push(`${width}`)
    if (height) parts.push(`${height}`)
    if (depth) parts.push(`${depth}`)
  }

  return parts.length > 0 ? parts.join('×') : ''
}

/**
 * Busca un valor de dimensión por múltiples claves posibles
 */
const findDimensionValue = (dimensions: Record<string, any>, keys: string[]): string | undefined => {
  for (const key of keys) {
    if (dimensions[key]) {
      const value = String(dimensions[key])
      // Agregar unidad si no la tiene
      return value.match(/\d+\s*(mm|cm|m|in|")/) ? value : `${value}cm`
    }
  }
  return undefined
}

/**
 * Normaliza valores extraídos de la base de datos
 */
const normalizeValue = (value: string): string => {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^(.*?)\s*[\(\[].*[\)\]]$/, '$1') // Remover contenido entre paréntesis/corchetes
    .trim()
}

/**
 * Extrae información desde múltiples fuentes con prioridad en datos estructurados
 * Prioridad: 1) Datos de BD (features/specifications/dimensions), 2) Variantes, 3) Nombre del producto
 */
export const extractProductCapacity = (
  productName: string,
  variants?: Array<{ measure?: string; color_name?: string; finish?: string }>,
  description?: string,
  databaseData?: ProductDatabaseData,
  slug?: string
): ExtractedProductInfo => {
  const result: ExtractedProductInfo = {}
  const productType = detectProductType(productName)

  // 1. PRIORIDAD MÁXIMA: Variantes (más confiable que campos legacy)
  if (variants && variants.length > 0) {
    const defaultVariant = variants.find(v => v.measure) || variants[0]
    if (defaultVariant?.measure) {
      result.capacity = defaultVariant.measure
    }

    // Colores desde variantes: tomar todos los distintos
    const uniqueColors = Array.from(
      new Set(
        variants
          .map(v => (v.color_name || '').toString().trim())
          .filter(Boolean)
      )
    )

    if (uniqueColors.length > 0) {
      // Guardar como lista separada por comas para soportar múltiples badges
      result.color = uniqueColors.join(', ')
    } else if (defaultVariant?.color_name) {
      // Fallback a color del defaultVariant si no hay lista válida
      result.color = defaultVariant.color_name
    }

    // Acabados/terminaciones desde variantes: soportar múltiples
    const uniqueFinishes = Array.from(
      new Set(
        variants
          .map(v => (v.finish || '').toString().trim())
          .filter(Boolean)
          .map(f => f.charAt(0).toUpperCase() + f.slice(1).toLowerCase())
      )
    )

    if (uniqueFinishes.length > 0) {
      result.finish = uniqueFinishes.join(', ')
    } else if (defaultVariant?.finish) {
      result.finish = defaultVariant.finish
    }
  }

  // 2. SEGUNDA PRIORIDAD: Datos de la base de datos (features, specifications, etc.)
  if (databaseData) {
    // Campos legacy solo como fallback si no hay variantes
    if (!result.color && databaseData.color) {
      result.color = databaseData.color
    }
    if (!result.capacity && databaseData.medida) {
      result.capacity = databaseData.medida
    }

    // Extraer desde features
    if (databaseData.features) {
      result.capacity = extractFromFeatures(databaseData.features, 'capacity') || result.capacity
      result.color = extractFromFeatures(databaseData.features, 'color') || result.color
      result.finish = extractFromFeatures(databaseData.features, 'finish') || result.finish
      result.material = extractFromFeatures(databaseData.features, 'material') || result.material
      result.grit = extractFromFeatures(databaseData.features, 'grit') || result.grit
    }

    // Extraer desde specifications
    if (databaseData.specifications) {
      result.capacity = extractFromSpecifications(databaseData.specifications, 'capacity') || result.capacity
      result.color = extractFromSpecifications(databaseData.specifications, 'color') || result.color
      result.finish = extractFromSpecifications(databaseData.specifications, 'finish') || result.finish
      result.material = extractFromSpecifications(databaseData.specifications, 'material') || result.material
      result.grit = extractFromSpecifications(databaseData.specifications, 'grit') || result.grit
    }

    // Extraer desde dimensions
    if (databaseData.dimensions) {
      result.dimensions = extractDimensionsInfo(databaseData.dimensions)
    }

    // Extraer peso y marca
    if (databaseData.weight) {
      result.weight = `${databaseData.weight}kg`
    }
    if (databaseData.brand) {
      result.brand = databaseData.brand
    }
  }

  // 3. TERCERA PRIORIDAD: Extraer del nombre del producto (fallback)
  if (!result.capacity) {
    result.capacity = extractCapacityFromName(productName)
  }
  
  // Solo extraer color del nombre si NO hay variantes (productos sin variantes pueden necesitarlo)
  // Si hay variantes con color_name: null, significa que el producto es incoloro
  if (!result.color && (!variants || variants.length === 0)) {
    result.color = extractColorFromName(productName)
  }

  if (!result.finish) {
    // Intentar extraer desde el slug real si está disponible; si no, derivarlo del nombre
    const maybeSlug = (slug || productName)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    if (/(^|-)satinad[oa](-|$)/i.test(maybeSlug)) {
      result.finish = 'Satinado'
    } else if (/(^|-)brillant(e|e-)?(-|$)/i.test(maybeSlug) || /(^|-)brillo(-|$)/i.test(maybeSlug)) {
      result.finish = 'Brillante'
    }
    // Si no está en el slug, probar con el nombre plano
    if (!result.finish) {
      result.finish = extractFinishFromName(productName)
    }
  }

  if (!result.material) {
    result.material = extractMaterialFromName(productName)
  }

  if (!result.grit) {
    result.grit = extractGritFromName(productName)
  }

  // Complementar grano para lijas desde medida/BD/capacidad
  if (productType?.id === 'lijas' && !result.grit) {
    const capSource = ((result.capacity || databaseData?.medida || '') as string).toLowerCase()
    const gritMatch = capSource.match(/grano\s*(\d+)|(\d+)\s*grano|(?:^|\b)(\d{2,4})(?:\b|$)/i)
    if (gritMatch) {
      const gritVal = gritMatch[1] || gritMatch[2] || gritMatch[3]
      if (gritVal) {
        result.grit = `Grano ${gritVal}`
      }
    }
  }

  // 3.1 Complementar detección de acabado a partir de la descripción si es necesario
  if (!result.finish && description) {
    const desc = description.toLowerCase()
    if (/(^|\b)satinad[oa](\b|$)/.test(desc)) {
      result.finish = 'Satinado'
    } else if (/brill/i.test(desc)) {
      result.finish = 'Brillante'
    }
  }

  // 4. FALLBACK INTELIGENTE POR TIPO DE PRODUCTO
  // Si no logramos extraer capacidad/medida del nombre, variantes o BD,
  // usar capacidades por defecto definidas en PRODUCT_TYPES para asegurar un badge útil.
  if (!result.capacity) {
    const productType = detectProductType(productName)
    const isSandpaper = productType?.id === 'lijas' || /\blija\b/i.test(productName)
    const isBandeja = productType?.id === 'bandejas' || /\bbandeja\b/i.test(productName)

    // Para lijas, si tenemos grano, NO mostrar la capacidad por defecto "1 unidad"
    // Para bandejas, NO mostrar la capacidad por defecto "1 unidad" ya que no es útil
    if (!(isSandpaper && result.grit) && !isBandeja) {
      if (productType?.defaultCapacities && productType.defaultCapacities.length > 0) {
        result.capacity = productType.defaultCapacities[0]
      }
    }
  }

  // 4. Fallback específico para impregnantes DANZKE: aplicar paleta completa en todas las presentaciones
  // Si el producto es un impregnate para madera y no se detectaron colores válidos
  // (o viene solo "blanco/incoloro"), usamos una paleta estándar de tonos madera.
  if (productType?.id === 'impregnante-madera') {
    const DANZKE_PALETTE = ['caoba', 'cedro', 'cristal', 'nogal', 'pino', 'roble']
    const lowerName = (productName || '').toLowerCase()
    const hasValidColors = !!(result.color && /\w/.test(result.color) && !/(^|,\s*)(blanco|blanco\s*puro|blanco-puro|crema)(\s*,|$)/i.test(result.color))

    // Para Danzke, compartir siempre la misma paleta entre Brillante/Satinado y 1L/4L
    if (lowerName.includes('danzke')) {
      result.color = DANZKE_PALETTE.join(', ')
    } else if (!hasValidColors) {
      // Para otros impregnantes, usar la paleta estándar si no hay colores válidos
      result.color = DANZKE_PALETTE.join(', ')
    }
    // Asegurar acabado para impregnantes si no se detectó
    if (!result.finish) {
      // Alternar determinísticamente entre Brillante/Satinado usando nombre + capacidad
      // para que diferentes presentaciones (1L, 4L, 10L) no colisionen.
      const measureFromVariants = variants?.find(v => v.measure)?.measure
      const measure = (result.capacity || databaseData?.medida || measureFromVariants || '').toString()
      const key = `${(productName || '').toLowerCase()}|${measure.toLowerCase()}`
      let hash = 0
      for (let i = 0; i < key.length; i++) {
        // Hash simple pero con mejor distribución que una suma lineal
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0
      }
      result.finish = hash % 2 === 0 ? 'Brillante' : 'Satinado'
    }
  }

  // 5. Normalizar formato de capacidad SOLO si NO viene de variantes
  // Las variantes ya tienen medidas normalizadas ("350GR", "1L", etc.)
  if (result.capacity && (!variants || variants.length === 0)) {
    const pt = detectProductType(productName)
    if (pt?.capacityUnit) {
      result.capacity = formatCapacity(result.capacity, pt.capacityUnit)
    }
  }

  return result
}

/**
 * Extrae capacidad/medida del nombre del producto
 */
export const extractCapacityFromName = (productName: string): string | undefined => {
  if (!productName) return undefined

  const name = productName.toLowerCase()
  
  // Patrones de capacidad más específicos y mejorados
  const patterns = [
    // Litros - patrones más amplios
    /(\d+(?:[.,]\d+)?)\s*l(?:itros?|ts?)?(?:\s|$|[^\w])/i,
    /(\d+(?:[.,]\d+)?)\s*lts?(?:\s|$|[^\w])/i,
    
    // Kilogramos - patrones más amplios
    /(\d+(?:[.,]\d+)?)\s*kg(?:s)?(?:\s|$|[^\w])/i,
    /(\d+(?:[.,]\d+)?)\s*kilos?(?:\s|$|[^\w])/i,
    
    // Gramos - mejorado
    /(\d+(?:[.,]\d+)?)\s*g(?:r|ramos?)?(?:\s|$|[^\w])/i,
    
    // Metros - patrones más amplios
    /(\d+(?:[.,]\d+)?)\s*m(?:etros?|ts?)?(?:\s|$|[^\w])/i,
    
    // Centímetros - mejorado
    /(\d+(?:[.,]\d+)?)\s*cm(?:\s|$|[^\w])/i,
    
    // Milímetros - mejorado
    /(\d+(?:[.,]\d+)?)\s*mm(?:\s|$|[^\w])/i,
    
    // Pulgadas - patrones más amplios
    /(\d+(?:[.,]\d+)?)\s*(?:pulgadas?|"|''|pulg)(?:\s|$|[^\w])/i,
    
    // Grano (para lijas) - patrones más amplios
    /grano\s*(\d+)/i,
    /(\d+)\s*grano/i,
    /g\s*(\d+)/i,
    /(\d+)\s*g(?=\s|$)/i,
    
    // Número (para brocas, etc.) - patrones más amplios
    /n[°º]?\s*(\d+)/i,
    /(\d+)\s*n[°º]/i,
    /nro\s*(\d+)/i,
    /(\d+)\s*nro/i,
    
    // Unidades - patrones más amplios
    /(\d+)\s*(?:unidades?|u|pcs?|piezas?|und?)(?:\s|$|[^\w])/i,
    
    // Capacidades específicas para productos de pinturería
    /(\d+(?:[.,]\d+)?)\s*(?:cc|ml)(?:\s|$|[^\w])/i, // Mililitros
    /(\d+(?:[.,]\d+)?)\s*(?:galones?|gal)(?:\s|$|[^\w])/i, // Galones
    
    // Medidas de ancho/largo para cintas, etc.
    /(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)\s*(?:cm|mm|m)(?:\s|$|[^\w])/i,
    
    // Patrones para herramientas (brocas, mechas, etc.)
    /(\d+(?:[.,]\d+)?)\s*(?:mm|cm)\s*(?:diámetro|diam|ø)/i,
    /ø\s*(\d+(?:[.,]\d+)?)\s*(?:mm|cm)/i,
    
    // Patrones para lijas con grano
    /lija\s*(\d+)/i,
    /(\d+)\s*lija/i,
    
    // Patrones para pinceles con medidas
    /(\d+(?:[.,]\d+)?)\s*(?:pulgadas?|"|'')\s*(?:pincel|brocha)/i,
    /pincel\s*(\d+(?:[.,]\d+)?)\s*(?:pulgadas?|"|'')/i
  ]

  for (const pattern of patterns) {
    const match = name.match(pattern)
    if (match) {
      const value = match[1]
      const value2 = match[2] // Para patrones con dos valores (ej: 10x20cm)
      
      // Determinar la unidad basada en el patrón
      if (pattern.source.includes('litros') || pattern.source.includes('lts')) return `${value}L`
      if (pattern.source.includes('kg')) return `${value}kg`
      if (pattern.source.includes('gramos') || (pattern.source.includes('g') && !pattern.source.includes('grano'))) return `${value}g`
      if (pattern.source.includes('metros') && !pattern.source.includes('mm') && !pattern.source.includes('cm')) return `${value}m`
      if (pattern.source.includes('cm')) {
        if (value2) return `${value}x${value2}cm`
        return `${value}cm`
      }
      if (pattern.source.includes('mm')) {
        if (value2) return `${value}x${value2}mm`
        return `${value}mm`
      }
      if (pattern.source.includes('pulgadas') || pattern.source.includes('"')) return `${value}"`
      if (pattern.source.includes('grano') || pattern.source.includes('lija')) return `Grano ${value}`
      if (pattern.source.includes('n[') || pattern.source.includes('nro')) return `Nº${value}`
      if (pattern.source.includes('unidades') || pattern.source.includes('pcs')) return `${value}u`
      if (pattern.source.includes('cc') || pattern.source.includes('ml')) return `${value}ml`
      if (pattern.source.includes('galones')) return `${value}gal`
      if (pattern.source.includes('diámetro') || pattern.source.includes('ø')) return `ø${value}mm`
    }
  }

  return undefined
}

/**
 * Extrae colores del nombre del producto (puede devolver múltiples colores)
 */
export const extractColorsFromName = (productName: string): string[] => {
  if (!productName) return []

  // Normalizar variaciones gramaticales comunes (femenino/plural) para mejorar coincidencias
  let name = productName.toLowerCase()
  const grammaticalVariants: Array<[RegExp, string]> = [
    [/\bblancas?\b/g, 'blanco'],
    [/\bnegra?s?\b/g, 'negro'],
    [/\broja?s?\b/g, 'rojo'],
    [/\bamarilla?s?\b/g, 'amarillo'],
    [/\bnaranja?s?\b/g, 'naranja'],
    [/\brosa?s?\b/g, 'rosa'],
    [/\bvioleta?s?\b/g, 'violeta'],
    [/\bazules?\b/g, 'azul'],
    [/\bverdes?\b/g, 'verde'],
    [/\bmarrones?\b/g, 'marrón'],
    [/\bbeiges?\b/g, 'beige']
  ]
  for (const [regex, replacement] of grammaticalVariants) {
    name = name.replace(regex, replacement)
  }
  const foundColors: string[] = []
  
  const colors = [
    'blanco', 'negro', 'rojo', 'azul', 'verde', 'amarillo', 'naranja', 'violeta',
    'gris', 'marron', 'beige', 'crema', 'marfil', 'rosa', 'celeste', 'turquesa',
    'dorado', 'plateado', 'bronce', 'cobre', 'natural', 'transparente', 'incoloro',
    'cemento', 'concreto', 'ladrillo', 'piedra', 'mármol', 'granito', 'acero', 'hierro',
    'roble', 'caoba', 'cerezo', 'nogal', 'pino', 'cedro', 'teca', 'eucalipto',
    'castaño', 'ebano', 'haya', 'fresno', 'maple', 'bambú', 'terracota', 'ocre', 'siena',
    'tierra', 'arcilla', 'arena', 'aguamarina', 'aluminio'
  ]

  for (const color of colors) {
    if (name.includes(color)) {
      foundColors.push(color.charAt(0).toUpperCase() + color.slice(1))
    }
  }

  return foundColors
}

/**
 * Extrae color del nombre del producto (mantiene compatibilidad)
 */
export const extractColorFromName = (productName: string): string | undefined => {
  const colors = extractColorsFromName(productName)
  return colors.length > 0 ? colors[0] : undefined
}

/**
 * Extrae acabado del nombre del producto
 */
export const extractFinishFromName = (productName: string): string | undefined => {
  if (!productName) return undefined

  const name = productName.toLowerCase()
  
  const finishes = [
    'mate', 'satinado', 'brillante', 'semi-mate', 'semi-brillante',
    'texturado', 'liso', 'rugoso', 'antideslizante'
  ]

  for (const finish of finishes) {
    if (name.includes(finish)) {
      return finish.charAt(0).toUpperCase() + finish.slice(1)
    }
  }

  return undefined
}

/**
 * Extrae material del nombre del producto
 */
export const extractMaterialFromName = (productName: string): string | undefined => {
  if (!productName) return undefined

  const name = productName.toLowerCase()
  
  const materials = [
    'latex', 'esmalte', 'acrilico', 'sintetico', 'alquidico', 'poliuretano',
    'epoxi', 'vinilico', 'caucho', 'silicona', 'ceramico', 'metalico'
  ]

  for (const material of materials) {
    if (name.includes(material)) {
      return material.charAt(0).toUpperCase() + material.slice(1)
    }
  }

  return undefined
}

/**
 * Extrae grano de lijas del nombre del producto
 */
export const extractGritFromName = (productName: string): string | undefined => {
  if (!productName) return undefined

  const name = productName.toLowerCase()
  const granoMatch = name.match(/grano\s*(\d+)|(\d+)\s*grano/i)
  
  if (granoMatch) {
    const grano = granoMatch[1] || granoMatch[2]
    return `Grano ${grano}`
  }

  return undefined
}

/**
 * Formatea los badges de producto con configuración extendida
 */
export const formatProductBadges = (
  extractedInfo: ExtractedProductInfo,
  options: {
    showCapacity?: boolean
    showColor?: boolean
    showFinish?: boolean
    showMaterial?: boolean
    showGrit?: boolean
    showDimensions?: boolean
    showWeight?: boolean
    showBrand?: boolean
    maxBadges?: number
    productType?: ProductType
  } = {}
): ProductBadgeInfo[] => {
  const {
    showCapacity = true,
    showColor = true,
    showFinish = true,
    showMaterial = true,
    showGrit = true,
    showDimensions = true,
    showWeight = true,
    showBrand = false, // Por defecto oculto para no saturar
    maxBadges = 4,
    productType
  } = options

  const badges: ProductBadgeInfo[] = []

  // Badge de capacidad/medida
  if (showCapacity && extractedInfo.capacity) {
    const capText = String(extractedInfo.capacity)
    // Evitar badge redundante para lijas: si hay grano y la capacidad es "unidades"
    const isUnits = /(unidad(?:es)?)/i.test(capText)
    if (!(extractedInfo.grit && isUnits)) {
      badges.push({
        type: 'capacity',
        value: extractedInfo.capacity,
        displayText: capText,
        color: 'text-blue-700',
        bgColor: 'bg-blue-100'
      })
    }
  }

  // Badge de dimensiones
  if (showDimensions && extractedInfo.dimensions) {
    badges.push({
      type: 'dimension',
      value: extractedInfo.dimensions,
      displayText: extractedInfo.dimensions,
      color: 'text-purple-700',
      bgColor: 'bg-purple-100'
    })
  }

  // Badge de peso
  if (showWeight && extractedInfo.weight) {
    badges.push({
      type: 'capacity', // Reutilizamos el tipo capacity para peso
      value: extractedInfo.weight,
      displayText: extractedInfo.weight,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-100'
    })
  }

  // Badge de grano/grit
  if (showGrit && extractedInfo.grit) {
    badges.push({
      type: 'grit',
      value: extractedInfo.grit,
      // El valor ya puede venir como "Grano 120"; no duplicar prefijo
      displayText: extractedInfo.grit,
      color: 'text-amber-700',
      bgColor: 'bg-amber-100'
    })
  }

  // Badge de material
  if (showMaterial && extractedInfo.material) {
    badges.push({
      type: 'material',
      value: extractedInfo.material,
      displayText: extractedInfo.material,
      color: 'text-green-700',
      bgColor: 'bg-green-100'
    })
  }

  // Badge de acabado
  if (showFinish && extractedInfo.finish) {
    // Soportar múltiples acabados separados por coma
    const finishValues = extractedInfo.finish.split(',').map(f => f.trim()).filter(Boolean)
    for (const finish of finishValues) {
      if (badges.length >= maxBadges) break
      badges.push({
        type: 'finish',
        value: finish,
        displayText: finish,
        color: 'text-pink-700',
        bgColor: 'bg-pink-100'
      })
    }
  }

  // Badge de color - Versión circular (soporte para múltiples colores)
  // Omitir badge de color para cintas de papel
  if (showColor && extractedInfo.color) {
    // Detectar si es una cinta de papel usando el tipo de producto
    const isCintaPapel = productType?.id === 'cintas-papel'
    
    if (!isCintaPapel) {
      // Detectar múltiples colores separados por comas
      const colorNames = extractedInfo.color.split(',').map(c => c.trim())
      
      for (const colorName of colorNames) {
        if (badges.length >= maxBadges) break // Respetar límite de badges
        
        const colorHex = getColorHex(colorName)
        
        if (colorHex) {
          // Badge circular con color real
          badges.push({
            type: 'color-circle',
            value: colorName,
            displayText: colorName,
            color: 'text-gray-700',
            bgColor: 'bg-transparent',
            isCircular: true,
            circleColor: colorHex
          })
        } else {
          // Badge tradicional si no se encuentra el color
          badges.push({
            type: 'color',
            value: colorName,
            displayText: colorName,
            color: 'text-red-700',
            bgColor: 'bg-red-100'
          })
        }
      }
    }
  }

  // Badge de marca
  if (showBrand && extractedInfo.brand) {
    badges.push({
      type: 'material', // Reutilizamos el tipo material para marca
      value: extractedInfo.brand,
      displayText: extractedInfo.brand,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100'
    })
  }

  // Limitar número de badges
  return badges.slice(0, maxBadges)
}
