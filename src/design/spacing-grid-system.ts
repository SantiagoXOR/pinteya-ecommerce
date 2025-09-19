/**
 * Sistema de Espaciado y Grid Responsivo para E-commerce
 * Sistema modular y consistente para diferentes breakpoints
 * Optimizado para flexibilidad y mantenibilidad
 */

import { breakpoints } from './layout-navigation-system';

// Escala de espaciado base (8px grid system)
export const baseSpacing = {
  0: '0px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem'       // 384px
};

// Espaciado semántico para diferentes contextos
export const semanticSpacing = {
  // Espaciado interno de componentes
  component: {
    xs: baseSpacing[1],    // 4px - Espaciado mínimo
    sm: baseSpacing[2],    // 8px - Espaciado pequeño
    md: baseSpacing[4],    // 16px - Espaciado medio
    lg: baseSpacing[6],    // 24px - Espaciado grande
    xl: baseSpacing[8]     // 32px - Espaciado extra grande
  },
  
  // Espaciado entre secciones
  section: {
    xs: baseSpacing[8],    // 32px
    sm: baseSpacing[12],   // 48px
    md: baseSpacing[16],   // 64px
    lg: baseSpacing[20],   // 80px
    xl: baseSpacing[24]    // 96px
  },
  
  // Espaciado para layouts de página
  page: {
    xs: baseSpacing[4],    // 16px - Móvil
    sm: baseSpacing[6],    // 24px - Tablet
    md: baseSpacing[8],    // 32px - Desktop
    lg: baseSpacing[12],   // 48px - Desktop grande
    xl: baseSpacing[16]    // 64px - Pantallas muy grandes
  },
  
  // Espaciado para elementos de interfaz
  ui: {
    button: {
      padding: {
        sm: `${baseSpacing[2]} ${baseSpacing[3]}`,  // 8px 12px
        md: `${baseSpacing[2.5]} ${baseSpacing[4]}`, // 10px 16px
        lg: `${baseSpacing[3]} ${baseSpacing[6]}`   // 12px 24px
      },
      gap: baseSpacing[2] // 8px entre botones
    },
    input: {
      padding: `${baseSpacing[2.5]} ${baseSpacing[3]}`, // 10px 12px
      margin: baseSpacing[1] // 4px
    },
    card: {
      padding: {
        sm: baseSpacing[4],  // 16px
        md: baseSpacing[6],  // 24px
        lg: baseSpacing[8]   // 32px
      },
      gap: baseSpacing[4] // 16px entre cards
    }
  }
};

// Sistema de grid flexible
export const gridSystem = {
  // Contenedores principales
  containers: {
    // Contenedor fluido con máximos
    fluid: {
      maxWidth: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px'
      },
      padding: {
        mobile: baseSpacing[4],   // 16px
        tablet: baseSpacing[6],   // 24px
        desktop: baseSpacing[8]   // 32px
      }
    },
    
    // Contenedor de ancho completo
    full: {
      width: '100%',
      padding: {
        mobile: baseSpacing[4],
        tablet: baseSpacing[6],
        desktop: baseSpacing[8]
      }
    },
    
    // Contenedor estrecho para contenido
    narrow: {
      maxWidth: '768px',
      margin: '0 auto',
      padding: {
        mobile: baseSpacing[4],
        tablet: baseSpacing[6],
        desktop: baseSpacing[8]
      }
    }
  },
  
  // Configuración de columnas
  columns: {
    1: { width: '100%', flex: '1 1 100%' },
    2: { width: '50%', flex: '1 1 50%' },
    3: { width: '33.333333%', flex: '1 1 33.333333%' },
    4: { width: '25%', flex: '1 1 25%' },
    5: { width: '20%', flex: '1 1 20%' },
    6: { width: '16.666667%', flex: '1 1 16.666667%' },
    8: { width: '12.5%', flex: '1 1 12.5%' },
    12: { width: '8.333333%', flex: '1 1 8.333333%' }
  },
  
  // Gaps entre elementos del grid
  gaps: {
    none: '0px',
    xs: baseSpacing[1],    // 4px
    sm: baseSpacing[2],    // 8px
    md: baseSpacing[4],    // 16px
    lg: baseSpacing[6],    // 24px
    xl: baseSpacing[8],    // 32px
    '2xl': baseSpacing[10] // 40px
  }
};

// Layouts predefinidos para e-commerce
export const ecommerceLayouts = {
  // Layout de productos en grid
  productGrid: {
    mobile: {
      columns: 2,
      gap: semanticSpacing.component.sm,
      padding: semanticSpacing.page.xs
    },
    tablet: {
      columns: 3,
      gap: semanticSpacing.component.md,
      padding: semanticSpacing.page.sm
    },
    desktop: {
      columns: 4,
      gap: semanticSpacing.component.lg,
      padding: semanticSpacing.page.md
    },
    wide: {
      columns: 5,
      gap: semanticSpacing.component.lg,
      padding: semanticSpacing.page.lg
    }
  },
  
  // Layout de categorías
  categoryGrid: {
    mobile: {
      columns: 1,
      gap: semanticSpacing.component.md,
      padding: semanticSpacing.page.xs
    },
    tablet: {
      columns: 2,
      gap: semanticSpacing.component.lg,
      padding: semanticSpacing.page.sm
    },
    desktop: {
      columns: 3,
      gap: semanticSpacing.component.xl,
      padding: semanticSpacing.page.md
    }
  },
  
  // Layout de detalles de producto
  productDetails: {
    mobile: {
      gallery: { width: '100%', marginBottom: semanticSpacing.section.sm },
      info: { width: '100%' },
      gap: semanticSpacing.component.md
    },
    desktop: {
      gallery: { width: '50%' },
      info: { width: '50%' },
      gap: semanticSpacing.section.md
    }
  },
  
  // Layout con sidebar
  withSidebar: {
    mobile: {
      sidebar: { display: 'none' }, // Oculto en móvil
      content: { width: '100%' }
    },
    desktop: {
      sidebar: { width: '280px', flexShrink: 0 },
      content: { flex: 1, minWidth: 0 },
      gap: semanticSpacing.section.md
    }
  }
};

