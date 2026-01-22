/**
 * Tenant-Aware Logger
 * 
 * Wrapper del logger estructurado que automáticamente incluye
 * tenant_id y tenant_slug en todos los logs
 */

import { logger, LogLevel, LogCategory, type BaseLogEntry } from './index'
import { getTenantConfig } from '@/lib/tenant'

/**
 * Obtiene el tenant actual de forma segura (sin lanzar error si falla)
 */
async function getTenantSafe(): Promise<{ id?: string; slug?: string } | null> {
  try {
    const tenant = await getTenantConfig()
    return {
      id: tenant.id,
      slug: tenant.slug,
    }
  } catch (error) {
    // Si falla obtener tenant, retornar null (no bloquear logging)
    return null
  }
}

/**
 * Agrega información del tenant a los metadatos del log
 */
async function enrichMetadata(metadata?: Partial<BaseLogEntry>): Promise<Partial<BaseLogEntry>> {
  const tenant = await getTenantSafe()
  
  return {
    ...metadata,
    ...(tenant && {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
    }),
  }
}

/**
 * Logger con soporte multitenant
 * Automáticamente incluye tenant_id y tenant_slug en todos los logs
 */
export const tenantLogger = {
  /**
   * Log de información
   */
  async info(
    category: LogCategory,
    message: string,
    data?: any,
    metadata?: Partial<BaseLogEntry>
  ): Promise<void> {
    const enrichedMetadata = await enrichMetadata(metadata)
    logger.info(category, message, data, enrichedMetadata)
  },

  /**
   * Log de advertencia
   */
  async warn(
    category: LogCategory,
    message: string,
    data?: any,
    metadata?: Partial<BaseLogEntry>
  ): Promise<void> {
    const enrichedMetadata = await enrichMetadata(metadata)
    logger.warn(category, message, data, enrichedMetadata)
  },

  /**
   * Log de error
   */
  async error(
    category: LogCategory,
    message: string,
    error?: Error,
    metadata?: Partial<BaseLogEntry>
  ): Promise<void> {
    const enrichedMetadata = await enrichMetadata(metadata)
    logger.error(category, message, error, enrichedMetadata)
  },

  /**
   * Log crítico
   */
  async critical(
    category: LogCategory,
    message: string,
    error?: Error,
    metadata?: Partial<BaseLogEntry>
  ): Promise<void> {
    const enrichedMetadata = await enrichMetadata(metadata)
    logger.critical(category, message, error, enrichedMetadata)
  },

  /**
   * Log de pago con tenant
   */
  async payment(
    level: LogLevel,
    message: string,
    paymentData: {
      orderId?: string
      paymentId?: string
      amount?: number
      currency?: string
      status?: string
      method?: string
      preferenceId?: string
    },
    metadata?: Partial<BaseLogEntry>
  ): Promise<void> {
    const enrichedMetadata = await enrichMetadata(metadata)
    logger.payment(level, message, paymentData, enrichedMetadata)
  },

  /**
   * Log de webhook con tenant
   */
  async webhook(
    level: LogLevel,
    message: string,
    webhookData: {
      type?: string
      action?: string
      dataId?: string
      signature?: string
      isValid?: boolean
      processingTime?: number
    },
    metadata?: Partial<BaseLogEntry>
  ): Promise<void> {
    const enrichedMetadata = await enrichMetadata(metadata)
    logger.webhook(level, message, webhookData, enrichedMetadata)
  },

  /**
   * Log de seguridad con tenant
   */
  async security(
    level: LogLevel,
    message: string,
    securityData: {
      threat?: string
      blocked?: boolean
      reason?: string
      riskScore?: number
    },
    metadata?: Partial<BaseLogEntry>
  ): Promise<void> {
    const enrichedMetadata = await enrichMetadata(metadata)
    logger.security(level, message, securityData, enrichedMetadata)
  },

  /**
   * Log de performance con tenant
   */
  async performance(
    level: LogLevel,
    message: string,
    performanceData: {
      operation?: string
      duration?: number
      endpoint?: string
      statusCode?: number
      responseSize?: number
    },
    metadata?: Partial<BaseLogEntry>
  ): Promise<void> {
    const enrichedMetadata = await enrichMetadata(metadata)
    logger.performance(level, message, performanceData, enrichedMetadata)
  },

  /**
   * Medir performance de una operación con tenant
   */
  async measurePerformance<T>(
    operation: string,
    fn: () => T | Promise<T>,
    metadata?: Partial<BaseLogEntry>
  ): Promise<T> {
    const enrichedMetadata = await enrichMetadata(metadata)
    return logger.measurePerformance(operation, fn, enrichedMetadata) as Promise<T>
  },
}

/**
 * Función helper para crear metadata con tenant explícito
 * Útil cuando ya se tiene el tenant_id disponible
 */
export function createTenantMetadata(
  tenantId: string,
  tenantSlug: string,
  additionalMetadata?: Partial<BaseLogEntry>
): Partial<BaseLogEntry> {
  return {
    ...additionalMetadata,
    tenantId,
    tenantSlug,
  }
}

/**
 * Función helper para logging síncrono cuando ya se tiene el tenant
 * (evita async/await innecesario)
 */
export function logWithTenant(
  level: LogLevel,
  category: LogCategory,
  message: string,
  tenantId: string,
  tenantSlug: string,
  data?: any,
  additionalMetadata?: Partial<BaseLogEntry>
): void {
  const metadata = createTenantMetadata(tenantId, tenantSlug, additionalMetadata)
  
  switch (level) {
    case LogLevel.INFO:
      logger.info(category, message, data, metadata)
      break
    case LogLevel.WARN:
      logger.warn(category, message, data, metadata)
      break
    case LogLevel.ERROR:
    case LogLevel.CRITICAL:
      logger.error(category, message, undefined, metadata)
      break
    default:
      logger.log(level, category, message, data, metadata)
  }
}

export default tenantLogger
