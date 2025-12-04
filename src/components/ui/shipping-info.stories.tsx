import type { Meta, StoryObj } from '@storybook/react'
import { ShippingInfo } from './shipping-info'

const meta = {
  title: 'E-commerce/ShippingInfo',
  component: ShippingInfo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# ShippingInfo Component

Componente para mostrar información de envío y opciones de entrega en e-commerce.

## Características

- **Múltiples opciones**: Envío gratis, rápido, estándar, express, retiro
- **Calculadora de envío**: Permite calcular costo por código postal
- **Variantes de diseño**: Default, inline, badge, card
- **Estimación de entrega**: Rangos de días hábiles
- **Garantías de envío**: Badges de protección y garantía
- **Selección interactiva**: Callback para seleccionar opciones

## Tipos de Envío

- **Gratis** (verde): Sin costo adicional
- **Rápido** (azul): Entrega acelerada
- **Estándar** (gris): Envío normal
- **Express** (púrpura): Entrega express
- **Retiro** (naranja): Retiro en sucursal

## Uso

\`\`\`tsx
<ShippingInfo 
  options={[
    {
      id: 'free',
      name: 'Envío gratis',
      price: 0,
      estimatedDays: { min: 3, max: 5 },
      isFree: true
    }
  ]}
  showCalculator
  showGuarantees
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'inline', 'badge', 'card'],
      description: 'Variante de diseño',
    },
    type: {
      control: { type: 'select' },
      options: ['free', 'fast', 'standard', 'express', 'pickup'],
      description: 'Tipo de envío',
    },
    highlightFreeShipping: {
      control: { type: 'boolean' },
      description: 'Destacar envío gratis',
    },
    showCalculator: {
      control: { type: 'boolean' },
      description: 'Mostrar calculadora de envío',
    },
    showGuarantees: {
      control: { type: 'boolean' },
      description: 'Mostrar garantías de envío',
    },
    postalCode: {
      control: { type: 'text' },
      description: 'Código postal',
    },
  },
} satisfies Meta<typeof ShippingInfo>

export default meta
type Story = StoryObj<typeof meta>

// Envío gratis simple
export const FreeShipping: Story = {
  args: {
    highlightFreeShipping: true,
  },
}

// Badge de envío gratis
export const FreeShippingBadge: Story = {
  args: {
    variant: 'badge',
    type: 'free',
  },
}

// Inline con calculadora
export const InlineWithCalculator: Story = {
  args: {
    variant: 'inline',
    showCalculator: true,
    postalCode: '1425',
  },
}

// Card con múltiples opciones
export const MultipleOptions: Story = {
  args: {
    variant: 'card',
      options: [
        {
          id: 'free',
          name: 'Envío gratis',
          price: 0,
          estimatedDays: { min: 5, max: 7 },
          isFree: true,
          description: 'En compras mayores a $50.000',
        },
        {
          id: 'standard',
          name: 'Envío estándar',
          price: 1500,
        estimatedDays: { min: 3, max: 5 },
        description: 'Entrega a domicilio',
      },
      {
        id: 'express',
        name: 'Envío express',
        price: 3000,
        estimatedDays: { min: 1, max: 2 },
        isExpress: true,
        description: 'Entrega prioritaria',
      },
      {
        id: 'pickup',
        name: 'Retiro en sucursal',
        price: 0,
        estimatedDays: { min: 1, max: 1 },
        isFree: true,
        description: 'Retirá en nuestro local',
      },
    ],
    selectedOption: 'standard',
    showGuarantees: true,
  },
}

// Con calculadora y garantías
export const WithCalculatorAndGuarantees: Story = {
  args: {
    variant: 'card',
    showCalculator: true,
    showGuarantees: true,
    options: [
      {
        id: 'free',
        name: 'Envío gratis',
        price: 0,
        estimatedDays: { min: 3, max: 5 },
        isFree: true,
      },
    ],
  },
}

// Variantes de diseño
export const Variants: Story = {
  render: () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-sm font-medium mb-2'>Default</h3>
        <ShippingInfo variant='default' highlightFreeShipping />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Inline</h3>
        <ShippingInfo variant='inline' highlightFreeShipping />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Badge</h3>
        <ShippingInfo variant='badge' type='free' />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Card</h3>
        <div className='max-w-md'>
          <ShippingInfo
            variant='card'
            options={[
              {
                id: 'free',
                name: 'Envío gratis',
                price: 0,
                estimatedDays: { min: 3, max: 5 },
                isFree: true,
              },
            ]}
          />
        </div>
      </div>
    </div>
  ),
}

// Productos de pinturería
export const PaintProductsShipping: Story = {
  render: () => (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
      <div className='border p-4 rounded-lg'>
        <h3 className='font-medium mb-3'>Pintura Sherwin Williams 4L</h3>
        <ShippingInfo
          variant='card'
          options={[
            {
              id: 'free',
              name: 'Envío gratis',
              price: 0,
              estimatedDays: { min: 5, max: 7 },
              isFree: true,
              description: 'Compra mínima $50.000',
            },
            {
              id: 'standard',
              name: 'Envío estándar',
              price: 2500,
              estimatedDays: { min: 3, max: 5 },
              description: 'Productos pesados',
            },
          ]}
          showGuarantees
        />
      </div>
      <div className='border p-4 rounded-lg'>
        <h3 className='font-medium mb-3'>Poximix 250ml</h3>
        <ShippingInfo variant='inline' highlightFreeShipping showCalculator />
      </div>
      <div className='border p-4 rounded-lg'>
        <h3 className='font-medium mb-3'>Lija El Galgo</h3>
        <ShippingInfo variant='badge' type='free' />
      </div>
      <div className='border p-4 rounded-lg'>
        <h3 className='font-medium mb-3'>Kit de Pinceles</h3>
        <ShippingInfo
          variant='card'
          options={[
            {
              id: 'express',
              name: 'Envío express',
              price: 1800,
              estimatedDays: { min: 1, max: 2 },
              isExpress: true,
              description: 'Productos livianos',
            },
            {
              id: 'pickup',
              name: 'Retiro en sucursal',
              price: 0,
              estimatedDays: { min: 1, max: 1 },
              isFree: true,
              description: 'Av. Corrientes 1234',
            },
          ]}
          selectedOption='pickup'
        />
      </div>
    </div>
  ),
}

// Tipos de envío
export const ShippingTypes: Story = {
  render: () => (
    <div className='space-y-4'>
      <div>
        <h3 className='text-sm font-medium mb-2'>Envío Gratis</h3>
        <ShippingInfo variant='inline' type='free' highlightFreeShipping />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Envío Rápido</h3>
        <ShippingInfo variant='inline' type='fast' />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Envío Estándar</h3>
        <ShippingInfo variant='inline' type='standard' />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Envío Express</h3>
        <ShippingInfo variant='inline' type='express' />
      </div>
      <div>
        <h3 className='text-sm font-medium mb-2'>Retiro en Sucursal</h3>
        <ShippingInfo variant='inline' type='pickup' />
      </div>
    </div>
  ),
}

// Calculadora interactiva
export const InteractiveCalculator: Story = {
  args: {
    variant: 'card',
    showCalculator: true,
    productWeight: 2.5,
    productDimensions: {
      length: 20,
      width: 15,
      height: 25,
    },
    options: [
      {
        id: 'calculated',
        name: 'Envío calculado',
        price: 1200,
        estimatedDays: { min: 2, max: 4 },
        description: 'Basado en tu ubicación',
      },
    ],
  },
}
