import type { Meta, StoryObj } from '@storybook/react'
import { BottomNavigation, type BottomNavigationItem } from './bottom-navigation'
import {
  Home,
  Tag,
  Package,
  Calculator,
  Menu,
  ShoppingCart,
  User,
  Heart,
  Search,
} from '@/lib/optimized-imports'

const meta = {
  title: 'UI/BottomNavigation',
  component: BottomNavigation,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# BottomNavigation

Componente de navegación inferior fija optimizado para móviles, siguiendo las mejores prácticas de UX móvil inspiradas en Mercado Libre Argentina.

## Características

- **Mobile-first**: Diseñado específicamente para dispositivos móviles
- **Badges dinámicos**: Muestra notificaciones y contadores automáticamente
- **Estados activos**: Indicador visual del estado actual de navegación
- **Accesible**: Compatible con screen readers y navegación por teclado
- **Personalizable**: Variantes de color y configuración flexible

## Casos de uso

- Navegación principal en aplicaciones móviles
- E-commerce con carrito y pedidos
- Aplicaciones con múltiples secciones principales
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'dark', 'primary'],
      description: 'Variante visual del componente',
    },
    showLabels: {
      control: 'boolean',
      description: 'Mostrar etiquetas de texto bajo los íconos',
    },
    maxItems: {
      control: { type: 'number', min: 3, max: 6 },
      description: 'Número máximo de items a mostrar',
    },
  },
} satisfies Meta<typeof BottomNavigation>

export default meta
type Story = StoryObj<typeof meta>

// Items personalizados para diferentes casos de uso
const ecommerceItems: BottomNavigationItem[] = [
  {
    id: 'home',
    label: 'Inicio',
    href: '/',
    icon: <Home className='w-5 h-5' />,
  },
  {
    id: 'shop',
    label: 'Tienda',
    href: '/shop',
    icon: <Tag className='w-5 h-5' />,
  },
  {
    id: 'cart',
    label: 'Carrito',
    href: '/cart',
    icon: <ShoppingCart className='w-5 h-5' />,
    badge: 3,
  },
  {
    id: 'wishlist',
    label: 'Favoritos',
    href: '/wishlist',
    icon: <Heart className='w-5 h-5' />,
    badge: 12,
  },
  {
    id: 'profile',
    label: 'Perfil',
    href: '/my-account',
    icon: <User className='w-5 h-5' />,
  },
]

const pinteyaItems: BottomNavigationItem[] = [
  {
    id: 'home',
    label: 'Inicio',
    href: '/',
    icon: <Home className='w-5 h-5 fill-current' strokeWidth={1.5} />,
  },
  {
    id: 'offers',
    label: 'Ofertas',
    href: '/shop',
    icon: <Tag className='w-5 h-5' strokeWidth={2} />,
  },
  {
    id: 'orders',
    label: 'Pedidos',
    href: '/my-account',
    icon: <Package className='w-5 h-5' strokeWidth={1.5} />,
    badge: 3,
  },
  {
    id: 'calculator',
    label: 'Cotizador',
    href: '/calculator',
    icon: <Calculator className='w-5 h-5' strokeWidth={1.5} />,
  },
  {
    id: 'menu',
    label: 'Menú',
    href: '/menu',
    icon: <Menu className='w-5 h-5' strokeWidth={2} />,
  },
]

export const Default: Story = {
  args: {
    variant: 'warm',
    showLabels: true,
    maxItems: 5,
    items: pinteyaItems,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Navegación inferior con la nueva identidad visual de Pinteya - fondo cálido, íconos mejorados y estados activos con círculo naranja.',
      },
    },
  },
}

export const PinteyaEcommerce: Story = {
  args: {
    variant: 'default',
    showLabels: true,
    items: pinteyaItems,
    maxItems: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuración específica para Pinteya E-commerce con cotizador y pedidos.',
      },
    },
  },
}

export const EcommerceGeneric: Story = {
  args: {
    variant: 'default',
    showLabels: true,
    items: ecommerceItems,
    maxItems: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuración genérica de e-commerce con carrito y favoritos.',
      },
    },
  },
}

export const WithoutLabels: Story = {
  args: {
    variant: 'default',
    showLabels: false,
    items: pinteyaItems,
    maxItems: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Versión compacta sin etiquetas de texto, solo íconos.',
      },
    },
  },
}

export const DarkVariant: Story = {
  args: {
    variant: 'dark',
    showLabels: true,
    items: pinteyaItems,
    maxItems: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Variante oscura para aplicaciones con tema dark.',
      },
    },
  },
}

export const PrimaryVariant: Story = {
  args: {
    variant: 'primary',
    showLabels: true,
    items: pinteyaItems,
    maxItems: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Variante con color primario de la marca (Tahiti Gold).',
      },
    },
  },
}

export const ThreeItems: Story = {
  args: {
    variant: 'warm',
    showLabels: true,
    items: pinteyaItems,
    maxItems: 3,
  },
  parameters: {
    docs: {
      description: {
        story: 'Configuración minimalista con solo 3 items principales.',
      },
    },
  },
}

export const ImprovedDesign: Story = {
  args: {
    variant: 'warm',
    showLabels: true,
    items: [
      {
        id: 'home',
        label: 'Inicio',
        href: '/',
        icon: <Home className='w-5 h-5 fill-current' strokeWidth={1.5} />,
      },
      {
        id: 'offers',
        label: 'Ofertas',
        href: '/shop',
        icon: <Tag className='w-5 h-5' strokeWidth={2} />,
      },
      {
        id: 'orders',
        label: 'Pedidos',
        href: '/my-account',
        icon: <Package className='w-5 h-5' strokeWidth={1.5} />,
        badge: 5,
      },
      {
        id: 'calculator',
        label: 'Cotizador',
        href: '/calculator',
        icon: <Calculator className='w-5 h-5' strokeWidth={1.5} />,
      },
      {
        id: 'menu',
        label: 'Menú',
        href: '/menu',
        icon: <Menu className='w-5 h-5' strokeWidth={2} />,
      },
    ],
    maxItems: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          '🎨 **Diseño Mejorado para Pinteya E-commerce**\n\n' +
          '✅ **Fondo cálido** beige suave (#FFF7EB) en lugar de blanco plano\n' +
          '✅ **Íconos redondeados** con strokeWidth optimizado para mejor legibilidad\n' +
          '✅ **Estado activo** con fondo circular naranja y escala aumentada\n' +
          '✅ **Badges animados** con efecto pulse para notificaciones\n' +
          '✅ **Tipografía mejorada** con font-semibold para items activos\n' +
          '✅ **Efectos de tap** optimizados para móviles\n' +
          '✅ **Espaciado generoso** entre íconos y texto\n\n' +
          'Esta versión implementa todas las mejoras UX/UI propuestas para alinearse con la identidad moderna y cálida de PinteYA!',
      },
    },
  },
}

export const WithHighBadges: Story = {
  args: {
    variant: 'default',
    showLabels: true,
    items: [
      ...pinteyaItems.slice(0, 3),
      {
        id: 'notifications',
        label: 'Notificaciones',
        href: '/notifications',
        icon: <Package className='w-5 h-5' />,
        badge: 99,
      },
      {
        id: 'messages',
        label: 'Mensajes',
        href: '/messages',
        icon: <Menu className='w-5 h-5' />,
        badge: 150,
      },
    ],
    maxItems: 5,
  },
  parameters: {
    docs: {
      description: {
        story: 'Ejemplo con badges de números altos (99+ se muestra como "99+").',
      },
    },
  },
}
