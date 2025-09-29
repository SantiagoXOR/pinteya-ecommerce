/**
 * Utilidades para manejo robusto de geolocalización
 * Incluye verificación de permisos, manejo de errores y configuraciones optimizadas
 */

import React, { useCallback } from 'react'

export interface GeolocationPosition {
  lat: number
  lng: number
  accuracy?: number
  speed?: number
  heading?: number
  timestamp: number
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export interface GeolocationError {
  code: number
  message: string
  type: 'PERMISSION_DENIED' | 'POSITION_UNAVAILABLE' | 'TIMEOUT' | 'NOT_SUPPORTED' | 'UNKNOWN'
  timestamp: number
  retryable: boolean
  originalError?: any
}

// Configuraciones predeterminadas optimizadas
export const DEFAULT_GEOLOCATION_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 15000, // Aumentado de 10s a 15s
  maximumAge: 5000,
}

export const HIGH_ACCURACY_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 20000, // Aumentado de 15s a 20s
  maximumAge: 3000,
}

export const BATTERY_SAVING_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: false,
  timeout: 30000, // Aumentado de 20s a 30s
  maximumAge: 60000, // Aumentado de 30s a 60s
}

export const FALLBACK_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: false,
  timeout: 25000,
  maximumAge: 10000,
}

/**
 * Verifica si la geolocalización está soportada
 */
export function isGeolocationSupported(): boolean {
  return 'geolocation' in navigator
}

/**
 * Verifica el estado de los permisos de geolocalización
 */
export async function checkGeolocationPermission(): Promise<PermissionState | null> {
  if (!('permissions' in navigator)) {
    return null
  }

  try {
    const result = await navigator.permissions.query({ name: 'geolocation' })
    return result.state
  } catch (error) {
    console.warn('Could not check geolocation permission:', error)
    return null
  }
}

/**
 * Convierte GeolocationPositionError a nuestro formato mejorado
 */
function convertGeolocationError(
  error: GeolocationPositionError,
  context?: string
): GeolocationError {
  let type: GeolocationError['type']
  let message: string
  let retryable = false

  switch (error.code) {
    case error.PERMISSION_DENIED:
      type = 'PERMISSION_DENIED'
      message =
        'Permisos de ubicación denegados por el usuario. Habilita la ubicación en la configuración del navegador.'
      retryable = false
      break
    case error.POSITION_UNAVAILABLE:
      type = 'POSITION_UNAVAILABLE'
      message = 'Información de ubicación no disponible. Verifica tu conexión GPS/WiFi.'
      retryable = true
      break
    case error.TIMEOUT:
      type = 'TIMEOUT'
      message = 'Timeout al obtener ubicación. Reintentando con configuración menos estricta.'
      retryable = true
      break
    default:
      type = 'UNKNOWN'
      message = `Error desconocido de geolocalización (código: ${error.code})`
      retryable = true
      break
  }

  // Agregar contexto si está disponible
  if (context) {
    message = `${context}: ${message}`
  }

  return {
    code: error.code,
    message,
    type,
    timestamp: Date.now(),
    retryable,
    originalError: {
      code: error.code,
      message: error.message,
      PERMISSION_DENIED: error.PERMISSION_DENIED,
      POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
      TIMEOUT: error.TIMEOUT,
    },
  }
}

/**
 * Convierte GeolocationPosition a nuestro formato
 */
function convertPosition(position: globalThis.GeolocationPosition): GeolocationPosition {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy,
    speed: position.coords.speed || undefined,
    heading: position.coords.heading || undefined,
    timestamp: position.timestamp,
  }
}

/**
 * Obtiene la ubicación actual con retry logic y fallback
 */
export async function getCurrentPosition(
  options: GeolocationOptions = DEFAULT_GEOLOCATION_OPTIONS,
  maxRetries = 2
): Promise<GeolocationPosition> {
  if (!isGeolocationSupported()) {
    throw {
      code: 0,
      message: 'Geolocalización no soportada en este navegador',
      type: 'NOT_SUPPORTED',
      timestamp: Date.now(),
      retryable: false,
    } as GeolocationError
  }

  let lastError: GeolocationError | null = null

  // Intentar con configuración original
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const currentOptions =
        attempt === 0 ? options : attempt === 1 ? FALLBACK_OPTIONS : BATTERY_SAVING_OPTIONS

      const position = await getCurrentPositionSingle(currentOptions, `Intento ${attempt + 1}`)
      return position
    } catch (error) {
      lastError = error as GeolocationError

      // Si no es retryable, fallar inmediatamente
      if (!lastError.retryable) {
        throw lastError
      }

      // Esperar antes del siguiente intento
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
  }

  throw lastError
}

