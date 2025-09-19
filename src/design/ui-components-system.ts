/**
 * Sistema de Componentes UI Específicos para E-commerce
 * Cards, botones, formularios, filtros y componentes especializados
 * Diseñados para máxima usabilidad y conversión
 */

import { colorSystem } from './color-system';
import { typographySystem } from './typography-system';
import { spacingGridSystem } from './spacing-grid-system';
import { visualElementsSystem } from './visual-elements-system';

// Componentes de producto
export const productComponents = {
  // Card de producto principal
  productCard: {
    container: {
      background: colorSystem.light.background.card,
      border: `1px solid ${colorSystem.light.border.light}`,
      borderRadius: '16px',
      padding: spacingGridSystem.semantic.ui.card.padding.md,
      shadow: visualElementsSystem.utils.generateShadow('sm'),
      transition: visualElementsSystem.animations.transitions.normal,
      hover: {
        shadow: visualElementsSystem.utils.generateShadow('lg'),
        transform: 'translateY(-4px)',
        borderColor: colorSystem.primary[200]
      }
    },
    
    image: {
      container: {
        position: 'relative',
        aspectRatio: visualElementsSystem.images.aspectRatios.square,
        borderRadius: '12px',
        overflow: 'hidden',
        marginBottom: spacingGridSystem.base[4]
      },
      main: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transition: visualElementsSystem.animations.transitions.slow
      },
      overlay: {
        position: 'absolute',
        top: spacingGridSystem.base[3],
        right: spacingGridSystem.base[3],
        display: 'flex',
        gap: spacingGridSystem.base[2]
      },
      badge: {
        position: 'absolute',
        top: spacingGridSystem.base[3],
        left: spacingGridSystem.base[3],
        ...visualElementsSystem.components.badges.discount
      }
    },
    
    content: {
      title: {
        ...typographySystem.typography.h6,
        color: colorSystem.light.text.primary,
        marginBottom: spacingGridSystem.base[2],
        lineHeight: typographySystem.lineHeights.tight,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical'
      },
      
      category: {
        ...typographySystem.typography.caption,
        color: colorSystem.light.text.secondary,
        marginBottom: spacingGridSystem.base[1],
        textTransform: 'uppercase',
        letterSpacing: typographySystem.letterSpacing.wide
      },
      
      price: {
        container: {
          display: 'flex',
          alignItems: 'center',
          gap: spacingGridSystem.base[2],
          marginBottom: spacingGridSystem.base[3]
        },
        current: visualElementsSystem.patterns.priceDisplay.current,
        original: visualElementsSystem.patterns.priceDisplay.original,
        discount: visualElementsSystem.patterns.priceDisplay.discount
      },
      
      rating: {
        container: {
          display: 'flex',
          alignItems: 'center',
          gap: spacingGridSystem.base[1],
          marginBottom: spacingGridSystem.base[3]
        },
        stars: visualElementsSystem.patterns.ratings.stars,
        count: visualElementsSystem.patterns.ratings.count
      },
      
      actions: {
        container: {
          display: 'flex',
          gap: spacingGridSystem.base[2]
        },
        addToCart: {
          ...visualElementsSystem.components.buttons.primary,
          flex: 1,
          justifyContent: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: spacingGridSystem.base[2]
        },
        wishlist: {
          ...visualElementsSystem.components.buttons.ghost,
          padding: spacingGridSystem.base[3],
          minWidth: 'auto'
        }
      }
    }
  },
  
  // Card de producto compacto (para listas)
  productCardCompact: {
    container: {
      display: 'flex',
      gap: spacingGridSystem.base[4],
      background: colorSystem.light.background.card,
      border: `1px solid ${colorSystem.light.border.light}`,
      borderRadius: '12px',
      padding: spacingGridSystem.base[4],
      hover: {
        borderColor: colorSystem.primary[200],
        background: colorSystem.primary[25]
      }
    },
    
    image: {
      width: '80px',
      height: '80px',
      borderRadius: '8px',
      objectFit: 'cover',
      flexShrink: 0
    },
    
    content: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }
  },
  
  // Galería de producto
  productGallery: {
    container: {
      display: 'grid',
      gap: spacingGridSystem.base[4],
      gridTemplateColumns: '1fr',
      '@media (min-width: 768px)': {
        gridTemplateColumns: '100px 1fr'
      }
    },
    
    thumbnails: {
      display: 'flex',
      flexDirection: 'row',
      gap: spacingGridSystem.base[2],
      overflowX: 'auto',
      '@media (min-width: 768px)': {
        flexDirection: 'column',
        overflowX: 'visible',
        overflowY: 'auto'
      }
    },
    
    thumbnail: {
      width: '80px',
      height: '80px',
      borderRadius: '8px',
      border: `2px solid transparent`,
      cursor: 'pointer',
      transition: visualElementsSystem.animations.transitions.fast,
      active: {
        borderColor: colorSystem.primary[500]
      },
      hover: {
        borderColor: colorSystem.primary[300]
      }
    },
    
    main: {
      position: 'relative',
      aspectRatio: visualElementsSystem.images.aspectRatios.square,
      borderRadius: '16px',
      overflow: 'hidden',
      background: colorSystem.neutral[50]
    }
  }
};

