/**
 * 🔤 Pinteya Design System - Typography Tokens
 *
 * Sistema tipográfico optimizado para e-commerce
 * Jerarquía clara y legibilidad en todos los dispositivos
 */

// 📚 Font Families
export const fontFamilies = {
  sans: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Oxygen',
    'Ubuntu',
    'Cantarell',
    'sans-serif',
  ],
  mono: [
    'JetBrains Mono',
    'Fira Code',
    'Monaco',
    'Consolas',
    'Liberation Mono',
    'Courier New',
    'monospace',
  ],
} as const

// 📏 Font Sizes
export const fontSizes = {
  xs: '12px', // 0.75rem
  sm: '14px', // 0.875rem
  base: '16px', // 1rem - Base size
  lg: '18px', // 1.125rem
  xl: '20px', // 1.25rem
  '2xl': '24px', // 1.5rem
  '3xl': '30px', // 1.875rem
  '4xl': '36px', // 2.25rem
  '5xl': '48px', // 3rem
  '6xl': '60px', // 3.75rem
  '7xl': '72px', // 4.5rem
  '8xl': '96px', // 6rem
  '9xl': '128px', // 8rem
} as const

// 📐 Line Heights
export const lineHeights = {
  none: '1',
  tight: '1.25',
  snug: '1.375',
  normal: '1.5',
  relaxed: '1.625',
  loose: '2',
  // Específicos por tamaño
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
} as const

// ⚖️ Font Weights
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
} as const

// 📝 Letter Spacing
export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0em',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const

