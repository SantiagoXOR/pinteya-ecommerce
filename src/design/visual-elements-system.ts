/**
 * Sistema de Elementos Visuales para E-commerce
 * Iconografía, imágenes y componentes UI atractivos
 * Optimizado para experiencia visual coherente y profesional
 */

import { colorSystem } from './color-system';
import { typographySystem } from './typography-system';
import { spacingGridSystem } from './spacing-grid-system';

// Configuración de iconografía
export const iconography = {
  // Tamaños estándar de iconos
  sizes: {
    xs: '12px',   // Iconos muy pequeños
    sm: '16px',   // Iconos pequeños
    md: '20px',   // Iconos medianos (por defecto)
    lg: '24px',   // Iconos grandes
    xl: '32px',   // Iconos extra grandes
    '2xl': '48px', // Iconos de hero/destacados
    '3xl': '64px'  // Iconos de landing/marketing
  },
  
  // Estilos de iconos
  styles: {
    outline: {
      strokeWidth: '1.5px',
      fill: 'none',
      stroke: 'currentColor'
    },
    solid: {
      fill: 'currentColor',
      stroke: 'none'
    },
    duotone: {
      primaryOpacity: '1',
      secondaryOpacity: '0.4'
    }
  },
  
  // Categorías de iconos para e-commerce
  categories: {
    navigation: [
      'home', 'menu', 'search', 'filter', 'sort',
      'arrow-left', 'arrow-right', 'chevron-down', 'close'
    ],
    commerce: [
      'shopping-cart', 'shopping-bag', 'heart', 'star',
      'credit-card', 'truck', 'shield-check', 'gift'
    ],
    user: [
      'user', 'user-circle', 'login', 'logout',
      'settings', 'bell', 'mail', 'phone'
    ],
    product: [
      'eye', 'zoom-in', 'image', 'play',
      'share', 'bookmark', 'tag', 'percent'
    ],
    status: [
      'check', 'x', 'alert-triangle', 'info',
      'loading', 'clock', 'calendar', 'map-pin'
    ]
  },
  
  // Estados interactivos
  states: {
    default: {
      color: colorSystem.neutral[600],
      transition: 'all 0.2s ease'
    },
    hover: {
      color: colorSystem.primary[600],
      transform: 'scale(1.05)'
    },
    active: {
      color: colorSystem.primary[700],
      transform: 'scale(0.95)'
    },
    disabled: {
      color: colorSystem.neutral[300],
      opacity: '0.5',
      cursor: 'not-allowed'
    }
  }
};

// Sistema de imágenes optimizado
export const imageSystem = {
  // Aspectos ratio comunes
  aspectRatios: {
    square: '1:1',        // Productos, avatares
    portrait: '3:4',      // Productos verticales
    landscape: '4:3',     // Banners, categorías
    wide: '16:9',         // Hero images, videos
    ultrawide: '21:9',    // Banners promocionales
    golden: '1.618:1'     // Proporción áurea
  },
  
  // Tamaños responsivos
  sizes: {
    thumbnail: {
      width: '80px',
      height: '80px',
      quality: 75
    },
    small: {
      width: '200px',
      height: '200px',
      quality: 80
    },
    medium: {
      width: '400px',
      height: '400px',
      quality: 85
    },
    large: {
      width: '800px',
      height: '800px',
      quality: 90
    },
    hero: {
      width: '1200px',
      height: '600px',
      quality: 95
    }
  },
  
  // Efectos y filtros
  effects: {
    hover: {
      transform: 'scale(1.05)',
      transition: 'transform 0.3s ease',
      filter: 'brightness(1.1)'
    },
    loading: {
      background: colorSystem.neutral[200],
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    },
    overlay: {
      background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.7) 100%)',
      position: 'absolute',
      inset: '0'
    }
  },
  
  // Placeholders para imágenes faltantes
  placeholders: {
    product: {
      background: colorSystem.neutral[100],
      icon: 'image',
      iconColor: colorSystem.neutral[400],
      text: 'Imagen no disponible'
    },
    avatar: {
      background: colorSystem.primary[100],
      icon: 'user',
      iconColor: colorSystem.primary[600],
      text: 'Usuario'
    },
    category: {
      background: colorSystem.secondary[100],
      icon: 'tag',
      iconColor: colorSystem.secondary[600],
      text: 'Categoría'
    }
  }
};

