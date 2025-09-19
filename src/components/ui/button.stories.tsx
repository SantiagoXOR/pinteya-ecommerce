import type { Meta, StoryObj } from '@storybook/react'
import { ShoppingCart, Heart, ArrowRight, Plus, Download } from 'lucide-react'
import { Button } from './button'

const meta = {
  title: 'Design System/Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Button Component

Componente de botón optimizado para e-commerce de pinturería con múltiples variantes y estados interactivos.

## Características

- **8 variantes**: Primary, Secondary, Outline, Ghost, Destructive, Success, Warning, Link
- **7 tamaños**: sm, md, lg, xl, icon, icon-sm, icon-lg
- **Estados**: Loading, Disabled, con íconos
- **Accesibilidad**: WCAG 2.1 AA compliant
- **Mobile-first**: Touch targets optimizados

## Uso

\`\`\`tsx
import { Button } from '@/components/ui/button'

<Button variant="primary" size="lg">
  Agregar al carrito
</Button>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'success', 'warning', 'link'],
      description: 'Variante visual del botón',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'icon', 'icon-sm', 'icon-lg'],
      description: 'Tamaño del botón',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Si el botón debe ocupar todo el ancho disponible',
    },
    loading: {
      control: 'boolean',
      description: 'Estado de carga con spinner',
    },
    disabled: {
      control: 'boolean',
      description: 'Estado deshabilitado',
    },
    children: {
      control: 'text',
      description: 'Contenido del botón',
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Stories básicas
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Agregar al carrito',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Ver detalles',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Agregar a favoritos',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Cancelar',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Eliminar producto',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Pedido confirmado',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Stock limitado',
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Ver más productos',
  },
}

// Tamaños
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 flex-wrap">
      <Button variant="primary" size="sm">Pequeño</Button>
      <Button variant="primary" size="md">Mediano</Button>
      <Button variant="primary" size="lg">Grande</Button>
      <Button variant="primary" size="xl">Extra Grande</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes tamaños disponibles para el botón.',
      },
    },
  },
}

// Con íconos
export const WithIcons: Story = {
  render: () => (
    <div className="flex items-center gap-4 flex-wrap">
      <Button variant="primary" leftIcon={<ShoppingCart className="w-4 h-4" />}>
        Agregar al carrito
      </Button>
      <Button variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />}>
        Ver más
      </Button>
      <Button variant="secondary" leftIcon={<Download className="w-4 h-4" />} rightIcon={<ArrowRight className="w-4 h-4" />}>
        Descargar catálogo
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Botones con íconos a la izquierda, derecha o ambos lados.',
      },
    },
  },
}

// Botones de íconos
export const IconButtons: Story = {
  render: () => (
    <div className="flex items-center gap-4 flex-wrap">
      <Button variant="primary" size="icon">
        <ShoppingCart className="w-4 h-4" />
      </Button>
      <Button variant="outline" size="icon">
        <Heart className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon-sm">
        <Plus className="w-3 h-3" />
      </Button>
      <Button variant="secondary" size="icon-lg">
        <Download className="w-5 h-5" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Botones que contienen solo íconos en diferentes tamaños.',
      },
    },
  },
}

// Estados
export const Loading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Procesando...',
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado de carga con spinner animado.',
      },
    },
  },
}

export const Disabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Sin stock',
  },
  parameters: {
    docs: {
      description: {
        story: 'Estado deshabilitado para acciones no disponibles.',
      },
    },
  },
}

export const FullWidth: Story = {
  args: {
    variant: 'primary',
    fullWidth: true,
    children: 'Finalizar compra',
  },
  parameters: {
    docs: {
      description: {
        story: 'Botón que ocupa todo el ancho disponible, ideal para formularios y móviles.',
      },
    },
  },
}

// Casos de uso específicos para e-commerce
export const EcommerceExamples: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-md">
      {/* Producto card actions */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-gray-600">Acciones de producto</h3>
        <div className="flex gap-2">
          <Button variant="primary" size="lg" className="flex-1">
            Agregar al carrito
          </Button>
          <Button variant="outline" size="lg">
            <Heart className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Checkout flow */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-gray-600">Flujo de compra</h3>
        <div className="space-y-2">
          <Button variant="primary" fullWidth size="lg">
            🚀 Comprar ahora
          </Button>
          <Button variant="outline" fullWidth>
            Agregar al carrito
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm text-gray-600">Navegación</h3>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<ArrowRight className="w-4 h-4 rotate-180" />}>
            Anterior
          </Button>
          <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ejemplos de uso común en e-commerce: acciones de producto, checkout y navegación.',
      },
    },
  },
}

// Todas las variantes juntas
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="success">Success</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="link">Link</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Todas las variantes de botón disponibles en el Design System.',
      },
    },
  },
}









