// ===================================
// PINTEYA E-COMMERCE - SISTEMA DE PERSISTENCIA DE TEMA
// ===================================

'use client'

import { useEffect, useState } from 'react'

// Tipos para el tema
export type Theme = 'light' | 'dark' | 'system'

// Constantes
const THEME_STORAGE_KEY = 'pinteya-theme'
const THEME_ATTRIBUTE = 'data-theme'

// Clase para gestión de tema
export class ThemeManager {
  private static instance: ThemeManager

  public static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  // Obtener tema actual del localStorage
  getStoredTheme(): Theme {
    if (typeof window === 'undefined') return 'system'

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY)
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as Theme
      }
    } catch (error) {
      console.warn('Error al leer tema del localStorage:', error)
    }

    return 'system'
  }

  // Guardar tema en localStorage
  setStoredTheme(theme: Theme): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch (error) {
      console.warn('Error al guardar tema en localStorage:', error)
    }
  }

  // Obtener preferencia del sistema
  getSystemTheme(): 'light' | 'dark' {
    if (typeof window === 'undefined') return 'light'

    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  // Resolver tema efectivo (convertir 'system' al tema real)
  resolveTheme(theme: Theme): 'light' | 'dark' {
    if (theme === 'system') {
      return this.getSystemTheme()
    }
    return theme
  }

  // Aplicar tema al DOM
  applyTheme(theme: Theme): void {
    if (typeof window === 'undefined') return

    const resolvedTheme = this.resolveTheme(theme)
    const root = document.documentElement

    // Remover clases de tema anteriores
    root.classList.remove('light', 'dark')

    // Aplicar nueva clase de tema
    root.classList.add(resolvedTheme)

    // Establecer atributo data-theme
    root.setAttribute(THEME_ATTRIBUTE, resolvedTheme)

    // Actualizar meta theme-color para móviles
    this.updateThemeColor(resolvedTheme)
  }

  // Actualizar color del tema para móviles
  private updateThemeColor(theme: 'light' | 'dark'): void {
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    const color = theme === 'dark' ? '#1f2937' : '#ffffff'

    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', color)
    } else {
      const meta = document.createElement('meta')
      meta.name = 'theme-color'
      meta.content = color
      document.head.appendChild(meta)
    }
  }

  // Escuchar cambios en la preferencia del sistema
  watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
    if (typeof window === 'undefined') return () => {}

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handler = (e: MediaQueryListEvent) => {
      callback(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handler)

    // Retornar función de limpieza
    return () => {
      mediaQuery.removeEventListener('change', handler)
    }
  }
}

// Hook para gestión de tema
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [isLoading, setIsLoading] = useState(true)

  const themeManager = ThemeManager.getInstance()

  // Inicializar tema
  useEffect(() => {
    const storedTheme = themeManager.getStoredTheme()
    const resolved = themeManager.resolveTheme(storedTheme)

    setThemeState(storedTheme)
    setResolvedTheme(resolved)
    themeManager.applyTheme(storedTheme)
    setIsLoading(false)
  }, [])

  // Escuchar cambios en la preferencia del sistema
  useEffect(() => {
    const cleanup = themeManager.watchSystemTheme(systemTheme => {
      if (theme === 'system') {
        setResolvedTheme(systemTheme)
        themeManager.applyTheme('system')
      }
    })

    return cleanup
  }, [theme])

  // Función para cambiar tema
  const setTheme = (newTheme: Theme) => {
    const resolved = themeManager.resolveTheme(newTheme)

    setThemeState(newTheme)
    setResolvedTheme(resolved)
    themeManager.setStoredTheme(newTheme)
    themeManager.applyTheme(newTheme)
  }

  // Función para alternar entre light y dark
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  return {
    theme,
    resolvedTheme,
    isLoading,
    setTheme,
    toggleTheme,
  }
}

// Hook para obtener solo el tema resuelto (sin funciones de cambio)
export function useResolvedTheme(): 'light' | 'dark' {
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const themeManager = ThemeManager.getInstance()
    const storedTheme = themeManager.getStoredTheme()
    const resolved = themeManager.resolveTheme(storedTheme)

    setResolvedTheme(resolved)

    // Escuchar cambios en la preferencia del sistema
    const cleanup = themeManager.watchSystemTheme(systemTheme => {
      if (storedTheme === 'system') {
        setResolvedTheme(systemTheme)
      }
    })

    return cleanup
  }, [])

  return resolvedTheme
}

// Función para inicializar tema en el servidor (SSR)
export function getInitialTheme(): string {
  // Script que se ejecuta antes de que React se hidrate
  return `
    (function() {
      try {
        var theme = localStorage.getItem('${THEME_STORAGE_KEY}') || 'system';
        var resolvedTheme = theme;
        
        if (theme === 'system') {
          resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        document.documentElement.classList.add(resolvedTheme);
        document.documentElement.setAttribute('${THEME_ATTRIBUTE}', resolvedTheme);
        
        // Actualizar theme-color
        var themeColor = resolvedTheme === 'dark' ? '#1f2937' : '#ffffff';
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
          meta.setAttribute('content', themeColor);
        } else {
          meta = document.createElement('meta');
          meta.name = 'theme-color';
          meta.content = themeColor;
          document.head.appendChild(meta);
        }
      } catch (e) {
        console.warn('Error al inicializar tema:', e);
      }
    })();
  `
}

// Componente para inyectar script de inicialización
export function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: getInitialTheme(),
      }}
    />
  )
}

// Utilidades para CSS
export const themeVariables = {
  light: {
    '--background': '0 0% 100%',
    '--foreground': '222.2 84% 4.9%',
    '--card': '0 0% 100%',
    '--card-foreground': '222.2 84% 4.9%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '222.2 84% 4.9%',
    '--primary': '222.2 47.4% 11.2%',
    '--primary-foreground': '210 40% 98%',
    '--secondary': '210 40% 96%',
    '--secondary-foreground': '222.2 84% 4.9%',
    '--muted': '210 40% 96%',
    '--muted-foreground': '215.4 16.3% 46.9%',
    '--accent': '210 40% 96%',
    '--accent-foreground': '222.2 84% 4.9%',
    '--destructive': '0 84.2% 60.2%',
    '--destructive-foreground': '210 40% 98%',
    '--border': '214.3 31.8% 91.4%',
    '--input': '214.3 31.8% 91.4%',
    '--ring': '222.2 84% 4.9%',
  },
  dark: {
    '--background': '222.2 84% 4.9%',
    '--foreground': '210 40% 98%',
    '--card': '222.2 84% 4.9%',
    '--card-foreground': '210 40% 98%',
    '--popover': '222.2 84% 4.9%',
    '--popover-foreground': '210 40% 98%',
    '--primary': '210 40% 98%',
    '--primary-foreground': '222.2 47.4% 11.2%',
    '--secondary': '217.2 32.6% 17.5%',
    '--secondary-foreground': '210 40% 98%',
    '--muted': '217.2 32.6% 17.5%',
    '--muted-foreground': '215 20.2% 65.1%',
    '--accent': '217.2 32.6% 17.5%',
    '--accent-foreground': '210 40% 98%',
    '--destructive': '0 62.8% 30.6%',
    '--destructive-foreground': '210 40% 98%',
    '--border': '217.2 32.6% 17.5%',
    '--input': '217.2 32.6% 17.5%',
    '--ring': '212.7 26.8% 83.9%',
  },
}

export default ThemeManager
