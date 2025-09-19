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
    }
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
    }
  }
};

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
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  };
};

/**
 * Configuración específica para el logo mobile de Pinteya
 * Optimizado para dispositivos móviles con tamaño cuadrado
 */
export const pinteyaMobileLogoProps = {
  src: '/images/logo/optimized/LogoPinteYa-mobile.webp',
  alt: 'Pinteya - Tu Pinturería Online',
  width: 64,
  height: 64,
  priority: true,
  className: 'rounded-xl shadow-lg object-contain',
  style: {
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
  },
  quality: 90,
  placeholder: 'blur' as const,
  blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
};

/**
 * Configuración específica para el logo desktop de Pinteya
 * Usa el logo POSITIVO.svg para mantener consistencia con el diseño original
 */
export const pinteyaDesktopLogoProps = {
  src: '/images/logo/LOGO POSITIVO.svg',
  alt: 'Pinteya - Tu Pinturería Online',
  width: 160,
  height: 32,
  priority: true,
  className: 'object-contain'
};

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
  blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
};

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
  blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
};

/**
 * Configuración para fallbacks PNG (compatibilidad con navegadores antiguos)
 */
export const pinteyaMobileLogoPngProps = {
  ...pinteyaMobileLogoProps,
  src: '/images/logo/optimized/LogoPinteYa-mobile.png'
};

export const pinteyaDesktopLogoPngProps = {
  ...pinteyaDesktopLogoProps,
  src: '/images/logo/LOGO POSITIVO.svg' // Mantiene el SVG original
};









