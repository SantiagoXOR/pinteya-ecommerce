/**
 * 📚 Pinteya Design System - Button Stories
 * 
 * Documentación interactiva del componente Button
 * Para uso con Storybook
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Button, AddToCartButton, BuyNowButton, WishlistButton } from './Button';

// 🎯 Configuración Meta
const meta: Meta<typeof Button> = {
  title: 'Atoms/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Button Component

Componente Button del Pinteya Design System, optimizado para e-commerce de pinturería.

## Características

- ✅ 6 variantes visuales (primary, secondary, outline, ghost, destructive, success)
- ✅ 4 tamaños (sm, md, lg, xl)
- ✅ Estados de loading con spinner
- ✅ Soporte para iconos (inicio/final)
- ✅ Modo solo icono
- ✅ Ancho completo
- ✅ Accesibilidad completa
- ✅ Animaciones suaves

## Variantes E-commerce

Incluye variantes específicas para e-commerce:
- \`AddToCartButton\` - Botón principal para agregar al carrito
- \`BuyNowButton\` - Botón secundario para compra inmediata  
- \`WishlistButton\` - Botón de favoritos (solo icono)
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'success'],
      description: 'Variante visual del botón',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Tamaño del botón',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Botón de ancho completo',
    },
    loading: {
      control: 'boolean',
      description: 'Estado de carga con spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Estado deshabilitado',
    },
    iconOnly: {
      control: 'boolean',
      description: 'Solo mostrar icono (sin texto)',
    },
    children: {
      control: 'text',
      description: 'Texto del botón',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 📖 Historias Básicas

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline Button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
};

// 📏 Tamaños

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
};

// 🔄 Estados

export const Loading: Story = {
  args: {
    loading: true,
    children: 'Loading...',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: 'Full Width Button',
  },
  parameters: {
    layout: 'padded',
  },
};

// 🎨 Con Iconos

export const WithStartIcon: Story = {
  args: {
    startIcon: '🛒',
    children: 'Add to Cart',
  },
};

export const WithEndIcon: Story = {
  args: {
    endIcon: '→',
    children: 'Continue',
  },
};

export const IconOnly: Story = {
  args: {
    iconOnly: true,
    children: '❤️',
    'aria-label': 'Add to wishlist',
  },
};

// 🛒 Variantes E-commerce

export const EcommerceVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4 w-64">
      <AddToCartButton />
      <BuyNowButton />
      <div className="flex justify-center">
        <WishlistButton />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Variantes específicas para e-commerce con estilos predefinidos.',
      },
    },
  },
};

// 🎯 Casos de Uso Reales

export const ProductActions: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-72 p-4 border rounded-lg bg-[#FFF7EB]">
      <h3 className="font-semibold text-[#712F00]">Pintura Latex Interior 4L</h3>
      <p className="text-2xl font-bold text-[#EF7D00]">$15.250</p>
      <div className="flex gap-2">
        <AddToCartButton className="flex-1" />
        <WishlistButton />
      </div>
      <BuyNowButton />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ejemplo real de uso en una card de producto.',
      },
    },
  },
};

export const CheckoutActions: Story = {
  render: () => (
    <div className="flex flex-col gap-3 w-80 p-6 border rounded-lg">
      <h3 className="font-semibold mb-4">Finalizar Compra</h3>
      <Button variant="outline" fullWidth>
        Volver al Carrito
      </Button>
      <Button variant="primary" fullWidth size="lg">
        Confirmar Pedido
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Botones de acción en el proceso de checkout.',
      },
    },
  },
};

// 🎨 Todas las Variantes

export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-3">
        <h4 className="font-semibold">Filled Variants</h4>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="success">Success</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
      <div className="space-y-3">
        <h4 className="font-semibold">Subtle Variants</h4>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Todas las variantes disponibles del componente Button.',
      },
    },
  },
};
