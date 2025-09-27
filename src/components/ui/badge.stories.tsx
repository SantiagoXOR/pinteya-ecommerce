import type { Meta, StoryObj } from '@storybook/react'
import { Tag, Truck, Package, Star, X } from 'lucide-react'
import { Badge, DiscountBadge, ShippingBadge, StockBadge, NewBadge, OfferBadge } from './badge'

const meta = {
  title: 'Design System/Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Badge Component

Sistema completo de badges para e-commerce de pinturería con variantes especializadas y animaciones.

## Características

- **12 variantes**: Default, Secondary, Destructive, Success, Warning, Info, Outline variants
- **3 tamaños**: sm, md, lg
- **4 animaciones**: None, Pulse, Bounce, Ping
- **Badges especializados**: Descuento, Envío, Stock, Nuevo, Oferta
- **Funcionalidades**: Íconos, closable, estados interactivos

## Badges Especializados

- \`DiscountBadge\`: Para mostrar descuentos porcentuales
- \`ShippingBadge\`: Para información de envío
- \`StockBadge\`: Para estados de inventario
- \`NewBadge\`: Para productos nuevos
- \`OfferBadge\`: Para ofertas especiales

## Uso

\`\`\`tsx
import { Badge, DiscountBadge, ShippingBadge } from '@/components/ui/badge'

<Badge variant="primary">Destacado</Badge>
<DiscountBadge percentage={30} />
<ShippingBadge free />
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'destructive',
        'success',
        'warning',
        'info',
        'outline',
        'outline-primary',
        'outline-destructive',
        'outline-success',
        'outline-warning',
        'outline-info',
      ],
      description: 'Variante visual del badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Tamaño del badge',
    },
    animation: {
      control: 'select',
      options: ['none', 'pulse', 'bounce', 'ping'],
      description: 'Animación del badge',
    },
    closable: {
      control: 'boolean',
      description: 'Si el badge puede cerrarse',
    },
    children: {
      control: 'text',
      description: 'Contenido del badge',
    },
  },
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

// Badge básico
export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
    size: 'md',
    animation: 'none',
  },
}

// Variantes de color
export const ColorVariants: Story = {
  render: () => (
    <div className='flex flex-wrap gap-2'>
      <Badge variant='default'>Default</Badge>
      <Badge variant='secondary'>Secondary</Badge>
      <Badge variant='destructive'>Destructive</Badge>
      <Badge variant='success'>Success</Badge>
      <Badge variant='warning'>Warning</Badge>
      <Badge variant='info'>Info</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes variantes de color para badges.',
      },
    },
  },
}

// Variantes outline
export const OutlineVariants: Story = {
  render: () => (
    <div className='flex flex-wrap gap-2'>
      <Badge variant='outline'>Outline</Badge>
      <Badge variant='outline-primary'>Primary</Badge>
      <Badge variant='outline-destructive'>Destructive</Badge>
      <Badge variant='outline-success'>Success</Badge>
      <Badge variant='outline-warning'>Warning</Badge>
      <Badge variant='outline-info'>Info</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Variantes outline con bordes coloreados.',
      },
    },
  },
}

// Tamaños
export const Sizes: Story = {
  render: () => (
    <div className='flex items-center gap-4'>
      <Badge variant='default' size='sm'>
        Pequeño
      </Badge>
      <Badge variant='default' size='md'>
        Mediano
      </Badge>
      <Badge variant='default' size='lg'>
        Grande
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes tamaños disponibles para badges.',
      },
    },
  },
}

// Con íconos
export const WithIcons: Story = {
  render: () => (
    <div className='flex flex-wrap gap-2'>
      <Badge variant='success' icon={<Truck className='w-3 h-3' />}>
        Envío gratis
      </Badge>
      <Badge variant='warning' icon={<Package className='w-3 h-3' />}>
        Stock limitado
      </Badge>
      <Badge variant='info' icon={<Star className='w-3 h-3' />}>
        Destacado
      </Badge>
      <Badge variant='destructive' icon={<Tag className='w-3 h-3' />}>
        Oferta
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges con íconos para mayor contexto visual.',
      },
    },
  },
}

// Closable badges
export const Closable: Story = {
  render: () => (
    <div className='flex flex-wrap gap-2'>
      <Badge variant='default' closable onClose={() => alert('Badge cerrado')}>
        Filtro aplicado
      </Badge>
      <Badge variant='info' closable onClose={() => alert('Badge cerrado')}>
        Categoría: Pinturas
      </Badge>
      <Badge variant='warning' closable onClose={() => alert('Badge cerrado')}>
        Precio: $1000-$5000
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges que pueden cerrarse, útiles para filtros y tags.',
      },
    },
  },
}

// Animaciones
export const Animations: Story = {
  render: () => (
    <div className='flex flex-wrap gap-4'>
      <Badge variant='destructive' animation='pulse'>
        Pulse
      </Badge>
      <Badge variant='warning' animation='bounce'>
        Bounce
      </Badge>
      <Badge variant='info' animation='ping'>
        Ping
      </Badge>
      <Badge variant='success' animation='none'>
        Sin animación
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes animaciones para llamar la atención.',
      },
    },
  },
}

// Badges especializados para e-commerce
export const EcommerceBadges: Story = {
  render: () => (
    <div className='space-y-6'>
      {/* Descuentos */}
      <div className='space-y-2'>
        <h3 className='font-semibold text-sm text-gray-600'>Descuentos</h3>
        <div className='flex flex-wrap gap-2'>
          <DiscountBadge percentage={10} />
          <DiscountBadge percentage={25} />
          <DiscountBadge percentage={50} />
        </div>
      </div>

      {/* Envío */}
      <div className='space-y-2'>
        <h3 className='font-semibold text-sm text-gray-600'>Envío</h3>
        <div className='flex flex-wrap gap-2'>
          <ShippingBadge free />
          <ShippingBadge fast />
          <ShippingBadge text='Envío express' />
        </div>
      </div>

      {/* Stock */}
      <div className='space-y-2'>
        <h3 className='font-semibold text-sm text-gray-600'>Stock</h3>
        <div className='flex flex-wrap gap-2'>
          <StockBadge stock={0} />
          <StockBadge stock={3} />
          <StockBadge stock={15} />
        </div>
      </div>

      {/* Promocionales */}
      <div className='space-y-2'>
        <h3 className='font-semibold text-sm text-gray-600'>Promocionales</h3>
        <div className='flex flex-wrap gap-2'>
          <NewBadge />
          <OfferBadge />
          <NewBadge text='LANZAMIENTO' />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges especializados para e-commerce: descuentos, envío, stock y promocionales.',
      },
    },
  },
}

// Casos de uso en productos
export const ProductUseCases: Story = {
  render: () => (
    <div className='space-y-6 w-full max-w-md'>
      {/* Producto con oferta */}
      <div className='border rounded-lg p-4 space-y-3'>
        <div className='flex items-start justify-between'>
          <h3 className='font-semibold'>Pintura Sherwin Williams</h3>
          <DiscountBadge percentage={30} />
        </div>
        <div className='flex gap-2'>
          <ShippingBadge free />
          <StockBadge stock={5} />
        </div>
        <div className='text-lg font-bold'>$15.500</div>
      </div>

      {/* Producto nuevo */}
      <div className='border rounded-lg p-4 space-y-3'>
        <div className='flex items-start justify-between'>
          <h3 className='font-semibold'>Rodillo Profesional</h3>
          <NewBadge />
        </div>
        <div className='flex gap-2'>
          <Badge variant='success' size='sm'>
            Calidad premium
          </Badge>
          <Badge variant='info' size='sm'>
            Recomendado
          </Badge>
        </div>
        <div className='text-lg font-bold'>$3.200</div>
      </div>

      {/* Producto con múltiples badges */}
      <div className='border rounded-lg p-4 space-y-3'>
        <div className='flex items-start justify-between'>
          <h3 className='font-semibold'>Kit Pintura Completo</h3>
          <OfferBadge />
        </div>
        <div className='flex flex-wrap gap-1'>
          <Badge variant='destructive' size='sm'>
            Liquidación
          </Badge>
          <ShippingBadge free />
          <Badge variant='warning' size='sm'>
            Últimas unidades
          </Badge>
        </div>
        <div className='text-lg font-bold'>$12.500</div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ejemplos de uso real de badges en tarjetas de productos.',
      },
    },
  },
}

// Todas las variantes
export const AllVariants: Story = {
  render: () => (
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
      <Badge variant='default'>Default</Badge>
      <Badge variant='secondary'>Secondary</Badge>
      <Badge variant='destructive'>Destructive</Badge>
      <Badge variant='success'>Success</Badge>
      <Badge variant='warning'>Warning</Badge>
      <Badge variant='info'>Info</Badge>
      <Badge variant='outline'>Outline</Badge>
      <Badge variant='outline-primary'>Outline Primary</Badge>
      <Badge variant='outline-destructive'>Outline Destructive</Badge>
      <Badge variant='outline-success'>Outline Success</Badge>
      <Badge variant='outline-warning'>Outline Warning</Badge>
      <Badge variant='outline-info'>Outline Info</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Todas las variantes de badge disponibles en el Design System.',
      },
    },
  },
}
