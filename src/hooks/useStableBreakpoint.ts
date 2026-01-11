/**
 * Hook estable para detectar breakpoints sin causar re-renders post-hidratación
 * 
 * Estrategia:
 * 1. Usa useLayoutEffect para detectar antes del primer paint
 * 2. Inicializa con valores predeterminados estables (desktop por defecto)
 * 3. Usa media queries CSS para detección confiable
 * 4. Solo actualiza una vez después de mount, evitando cambios constantes
 */

'use client'

import { useState, useLayoutEffect, useRef } from 'react'

const MOBILE_BREAKPOINT = 768
const DESKTOP_BREAKPOINT = 1000

export interface BreakpointState {
  isMobile: boolean
  isDesktop: boolean
  width: number
}

/**
 * Hook estable para detectar breakpoints
 * 
 * Retorna valores estables que solo se actualizan una vez después del mount.
 * Evita re-renders post-hidratación al usar useLayoutEffect para detectar
 * antes del primer paint del navegador.
 */
export function useStableBreakpoint(): BreakpointState {
  // Inicializar con valores predeterminados (desktop por defecto para SSR)
  // Esto asegura que SSR y cliente inicial coincidan
  const [state, setState] = useState<BreakpointState>({
    isMobile: false,
    isDesktop: true,
    width: 1024, // Valor predeterminado para SSR
  })
  
  // Ref para trackear si ya se detectó (evitar múltiples actualizaciones)
  const hasDetectedRef = useRef(false)

  useLayoutEffect(() => {
    // Solo detectar una vez después del mount
    if (hasDetectedRef.current) return
    
    // Detectar inmediatamente usando window.innerWidth
    const width = window.innerWidth
    const isMobile = width <= MOBILE_BREAKPOINT
    const isDesktop = width >= DESKTOP_BREAKPOINT

    // Actualizar estado una sola vez
    setState({
      isMobile,
      isDesktop,
      width,
    })
    
    hasDetectedRef.current = true

    // Configurar media queries para cambios futuros (solo para resize)
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`)
    const desktopQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

    const handleMobileChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, isMobile: e.matches }))
    }

    const handleDesktopChange = (e: MediaQueryListEvent) => {
      setState(prev => ({ ...prev, isDesktop: e.matches }))
    }

    // Agregar listeners solo para cambios futuros (resize)
    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener('change', handleMobileChange)
    } else {
      mobileQuery.addListener(handleMobileChange)
    }

    if (desktopQuery.addEventListener) {
      desktopQuery.addEventListener('change', handleDesktopChange)
    } else {
      desktopQuery.addListener(handleDesktopChange)
    }

    // Cleanup
    return () => {
      if (mobileQuery.removeEventListener) {
        mobileQuery.removeEventListener('change', handleMobileChange)
      } else {
        mobileQuery.removeListener(handleMobileChange)
      }

      if (desktopQuery.removeEventListener) {
        desktopQuery.removeEventListener('change', handleDesktopChange)
      } else {
        desktopQuery.removeListener(handleDesktopChange)
      }
    }
  }, []) // Empty deps - solo ejecutar una vez

  return state
}

/**
 * Hook simplificado que solo retorna isMobile
 */
export function useStableIsMobile(): boolean {
  const { isMobile } = useStableBreakpoint()
  return isMobile
}

/**
 * Hook simplificado que solo retorna isDesktop
 */
export function useStableIsDesktop(): boolean {
  const { isDesktop } = useStableBreakpoint()
  return isDesktop
}
