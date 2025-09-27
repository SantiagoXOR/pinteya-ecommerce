// ===================================
// PINTEYA E-COMMERCE - RETRY LOGIC WITH EXPONENTIAL BACKOFF
// ===================================

import { logger, LogLevel, LogCategory } from './enterprise/logger'
import { metricsCollector } from './enterprise/metrics'

// Configuración de retry
export interface RetryConfig {
  maxRetries: number // Máximo número de reintentos
  baseDelayMs: number // Delay base en milisegundos
  maxDelayMs: number // Delay máximo en milisegundos
  backoffMultiplier: number // Multiplicador para backoff exponencial
  jitterMs: number // Jitter máximo en milisegundos
  retryableErrors: string[] // Códigos de error que permiten retry
  nonRetryableErrors: string[] // Códigos de error que NO permiten retry
}

// Configuraciones predefinidas
export const RETRY_CONFIGS: Record<string, RetryConfig> = {
  // Para llamadas críticas a MercadoPago
  MERCADOPAGO_CRITICAL: {
    maxRetries: 3,
    baseDelayMs: 1000, // 1 segundo
    maxDelayMs: 30000, // 30 segundos
    backoffMultiplier: 2,
    jitterMs: 500,
    retryableErrors: [
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'NETWORK_ERROR',
      'TIMEOUT',
      '500',
      '502',
      '503',
      '504',
      '429', // Rate limit - retry después de delay
    ],
    nonRetryableErrors: [
      '400', // Bad Request
      '401', // Unauthorized
      '403', // Forbidden
      '404', // Not Found
      '422', // Unprocessable Entity
      'INVALID_CREDENTIALS',
      'INVALID_REQUEST',
      'PAYMENT_REJECTED',
    ],
  },

  // Para operaciones de consulta menos críticas
  MERCADOPAGO_QUERY: {
    maxRetries: 2,
    baseDelayMs: 500, // 0.5 segundos
    maxDelayMs: 10000, // 10 segundos
    backoffMultiplier: 2,
    jitterMs: 250,
    retryableErrors: ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', '500', '502', '503', '504'],
    nonRetryableErrors: ['400', '401', '403', '404', '422'],
  },

  // Para webhooks (menos agresivo)
  WEBHOOK_PROCESSING: {
    maxRetries: 1,
    baseDelayMs: 2000, // 2 segundos
    maxDelayMs: 5000, // 5 segundos
    backoffMultiplier: 1.5,
    jitterMs: 1000,
    retryableErrors: ['ECONNRESET', 'ETIMEDOUT', '500', '503'],
    nonRetryableErrors: ['400', '401', '403', '404', '422', 'DUPLICATE_WEBHOOK'],
  },
} as const

// Resultado del retry
export interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalDuration: number
  lastAttemptDuration: number
}

// Información del intento
export interface AttemptInfo {
  attempt: number
  maxRetries: number
  delay: number
  error?: Error
  duration: number
}

/**
 * Calcula el delay para el siguiente intento usando backoff exponencial con jitter
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  // Backoff exponencial: baseDelay * (multiplier ^ attempt)
  const exponentialDelay = config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt)

  // Aplicar límite máximo
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs)

  // Agregar jitter aleatorio para evitar thundering herd
  const jitter = Math.random() * config.jitterMs

  return Math.floor(cappedDelay + jitter)
}

/**
 * Determina si un error es reintentable
 */
function isRetryableError(error: Error, config: RetryConfig): boolean {
  const errorMessage = (error.message || '').toLowerCase()
  const errorName = (error.name || '').toLowerCase()

  // Verificar errores no reintenables primero (tienen prioridad)
  for (const nonRetryableError of config.nonRetryableErrors) {
    if (
      errorMessage.includes(nonRetryableError.toLowerCase()) ||
      errorName.includes(nonRetryableError.toLowerCase())
    ) {
      return false
    }
  }

  // Verificar errores reintenables
  for (const retryableError of config.retryableErrors) {
    if (
      errorMessage.includes(retryableError.toLowerCase()) ||
      errorName.includes(retryableError.toLowerCase())
    ) {
      return true
    }
  }

  // Por defecto, no reintentar errores desconocidos
  return false
}

/**
 * Extrae información del error para logging
 */