// Utilidades para generar espaciado responsivo
export const spacingUtils = {
  // Generar padding responsivo
  responsivePadding: (mobile: keyof typeof baseSpacing, tablet?: keyof typeof baseSpacing, desktop?: keyof typeof baseSpacing) => {
    const classes = [`p-${mobile}`];
    if (tablet) classes.push(`md:p-${tablet}`);
    if (desktop) classes.push(`lg:p-${desktop}`);
    return classes.join(' ');
  },
  
  // Generar margin responsivo
  responsiveMargin: (mobile: keyof typeof baseSpacing, tablet?: keyof typeof baseSpacing, desktop?: keyof typeof baseSpacing) => {
    const classes = [`m-${mobile}`];
    if (tablet) classes.push(`md:m-${tablet}`);
    if (desktop) classes.push(`lg:m-${desktop}`);
    return classes.join(' ');
  },
  
  // Generar gap responsivo para grid/flex
  responsiveGap: (mobile: keyof typeof baseSpacing, tablet?: keyof typeof baseSpacing, desktop?: keyof typeof baseSpacing) => {
    const classes = [`gap-${mobile}`];
    if (tablet) classes.push(`md:gap-${tablet}`);
    if (desktop) classes.push(`lg:gap-${desktop}`);
    return classes.join(' ');
  },
  
  // Generar clases de grid responsivo
  responsiveGrid: (mobile: number, tablet?: number, desktop?: number, wide?: number) => {
    const classes = [`grid-cols-${mobile}`];
    if (tablet) classes.push(`md:grid-cols-${tablet}`);
    if (desktop) classes.push(`lg:grid-cols-${desktop}`);
    if (wide) classes.push(`xl:grid-cols-${wide}`);
    return classes.join(' ');
  },
  
  // Calcular espaciado fluido
  fluidSpacing: (minSize: string, maxSize: string, minViewport = '320px', maxViewport = '1200px') => {
    return `clamp(${minSize}, calc(${minSize} + (${maxSize} - ${minSize}) * ((100vw - ${minViewport}) / (${maxViewport} - ${minViewport}))), ${maxSize})`;
  }
};

// Presets para componentes comunes
export const componentSpacing = {
  // Espaciado para cards de producto
  productCard: {
    padding: semanticSpacing.component.md,
    gap: semanticSpacing.component.sm,
    margin: semanticSpacing.component.xs
  },
  
  // Espaciado para formularios
  form: {
    fieldGap: semanticSpacing.component.md,
    sectionGap: semanticSpacing.section.sm,
    buttonGap: semanticSpacing.component.sm
  },
  
  // Espaciado para navegación
  navigation: {
    itemGap: semanticSpacing.component.lg,
    sectionGap: semanticSpacing.section.xs,
    padding: semanticSpacing.component.md
  },
  
  // Espaciado para modales
  modal: {
    padding: semanticSpacing.section.sm,
    headerGap: semanticSpacing.component.md,
    contentGap: semanticSpacing.component.lg,
    actionGap: semanticSpacing.component.sm
  }
};

// Configuración para diferentes densidades de interfaz
export const densityConfig = {
  compact: {
    multiplier: 0.75,
    description: 'Interfaz compacta para pantallas pequeñas o alta densidad de información'
  },
  comfortable: {
    multiplier: 1,
    description: 'Espaciado estándar balanceado'
  },
  spacious: {
    multiplier: 1.25,
    description: 'Espaciado amplio para mejor accesibilidad'
  }
};

// Configuración de accesibilidad para espaciado
export const accessibilitySpacing = {
  // Tamaños mínimos para elementos interactivos
  minTouchTarget: '44px', // Recomendación WCAG
  minClickTarget: '24px',
  
  // Espaciado mínimo entre elementos interactivos
  minInteractiveGap: baseSpacing[2], // 8px
  
  // Espaciado para elementos de foco
  focusOutline: {
    width: '2px',
    offset: '2px',
    style: 'solid'
  }
};

// Configuración para Tailwind CSS
export const tailwindSpacingConfig = {
  spacing: baseSpacing,
  gap: gridSystem.gaps,
  maxWidth: gridSystem.containers.fluid.maxWidth
};

// Exportar configuración completa
export const spacingGridSystem = {
  base: baseSpacing,
  semantic: semanticSpacing,
  grid: gridSystem,
  layouts: ecommerceLayouts,
  utils: spacingUtils,
  components: componentSpacing,
  density: densityConfig,
  accessibility: accessibilitySpacing,
  tailwind: tailwindSpacingConfig
};

export default spacingGridSystem;









