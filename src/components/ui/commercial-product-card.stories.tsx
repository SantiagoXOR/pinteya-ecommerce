import type { Meta, StoryObj } from '@storybook/react'
import { CommercialProductCard } from './product-card-commercial'

const meta: Meta<typeof CommercialProductCard> = {
  title: 'E-commerce/CommercialProductCard',
  component: CommercialProductCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# CommercialProductCard

Componente de tarjeta de producto con diseño comercial estilo MercadoLibre, optimizado para conversión y experiencia de usuario.

## Características

- **Diseño comercial impactante** inspirado en MercadoLibre
- **Imagen destacada** más grande (200px vs 120px)  
- **Jerarquía visual mejorada** con precio como elemento principal
- **Badges llamativos** para descuentos y productos nuevos
- **Información de envío destacada** con íconos y ubicación
- **Botón CTA optimizado** para conversión
- **Responsive** y accesible

## Uso

\`\`\`tsx
<CommercialProductCard
  image="/images/products/barniz-campbell.jpg"
  title="Barniz Campbell 4L"
  brand="Petrilac"
  price={19350}
  originalPrice={21500}
  discount="10%"
  isNew={true}
  installments={{
    quantity: 3,
    amount: 6450,
    interestFree: true
  }}
  freeShipping={true}
  onAddToCart={() => console.log('Agregado al carrito')}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    image: {
      control: 'text',
      description: 'URL de la imagen del producto',
    },
    title: {
      control: 'text',
      description: 'Nombre del producto',
    },
    brand: {
      control: 'text',
      description: 'Marca del producto',
    },
    price: {
      control: 'number',
      description: 'Precio actual',
    },
    originalPrice: {
      control: 'number',
      description: 'Precio original (para mostrar descuento)',
    },
    discount: {
      control: 'text',
      description: 'Porcentaje de descuento (ej: "10%")',
    },
    isNew: {
      control: 'boolean',
      description: 'Muestra badge "Nuevo"',
    },
    stock: {
      control: 'number',
      description: 'Cantidad en stock',
    },
    freeShipping: {
      control: 'boolean',
      description: 'Envío gratis manual',
    },
    shippingText: {
      control: 'text',
      description: 'Texto del envío',
    },
    deliveryLocation: {
      control: 'text',
      description: 'Ubicación de entrega',
    },
    cta: {
      control: 'text',
      description: 'Texto del botón',
    },
    showCartAnimation: {
      control: 'boolean',
      description: 'Animación de carga',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Historia básica
export const Default: Story = {
  args: {
    image: '/images/products/petrilac/barniz-campbell-4l.jpg',
    title: 'Barniz Campbell 4L',
    brand: 'Petrilac',
    price: 19350,
    originalPrice: 21500,
    discount: '10%',
    isNew: true,
    stock: 12,
    installments: {
      quantity: 3,
      amount: 6450,
      interestFree: true,
    },
    freeShipping: true,
    onAddToCart: () => console.log('Agregado al carrito'),
  },
}

// Producto sin descuento
export const WithoutDiscount: Story = {
  args: {
    image: '/images/products/sherwin-williams/pintura-sherwin-williams.jpg',
    title: 'Pintura Látex Premium 20L',
    brand: 'Sherwin Williams',
    price: 25000,
    stock: 8,
    installments: {
      quantity: 6,
      amount: 4167,
      interestFree: true,
    },
    freeShipping: true,
    onAddToCart: () => console.log('Agregado al carrito'),
  },
}

// Producto con gran descuento
export const BigDiscount: Story = {
  args: {
    image: '/images/products/sinteplast/esmalte-sintetico.jpg',
    title: 'Esmalte Sintético Brillante 1L',
    brand: 'Sinteplast',
    price: 8500,
    originalPrice: 12000,
    discount: '30%',
    isNew: true,
    stock: 15,
    installments: {
      quantity: 3,
      amount: 2833,
      interestFree: true,
    },
    onAddToCart: () => console.log('Agregado al carrito'),
  },
}

// Producto sin stock
export const OutOfStock: Story = {
  args: {
    image: '/images/products/plavicon/impermeabilizante.jpg',
    title: 'Impermeabilizante Acrílico 10L',
    brand: 'Plavicon',
    price: 18500,
    originalPrice: 20000,
    discount: '8%',
    stock: 0,
    freeShipping: true,
    onAddToCart: () => console.log('Sin stock'),
  },
}

// Producto sin imagen
export const WithoutImage: Story = {
  args: {
    title: 'Producto Sin Imagen',
    brand: 'Marca Genérica',
    price: 15000,
    stock: 5,
    installments: {
      quantity: 3,
      amount: 5000,
      interestFree: true,
    },
    onAddToCart: () => console.log('Agregado al carrito'),
  },
}

// Producto con envío gratis automático
export const AutoFreeShipping: Story = {
  args: {
    image: '/images/products/petrilac/barniz-campbell-4l.jpg',
    title: 'Producto con Envío Gratis Automático',
    brand: 'Petrilac',
    price: 20000, // >= 15000 activa envío gratis automático
    stock: 10,
    installments: {
      quantity: 6,
      amount: 3333,
      interestFree: true,
    },
    onAddToCart: () => console.log('Agregado al carrito'),
  },
}

// Comparación con ProductCard actual
export const Comparison: Story = {
  render: () => (
    <div className='flex gap-8 items-start'>
      <div className='space-y-2'>
        <h3 className='text-lg font-semibold text-center'>Nuevo Diseño Comercial</h3>
        <CommercialProductCard
          image='/images/products/petrilac/barniz-campbell-4l.jpg'
          title='Barniz Campbell 4L'
          brand='Petrilac'
          price={19350}
          originalPrice={21500}
          discount='10%'
          isNew={true}
          stock={12}
          installments={{
            quantity: 3,
            amount: 6450,
            interestFree: true,
          }}
          freeShipping={true}
          onAddToCart={() => console.log('Comercial - Agregado al carrito')}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparación visual entre el nuevo diseño comercial y el diseño actual.',
      },
    },
  },
}

// Variaciones de estado
export const States: Story = {
  render: () => (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <div className='space-y-2'>
        <h3 className='font-medium text-center'>Normal</h3>
        <CommercialProductCard
          image='/images/products/petrilac/barniz-campbell-4l.jpg'
          title='Barniz Campbell 4L'
          price={19350}
          stock={12}
          onAddToCart={() => console.log('Normal')}
        />
      </div>

      <div className='space-y-2'>
        <h3 className='font-medium text-center'>Con Descuento</h3>
        <CommercialProductCard
          image='/images/products/sinteplast/esmalte-sintetico.jpg'
          title='Esmalte Sintético'
          price={8500}
          originalPrice={12000}
          discount='30%'
          isNew={true}
          stock={15}
          onAddToCart={() => console.log('Con descuento')}
        />
      </div>

      <div className='space-y-2'>
        <h3 className='font-medium text-center'>Sin Stock</h3>
        <CommercialProductCard
          image='/images/products/plavicon/impermeabilizante.jpg'
          title='Impermeabilizante'
          price={18500}
          stock={0}
          onAddToCart={() => console.log('Sin stock')}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes estados del componente: normal, con descuento y sin stock.',
      },
    },
  },
}
