/**
 * Sistema de logging centralizado para ProductCard
 * Reemplaza console.logs dispersos con un sistema controlado
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  component?: string
  includeTimestamp?: boolean
  includeComponent?: boolean
}

const DEFAULT_CONFIG: LoggerConfig = {
  enabled: process.env.NODE_ENV === 'development',
  level: 'debug',
  includeTimestamp: true,
  includeComponent: true,
}

class Logger {
  private config: LoggerConfig
  private componentName: string

  constructor(componentName: string = 'ProductCard', config?: Partial<LoggerConfig>) {
    this.componentName = componentName
    this.config = { ...DEFAULT_CONFIG, ...config, component: componentName }
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false

    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.config.level)
    const messageLevelIndex = levels.indexOf(level)

    return messageLevelIndex >= currentLevelIndex
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): [string, ...any[]] {
    const parts: string[] = []

    if (this.config.includeTimestamp) {
      const timestamp = new Date().toISOString().split('T')[1].split('.')[0]
      parts.push(`[${timestamp}]`)
    }

    if (this.config.includeComponent && this.config.component) {
      parts.push(`[${this.config.component}]`)
    }

    parts.push(message)

    return [parts.join(' '), ...args]
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      const formatted = this.formatMessage('debug', message, ...args)
      console.debug(...formatted)
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      const formatted = this.formatMessage('info', message, ...args)
      console.info(...formatted)
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      const formatted = this.formatMessage('warn', message, ...args)
      console.warn(...formatted)
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      const formatted = this.formatMessage('error', message, ...args)
      console.error(...formatted)
    }
  }

  /**
   * Crea un logger hijo con un nombre de componente adicional
   */
  child(componentName: string, config?: Partial<LoggerConfig>): Logger {
    const fullName = `${this.componentName}/${componentName}`
    return new Logger(fullName, { ...this.config, ...config })
  }
}

/**
 * Logger por defecto para ProductCard
 */
export const logger = new Logger('ProductCard', {
  enabled: process.env.NODE_ENV === 'development' || process.env.DEBUG_PRODUCT_CARD === 'true',
  level: (process.env.LOG_LEVEL as LogLevel) || 'debug',
})

/**
 * Crea un logger para un componente específico
 */
export function createLogger(componentName: string, config?: Partial<LoggerConfig>): Logger {
  return logger.child(componentName, config)
}

/**
 * Logger para desarrollo - siempre activo
 */
export const devLogger = new Logger('ProductCard', {
  enabled: true,
  level: 'debug',
})
