// ===================================
// UTILIDADES PARA RESPONSIVE DESIGN
// ===================================

import { useResponsiveOptimized } from '@/hooks/useResponsiveOptimized'

// ===================================
// CONSTANTES DE BREAKPOINTS
// ===================================

export const BREAKPOINTS = {
  xsm: 375,
  lsm: 425,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 2000,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

// ===================================
// UTILIDADES DE CLASES CSS
// ===================================

/**
 * Genera clases de grid responsive basadas en el número de columnas deseado
 */
export const generateResponsiveGrid = ({
  mobile = 1,
  xsm = 2,
  sm = 2,
  md = 3,
  lg = 4,
  xl = 5,
  '2xl': xxl = 6,
  '3xl': xxxl = 6,
  gap = 'gap-4 xsm:gap-6 lg:gap-8',
}: Partial<Record<BreakpointKey | 'mobile', number>> & { gap?: string } = {}) => {
  const classes = [
    `grid-cols-${mobile}`,
    xsm && `xsm:grid-cols-${xsm}`,
    sm && `sm:grid-cols-${sm}`,
    md && `md:grid-cols-${md}`,
    lg && `lg:grid-cols-${lg}`,
    xl && `xl:grid-cols-${xl}`,
    xxl && `2xl:grid-cols-${xxl}`,
    xxxl && `3xl:grid-cols-${xxxl}`,
  ].filter(Boolean)

  return `grid ${classes.join(' ')} ${gap}`
}

/**
 * Genera clases de padding responsive
 */
export const generateResponsivePadding = ({
  mobile = 4,
  sm = 6,
  lg = 8,
  direction = 'all',
}: {
  mobile?: number
  sm?: number
  lg?: number
  direction?: 'all' | 'x' | 'y' | 't' | 'b' | 'l' | 'r'
} = {}) => {
  const prefix = direction === 'all' ? 'p' : `p${direction}`
  return `${prefix}-${mobile} sm:${prefix}-${sm} lg:${prefix}-${lg}`
}

/**
 * Genera clases de margin responsive
 */
export const generateResponsiveMargin = ({
  mobile = 4,
  sm = 6,
  lg = 8,
  direction = 'all',
}: {
  mobile?: number
  sm?: number
  lg?: number
  direction?: 'all' | 'x' | 'y' | 't' | 'b' | 'l' | 'r'
} = {}) => {
  const prefix = direction === 'all' ? 'm' : `m${direction}`
  return `${prefix}-${mobile} sm:${prefix}-${sm} lg:${prefix}-${lg}`
}

/**
 * Genera clases de texto responsive
 */
export const generateResponsiveText = ({
  mobile = 'custom-sm',
  sm = 'base',
  lg = 'custom-lg',
}: {
  mobile?: string
  sm?: string
  lg?: string
} = {}) => {
  return `text-${mobile} sm:text-${sm} lg:text-${lg}`
}

// ===================================
// UTILIDADES DE IMÁGENES RESPONSIVE
// ===================================

/**
 * Genera el atributo sizes para imágenes responsive
 */
export const generateImageSizes = ({
  mobile = '100vw',
  xsm = '50vw',
  sm = '50vw',
  md = '33vw',
  lg = '25vw',
  xl = '20vw',
  '2xl': xxl = '16vw',
}: Partial<Record<BreakpointKey | 'mobile', string>> = {}) => {
  const sizes = [
    `(max-width: ${BREAKPOINTS.xsm - 1}px) ${mobile}`,
    `(max-width: ${BREAKPOINTS.lsm - 1}px) ${xsm}`,
    `(max-width: ${BREAKPOINTS.sm - 1}px) ${sm}`,
    `(max-width: ${BREAKPOINTS.md - 1}px) ${sm}`,
    `(max-width: ${BREAKPOINTS.lg - 1}px) ${md}`,
    `(max-width: ${BREAKPOINTS.xl - 1}px) ${lg}`,
    `(max-width: ${BREAKPOINTS['2xl'] - 1}px) ${xl}`,
    xxl,
  ]

  return sizes.join(', ')
}

// ===================================
// PRESETS COMUNES
// ===================================

export const RESPONSIVE_PRESETS = {
  // Grids de productos
  productGrid: {
    ecommerce: generateResponsiveGrid({ mobile: 1, xsm: 2, md: 3, lg: 4, xl: 5, '3xl': 6 }),
    catalog: generateResponsiveGrid({ mobile: 2, sm: 3, lg: 4, xl: 6 }),
    featured: generateResponsiveGrid({ mobile: 1, sm: 2, lg: 3 }),
  },

  // Padding de contenedores
  container: {
    tight: generateResponsivePadding({ mobile: 4, sm: 6, lg: 8 }),
    normal: generateResponsivePadding({ mobile: 6, sm: 8, lg: 12 }),
    loose: generateResponsivePadding({ mobile: 8, sm: 12, lg: 16 }),
  },

  // Texto
  text: {
    body: generateResponsiveText({ mobile: 'custom-sm', sm: 'base', lg: 'custom-lg' }),
    heading: generateResponsiveText({ mobile: 'custom-xl', sm: 'custom-2xl', lg: 'heading-6' }),
    title: generateResponsiveText({ mobile: 'heading-6', sm: 'heading-5', lg: 'heading-3' }),
  },

  // Imágenes
  images: {
    product: generateImageSizes({ mobile: '100vw', xsm: '50vw', md: '33vw', lg: '25vw' }),
    hero: generateImageSizes({ mobile: '100vw', lg: '50vw' }),
    thumbnail: generateImageSizes({ mobile: '25vw', sm: '20vw', lg: '15vw' }),
  },
}

// ===================================
// HOOK PARA CLASES DINÁMICAS
// ===================================

/**
 * Hook que retorna clases CSS basadas en el breakpoint actual
 */
export const useDynamicClasses = () => {
  const { currentBreakpoint, isMobile, isTablet, isDesktop } = useResponsiveOptimized()

  return {
    // Clases condicionales
    showOnMobile: isMobile ? 'block' : 'hidden',
    hideOnMobile: isMobile ? 'hidden' : 'block',
    showOnTablet: isTablet ? 'block' : 'hidden',
    showOnDesktop: isDesktop ? 'block' : 'hidden',

    // Clases de layout
    flexDirection: isMobile ? 'flex-col' : 'flex-row',
    textAlign: isMobile ? 'text-center' : 'text-left',
    justifyContent: isMobile ? 'justify-center' : 'justify-between',

    // Clases de spacing
    gap: isMobile ? 'gap-4' : isTablet ? 'gap-6' : 'gap-8',
    padding: isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8',
    margin: isMobile ? 'm-4' : isTablet ? 'm-6' : 'm-8',

    // Información del breakpoint
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
  }
}

// ===================================
// UTILIDADES DE VALIDACIÓN
// ===================================

/**
 * Valida si un breakpoint es válido
 */
export const isValidBreakpoint = (breakpoint: string): breakpoint is BreakpointKey => {
  return breakpoint in BREAKPOINTS
}

/**
 * Obtiene el valor numérico de un breakpoint
 */
export const getBreakpointValue = (breakpoint: BreakpointKey): number => {
  return BREAKPOINTS[breakpoint]
}

/**
 * Compara dos breakpoints
 */
export const compareBreakpoints = (a: BreakpointKey, b: BreakpointKey): number => {
  return BREAKPOINTS[a] - BREAKPOINTS[b]
}

// ===================================
// UTILIDADES DE MEDIA QUERIES
// ===================================

/**
 * Genera media queries para CSS-in-JS
 */
export const mediaQueries = {
  xsm: `@media (min-width: ${BREAKPOINTS.xsm}px)`,
  lsm: `@media (min-width: ${BREAKPOINTS.lsm}px)`,
  sm: `@media (min-width: ${BREAKPOINTS.sm}px)`,
  md: `@media (min-width: ${BREAKPOINTS.md}px)`,
  lg: `@media (min-width: ${BREAKPOINTS.lg}px)`,
  xl: `@media (min-width: ${BREAKPOINTS.xl}px)`,
  '2xl': `@media (min-width: ${BREAKPOINTS['2xl']}px)`,
  '3xl': `@media (min-width: ${BREAKPOINTS['3xl']}px)`,

  // Utilidades adicionales
  mobile: `@media (max-width: ${BREAKPOINTS.md - 1}px)`,
  tablet: `@media (min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`,
  desktop: `@media (min-width: ${BREAKPOINTS.lg}px)`,

  // Para orientación
  portrait: '@media (orientation: portrait)',
  landscape: '@media (orientation: landscape)',

  // Para densidad de píxeles
  retina: '@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
}

// ===================================
// UTILIDADES DE PERFORMANCE
// ===================================

/**
 * Debounce para resize handlers
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout

  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle para scroll handlers
 */
export const throttle = <T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

// ===================================
// EXPORTACIONES POR DEFECTO
// ===================================

export default {
  BREAKPOINTS,
  RESPONSIVE_PRESETS,
  generateResponsiveGrid,
  generateResponsivePadding,
  generateResponsiveMargin,
  generateResponsiveText,
  generateImageSizes,
  useDynamicClasses,
  mediaQueries,
  debounce,
  throttle,
}
