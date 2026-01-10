// ===================================
// CONSTANTES Y CONFIGURACIONES DE PRODUCTOS
// ===================================

/**
 * Lista de productos bestseller específicos (orden prioritario)
 * Extraído de useBestSellerProducts.ts para centralización
 */
export const BESTSELLER_PRODUCTS_SLUGS = [
  'latex-impulso-generico',                    // 1. Latex Impulso 20L
  'plavipint-fibrado-plavicon',                // 2. Plavicon Fibrado 20L
  'membrana-performa-20l-plavicon',            // 3. Membrana Performa Plavicon 20L
  'plavipint-techos-poliuretanico',            // 4. Recuplast Techos 20L
  'recuplast-interior',                         // 5. Recuplast Interior 20L
  'techos-poliuretanico',                       // 6. Plavicon Interior 20L
  'latex-muros',                                // 7. Plavicon Muros 20L
  'hidroesmalte-4l',                            // 8. Hidroesmalte 4L
  'piscinas-solvente-plavipint-plavicon',      // 9. Pintura Piscinas Plavicon
  'cielorrasos',                                // 10. Cielorraso Plavicon 20L
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
  BESTSELLER: 10,
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