// Componentes de navegación y filtros
export const navigationComponents = {
  // Breadcrumb mejorado
  breadcrumb: {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: spacingGridSystem.base[2],
      padding: `${spacingGridSystem.base[4]} 0`,
      borderBottom: `1px solid ${colorSystem.light.border.light}`,
      marginBottom: spacingGridSystem.base[6]
    },
    
    item: {
      ...typographySystem.typography.bodySmall,
      color: colorSystem.light.text.secondary,
      textDecoration: 'none',
      hover: {
        color: colorSystem.primary[600],
        textDecoration: 'underline'
      }
    },
    
    current: {
      ...typographySystem.typography.bodySmall,
      color: colorSystem.light.text.primary,
      fontWeight: typographySystem.weights.medium
    },
    
    separator: {
      color: colorSystem.light.text.tertiary,
      fontSize: typographySystem.sizes.sm
    }
  },
  
  // Sidebar de filtros
  filterSidebar: {
    container: {
      background: colorSystem.light.background.secondary,
      border: `1px solid ${colorSystem.light.border.light}`,
      borderRadius: '16px',
      padding: spacingGridSystem.base[6],
      height: 'fit-content',
      position: 'sticky',
      top: spacingGridSystem.base[6]
    },
    
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacingGridSystem.base[6],
      paddingBottom: spacingGridSystem.base[4],
      borderBottom: `1px solid ${colorSystem.light.border.light}`
    },
    
    title: {
      ...typographySystem.typography.h6,
      color: colorSystem.light.text.primary
    },
    
    clearButton: {
      ...visualElementsSystem.components.buttons.ghost,
      padding: `${spacingGridSystem.base[2]} ${spacingGridSystem.base[3]}`,
      fontSize: typographySystem.sizes.sm
    }
  },
  
  // Grupo de filtros
  filterGroup: {
    container: {
      marginBottom: spacingGridSystem.base[6]
    },
    
    label: {
      ...typographySystem.typography.label,
      color: colorSystem.light.text.primary,
      fontWeight: typographySystem.weights.semibold,
      marginBottom: spacingGridSystem.base[3],
      display: 'block'
    },
    
    content: {
      display: 'flex',
      flexDirection: 'column',
      gap: spacingGridSystem.base[2]
    }
  },
  
  // Filtro de precio con rango
  priceFilter: {
    container: {
      padding: spacingGridSystem.base[4],
      background: colorSystem.neutral[50],
      borderRadius: '12px'
    },
    
    inputs: {
      display: 'flex',
      gap: spacingGridSystem.base[3],
      marginBottom: spacingGridSystem.base[4]
    },
    
    input: {
      ...visualElementsSystem.components.inputs.default,
      flex: 1,
      textAlign: 'center'
    },
    
    slider: {
      width: '100%',
      height: '6px',
      borderRadius: '3px',
      background: colorSystem.neutral[200],
      appearance: 'none',
      outline: 'none'
    }
  }
};

