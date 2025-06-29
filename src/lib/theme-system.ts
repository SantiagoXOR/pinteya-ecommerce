/**
 * Sistema de Temas Pinteya Design System
 * 
 * Implementa un sistema de temas dinámico con soporte para:
 * - Tema claro/oscuro
 * - Temas personalizados por contexto
 * - Variables CSS dinámicas
 * - Persistencia en localStorage
 */

import { createContext, useContext, useEffect, useState } from 'react'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type ThemeContext = 'default' | 'ecommerce' | 'admin' | 'mobile'

export interface ThemeColors {
  // Colores principales
  primary: {
    50: string
    100: string
    200: string
    300: string
    400: string
    500: string
    600: string
    700: string
    800: string
    900: string
    950: string
  }
  
  // Colores de fondo
  background: {
    primary: string
    secondary: string
    tertiary: string
    card: string
    overlay: string
  }
  
  // Colores de texto
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
    muted: string
  }
  
  // Colores de borde
  border: {
    primary: string
    secondary: string
    focus: string
    error: string
    success: string
  }
  
  // Colores e-commerce específicos
  ecommerce: {
    price: {
      current: string
      original: string
      discount: string
      installments: string
    }
    stock: {
      available: string
      low: string
      outOfStock: string
      preOrder: string
    }
    shipping: {
      free: string
      fast: string
      standard: string
      express: string
    }
  }
}

export interface Theme {
  name: string
  mode: ThemeMode
  colors: ThemeColors
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    xl: string
  }
}

/**
 * Tema claro por defecto
 */
export const lightTheme: Theme = {
  name: 'light',
  mode: 'light',
  colors: {
    primary: {
      50: '#FFF7EB',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#EF7D00', // Blaze Orange principal
      600: '#D16A00',
      700: '#B45309',
      800: '#92400E',
      900: '#78350F',
      950: '#451A03',
    },
    
    background: {
      primary: '#FFFFFF',
      secondary: '#FFF7EB',
      tertiary: '#F5F5F5',
      card: '#FFF7EB',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },
    
    text: {
      primary: '#712F00',
      secondary: '#333333',
      tertiary: '#757575',
      inverse: '#FFFFFF',
      muted: '#BDBDBD',
    },
    
    border: {
      primary: '#E0E0E0',
      secondary: '#EEEEEE',
      focus: '#EF7D00',
      error: '#F44336',
      success: '#4CAF50',
    },
    
    ecommerce: {
      price: {
        current: '#712F00',
        original: '#757575',
        discount: '#F44336',
        installments: '#00A651',
      },
      stock: {
        available: '#00A651',
        low: '#FF9800',
        outOfStock: '#F44336',
        preOrder: '#2196F3',
      },
      shipping: {
        free: '#00A651',
        fast: '#2196F3',
        standard: '#757575',
        express: '#9C27B0',
      },
    },
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  borderRadius: {
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
}

/**
 * Tema oscuro
 */
export const darkTheme: Theme = {
  ...lightTheme,
  name: 'dark',
  mode: 'dark',
  colors: {
    ...lightTheme.colors,
    
    background: {
      primary: '#1A1A1A',
      secondary: '#2D2D2D',
      tertiary: '#404040',
      card: '#2D2D2D',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    
    text: {
      primary: '#FFFFFF',
      secondary: '#E0E0E0',
      tertiary: '#BDBDBD',
      inverse: '#1A1A1A',
      muted: '#757575',
    },
    
    border: {
      primary: '#404040',
      secondary: '#2D2D2D',
      focus: '#EF7D00',
      error: '#F44336',
      success: '#4CAF50',
    },
  },
}

/**
 * Contexto del tema
 */
export const ThemeContext = createContext<{
  theme: Theme
  mode: ThemeMode
  context: ThemeContext
  setMode: (mode: ThemeMode) => void
  setContext: (context: ThemeContext) => void
  toggleMode: () => void
} | null>(null)

/**
 * Hook para usar el tema
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider')
  }
  return context
}

/**
 * Hook para detectar preferencia del sistema
 */
export function useSystemTheme(): 'light' | 'dark' {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light')
    
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])
  
  return systemTheme
}

/**
 * Función para aplicar variables CSS del tema
 */
export function applyThemeVariables(theme: Theme) {
  const root = document.documentElement
  
  // Aplicar colores principales
  Object.entries(theme.colors.primary).forEach(([key, value]) => {
    root.style.setProperty(`--color-primary-${key}`, value)
  })
  
  // Aplicar colores de fondo
  Object.entries(theme.colors.background).forEach(([key, value]) => {
    root.style.setProperty(`--color-background-${key}`, value)
  })
  
  // Aplicar colores de texto
  Object.entries(theme.colors.text).forEach(([key, value]) => {
    root.style.setProperty(`--color-text-${key}`, value)
  })
  
  // Aplicar colores de borde
  Object.entries(theme.colors.border).forEach(([key, value]) => {
    root.style.setProperty(`--color-border-${key}`, value)
  })
  
  // Aplicar colores e-commerce
  Object.entries(theme.colors.ecommerce.price).forEach(([key, value]) => {
    root.style.setProperty(`--color-ecommerce-price-${key}`, value)
  })
  
  Object.entries(theme.colors.ecommerce.stock).forEach(([key, value]) => {
    root.style.setProperty(`--color-ecommerce-stock-${key}`, value)
  })
  
  Object.entries(theme.colors.ecommerce.shipping).forEach(([key, value]) => {
    root.style.setProperty(`--color-ecommerce-shipping-${key}`, value)
  })
  
  // Aplicar sombras
  Object.entries(theme.shadows).forEach(([key, value]) => {
    root.style.setProperty(`--shadow-${key}`, value)
  })
  
  // Aplicar border radius
  Object.entries(theme.borderRadius).forEach(([key, value]) => {
    root.style.setProperty(`--border-radius-${key}`, value)
  })
}

/**
 * Función para obtener el tema basado en modo y contexto
 */
export function getTheme(mode: ThemeMode, context: ThemeContext, systemTheme: 'light' | 'dark'): Theme {
  const resolvedMode = mode === 'auto' ? systemTheme : mode
  const baseTheme = resolvedMode === 'dark' ? darkTheme : lightTheme
  
  // Personalizar tema según contexto
  switch (context) {
    case 'ecommerce':
      return {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          // Enfatizar colores e-commerce
          primary: {
            ...baseTheme.colors.primary,
            500: '#00A651', // Verde para e-commerce
          },
        },
      }
    
    case 'admin':
      return {
        ...baseTheme,
        colors: {
          ...baseTheme.colors,
          primary: {
            ...baseTheme.colors.primary,
            500: '#2196F3', // Azul para admin
          },
        },
      }
    
    case 'mobile':
      return {
        ...baseTheme,
        borderRadius: {
          sm: '0.25rem',
          md: '0.5rem',
          lg: '0.75rem',
          xl: '1rem',
        },
      }
    
    default:
      return baseTheme
  }
}

/**
 * Función para persistir configuración del tema
 */
export function saveThemePreference(mode: ThemeMode, context: ThemeContext) {
  localStorage.setItem('pinteya-theme-mode', mode)
  localStorage.setItem('pinteya-theme-context', context)
}

/**
 * Función para cargar configuración del tema
 */
export function loadThemePreference(): { mode: ThemeMode; context: ThemeContext } {
  const mode = (localStorage.getItem('pinteya-theme-mode') as ThemeMode) || 'light'
  const context = (localStorage.getItem('pinteya-theme-context') as ThemeContext) || 'default'
  
  return { mode, context }
}
