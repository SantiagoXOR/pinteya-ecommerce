import type { Meta, StoryObj } from '@storybook/react'
import { ShoppingCart, Heart, Search, Star, Truck, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { Badge, DiscountBadge, ShippingBadge, StockBadge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

const meta = {
  title: 'Design System/Overview',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
# Design System Pinteya E-commerce

Sistema de diseño completo mobile-first especializado en productos de pinturería en Argentina.

## 🎯 Características Principales

- **Mobile-First**: Optimizado para dispositivos móviles
- **Paleta Tahiti Gold**: Color principal #fc9d04
- **E-commerce Especializado**: Componentes para pinturería
- **Accesibilidad WCAG 2.1 AA**: Contraste y navegación optimizados
- **Inspiración UX/UI**: Mercado Libre + Airbnb

## 🧩 Componentes Incluidos

- **Button**: 8 variantes, 7 tamaños, estados interactivos
- **Card**: 4 variantes, CommercialProductCard especializada
- **Badge**: 12 variantes, badges e-commerce específicos
- **Input**: 3 variantes, validaciones, íconos

## 🎨 Tokens de Diseño

- **Colores**: Tahiti Gold + semánticos
- **Tipografía**: Inter + Euclid Circular A
- **Espaciado**: Escala base 4px
- **Animaciones**: 200ms suaves

## 📱 Responsive

- **xs**: 320px (móviles pequeños)
- **sm**: 640px (móviles grandes)
- **md**: 768px (tablets)
- **lg**: 1024px (desktop)
- **xl**: 1280px+ (desktop grande)
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

// Vista general del Design System
export const Overview: Story = {
  render: () => (
    <div className='p-8 space-y-12 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='text-center space-y-4'>
        <h1 className='text-4xl font-bold text-gray-900'>
          Design System <span className='text-primary'>Pinteya</span>
        </h1>
        <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
          Sistema de diseño mobile-first para e-commerce de pinturería en Argentina
        </p>
      </div>

      {/* Paleta de colores */}
      <section className='space-y-6'>
        <h2 className='text-2xl font-semibold text-gray-900'>🎨 Paleta de Colores</h2>
        <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'>
          <div className='space-y-2'>
            <div className='w-full h-20 bg-primary rounded-lg shadow-sm'></div>
            <div className='text-center'>
              <p className='font-medium'>Primary</p>
              <p className='text-sm text-gray-600'>#fc9d04</p>
            </div>
          </div>
          <div className='space-y-2'>
            <div className='w-full h-20 bg-secondary rounded-lg shadow-sm'></div>
            <div className='text-center'>
              <p className='font-medium'>Secondary</p>
              <p className='text-sm text-gray-600'>#2c5f5d</p>
            </div>
          </div>
          <div className='space-y-2'>
            <div className='w-full h-20 bg-success rounded-lg shadow-sm'></div>
            <div className='text-center'>
              <p className='font-medium'>Success</p>
              <p className='text-sm text-gray-600'>#22ad5c</p>
            </div>
          </div>
          <div className='space-y-2'>
            <div className='w-full h-20 bg-error rounded-lg shadow-sm'></div>
            <div className='text-center'>
              <p className='font-medium'>Error</p>
              <p className='text-sm text-gray-600'>#f23030</p>
            </div>
          </div>
          <div className='space-y-2'>
            <div className='w-full h-20 bg-warning rounded-lg shadow-sm'></div>
            <div className='text-center'>
              <p className='font-medium'>Warning</p>
              <p className='text-sm text-gray-600'>#fbbf24</p>
            </div>
          </div>
          <div className='space-y-2'>
            <div className='w-full h-20 bg-info rounded-lg shadow-sm'></div>
            <div className='text-center'>
              <p className='font-medium'>Info</p>
              <p className='text-sm text-gray-600'>#3b82f6</p>
            </div>
          </div>
        </div>
      </section>

      {/* Botones */}
      <section className='space-y-6'>
        <h2 className='text-2xl font-semibold text-gray-900'>🔘 Botones</h2>
        <div className='space-y-4'>
          <div className='flex flex-wrap gap-4'>
            <Button variant='primary'>Primary</Button>
            <Button variant='secondary'>Secondary</Button>
            <Button variant='outline'>Outline</Button>
            <Button variant='ghost'>Ghost</Button>
            <Button variant='destructive'>Destructive</Button>
            <Button variant='success'>Success</Button>
          </div>
          <div className='flex flex-wrap gap-4 items-center'>
            <Button variant='primary' size='sm'>
              Pequeño
            </Button>
            <Button variant='primary' size='md'>
              Mediano
            </Button>
            <Button variant='primary' size='lg'>
              Grande
            </Button>
            <Button variant='primary' size='xl'>
              Extra Grande
            </Button>
          </div>
          <div className='flex flex-wrap gap-4'>
            <Button variant='primary' leftIcon={<ShoppingCart className='w-4 h-4' />}>
              Agregar al carrito
            </Button>
            <Button variant='outline' size='icon'>
              <Heart className='w-4 h-4' />
            </Button>
            <Button variant='primary' loading>
              Procesando...
            </Button>
          </div>
        </div>
      </section>

      {/* Badges */}
      <section className='space-y-6'>
        <h2 className='text-2xl font-semibold text-gray-900'>🏷️ Badges</h2>
        <div className='space-y-4'>
          <div className='flex flex-wrap gap-2'>
            <Badge variant='default'>Default</Badge>
            <Badge variant='secondary'>Secondary</Badge>
            <Badge variant='destructive'>Destructive</Badge>
            <Badge variant='success'>Success</Badge>
            <Badge variant='warning'>Warning</Badge>
            <Badge variant='info'>Info</Badge>
          </div>
          <div className='flex flex-wrap gap-2'>
            <DiscountBadge percentage={30} />
            <ShippingBadge free />
            <StockBadge stock={5} />
            <Badge variant='info' icon={<Star className='w-3 h-3' />}>
              Destacado
            </Badge>
          </div>
        </div>
      </section>

      {/* Inputs */}
      <section className='space-y-6'>
        <h2 className='text-2xl font-semibold text-gray-900'>📝 Inputs</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl'>
          <Input
            label='Búsqueda'
            placeholder='Buscar productos...'
            leftIcon={<Search className='w-4 h-4' />}
          />
          <Input label='Email' type='email' placeholder='tu@email.com' required />
          <Input
            label='Con error'
            placeholder='Campo inválido'
            error='Este campo es requerido'
            value='texto inválido'
          />
          <Input
            label='Con éxito'
            variant='success'
            placeholder='Campo válido'
            helperText='¡Perfecto!'
            value='texto válido'
          />
        </div>
      </section>

      {/* Cards y CommercialProductCard */}
      <section className='space-y-6'>
        <h2 className='text-2xl font-semibold text-gray-900'>🃏 Cards</h2>
        <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
          {/* Card básica */}
          <Card>
            <CardHeader>
              <CardTitle>Card Básica</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Contenido de la tarjeta con información relevante.</p>
            </CardContent>
          </Card>

          {/* CommercialProductCard */}
          <CommercialProductCard
            image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/pintura-sherwin-williams.jpg'
            title='Pintura Sherwin Williams'
            brand='Sherwin Williams'
            price={15500}
            originalPrice={18500}
            discount='19%'
            cta='Agregar al carrito'
            onAddToCart={() => alert('Agregado al carrito')}
            freeShipping={true}
          />

          {/* Card con hover */}
          <Card hover='lift'>
            <CardHeader>
              <CardTitle>Card con Hover</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Esta tarjeta se eleva al hacer hover.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Ejemplo de e-commerce */}
      <section className='space-y-6'>
        <h2 className='text-2xl font-semibold text-gray-900'>🛍️ Ejemplo E-commerce</h2>
        <div className='bg-white rounded-lg p-6 shadow-sm'>
          <div className='space-y-6'>
            {/* Header de búsqueda */}
            <div className='flex gap-4'>
              <Input
                placeholder='Buscar pinturas, pinceles, rodillos...'
                leftIcon={<Search className='w-4 h-4' />}
                className='flex-1'
              />
              <Button variant='primary'>Buscar</Button>
            </div>

            {/* Grid de productos */}
            <div className='grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6'>
              <CommercialProductCard
                image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/pintura-sherwin-williams.jpg'
                title='Pintura Sherwin Williams ProClassic'
                brand='Sherwin Williams'
                price={15500}
                originalPrice={18500}
                discount='19%'
                cta='Agregar al carrito'
                onAddToCart={() => {}}
                freeShipping={true}
              />

              <CommercialProductCard
                title='Rodillo Profesional 23cm'
                brand='Profesional'
                price={3200}
                cta='Comprar ahora'
                onAddToCart={() => {}}
                isNew={true}
              />

              <CommercialProductCard
                title='Pincel Angular Premium'
                brand='Premium'
                price={1800}
                cta='Agregar al carrito'
                stock={3}
                onAddToCart={() => {}}
                shippingText='Stock limitado'
              />

              <CommercialProductCard
                title='Kit Pintura Completo'
                brand='Kit'
                price={12500}
                originalPrice={16700}
                discount='25%'
                cta='¡Aprovechá!'
                onAddToCart={() => {}}
                shippingText='Liquidación'
              />
            </div>

            {/* Acciones */}
            <div className='flex justify-center gap-4'>
              <Button variant='outline'>Ver más productos</Button>
              <Button variant='primary' leftIcon={<ShoppingCart className='w-4 h-4' />}>
                Ver carrito (3)
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='text-center space-y-2 pt-8 border-t'>
        <p className='text-gray-600'>Design System Pinteya E-commerce - Junio 2025</p>
        <p className='text-sm text-gray-500'>
          Mobile-first • Accesible • Especializado en pinturería
        </p>
      </footer>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Vista general completa del Design System Pinteya con todos los componentes y ejemplos de uso.',
      },
    },
  },
}

