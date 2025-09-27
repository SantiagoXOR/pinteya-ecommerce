// ===================================
// PINTEYA E-COMMERCE - STRUCTURED LOGGING SYSTEM
// ===================================

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export enum LogCategory {
  PAYMENT = 'payment',
  WEBHOOK = 'webhook',
  ORDER = 'order',
  AUTH = 'auth',
  API = 'api',
  SECURITY = 'security',
  PERFORMANCE = 'performance',
  USER = 'user',
  NEXTJS = 'nextjs',
  METADATA = 'metadata',
  VERCEL = 'vercel',
}

interface BaseLogEntry {
  timestamp: string
  level: LogLevel
  category: LogCategory
  message: string
  requestId?: string
  userId?: string
  sessionId?: string
  clientIP?: string
  userAgent?: string
  environment: string
}

interface PaymentLogEntry extends BaseLogEntry {
  category: LogCategory.PAYMENT
  paymentData: {
    orderId?: string
    paymentId?: string
    amount?: number
    currency?: string
    status?: string
    method?: string
    preferenceId?: string
  }
}

interface WebhookLogEntry extends BaseLogEntry {
  category: LogCategory.WEBHOOK
  webhookData: {
    type?: string
    action?: string
    dataId?: string
    signature?: string
    isValid?: boolean
    processingTime?: number
  }
}

interface SecurityLogEntry extends BaseLogEntry {
  category: LogCategory.SECURITY
  securityData: {
    threat?: string
    blocked?: boolean
    reason?: string
    riskScore?: number
  }
}

interface PerformanceLogEntry extends BaseLogEntry {
  category: LogCategory.PERFORMANCE
  performanceData: {
    operation?: string
    duration?: number
    endpoint?: string
    statusCode?: number
    responseSize?: number
  }
}

interface NextJSLogEntry extends BaseLogEntry {
  category: LogCategory.NEXTJS | LogCategory.METADATA | LogCategory.VERCEL
  nextjsData: {
    errorType?: 'metadata_viewport' | 'metadata_themeColor' | 'build_warning' | 'runtime_error'
    route?: string
    buildId?: string
    requestId?: string
    vercelRequestId?: string
    metadataField?: string
    nextjsVersion?: string
    buildWarnings?: string[]
    correlationId?: string
  }
}

type LogEntry =
  | PaymentLogEntry
  | WebhookLogEntry
  | SecurityLogEntry
  | PerformanceLogEntry
  | NextJSLogEntry
  | BaseLogEntry

class StructuredLogger {
  private environment: string
  private enableConsole: boolean
  private enableFile: boolean
  private minLevel: LogLevel

