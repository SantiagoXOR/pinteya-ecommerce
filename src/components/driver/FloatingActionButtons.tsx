'use client'

import React, { useState } from 'react'
import { Navigation, Settings, AlertTriangle, MapPin, Plus, X, RefreshCw, Info } from 'lucide-react'
import { cn } from '@/lib/core/utils'
import { useModalActions } from '@/contexts/ModalContext'

interface FloatingActionButtonsProps {
  isNavigating: boolean
  hasActiveRoute: boolean
  onRecalculateRoute?: () => void
  onEmergencyStop?: () => void
  className?: string
}

export function FloatingActionButtons({
  isNavigating,
  hasActiveRoute,
  onRecalculateRoute,
  onEmergencyStop,
  className,
}: FloatingActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const modalActions = useModalActions()

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const handleActionClick = (action: () => void) => {
    action()
    setIsExpanded(false)
  }

  // Botones principales que siempre están visibles
  const primaryActions = [
    {
      icon: Navigation,
      label: 'Navegación',
      action: () => modalActions.openNavigationInstructions(),
      show: isNavigating,
      color: 'bg-blue-600 hover:bg-blue-700',
      priority: 1,
    },
    {
      icon: MapPin,
      label: 'Info Ruta',
      action: () => modalActions.openRouteInfo(),
      show: hasActiveRoute,
      color: 'bg-green-600 hover:bg-green-700',
      priority: 2,
    },
  ]

  // Botones secundarios que aparecen cuando se expande
  const secondaryActions = [
    {
      icon: Settings,
      label: 'Controles',
      action: () => modalActions.openAdvancedControls(),
      show: true,
      color: 'bg-gray-600 hover:bg-gray-700',
    },
    {
      icon: MapPin,
      label: 'Tracking',
      action: () => modalActions.openRealTimeTracker(),
      show: isNavigating,
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      icon: Info,
      label: 'Debug GPS',
      action: () => modalActions.openGPSDebug(),
      show: true,
      color: 'bg-orange-600 hover:bg-orange-700',
    },
    {
      icon: RefreshCw,
      label: 'Recalcular',
      action: () => {
        onRecalculateRoute?.()
      },
      show: hasActiveRoute,
      color: 'bg-yellow-600 hover:bg-yellow-700',
    },
    {
      icon: AlertTriangle,
      label: 'Emergencia',
      action: () => {
        modalActions.openEmergencyOptions()
        onEmergencyStop?.()
      },
      show: true,
      color: 'bg-red-600 hover:bg-red-700',
    },
  ]

  const visiblePrimaryActions = primaryActions.filter(action => action.show)
  const visibleSecondaryActions = secondaryActions.filter(action => action.show)

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-40',
        'flex flex-col-reverse items-end space-y-reverse space-y-3',
        className
      )}
    >
      {/* Botones secundarios (aparecen cuando se expande) */}
      {isExpanded &&
        visibleSecondaryActions.map((action, index) => (
          <div
            key={action.label}
            className={cn(
              'transform transition-all duration-300 ease-out',
              isExpanded
                ? 'translate-y-0 opacity-100 scale-100'
                : 'translate-y-4 opacity-0 scale-95'
            )}
            style={{
              transitionDelay: `${index * 50}ms`,
            }}
          >
            <button
              onClick={() => handleActionClick(action.action)}
              className={cn(
                'w-12 h-12 rounded-full shadow-lg',
                'flex items-center justify-center',
                'text-white font-medium',
                'transform transition-all duration-200',
                'hover:scale-110 active:scale-95',
                'focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50',
                action.color
              )}
              aria-label={action.label}
            >
              <action.icon className='w-5 h-5' />
            </button>

            {/* Tooltip */}
            <div
              className={cn(
                'absolute right-14 top-1/2 transform -translate-y-1/2',
                'bg-gray-900 text-white text-xs rounded-lg px-2 py-1',
                'opacity-0 pointer-events-none transition-opacity duration-200',
                'whitespace-nowrap',
                'group-hover:opacity-100'
              )}
            >
              {action.label}
            </div>
          </div>
        ))}

      {/* Botones primarios (siempre visibles cuando corresponde) */}
      {visiblePrimaryActions.map((action, index) => (
        <button
          key={action.label}
          onClick={() => handleActionClick(action.action)}
          className={cn(
            'w-14 h-14 rounded-full shadow-lg',
            'flex items-center justify-center',
            'text-white font-medium',
            'transform transition-all duration-200',
            'hover:scale-110 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50',
            action.color,
            // Espaciado especial para botones primarios
            index > 0 && 'mt-3'
          )}
          aria-label={action.label}
        >
          <action.icon className='w-6 h-6' />
        </button>
      ))}

      {/* Botón principal de expansión */}
      <button
        onClick={toggleExpanded}
        className={cn(
          'w-16 h-16 rounded-full shadow-xl',
          'flex items-center justify-center',
          'text-white font-medium',
          'transform transition-all duration-300',
          'hover:scale-110 active:scale-95',
          'focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50',
          isExpanded ? 'bg-gray-600 hover:bg-gray-700 rotate-45' : 'bg-blue-600 hover:bg-blue-700',
          // Margen superior si hay botones primarios
          visiblePrimaryActions.length > 0 && 'mt-3'
        )}
        aria-label={isExpanded ? 'Cerrar menú' : 'Abrir menú'}
      >
        {isExpanded ? <X className='w-7 h-7' /> : <Plus className='w-7 h-7' />}
      </button>

      {/* Overlay para cerrar cuando está expandido */}
      {isExpanded && <div className='fixed inset-0 z-[-1]' onClick={() => setIsExpanded(false)} />}
    </div>
  )
}

// Componente simplificado para mobile
export function MobileFloatingActions({
  isNavigating,
  hasActiveRoute,
  onRecalculateRoute,
  onEmergencyStop,
  className,
}: FloatingActionButtonsProps) {
  const modalActions = useModalActions()

  // En mobile, solo mostramos los botones más importantes
  const mobileActions = [
    {
      icon: Navigation,
      label: 'Navegación',
      action: () => modalActions.openNavigationInstructions(),
      show: isNavigating,
      color: 'bg-blue-600',
    },
    {
      icon: MapPin,
      label: 'Ruta',
      action: () => modalActions.openRouteInfo(),
      show: hasActiveRoute,
      color: 'bg-green-600',
    },
    {
      icon: Settings,
      label: 'Más',
      action: () => modalActions.openAdvancedControls(),
      show: true,
      color: 'bg-gray-600',
    },
  ]

  const visibleActions = mobileActions.filter(action => action.show)

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 z-40',
        'flex justify-center space-x-4',
        'md:hidden', // Solo visible en mobile
        className
      )}
    >
      {visibleActions.map(action => (
        <button
          key={action.label}
          onClick={action.action}
          className={cn(
            'flex-1 max-w-[100px] h-12 rounded-full shadow-lg',
            'flex items-center justify-center',
            'text-white font-medium text-sm',
            'transform transition-all duration-200',
            'hover:scale-105 active:scale-95',
            'focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50',
            action.color
          )}
          aria-label={action.label}
        >
          <action.icon className='w-5 h-5 mr-1' />
          <span className='hidden sm:inline'>{action.label}</span>
        </button>
      ))}
    </div>
  )
}
