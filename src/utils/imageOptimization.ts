// ===================================
// PINTEYA E-COMMERCE - IMAGE OPTIMIZATION UTILITY
// ===================================

/**
 * Configuración de optimización para imágenes del proyecto
 * Especialmente para logos y elementos del header mobile
 */

export const imageOptimizationConfig = {
  // Configuración para logos
  logo: {
    mobile: {
      width: 40,
      height: 40,
      quality: 90,
      format: 'webp' as const,
      fallback: 'png' as const,
    },
    desktop: {
      width: 160,
      height: 32,
      quality: 90,
      format: 'svg' as const,
    },
  },

  // Configuración para iconos
  icons: {
    width: 24,
    height: 24,
    quality: 85,
    format: 'webp' as const,
  },

  // Configuración para imágenes de productos
  products: {
    thumbnail: {
      width: 300,
      height: 300,
      quality: 80,
      format: 'webp' as const,
    },
    full: {
      width: 800,
      height: 800,
      quality: 85,
      format: 'webp' as const,
    },
  },
}

/**
 * Genera las props optimizadas para Next.js Image component
 */
export const getOptimizedImageProps = (
  src: string,
  alt: string,
  config: typeof imageOptimizationConfig.logo.mobile
) => {
  return {
    src,
    alt,
    width: config.width,
    height: config.height,
    quality: config.quality,
    priority: true, // Para logos importantes
    placeholder: 'blur' as const,
    blurDataURL:
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  }
}

/**
 * Configuración específica para el logo mobile de Pinteya
 * Usa el logo POSITIVO.svg (versión principal) para consistencia con desktop
 * Sin sombras para un diseño más limpio
 */
export const pinteyaMobileLogoProps = {
  src: '/images/logo/LOGO POSITIVO.svg',
  alt: 'Pinteya - Tu Pinturería Online',
  width: 64,
  height: 64,
  priority: true,
  className: 'rounded-xl object-contain',
  quality: 90,
}

/**
 * Configuración específica para el logo desktop de Pinteya
 * Usa el logo POSITIVO.svg (versión principal) para el header
 */
export const pinteyaDesktopLogoProps = {
  src: '/images/logo/LOGO POSITIVO.svg',
  alt: 'Pinteya - Tu Pinturería Online',
  width: 200,
  height: 56,
  priority: true,
  className: 'object-contain',
}

/**
 * Configuración específica para el logo hero de Pinteya
 * Optimizado para secciones principales y landing pages
 */
export const pinteyaHeroLogoProps = {
  src: '/images/logo/optimized/LogoPinteYa-hero.webp',
  alt: 'Pinteya - Tu Pinturería Online',
  width: 320,
  height: 80,
  priority: true,
  className: 'object-contain',
  quality: 95,
  placeholder: 'blur' as const,
  blurDataURL:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
}

/**
 * Configuración alternativa para el logo desktop optimizado
 * (Para casos donde se prefiera usar el LogoPinteYa optimizado en desktop)
 */
export const pinteyaDesktopOptimizedLogoProps = {
  src: '/images/logo/optimized/LogoPinteYa-desktop.webp',
  alt: 'Pinteya - Tu Pinturería Online',
  width: 160,
  height: 40,
  priority: true,
  className: 'object-contain',
  quality: 90,
  placeholder: 'blur' as const,
  blurDataURL:
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
}

/**
 * Configuración para fallbacks PNG (compatibilidad con navegadores antiguos)
 */
export const pinteyaMobileLogoPngProps = {
  ...pinteyaMobileLogoProps,
  src: '/images/logo/optimized/LogoPinteYa-mobile.png',
}

export const pinteyaDesktopLogoPngProps = {
  ...pinteyaDesktopLogoProps,
  src: '/images/logo/LOGO POSITIVO.svg', // Mantiene el SVG original
}

// ===================================
// MULTITENANT LOGO SUPPORT
// ===================================

export type LogoVariant = 'mobile' | 'desktop' | 'hero'

/**
 * Genera las props del logo para un tenant específico
 * Usa la estructura de assets: /tenants/{slug}/logo.svg
 * 
 * @param tenantSlug - El slug del tenant (ej: 'pinteya', 'pintemas')
 * @param tenantName - El nombre del tenant para el alt text
 * @param variant - La variante del logo ('mobile', 'desktop', 'hero')
 * @returns Props optimizadas para el componente de logo
 */
export const getTenantLogoProps = (
  tenantSlug: string,
  tenantName: string,
  variant: LogoVariant = 'desktop'
) => {
  const basePath = `/tenants/${tenantSlug}`
  
  const variantConfigs = {
    mobile: {
      src: `${basePath}/logo.svg`,
      alt: `${tenantName} - Logo`,
      width: 64,
      height: 64,
      priority: true,
      className: 'rounded-xl object-contain',
      quality: 90,
    },
    desktop: {
      src: `${basePath}/logo.svg`,
      alt: `${tenantName} - Logo`,
      width: 200,
      height: 56,
      priority: true,
      className: 'object-contain',
    },
    hero: {
      src: `${basePath}/logo.svg`,
      alt: `${tenantName} - Logo`,
      width: 320,
      height: 80,
      priority: true,
      className: 'object-contain',
      quality: 95,
    },
  }

  return variantConfigs[variant]
}

/**
 * Genera las rutas de assets para un tenant
 * 
 * @param tenantSlug - El slug del tenant
 * @returns Objeto con todas las rutas de assets del tenant
 */
export const getTenantAssetPaths = (tenantSlug: string) => {
  const basePath = `/tenants/${tenantSlug}`
  
  return {
    logo: `${basePath}/logo.svg`,
    logoDark: `${basePath}/logo-dark.svg`,
    favicon: `${basePath}/favicon.svg`,
    ogImage: `${basePath}/og-image.png`,
    heroImage: (index: number) => `${basePath}/hero/hero${index}.webp`,
  }
}

/**
 * Obtiene las rutas de hero images para un tenant
 * 
 * @param tenantSlug - El slug del tenant
 * @param count - Número de hero images (default: 3)
 * @returns Array de objetos con rutas de hero images
 */
export const getTenantHeroSlides = (tenantSlug: string, count: number = 3) => {
  const basePath = `/tenants/${tenantSlug}/hero`
  
  return Array.from({ length: count }, (_, i) => ({
    id: `hero-${i + 1}`,
    image: `${basePath}/hero${i + 1}.webp`,
    alt: `Hero image ${i + 1}`,
  }))
}
