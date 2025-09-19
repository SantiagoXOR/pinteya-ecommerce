/**
 * Sistema de Layout y Navegación para E-commerce
 * Estructura intuitiva, clara y optimizada para la experiencia del usuario
 * Diseño responsivo y accesible
 */

import { colorSystem } from './color-system';
import { typographySystem } from './typography-system';

// Configuración de breakpoints responsivos
export const breakpoints = {
  xs: '320px',   // Móviles pequeños
  sm: '640px',   // Móviles
  md: '768px',   // Tablets
  lg: '1024px',  // Laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px' // Pantallas grandes
};

// Sistema de espaciado consistente
export const spacing = {
  0: '0px',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
  32: '8rem',    // 128px
  40: '10rem',   // 160px
  48: '12rem',   // 192px
  56: '14rem',   // 224px
  64: '16rem'    // 256px
};

// Configuración del grid system
export const gridSystem = {
  container: {
    maxWidth: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px'
    },
    padding: {
      default: spacing[4],
      sm: spacing[6],
      lg: spacing[8]
    }
  },
  columns: {
    1: '100%',
    2: '50%',
    3: '33.333333%',
    4: '25%',
    5: '20%',
    6: '16.666667%',
    12: '8.333333%'
  },
  gaps: {
    xs: spacing[2],
    sm: spacing[4],
    md: spacing[6],
    lg: spacing[8],
    xl: spacing[10]
  }
};

// Estructura de navegación principal
export const navigationStructure = {
  header: {
    height: {
      mobile: '64px',
      desktop: '80px'
    },
    layout: {
      mobile: 'single-row', // Logo + hamburger
      desktop: 'multi-section' // Logo + nav + actions
    },
    sections: {
      logo: {
        width: {
          mobile: '120px',
          desktop: '160px'
        },
        position: 'left'
      },
      navigation: {
        display: {
          mobile: 'hidden', // Se muestra en menú hamburguesa
          desktop: 'flex'
        },
        items: [
          { label: 'Inicio', href: '/', priority: 'high' },
          { label: 'Tienda', href: '/shop', priority: 'high', hasSubmenu: true },
          { label: 'Categorías', href: '/categories', priority: 'medium', hasSubmenu: true },
          { label: 'Ofertas', href: '/deals', priority: 'high' },
          { label: 'Contacto', href: '/contact', priority: 'low' }
        ]
      },
      actions: {
        items: [
          { type: 'search', priority: 'high' },
          { type: 'wishlist', priority: 'medium' },
          { type: 'cart', priority: 'high' },
          { type: 'account', priority: 'medium' }
        ]
      }
    }
  },
  
  mobileMenu: {
    type: 'slide-in', // slide-in, overlay, push
    position: 'left',
    width: '280px',
    backdrop: true,
    sections: [
      'user-profile',
      'main-navigation',
      'secondary-links',
      'social-links'
    ]
  },
  
  breadcrumb: {
    display: {
      mobile: 'simplified', // Solo página actual
      desktop: 'full' // Ruta completa
    },
    maxItems: 4,
    separator: '/',
    showHome: true
  },
  
  footer: {
    layout: {
      mobile: 'stacked', // Secciones apiladas
      desktop: 'columns' // 4 columnas
    },
    sections: [
      {
        title: 'Empresa',
        links: ['Sobre nosotros', 'Contacto', 'Careers', 'Prensa']
      },
      {
        title: 'Ayuda',
        links: ['FAQ', 'Envíos', 'Devoluciones', 'Soporte']
      },
      {
        title: 'Legal',
        links: ['Términos', 'Privacidad', 'Cookies', 'Accesibilidad']
      },
      {
        title: 'Síguenos',
        type: 'social',
        links: ['Facebook', 'Instagram', 'Twitter', 'YouTube']
      }
    ]
  }
};

