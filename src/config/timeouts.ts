// ===================================
// PINTEYA E-COMMERCE - TIMEOUT CONFIGURATION
// ===================================

/**
 * Configuración centralizada de timeouts para toda la aplicación
 * Todos los valores están en milisegundos
 */

/**
 * Timeouts para APIs externas
 */
export const EXTERNAL_API_TIMEOUTS = {
  // MercadoPago
  MERCADOPAGO: {
    PAYMENT_CREATION: 15000, // 15 segundos
    PAYMENT_STATUS: 10000, // 10 segundos
    WEBHOOK_PROCESSING: 5000, // 5 segundos
    PREFERENCE_CREATION: 12000, // 12 segundos
    REFUND_PROCESSING: 20000, // 20 segundos
  },

  // APIs de terceros generales
  THIRD_PARTY: {
    DEFAULT: 10000, // 10 segundos
    SLOW_OPERATIONS: 30000, // 30 segundos
    FAST_OPERATIONS: 5000, // 5 segundos
  },

  // Servicios de email
  EMAIL: {
    SEND_EMAIL: 15000, // 15 segundos
    TEMPLATE_PROCESSING: 8000, // 8 segundos
  },

  // Servicios de notificaciones
  NOTIFICATIONS: {
    PUSH_NOTIFICATION: 10000, // 10 segundos
    SMS: 12000, // 12 segundos
    SLACK_WEBHOOK: 8000, // 8 segundos
  },
} as const

/**
 * Timeouts para base de datos
 */
export const DATABASE_TIMEOUTS = {
  // Operaciones de lectura
  READ: {
    SIMPLE_QUERY: 5000, // 5 segundos
    COMPLEX_QUERY: 15000, // 15 segundos
    AGGREGATION: 20000, // 20 segundos
    SEARCH: 10000, // 10 segundos
  },

  // Operaciones de escritura
  WRITE: {
    INSERT: 8000, // 8 segundos
    UPDATE: 10000, // 10 segundos
    DELETE: 12000, // 12 segundos
    BULK_OPERATIONS: 30000, // 30 segundos
  },

  // Transacciones
  TRANSACTION: {
    SIMPLE: 15000, // 15 segundos
    COMPLEX: 30000, // 30 segundos
    MIGRATION: 60000, // 60 segundos
  },

  // Conexiones
  CONNECTION: {
    ACQUIRE: 5000, // 5 segundos
    IDLE_TIMEOUT: 300000, // 5 minutos
    LIFETIME: 1800000, // 30 minutos
  },
} as const

/**
 * Timeouts para cache
 */
export const CACHE_TIMEOUTS = {
  // Redis
  REDIS: {
    CONNECT: 5000, // 5 segundos
    COMMAND: 3000, // 3 segundos
    PIPELINE: 10000, // 10 segundos
  },

  // Cache en memoria
  MEMORY: {
    OPERATION: 1000, // 1 segundo
    CLEANUP: 5000, // 5 segundos
  },

  // CDN
  CDN: {
    PURGE: 30000, // 30 segundos
    UPLOAD: 60000, // 60 segundos
  },
} as const

/**
 * Timeouts para APIs internas
 */