/**
 * Obtiene la ubicación actual una sola vez (función auxiliar)
 */
function getCurrentPositionSingle(
  options: GeolocationOptions,
  context?: string
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      position => {
        resolve(convertPosition(position))
      },
      error => {
        reject(convertGeolocationError(error, context))
      },
      options
    )
  })
}

/**
 * Clase para manejo de tracking continuo de ubicación con retry logic
 */
export class GeolocationTracker {
  private watchId: number | null = null
  private isTracking = false
  private options: GeolocationOptions
  private onUpdate?: (position: GeolocationPosition) => void
  private onError?: (error: GeolocationError) => void
  private retryCount = 0
  private maxRetries = 3
  private retryTimeout: NodeJS.Timeout | null = null
  private lastSuccessfulPosition: GeolocationPosition | null = null
  private consecutiveErrors = 0
  private fallbackMode = false

  constructor(
    options: GeolocationOptions = DEFAULT_GEOLOCATION_OPTIONS,
    onUpdate?: (position: GeolocationPosition) => void,
    onError?: (error: GeolocationError) => void
  ) {
    this.options = options
    this.onUpdate = onUpdate
    this.onError = onError
  }

  /**
   * Inicia el tracking de ubicación con retry logic
   */
  async start(): Promise<void> {
    if (this.isTracking || this.watchId !== null) {
      return
    }

    if (!isGeolocationSupported()) {
      const error: GeolocationError = {
        code: 0,
        message: 'Geolocalización no soportada en este navegador',
        type: 'NOT_SUPPORTED',
        timestamp: Date.now(),
        retryable: false,
      }
      this.onError?.(error)
      return
    }

    // Verificar permisos si es posible
    const permission = await checkGeolocationPermission()
    if (permission === 'denied') {
      const error: GeolocationError = {
        code: 1,
        message:
          'Permisos de geolocalización denegados. Habilita la ubicación en la configuración del navegador.',
        type: 'PERMISSION_DENIED',
        timestamp: Date.now(),
        retryable: false,
      }
      this.onError?.(error)
      return
    }

    this.startWatching()
  }

  /**
   * Inicia el watchPosition con la configuración actual
   */
  private startWatching(): void {
    try {
      this.isTracking = true
      const currentOptions = this.fallbackMode ? FALLBACK_OPTIONS : this.options

      this.watchId = navigator.geolocation.watchPosition(
        position => {
          this.handlePositionSuccess(convertPosition(position))
        },
        error => {
          this.handlePositionError(convertGeolocationError(error, 'Tracking GPS'))
        },
        currentOptions
      )
    } catch (error) {
      this.isTracking = false
      const geoError: GeolocationError = {
        code: -1,
        message: 'Error al inicializar tracking de ubicación',
        type: 'UNKNOWN',
        timestamp: Date.now(),
        retryable: true,
        originalError: error,
      }
      this.handlePositionError(geoError)
    }
  }

  /**
   * Maneja el éxito en la obtención de posición
   */
  private handlePositionSuccess(position: GeolocationPosition): void {
    this.lastSuccessfulPosition = position
    this.consecutiveErrors = 0
    this.retryCount = 0

    // Si estábamos en modo fallback y ahora funciona, intentar volver a alta precisión
    if (this.fallbackMode) {
      this.fallbackMode = false
      this.restart()
      return
    }

    this.onUpdate?.(position)
  }

