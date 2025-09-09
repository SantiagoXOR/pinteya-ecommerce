"use client"

import { useState, useEffect, useCallback } from 'react'
import { ThemeConfig, ComponentSize, ComponentVariant } from '../ui/types'

// Configuración por defecto del design system
const defaultThemeConfig: ThemeConfig = {
  colors: {
    primary: '#000000',
    secondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    background: '#ffffff',
    surface: '#f9fafb',
    text: '#111827',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
  },
  borderRadius: '0.375rem',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
}

// Configuraciones predefinidas
const presetConfigs = {
  default: defaultThemeConfig,
  dark: {
    ...defaultThemeConfig,
    colors: {
      ...defaultThemeConfig.colors,
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      textSecondary: '#cbd5e1',
      border: '#334155',
    },
  },
  minimal: {
    ...defaultThemeConfig,
    borderRadius: '0.125rem',
    colors: {
      ...defaultThemeConfig.colors,
      primary: '#374151',
      secondary: '#9ca3af',
    },
  },
  colorful: {
    ...defaultThemeConfig,
    colors: {
      ...defaultThemeConfig.colors,
      primary: '#7c3aed',
      secondary: '#06b6d4',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    },
  },
} as const

type PresetName = keyof typeof presetConfigs

interface DesignSystemState {
  theme: ThemeConfig
  currentPreset: PresetName
  customizations: Partial<ThemeConfig>
  componentDefaults: {
    button: {
      size: ComponentSize
      variant: ComponentVariant
    }
    input: {
      size: ComponentSize
    }
    badge: {
      variant: ComponentVariant
    }
  }
}

const initialState: DesignSystemState = {
  theme: defaultThemeConfig,
  currentPreset: 'default',
  customizations: {},
  componentDefaults: {
    button: {
      size: 'md',
      variant: 'default',
    },
    input: {
      size: 'md',
    },
    badge: {
      variant: 'default',
    },
  },
}

export function useDesignSystemConfig() {
  const [state, setState] = useState<DesignSystemState>(initialState)

  // Cargar configuración desde localStorage al montar
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('design-system-config')
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        setState(prevState => ({ ...prevState, ...parsed }))
      }
    } catch (error) {
      console.warn('Error loading design system config:', error)
    }
  }, [])

  // Guardar configuración en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem('design-system-config', JSON.stringify(state))
    } catch (error) {
      console.warn('Error saving design system config:', error)
    }
  }, [state])

  // Aplicar preset
  const applyPreset = useCallback((presetName: PresetName) => {
    const preset = presetConfigs[presetName]
    setState(prevState => ({
      ...prevState,
      theme: { ...preset, ...prevState.customizations },
      currentPreset: presetName,
    }))
  }, [])

  // Actualizar tema personalizado
  const updateTheme = useCallback((updates: Partial<ThemeConfig>) => {
    setState(prevState => {
      const newCustomizations = { ...prevState.customizations, ...updates }
      return {
        ...prevState,
        theme: { ...presetConfigs[prevState.currentPreset], ...newCustomizations },
        customizations: newCustomizations,
      }
    })
  }, [])

  // Actualizar colores específicos
  const updateColors = useCallback((colors: Partial<ThemeConfig['colors']>) => {
    updateTheme({ colors: { ...state.theme.colors, ...colors } })
  }, [state.theme.colors, updateTheme])

  // Actualizar defaults de componentes
  const updateComponentDefaults = useCallback(
    (component: keyof DesignSystemState['componentDefaults'], defaults: any) => {
      setState(prevState => ({
        ...prevState,
        componentDefaults: {
          ...prevState.componentDefaults,
          [component]: { ...prevState.componentDefaults[component], ...defaults },
        },
      }))
    },
    []
  )

  // Resetear a configuración por defecto
  const resetToDefault = useCallback(() => {
    setState(initialState)
    localStorage.removeItem('design-system-config')
  }, [])

  // Exportar configuración actual
  const exportConfig = useCallback(() => {
    return JSON.stringify(state, null, 2)
  }, [state])

  // Importar configuración
  const importConfig = useCallback((configJson: string) => {
    try {
      const config = JSON.parse(configJson)
      setState(config)
      return true
    } catch (error) {
      console.error('Error importing config:', error)
      return false
    }
  }, [])

  // Generar CSS variables para el tema actual
  const getCSSVariables = useCallback(() => {
    const { colors, fontSize, spacing } = state.theme
    return {
      '--color-primary': colors.primary,
      '--color-secondary': colors.secondary,
      '--color-success': colors.success,
      '--color-warning': colors.warning,
      '--color-error': colors.error,
      '--color-info': colors.info,
      '--color-background': colors.background,
      '--color-surface': colors.surface,
      '--color-text': colors.text,
      '--color-text-secondary': colors.textSecondary,
      '--color-border': colors.border,
      '--font-size-xs': fontSize.xs,
      '--font-size-sm': fontSize.sm,
      '--font-size-base': fontSize.base,
      '--font-size-lg': fontSize.lg,
      '--font-size-xl': fontSize.xl,
      '--font-size-2xl': fontSize['2xl'],
      '--font-size-3xl': fontSize['3xl'],
      '--spacing-xs': spacing.xs,
      '--spacing-sm': spacing.sm,
      '--spacing-md': spacing.md,
      '--spacing-lg': spacing.lg,
      '--spacing-xl': spacing.xl,
      '--spacing-2xl': spacing['2xl'],
    }
  }, [state.theme])

  return {
    // Estado actual
    theme: state.theme,
    currentPreset: state.currentPreset,
    customizations: state.customizations,
    componentDefaults: state.componentDefaults,
    
    // Presets disponibles
    availablePresets: Object.keys(presetConfigs) as PresetName[],
    
    // Acciones
    applyPreset,
    updateTheme,
    updateColors,
    updateComponentDefaults,
    resetToDefault,
    exportConfig,
    importConfig,
    getCSSVariables,
    
    // Utilidades
    isCustomized: Object.keys(state.customizations).length > 0,
    isDarkMode: state.currentPreset === 'dark',
  }
}