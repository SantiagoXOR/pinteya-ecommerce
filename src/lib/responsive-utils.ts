/**
 * Utilidades responsivas para detectar tamaños de pantalla y escalas de UI del sistema
 * Optimizado para mobile-first y diferentes escalas de UI
 */

import React from 'react'

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type UIScale = 'small' | 'normal' | 'large'

/**
 * Breakpoints para diferentes tamaños de móviles
 */
export const BREAKPOINTS = {
  xs: 320, // Móviles pequeños
  sm: 375, // Móviles medianos
  md: 414, // Móviles grandes
  lg: 768, // Tablets
  xl: 1024, // Desktop
} as const

/**
 * Detecta el tamaño de pantalla actual
 */
export function getScreenSize(): ScreenSize {
  if (typeof window === 'undefined') return 'md'
  
  const width = window.innerWidth
  
  if (width < BREAKPOINTS.sm) return 'xs'
  if (width < BREAKPOINTS.md) return 'sm'
  if (width < BREAKPOINTS.lg) return 'md'
  if (width < BREAKPOINTS.xl) return 'lg'
  return 'xl'
}

/**
 * Hook para detectar el tamaño de pantalla actual
 */
export function useScreenSize(): ScreenSize {
  const [screenSize, setScreenSize] = React.useState<ScreenSize>(() => getScreenSize())
  
  React.useEffect(() => {
    const handleResize = () => {
      setScreenSize(getScreenSize())
    }
    
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  return screenSize
}

/**
 * Detecta la escala de UI del sistema basada en preferencias del usuario
 */
export function getUIScale(): UIScale {
  if (typeof window === 'undefined') return 'normal'
  
  // Detectar preferencia de contraste alto
  const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches
  
  // Detectar tamaño de fuente del sistema (aproximado)
  // En navegadores modernos, podemos usar getComputedStyle
  try {
    const rootFontSize = parseFloat(
      getComputedStyle(document.documentElement).fontSize
    )
    
    // Si el tamaño de fuente base es mayor a 18px, probablemente es "large"
    if (rootFontSize > 18) return 'large'
    
    // Si es menor a 14px, probablemente es "small"
    if (rootFontSize < 14) return 'small'
  } catch (e) {
    // Fallback si no se puede detectar
  }
  
  // Si hay alto contraste, asumir escala normal pero con más contraste
  if (prefersHighContrast) return 'normal'
  
  return 'normal'
}

/**
 * Hook para detectar la escala de UI del sistema
 */
export function useUIScale(): UIScale {
  const [uiScale, setUIScale] = React.useState<UIScale>(() => getUIScale())
  
  React.useEffect(() => {
    const mediaQueries = [
      window.matchMedia('(prefers-contrast: high)'),
    ]
    
    const handleChange = () => {
      setUIScale(getUIScale())
    }
    
    mediaQueries.forEach(mq => {
      mq.addEventListener('change', handleChange)
    })
    
    return () => {
      mediaQueries.forEach(mq => {
        mq.removeEventListener('change', handleChange)
      })
    }
  }, [])
  
  return uiScale
}

/**
 * Obtiene el padding del card según el tamaño de pantalla
 */
export function getCardPadding(screenSize: ScreenSize): string {
  const paddingMap: Record<ScreenSize, string> = {
    xs: 'clamp(0.5rem, 2vw, 0.75rem)',
    sm: 'clamp(0.75rem, 2.5vw, 1rem)',
    md: 'clamp(0.75rem, 2.5vw, 1rem)',
    lg: 'clamp(1rem, 3vw, 1.5rem)',
    xl: 'clamp(1.25rem, 4vw, 1.75rem)',
  }
  
  return paddingMap[screenSize]
}

/**
 * Obtiene el blur glass según el tamaño de pantalla
 */
export function getGlassBlur(screenSize: ScreenSize): string {
  const blurMap: Record<ScreenSize, string> = {
    xs: '8px',
    sm: '10px',
    md: '10px',
    lg: '12px',
    xl: '16px',
  }
  
  return blurMap[screenSize]
}

/**
 * Obtiene el tamaño de fuente para pills según escala de UI
 */
export function getPillFontSize(uiScale: UIScale, screenSize: ScreenSize): string {
  const baseSize: Record<ScreenSize, number> = {
    xs: 8,
    sm: 9,
    md: 9,
    lg: 10,
    xl: 11,
  }
  
  const scaleMultiplier: Record<UIScale, number> = {
    small: 0.9,
    normal: 1,
    large: 1.15,
  }
  
  const size = baseSize[screenSize] * scaleMultiplier[uiScale]
  
  return `clamp(${size * 0.8}px, ${size * 0.8}px + 0.5vw, ${size}px)`
}

/**
 * Verifica si el dispositivo prefiere movimiento reducido
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Hook para detectar si se prefiere movimiento reducido
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = React.useState(() => 
    prefersReducedMotion()
  )
  
  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReduced(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])
  
  return prefersReduced
}

