/**
 * Design Tokens for Categories Component
 * Pinteya E-commerce - Enterprise Design System
 */

/**
 * Color tokens for categories
 */
export const categoryColors = {
  // Primary colors
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16',
  },

  // Brand colors (Pinteya specific)
  brand: {
    green: {
      light: '#10b981',
      DEFAULT: '#007639',
      dark: '#005a2b',
      darker: '#004d24',
    },
    orange: {
      light: '#fb923c',
      DEFAULT: '#ea5a17',
      dark: '#c2410c',
      darker: '#9a3412',
    },
    yellow: {
      light: '#fbbf24',
      DEFAULT: '#f59e0b',
      dark: '#d97706',
      darker: '#b45309',
    },
  },

  // State colors
  states: {
    selected: '#007639',
    hover: '#005a2b',
    focus: '#ea5a17',
    disabled: '#9ca3af',
    error: '#ef4444',
    success: '#10b981',
    warning: '#f59e0b',
  },

  // Background colors
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
    gradient: {
      from: '#fed7aa',
      to: '#fef3c7',
    },
  },

  // Text colors
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    tertiary: '#9ca3af',
    inverse: '#ffffff',
    muted: '#d1d5db',
  },
} as const

/**
 * Spacing tokens
 */
export const categorySpacing = {
  // Component spacing
  pill: {
    padding: {
      sm: { x: '0.75rem', y: '0.375rem' }, // px-3 py-1.5
      md: { x: '1rem', y: '0.5rem' }, // px-4 py-2
      lg: { x: '1.25rem', y: '0.75rem' }, // px-5 py-3
    },
    margin: {
      gap: '0.5rem', // gap-2
      row: '0.75rem', // mb-3
    },
    icon: {
      sm: { left: '1.5rem' }, // pl-6
      md: { left: '2rem' }, // pl-8
      lg: { left: '2.5rem' }, // pl-10
    },
  },

  // Container spacing
  container: {
    padding: {
      x: '1rem', // px-4
      y: '3rem', // py-12
    },
    margin: {
      header: '2rem', // mb-8
      content: '0',
    },
  },

  // Icon spacing
  icon: {
    size: {
      sm: '1.5rem', // w-6 h-6
      md: '2.5rem', // w-10 h-10
      lg: '3rem', // w-12 h-12
    },
    position: {
      sm: '-0.125rem', // -left-0.5
      md: '-0.25rem', // -left-1
      lg: '-0.375rem', // -left-1.5
    },
  },
} as const

/**
 * Typography tokens
 */
export const categoryTypography = {
  // Font families
  fontFamily: {
    sans: ['Work Sans', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },

  // Font sizes
  fontSize: {
    xs: '0.75rem', // text-xs
    sm: '0.875rem', // text-sm
    base: '1rem', // text-base
    lg: '1.125rem', // text-lg
    xl: '1.25rem', // text-xl
    '2xl': '1.5rem', // text-2xl
    '3xl': '1.875rem', // text-3xl
  },

  // Font weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // Line heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.625',
  },

  // Letter spacing
  letterSpacing: {
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
  },
} as const

/**
 * Border radius tokens
 */
export const categoryBorderRadius = {
  none: '0',
  sm: '0.125rem', // rounded-sm
  DEFAULT: '0.25rem', // rounded
  md: '0.375rem', // rounded-md
  lg: '0.5rem', // rounded-lg
  xl: '0.75rem', // rounded-xl
  '2xl': '1rem', // rounded-2xl
  full: '9999px', // rounded-full
} as const

/**
 * Shadow tokens
 */
export const categoryShadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  focus: '0 0 0 3px rgb(234 90 23 / 0.5)', // focus ring
} as const

/**
 * Animation tokens
 */
export const categoryAnimations = {
  // Durations
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  // Timing functions
  timing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Transforms
  transform: {
    scale: {
      normal: 'scale(1)',
      hover: 'scale(1.05)',
      active: 'scale(0.95)',
      selected: 'scale(1.05)',
    },
    translate: {
      up: 'translateY(-1px)',
      down: 'translateY(1px)',
    },
  },
} as const

/**
 * Z-index tokens
 */
export const categoryZIndex = {
  base: 0,
  raised: 10,
  overlay: 20,
  modal: 30,
  popover: 40,
  tooltip: 50,
} as const

/**
 * Breakpoint tokens
 */
export const categoryBreakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

/**
 * Component variants
 */
export const categoryVariants = {
  size: {
    sm: {
      padding: categorySpacing.pill.padding.sm,
      fontSize: categoryTypography.fontSize.xs,
      iconSize: categorySpacing.icon.size.sm,
    },
    md: {
      padding: categorySpacing.pill.padding.md,
      fontSize: categoryTypography.fontSize.sm,
      iconSize: categorySpacing.icon.size.md,
    },
    lg: {
      padding: categorySpacing.pill.padding.lg,
      fontSize: categoryTypography.fontSize.base,
      iconSize: categorySpacing.icon.size.lg,
    },
  },

  style: {
    default: {
      background: categoryColors.brand.green.DEFAULT,
      backgroundHover: categoryColors.brand.green.dark,
      color: categoryColors.text.inverse,
      border: 'none',
    },
    outline: {
      background: 'transparent',
      backgroundHover: categoryColors.brand.green.light,
      color: categoryColors.brand.green.DEFAULT,
      border: `1px solid ${categoryColors.brand.green.DEFAULT}`,
    },
    ghost: {
      background: 'transparent',
      backgroundHover: categoryColors.background.secondary,
      color: categoryColors.text.primary,
      border: 'none',
    },
  },
} as const

/**
 * Accessibility tokens
 */
export const categoryA11y = {
  // Focus indicators
  focus: {
    ring: {
      width: '2px',
      color: categoryColors.states.focus,
      offset: '2px',
    },
  },

  // Minimum touch targets
  touchTarget: {
    minSize: '44px',
  },

  // Color contrast ratios
  contrast: {
    normal: 4.5,
    large: 3,
    enhanced: 7,
  },
} as const

/**
 * Complete design token export
 */
export const categoryDesignTokens = {
  colors: categoryColors,
  spacing: categorySpacing,
  typography: categoryTypography,
  borderRadius: categoryBorderRadius,
  shadows: categoryShadows,
  animations: categoryAnimations,
  zIndex: categoryZIndex,
  breakpoints: categoryBreakpoints,
  variants: categoryVariants,
  a11y: categoryA11y,
} as const

/**
 * Type definitions for design tokens
 */
export type CategoryColors = typeof categoryColors
export type CategorySpacing = typeof categorySpacing
export type CategoryTypography = typeof categoryTypography
export type CategoryVariants = typeof categoryVariants
export type CategoryDesignTokens = typeof categoryDesignTokens
