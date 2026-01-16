// ===================================
// CONSTANTES Y CONFIGURACIONES DE PRODUCTOS
// ===================================

/**
 * Lista de productos bestseller específicos (orden prioritario)
 * 17 productos hardcodeados de marcas Petrilac, Plavicon y Sinteplast
 * Extraído de useBestSellerProducts.ts para centralización
 */
export const BESTSELLER_PRODUCTS_SLUGS = [
  // Plavicon (8 productos)
  'plavipint-fibrado-plavicon',                // 1. Plavicon - Plavipint Fibrado
  'membrana-performa-20l-plavicon',            // 2. Plavicon - Membrana Performa
  'plavipint-techos-poliuretanico',            // 3. Plavicon - Plavipint Techos
  'latex-frentes',                              // 4. Plavicon - Látex Frentes
  'latex-interior',                             // 5. Plavicon - Látex Interior
  'latex-muros',                                // 6. Plavicon - Látex Muros
  'piscinas-solvente-plavipint-plavicon',      // 7. Plavicon - Pintura Piscinas
  'cielorrasos',                                // 8. Plavicon - Cielorraso
  
  // Sinteplast (6 productos)
  'recuplast-interior',                         // 9. Sinteplast - Recuplast Interior
  'recuplast-bano-cocina',                      // 10. Sinteplast - Recuplast Baño y Cocina
  'recuplast-techos',                           // 11. Sinteplast - Recuplast Techos
  'membrana-cauchogoma-sinteplast',            // 12. Sinteplast - Membrana Cauchogoma
  'latex-eco-painting',                         // 13. Sinteplast - Látex Eco Painting
  'recuplast-muros',                            // 14. Sinteplast - Recuplast Muros (si existe, sino se completará con otro de la marca)
  
  // Petrilac (3 productos)
  'sintetico-converlux',                        // 15. Petrilac - Sintético Converlux
  'impregnante-danzke-1l-brillante-petrilac',   // 16. Petrilac - Impregnante Danzke Brillante
  'barniz-campbell',                           // 17. Petrilac - Barniz Campbell
] as const

/**
 * Configuración por defecto para queries de productos con React Query
 */
export const DEFAULT_PRODUCT_QUERY_CONFIG = {
  staleTime: 10 * 60 * 1000, // 10 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos en caché
  retry: 2,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
} as const

/**
 * Límites de productos por tipo de sección
 */
export const PRODUCT_LIMITS = {
  BESTSELLER: 17, // ✅ FIX: Actualizado a 17 productos + 3 cards = 20 items
  FREE_SHIPPING: 30,
  NEW_ARRIVALS: 8,
  CATEGORY: 20,
  LOW_PERFORMANCE: 4,
  STANDARD: 12,
} as const

/**
 * Precio mínimo para calificar para envío gratis (en pesos argentinos)
 */
export const FREE_SHIPPING_THRESHOLD = 50000

/**
 * Precio mínimo para mostrar opciones de cuotas sin interés
 */
export const INSTALLMENTS_THRESHOLD = 5000