// Layouts específicos para páginas del e-commerce
export const pageLayouts = {
  // Layout para página de tienda con sidebar
  shopWithSidebar: {
    structure: {
      mobile: {
        header: '64px',
        filters: 'modal', // Filtros en modal
        content: 'full-width',
        footer: 'auto'
      },
      desktop: {
        header: '80px',
        sidebar: '280px', // Filtros en sidebar
        content: 'flex-1',
        footer: 'auto'
      }
    },
    sidebar: {
      position: 'left',
      sticky: true,
      topOffset: '80px',
      sections: [
        'search',
        'categories',
        'price-range',
        'brands',
        'ratings',
        'attributes'
      ]
    },
    content: {
      toolbar: {
        height: '60px',
        items: ['view-toggle', 'sort', 'results-count']
      },
      grid: {
        mobile: {
          columns: 2,
          gap: spacing[3]
        },
        tablet: {
          columns: 3,
          gap: spacing[4]
        },
        desktop: {
          columns: 4,
          gap: spacing[6]
        }
      }
    }
  },
  
  // Layout para página de detalles de producto
  productDetails: {
    structure: {
      mobile: {
        gallery: 'full-width',
        info: 'stacked',
        tabs: 'accordion'
      },
      desktop: {
        gallery: '50%',
        info: '50%',
        tabs: 'horizontal'
      }
    },
    gallery: {
      mainImage: {
        aspectRatio: '1:1',
        maxHeight: '500px'
      },
      thumbnails: {
        position: 'bottom',
        count: 5,
        size: '80px'
      }
    },
    info: {
      sections: [
        'title-price',
        'rating-reviews',
        'variants',
        'quantity',
        'actions',
        'shipping-info',
        'features'
      ]
    }
  },
  
  // Layout para carrito de compras
  cart: {
    structure: {
      mobile: 'single-column',
      desktop: 'two-column' // Items + Summary
    },
    items: {
      layout: 'card',
      actions: ['update', 'remove', 'save-later']
    },
    summary: {
      sticky: true,
      sections: ['subtotal', 'shipping', 'taxes', 'total', 'checkout']
    }
  },
  
  // Layout para checkout
  checkout: {
    structure: {
      mobile: 'stepped', // Pasos secuenciales
      desktop: 'side-by-side' // Formulario + Resumen
    },
    steps: [
      'shipping-info',
      'payment-method',
      'review-order'
    ],
    progress: {
      type: 'stepper',
      showLabels: true
    }
  }
};

// Componentes de navegación reutilizables
export const navigationComponents = {
  // Menú principal horizontal
  mainNav: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[8],
    typography: typographySystem.typography.nav,
    hover: {
      color: colorSystem.primary[600],
      transition: 'color 0.2s ease'
    }
  },
  
  // Menú desplegable
  dropdown: {
    minWidth: '200px',
    maxHeight: '400px',
    padding: spacing[2],
    background: colorSystem.light.background.card,
    border: `1px solid ${colorSystem.light.border.light}`,
    borderRadius: '8px',
    boxShadow: colorSystem.light.shadow.medium
  },
  
  // Breadcrumb
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
    typography: typographySystem.typography.navSmall,
    separator: {
      color: colorSystem.neutral[400],
      margin: `0 ${spacing[2]}`
    }
  },
  
  // Paginación
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    margin: `${spacing[8]} 0`,
    button: {
      minWidth: '40px',
      height: '40px',
      borderRadius: '6px'
    }
  }
};

// Utilidades para layouts responsivos
export const layoutUtils = {
  // Generar clases de grid responsivo
  generateGrid: (columns: { mobile?: number; tablet?: number; desktop?: number }) => {
    const classes = [];
    
    if (columns.mobile) {
      classes.push(`grid-cols-${columns.mobile}`);
    }
    if (columns.tablet) {
      classes.push(`md:grid-cols-${columns.tablet}`);
    }
    if (columns.desktop) {
      classes.push(`lg:grid-cols-${columns.desktop}`);
    }
    
    return classes.join(' ');
  },
  
  // Generar espaciado responsivo
  generateSpacing: (spacing: { mobile?: string; tablet?: string; desktop?: string }) => {
    const classes = [];
    
    if (spacing.mobile) {
      classes.push(`p-${spacing.mobile}`);
    }
    if (spacing.tablet) {
      classes.push(`md:p-${spacing.tablet}`);
    }
    if (spacing.desktop) {
      classes.push(`lg:p-${spacing.desktop}`);
    }
    
    return classes.join(' ');
  },
  
  // Calcular ancho de contenedor
  getContainerWidth: (breakpoint: keyof typeof breakpoints) => {
    return gridSystem.container.maxWidth[breakpoint] || '100%';
  }
};

// Configuración de accesibilidad para navegación
export const accessibilityConfig = {
  navigation: {
    skipLinks: {
      enabled: true,
      targets: ['main-content', 'navigation', 'footer']
    },
    focusManagement: {
      trapFocus: true, // En modales y menús
      restoreFocus: true, // Al cerrar modales
      visibleFocus: true // Indicadores de foco visibles
    },
    keyboard: {
      escapeCloses: true, // ESC cierra menús/modales
      arrowNavigation: true, // Navegación con flechas en menús
      enterActivates: true // Enter activa enlaces/botones
    }
  },
  landmarks: {
    header: 'banner',
    navigation: 'navigation',
    main: 'main',
    aside: 'complementary',
    footer: 'contentinfo'
  },
  aria: {
    labels: {
      mobileMenu: 'Menú de navegación móvil',
      search: 'Buscar productos',
      cart: 'Carrito de compras',
      wishlist: 'Lista de deseos',
      account: 'Cuenta de usuario'
    }
  }
};

// Exportar configuración completa
export const layoutNavigationSystem = {
  breakpoints,
  spacing,
  grid: gridSystem,
  navigation: navigationStructure,
  layouts: pageLayouts,
  components: navigationComponents,
  utils: layoutUtils,
  accessibility: accessibilityConfig
};

export default layoutNavigationSystem;









