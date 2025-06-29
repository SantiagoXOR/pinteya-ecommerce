/**
 * 🎨 Pinteya Design System - Color Tokens
 * 
 * Paleta de colores optimizada para e-commerce de pinturería
 * Basada en psicología del color para el sector construcción
 */

export const colors = {
  // 🔥 Colores Primarios
  primary: {
    50: '#FFF4E6',
    100: '#FFE4B8',
    200: '#FFD28A',
    300: '#FFC05C',
    400: '#FFAE2E',
    500: '#EF7D00', // Blaze Orange - Principal
    600: '#D16A00',
    700: '#B35700',
    800: '#954400',
    900: '#773100',
  },

  // 🌿 Colores Secundarios (Verde)
  secondary: {
    50: '#E6F7ED',
    100: '#B8E6CC',
    200: '#8AD5AB',
    300: '#5CC48A',
    400: '#2EB369',
    500: '#00A651', // Fun Green - Secundario
    600: '#008F46',
    700: '#00783B',
    800: '#006130',
    900: '#004A25',
  },

  // ☀️ Colores de Acento (Amarillo)
  accent: {
    50: '#FFFEF0',
    100: '#FFFBD1',
    200: '#FFF8B3',
    300: '#FFF594',
    400: '#FFF276',
    500: '#FFD700', // Bright Sun - Acento
    600: '#E6C200',
    700: '#CCAD00',
    800: '#B39800',
    900: '#998300',
  },

  // 🤎 Colores Neutros Cálidos
  neutral: {
    50: '#FFF7EB',  // Warm Beige - Fondos suaves
    100: '#F5E6D3',
    200: '#EBD5BB',
    300: '#E1C4A3',
    400: '#D7B38B',
    500: '#CDA273',
    600: '#B8926A',
    700: '#A38261',
    800: '#8E7258',
    900: '#712F00', // Deep Brown - Textos principales
  },

  // ⚫ Grises Funcionales
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#333333',
  },

  // 🚨 Colores de Estado
  success: {
    50: '#E8F5E8',
    100: '#C8E6C8',
    200: '#A8D7A8',
    300: '#88C888',
    400: '#68B968',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  warning: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107',
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },

  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },

  info: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // 🛒 Colores E-commerce (Expandidos)
  ecommerce: {
    // Precios
    price: {
      current: '#712F00',      // Precio actual - neutral.900
      original: '#757575',     // Precio original tachado - gray.600
      discount: '#F44336',     // Color de descuento - error.500
      installments: '#00A651', // Color de cuotas - success.500
    },

    // Stock
    stock: {
      available: '#00A651',    // En stock - success.500
      low: '#FF9800',          // Stock bajo - warning.500
      outOfStock: '#F44336',   // Sin stock - error.500
      preOrder: '#2196F3',     // Pre-orden - info.500
    },

    // Envío
    shipping: {
      free: '#00A651',         // Envío gratis - success.500
      fast: '#2196F3',         // Envío rápido - info.500
      standard: '#757575',     // Envío estándar - gray.600
      express: '#9C27B0',      // Envío express - purple.500
    },

    // Estados de compra
    purchase: {
      addToCart: '#EF7D00',    // Agregar al carrito - primary.500
      buyNow: '#00A651',       // Comprar ahora - success.500
      wishlist: '#F44336',     // Lista de deseos - error.500
      compare: '#757575',      // Comparar - gray.600
    },

    // Badges y etiquetas
    badges: {
      new: '#2196F3',          // Nuevo - info.500
      sale: '#F44336',         // Oferta - error.500
      featured: '#FF9800',     // Destacado - warning.500
      bestseller: '#9C27B0',   // Más vendido - purple.500
    },
  },

  // 🌐 Colores de Fondo
  background: {
    primary: '#FFFFFF',
    secondary: '#FFF7EB',    // neutral.50
    tertiary: '#F5F5F5',    // gray.100
    card: '#FFF7EB',        // neutral.50
    overlay: 'rgba(0, 0, 0, 0.5)',
    disabled: '#F5F5F5',    // gray.100
  },

  // 📝 Colores de Texto
  text: {
    primary: '#712F00',     // neutral.900
    secondary: '#333333',   // gray.900
    tertiary: '#757575',    // gray.600
    disabled: '#BDBDBD',    // gray.400
    inverse: '#FFFFFF',
    link: '#EF7D00',        // primary.500
    linkHover: '#D16A00',   // primary.600
  },

  // 🔲 Colores de Borde
  border: {
    primary: '#E0E0E0',     // gray.300
    secondary: '#EEEEEE',   // gray.200
    focus: '#EF7D00',       // primary.500
    error: '#F44336',       // error.500
    success: '#4CAF50',     // success.500
  },


} as const;

// 🎨 Aliases para facilidad de uso
export const colorAliases = {
  // Colores principales
  orange: colors.primary[500],
  green: colors.secondary[500],
  yellow: colors.accent[500],
  brown: colors.neutral[900],
  beige: colors.neutral[50],
  
  // Estados
  success: colors.success[500],
  warning: colors.warning[500],
  error: colors.error[500],
  info: colors.info[500],
  
  // Fondos comunes
  cardBg: colors.background.card,
  pageBg: colors.background.primary,
  sectionBg: colors.background.secondary,
  
  // Textos comunes
  textPrimary: colors.text.primary,
  textSecondary: colors.text.secondary,
  textMuted: colors.text.tertiary,
} as const;

export type ColorToken = keyof typeof colors;
export type ColorAlias = keyof typeof colorAliases;
