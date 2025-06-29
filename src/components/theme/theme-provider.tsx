"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  Theme,
  ThemeMode,
  ThemeContext as ThemeContextType,
  lightTheme,
  darkTheme,
  useSystemTheme,
  applyThemeVariables,
  getTheme,
  saveThemePreference,
  loadThemePreference,
} from '@/lib/theme-system'

interface ThemeProviderContextType {
  theme: Theme
  mode: ThemeMode
  context: ThemeContextType
  setMode: (mode: ThemeMode) => void
  setContext: (context: ThemeContextType) => void
  toggleMode: () => void
}

const ThemeProviderContext = createContext<ThemeProviderContextType | null>(null)

export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider')
  }
  return context
}

interface ThemeProviderProps {
  children: React.ReactNode
  defaultMode?: ThemeMode
  defaultContext?: ThemeContextType
  enablePersistence?: boolean
}

export function ThemeProvider({
  children,
  defaultMode = 'light',
  defaultContext = 'default',
  enablePersistence = true,
}: ThemeProviderProps) {
  const systemTheme = useSystemTheme()
  const [mode, setModeState] = useState<ThemeMode>(defaultMode)
  const [context, setContextState] = useState<ThemeContextType>(defaultContext)
  const [mounted, setMounted] = useState(false)

  // Cargar preferencias guardadas
  useEffect(() => {
    if (enablePersistence) {
      const { mode: savedMode, context: savedContext } = loadThemePreference()
      setModeState(savedMode)
      setContextState(savedContext)
    }
    setMounted(true)
  }, [enablePersistence])

  // Obtener tema actual
  const theme = getTheme(mode, context, systemTheme)

  // Aplicar variables CSS cuando cambie el tema
  useEffect(() => {
    if (mounted) {
      applyThemeVariables(theme)
      
      // Aplicar clase al body para el modo
      const resolvedMode = mode === 'auto' ? systemTheme : mode
      document.body.classList.remove('light', 'dark')
      document.body.classList.add(resolvedMode)
      
      // Aplicar clase para el contexto
      document.body.classList.remove('theme-default', 'theme-ecommerce', 'theme-admin', 'theme-mobile')
      document.body.classList.add(`theme-${context}`)
    }
  }, [theme, mode, context, systemTheme, mounted])

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    if (enablePersistence) {
      saveThemePreference(newMode, context)
    }
  }

  const setContext = (newContext: ThemeContextType) => {
    setContextState(newContext)
    if (enablePersistence) {
      saveThemePreference(mode, newContext)
    }
  }

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light'
    setMode(newMode)
  }

  // Evitar hidration mismatch
  if (!mounted) {
    return (
      <div className="opacity-0">
        {children}
      </div>
    )
  }

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        mode,
        context,
        setMode,
        setContext,
        toggleMode,
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  )
}

/**
 * Componente para cambiar el modo del tema
 */
export function ThemeModeToggle() {
  const { mode, toggleMode } = useTheme()
  
  return (
    <button
      onClick={toggleMode}
      className="p-2 rounded-md border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800 transition-colors"
      aria-label={`Cambiar a modo ${mode === 'light' ? 'oscuro' : 'claro'}`}
    >
      {mode === 'light' ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )}
    </button>
  )
}

/**
 * Selector de contexto del tema
 */
export function ThemeContextSelector() {
  const { context, setContext } = useTheme()
  
  const contexts: { value: ThemeContextType; label: string }[] = [
    { value: 'default', label: 'Por defecto' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'admin', label: 'Administración' },
    { value: 'mobile', label: 'Móvil' },
  ]
  
  return (
    <select
      value={context}
      onChange={(e) => setContext(e.target.value as ThemeContextType)}
      className="px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 text-sm"
    >
      {contexts.map((ctx) => (
        <option key={ctx.value} value={ctx.value}>
          {ctx.label}
        </option>
      ))}
    </select>
  )
}

/**
 * Panel de configuración del tema
 */
export function ThemeConfigPanel() {
  const { mode, setMode, context, setContext, theme } = useTheme()
  
  const modes: { value: ThemeMode; label: string }[] = [
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
    { value: 'auto', label: 'Automático' },
  ]
  
  return (
    <div className="p-4 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 space-y-4">
      <h3 className="text-lg font-semibold">Configuración del Tema</h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-2">Modo</label>
          <div className="flex gap-2">
            {modes.map((modeOption) => (
              <button
                key={modeOption.value}
                onClick={() => setMode(modeOption.value)}
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  mode === modeOption.value
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {modeOption.label}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Contexto</label>
          <ThemeContextSelector />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Vista previa</label>
          <div className="grid grid-cols-4 gap-2">
            <div 
              className="w-8 h-8 rounded border"
              style={{ backgroundColor: theme.colors.primary[500] }}
              title="Color primario"
            />
            <div 
              className="w-8 h-8 rounded border"
              style={{ backgroundColor: theme.colors.background.primary }}
              title="Fondo primario"
            />
            <div 
              className="w-8 h-8 rounded border"
              style={{ backgroundColor: theme.colors.ecommerce.price.current }}
              title="Color de precio"
            />
            <div 
              className="w-8 h-8 rounded border"
              style={{ backgroundColor: theme.colors.ecommerce.stock.available }}
              title="Color de stock"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