// 🎯 Typography Scale - Jerarquía Semántica
export const typography = {
  // 📰 Headings
  h1: {
    fontSize: fontSizes['4xl'], // 36px
    lineHeight: lineHeights[10], // 40px
    fontWeight: fontWeights.bold, // 700
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamilies.sans.join(', '),
  },

  h2: {
    fontSize: fontSizes['3xl'], // 30px
    lineHeight: lineHeights[9], // 36px
    fontWeight: fontWeights.bold, // 700
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamilies.sans.join(', '),
  },

  h3: {
    fontSize: fontSizes['2xl'], // 24px
    lineHeight: lineHeights[8], // 32px
    fontWeight: fontWeights.semibold, // 600
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  h4: {
    fontSize: fontSizes.xl, // 20px
    lineHeight: lineHeights[7], // 28px
    fontWeight: fontWeights.semibold, // 600
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  h5: {
    fontSize: fontSizes.lg, // 18px
    lineHeight: lineHeights[6], // 24px
    fontWeight: fontWeights.medium, // 500
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  h6: {
    fontSize: fontSizes.base, // 16px
    lineHeight: lineHeights[6], // 24px
    fontWeight: fontWeights.medium, // 500
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  // 📄 Body Text
  bodyLarge: {
    fontSize: fontSizes.lg, // 18px
    lineHeight: lineHeights[7], // 28px
    fontWeight: fontWeights.normal, // 400
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  body: {
    fontSize: fontSizes.base, // 16px
    lineHeight: lineHeights[6], // 24px
    fontWeight: fontWeights.normal, // 400
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  bodySmall: {
    fontSize: fontSizes.sm, // 14px
    lineHeight: lineHeights[5], // 20px
    fontWeight: fontWeights.normal, // 400
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  // 🏷️ Labels & Captions
  label: {
    fontSize: fontSizes.sm, // 14px
    lineHeight: lineHeights[5], // 20px
    fontWeight: fontWeights.medium, // 500
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  caption: {
    fontSize: fontSizes.xs, // 12px
    lineHeight: lineHeights[4], // 16px
    fontWeight: fontWeights.normal, // 400
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamilies.sans.join(', '),
  },

  // 🔗 Links
  link: {
    fontSize: fontSizes.base, // 16px
    lineHeight: lineHeights[6], // 24px
    fontWeight: fontWeights.medium, // 500
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
    textDecoration: 'underline',
  },

  // 🔢 Code
  code: {
    fontSize: fontSizes.sm, // 14px
    lineHeight: lineHeights[5], // 20px
    fontWeight: fontWeights.normal, // 400
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.mono.join(', '),
  },
} as const

// 🛒 Typography Específica E-commerce
export const ecommerceTypography = {
  // 💰 Precios
  priceMain: {
    fontSize: fontSizes['2xl'], // 24px
    lineHeight: lineHeights[8], // 32px
    fontWeight: fontWeights.bold, // 700
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamilies.sans.join(', '),
  },

  priceSecondary: {
    fontSize: fontSizes.lg, // 18px
    lineHeight: lineHeights[7], // 28px
    fontWeight: fontWeights.semibold, // 600
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  priceOriginal: {
    fontSize: fontSizes.base, // 16px
    lineHeight: lineHeights[6], // 24px
    fontWeight: fontWeights.normal, // 400
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
    textDecoration: 'line-through',
  },

  // 🏷️ Product Info
  productTitle: {
    fontSize: fontSizes.xl, // 20px
    lineHeight: lineHeights[7], // 28px
    fontWeight: fontWeights.semibold, // 600
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  productDescription: {
    fontSize: fontSizes.sm, // 14px
    lineHeight: lineHeights[5], // 20px
    fontWeight: fontWeights.normal, // 400
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  productBrand: {
    fontSize: fontSizes.xs, // 12px
    lineHeight: lineHeights[4], // 16px
    fontWeight: fontWeights.medium, // 500
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamilies.sans.join(', '),
    textTransform: 'uppercase' as const,
  },

  // 🎯 CTAs y Botones
  buttonLarge: {
    fontSize: fontSizes.lg, // 18px
    lineHeight: lineHeights[6], // 24px
    fontWeight: fontWeights.semibold, // 600
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  button: {
    fontSize: fontSizes.base, // 16px
    lineHeight: lineHeights[6], // 24px
    fontWeight: fontWeights.medium, // 500
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  buttonSmall: {
    fontSize: fontSizes.sm, // 14px
    lineHeight: lineHeights[5], // 20px
    fontWeight: fontWeights.medium, // 500
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },

  // 🏆 Badges y Estados
  badge: {
    fontSize: fontSizes.xs, // 12px
    lineHeight: lineHeights[4], // 16px
    fontWeight: fontWeights.semibold, // 600
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamilies.sans.join(', '),
    textTransform: 'uppercase' as const,
  },

  // 📊 Datos y Métricas
  metric: {
    fontSize: fontSizes['3xl'], // 30px
    lineHeight: lineHeights[9], // 36px
    fontWeight: fontWeights.bold, // 700
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamilies.sans.join(', '),
  },

  metricLabel: {
    fontSize: fontSizes.sm, // 14px
    lineHeight: lineHeights[5], // 20px
    fontWeight: fontWeights.normal, // 400
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamilies.sans.join(', '),
  },
} as const

// 📱 Typography Responsive
export const responsiveTypography = {
  // Headings que se adaptan por breakpoint
  heroTitle: {
    xs: typography.h2,
    sm: typography.h1,
    md: {
      ...typography.h1,
      fontSize: fontSizes['5xl'], // 48px en desktop
      lineHeight: '1.1',
    },
  },

  sectionTitle: {
    xs: typography.h4,
    sm: typography.h3,
    md: typography.h2,
  },

  productTitle: {
    xs: ecommerceTypography.productTitle,
    sm: {
      ...ecommerceTypography.productTitle,
      fontSize: fontSizes['2xl'], // 24px en tablet+
    },
  },
} as const

export type TypographyToken = keyof typeof typography
export type EcommerceTypographyToken = keyof typeof ecommerceTypography
export type FontSizeToken = keyof typeof fontSizes
export type FontWeightToken = keyof typeof fontWeights
