/**
 * Componente de navegación turn-by-turn con instrucciones paso a paso
 * Incluye síntesis de voz, iconos visuales y seguimiento de progreso
 */

'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Navigation,
  Volume2,
  VolumeX,
  MapPin,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/core/utils'

interface NavigationStep {
  instruction: string
  distance: string
  duration: string
  maneuver: string
  htmlInstructions: string
}

interface TurnByTurnNavigationProps {
  directions: google.maps.DirectionsResult | null
  currentLocation: { lat: number; lng: number } | null
  isNavigating: boolean
  onStepComplete?: (stepIndex: number) => void
  className?: string
}

export function TurnByTurnNavigation({
  directions,
  currentLocation,
  isNavigating,
  onStepComplete,
  className,
}: TurnByTurnNavigationProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [navigationSteps, setNavigationSteps] = useState<NavigationStep[]>([])
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [lastSpokenStep, setLastSpokenStep] = useState(-1)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)

  // Inicializar síntesis de voz
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis
    }
  }, [])

  // Procesar direcciones y extraer pasos
  useEffect(() => {
    if (directions && directions.routes[0]) {
      const route = directions.routes[0]
      const leg = route.legs[0]

      const steps: NavigationStep[] = leg.steps.map((step, index) => ({
        instruction: step.instructions.replace(/<[^>]*>/g, ''), // Remover HTML
        distance: step.distance?.text || '',
        duration: step.duration?.text || '',
        maneuver: step.maneuver || 'straight',
        htmlInstructions: step.instructions,
      }))

      setNavigationSteps(steps)
      setCurrentStepIndex(0)
      setLastSpokenStep(-1)
    }
  }, [directions])

  // Función para obtener icono de maniobra
  const getManeuverIcon = (maneuver: string) => {
    const iconClass = 'w-8 h-8'

    switch (maneuver) {
      case 'turn-left':
      case 'turn-slight-left':
      case 'turn-sharp-left':
        return <ArrowLeft className={cn(iconClass, 'text-blue-600')} />
      case 'turn-right':
      case 'turn-slight-right':
      case 'turn-sharp-right':
        return <ArrowRight className={cn(iconClass, 'text-blue-600')} />
      case 'straight':
      case 'continue':
        return <ArrowUp className={cn(iconClass, 'text-green-600')} />
      case 'uturn-left':
      case 'uturn-right':
        return <RotateCcw className={cn(iconClass, 'text-red-600')} />
      case 'roundabout-left':
      case 'roundabout-right':
        return <Navigation className={cn(iconClass, 'text-purple-600')} />
      default:
        return <ArrowUp className={cn(iconClass, 'text-gray-600')} />
    }
  }

  // Función para leer instrucción en voz alta
  const speakInstruction = useCallback(
    (instruction: string) => {
      if (!isVoiceEnabled || !speechSynthesisRef.current) return

      // Cancelar cualquier síntesis anterior
      speechSynthesisRef.current.cancel()

      const utterance = new SpeechSynthesisUtterance(instruction)
      utterance.lang = 'es-ES'
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 0.8

      speechSynthesisRef.current.speak(utterance)
    },
    [isVoiceEnabled]
  )

  // Detectar cuando el usuario se acerca al siguiente paso
  useEffect(() => {
    if (!currentLocation || !navigationSteps.length || !isNavigating) return

    const currentStep = navigationSteps[currentStepIndex]
    if (!currentStep) return

    // Leer instrucción si es un nuevo paso
    if (currentStepIndex !== lastSpokenStep && isVoiceEnabled) {
      speakInstruction(currentStep.instruction)
      setLastSpokenStep(currentStepIndex)
    }

    // Aquí podrías agregar lógica para detectar proximidad al siguiente paso
    // y avanzar automáticamente el índice
  }, [
    currentLocation,
    currentStepIndex,
    navigationSteps,
    isNavigating,
    lastSpokenStep,
    isVoiceEnabled,
    speakInstruction,
  ])

  // Función para avanzar manualmente al siguiente paso
  const nextStep = () => {
    if (currentStepIndex < navigationSteps.length - 1) {
      const newIndex = currentStepIndex + 1
      setCurrentStepIndex(newIndex)
      onStepComplete?.(currentStepIndex)
    }
  }

  // Función para retroceder al paso anterior
  const previousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
    }
  }

  if (!isNavigating || !navigationSteps.length) {
    return null
  }

  const currentStep = navigationSteps[currentStepIndex]
  const nextStepPreview = navigationSteps[currentStepIndex + 1]

  return (
    <div className={cn('bg-white rounded-lg shadow-lg border border-gray-200', className)}>
      {/* Header con controles */}
      <div className='flex items-center justify-between p-4 border-b border-gray-200'>
        <div className='flex items-center space-x-2'>
          <Navigation className='w-5 h-5 text-blue-600' />
          <span className='font-semibold text-gray-900'>Navegación</span>
          <span className='text-sm text-gray-500'>
            {currentStepIndex + 1} de {navigationSteps.length}
          </span>
        </div>

        <button
          onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
          className={cn(
            'p-2 rounded-lg transition-colors',
            isVoiceEnabled
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
          )}
        >
          {isVoiceEnabled ? <Volume2 className='w-4 h-4' /> : <VolumeX className='w-4 h-4' />}
        </button>
      </div>

      {/* Instrucción actual */}
      <div className='p-4'>
        <div className='flex items-start space-x-4'>
          <div className='flex-shrink-0'>{getManeuverIcon(currentStep.maneuver)}</div>

          <div className='flex-1'>
            <div className='text-lg font-semibold text-gray-900 mb-2'>
              {currentStep.instruction}
            </div>

            <div className='flex items-center space-x-4 text-sm text-gray-600'>
              <div className='flex items-center'>
                <MapPin className='w-4 h-4 mr-1' />
                <span>{currentStep.distance}</span>
              </div>
              <div className='flex items-center'>
                <Clock className='w-4 h-4 mr-1' />
                <span>{currentStep.duration}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Vista previa del siguiente paso */}
        {nextStepPreview && (
          <div className='mt-4 pt-4 border-t border-gray-100'>
            <div className='text-sm text-gray-500 mb-2'>Siguiente:</div>
            <div className='flex items-center space-x-3'>
              <div className='flex-shrink-0'>{getManeuverIcon(nextStepPreview.maneuver)}</div>
              <div className='text-sm text-gray-700'>{nextStepPreview.instruction}</div>
            </div>
          </div>
        )}

        {/* Controles de navegación */}
        <div className='mt-4 flex justify-between'>
          <button
            onClick={previousStep}
            disabled={currentStepIndex === 0}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              currentStepIndex === 0
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            Anterior
          </button>

          <button
            onClick={nextStep}
            disabled={currentStepIndex === navigationSteps.length - 1}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              currentStepIndex === navigationSteps.length - 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            )}
          >
            Siguiente
          </button>
        </div>

        {/* Barra de progreso */}
        <div className='mt-4'>
          <div className='flex justify-between text-xs text-gray-500 mb-1'>
            <span>Progreso</span>
            <span>{Math.round(((currentStepIndex + 1) / navigationSteps.length) * 100)}%</span>
          </div>
          <div className='w-full bg-gray-200 rounded-full h-2'>
            <div
              className='bg-blue-600 h-2 rounded-full transition-all duration-300'
              style={{
                width: `${((currentStepIndex + 1) / navigationSteps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
