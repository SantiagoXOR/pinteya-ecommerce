/**
 * Componente de instrucciones de navegación turn-by-turn
 * Muestra direcciones paso a paso de forma clara y legible
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Navigation,
  MapPin,
  Clock,
} from '@/lib/optimized-imports'
import { cn } from '@/lib/core/utils'

interface NavigationStep {
  instruction: string
  distance: string
  duration: string
  maneuver: string
  coordinates: { lat: number; lng: number }
}

interface NavigationInstructionsProps {
  instructions: NavigationStep[]
  currentLocation: { lat: number; lng: number } | null
}

export function NavigationInstructions({
  instructions,
  currentLocation,
}: NavigationInstructionsProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [nextStepIndex, setNextStepIndex] = useState(1)

  const currentStep = instructions[currentStepIndex]
  const nextStep = instructions[nextStepIndex]

  // Calcular distancia entre dos puntos
  const calculateDistance = (
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ) => {
    const R = 6371 // Radio de la Tierra en km
    const dLat = ((point2.lat - point1.lat) * Math.PI) / 180
    const dLon = ((point2.lng - point1.lng) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((point1.lat * Math.PI) / 180) *
        Math.cos((point2.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c * 1000 // Convertir a metros
  }

  // Actualizar paso actual basado en la ubicación
  useEffect(() => {
    if (!currentLocation || !instructions.length) return

    // Encontrar el paso más cercano a la ubicación actual
    let closestStepIndex = 0
    let minDistance = Infinity

    instructions.forEach((step, index) => {
      const distance = calculateDistance(currentLocation, step.coordinates)
      if (distance < minDistance) {
        minDistance = distance
        closestStepIndex = index
      }
    })

    // Solo actualizar si estamos cerca del siguiente paso (menos de 50 metros)
    if (minDistance < 50 && closestStepIndex !== currentStepIndex) {
      setCurrentStepIndex(closestStepIndex)
      setNextStepIndex(Math.min(closestStepIndex + 1, instructions.length - 1))
    }
  }, [currentLocation, instructions])

  const getManeuverIcon = (maneuver: string) => {
    const iconClass = 'h-8 w-8 text-white'

    switch (maneuver.toLowerCase()) {
      case 'turn-left':
      case 'turn-slight-left':
        return <ArrowLeft className={iconClass} />
      case 'turn-right':
      case 'turn-slight-right':
        return <ArrowRight className={iconClass} />
      case 'straight':
      case 'continue':
        return <ArrowUp className={iconClass} />
      case 'u-turn':
        return <RotateCcw className={iconClass} />
      case 'roundabout':
        return <RotateCcw className={iconClass} />
      default:
        return <Navigation className={iconClass} />
    }
  }

  const getManeuverColor = (maneuver: string) => {
    switch (maneuver.toLowerCase()) {
      case 'turn-left':
      case 'turn-slight-left':
        return 'bg-blue-600'
      case 'turn-right':
      case 'turn-slight-right':
        return 'bg-green-600'
      case 'straight':
      case 'continue':
        return 'bg-gray-600'
      case 'u-turn':
        return 'bg-red-600'
      case 'roundabout':
        return 'bg-purple-600'
      default:
        return 'bg-blue-600'
    }
  }

  if (!currentStep) {
    return null
  }

  return (
    <div className='space-y-2'>
      {/* Instrucción principal */}
      <Card className='bg-white shadow-lg'>
        <CardContent className='p-4'>
          <div className='flex items-center space-x-4'>
            <div
              className={cn(
                'rounded-full p-3 flex-shrink-0',
                getManeuverColor(currentStep.maneuver)
              )}
            >
              {getManeuverIcon(currentStep.maneuver)}
            </div>

            <div className='flex-1 min-w-0'>
              <p className='text-lg font-semibold text-gray-900 leading-tight'>
                {currentStep.instruction}
              </p>
              <div className='flex items-center space-x-4 mt-2 text-sm text-gray-600'>
                <div className='flex items-center space-x-1'>
                  <MapPin className='h-4 w-4' />
                  <span>{currentStep.distance}</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <Clock className='h-4 w-4' />
                  <span>{currentStep.duration}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Próxima instrucción */}
      {nextStep && nextStepIndex < instructions.length && (
        <Card className='bg-gray-50 border-gray-200'>
          <CardContent className='p-3'>
            <div className='flex items-center space-x-3'>
              <div
                className={cn(
                  'rounded-full p-2 flex-shrink-0',
                  getManeuverColor(nextStep.maneuver),
                  'opacity-70'
                )}
              >
                {getManeuverIcon(nextStep.maneuver)}
              </div>

              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-gray-700 leading-tight'>
                  Luego: {nextStep.instruction}
                </p>
                <p className='text-xs text-gray-500 mt-1'>{nextStep.distance}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progreso de la ruta */}
      <Card className='bg-blue-50 border-blue-200'>
        <CardContent className='p-3'>
          <div className='flex items-center justify-between text-sm'>
            <span className='text-blue-800 font-medium'>
              Paso {currentStepIndex + 1} de {instructions.length}
            </span>
            <div className='flex-1 mx-3'>
              <div className='bg-blue-200 rounded-full h-2'>
                <div
                  className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                  style={{
                    width: `${((currentStepIndex + 1) / instructions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
            <span className='text-blue-600 text-xs'>
              {Math.round(((currentStepIndex + 1) / instructions.length) * 100)}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
