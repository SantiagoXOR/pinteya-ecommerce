import type { Meta, StoryObj } from '@storybook/react'
import { PriceDisplay } from './price-display'

const meta = {
  title: 'E-commerce/PriceDisplay',
  component: PriceDisplay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# PriceDisplay Component

Componente especializado para mostrar precios en e-commerce con soporte para:

## Características

- **Precios con descuento**: Muestra precio original tachado y porcentaje de descuento
- **Información de cuotas**: Soporte para mostrar cuotas sin interés
- **Múltiples monedas**: Soporte para ARS y otras monedas
- **Envío gratis**: Badge de envío gratis
- **Variantes de diseño**: Default, center, compact
- **Tamaños responsivos**: sm, md, lg, xl

## Inspirado en MercadoPago

Este componente sigue los patrones de UI de MercadoPago para e-commerce argentino.

## Uso

\`\`\`tsx
<PriceDisplay 
  amount={1550} 
  originalAmount={2000}
  installments={{
    quantity: 12,
    amount: 129,
    interestFree: true
  }}
  showFreeShipping
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    amount: {
      control: { type: 'number' },
      description: 'Precio actual en centavos (ej: 1550 = $15.50)',
    },
    originalAmount: {
      control: { type: 'number' },
      description: 'Precio original antes del descuento en centavos',
    },
    currency: {
      control: { type: 'select' },
      options: ['ARS', 'USD', 'EUR'],
      description: 'Código de moneda',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'center', 'compact'],
      description: 'Variante de diseño',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Tamaño del componente',
    },
    showDiscountPercentage: {
      control: { type: 'boolean' },
      description: 'Mostrar porcentaje de descuento',
    },
    showFreeShipping: {
      control: { type: 'boolean' },
      description: 'Mostrar badge de envío gratis',
    },
  },
} satisfies Meta<typeof PriceDisplay>

export default meta
type Story = StoryObj<typeof meta>

// Historia básica
export const Default: Story = {
  args: {
    amount: 1550,
    currency: 'ARS',
  },
}

// Con descuento
export const WithDiscount: Story = {
  args: {
    amount: 1550,
    originalAmount: 2000,
    currency: 'ARS',
    showDiscountPercentage: true,
  },
}

// Con cuotas sin interés
export const WithInstallments: Story = {
  args: {
    amount: 15000,
    currency: 'ARS',
    installments: {
      quantity: 12,
      amount: 1250,
      interestFree: true,
    },
  },
}

// Completo con todo
export const Complete: Story = {
  args: {
    amount: 15000,
    originalAmount: 20000,
    currency: 'ARS',
    installments: {
      quantity: 12,
      amount: 1250,
      interestFree: true,
    },
    showDiscountPercentage: true,
    showFreeShipping: true,
  },
}

// Variante centrada
export const Centered: Story = {
  args: {
    amount: 15000,
    originalAmount: 20000,
    variant: 'center',
    showDiscountPercentage: true,
    showFreeShipping: true,
  },
}

// Variante compacta
export const Compact: Story = {
  args: {
    amount: 15000,
    originalAmount: 20000,
    variant: 'compact',
    showDiscountPercentage: true,
  },
}

// Tamaños
export const Sizes: Story = {
  args: {
    amount: 1500000,
  },
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Small</h3>
        <PriceDisplay amount={1550} originalAmount={2000} size="sm" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Medium (Default)</h3>
        <PriceDisplay amount={1550} originalAmount={2000} size="md" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Large</h3>
        <PriceDisplay amount={1550} originalAmount={2000} size="lg" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Extra Large</h3>
        <PriceDisplay amount={1550} originalAmount={2000} size="xl" />
      </div>
    </div>
  ),
}

// Productos de pinturería reales
export const PaintProducts: Story = {
  args: {
    amount: 1500000,
  },
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border p-4 rounded-lg">
        <h3 className="font-medium mb-2">Pintura Sherwin Williams</h3>
        <PriceDisplay 
          amount={8500}
          originalAmount={10000}
          installments={{
            quantity: 6,
            amount: 1417,
            interestFree: true
          }}
          showFreeShipping
        />
      </div>
      <div className="border p-4 rounded-lg">
        <h3 className="font-medium mb-2">Poximix Adhesivo</h3>
        <PriceDisplay 
          amount={2300}
          installments={{
            quantity: 3,
            amount: 767,
            interestFree: true
          }}
        />
      </div>
      <div className="border p-4 rounded-lg">
        <h3 className="font-medium mb-2">Lija El Galgo</h3>
        <PriceDisplay 
          amount={450}
          variant="compact"
          size="sm"
        />
      </div>
      <div className="border p-4 rounded-lg">
        <h3 className="font-medium mb-2">Pincel Plavicon</h3>
        <PriceDisplay
          amount={1200}
          originalAmount={1500}
          showDiscountPercentage
          variant="center"
        />
      </div>
    </div>
  ),
}

// Monedas diferentes
export const DifferentCurrencies: Story = {
  args: {
    amount: 1500000,
  },
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Pesos Argentinos (ARS)</h3>
        <PriceDisplay amount={1550} currency="ARS" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Dólares (USD)</h3>
        <PriceDisplay amount={1550} currency="USD" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Símbolo personalizado</h3>
        <PriceDisplay amount={1550} currencySymbol="$" />
      </div>
    </div>
  ),
}