// Tokens de diseño
export const DesignTokens: Story = {
  render: () => (
    <div className='p-8 space-y-8'>
      <h1 className='text-3xl font-bold text-gray-900'>Design Tokens</h1>

      {/* Tipografía */}
      <section className='space-y-4'>
        <h2 className='text-2xl font-semibold'>Tipografía</h2>
        <div className='space-y-2'>
          <div className='text-6xl font-bold'>Heading 1</div>
          <div className='text-5xl font-bold'>Heading 2</div>
          <div className='text-4xl font-bold'>Heading 3</div>
          <div className='text-3xl font-bold'>Heading 4</div>
          <div className='text-2xl font-bold'>Heading 5</div>
          <div className='text-xl font-bold'>Heading 6</div>
          <div className='text-lg'>Body Large</div>
          <div className='text-base'>Body Normal</div>
          <div className='text-sm'>Body Small</div>
          <div className='text-xs'>Caption</div>
        </div>
      </section>

      {/* Espaciado */}
      <section className='space-y-4'>
        <h2 className='text-2xl font-semibold'>Espaciado</h2>
        <div className='space-y-2'>
          {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map(space => (
            <div key={space} className='flex items-center gap-4'>
              <div className='w-16 text-sm'>{space * 4}px</div>
              <div className='bg-primary h-4' style={{ width: `${space * 4}px` }}></div>
              <div className='text-sm text-gray-600'>space-{space}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sombras */}
      <section className='space-y-4'>
        <h2 className='text-2xl font-semibold'>Sombras</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='p-6 bg-white shadow-1 rounded-lg'>
            <p className='font-medium'>Shadow 1</p>
            <p className='text-sm text-gray-600'>Sombra sutil</p>
          </div>
          <div className='p-6 bg-white shadow-2 rounded-lg'>
            <p className='font-medium'>Shadow 2</p>
            <p className='text-sm text-gray-600'>Sombra media</p>
          </div>
          <div className='p-6 bg-white shadow-3 rounded-lg'>
            <p className='font-medium'>Shadow 3</p>
            <p className='text-sm text-gray-600'>Sombra fuerte</p>
          </div>
        </div>
      </section>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tokens de diseño fundamentales: tipografía, espaciado y sombras.',
      },
    },
  },
}