// Componentes UI atractivos
export const uiComponents = {
  // Botones con diferentes estilos
  buttons: {
    primary: {
      background: colorSystem.gradients.button,
      color: colorSystem.light.text.inverse,
      border: 'none',
      borderRadius: '8px',
      padding: spacingGridSystem.semantic.ui.button.padding.md,
      typography: typographySystem.typography.button,
      shadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      hover: {
        background: colorSystem.gradients.buttonHover,
        shadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-1px)'
      },
      active: {
        transform: 'translateY(0)',
        shadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
      }
    },
    
    secondary: {
      background: 'transparent',
      color: colorSystem.primary[600],
      border: `2px solid ${colorSystem.primary[600]}`,
      borderRadius: '8px',
      padding: spacingGridSystem.semantic.ui.button.padding.md,
      typography: typographySystem.typography.button,
      hover: {
        background: colorSystem.primary[50],
        borderColor: colorSystem.primary[700],
        color: colorSystem.primary[700]
      }
    },
    
    ghost: {
      background: 'transparent',
      color: colorSystem.neutral[700],
      border: 'none',
      borderRadius: '8px',
      padding: spacingGridSystem.semantic.ui.button.padding.md,
      typography: typographySystem.typography.button,
      hover: {
        background: colorSystem.neutral[100],
        color: colorSystem.neutral[900]
      }
    }
  },
  
  // Cards con diferentes variantes
  cards: {
    product: {
      background: colorSystem.light.background.card,
      border: `1px solid ${colorSystem.light.border.light}`,
      borderRadius: '12px',
      padding: spacingGridSystem.semantic.ui.card.padding.md,
      shadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      hover: {
        shadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-2px)',
        borderColor: colorSystem.primary[200]
      },
      transition: 'all 0.2s ease'
    },
    
    category: {
      background: colorSystem.gradients.card,
      border: 'none',
      borderRadius: '16px',
      padding: spacingGridSystem.semantic.ui.card.padding.lg,
      shadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      hover: {
        shadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-4px)'
      },
      transition: 'all 0.3s ease'
    },
    
    feature: {
      background: colorSystem.light.background.card,
      border: `2px solid ${colorSystem.light.border.light}`,
      borderRadius: '20px',
      padding: spacingGridSystem.semantic.section.md,
      textAlign: 'center',
      hover: {
        borderColor: colorSystem.primary[300],
        background: colorSystem.primary[25]
      }
    }
  },
  
  // Badges y etiquetas
  badges: {
    default: {
      background: colorSystem.neutral[100],
      color: colorSystem.neutral[800],
      padding: `${spacingGridSystem.base[1]} ${spacingGridSystem.base[2]}`,
      borderRadius: '6px',
      typography: typographySystem.typography.label,
      fontWeight: typographySystem.weights.medium
    },
    
    success: {
      background: colorSystem.status.success[50],
      color: colorSystem.status.success[700],
      padding: `${spacingGridSystem.base[1]} ${spacingGridSystem.base[2]}`,
      borderRadius: '6px',
      typography: typographySystem.typography.label
    },
    
    warning: {
      background: colorSystem.status.warning[50],
      color: colorSystem.status.warning[700],
      padding: `${spacingGridSystem.base[1]} ${spacingGridSystem.base[2]}`,
      borderRadius: '6px',
      typography: typographySystem.typography.label
    },
    
    error: {
      background: colorSystem.status.error[50],
      color: colorSystem.status.error[700],
      padding: `${spacingGridSystem.base[1]} ${spacingGridSystem.base[2]}`,
      borderRadius: '6px',
      typography: typographySystem.typography.label
    },
    
    discount: {
      background: colorSystem.accent[500],
      color: colorSystem.light.text.inverse,
      padding: `${spacingGridSystem.base[1]} ${spacingGridSystem.base[2]}`,
      borderRadius: '8px',
      typography: typographySystem.typography.label,
      fontWeight: typographySystem.weights.bold
    }
  },
  
  // Inputs y formularios
  inputs: {
    default: {
      background: colorSystem.light.background.tertiary,
      border: `1px solid ${colorSystem.light.border.medium}`,
      borderRadius: '8px',
      padding: spacingGridSystem.semantic.ui.input.padding,
      typography: typographySystem.typography.body,
      focus: {
        borderColor: colorSystem.primary[500],
        boxShadow: `0 0 0 3px ${colorSystem.utils.withOpacity(colorSystem.primary[500], 0.1)}`,
        outline: 'none'
      },
      error: {
        borderColor: colorSystem.status.error[500],
        boxShadow: `0 0 0 3px ${colorSystem.utils.withOpacity(colorSystem.status.error[500], 0.1)}`
      }
    },
    
    search: {
      background: colorSystem.neutral[50],
      border: `1px solid ${colorSystem.neutral[200]}`,
      borderRadius: '24px',
      padding: `${spacingGridSystem.base[3]} ${spacingGridSystem.base[4]}`,
      typography: typographySystem.typography.body,
      icon: {
        position: 'absolute',
        left: spacingGridSystem.base[3],
        color: colorSystem.neutral[400]
      }
    }
  }
};

