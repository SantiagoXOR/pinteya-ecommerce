/**
 * Sistema de Logging Profesional
 * 
 * Permite logs condicionales basados en entorno
 * En producción, solo muestra errores críticos
 */

const isDev = process.env.NODE_ENV === 'development'
const isDebugMode = process.env.NEXT_PUBLIC_DEBUG === 'true'

type LogLevel = 'dev' | 'info' | 'warn' | 'error'

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (level === 'error') return true // Siempre mostrar errores
    if (level === 'warn') return true // Siempre mostrar warnings
    if (level === 'info') return isDev || isDebugMode
    if (level === 'dev') return isDev && isDebugMode
    return false
  }

  private formatMessage(level: string, ...args: any[]): string {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`
    return prefix
  }

  /**
   * Logs solo en desarrollo con NEXT_PUBLIC_DEBUG=true
   * Útil para debugging profundo
   */
  dev(...args: any[]) {
    if (this.shouldLog('dev')) {
      console.log(this.formatMessage('dev'), ...args)
    }
  }

  /**
   * Logs informativos en desarrollo
   * No se muestran en producción
   */
  info(...args: any[]) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info'), ...args)
    }
  }

  /**
   * Warnings - se muestran siempre
   * Para situaciones que no son errores pero requieren atención
   */
  warn(...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn'), ...args)
    }
  }

  /**
   * Errores - se muestran siempre
   * Para errores críticos que requieren investigación
   */
  error(...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error'), ...args)
    }
  }

  /**
   * Log de API requests (solo en dev)
   */
  api(method: string, path: string, data?: any) {
    this.info(`[API] ${method} ${path}`, data)
  }

  /**
   * Log de queries a DB (solo en dev con debug)
   */
  db(operation: string, table: string, data?: any) {
    this.dev(`[DB] ${operation} ${table}`, data)
  }
}

export const logger = new Logger()

// Export para compatibilidad
export default logger


