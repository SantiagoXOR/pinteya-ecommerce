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
 */
export const pinteyaMobileLogoProps = {
  src: '/images/logo/logoPinteYaF.png',
  alt: 'Pinteya - Tu Pinturería Online',
  width: 44,
  height: 44,
  priority: true,
  className: 'rounded-xl shadow-lg',
  style: {
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
  }
};

/**
 * Configuración específica para el logo desktop de Pinteya
 */
export const pinteyaDesktopLogoProps = {
  src: '/images/logo/LOGO POSITIVO.svg',
  alt: 'Pinteya Logo',
  width: 160,
  height: 32,
  priority: true,
};
