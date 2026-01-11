/**
 * Contexto compartido para performanceLevel
 * 
 * Evita múltiples llamadas a useDevicePerformance en diferentes componentes.
 * Se inicializa una sola vez y se comparte entre todos los consumidores.
 */

'use client'

import React, { createContext, useContext, useMemo, ReactNode } from 'react'
import { useDevicePerformance, type PerformanceLevel } from '@/hooks/useDevicePerformance'

interface PerformanceContextType {
  performanceLevel: PerformanceLevel
  isLowPerformance: boolean
  isMediumPerformance: boolean
  isHighPerformance: boolean
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined)

export const usePerformance = () => {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider')
  }
  return context
}

interface PerformanceProviderProps {
  children: ReactNode
}

/**
 * Provider que comparte performanceLevel entre componentes
 * 
 * Inicializa useDevicePerformance una sola vez y comparte el valor.
 * Esto evita múltiples llamadas al hook en diferentes componentes.
 */
export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  const performanceLevel = useDevicePerformance()

  // Memoizar valores derivados para evitar recálculos
  const value = useMemo<PerformanceContextType>(
    () => ({
      performanceLevel,
      isLowPerformance: performanceLevel === 'low',
      isMediumPerformance: performanceLevel === 'medium',
      isHighPerformance: performanceLevel === 'high',
    }),
    [performanceLevel]
  )

  return <PerformanceContext.Provider value={value}>{children}</PerformanceContext.Provider>
}