// Componentes de formulario especializados
export const formComponents = {
  // Campo de búsqueda avanzado
  searchField: {
    container: {
      position: 'relative',
      maxWidth: '400px'
    },
    
    input: {
      ...visualElementsSystem.components.inputs.search,
      width: '100%',
      paddingLeft: '48px',
      paddingRight: '48px'
    },
    
    iconLeft: {
      position: 'absolute',
      left: spacingGridSystem.base[4],
      top: '50%',
      transform: 'translateY(-50%)',
      color: colorSystem.neutral[400],
      pointerEvents: 'none'
    },
    
    iconRight: {
      position: 'absolute',
      right: spacingGridSystem.base[4],
      top: '50%',
      transform: 'translateY(-50%)',
      color: colorSystem.neutral[400],
      cursor: 'pointer',
      hover: {
        color: colorSystem.neutral[600]
      }
    },
    
    suggestions: {
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: colorSystem.light.background.card,
      border: `1px solid ${colorSystem.light.border.medium}`,
      borderRadius: '12px',
      marginTop: spacingGridSystem.base[2],
      shadow: visualElementsSystem.utils.generateShadow('lg'),
      zIndex: 50
    }
  },
  
  // Selector de cantidad
  quantitySelector: {
    container: {
      display: 'flex',
      alignItems: 'center',
      border: `1px solid ${colorSystem.light.border.medium}`,
      borderRadius: '8px',
      overflow: 'hidden'
    },
    
    button: {
      background: colorSystem.neutral[50],
      border: 'none',
      padding: spacingGridSystem.base[3],
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      hover: {
        background: colorSystem.neutral[100]
      },
      disabled: {
        opacity: 0.5,
        cursor: 'not-allowed'
      }
    },
    
    input: {
      border: 'none',
      background: 'transparent',
      padding: `${spacingGridSystem.base[3]} ${spacingGridSystem.base[4]}`,
      textAlign: 'center',
      width: '60px',
      ...typographySystem.typography.body,
      outline: 'none'
    }
  },
  
  // Selector de variantes (talla, color)
  variantSelector: {
    container: {
      marginBottom: spacingGridSystem.base[4]
    },
    
    label: {
      ...typographySystem.typography.label,
      color: colorSystem.light.text.primary,
      fontWeight: typographySystem.weights.medium,
      marginBottom: spacingGridSystem.base[3],
      display: 'block'
    },
    
    options: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: spacingGridSystem.base[2]
    },
    
    option: {
      padding: `${spacingGridSystem.base[2]} ${spacingGridSystem.base[4]}`,
      border: `1px solid ${colorSystem.light.border.medium}`,
      borderRadius: '8px',
      background: colorSystem.light.background.tertiary,
      cursor: 'pointer',
      transition: visualElementsSystem.animations.transitions.fast,
      ...typographySystem.typography.bodySmall,
      
      hover: {
        borderColor: colorSystem.primary[300],
        background: colorSystem.primary[50]
      },
      
      selected: {
        borderColor: colorSystem.primary[500],
        background: colorSystem.primary[100],
        color: colorSystem.primary[700]
      },
      
      disabled: {
        opacity: 0.5,
        cursor: 'not-allowed',
        textDecoration: 'line-through'
      }
    }
  }
};

// Componentes de carrito y checkout
export const cartComponents = {
  // Item del carrito
  cartItem: {
    container: {
      display: 'flex',
      gap: spacingGridSystem.base[4],
      padding: spacingGridSystem.base[4],
      border: `1px solid ${colorSystem.light.border.light}`,
      borderRadius: '12px',
      background: colorSystem.light.background.card
    },
    
    image: {
      width: '80px',
      height: '80px',
      borderRadius: '8px',
      objectFit: 'cover',
      flexShrink: 0
    },
    
    content: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    },
    
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacingGridSystem.base[2]
    },
    
    title: {
      ...typographySystem.typography.bodyLarge,
      color: colorSystem.light.text.primary,
      fontWeight: typographySystem.weights.medium
    },
    
    removeButton: {
      background: 'transparent',
      border: 'none',
      color: colorSystem.neutral[400],
      cursor: 'pointer',
      padding: spacingGridSystem.base[1],
      hover: {
        color: colorSystem.status.error[500]
      }
    },
    
    footer: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    
    price: {
      ...typographySystem.typography.bodyLarge,
      color: colorSystem.light.text.primary,
      fontWeight: typographySystem.weights.semibold
    }
  },
  
  // Resumen del carrito
  cartSummary: {
    container: {
      background: colorSystem.light.background.secondary,
      border: `1px solid ${colorSystem.light.border.light}`,
      borderRadius: '16px',
      padding: spacingGridSystem.base[6],
      position: 'sticky',
      top: spacingGridSystem.base[6]
    },
    
    title: {
      ...typographySystem.typography.h6,
      color: colorSystem.light.text.primary,
      marginBottom: spacingGridSystem.base[4],
      paddingBottom: spacingGridSystem.base[4],
      borderBottom: `1px solid ${colorSystem.light.border.light}`
    },
    
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacingGridSystem.base[3]
    },
    
    label: {
      ...typographySystem.typography.body,
      color: colorSystem.light.text.secondary
    },
    
    value: {
      ...typographySystem.typography.body,
      color: colorSystem.light.text.primary,
      fontWeight: typographySystem.weights.medium
    },
    
    total: {
      row: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: spacingGridSystem.base[4],
        borderTop: `1px solid ${colorSystem.light.border.light}`,
        marginTop: spacingGridSystem.base[4]
      },
      label: {
        ...typographySystem.typography.bodyLarge,
        color: colorSystem.light.text.primary,
        fontWeight: typographySystem.weights.semibold
      },
      value: {
        ...typographySystem.typography.h6,
        color: colorSystem.primary[600],
        fontWeight: typographySystem.weights.bold
      }
    },
    
    checkoutButton: {
      ...visualElementsSystem.components.buttons.primary,
      width: '100%',
      marginTop: spacingGridSystem.base[6],
      justifyContent: 'center',
      display: 'flex',
      alignItems: 'center',
      gap: spacingGridSystem.base[2]
    }
  }
};

