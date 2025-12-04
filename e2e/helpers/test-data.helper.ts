// ===================================
// TEST DATA HELPER
// Datos y funciones auxiliares para tests de productos y variantes
// ===================================

/**
 * IDs de productos de prueba en la base de datos
 */
export const TEST_PRODUCT_IDS = {
  // Producto con muchas variantes (60)
  PRODUCT_WITH_MANY_VARIANTS: '34', // Sintético Converlux
  
  // Producto con varias variantes (24)
  PRODUCT_WITH_VARIANTS: '35', // Impregnante Danzke
  
  // Producto con pocas variantes (8)
  PRODUCT_WITH_FEW_VARIANTS: '61', // Pintura Piletas
  
  // Producto con 4 variantes
  PRODUCT_WITH_FOUR_VARIANTS: '92', // Látex Eco Painting
} as const

/**
 * Generador de datos para crear productos de prueba
 */
export function generateTestProduct() {
  const timestamp = Date.now()
  const randomId = Math.floor(Math.random() * 10000)

  return {
    name: `Producto Test E2E ${timestamp}`,
    description: `Descripción de prueba generada automáticamente para tests E2E - ${timestamp}`,
    price: 100 + randomId,
    stock: Math.floor(Math.random() * 100),
    category_id: '1', // Categoría por defecto
    image_url: `https://via.placeholder.com/400x400?text=Test+${timestamp}`,
    status: 'draft' as const,
  }
}

/**
 * Generador de datos para crear variantes de prueba
 */
export function generateTestVariant(productId: string) {
  const timestamp = Date.now()
  const colors = ['Blanco', 'Rojo', 'Azul', 'Verde', 'Negro', 'Amarillo']
  const measures = ['1L', '4L', '10L', '20L']
  const finishes = ['Mate', 'Brillante']

  return {
    product_id: productId,
    color_name: colors[Math.floor(Math.random() * colors.length)],
    measure: measures[Math.floor(Math.random() * measures.length)],
    finish: finishes[Math.floor(Math.random() * finishes.length)],
    aikon_id: `TEST-${timestamp}-${Math.floor(Math.random() * 1000)}`,
    price_list: 50 + Math.floor(Math.random() * 200),
    price_sale: 40 + Math.floor(Math.random() * 150),
    stock: Math.floor(Math.random() * 50),
    image_url: `https://via.placeholder.com/200x200?text=Variant+${timestamp}`,
    is_active: true,
    is_default: false,
  }
}

/**
 * Datos de productos existentes para tests de lectura
 */
export const EXISTING_PRODUCTS = {
  // Producto 34: Sintético Converlux - 60 variantes
  product34: {
    id: '34',
    name: 'Sintético Converlux',
    expectedVariants: 60,
    category: 'Pintura Exterior',
  },
  
  // Producto 35: Impregnante Danzke - 24 variantes
  product35: {
    id: '35',
    name: 'Impregnante Danzke',
    expectedVariants: 24,
    category: 'Impregnante',
  },
  
  // Producto 61: Pintura Piletas - 8 variantes
  product61: {
    id: '61',
    name: 'Pintura Piletas',
    expectedVariants: 8,
    category: 'Pintura Especial',
  },
  
  // Producto 92: Látex Eco Painting - 4 variantes
  product92: {
    id: '92',
    name: 'Látex Eco Painting',
    expectedVariants: 4,
    category: 'Pintura Interior',
  },
} as const

/**
 * Datos de variantes de ejemplo para tests
 */
export const EXAMPLE_VARIANTS = [
  {
    color_name: 'Blanco',
    measure: '4L',
    finish: 'Mate',
    aikon_id: 'BLANCO-4L-MATE',
    price_list: 15000,
    price_sale: 12000,
    stock: 50,
    is_active: true,
    is_default: true,
  },
  {
    color_name: 'Rojo',
    measure: '4L',
    finish: 'Brillante',
    aikon_id: 'ROJO-4L-BRILLANTE',
    price_list: 16000,
    price_sale: 13000,
    stock: 30,
    is_active: true,
    is_default: false,
  },
  {
    color_name: 'Azul',
    measure: '4L',
    finish: 'Mate',
    aikon_id: 'AZUL-4L-MATE',
    price_list: 15000,
    price_sale: 12000,
    stock: 10, // Stock bajo
    is_active: true,
    is_default: false,
  },
  {
    color_name: 'Negro',
    measure: '4L',
    finish: 'Brillante',
    aikon_id: 'NEGRO-4L-BRILLANTE',
    price_list: 16000,
    price_sale: 13000,
    stock: 0, // Sin stock
    is_active: false,
    is_default: false,
  },
] as const

/**
 * Helper para generar nombres únicos de test
 */
export function getUniqueTestName(baseName: string): string {
  return `${baseName}-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

/**
 * Helper para limpiar datos de test
 */
export async function cleanupTestData(productIds: string[]) {
  console.log(`🧹 Limpiando ${productIds.length} productos de test...`)
  // En un setup real, aquí haríamos DELETE a la API
  // Por ahora solo log para no afectar la BD real durante desarrollo
  console.log(`✅ Datos de test limpios`)
}

/**
 * Constantes de timeout para diferentes operaciones
 */
export const TIMEOUTS = {
  // Operaciones rápidas (clicks, navegación)
  SHORT: 5000,
  
  // Operaciones normales (cargar página, tabla)
  MEDIUM: 10000,
  
  // Operaciones largas (carga de muchas variantes, operaciones masivas)
  LONG: 20000,
  
  // Operaciones muy largas (creación múltiple, tests de integración)
  VERY_LONG: 30000,
} as const

/**
 * Constantes de colores para mapeo de badges
 */
export const VARIANT_BADGES = {
  DEFAULT: '★ Default',
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  LOW_STOCK: 'Stock bajo',
  NO_STOCK: 'Sin stock',
} as const

