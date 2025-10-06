/**
 * 📐 Pinteya Design System - Spacing Tokens
 *
 * Sistema de espaciado basado en múltiplos de 4px
 * Optimizado para layouts de e-commerce responsive
 */

export const spacing = {
  // 🔢 Espaciado Base (múltiplos de 4px)
  0: '0px',
  1: '4px', // 0.25rem
  2: '8px', // 0.5rem
  3: '12px', // 0.75rem
  4: '16px', // 1rem
  5: '20px', // 1.25rem
  6: '24px', // 1.5rem
  7: '28px', // 1.75rem
  8: '32px', // 2rem
  9: '36px', // 2.25rem
  10: '40px', // 2.5rem
  11: '44px', // 2.75rem
  12: '48px', // 3rem
  14: '56px', // 3.5rem
  16: '64px', // 4rem
  20: '80px', // 5rem
  24: '96px', // 6rem
  28: '112px', // 7rem
  32: '128px', // 8rem
  36: '144px', // 9rem
  40: '160px', // 10rem
  44: '176px', // 11rem
  48: '192px', // 12rem
  52: '208px', // 13rem
  56: '224px', // 14rem
  60: '240px', // 15rem
  64: '256px', // 16rem
  72: '288px', // 18rem
  80: '320px', // 20rem
  96: '384px', // 24rem
} as const

// 🏷️ Aliases Semánticos
export const spacingAliases = {
  // Espaciado extra pequeño
  xs: spacing[1], // 4px
  sm: spacing[2], // 8px
  md: spacing[4], // 16px
  lg: spacing[6], // 24px
  xl: spacing[8], // 32px
  '2xl': spacing[12], // 48px
  '3xl': spacing[16], // 64px
  '4xl': spacing[20], // 80px
  '5xl': spacing[24], // 96px

  // Espaciado específico para componentes
  buttonPadding: spacing[3], // 12px
  cardPadding: spacing[4], // 16px
  sectionPadding: spacing[6], // 24px
  containerPadding: spacing[8], // 32px

  // Márgenes comunes
  elementMargin: spacing[2], // 8px
  componentMargin: spacing[4], // 16px
  sectionMargin: spacing[8], // 32px

  // Gaps para grids y flex
  gridGap: spacing[4], // 16px
  cardGap: spacing[3], // 12px
  buttonGap: spacing[2], // 8px
} as const

// 📱 Espaciado Responsive
export const responsiveSpacing = {
  // Padding de contenedor por breakpoint
  containerPadding: {
    xs: spacing[4], // 16px en mobile
    sm: spacing[6], // 24px en tablet
    md: spacing[8], // 32px en desktop
    lg: spacing[10], // 40px en desktop grande
    xl: spacing[12], // 48px en extra grande
  },

  // Márgenes de sección por breakpoint
  sectionMargin: {
    xs: spacing[6], // 24px en mobile
    sm: spacing[8], // 32px en tablet
    md: spacing[12], // 48px en desktop
    lg: spacing[16], // 64px en desktop grande
    xl: spacing[20], // 80px en extra grande
  },

  // Gap de grid por breakpoint
  gridGap: {
    xs: spacing[3], // 12px en mobile
    sm: spacing[4], // 16px en tablet
    md: spacing[6], // 24px en desktop
    lg: spacing[8], // 32px en desktop grande
    xl: spacing[10], // 40px en extra grande
  },
} as const

// 🎯 Espaciado Específico E-commerce
export const ecommerceSpacing = {
  // ProductCard
  productCard: {
    padding: spacing[4], // 16px
    gap: spacing[3], // 12px
    imageMargin: spacing[2], // 8px
    priceMargin: spacing[1], // 4px
  },

  // Botones
  button: {
    paddingX: spacing[4], // 16px horizontal
    paddingY: spacing[2], // 8px vertical
    gap: spacing[2], // 8px entre icon y texto
  },

  // Forms
  form: {
    fieldGap: spacing[4], // 16px entre campos
    labelMargin: spacing[1], // 4px entre label e input
    groupMargin: spacing[6], // 24px entre grupos
  },

  // Navigation
  navigation: {
    itemPadding: spacing[3], // 12px
    itemGap: spacing[2], // 8px
    sectionGap: spacing[6], // 24px
  },

  // Header
  header: {
    padding: spacing[4], // 16px
    logoMargin: spacing[2], // 8px
    searchMargin: spacing[4], // 16px
  },

  // Footer
  footer: {
    padding: spacing[8], // 32px
    sectionGap: spacing[6], // 24px
    linkGap: spacing[2], // 8px
  },

  // Checkout
  checkout: {
    stepGap: spacing[8], // 32px
    fieldGap: spacing[4], // 16px
    summaryPadding: spacing[6], // 24px
  },
} as const

// 🔄 Espaciado de Animaciones
export const animationSpacing = {
  // Desplazamientos para hover effects
  hoverTranslate: spacing[1], // 4px

  // Espacios para dropdowns y modals
  dropdownOffset: spacing[2], // 8px
  modalPadding: spacing[6], // 24px
  tooltipOffset: spacing[1], // 4px
} as const

// 📏 Utilidades de Espaciado
export const spacingUtils = {
  // Función para obtener espaciado responsive
  getResponsiveSpacing: (
    property: keyof typeof responsiveSpacing,
    breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ) => responsiveSpacing[property][breakpoint],

  // Función para combinar espaciados
  combineSpacing: (...values: string[]) => values.join(' '),

  // Función para espaciado negativo
  negative: (value: string) => `-${value}`,
} as const

export type SpacingToken = keyof typeof spacing
export type SpacingAlias = keyof typeof spacingAliases
export type ResponsiveSpacingProperty = keyof typeof responsiveSpacing
export type EcommerceSpacingProperty = keyof typeof ecommerceSpacing