function extractErrorInfo(error: Error): {
  type: string
  code?: string
  statusCode?: number
  isNetwork: boolean
} {
  const message = (error.message || '').toLowerCase()
  const name = (error.name || '').toLowerCase()

  // Detectar errores de red
  const networkErrors = ['econnreset', 'enotfound', 'econnrefused', 'etimedout']
  const isNetwork = networkErrors.some(
    netError => message.includes(netError) || name.includes(netError)
  )

  // Extraer código de estado HTTP si existe
  const statusMatch = message.match(/(\d{3})/)
  const statusCode = statusMatch ? parseInt(statusMatch[1]) : undefined

  return {
    type: name || 'unknown',
    code: statusCode?.toString(),
    statusCode,
    isNetwork,
  }
}

/**
 * Función principal de retry con backoff exponencial
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig,
  operationName: string = 'unknown'
): Promise<RetryResult<T>> {
  const startTime = Date.now()
  let lastError: Error | undefined
  let attempts = 0

  logger.info(LogCategory.API, `Starting retry operation: ${operationName}`)

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    attempts = attempt + 1
    const attemptStart = Date.now()

    try {
      logger.info(
        LogCategory.API,
        `Retry attempt ${attempts}/${config.maxRetries + 1} for ${operationName}`
      )

      const result = await operation()
      const attemptDuration = Date.now() - attemptStart
      const totalDuration = Date.now() - startTime

      logger.info(LogCategory.API, `Retry operation succeeded: ${operationName}`)

      // ✅ NUEVO: Registrar métricas de retry exitoso
      await metricsCollector.recordRetry(operationName, attempts, true, totalDuration)

      return {
        success: true,
        data: result,
        attempts,
        totalDuration,
        lastAttemptDuration: attemptDuration,
      }
    } catch (error) {
      lastError = error as Error
      const attemptDuration = Date.now() - attemptStart
      const errorInfo = extractErrorInfo(lastError)

      const attemptInfo: AttemptInfo = {
        attempt: attempts,
        maxRetries: config.maxRetries + 1,
        delay: 0,
        error: lastError,
        duration: attemptDuration,
      }

      // Log del intento fallido
      logger.warn(LogCategory.API, `Retry attempt ${attempts} failed for ${operationName}`)

      // Si es el último intento, no calcular delay
      if (attempt === config.maxRetries) {
        break
      }

      // Verificar si el error es reintentable
      if (!isRetryableError(lastError, config)) {
        logger.error(LogCategory.API, `Non-retryable error for ${operationName}`, lastError)
        break
      }

      // Calcular delay para el siguiente intento
      const delay = calculateDelay(attempt, config)
      attemptInfo.delay = delay

      logger.info(LogCategory.API, `Retrying ${operationName} in ${delay}ms`)

      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  // Todos los intentos fallaron
  const totalDuration = Date.now() - startTime

  logger.error(LogCategory.API, `All retry attempts failed for ${operationName}`, lastError!)

  // ✅ NUEVO: Registrar métricas de retry fallido
  await metricsCollector.recordRetry(operationName, attempts, false, totalDuration)

  return {
    success: false,
    error: lastError,
    attempts,
    totalDuration,
    lastAttemptDuration: 0,
  }
}

/**
 * Wrapper específico para operaciones de MercadoPago
 */
export async function retryMercadoPagoOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  isCritical: boolean = true
): Promise<RetryResult<T>> {
  const config = isCritical ? RETRY_CONFIGS.MERCADOPAGO_CRITICAL : RETRY_CONFIGS.MERCADOPAGO_QUERY

  return retryWithBackoff(operation, config, `MercadoPago:${operationName}`)
}

/**
 * Wrapper para operaciones de webhook
 */
export async function retryWebhookOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<RetryResult<T>> {
  return retryWithBackoff(operation, RETRY_CONFIGS.WEBHOOK_PROCESSING, `Webhook:${operationName}`)
}

/**
 * Función de utilidad para crear un retry personalizado
 */
export function createRetryFunction<T>(config: RetryConfig, operationName: string) {
  return (operation: () => Promise<T>): Promise<RetryResult<T>> => {
    return retryWithBackoff(operation, config, operationName)
  }
}