// Componentes de estado y feedback
export const feedbackComponents = {
  // Loading states
  loading: {
    skeleton: {
      background: colorSystem.neutral[200],
      borderRadius: '4px',
      animation: visualElementsSystem.animations.loading.pulse.animation
    },
    
    spinner: {
      width: '24px',
      height: '24px',
      border: `2px solid ${colorSystem.neutral[200]}`,
      borderTop: `2px solid ${colorSystem.primary[500]}`,
      borderRadius: '50%',
      animation: visualElementsSystem.animations.loading.spin.animation
    },
    
    overlay: {
      position: 'fixed',
      inset: 0,
      background: colorSystem.utils.withOpacity(colorSystem.neutral[900], 0.5),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }
  },
  
  // Estados vacíos
  emptyState: {
    container: {
      textAlign: 'center',
      padding: spacingGridSystem.semantic.section.lg,
      color: colorSystem.light.text.secondary
    },
    
    icon: {
      fontSize: '48px',
      marginBottom: spacingGridSystem.base[4],
      color: colorSystem.neutral[300]
    },
    
    title: {
      ...typographySystem.typography.h5,
      color: colorSystem.light.text.primary,
      marginBottom: spacingGridSystem.base[2]
    },
    
    description: {
      ...typographySystem.typography.body,
      color: colorSystem.light.text.secondary,
      marginBottom: spacingGridSystem.base[6]
    },
    
    action: {
      ...visualElementsSystem.components.buttons.primary
    }
  },
  
  // Notificaciones toast
  toast: {
    container: {
      position: 'fixed',
      top: spacingGridSystem.base[6],
      right: spacingGridSystem.base[6],
      background: colorSystem.light.background.card,
      border: `1px solid ${colorSystem.light.border.medium}`,
      borderRadius: '12px',
      padding: spacingGridSystem.base[4],
      shadow: visualElementsSystem.utils.generateShadow('lg'),
      zIndex: 9999,
      minWidth: '300px',
      maxWidth: '400px'
    },
    
    success: {
      borderLeftColor: colorSystem.status.success[500],
      borderLeftWidth: '4px'
    },
    
    error: {
      borderLeftColor: colorSystem.status.error[500],
      borderLeftWidth: '4px'
    },
    
    warning: {
      borderLeftColor: colorSystem.status.warning[500],
      borderLeftWidth: '4px'
    },
    
    info: {
      borderLeftColor: colorSystem.primary[500],
      borderLeftWidth: '4px'
    }
  }
};

// Utilidades para componentes responsivos
export const responsiveUtils = {
  // Breakpoints para componentes
  breakpoints: spacingGridSystem.breakpoints,
  
  // Generar estilos responsivos
  generateResponsiveStyles: (styles: Record<string, any>) => {
    const responsive: Record<string, any> = {};
    
    Object.entries(styles).forEach(([breakpoint, style]) => {
      if (breakpoint === 'base') {
        Object.assign(responsive, style);
      } else {
        responsive[`@media (min-width: ${spacingGridSystem.breakpoints[breakpoint as keyof typeof spacingGridSystem.breakpoints]})`] = style;
      }
    });
    
    return responsive;
  },
  
  // Utilidades de grid responsivo
  responsiveGrid: {
    columns: {
      1: 'repeat(1, minmax(0, 1fr))',
      2: 'repeat(2, minmax(0, 1fr))',
      3: 'repeat(3, minmax(0, 1fr))',
      4: 'repeat(4, minmax(0, 1fr))',
      auto: 'repeat(auto-fit, minmax(280px, 1fr))'
    },
    
    gaps: {
      sm: spacingGridSystem.base[4],
      md: spacingGridSystem.base[6],
      lg: spacingGridSystem.base[8]
    }
  }
};

// Exportar sistema completo
export const uiComponentsSystem = {
  product: productComponents,
  navigation: navigationComponents,
  forms: formComponents,
  cart: cartComponents,
  feedback: feedbackComponents,
  responsive: responsiveUtils
};

export default uiComponentsSystem;