export const INTERNAL_API_TIMEOUTS = {
  // APIs de productos
  PRODUCTS: {
    LIST: 8000, // 8 segundos
    DETAIL: 5000, // 5 segundos
    SEARCH: 10000, // 10 segundos
    CREATE: 12000, // 12 segundos
    UPDATE: 10000, // 10 segundos
    DELETE: 8000, // 8 segundos
  },

  // APIs de usuarios
  USERS: {
    AUTHENTICATION: 8000, // 8 segundos
    PROFILE: 5000, // 5 segundos
    UPDATE_PROFILE: 10000, // 10 segundos
    PASSWORD_RESET: 15000, // 15 segundos
  },

  // APIs de órdenes
  ORDERS: {
    CREATE: 15000, // 15 segundos
    LIST: 8000, // 8 segundos
    DETAIL: 5000, // 5 segundos
    UPDATE_STATUS: 10000, // 10 segundos
    CANCEL: 12000, // 12 segundos
  },

  // APIs de carrito
  CART: {
    ADD_ITEM: 5000, // 5 segundos
    REMOVE_ITEM: 3000, // 3 segundos
    UPDATE_QUANTITY: 4000, // 4 segundos
    CLEAR: 3000, // 3 segundos
    CHECKOUT: 20000, // 20 segundos
  },

  // APIs de categorías
  CATEGORIES: {
    LIST: 5000, // 5 segundos
    DETAIL: 3000, // 3 segundos
    CREATE: 8000, // 8 segundos
    UPDATE: 6000, // 6 segundos
  },

  // APIs de búsqueda
  SEARCH: {
    PRODUCTS: 10000, // 10 segundos
    SUGGESTIONS: 5000, // 5 segundos
    TRENDING: 8000, // 8 segundos
    FILTERS: 6000, // 6 segundos
  },
} as const

/**
 * Timeouts para operaciones de archivos
 */
export const FILE_TIMEOUTS = {
  // Upload de archivos
  UPLOAD: {
    SMALL_FILE: 30000, // 30 segundos (< 1MB)
    MEDIUM_FILE: 60000, // 60 segundos (1-10MB)
    LARGE_FILE: 180000, // 3 minutos (> 10MB)
  },

  // Procesamiento de imágenes
  IMAGE_PROCESSING: {
    RESIZE: 15000, // 15 segundos
    OPTIMIZATION: 20000, // 20 segundos
    THUMBNAIL: 10000, // 10 segundos
  },

  // Operaciones de archivos
  FILE_OPERATIONS: {
    READ: 10000, // 10 segundos
    WRITE: 15000, // 15 segundos
    DELETE: 5000, // 5 segundos
    COPY: 20000, // 20 segundos
  },
} as const

/**
 * Timeouts para monitoreo y logging
 */
export const MONITORING_TIMEOUTS = {
  // Métricas
  METRICS: {
    COLLECTION: 5000, // 5 segundos
    AGGREGATION: 10000, // 10 segundos
    EXPORT: 30000, // 30 segundos
  },

  // Alertas
  ALERTS: {
    SEND: 8000, // 8 segundos
    WEBHOOK: 10000, // 10 segundos
    EMAIL: 15000, // 15 segundos
  },

  // Health checks
  HEALTH_CHECK: {
    SIMPLE: 3000, // 3 segundos
    DETAILED: 10000, // 10 segundos
    EXTERNAL_SERVICES: 15000, // 15 segundos
  },
} as const

/**
 * Timeouts para testing
 */
export const TEST_TIMEOUTS = {
  // Tests unitarios
  UNIT: {
    DEFAULT: 5000, // 5 segundos
    ASYNC_OPERATIONS: 10000, // 10 segundos
  },

  // Tests de integración
  INTEGRATION: {
    API_CALLS: 15000, // 15 segundos
    DATABASE_OPERATIONS: 20000, // 20 segundos
    EXTERNAL_SERVICES: 30000, // 30 segundos
  },

  // Tests E2E
  E2E: {
    PAGE_LOAD: 30000, // 30 segundos
    USER_INTERACTION: 10000, // 10 segundos
    FORM_SUBMISSION: 20000, // 20 segundos
  },
} as const

/**
 * Timeouts por ambiente
 */
export const ENVIRONMENT_TIMEOUTS = {
  development: {
    multiplier: 2, // 2x más tiempo en desarrollo
    maxTimeout: 60000, // Máximo 60 segundos
  },

  staging: {
    multiplier: 1.5, // 1.5x más tiempo en staging
    maxTimeout: 45000, // Máximo 45 segundos
  },

  production: {
    multiplier: 1, // Tiempo normal en producción
    maxTimeout: 30000, // Máximo 30 segundos
  },
} as const

/**
 * Configuración de reintentos
 */