// Animaciones y transiciones
export const animations = {
  // Transiciones básicas
  transitions: {
    fast: '0.15s ease',
    normal: '0.2s ease',
    slow: '0.3s ease',
    bounce: '0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
  },
  
  // Animaciones de entrada
  entrances: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
      duration: '0.3s',
      easing: 'ease-out'
    },
    slideUp: {
      from: { opacity: 0, transform: 'translateY(20px)' },
      to: { opacity: 1, transform: 'translateY(0)' },
      duration: '0.4s',
      easing: 'ease-out'
    },
    scaleIn: {
      from: { opacity: 0, transform: 'scale(0.9)' },
      to: { opacity: 1, transform: 'scale(1)' },
      duration: '0.2s',
      easing: 'ease-out'
    }
  },
  
  // Animaciones de carga
  loading: {
    pulse: {
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    },
    spin: {
      animation: 'spin 1s linear infinite'
    },
    bounce: {
      animation: 'bounce 1s infinite'
    }
  },
  
  // Micro-interacciones
  microInteractions: {
    buttonPress: {
      active: { transform: 'scale(0.98)' },
      transition: '0.1s ease'
    },
    cardHover: {
      hover: { transform: 'translateY(-2px)' },
      transition: '0.2s ease'
    },
    iconHover: {
      hover: { transform: 'scale(1.1)' },
      transition: '0.15s ease'
    }
  }
};

// Patrones visuales para e-commerce
export const ecommercePatterns = {
  // Indicadores de precio
  priceDisplay: {
    current: {
      typography: typographySystem.ecommerce.productPrice,
      color: colorSystem.neutral[900],
      fontWeight: typographySystem.weights.bold
    },
    original: {
      typography: typographySystem.typography.bodySmall,
      color: colorSystem.neutral[500],
      textDecoration: 'line-through'
    },
    discount: {
      typography: typographySystem.typography.label,
      color: colorSystem.status.error[600],
      background: colorSystem.status.error[50],
      padding: `${spacingGridSystem.base[1]} ${spacingGridSystem.base[2]}`,
      borderRadius: '4px'
    }
  },
  
  // Indicadores de stock
  stockIndicators: {
    inStock: {
      color: colorSystem.status.success[600],
      icon: 'check-circle',
      text: 'En stock'
    },
    lowStock: {
      color: colorSystem.status.warning[600],
      icon: 'alert-triangle',
      text: 'Pocas unidades'
    },
    outOfStock: {
      color: colorSystem.status.error[600],
      icon: 'x-circle',
      text: 'Agotado'
    }
  },
  
  // Ratings y reseñas
  ratings: {
    stars: {
      filled: {
        color: colorSystem.accent[500],
        icon: 'star-filled'
      },
      empty: {
        color: colorSystem.neutral[300],
        icon: 'star-outline'
      },
      size: iconography.sizes.sm
    },
    count: {
      typography: typographySystem.typography.caption,
      color: colorSystem.neutral[600]
    }
  }
};

// Utilidades para generar estilos
export const visualUtils = {
  // Generar sombras consistentes
  generateShadow: (level: 'sm' | 'md' | 'lg' | 'xl') => {
    const shadows = {
      sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px rgba(0, 0, 0, 0.07)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.1)'
    };
    return shadows[level];
  },
  
  // Generar gradientes personalizados
  generateGradient: (color1: string, color2: string, direction = '135deg') => {
    return `linear-gradient(${direction}, ${color1} 0%, ${color2} 100%)`;
  },
  
  // Generar estados hover/focus
  generateInteractiveStates: (baseColor: string) => {
    return {
      hover: colorSystem.utils.withOpacity(baseColor, 0.8),
      focus: colorSystem.utils.withOpacity(baseColor, 0.9),
      active: colorSystem.utils.withOpacity(baseColor, 0.7)
    };
  }
};

// Exportar configuración completa
export const visualElementsSystem = {
  icons: iconography,
  images: imageSystem,
  components: uiComponents,
  animations: animations,
  patterns: ecommercePatterns,
  utils: visualUtils
};

export default visualElementsSystem;









