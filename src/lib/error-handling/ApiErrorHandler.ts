// ===================================
// API ERROR HANDLER - SISTEMA CENTRALIZADO
// ===================================
// Manejo consistente de errores de API con retry logic,
// logging estructurado y user experience optimizada

import { toast } from 'react-hot-toast'

// ===================================
// TIPOS E INTERFACES
// ===================================

export interface ApiError extends Error {
  status?: number
  code?: string
  details?: any
  timestamp?: string
  requestId?: string
  retryable?: boolean
}

export interface ErrorContext {
  endpoint: string
  method: string
  requestData?: any
  userId?: string
  sessionId?: string
  userAgent?: string
  timestamp: string
}

export interface RetryConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffFactor: number
  retryableStatuses: number[]
}

export interface ErrorHandlerConfig {
  enableLogging: boolean
  enableToasts: boolean
  enableRetry: boolean
  retryConfig: RetryConfig
  logEndpoint?: string
  onError?: (error: ApiError, context: ErrorContext) => void
}

// ===================================
// CONFIGURACIÓN POR DEFECTO
// ===================================

const DEFAULT_CONFIG: ErrorHandlerConfig = {
  enableLogging: true,
  enableToasts: true,
  enableRetry: true,
  retryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
  },
  logEndpoint: '/api/errors',
}

// ===================================
// CLASE PRINCIPAL
// ===================================

export class ApiErrorHandler {
  private config: ErrorHandlerConfig
  private errorCounts: Map<string, number> = new Map()
  private lastErrors: Map<string, number> = new Map()

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Maneja errores de API con retry automático
   */
  async handleApiCall<T>(
    apiCall: () => Promise<T>,
    context: Partial<ErrorContext>,
    customConfig?: Partial<ErrorHandlerConfig>
  ): Promise<T> {
    const finalConfig = { ...this.config, ...customConfig }
    const fullContext: ErrorContext = {
      endpoint: 'unknown',
      method: 'GET',
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
      ...context,
    }

    let lastError: ApiError | null = null
    let attempt = 0

    while (attempt <= finalConfig.retryConfig.maxRetries) {
      try {
        const result = await apiCall()

        // Limpiar contadores de error en caso de éxito
        this.clearErrorCount(fullContext.endpoint)

        return result
      } catch (error) {
        lastError = this.normalizeError(error)
        attempt++

        // Log del error
        if (finalConfig.enableLogging) {
          await this.logError(lastError, fullContext, attempt)
        }

        // Verificar si debe reintentar
        if (
          attempt <= finalConfig.retryConfig.maxRetries &&
          finalConfig.enableRetry &&
          this.shouldRetry(lastError, finalConfig.retryConfig)
        ) {
          const delay = this.calculateDelay(attempt, finalConfig.retryConfig)
          await this.sleep(delay)
          continue
        }

        // No más reintentos, manejar error final
        break
      }
    }

    // Manejar error final
    if (lastError) {
      await this.handleFinalError(lastError, fullContext, finalConfig)
      throw lastError
    }

    throw new Error('Unexpected error in API call')
  }

  /**
   * Normaliza errores a formato estándar
   */
  private normalizeError(error: any): ApiError {
    if (error instanceof Error) {
      const apiError = error as ApiError

      // Extraer información adicional si está disponible
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        apiError.status = 0
        apiError.code = 'NETWORK_ERROR'
        apiError.retryable = true
      }

      return {
        ...apiError,
        timestamp: new Date().toISOString(),
        retryable: apiError.retryable ?? this.isRetryableError(apiError),
      }
    }

    // Error de respuesta HTTP
    if (typeof error === 'object' && error.status) {
      return {
        name: 'ApiError',
        message: error.message || `HTTP ${error.status}`,
        status: error.status,
        code: error.code || `HTTP_${error.status}`,
        details: error.details,
        timestamp: new Date().toISOString(),
        retryable: this.isRetryableStatus(error.status),
      }
    }

