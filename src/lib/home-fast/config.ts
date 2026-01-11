/**
 * Configuración centralizada para home-fast
 */

export const HOME_FAST_CONFIG = {
  products: {
    bestSellerLimit: 10,
    gridColumns: {
      mobile: 2,
      tablet: 3,
      desktop: 4,
    },
  },
  images: {
    hero: {
      width: 1200,
      height: 400,
      priority: true,
    },
    product: {
      width: 300,
      height: 300,
    },
  },
  performance: {
    revalidate: 60, // ISR cada 60 segundos
  },
} as const
