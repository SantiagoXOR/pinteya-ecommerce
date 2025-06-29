/**
 * Configuración del Design System Pinteya
 * 
 * Este archivo centraliza la configuración de características del design system,
 * permitiendo activar/desactivar funcionalidades de forma controlada.
 */

export interface DesignSystemConfig {
  // Componentes E-commerce
  ecommerce: {
    // Activar nuevos componentes e-commerce globalmente
    enableNewComponents: boolean
    
    // Configuración de PriceDisplay
    priceDisplay: {
      defaultCurrency: string
      showDiscountByDefault: boolean
      defaultVariant: 'default' | 'center' | 'compact'
      defaultSize: 'sm' | 'md' | 'lg' | 'xl'
    }
    
    // Configuración de StockIndicator
    stockIndicator: {
      defaultLowStockThreshold: number
      showExactQuantityByDefault: boolean
      defaultUnit: string
      defaultVariant: 'default' | 'compact' | 'badge' | 'minimal'
    }
    
    // Configuración de ShippingInfo
    shippingInfo: {
      highlightFreeShippingByDefault: boolean
      showCalculatorByDefault: boolean
      showGuaranteesByDefault: boolean
      freeShippingThreshold: number // En pesos argentinos
    }
  }
  
  // Configuración de ProductCard
  productCard: {
    useNewComponentsByDefault: boolean
    showInstallmentsByDefault: boolean
    showFreeShippingByDefault: boolean
    showExactStockByDefault: boolean
    defaultStockUnit: string
  }
  
  // Configuración de temas
  theme: {
    enableDarkMode: boolean
    defaultTheme: 'light' | 'dark' | 'auto'
  }
  
  // Configuración de testing
  testing: {
    enableVisualRegression: boolean
    enableAccessibilityTests: boolean
    enablePerformanceTests: boolean
  }
  
  // Configuración de desarrollo
  development: {
    enableStorybook: boolean
    enableDebugMode: boolean
    showComponentBoundaries: boolean
  }
}

/**
 * Configuración por defecto del Design System
 */
export const defaultDesignSystemConfig: DesignSystemConfig = {
  ecommerce: {
    enableNewComponents: true, // Activar nuevos componentes por defecto
    
    priceDisplay: {
      defaultCurrency: 'ARS',
      showDiscountByDefault: true,
      defaultVariant: 'compact', // Mejor para ProductCard
      defaultSize: 'sm', // Mejor para grids de productos
    },
    
    stockIndicator: {
      defaultLowStockThreshold: 5,
      showExactQuantityByDefault: false, // Solo en páginas de detalle
      defaultUnit: 'unidades',
      defaultVariant: 'minimal', // Mejor para ProductCard
    },
    
    shippingInfo: {
      highlightFreeShippingByDefault: true,
      showCalculatorByDefault: false, // Solo en checkout/detalle
      showGuaranteesByDefault: false, // Solo en checkout
      freeShippingThreshold: 50000, // $50.000 ARS
    },
  },
  
  productCard: {
    useNewComponentsByDefault: true, // ✅ ACTIVADO: Migración completada
    showInstallmentsByDefault: false, // Solo productos > $10.000
    showFreeShippingByDefault: true,
    showExactStockByDefault: false, // Solo en páginas de detalle
    defaultStockUnit: 'unidades',
  },
  
  theme: {
    enableDarkMode: false, // Fase 2
    defaultTheme: 'light',
  },
  
  testing: {
    enableVisualRegression: false, // Fase 2
    enableAccessibilityTests: true,
    enablePerformanceTests: true,
  },
  
  development: {
    enableStorybook: true,
    enableDebugMode: process.env.NODE_ENV === 'development',
    showComponentBoundaries: false,
  },
}

/**
 * Configuración específica para diferentes contextos
 */
export const contextConfigs = {
  // Configuración para páginas de producto individual
  productDetail: {
    ...defaultDesignSystemConfig,
    productCard: {
      ...defaultDesignSystemConfig.productCard,
      useNewComponentsByDefault: true,
      showInstallmentsByDefault: true,
      showExactStockByDefault: true,
    },
    ecommerce: {
      ...defaultDesignSystemConfig.ecommerce,
      stockIndicator: {
        ...defaultDesignSystemConfig.ecommerce.stockIndicator,
        showExactQuantityByDefault: true,
        defaultVariant: 'default',
      },
      shippingInfo: {
        ...defaultDesignSystemConfig.ecommerce.shippingInfo,
        showCalculatorByDefault: true,
        showGuaranteesByDefault: true,
      },
    },
  },
  
  // Configuración para checkout
  checkout: {
    ...defaultDesignSystemConfig,
    ecommerce: {
      ...defaultDesignSystemConfig.ecommerce,
      priceDisplay: {
        ...defaultDesignSystemConfig.ecommerce.priceDisplay,
        defaultVariant: 'default',
        defaultSize: 'lg',
      },
      shippingInfo: {
        ...defaultDesignSystemConfig.ecommerce.shippingInfo,
        showCalculatorByDefault: true,
        showGuaranteesByDefault: true,
      },
    },
  },
  
  // Configuración para demos y testing
  demo: {
    ...defaultDesignSystemConfig,
    productCard: {
      ...defaultDesignSystemConfig.productCard,
      useNewComponentsByDefault: true,
      showInstallmentsByDefault: true,
      showExactStockByDefault: true,
    },
    development: {
      ...defaultDesignSystemConfig.development,
      enableDebugMode: true,
      showComponentBoundaries: true,
    },
  },
} as const

/**
 * Hook para obtener la configuración del design system
 */
export function useDesignSystemConfig(context?: keyof typeof contextConfigs): DesignSystemConfig {
  if (context && contextConfigs[context]) {
    return contextConfigs[context]
  }
  return defaultDesignSystemConfig
}

/**
 * Función para verificar si una característica está habilitada
 */
export function isFeatureEnabled(
  feature: string, 
  config: DesignSystemConfig = defaultDesignSystemConfig
): boolean {
  const keys = feature.split('.')
  let current: any = config
  
  for (const key of keys) {
    if (current[key] === undefined) {
      return false
    }
    current = current[key]
  }
  
  return Boolean(current)
}

/**
 * Función para determinar si mostrar cuotas basado en el precio
 */
export function shouldShowInstallments(
  price: number, 
  config: DesignSystemConfig = defaultDesignSystemConfig
): boolean {
  // Mostrar cuotas para productos > $10.000
  return price >= 10000 || config.productCard.showInstallmentsByDefault
}

/**
 * Función para determinar si mostrar envío gratis basado en el precio
 */
export function shouldShowFreeShipping(
  price: number, 
  config: DesignSystemConfig = defaultDesignSystemConfig
): boolean {
  return price >= config.ecommerce.shippingInfo.freeShippingThreshold || 
         config.ecommerce.shippingInfo.highlightFreeShippingByDefault
}

/**
 * Función para calcular cuotas automáticamente
 */
export function calculateInstallments(price: number): {
  quantity: number
  amount: number
  interestFree: boolean
} {
  // Lógica de cuotas basada en el precio
  if (price >= 50000) {
    return {
      quantity: 12,
      amount: Math.round(price / 12),
      interestFree: true,
    }
  } else if (price >= 20000) {
    return {
      quantity: 6,
      amount: Math.round(price / 6),
      interestFree: true,
    }
  } else if (price >= 10000) {
    return {
      quantity: 3,
      amount: Math.round(price / 3),
      interestFree: true,
    }
  }
  
  return {
    quantity: 1,
    amount: price,
    interestFree: true,
  }
}