  /**
   * Maneja errores en la obtención de posición con retry logic
   */
  private handlePositionError(error: GeolocationError): void {
    this.consecutiveErrors++

    // Solo loggear errores detallados si hay información útil
    if (error && (error.code || error.message || error.type)) {
      console.error('Geolocation error details:', {
        code: error.code || 'unknown',
        message: error.message || 'No error message provided',
        type: error.type || 'UNKNOWN',
        retryable: error.retryable !== undefined ? error.retryable : true,
        consecutiveErrors: this.consecutiveErrors,
        retryCount: this.retryCount,
        fallbackMode: this.fallbackMode,
        originalError: error.originalError || null,
      })
    } else {
      console.error('Geolocation error occurred but no details available:', {
        consecutiveErrors: this.consecutiveErrors,
        retryCount: this.retryCount,
        fallbackMode: this.fallbackMode,
      })
    }

    // Si el error no es retryable, reportar inmediatamente
    if (!error.retryable) {
      this.onError?.(error)
      return
    }

    // Si hemos tenido muchos errores consecutivos, cambiar a modo fallback
    if (this.consecutiveErrors >= 3 && !this.fallbackMode) {
      this.fallbackMode = true
      this.restart()
      return
    }

    // Intentar retry si no hemos excedido el límite
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      const retryDelay = Math.min(1000 * this.retryCount, 5000) // Max 5 segundos

      console.log(
        `Reintentando geolocalización en ${retryDelay}ms (intento ${this.retryCount}/${this.maxRetries})`
      )

      this.retryTimeout = setTimeout(() => {
        this.restart()
      }, retryDelay)
    } else {
      // Hemos agotado los reintentos, reportar el error
      this.onError?.(error)
    }
  }

  /**
   * Reinicia el tracking (útil para retry logic)
   */
  private restart(): void {
    this.stop()
    setTimeout(() => {
      this.startWatching()
    }, 100)
  }

  /**
   * Detiene el tracking de ubicación
   */
  stop(): void {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = null
    }

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    this.isTracking = false
    this.retryCount = 0
    this.consecutiveErrors = 0
  }

  /**
   * Verifica si está actualmente tracking
   */
  getIsTracking(): boolean {
    return this.isTracking
  }

  /**
   * Actualiza las opciones de tracking
   */
  updateOptions(newOptions: GeolocationOptions): void {
    this.options = { ...this.options, ...newOptions }

    // Si está tracking, reiniciar con nuevas opciones
    if (this.isTracking) {
      this.restart()
    }
  }

  /**
   * Obtiene estadísticas del tracker
   */
  getStats(): {
    isTracking: boolean
    consecutiveErrors: number
    retryCount: number
    fallbackMode: boolean
    lastSuccessfulPosition: GeolocationPosition | null
  } {
    return {
      isTracking: this.isTracking,
      consecutiveErrors: this.consecutiveErrors,
      retryCount: this.retryCount,
      fallbackMode: this.fallbackMode,
      lastSuccessfulPosition: this.lastSuccessfulPosition,
    }
  }

  /**
   * Actualiza los callbacks
   */
  updateCallbacks(
    onUpdate?: (position: GeolocationPosition) => void,
    onError?: (error: GeolocationError) => void
  ): void {
    this.onUpdate = onUpdate
    this.onError = onError
  }
}

/**
 * Hook personalizado para usar geolocalización en React
 */
export function useGeolocation(
  options: GeolocationOptions = DEFAULT_GEOLOCATION_OPTIONS,
  autoStart = false
) {
  const [position, setPosition] = React.useState<GeolocationPosition | null>(null)
  const [error, setError] = React.useState<GeolocationError | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const trackerRef = React.useRef<GeolocationTracker | null>(null)

  React.useEffect(() => {
    trackerRef.current = new GeolocationTracker(
      options,
      pos => {
        setPosition(pos)
        setError(null)
        setIsLoading(false)
      },
      err => {
        setError(err)
        setIsLoading(false)
      }
    )

    if (autoStart) {
      setIsLoading(true)
      trackerRef.current.start()
    }

    return () => {
      trackerRef.current?.stop()
    }
  }, [])

  const startTracking = useCallback(() => {
    if (trackerRef.current) {
      setIsLoading(true)
      trackerRef.current.start()
    }
  }, [])

  const stopTracking = useCallback(() => {
    if (trackerRef.current) {
      trackerRef.current.stop()
      setIsLoading(false)
    }
  }, [])

  const getCurrentLocation = useCallback(async () => {
    setIsLoading(true)
    try {
      const pos = await getCurrentPosition(options)
      setPosition(pos)
      setError(null)
      return pos
    } catch (err) {
      setError(err as GeolocationError)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [options])

  return {
    position,
    error,
    isLoading,
    isTracking: trackerRef.current?.getIsTracking() || false,
    startTracking,
    stopTracking,
    getCurrentLocation,
  }
}
