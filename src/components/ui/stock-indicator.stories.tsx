import type { Meta, StoryObj } from '@storybook/react'
import { StockIndicator } from './stock-indicator'

const meta = {
  title: 'E-commerce/StockIndicator',
  component: StockIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# StockIndicator Component

Componente para mostrar el estado de disponibilidad de stock en productos de e-commerce.

## Características

- **Estados automáticos**: En stock, stock bajo, sin stock, pre-orden
- **Umbrales configurables**: Define cuándo considerar stock bajo
- **Cantidad exacta**: Opción para mostrar cantidad específica
- **Fechas de reposición**: Información de cuándo estará disponible
- **Variantes de diseño**: Default, compact, badge, minimal
- **Íconos contextuales**: Íconos apropiados para cada estado
- **Unidades personalizables**: Soporte para diferentes unidades de medida

## Estados de Stock

- **En Stock** (verde): Cantidad > umbral bajo
- **Stock Bajo** (amarillo): Cantidad ≤ umbral bajo
- **Sin Stock** (rojo): Cantidad = 0
- **Pre-orden** (azul): Sin stock pero permite pedidos

## Uso

\`\`\`tsx
<StockIndicator 
  quantity={3}
  lowStockThreshold={5}
  showExactQuantity
  unit="litros"
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    quantity: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Cantidad disponible en stock',
    },
    lowStockThreshold: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Umbral para considerar stock bajo',
    },
    showExactQuantity: {
      control: { type: 'boolean' },
      description: 'Mostrar cantidad exacta',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'compact', 'badge', 'minimal'],
      description: 'Variante de diseño',
    },
    showIcon: {
      control: { type: 'boolean' },
      description: 'Mostrar ícono de estado',
    },
    allowPreOrder: {
      control: { type: 'boolean' },
      description: 'Permitir pre-orden cuando no hay stock',
    },
    unit: {
      control: { type: 'text' },
      description: 'Unidad de medida',
    },
  },
} satisfies Meta<typeof StockIndicator>

export default meta
type Story = StoryObj<typeof meta>

// En stock
export const InStock: Story = {
  args: {
    quantity: 15,
    lowStockThreshold: 5,
    showExactQuantity: true,
  },
}

// Stock bajo
export const LowStock: Story = {
  args: {
    quantity: 3,
    lowStockThreshold: 5,
    showExactQuantity: true,
  },
}

// Sin stock
export const OutOfStock: Story = {
  args: {
    quantity: 0,
    lowStockThreshold: 5,
  },
}

// Pre-orden
export const PreOrder: Story = {
  args: {
    quantity: 0,
    allowPreOrder: true,
    lowStockThreshold: 5,
  },
}

// Con fecha de reposición
export const WithRestockDate: Story = {
  args: {
    quantity: 0,
    restockDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días
  },
}

// Variantes de diseño
export const Variants: Story = {
  args: {
    quantity: 8,
  },
  render: () => (
    <div className='space-y-4'>
      <div>
        <h3 className='text-sm font-medium mb-2'>Default</h3>
        <StockIndicator quantity={8} variant='default' showExactQuantity />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Compact</h3>
        <StockIndicator quantity={3} variant='compact' showExactQuantity />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Badge</h3>
        <div className='relative inline-block'>
          <div className='w-16 h-16 bg-gray-200 rounded'></div>
          <StockIndicator quantity={2} variant='badge' />
        </div>
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Minimal</h3>
        <StockIndicator quantity={12} variant='minimal' />
      </div>
    </div>
  ),
}

// Diferentes unidades
export const DifferentUnits: Story = {
  args: {
    quantity: 5,
  },
  render: () => (
    <div className='space-y-4'>
      <div>
        <h3 className='text-sm font-medium mb-2'>Unidades (default)</h3>
        <StockIndicator quantity={5} showExactQuantity />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Litros</h3>
        <StockIndicator quantity={3} unit='litros' showExactQuantity />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Kilogramos</h3>
        <StockIndicator quantity={8} unit='kg' showExactQuantity />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Metros</h3>
        <StockIndicator quantity={2} unit='metros' showExactQuantity />
      </div>
    </div>
  ),
}

// Productos de pinturería
export const PaintProducts: Story = {
  args: {
    quantity: 12,
  },
  render: () => (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      <div className='border p-4 rounded-lg'>
        <h3 className='font-medium mb-2'>Pintura Sherwin Williams 4L</h3>
        <StockIndicator quantity={12} unit='latas' showExactQuantity lowStockThreshold={5} />
      </div>
      <div className='border p-4 rounded-lg'>
        <h3 className='font-medium mb-2'>Poximix 250ml</h3>
        <StockIndicator quantity={2} unit='tubos' showExactQuantity lowStockThreshold={5} />
      </div>
      <div className='border p-4 rounded-lg'>
        <h3 className='font-medium mb-2'>Lija El Galgo #120</h3>
        <StockIndicator
          quantity={0}
          allowPreOrder
          restockDate={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)}
        />
      </div>
      <div className='border p-4 rounded-lg'>
        <h3 className='font-medium mb-2'>Pincel Plavicon 2"</h3>
        <StockIndicator quantity={25} unit='pinceles' showExactQuantity variant='compact' />
      </div>
    </div>
  ),
}

// Estados sin íconos
export const WithoutIcons: Story = {
  args: {
    quantity: 15,
  },
  render: () => (
    <div className='space-y-4'>
      <StockIndicator quantity={15} showIcon={false} showExactQuantity />
      <StockIndicator quantity={3} showIcon={false} showExactQuantity />
      <StockIndicator quantity={0} showIcon={false} />
      <StockIndicator quantity={0} allowPreOrder showIcon={false} />
    </div>
  ),
}

// Textos personalizados
export const CustomTexts: Story = {
  args: {
    quantity: 3,
    lowStockThreshold: 5,
    customTexts: {
      lowStock: '¡Últimas disponibles!',
      inStock: 'Disponible para entrega inmediata',
      outOfStock: 'Temporalmente agotado',
      preOrder: 'Reservá tu producto',
    },
  },
}