  constructor() {
    this.environment = process.env.NODE_ENV || 'development'
    this.enableConsole = true
    this.enableFile = process.env.NODE_ENV === 'production'
    this.minLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL]
    return levels.indexOf(level) >= levels.indexOf(this.minLevel)
  }

  private formatLogEntry(entry: LogEntry): string {
    return JSON.stringify(
      {
        ...entry,
        timestamp: new Date().toISOString(),
        environment: this.environment,
      },
      null,
      this.environment === 'development' ? 2 : 0
    )
  }

  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return
    }

    const formattedEntry = this.formatLogEntry(entry)

    // Console output
    if (this.enableConsole) {
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formattedEntry)
          break
        case LogLevel.INFO:
          console.info(formattedEntry)
          break
        case LogLevel.WARN:
          console.warn(formattedEntry)
          break
        case LogLevel.ERROR:
        case LogLevel.CRITICAL:
          console.error(formattedEntry)
          break
      }
    }

    // File output (en producción se podría integrar con servicios como Winston, Pino, etc.)
    if (this.enableFile) {
      // TODO: Implementar escritura a archivo o servicio de logging externo
      // Por ahora solo console en producción
    }
  }

  // Métodos públicos para diferentes categorías
  payment(
    level: LogLevel,
    message: string,
    paymentData: PaymentLogEntry['paymentData'],
    metadata?: Partial<BaseLogEntry>
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      category: LogCategory.PAYMENT,
      message,
      paymentData,
      environment: this.environment,
      ...metadata,
    } as PaymentLogEntry)
  }

  webhook(
    level: LogLevel,
    message: string,
    webhookData: WebhookLogEntry['webhookData'],
    metadata?: Partial<BaseLogEntry>
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      category: LogCategory.WEBHOOK,
      message,
      webhookData,
      environment: this.environment,
      ...metadata,
    } as WebhookLogEntry)
  }

  security(
    level: LogLevel,
    message: string,
    securityData: SecurityLogEntry['securityData'],
    metadata?: Partial<BaseLogEntry>
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      category: LogCategory.SECURITY,
      message,
      securityData,
      environment: this.environment,
      ...metadata,
    } as SecurityLogEntry)
  }

  performance(
    level: LogLevel,
    message: string,
    performanceData: PerformanceLogEntry['performanceData'],
    metadata?: Partial<BaseLogEntry>
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      category: LogCategory.PERFORMANCE,
      message,
      performanceData,
      environment: this.environment,
      ...metadata,
    } as PerformanceLogEntry)
  }

  nextjs(
    level: LogLevel,
    message: string,
    nextjsData: NextJSLogEntry['nextjsData'],
    metadata?: Partial<BaseLogEntry>
  ): void {
    const entry: NextJSLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: LogCategory.NEXTJS,
      message,
      nextjsData,
      environment: this.environment,
      ...metadata,
    }
    this.writeLog(entry)
  }

  metadata(
    level: LogLevel,
    message: string,
    nextjsData: NextJSLogEntry['nextjsData'],
    metadata?: Partial<BaseLogEntry>
  ): void {
    const entry: NextJSLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: LogCategory.METADATA,
      message,
      nextjsData,
      environment: this.environment,
      ...metadata,
    }
    this.writeLog(entry)
  }

  vercel(
    level: LogLevel,
    message: string,
    nextjsData: NextJSLogEntry['nextjsData'],
    metadata?: Partial<BaseLogEntry>
  ): void {
    const entry: NextJSLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category: LogCategory.VERCEL,
      message,
      nextjsData,
      environment: this.environment,
      ...metadata,
    }
    this.writeLog(entry)
  }

  // Método log genérico para compatibilidad
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    metadata?: Partial<BaseLogEntry>
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      environment: this.environment,
      data,
      ...metadata,
    } as BaseLogEntry)
  }

  // Métodos de conveniencia
  debug(
    level: LogLevel,
    message: string,
    data?: any,
    category?: LogCategory,
    metadata?: Partial<BaseLogEntry>
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: level,
      category: category || LogCategory.API,
      message,
      environment: this.environment,
      data,
      ...metadata,
    } as BaseLogEntry)
  }

  info(category: LogCategory, message: string, data?: any, metadata?: Partial<BaseLogEntry>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      category,
      message,
      environment: this.environment,
      data,
      ...metadata,
    } as BaseLogEntry)
  }

  warn(category: LogCategory, message: string, data?: any, metadata?: Partial<BaseLogEntry>): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      category,
      message,
      environment: this.environment,
      data,
      ...metadata,
    } as BaseLogEntry)
  }

  error(
    category: LogCategory,
    message: string,
    error?: Error,
    metadata?: Partial<BaseLogEntry>
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      category,
      message,
      environment: this.environment,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      ...metadata,
    } as BaseLogEntry)
  }

  critical(
    category: LogCategory,
    message: string,
    error?: Error,
    metadata?: Partial<BaseLogEntry>
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      level: LogLevel.CRITICAL,
      category,
      message,
      environment: this.environment,
      error: error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : undefined,
      ...metadata,
    } as BaseLogEntry)
  }

  // Método para medir performance
  measurePerformance<T>(
    operation: string,
    fn: () => T | Promise<T>,
    metadata?: Partial<BaseLogEntry>
  ): T | Promise<T> {
    const start = Date.now()

    try {
      const result = fn()

      if (result instanceof Promise) {
        return result
          .then(value => {
            const duration = Date.now() - start
            this.performance(
              LogLevel.INFO,
              `Operation completed: ${operation}`,
              {
                operation,
                duration,
              },
              metadata
            )
            return value
          })
          .catch(error => {
            const duration = Date.now() - start
            this.performance(
              LogLevel.ERROR,
              `Operation failed: ${operation}`,
              {
                operation,
                duration,
              },
              metadata
            )
            throw error
          })
      } else {
        const duration = Date.now() - start
        this.performance(
          LogLevel.INFO,
          `Operation completed: ${operation}`,
          {
            operation,
            duration,
          },
          metadata
        )
        return result
      }
    } catch (error) {
      const duration = Date.now() - start
      this.performance(
        LogLevel.ERROR,
        `Operation failed: ${operation}`,
        {
          operation,
          duration,
        },
        metadata
      )
      throw error
    }
  }
}

// Instancia singleton del logger
export const logger = new StructuredLogger()

// Funciones de conveniencia para uso directo
export const logPayment = (
  level: LogLevel,
  message: string,
  paymentData: PaymentLogEntry['paymentData'],
  metadata?: Partial<BaseLogEntry>
) => {
  logger.payment(level, message, paymentData, metadata)
}

export const logWebhook = (
  level: LogLevel,
  message: string,
  webhookData: WebhookLogEntry['webhookData'],
  metadata?: Partial<BaseLogEntry>
) => {
  logger.webhook(level, message, webhookData, metadata)
}

export const logSecurity = (
  level: LogLevel,
  message: string,
  securityData: SecurityLogEntry['securityData'],
  metadata?: Partial<BaseLogEntry>
) => {
  logger.security(level, message, securityData, metadata)
}

export const logPerformance = (
  level: LogLevel,
  message: string,
  performanceData: PerformanceLogEntry['performanceData'],
  metadata?: Partial<BaseLogEntry>
) => {
  logger.performance(level, message, performanceData, metadata)
}

export const logNextJS = (
  level: LogLevel,
  message: string,
  nextjsData: NextJSLogEntry['nextjsData'],
  metadata?: Partial<BaseLogEntry>
) => {
  logger.nextjs(level, message, nextjsData, metadata)
}

export const logMetadata = (
  level: LogLevel,
  message: string,
  nextjsData: NextJSLogEntry['nextjsData'],
  metadata?: Partial<BaseLogEntry>
) => {
  logger.metadata(level, message, nextjsData, metadata)
}

export const logVercel = (
  level: LogLevel,
  message: string,
  nextjsData: NextJSLogEntry['nextjsData'],
  metadata?: Partial<BaseLogEntry>
) => {
  logger.vercel(level, message, nextjsData, metadata)
}

export default logger