export const RETRY_CONFIG = {
  // Configuración por defecto
  DEFAULT: {
    maxRetries: 3,
    baseDelay: 1000, // 1 segundo
    maxDelay: 10000, // 10 segundos
    backoffMultiplier: 2,
  },

  // APIs críticas
  CRITICAL: {
    maxRetries: 5,
    baseDelay: 500, // 0.5 segundos
    maxDelay: 5000, // 5 segundos
    backoffMultiplier: 1.5,
  },

  // APIs no críticas
  NON_CRITICAL: {
    maxRetries: 2,
    baseDelay: 2000, // 2 segundos
    maxDelay: 15000, // 15 segundos
    backoffMultiplier: 3,
  },
} as const

/**
 * Utilidades para trabajar con timeouts
 */
export class TimeoutUtils {
  /**
   * Obtiene timeout ajustado por ambiente
   */
  static getEnvironmentTimeout(baseTimeout: number): number {
    const env = (process.env.NODE_ENV as keyof typeof ENVIRONMENT_TIMEOUTS) || 'development'
    const config = ENVIRONMENT_TIMEOUTS[env] || ENVIRONMENT_TIMEOUTS.development

    const adjustedTimeout = Math.min(baseTimeout * config.multiplier, config.maxTimeout)

    return Math.round(adjustedTimeout)
  }

  /**
   * Crea AbortController con timeout
   */
  static createTimeoutController(timeout: number): AbortController {
    const controller = new AbortController()

    setTimeout(() => {
      controller.abort()
    }, timeout)

    return controller
  }

  /**
   * Wrapper para promesas con timeout
   */
  static withTimeout<T>(promise: Promise<T>, timeout: number, errorMessage?: string): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(errorMessage || `Operation timed out after ${timeout}ms`))
        }, timeout)
      }),
    ])
  }

  /**
   * Implementa retry con backoff exponencial
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    config = RETRY_CONFIG.DEFAULT
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error

        if (attempt === config.maxRetries) {
          throw lastError
        }

        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
          config.maxDelay
        )

        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  /**
   * Obtiene timeout para operación específica
   */
  static getTimeout(category: string, operation: string): number {
    const timeoutMap: Record<string, any> = {
      'external-api': EXTERNAL_API_TIMEOUTS,
      database: DATABASE_TIMEOUTS,
      cache: CACHE_TIMEOUTS,
      'internal-api': INTERNAL_API_TIMEOUTS,
      file: FILE_TIMEOUTS,
      monitoring: MONITORING_TIMEOUTS,
      test: TEST_TIMEOUTS,
    }

    const categoryConfig = timeoutMap[category]
    if (!categoryConfig) {
      return this.getEnvironmentTimeout(10000) // 10 segundos por defecto
    }

    // Navegar por la estructura anidada
    const parts = operation.split('.')
    let current = categoryConfig

    for (const part of parts) {
      if (current[part] !== undefined) {
        current = current[part]
      } else {
        return this.getEnvironmentTimeout(10000) // Fallback
      }
    }

    return this.getEnvironmentTimeout(typeof current === 'number' ? current : 10000)
  }
}

/**
 * Constantes de timeout más utilizadas
 */
export const COMMON_TIMEOUTS = {
  VERY_SHORT: TimeoutUtils.getEnvironmentTimeout(2000), // 2 segundos
  SHORT: TimeoutUtils.getEnvironmentTimeout(5000), // 5 segundos
  MEDIUM: TimeoutUtils.getEnvironmentTimeout(10000), // 10 segundos
  LONG: TimeoutUtils.getEnvironmentTimeout(20000), // 20 segundos
  VERY_LONG: TimeoutUtils.getEnvironmentTimeout(60000), // 60 segundos
} as const

/**
 * Configuración por defecto para fetch
 */
export const DEFAULT_FETCH_CONFIG = {
  timeout: COMMON_TIMEOUTS.MEDIUM,
  retries: RETRY_CONFIG.DEFAULT.maxRetries,
  headers: {
    'Content-Type': 'application/json',
  },
} as const
