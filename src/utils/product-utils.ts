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
    defaultCapacities: ['5kg', '10kg', '25kg'],
    category: 'adhesivos',
  },
  {
    id: 'lijas',
    name: 'Lijas',
    hasColorSelector: false,
    capacityUnit: 'unidades',
    defaultCapacities: ['1 unidad', '5 unidades', '10 unidades'],
    category: 'herramientas',
    hasGrainSelector: true,
    grainOptions: ['80', '120', '150', '220', '320', '400', '600', '800'],
  },
  {
    id: 'bandejas',
    name: 'Bandejas',
    hasColorSelector: false,
    capacityUnit: 'unidades',
    defaultCapacities: ['1 unidad'],
    category: 'accesorios',
  },
  {
    id: 'pinceles',
    name: 'Pinceles',
    hasColorSelector: false,
    capacityUnit: 'unidades',
    defaultCapacities: ['1 unidad'],
    category: 'herramientas',
    hasSizeSelector: true,
    sizeOptions: ['1/2"', '1"', '1 1/2"', '2"', '2 1/2"', '3"', '4"'],
  },
  {
    id: 'rodillos',
    name: 'Rodillos',
    hasColorSelector: false,
    capacityUnit: 'unidades',
    defaultCapacities: ['1 unidad'],
    category: 'herramientas',
  },
  {
    id: 'cintas-papel',
    name: 'Cintas de Papel',
    hasColorSelector: false,
    capacityUnit: 'metros',
    defaultCapacities: ['25m', '50m'],
    category: 'accesorios',
    hasWidthSelector: true,
    widthOptions: ['12mm', '18mm', '24mm', '36mm', '48mm', '72mm'],
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

  if (name.includes('pincel')) {
    return PRODUCT_TYPES.find(type => type.id === 'pinceles')!
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

  switch (unit) {
    case 'litros':
      // Verificar si ya termina con 'L' (mayúscula) o 'l' (minúscula)
      if (capacity.endsWith('L') || capacity.endsWith('l')) {
        // Si termina con 'l' minúscula, convertir a 'L' mayúscula
        return capacity.endsWith('l') ? capacity.slice(0, -1) + 'L' : capacity
      }
      return `${capacity}L`
    case 'kg':
      return capacity.endsWith('kg') ? capacity : `${capacity}kg`
    case 'metros':
      return capacity.endsWith('m') ? capacity : `${capacity}m`
    case 'unidades':
      return capacity.includes('unidad')
        ? capacity
        : `${capacity} unidad${capacity !== '1' ? 'es' : ''}`
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

  return 'blanco-puro' // Color por defecto para productos con selector
}
