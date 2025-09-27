// ===================================
// HOOK: useResponsiveOptimized - Hook optimizado para responsive design
// ===================================

import { useState, useEffect, useCallback, useMemo } from 'react'

// Breakpoints estándar de Tailwind CSS
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

type Breakpoint = keyof typeof BREAKPOINTS

interface ResponsiveState {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isLargeDesktop: boolean
  currentBreakpoint: Breakpoint | 'xs'
}

/**
 * Hook optimizado para manejo de responsive design
 *
 * Características:
 * - Debounce automático para evitar re-renders excesivos
 * - Memoización de valores calculados
 * - Detección precisa de breakpoints
 * - Optimizado para performance
 */
export const useResponsiveOptimized = (debounceMs: number = 150) => {
  const [windowSize, setWindowSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  })

  // Handler optimizado con debounce
  const handleResize = useCallback(() => {
    let timeoutId: NodeJS.Timeout

    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight,
        })
      }, debounceMs)
    }

    return debouncedResize
  }, [debounceMs])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const resizeHandler = handleResize()

    window.addEventListener('resize', resizeHandler)

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }, [handleResize])

  // Valores memoizados para evitar recálculos innecesarios
  const responsiveState = useMemo((): ResponsiveState => {
    const { width, height } = windowSize

    // Determinar breakpoint actual
    let currentBreakpoint: Breakpoint | 'xs' = 'xs'
    if (width >= BREAKPOINTS['2xl']) {
      currentBreakpoint = '2xl'
    } else if (width >= BREAKPOINTS.xl) {
      currentBreakpoint = 'xl'
    } else if (width >= BREAKPOINTS.lg) {
      currentBreakpoint = 'lg'
    } else if (width >= BREAKPOINTS.md) {
      currentBreakpoint = 'md'
    } else if (width >= BREAKPOINTS.sm) {
      currentBreakpoint = 'sm'
    }

    return {
      width,
      height,
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg && width < BREAKPOINTS.xl,
      isLargeDesktop: width >= BREAKPOINTS.xl,
      currentBreakpoint,
    }
  }, [windowSize])

  // Helpers memoizados para queries específicas
  const queries = useMemo(
    () => ({
      isAbove: (breakpoint: Breakpoint) => windowSize.width >= BREAKPOINTS[breakpoint],
      isBelow: (breakpoint: Breakpoint) => windowSize.width < BREAKPOINTS[breakpoint],
      isBetween: (min: Breakpoint, max: Breakpoint) =>
        windowSize.width >= BREAKPOINTS[min] && windowSize.width < BREAKPOINTS[max],
      isExactly: (breakpoint: Breakpoint | 'xs') =>
        responsiveState.currentBreakpoint === breakpoint,
    }),
    [windowSize.width, responsiveState.currentBreakpoint]
  )

  return {
    ...responsiveState,
    queries,
    // Valores raw para casos específicos
    raw: windowSize,
  }
}

/**
 * Hook simplificado para casos comunes
 */
export const useIsMobile = () => {
  const { isMobile } = useResponsiveOptimized()
  return isMobile
}

/**
 * Hook para detectar orientación en dispositivos móviles
 */
export const useOrientation = () => {
  const { width, height, isMobile } = useResponsiveOptimized()

  return useMemo(
    () => ({
      isPortrait: height > width,
      isLandscape: width > height,
      isSquare: width === height,
      // Solo relevante en móviles
      isMobilePortrait: isMobile && height > width,
      isMobileLandscape: isMobile && width > height,
    }),
    [width, height, isMobile]
  )
}

/**
 * Hook para clases CSS responsivas dinámicas
 */
export const useResponsiveClasses = () => {
  const { currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsiveOptimized()

  return useMemo(
    () => ({
      // Clases base
      base: `responsive-${currentBreakpoint}`,
      device: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',

      // Helpers para componentes
      container: isMobile ? 'px-4' : isTablet ? 'px-6' : 'px-8',
      text: isMobile ? 'text-sm' : isTablet ? 'text-base' : 'text-lg',
      spacing: isMobile ? 'space-y-4' : isTablet ? 'space-y-6' : 'space-y-8',

      // Grid responsivo
      grid: {
        cols1: 'grid-cols-1',
        cols2: isMobile ? 'grid-cols-1' : 'grid-cols-2',
        cols3: isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3',
        cols4: isMobile ? 'grid-cols-2' : isTablet ? 'grid-cols-3' : 'grid-cols-4',
      },
    }),
    [currentBreakpoint, isMobile, isTablet, isDesktop]
  )
}

export default useResponsiveOptimized
