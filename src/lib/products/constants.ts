// ===================================
// CONSTANTES Y CONFIGURACIONES DE PRODUCTOS
// ===================================

/**
 * Lista de productos bestseller específicos (orden prioritario)
 * 17 productos hardcodeados de marcas Petrilac, Plavicon y Sinteplast
 * Extraído de useBestSellerProducts.ts para centralización
 */
export const BESTSELLER_PRODUCTS_SLUGS = [
  // Petrilac (6 productos)
  'sintetico-converlux',                        // 1. Petrilac - Sintético Converlux
  'impregnante-danzke-1l-brillante-petrilac',   // 2. Petrilac - Impregnante Danzke Brillante
  'barniz-campbell',                           // 3. Petrilac - Barniz Campbell
  'esmalte-sintetico-petrilac',                // 4. Petrilac - Esmalte Sintético
  'latex-interior-petrilac',                    // 5. Petrilac - Látex Interior
  'hidroesmalte-petrilac',                      // 6. Petrilac - Hidroesmalte
  
  // Plavicon (6 productos)
  'plavipint-fibrado-plavicon',                // 7. Plavicon - Plavipint Fibrado
  'membrana-performa-20l-plavicon',            // 8. Plavicon - Membrana Performa
  'plavipint-techos-poliuretanico',            // 9. Plavicon - Plavipint Techos
  'latex-frentes',                              // 10. Plavicon - Látex Frentes
  'latex-interior',                             // 11. Plavicon - Látex Interior
  'latex-muros',                                // 12. Plavicon - Látex Muros
  
  // Sinteplast (5 productos)
  'recuplast-interior',                         // 13. Sinteplast - Recuplast Interior
  'recuplast-bano-cocina',                      // 14. Sinteplast - Recuplast Baño y Cocina
  'recuplast-techos',                           // 15. Sinteplast - Recuplast Techos
  'membrana-cauchogoma-sinteplast',            // 16. Sinteplast - Membrana Cauchogoma
  'latex-eco-painting',                         // 17. Sinteplast - Látex Eco Painting
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
