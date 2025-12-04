/**
 * Sistema Centralizado de Manejo de Errores
 * 
 * Este módulo coordina todos los interceptores de console.error para evitar
 * conflictos y bucles de propagación infinita.
 */

interface ErrorHandler {
  id: string
  priority: number
  handler: (args: any[]) => boolean // true = handled, false = continue
}

class CentralizedErrorHandler {
  private originalConsoleError: typeof console.error
  private originalConsoleWarn: typeof console.warn
  private handlers: ErrorHandler[] = []
  private isActive = false

  constructor() {
    // Guardar las referencias originales INMEDIATAMENTE
    this.originalConsoleError = console.error.bind(console)
    this.originalConsoleWarn = console.warn.bind(console)
  }

  /**
   * Registra un manejador de errores
   */
  registerHandler(id: string, priority: number, handler: (args: any[]) => boolean) {
    // Remover handler existente con el mismo ID
    this.handlers = this.handlers.filter(h => h.id !== id)
    
    // Agregar nuevo handler
    this.handlers.push({ id, priority, handler })
    
    // Ordenar por prioridad (mayor prioridad primero)
    this.handlers.sort((a, b) => b.priority - a.priority)
    
    // Activar interceptor si no está activo
    if (!this.isActive) {
      this.activate()
    }
  }

  /**
   * Desregistra un manejador de errores
   */
  unregisterHandler(id: string) {
    this.handlers = this.handlers.filter(h => h.id !== id)
    
    // Si no hay más handlers, desactivar interceptor
    if (this.handlers.length === 0 && this.isActive) {
      this.deactivate()
    }
  }

  /**
   * Activa el interceptor centralizado
   */
  private activate() {
    if (this.isActive) return

    const centralizedErrorHandler = (...args: any[]) => {
      let handled = false

      // Ejecutar handlers en orden de prioridad
      for (const { handler } of this.handlers) {
        try {
          if (handler(args)) {
            handled = true
            break
          }
        } catch (error) {
          // Si un handler falla, continuar con el siguiente
          console.debug('Error in handler:', error)
        }
      }

      // Si ningún handler procesó el error, usar la función original
      if (!handled) {
        try {
          this.originalConsoleError.apply(console, args)
        } catch (error) {
          // Fallback final
          console.debug('Centralized error handler fallback:', ...args)
        }
      }
    }

    // Marcar como interceptor centralizado
    ;(centralizedErrorHandler as any).__centralizedErrorHandler = true
    console.error = centralizedErrorHandler
    this.isActive = true
  }

  /**
   * Desactiva el interceptor centralizado
   */
  private deactivate() {
    if (!this.isActive) return

    console.error = this.originalConsoleError
    this.isActive = false
  }

  /**
   * Obtiene la función original de console.error
   */
  getOriginalConsoleError() {
    return this.originalConsoleError
  }

  /**
   * Obtiene la función original de console.warn
   */
  getOriginalConsoleWarn() {
    return this.originalConsoleWarn
  }

  /**
   * Verifica si el interceptor está activo
   */
  isInterceptorActive() {
    return this.isActive
  }

  /**
   * Obtiene la lista de handlers registrados
   */
  getRegisteredHandlers() {
    return [...this.handlers]
  }
}

// Instancia singleton
const centralizedErrorHandler = new CentralizedErrorHandler()

export { centralizedErrorHandler }

// Funciones de conveniencia
export const registerErrorHandler = (
  id: string, 
  priority: number, 
  handler: (args: any[]) => boolean
) => {
  centralizedErrorHandler.registerHandler(id, priority, handler)
}

export const unregisterErrorHandler = (id: string) => {
  centralizedErrorHandler.unregisterHandler(id)
}

export const getOriginalConsoleError = () => {
  return centralizedErrorHandler.getOriginalConsoleError()
}

export const getOriginalConsoleWarn = () => {
  return centralizedErrorHandler.getOriginalConsoleWarn()
}

// Patrones de supresión comunes
export const suppressionPatterns = {
  abortError: (args: any[]) => {
    const message = args.join(' ')
    return message.includes('AbortError') || 
           message.includes('The operation was aborted') ||
           message.includes('The user aborted a request')
  },
  
  networkError: (args: any[]) => {
    const message = args.join(' ')
    return message.includes('NetworkError') ||
           message.includes('Failed to fetch') ||
           message.includes('ERR_NETWORK')
  },
  
  nextAuthError: (args: any[]) => {
    const message = args.join(' ')
    return message.includes('next-auth') ||
           message.includes('NextAuth') ||
           message.includes('ClientFetchError')
  }
}

// Sistema de logging directo que bypasea todos los interceptores
let nativeConsole: Console | null = null

// Función para inicializar el console nativo de forma segura
const initializeNativeConsole = () => {
  if (typeof window === 'undefined' || nativeConsole) return
  
  try {
    // Crear un iframe oculto para obtener el console nativo sin interceptar
    const iframe = document.createElement('iframe')
    iframe.style.display = 'none'
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.top = '-9999px'
    
    document.body.appendChild(iframe)
    
    // Obtener el console nativo del iframe
    if (iframe.contentWindow && iframe.contentWindow.console) {
      nativeConsole = iframe.contentWindow.console
    }
    
    // Limpiar el iframe inmediatamente
    document.body.removeChild(iframe)
  } catch (e) {
    // Si falla, nativeConsole permanece null y usaremos fallbacks
  }
}

// Inicializar cuando sea posible
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNativeConsole)
  } else {
    initializeNativeConsole()
  }
}

// Funciones de logging seguro que evitan bucles infinitos
export const logError = (...args: any[]) => {
  // Usar console nativo del iframe para evitar interceptores
  if (nativeConsole && nativeConsole.error) {
    try {
      nativeConsole.error(...args)
      return
    } catch (e) {
      // Continuar con fallbacks
    }
  }
  
  // Fallback 1: Usar console original almacenado
  try {
    const originalError = centralizedErrorHandler.getOriginalConsoleError()
    if (originalError && typeof originalError === 'function') {
      originalError.call(console, ...args)
      return
    }
  } catch (e) {
    // Continuar con siguiente fallback
  }
  
  // Fallback 2: Usar window.console.debug como último recurso
  if (typeof window !== 'undefined' && window.console && window.console.debug) {
    try {
      window.console.debug('[ERROR]', ...args)
    } catch (e) {
      // Silencioso - no podemos hacer más
    }
  }
}

export const logWarning = (...args: any[]) => {
  // Usar console nativo del iframe para evitar interceptores
  if (nativeConsole && nativeConsole.warn) {
    try {
      nativeConsole.warn(...args)
      return
    } catch (e) {
      // Continuar con fallbacks
    }
  }
  
  // Fallback 1: Usar console original almacenado
  try {
    const originalWarn = centralizedErrorHandler.getOriginalConsoleWarn()
    if (originalWarn && typeof originalWarn === 'function') {
      originalWarn.call(console, ...args)
      return
    }
  } catch (e) {
    // Continuar con siguiente fallback
  }
  
  // Fallback 2: Usar window.console.debug como último recurso
  if (typeof window !== 'undefined' && window.console && window.console.debug) {
    try {
      window.console.debug('[WARN]', ...args)
    } catch (e) {
      // Silencioso - no podemos hacer más
    }
  }
}