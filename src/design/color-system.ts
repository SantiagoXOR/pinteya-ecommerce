/**
 * Sistema de Colores para E-commerce
 * Paleta cromática coherente y profesional
 * Optimizada para accesibilidad y experiencia del usuario
 */

// Colores primarios - Azul profesional y confiable
export const primaryColors = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  400: '#60a5fa',
  500: '#3b82f6', // Color principal
  600: '#2563eb',
  700: '#1d4ed8',
  800: '#1e40af',
  900: '#1e3a8a',
  950: '#172554',
}

// Colores secundarios - Verde para acciones positivas
export const secondaryColors = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e', // Color secundario
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
  950: '#052e16',
}

// Colores de acento - Naranja para llamadas a la acción
export const accentColors = {
  50: '#fff7ed',
  100: '#ffedd5',
  200: '#fed7aa',
  300: '#fdba74',
  400: '#fb923c',
  500: '#f97316', // Color de acento
  600: '#ea580c',
  700: '#c2410c',
  800: '#9a3412',
  900: '#7c2d12',
  950: '#431407',
}

// Colores neutros - Grises para texto y fondos
export const neutralColors = {
  50: '#f8fafc',
  100: '#f1f5f9',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
  950: '#020617',
}

// Colores de estado - Para feedback del usuario
export const statusColors = {
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  info: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
}

// Paleta de colores para productos
export const productColors = {
  red: '#ef4444',
  blue: '#3b82f6',
  green: '#22c55e',
  yellow: '#eab308',
  purple: '#a855f7',
  pink: '#ec4899',
  orange: '#f97316',
  teal: '#14b8a6',
  indigo: '#6366f1',
  gray: '#6b7280',
  black: '#1f2937',
  white: '#ffffff',
}

// Configuración de tema claro
export const lightTheme = {
  background: {
    primary: neutralColors[50],
    secondary: neutralColors[100],
    tertiary: '#ffffff',
    card: '#ffffff',
    modal: '#ffffff',
  },
  text: {
    primary: neutralColors[900],
    secondary: neutralColors[700],
    tertiary: neutralColors[500],
    muted: neutralColors[400],
    inverse: '#ffffff',
  },
  border: {
    light: neutralColors[200],
    medium: neutralColors[300],
    dark: neutralColors[400],
  },
  shadow: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(0, 0, 0, 0.15)',
  },
}

// Configuración de tema oscuro
export const darkTheme = {
  background: {
    primary: neutralColors[900],
    secondary: neutralColors[800],
    tertiary: neutralColors[700],
    card: neutralColors[800],
    modal: neutralColors[700],
  },
  text: {
    primary: neutralColors[50],
    secondary: neutralColors[200],
    tertiary: neutralColors[400],
    muted: neutralColors[500],
    inverse: neutralColors[900],
  },
  border: {
    light: neutralColors[700],
    medium: neutralColors[600],
    dark: neutralColors[500],
  },
  shadow: {
    light: 'rgba(0, 0, 0, 0.2)',
    medium: 'rgba(0, 0, 0, 0.3)',
    dark: 'rgba(0, 0, 0, 0.4)',
  },
}

// Gradientes para elementos visuales atractivos
export const gradients = {
  primary: `linear-gradient(135deg, ${primaryColors[500]} 0%, ${primaryColors[600]} 100%)`,
  secondary: `linear-gradient(135deg, ${secondaryColors[500]} 0%, ${secondaryColors[600]} 100%)`,
  accent: `linear-gradient(135deg, ${accentColors[500]} 0%, ${accentColors[600]} 100%)`,
  hero: `linear-gradient(135deg, ${primaryColors[600]} 0%, ${primaryColors[700]} 50%, ${accentColors[500]} 100%)`,
  card: `linear-gradient(145deg, ${neutralColors[50]} 0%, ${neutralColors[100]} 100%)`,
  cardDark: `linear-gradient(145deg, ${neutralColors[800]} 0%, ${neutralColors[700]} 100%)`,
  button: `linear-gradient(135deg, ${primaryColors[500]} 0%, ${primaryColors[600]} 100%)`,
  buttonHover: `linear-gradient(135deg, ${primaryColors[600]} 0%, ${primaryColors[700]} 100%)`,
}

// Configuración de accesibilidad
export const accessibilityConfig = {
  contrastRatios: {
    normal: 4.5, // WCAG AA
    large: 3.0, // WCAG AA para texto grande
    enhanced: 7.0, // WCAG AAA
  },
  focusColors: {
    primary: primaryColors[500],
    secondary: accentColors[500],
    error: statusColors.error[500],
  },
}

// Utilidades para trabajar con colores
export const colorUtils = {
  // Obtener color con opacidad
  withOpacity: (color: string, opacity: number) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  },

  // Obtener color de contraste
  getContrastColor: (backgroundColor: string) => {
    // Lógica simplificada - en producción usar una librería como chroma.js
    const lightColors = [neutralColors[50], neutralColors[100], neutralColors[200]]
    return lightColors.includes(backgroundColor) ? neutralColors[900] : neutralColors[50]
  },

  // Generar variaciones de un color
  generateShades: (baseColor: string, steps: number = 9) => {
    // Implementación básica - en producción usar algoritmos más sofisticados
    const shades: Record<number, string> = {}
    for (let i = 0; i < steps; i++) {
      const weight = (i + 1) * 100
      shades[weight] = baseColor // Simplificado
    }
    return shades
  },
}

// Configuración para Tailwind CSS
export const tailwindColorConfig = {
  primary: primaryColors,
  secondary: secondaryColors,
  accent: accentColors,
  neutral: neutralColors,
  success: statusColors.success,
  warning: statusColors.warning,
  error: statusColors.error,
  info: statusColors.info,
}

// Exportar configuración completa
export const colorSystem = {
  primary: primaryColors,
  secondary: secondaryColors,
  accent: accentColors,
  neutral: neutralColors,
  status: statusColors,
  product: productColors,
  light: lightTheme,
  dark: darkTheme,
  gradients,
  accessibility: accessibilityConfig,
  utils: colorUtils,
  tailwind: tailwindColorConfig,
}

export default colorSystem
