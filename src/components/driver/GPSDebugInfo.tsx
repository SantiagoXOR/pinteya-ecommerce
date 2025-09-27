'use client'

import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Clock, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/core/utils'

interface GPSDebugInfoProps {
  tracker?: any // GeolocationTracker instance
  className?: string
  showDetails?: boolean
}

interface TrackerStats {
  isTracking: boolean
  consecutiveErrors: number
  retryCount: number
  fallbackMode: boolean
  lastSuccessfulPosition: any
}

export default function GPSDebugInfo({
  tracker,
  className,
  showDetails = false,
}: GPSDebugInfoProps) {
  const [stats, setStats] = useState<TrackerStats | null>(null)
  const [permissionState, setPermissionState] = useState<PermissionState | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Actualizar estadísticas del tracker
  useEffect(() => {
    if (!tracker || typeof tracker.getStats !== 'function') return

    const updateStats = () => {
      try {
        const currentStats = tracker.getStats()
        setStats(currentStats)
      } catch (error) {
        console.warn('Error getting tracker stats:', error)
      }
    }

    // Actualizar inmediatamente
    updateStats()

    // Actualizar cada 2 segundos
    const interval = setInterval(updateStats, 2000)

    return () => clearInterval(interval)
  }, [tracker])

  // Verificar permisos de geolocalización
  useEffect(() => {
    const checkPermissions = async () => {
      if ('permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' })
          setPermissionState(result.state)

          // Escuchar cambios en permisos
          result.addEventListener('change', () => {
            setPermissionState(result.state)
          })
        } catch (error) {
          console.warn('Could not check geolocation permission:', error)
        }
      }
    }

    checkPermissions()
  }, [])

  const getStatusIcon = () => {
    if (!stats) return <Clock className='w-4 h-4 text-gray-400' />

    if (stats.isTracking && stats.consecutiveErrors === 0) {
      return <CheckCircle className='w-4 h-4 text-green-500' />
    } else if (stats.consecutiveErrors > 0) {
      return <AlertCircle className='w-4 h-4 text-yellow-500' />
    } else {
      return <WifiOff className='w-4 h-4 text-red-500' />
    }
  }

  const getStatusText = () => {
    if (!stats) return 'Inicializando...'

    if (stats.isTracking && stats.consecutiveErrors === 0) {
      return stats.fallbackMode ? 'GPS (Modo Ahorro)' : 'GPS Activo'
    } else if (stats.consecutiveErrors > 0) {
      return `GPS con errores (${stats.consecutiveErrors})`
    } else {
      return 'GPS Inactivo'
    }
  }

  const getPermissionIcon = () => {
    switch (permissionState) {
      case 'granted':
        return <CheckCircle className='w-4 h-4 text-green-500' />
      case 'denied':
        return <AlertCircle className='w-4 h-4 text-red-500' />
      case 'prompt':
        return <Clock className='w-4 h-4 text-yellow-500' />
      default:
        return <Clock className='w-4 h-4 text-gray-400' />
    }
  }

  if (!showDetails && !stats?.isTracking) return null

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg p-3 shadow-sm', className)}>
      {/* Estado principal */}
      <div
        className='flex items-center justify-between cursor-pointer'
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className='flex items-center space-x-2'>
          {getStatusIcon()}
          <span className='text-sm font-medium text-gray-700'>{getStatusText()}</span>
        </div>

        {showDetails && (
          <RefreshCw
            className={cn('w-4 h-4 text-gray-400 transition-transform', isExpanded && 'rotate-180')}
          />
        )}
      </div>

      {/* Detalles expandidos */}
      {showDetails && isExpanded && stats && (
        <div className='mt-3 space-y-2 text-xs text-gray-600'>
          {/* Permisos */}
          <div className='flex items-center justify-between'>
            <span>Permisos:</span>
            <div className='flex items-center space-x-1'>
              {getPermissionIcon()}
              <span className='capitalize'>{permissionState || 'Desconocido'}</span>
            </div>
          </div>

          {/* Estado de tracking */}
          <div className='flex items-center justify-between'>
            <span>Tracking:</span>
            <span
              className={cn('font-medium', stats.isTracking ? 'text-green-600' : 'text-red-600')}
            >
              {stats.isTracking ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {/* Modo de precisión */}
          <div className='flex items-center justify-between'>
            <span>Modo:</span>
            <span
              className={cn(
                'font-medium',
                stats.fallbackMode ? 'text-yellow-600' : 'text-green-600'
              )}
            >
              {stats.fallbackMode ? 'Ahorro Batería' : 'Alta Precisión'}
            </span>
          </div>

          {/* Errores consecutivos */}
          {stats.consecutiveErrors > 0 && (
            <div className='flex items-center justify-between'>
              <span>Errores:</span>
              <span className='font-medium text-red-600'>
                {stats.consecutiveErrors} consecutivos
              </span>
            </div>
          )}

          {/* Reintentos */}
          {stats.retryCount > 0 && (
            <div className='flex items-center justify-between'>
              <span>Reintentos:</span>
              <span className='font-medium text-yellow-600'>{stats.retryCount}</span>
            </div>
          )}

          {/* Última posición exitosa */}
          {stats.lastSuccessfulPosition && (
            <div className='pt-2 border-t border-gray-100'>
              <div className='text-xs text-gray-500 mb-1'>Última posición:</div>
              <div className='text-xs font-mono'>
                <div>Lat: {stats.lastSuccessfulPosition.lat.toFixed(6)}</div>
                <div>Lng: {stats.lastSuccessfulPosition.lng.toFixed(6)}</div>
                {stats.lastSuccessfulPosition.accuracy && (
                  <div>Precisión: {Math.round(stats.lastSuccessfulPosition.accuracy)}m</div>
                )}
                <div>
                  Tiempo: {new Date(stats.lastSuccessfulPosition.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
