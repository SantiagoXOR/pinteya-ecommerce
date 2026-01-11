/**
 * Contexto compartido para breakpoints (isMobile/isDesktop)
 * 
 * Evita múltiples detecciones de breakpoints en diferentes componentes.
 * Usa useStableBreakpoint para detección estable sin re-renders post-hidratación.
 */

'use client'

import React, { createContext, useContext, useMemo, ReactNode } from 'react'
import { useStableBreakpoint } from '@/hooks/useStableBreakpoint'

interface BreakpointContextType {
  isMobile: boolean
  isDesktop: boolean
  width: number
}

const BreakpointContext = createContext<BreakpointContextType | undefined>(undefined)

export const useBreakpoint = () => {
  const context = useContext(BreakpointContext)
  if (!context) {
    throw new Error('useBreakpoint must be used within a BreakpointProvider')
  }
  return context
}

interface BreakpointProviderProps {
  children: ReactNode
}

/**
 * Provider que comparte breakpoints entre componentes
 * 
 * Usa useStableBreakpoint que detecta breakpoints de forma estable
 * sin causar re-renders post-hidratación.
 */
export const BreakpointProvider: React.FC<BreakpointProviderProps> = ({ children }) => {
  const { isMobile, isDesktop, width } = useStableBreakpoint()

  // Memoizar valor del contexto
  const value = useMemo<BreakpointContextType>(
    () => ({
      isMobile,
      isDesktop,
      width,
    }),
    [isMobile, isDesktop, width]
  )

  return <BreakpointContext.Provider value={value}>{children}</BreakpointContext.Provider>
}
