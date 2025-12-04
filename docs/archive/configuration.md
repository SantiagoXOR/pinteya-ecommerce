# 🔧 Configuración - Design System Pinteya

> Configuración avanzada y personalización del Design System para diferentes entornos y necesidades

## 📋 Índice

- [⚙️ Configuración Base](#️-configuración-base)
- [🎨 Personalización de Tokens](#-personalización-de-tokens)
- [🔧 Configuración Avanzada](#-configuración-avanzada)
- [🌍 Entornos](#-entornos)
- [📱 Responsive Configuration](#-responsive-configuration)
- [🎭 Temas y Variantes](#-temas-y-variantes)

---

## ⚙️ Configuración Base

### Variables de Entorno

```env
# .env.local
# Design System Configuration
NEXT_PUBLIC_DESIGN_SYSTEM_VERSION=1.0.0
NEXT_PUBLIC_THEME_MODE=light
NEXT_PUBLIC_ENABLE_ANIMATIONS=true
NEXT_PUBLIC_ENABLE_3D_ICONS=true

# Feature Flags
NEXT_PUBLIC_ENABLE_STORYBOOK=true
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING=true
```

### Configuración de Next.js

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Design System optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/components/ui'],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization for design assets
  images: {
    domains: ['aakzspzfulgftqlgwkpb.supabase.co', 'localhost'],
    formats: ['image/webp', 'image/avif'],
  },

  // Headers for design assets
  async headers() {
    return [
      {
        source: '/design-system/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

---

## 🎨 Personalización de Tokens

### Configuración de Colores

```typescript
// lib/design-tokens.ts
export const designTokens = {
  colors: {
    // Brand Colors
    brand: {
      primary: '#f27a1d', // blaze-orange-500
      secondary: '#00f269', // fun-green-500
      accent: '#f9a007', // bright-sun-500
    },

    // Semantic Colors
    semantic: {
      success: '#22ad5c',
      error: '#f23030',
      warning: '#fbbf24',
      info: '#3b82f6',
    },

    // Neutral Colors
    neutral: {
      white: '#ffffff',
      gray: {
        50: '#f8f9fa',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#374151',
        900: '#1f2937',
      },
    },
  },

  // Typography Scale
  typography: {
    fontFamily: {
      primary: ['Inter', 'sans-serif'],
      secondary: ['Euclid Circular A', 'sans-serif'],
    },
    fontSize: {
      '2xs': ['10px', '17px'],
      xs: ['12px', '20px'],
      sm: ['14px', '22px'],
      base: ['16px', '24px'],
      lg: ['18px', '24px'],
      xl: ['20px', '24px'],
      '2xl': ['24px', '34px'],
      '3xl': ['30px', '38px'],
      '4xl': ['36px', '48px'],
      '5xl': ['48px', '64px'],
      '6xl': ['60px', '72px'],
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Spacing Scale
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '2px',
    md: '4px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    full: '9999px',
    button: '5px',
    card: '10px',
    modal: '12px',
  },

  // Shadows
  boxShadow: {
    1: '0px 1px 2px 0px rgba(166, 175, 195, 0.25)',
    2: '0px 6px 24px 0px rgba(235, 238, 251, 0.40), 0px 2px 4px 0px rgba(148, 163, 184, 0.05)',
    3: '0px 2px 16px 0px rgba(13, 10, 44, 0.12)',
    input: 'inset 0 0 0 2px #fc9d04',
  },

  // Animations
  animation: {
    duration: {
      fast: '150ms',
      normal: '200ms',
      slow: '300ms',
      slower: '500ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
}
```

### Aplicar Tokens a Tailwind

```typescript
// tailwind.config.ts
import { designTokens } from './lib/design-tokens'

const config: Config = {
  theme: {
    extend: {
      colors: designTokens.colors,
      fontSize: designTokens.typography.fontSize,
      fontFamily: designTokens.typography.fontFamily,
      fontWeight: designTokens.typography.fontWeight,
      spacing: designTokens.spacing,
      borderRadius: designTokens.borderRadius,
      boxShadow: designTokens.boxShadow,
      transitionDuration: designTokens.animation.duration,
      transitionTimingFunction: designTokens.animation.easing,
    },
  },
}
```

---

## 🔧 Configuración Avanzada

### CSS Custom Properties

```css
/* globals.css */
:root {
  /* Design System CSS Variables */
  --ds-color-primary: #fc9d04;
  --ds-color-primary-hover: #ef7d00;
  --ds-color-primary-active: #b95004;

  --ds-color-secondary: #2c5f5d;
  --ds-color-accent: #ffd448;

  --ds-spacing-unit: 4px;
  --ds-border-radius-base: 5px;
  --ds-animation-duration: 200ms;
  --ds-animation-easing: cubic-bezier(0, 0, 0.2, 1);

  /* Component specific variables */
  --button-height-sm: 32px;
  --button-height-md: 36px;
  --button-height-lg: 40px;
  --button-height-xl: 48px;

  --card-padding: 24px;
  --card-border-radius: 10px;

  --input-height: 36px;
  --input-border-radius: 4px;
}

/* Dark mode support (future) */
[data-theme='dark'] {
  --ds-color-primary: #ffd448;
  --ds-color-background: #1f2937;
  --ds-color-text: #f9fafb;
}
```

### Component Configuration

```typescript
// lib/component-config.ts
export const componentConfig = {
  button: {
    defaultVariant: 'primary' as const,
    defaultSize: 'md' as const,
    enableRipple: true,
    enableHapticFeedback: false,
  },

  card: {
    defaultVariant: 'default' as const,
    defaultPadding: 'md' as const,
    enableHover: true,
    hoverEffect: 'lift' as const,
  },

  input: {
    defaultSize: 'md' as const,
    enableFloatingLabel: false,
    enableValidationIcons: true,
  },

  badge: {
    defaultSize: 'md' as const,
    enableAnimations: true,
    defaultAnimation: 'none' as const,
  },

  modal: {
    enableBackdropBlur: true,
    enableEscapeKey: true,
    enableClickOutside: true,
    animationDuration: 200,
  },
}
```

---

## 🌍 Entornos

### Desarrollo

```typescript
// config/development.ts
export const developmentConfig = {
  enableDebugMode: true,
  enableStorybook: true,
  enableHotReload: true,
  enableSourceMaps: true,
  enablePerformanceMonitoring: false,

  // Design System specific
  enableDesignTokensInspector: true,
  enableComponentOutlines: false,
  enableAccessibilityHighlights: true,
}
```

### Staging

```typescript
// config/staging.ts
export const stagingConfig = {
  enableDebugMode: false,
  enableStorybook: true,
  enableHotReload: false,
  enableSourceMaps: true,
  enablePerformanceMonitoring: true,

  // Design System specific
  enableDesignTokensInspector: false,
  enableComponentOutlines: false,
  enableAccessibilityHighlights: false,
}
```

### Producción

```typescript
// config/production.ts
export const productionConfig = {
  enableDebugMode: false,
  enableStorybook: false,
  enableHotReload: false,
  enableSourceMaps: false,
  enablePerformanceMonitoring: true,

  // Design System specific
  enableDesignTokensInspector: false,
  enableComponentOutlines: false,
  enableAccessibilityHighlights: false,

  // Optimizations
  enableTreeShaking: true,
  enableCodeSplitting: true,
  enableImageOptimization: true,
  enableCSSMinification: true,
}
```

---

## 📱 Responsive Configuration

### Breakpoints Personalizados

```typescript
// lib/breakpoints.ts
export const breakpoints = {
  // Mobile first approach
  xs: '320px', // Móviles muy pequeños
  sm: '640px', // Móviles grandes
  md: '768px', // Tablets
  lg: '1024px', // Desktop pequeño
  xl: '1280px', // Desktop grande
  '2xl': '1536px', // Desktop extra grande

  // Custom breakpoints para Pinteya
  mobile: '640px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
}

// Responsive utilities
export const responsive = {
  // Container sizes
  container: {
    xs: '100%',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Grid columns
  grid: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6,
  },

  // Typography scale per breakpoint
  typography: {
    xs: {
      h1: ['24px', '32px'],
      h2: ['20px', '28px'],
      h3: ['18px', '24px'],
      body: ['14px', '20px'],
    },
    lg: {
      h1: ['48px', '56px'],
      h2: ['36px', '44px'],
      h3: ['28px', '36px'],
      body: ['16px', '24px'],
    },
  },
}
```

### Media Queries Helper

```typescript
// lib/media-queries.ts
export const mediaQueries = {
  mobile: `@media (max-width: ${breakpoints.sm})`,
  tablet: `@media (min-width: ${breakpoints.sm}) and (max-width: ${breakpoints.lg})`,
  desktop: `@media (min-width: ${breakpoints.lg})`,

  // Touch devices
  touch: '@media (hover: none) and (pointer: coarse)',
  mouse: '@media (hover: hover) and (pointer: fine)',

  // Accessibility
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  highContrast: '@media (prefers-contrast: high)',
  darkMode: '@media (prefers-color-scheme: dark)',
}
```

---

## 🎭 Temas y Variantes

### Configuración de Temas

```typescript
// lib/themes.ts
export const themes = {
  light: {
    name: 'light',
    colors: {
      background: '#ffffff',
      foreground: '#1f2937',
      primary: '#f27a1d', // blaze-orange-500
      secondary: '#00f269', // fun-green-500
      muted: '#f3f4f6',
      accent: '#f9a007', // bright-sun-500
      destructive: '#f23030',
      success: '#00f269', // fun-green-500
      warning: '#f9a007', // bright-sun-500
      info: '#3b82f6',
    },
  },

  dark: {
    name: 'dark',
    colors: {
      background: '#1f2937',
      foreground: '#f9fafb',
      primary: '#f9be78', // blaze-orange-300
      secondary: '#69ffb2', // fun-green-300
      muted: '#374151',
      accent: '#ffd549', // bright-sun-300
      destructive: '#f87171',
      success: '#69ffb2', // fun-green-300
      warning: '#ffd549', // bright-sun-300
      info: '#60a5fa',
    },
  },

  // Tema específico para pinturería
  paint: {
    name: 'paint',
    colors: {
      background: '#fef7ee', // blaze-orange-50
      foreground: '#411709', // blaze-orange-950
      primary: '#f27a1d', // blaze-orange-500
      secondary: '#00f269', // fun-green-500
      muted: '#feeed6', // blaze-orange-100
      accent: '#f9a007', // bright-sun-500
      destructive: '#f23030',
      success: '#00f269', // fun-green-500
      warning: '#f9a007', // bright-sun-500
      info: '#3b82f6',
    },
  },
}
```

### Theme Provider

```tsx
// components/theme-provider.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { themes } from '@/lib/themes'

type Theme = keyof typeof themes
type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  themes: typeof themes
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    const themeColors = themes[theme].colors

    Object.entries(themeColors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value)
    })

    root.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

---

## 🎯 Configuración de Performance

### Bundle Optimization

```javascript
// webpack.config.js (si usas webpack personalizado)
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        designSystem: {
          test: /[\\/]components[\\/]ui[\\/]/,
          name: 'design-system',
          chunks: 'all',
          priority: 10,
        },
      },
    },
  },
}
```

### CSS Optimization

```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: 'default',
      },
    }),
  },
}
```

---

_Última actualización: Junio 2025_
