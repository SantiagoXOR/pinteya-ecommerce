/**
 * Sistema Tipográfico para E-commerce
 * Escalable, legible y optimizado para diferentes dispositivos
 * Basado en principios de diseño modular y accesibilidad
 */

// Familias de fuentes
export const fontFamilies = {
  // Fuente principal - Humanista con excelente legibilidad numérica
  primary: [
    'Work Sans',
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'sans-serif',
  ].join(', '),

  // Fuente secundaria - Para títulos y elementos destacados (misma familia para consistencia)
  secondary: ['Work Sans', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'].join(', '),

  // Fuente monoespaciada - Para códigos y datos técnicos
  mono: [
    'JetBrains Mono',
    'Fira Code',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ].join(', '),
}

// Escala tipográfica modular (ratio 1.25 - Major Third)
export const fontSizes = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem', // 48px
  '6xl': '3.75rem', // 60px
  '7xl': '4.5rem', // 72px
  '8xl': '6rem', // 96px
  '9xl': '8rem', // 128px
}

// Pesos de fuente
export const fontWeights = {
  thin: '100',
  extralight: '200',
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
}

// Alturas de línea optimizadas para legibilidad
export const lineHeights = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
}

// Espaciado entre letras
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
}

// Jerarquía tipográfica para diferentes elementos
export const typography = {
  // Títulos principales
  h1: {
    fontFamily: fontFamilies.secondary,
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
    // Responsive
    mobile: {
      fontSize: fontSizes['2xl'],
    },
    tablet: {
      fontSize: fontSizes['3xl'],
    },
  },

  h2: {
    fontFamily: fontFamilies.secondary,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacing.tight,
    mobile: {
      fontSize: fontSizes.xl,
    },
    tablet: {
      fontSize: fontSizes['2xl'],
    },
  },

  h3: {
    fontFamily: fontFamilies.secondary,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal,
    mobile: {
      fontSize: fontSizes.lg,
    },
    tablet: {
      fontSize: fontSizes.xl,
    },
  },

  h4: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.snug,
    letterSpacing: letterSpacing.normal,
    mobile: {
      fontSize: fontSizes.base,
    },
  },

  h5: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },

  h6: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.wide,
  },

  // Texto de cuerpo
  body: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
  },

  bodyLarge: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
  },

  bodySmall: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },

  // Elementos de interfaz
  button: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
  },

  buttonLarge: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
  },

  buttonSmall: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wider,
  },

  // Navegación y menús
  nav: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.normal,
  },

  navSmall: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.normal,
  },

  // Precios y elementos comerciales
  price: {
    fontFamily: fontFamilies.secondary,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.tight,
  },

  priceSmall: {
    fontFamily: fontFamilies.secondary,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.normal,
  },

  // Etiquetas y badges
  label: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.none,
    letterSpacing: letterSpacing.wide,
  },

  caption: {
    fontFamily: fontFamilies.primary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.wide,
  },

  // Código y elementos técnicos
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacing.normal,
  },
}

// Utilidades para generar clases CSS
export const typographyUtils = {
  // Generar clase CSS para un elemento tipográfico
  generateCSS: (element: keyof typeof typography) => {
    const styles = typography[element]
    return {
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      lineHeight: styles.lineHeight,
      letterSpacing: styles.letterSpacing,
    }
  },

  // Generar clases responsive
  generateResponsiveCSS: (element: keyof typeof typography) => {
    const styles = typography[element]
    const css: any = {
      fontFamily: styles.fontFamily,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      lineHeight: styles.lineHeight,
      letterSpacing: styles.letterSpacing,
    }

    if ('mobile' in styles) {
      css['@media (max-width: 640px)'] = styles.mobile
    }

    if ('tablet' in styles) {
      css['@media (min-width: 641px) and (max-width: 1024px)'] = styles.tablet
    }

    return css
  },

  // Calcular tamaño de fuente fluido
  fluidFontSize: (
    minSize: string,
    maxSize: string,
    minViewport = '320px',
    maxViewport = '1200px'
  ) => {
    return `clamp(${minSize}, calc(${minSize} + (${maxSize} - ${minSize}) * ((100vw - ${minViewport}) / (${maxViewport} - ${minViewport}))), ${maxSize})`
  },
}

// Configuración para Tailwind CSS
export const tailwindTypographyConfig = {
  fontFamily: fontFamilies,
  fontSize: fontSizes,
  fontWeight: fontWeights,
  lineHeight: lineHeights,
  letterSpacing: letterSpacing,
}

// Presets para elementos comunes del e-commerce
export const ecommerceTypography = {
  productTitle: typography.h3,
  productPrice: typography.price,
  productDescription: typography.body,
  categoryTitle: typography.h2,
  sectionTitle: typography.h4,
  buttonText: typography.button,
  navLink: typography.nav,
  breadcrumb: typography.navSmall,
  badge: typography.label,
  metadata: typography.caption,
}

// Configuración de accesibilidad tipográfica
export const accessibilityTypography = {
  minFontSize: '14px', // Tamaño mínimo recomendado
  maxLineLength: '75ch', // Longitud máxima de línea para legibilidad
  contrastRequirements: {
    normal: 4.5, // WCAG AA
    large: 3.0, // WCAG AA para texto grande (18px+ o 14px+ bold)
    enhanced: 7.0, // WCAG AAA
  },
  focusIndicators: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineOffset: '2px',
  },
}

// Exportar configuración completa
export const typographySystem = {
  families: fontFamilies,
  sizes: fontSizes,
  weights: fontWeights,
  lineHeights: lineHeights,
  letterSpacing: letterSpacing,
  typography: typography,
  utils: typographyUtils,
  tailwind: tailwindTypographyConfig,
  ecommerce: ecommerceTypography,
  accessibility: accessibilityTypography,
}

export default typographySystem
