/**
 * Controles avanzados de navegación para drivers
 * Incluye configuraciones de ruta, rutas alternativas y opciones de transporte
 */

'use client'

import React, { useState, useCallback } from 'react'
import {
  Settings,
  RefreshCw,
  MapPin,
  Clock,
  Car,
  Truck,
  Bike,
  Navigation,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/core/utils'

interface RouteOptions {
  avoidTolls: boolean
  avoidHighways: boolean
  avoidFerries: boolean
  travelMode: google.maps.TravelMode
  optimizeWaypoints: boolean
  provideRouteAlternatives: boolean
}

interface AlternativeRoute {
  routeIndex: number
  summary: string
  distance: string
  duration: string
  warnings: string[]
}

interface AdvancedNavigationControlsProps {
  currentOptions: RouteOptions
  alternativeRoutes: AlternativeRoute[]
  isCalculating: boolean
  onOptionsChange: (options: RouteOptions) => void
  onRouteSelect: (routeIndex: number) => void
  onRecalculateRoute: () => void
  onEmergencyRecalculation: () => void
  className?: string
}

export function AdvancedNavigationControls({
  currentOptions,
  alternativeRoutes,
  isCalculating,
  onOptionsChange,
  onRouteSelect,
  onRecalculateRoute,
  onEmergencyRecalculation,
  className,
}: AdvancedNavigationControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showAlternatives, setShowAlternatives] = useState(false)

  // Manejar cambio de opciones
  const handleOptionChange = useCallback(
    (key: keyof RouteOptions, value: boolean | google.maps.TravelMode) => {
      const newOptions = { ...currentOptions, [key]: value }
      onOptionsChange(newOptions)
    },
    [currentOptions, onOptionsChange]
  )

  // Obtener icono de modo de transporte
  const getTravelModeIcon = (mode: google.maps.TravelMode) => {
    switch (mode) {
      case google.maps.TravelMode.DRIVING:
        return <Car className='w-4 h-4' />
      case google.maps.TravelMode.WALKING:
        return <MapPin className='w-4 h-4' />
      case google.maps.TravelMode.BICYCLING:
        return <Bike className='w-4 h-4' />
      case google.maps.TravelMode.TRANSIT:
        return <Truck className='w-4 h-4' />
      default:
        return <Car className='w-4 h-4' />
    }
  }

  // Componente Toggle personalizado
  const Toggle = ({
    enabled,
    onChange,
    label,
    description,
  }: {
    enabled: boolean
    onChange: (value: boolean) => void
    label: string
    description?: string
  }) => (
    <div className='flex items-center justify-between py-2'>
      <div className='flex-1'>
        <div className='text-sm font-medium text-gray-900'>{label}</div>
        {description && <div className='text-xs text-gray-500'>{description}</div>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          enabled ? 'bg-blue-600' : 'bg-gray-200'
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>
    </div>
  )

  return (
    <div className={cn('bg-white rounded-lg shadow-lg border border-gray-200', className)}>
      {/* Header */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200'>
        <div className='flex items-center space-x-2'>
          <Settings className='w-5 h-5 text-gray-600' />
          <span className='font-semibold text-gray-900'>Controles de Navegación</span>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className='p-1 rounded hover:bg-gray-100'
        >
          {isExpanded ? (
            <ChevronUp className='w-4 h-4 text-gray-600' />
          ) : (
            <ChevronDown className='w-4 h-4 text-gray-600' />
          )}
        </button>
      </div>

      {/* Controles rápidos (siempre visibles) */}
      <div className='p-4 space-y-3'>
        {/* Botones de acción rápida */}
        <div className='grid grid-cols-2 gap-2'>
          <button
            onClick={onRecalculateRoute}
            disabled={isCalculating}
            className={cn(
              'flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isCalculating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            <RefreshCw className={cn('w-4 h-4', isCalculating && 'animate-spin')} />
            <span>Recalcular</span>
          </button>

          <button
            onClick={onEmergencyRecalculation}
            className='flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors'
          >
            <AlertTriangle className='w-4 h-4' />
            <span>Emergencia</span>
          </button>
        </div>

        {/* Modo de transporte */}
        <div>
          <div className='text-sm font-medium text-gray-900 mb-2'>Modo de Transporte</div>
          <div className='grid grid-cols-2 gap-2'>
            {[
              { mode: google.maps.TravelMode.DRIVING, label: 'Conducir' },
              { mode: google.maps.TravelMode.WALKING, label: 'Caminar' },
            ].map(({ mode, label }) => (
              <button
                key={mode}
                onClick={() => handleOptionChange('travelMode', mode)}
                className={cn(
                  'flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  currentOptions.travelMode === mode
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {getTravelModeIcon(mode)}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controles expandidos */}
      {isExpanded && (
        <div className='border-t border-gray-200 p-4 space-y-4'>
          {/* Opciones de ruta */}
          <div>
            <div className='text-sm font-medium text-gray-900 mb-3'>Opciones de Ruta</div>
            <div className='space-y-1'>
              <Toggle
                enabled={currentOptions.avoidTolls}
                onChange={value => handleOptionChange('avoidTolls', value)}
                label='Evitar peajes'
                description='Buscar rutas sin peajes'
              />
              <Toggle
                enabled={currentOptions.avoidHighways}
                onChange={value => handleOptionChange('avoidHighways', value)}
                label='Evitar autopistas'
                description='Usar calles locales cuando sea posible'
              />
              <Toggle
                enabled={currentOptions.avoidFerries}
                onChange={value => handleOptionChange('avoidFerries', value)}
                label='Evitar ferries'
                description='Buscar rutas terrestres'
              />
              <Toggle
                enabled={currentOptions.optimizeWaypoints}
                onChange={value => handleOptionChange('optimizeWaypoints', value)}
                label='Optimizar puntos de paso'
                description='Reordenar paradas para eficiencia'
              />
            </div>
          </div>

          {/* Rutas alternativas */}
          <div>
            <div className='flex items-center justify-between mb-3'>
              <div className='text-sm font-medium text-gray-900'>Rutas Alternativas</div>
              <button
                onClick={() => {
                  handleOptionChange(
                    'provideRouteAlternatives',
                    !currentOptions.provideRouteAlternatives
                  )
                  setShowAlternatives(!showAlternatives)
                }}
                className={cn(
                  'px-3 py-1 rounded-lg text-xs font-medium transition-colors',
                  currentOptions.provideRouteAlternatives
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                {currentOptions.provideRouteAlternatives ? 'Activado' : 'Desactivado'}
              </button>
            </div>

            {showAlternatives && alternativeRoutes.length > 0 && (
              <div className='space-y-2'>
                {alternativeRoutes.map((route, index) => (
                  <div
                    key={index}
                    className='border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors'
                    onClick={() => onRouteSelect(route.routeIndex)}
                  >
                    <div className='flex items-center justify-between mb-2'>
                      <div className='text-sm font-medium text-gray-900'>
                        Ruta {route.routeIndex + 1}
                      </div>
                      <div className='text-xs text-gray-500'>{route.summary}</div>
                    </div>

                    <div className='flex items-center space-x-4 text-xs text-gray-600'>
                      <div className='flex items-center'>
                        <MapPin className='w-3 h-3 mr-1' />
                        <span>{route.distance}</span>
                      </div>
                      <div className='flex items-center'>
                        <Clock className='w-3 h-3 mr-1' />
                        <span>{route.duration}</span>
                      </div>
                    </div>

                    {route.warnings.length > 0 && (
                      <div className='mt-2 flex items-start space-x-1'>
                        <AlertTriangle className='w-3 h-3 text-yellow-500 mt-0.5' />
                        <div className='text-xs text-yellow-700'>{route.warnings.join(', ')}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showAlternatives && alternativeRoutes.length === 0 && (
              <div className='text-center py-4 text-sm text-gray-500'>
                No hay rutas alternativas disponibles
              </div>
            )}
          </div>

          {/* Información adicional */}
          <div className='pt-3 border-t border-gray-200'>
            <div className='text-xs text-gray-500 text-center'>
              Los cambios se aplicarán en el próximo cálculo de ruta
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
