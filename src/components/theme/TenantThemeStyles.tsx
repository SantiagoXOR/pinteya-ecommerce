// =====================================================
// TENANT THEME STYLES
// Descripción: Server Component que genera CSS variables
// dinámicas basadas en la configuración del tenant
// =====================================================

import type { TenantPublicConfig } from '@/lib/tenant/types'

interface TenantThemeStylesProps {
  tenant: TenantPublicConfig
}

/**
 * Convierte un color HEX a HSL para uso en CSS variables
 */
function hexToHSL(hex: string): string {
  // Remover # si existe
  const cleanHex = hex.replace('#', '')
  
  // Convertir a RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255
  
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2
  
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  
  // Retornar en formato HSL sin la función hsl()
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * Server Component que inyecta CSS variables del tenant
 */
export function TenantThemeStyles({ tenant }: TenantThemeStylesProps) {
  // Generar CSS variables
  const cssVariables = `
    :root {
      /* =================================
         COLORES DEL TENANT - HEX
         ================================= */
      --tenant-primary: ${tenant.primaryColor};
      --tenant-primary-dark: ${tenant.primaryDark};
      --tenant-primary-light: ${tenant.primaryLight};
      --tenant-secondary: ${tenant.secondaryColor};
      --tenant-accent: ${tenant.accentColor};
      --tenant-header-bg: ${tenant.headerBgColor};
      --tenant-gradient-start: ${tenant.backgroundGradientStart};
      --tenant-gradient-end: ${tenant.backgroundGradientEnd};
      
      /* =================================
         COLORES DEL TENANT - HSL
         Para compatibilidad con Tailwind
         ================================= */
      --tenant-primary-hsl: ${hexToHSL(tenant.primaryColor)};
      --tenant-primary-dark-hsl: ${hexToHSL(tenant.primaryDark)};
      --tenant-primary-light-hsl: ${hexToHSL(tenant.primaryLight)};
      --tenant-secondary-hsl: ${hexToHSL(tenant.secondaryColor)};
      --tenant-accent-hsl: ${hexToHSL(tenant.accentColor)};
      
      /* =================================
         MAPEO A BLAZE-ORANGE (compatibilidad)
         ================================= */
      --blaze-orange-50: ${tenant.primaryLight}1a;
      --blaze-orange-100: ${tenant.primaryLight}33;
      --blaze-orange-200: ${tenant.primaryLight}66;
      --blaze-orange-300: ${tenant.primaryLight};
      --blaze-orange-400: ${tenant.primaryColor};
      --blaze-orange-500: ${tenant.primaryColor};
      --blaze-orange-600: ${tenant.primaryDark};
      --blaze-orange-700: ${tenant.primaryDark};
      --blaze-orange-800: ${tenant.primaryDark}cc;
      --blaze-orange-900: ${tenant.primaryDark}99;
      
      /* =================================
         VARIABLES DEL TEMA
         ================================= */
      --tenant-border-radius: ${tenant.themeConfig.borderRadius};
      --tenant-font-family: "${tenant.themeConfig.fontFamily}", sans-serif;
      
      /* =================================
         OVERRIDE DE VARIABLES SHADCN/UI
         ================================= */
      --primary: ${hexToHSL(tenant.primaryColor)};
      --primary-foreground: 0 0% 100%;
    }
    
    /* =================================
       ESTILOS GLOBALES DEL TENANT
       ================================= */
    
    /* Header dinámico */
    header,
    .header-bg {
      background-color: var(--tenant-header-bg) !important;
    }
    
    /* Botones primarios */
    .btn-primary,
    .bg-blaze-orange-500,
    .bg-blaze-orange-600 {
      background-color: var(--tenant-primary) !important;
    }
    
    .btn-primary:hover,
    .hover\\:bg-blaze-orange-600:hover,
    .hover\\:bg-blaze-orange-700:hover {
      background-color: var(--tenant-primary-dark) !important;
    }
    
    /* Textos de color primario */
    .text-blaze-orange-500,
    .text-blaze-orange-600 {
      color: var(--tenant-primary) !important;
    }
    
    .text-blaze-orange-700 {
      color: var(--tenant-primary-dark) !important;
    }
    
    /* Bordes */
    .border-blaze-orange-500,
    .border-blaze-orange-600 {
      border-color: var(--tenant-primary) !important;
    }
    
    /* Focus rings */
    .ring-blaze-orange-500,
    .focus\\:ring-blaze-orange-500:focus {
      --tw-ring-color: var(--tenant-primary) !important;
    }
    
    /* Gradientes del body */
    .gradient-bg,
    .bg-gradient-body {
      background: linear-gradient(
        to bottom,
        var(--tenant-gradient-start) 0%,
        var(--tenant-gradient-start) 60%,
        var(--tenant-gradient-end) 100%
      ) !important;
    }
  `
  
  return (
    <style
      id="tenant-theme-styles"
      dangerouslySetInnerHTML={{ __html: cssVariables }}
    />
  )
}

/**
 * Genera el CSS inline para SSR (sin hydration mismatch)
 */
export function getTenantThemeCSS(tenant: TenantPublicConfig): string {
  return `
    :root {
      --tenant-primary: ${tenant.primaryColor};
      --tenant-primary-dark: ${tenant.primaryDark};
      --tenant-primary-light: ${tenant.primaryLight};
      --tenant-secondary: ${tenant.secondaryColor};
      --tenant-accent: ${tenant.accentColor};
      --tenant-header-bg: ${tenant.headerBgColor};
      --tenant-gradient-start: ${tenant.backgroundGradientStart};
      --tenant-gradient-end: ${tenant.backgroundGradientEnd};
      --tenant-primary-hsl: ${hexToHSL(tenant.primaryColor)};
      --primary: ${hexToHSL(tenant.primaryColor)};
      --primary-foreground: 0 0% 100%;
    }
  `
}
