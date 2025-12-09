import type { Meta, StoryObj } from '@storybook/react'
import {
  TrustBadge,
  SecurePurchaseBadge,
  MoneyBackBadge,
  FastShippingBadge,
  QualityBadge,
  SupportBadge,
  PaymentSecurityBadge,
  LocalBusinessBadge,
  InstantDeliveryBadge,
  TrustBadgeGroup,
} from './trust-badges'
import { Shield, Star, Truck } from '@/lib/optimized-imports'

const meta = {
  title: 'UI/TrustBadges',
  component: TrustBadge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# TrustBadges

Sistema completo de badges de confianza para e-commerce, diseñados para aumentar la conversión y generar confianza en los usuarios.

## Características

- **6 variantes**: Security, Guarantee, Shipping, Quality, Support, Payment
- **3 tamaños**: sm, md, lg
- **4 animaciones**: None, Pulse, Bounce, Glow
- **Badges especializados**: 8 tipos diferentes para diferentes casos de uso
- **Componente grupal**: TrustBadgeGroup para mostrar múltiples badges

## Badges Especializados

- \`SecurePurchaseBadge\`: Compra protegida y seguridad
- \`MoneyBackBadge\`: Garantía de devolución
- \`FastShippingBadge\`: Envío rápido
- \`QualityBadge\`: Calidad premium y ratings
- \`SupportBadge\`: Soporte al cliente
- \`PaymentSecurityBadge\`: Seguridad de pagos
- \`LocalBusinessBadge\`: Negocio local establecido
- \`InstantDeliveryBadge\`: Entrega inmediata

## Casos de uso

- Páginas de producto para generar confianza
- Checkout para reducir abandono
- Homepage para mostrar credibilidad
- Carrito de compras para incentivar compra
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['security', 'guarantee', 'shipping', 'quality', 'support', 'payment'],
      description: 'Variante visual del badge',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Tamaño del badge',
    },
    animation: {
      control: 'select',
      options: ['none', 'pulse', 'bounce', 'glow'],
      description: 'Animación del badge',
    },
  },
} satisfies Meta<typeof TrustBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: 'security',
    size: 'md',
    animation: 'none',
    icon: <Shield className='w-4 h-4' />,
    children: 'Compra Protegida',
  },
}

export const AllVariants: Story = {
  args: {
    children: 'Trust Badge',
  },
  render: () => (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <TrustBadge variant='security' icon={<Shield className='w-4 h-4' />}>
          Compra Protegida
        </TrustBadge>
        <TrustBadge variant='guarantee' icon={<Shield className='w-4 h-4' />}>
          30 días garantía
        </TrustBadge>
        <TrustBadge variant='shipping' icon={<Truck className='w-4 h-4' />}>
          Envío en 24hs
        </TrustBadge>
        <TrustBadge variant='quality' icon={<Star className='w-4 h-4' />}>
          Calidad Premium
        </TrustBadge>
        <TrustBadge variant='support' icon={<Shield className='w-4 h-4' />}>
          Soporte 24/7
        </TrustBadge>
        <TrustBadge variant='payment' icon={<Shield className='w-4 h-4' />}>
          Pago Seguro
        </TrustBadge>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Todas las variantes disponibles de TrustBadge.',
      },
    },
  },
}

export const AllSizes: Story = {
  args: {
    children: 'Trust Badge',
  },
  render: () => (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <TrustBadge variant='security' size='sm' icon={<Shield className='w-3 h-3' />}>
          Pequeño
        </TrustBadge>
        <TrustBadge variant='security' size='md' icon={<Shield className='w-4 h-4' />}>
          Mediano
        </TrustBadge>
        <TrustBadge variant='security' size='lg' icon={<Shield className='w-5 h-5' />}>
          Grande
        </TrustBadge>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes tamaños disponibles.',
      },
    },
  },
}

export const WithAnimations: Story = {
  args: {
    children: 'Trust Badge',
  },
  render: () => (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <TrustBadge variant='security' animation='none' icon={<Shield className='w-4 h-4' />}>
          Sin animación
        </TrustBadge>
        <TrustBadge variant='guarantee' animation='pulse' icon={<Shield className='w-4 h-4' />}>
          Pulse
        </TrustBadge>
        <TrustBadge variant='shipping' animation='bounce' icon={<Truck className='w-4 h-4' />}>
          Bounce
        </TrustBadge>
        <TrustBadge variant='quality' animation='glow' icon={<Star className='w-4 h-4' />}>
          Glow
        </TrustBadge>
      </div>
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

export const SpecializedBadges: Story = {
  args: {
    children: 'Trust Badge',
  },
  render: () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Seguridad y Garantías</h3>
        <div className='flex flex-wrap gap-2'>
          <SecurePurchaseBadge />
          <MoneyBackBadge days={30} />
          <PaymentSecurityBadge provider='mercadopago' />
          <PaymentSecurityBadge provider='ssl' />
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-3'>Envío y Entrega</h3>
        <div className='flex flex-wrap gap-2'>
          <FastShippingBadge hours={24} />
          <FastShippingBadge text='Envío Gratis' />
          <InstantDeliveryBadge />
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-3'>Calidad y Soporte</h3>
        <div className='flex flex-wrap gap-2'>
          <QualityBadge />
          <QualityBadge rating={5} text='Excelente' />
          <SupportBadge type='phone' hours='24/7' />
          <SupportBadge type='chat' />
          <LocalBusinessBadge city='Córdoba' years={15} />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges especializados organizados por categoría.',
      },
    },
  },
}

export const EcommerceProductPage: Story = {
  args: {
    children: 'Trust Badge',
  },
  render: () => (
    <div className='max-w-md mx-auto p-6 border rounded-lg bg-white'>
      <div className='space-y-4'>
        <h2 className='text-xl font-bold'>Pintura Látex Premium</h2>
        <p className='text-2xl font-bold text-primary'>$15.500</p>

        <div className='space-y-3'>
          <div className='flex flex-wrap gap-2'>
            <SecurePurchaseBadge size='sm' />
            <FastShippingBadge size='sm' hours={24} />
            <QualityBadge size='sm' rating={5} text='Premium' />
          </div>

          <div className='flex flex-wrap gap-2'>
            <MoneyBackBadge size='sm' days={30} />
            <PaymentSecurityBadge size='sm' provider='mercadopago' />
          </div>
        </div>

        <button className='w-full bg-primary text-white py-2 px-4 rounded-lg font-medium'>
          Agregar al Carrito
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ejemplo de uso en página de producto para generar confianza.',
      },
    },
  },
}

export const CheckoutPage: Story = {
  args: {
    children: 'Trust Badge',
  },
  render: () => (
    <div className='max-w-sm mx-auto p-6 border rounded-lg bg-gray-50'>
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Resumen del Pedido</h3>
        <div className='space-y-2'>
          <div className='flex justify-between'>
            <span>Subtotal</span>
            <span>$15.500</span>
          </div>
          <div className='flex justify-between'>
            <span>Envío</span>
            <span className='text-green-600'>Gratis</span>
          </div>
          <hr />
          <div className='flex justify-between font-bold'>
            <span>Total</span>
            <span>$15.500</span>
          </div>
        </div>

        <div className='bg-white p-3 rounded-lg'>
          <TrustBadgeGroup badges={['secure', 'payment', 'support']} layout='vertical' size='sm' />
        </div>

        <button className='w-full bg-primary text-white py-3 px-4 rounded-lg font-medium'>
          Finalizar Compra
        </button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ejemplo de uso en checkout para reducir abandono de carrito.',
      },
    },
  },
}

export const TrustBadgeGroupHorizontal: Story = {
  args: {
    children: 'Trust Badge',
  },
  render: () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Layout Horizontal</h3>
        <TrustBadgeGroup
          badges={['secure', 'guarantee', 'shipping', 'quality']}
          layout='horizontal'
          size='md'
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TrustBadgeGroup con layout horizontal.',
      },
    },
  },
}

export const TrustBadgeGroupVertical: Story = {
  args: {
    children: 'Trust Badge',
  },
  render: () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Layout Vertical</h3>
        <TrustBadgeGroup badges={['secure', 'guarantee', 'shipping']} layout='vertical' size='md' />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TrustBadgeGroup con layout vertical.',
      },
    },
  },
}

export const TrustBadgeGroupGrid: Story = {
  args: {
    children: 'Trust Badge',
  },
  render: () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Layout Grid</h3>
        <TrustBadgeGroup
          badges={['secure', 'guarantee', 'shipping', 'quality', 'support', 'payment']}
          layout='grid'
          size='sm'
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'TrustBadgeGroup con layout en grid.',
      },
    },
  },
}