    // Error genérico
    return {
      name: 'UnknownError',
      message: String(error),
      timestamp: new Date().toISOString(),
      retryable: false,
    }
  }

  /**
   * Determina si un error es reintentable
   */
  private shouldRetry(error: ApiError, config: RetryConfig): boolean {
    if (!error.retryable) {
      return false
    }

    if (error.status && !config.retryableStatuses.includes(error.status)) {
      return false
    }

    return true
  }

  /**
   * Calcula el delay para el siguiente intento
   */
  private calculateDelay(attempt: number, config: RetryConfig): number {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1)
    const jitter = Math.random() * 0.1 * delay // 10% jitter
    return Math.min(delay + jitter, config.maxDelay)
  }

  /**
   * Determina si un error es reintentable por defecto
   */
  private isRetryableError(error: ApiError): boolean {
    if (error.status) {
      return this.isRetryableStatus(error.status)
    }

    // Errores de red son reintentables
    if (error.code === 'NETWORK_ERROR' || error.message.includes('fetch')) {
      return true
    }

    return false
  }

  /**
   * Determina si un status HTTP es reintentable
   */
  private isRetryableStatus(status: number): boolean {
    return this.config.retryConfig.retryableStatuses.includes(status)
  }

  /**
   * Log estructurado del error
   */
  private async logError(error: ApiError, context: ErrorContext, attempt: number): Promise<void> {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        status: error.status,
        code: error.code,
        stack: error.stack,
        timestamp: error.timestamp,
      },
      context,
      attempt,
      maxRetries: this.config.retryConfig.maxRetries,
      environment: process.env.NODE_ENV,
    }

    // Log en consola para desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 API Error - Attempt ${attempt}`)
      console.error('Error:', error)
      console.error('Context:', context)
      console.error('Log Data:', logData)
      console.groupEnd()
    }

    // Enviar a servicio de logging en producción
    if (process.env.NODE_ENV === 'production' && this.config.logEndpoint) {
      try {
        await fetch(this.config.logEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logData),
        })
      } catch (loggingError) {
        console.error('Failed to log API error:', loggingError)
      }
    }
  }

  /**
   * Maneja el error final después de todos los reintentos
   */
  private async handleFinalError(
    error: ApiError,
    context: ErrorContext,
    config: ErrorHandlerConfig
  ): Promise<void> {
    // Incrementar contador de errores
    this.incrementErrorCount(context.endpoint)

    // Mostrar toast si está habilitado
    if (config.enableToasts) {
      this.showErrorToast(error, context)
    }

    // Callback personalizado
    if (config.onError) {
      config.onError(error, context)
    }
  }

  /**
   * Muestra toast de error apropiado
   */
  private showErrorToast(error: ApiError, context: ErrorContext): void {
    const message = this.getErrorMessage(error, context)

    if (error.status && error.status >= 500) {
      toast.error(message, {
        duration: 5000,
        id: `api-error-${context.endpoint}`,
      })
    } else if (error.status === 429) {
      toast.error('Demasiadas solicitudes. Intenta de nuevo en unos momentos.', {
        duration: 4000,
        id: 'rate-limit-error',
      })
    } else if (error.status === 401) {
      toast.error('Sesión expirada. Por favor, inicia sesión nuevamente.', {
        duration: 6000,
        id: 'auth-error',
      })
    } else {
      toast.error(message, {
        duration: 4000,
        id: `api-error-${error.code}`,
      })
    }
  }

  /**
   * Genera mensaje de error user-friendly
   */
  private getErrorMessage(error: ApiError, context: ErrorContext): string {
    // Mensajes específicos por endpoint
    const endpointMessages: Record<string, string> = {
      '/api/products': 'Error al cargar productos',
      '/api/search': 'Error en la búsqueda',
      '/api/cart': 'Error al actualizar el carrito',
      '/api/checkout': 'Error en el proceso de compra',
      '/api/auth': 'Error de autenticación',
    }

    const endpointMessage = endpointMessages[context.endpoint]
    if (endpointMessage) {
      return endpointMessage
    }

    // Mensajes por status code
    const statusMessages: Record<number, string> = {
      400: 'Solicitud inválida',
      401: 'No autorizado',
      403: 'Acceso denegado',
      404: 'Recurso no encontrado',
      408: 'Tiempo de espera agotado',
      429: 'Demasiadas solicitudes',
      500: 'Error interno del servidor',
      502: 'Servicio no disponible',
      503: 'Servicio temporalmente no disponible',
      504: 'Tiempo de espera del servidor agotado',
    }

    if (error.status && statusMessages[error.status]) {
      return statusMessages[error.status]
    }

    // Mensaje genérico
    return 'Ocurrió un error inesperado. Intenta de nuevo.'
  }

  /**
   * Utilidades para contadores de error
   */
  private incrementErrorCount(endpoint: string): void {
    const current = this.errorCounts.get(endpoint) || 0
    this.errorCounts.set(endpoint, current + 1)
    this.lastErrors.set(endpoint, Date.now())
  }

  private clearErrorCount(endpoint: string): void {
    this.errorCounts.delete(endpoint)
    this.lastErrors.delete(endpoint)
  }

  private getErrorCount(endpoint: string): number {
    return this.errorCounts.get(endpoint) || 0
  }

  /**
   * Utilidad para sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Obtiene estadísticas de errores
   */
  getErrorStats(): Record<string, { count: number; lastError: number }> {
    const stats: Record<string, { count: number; lastError: number }> = {}

    for (const [endpoint, count] of this.errorCounts.entries()) {
      stats[endpoint] = {
        count,
        lastError: this.lastErrors.get(endpoint) || 0,
      }
    }

    return stats
  }

  /**
   * Limpia estadísticas de errores
   */
  clearErrorStats(): void {
    this.errorCounts.clear()
    this.lastErrors.clear()
  }
}

// ===================================
// INSTANCIA GLOBAL
// ===================================

export const apiErrorHandler = new ApiErrorHandler()

// ===================================
// HELPER FUNCTIONS
// ===================================

/**
 * Wrapper para llamadas de API con manejo de errores
 */
export async function withErrorHandling<T>(
  apiCall: () => Promise<T>,
  context: Partial<ErrorContext>,
  config?: Partial<ErrorHandlerConfig>
): Promise<T> {
  return apiErrorHandler.handleApiCall(apiCall, context, config)
}

/**
 * Crea un error de API
 */
export function createApiError(
  message: string,
  status?: number,
  code?: string,
  details?: any
): ApiError {
  const error = new Error(message) as ApiError
  error.status = status
  error.code = code
  error.details = details
  error.timestamp = new Date().toISOString()
  return error
}

// ===================================
// EXPORTS
// ===================================

export default ApiErrorHandler
