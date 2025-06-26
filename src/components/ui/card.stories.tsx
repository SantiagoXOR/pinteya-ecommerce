import type { Meta, StoryObj } from '@storybook/react'
import { Star, Heart, Eye, ShoppingCart } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, ProductCard } from './card'
import { Button } from './button'
import { Badge } from './badge'

const meta = {
  title: 'Design System/Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Card Component

Componente de tarjeta versátil con variantes especializadas para e-commerce de pinturería.

## Características

- **4 variantes**: Default, Elevated, Outlined, Ghost
- **4 niveles de padding**: None, sm, md, lg
- **3 efectos hover**: None, Lift, Glow, Scale
- **ProductCard especializada**: Para productos de pinturería
- **Accesibilidad**: Navegación por teclado y screen readers

## Componentes incluidos

- \`Card\`: Contenedor base
- \`CardHeader\`: Encabezado con título y descripción
- \`CardContent\`: Contenido principal
- \`CardFooter\`: Pie con acciones
- \`ProductCard\`: Especializada para productos

## Uso

\`\`\`tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
  </CardHeader>
  <CardContent>
    Contenido de la tarjeta
  </CardContent>
</Card>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'ghost'],
      description: 'Variante visual de la tarjeta',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Nivel de padding interno',
    },
    hover: {
      control: 'select',
      options: ['none', 'lift', 'glow', 'scale'],
      description: 'Efecto hover',
    },
  },
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

// Card básica
export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle>Pintura Sherwin Williams</CardTitle>
        <CardDescription>Pintura látex interior premium</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Pintura de alta calidad para interiores con excelente cobertura y durabilidad.</p>
      </CardContent>
      <CardFooter>
        <Button variant="primary">Ver detalles</Button>
      </CardFooter>
    </Card>
  ),
  args: {
    variant: 'default',
    padding: 'md',
    hover: 'none',
  },
}

// Variantes
export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
      <Card variant="default">
        <CardHeader>
          <CardTitle>Default</CardTitle>
          <CardDescription>Tarjeta estándar con borde y sombra sutil</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Ideal para contenido general y listados de productos.</p>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Elevated</CardTitle>
          <CardDescription>Tarjeta con sombra elevada</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Para destacar contenido importante o productos destacados.</p>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardHeader>
          <CardTitle>Outlined</CardTitle>
          <CardDescription>Tarjeta solo con borde</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Estilo minimalista para interfaces limpias.</p>
        </CardContent>
      </Card>

      <Card variant="ghost">
        <CardHeader>
          <CardTitle>Ghost</CardTitle>
          <CardDescription>Tarjeta sin borde ni sombra</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Para contenido que no necesita separación visual fuerte.</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes variantes visuales de la tarjeta.',
      },
    },
  },
}

// Efectos hover
export const HoverEffects: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
      <Card hover="lift">
        <CardHeader>
          <CardTitle>Lift Effect</CardTitle>
          <CardDescription>Se eleva al hacer hover</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Efecto de elevación suave para interacciones.</p>
        </CardContent>
      </Card>

      <Card hover="glow">
        <CardHeader>
          <CardTitle>Glow Effect</CardTitle>
          <CardDescription>Brillo en el borde al hacer hover</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Resalta el borde con el color primario.</p>
        </CardContent>
      </Card>

      <Card hover="scale">
        <CardHeader>
          <CardTitle>Scale Effect</CardTitle>
          <CardDescription>Escala ligeramente al hacer hover</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Crecimiento sutil para feedback visual.</p>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes efectos hover disponibles para las tarjetas.',
      },
    },
  },
}

// ProductCard básica
export const ProductCardBasic: Story = {
  render: () => (
    <div className="w-80">
      <ProductCard
        image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/pintura-sherwin-williams.jpg"
        title="Pintura Sherwin Williams ProClassic"
        price={15500}
        originalPrice={18500}
        rating={4}
        reviews={23}
        badge="OFERTA"
        stock={15}
        freeShipping={true}
        isNew={false}
        onAddToCart={() => alert('Agregado al carrito')}
        onQuickView={() => alert('Vista rápida')}
        onWishlist={() => alert('Agregado a favoritos')}
        showCartAnimation={true}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ProductCard especializada para productos de pinturería con todas las características mejoradas.',
      },
    },
  },
}

// ProductCard sin imagen
export const ProductCardNoImage: Story = {
  render: () => (
    <div className="w-80">
      <ProductCard
        title="Pincel Profesional N°4"
        price={2500}
        rating={5}
        reviews={45}
        badge="NUEVO"
        onAddToCart={() => alert('Agregado al carrito')}
      >
        <div className="mt-2">
          <Badge variant="success" size="sm">Envío gratis</Badge>
        </div>
      </ProductCard>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'ProductCard sin imagen, útil para productos con contenido personalizado.',
      },
    },
  },
}

// Grid de productos mejorado
export const ProductGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
      <ProductCard
        image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/pintura-sherwin-williams.jpg"
        title="Pintura Sherwin Williams"
        price={15500}
        originalPrice={18500}
        rating={4}
        reviews={23}
        badge="30% OFF"
        stock={8}
        freeShipping={true}
        isNew={false}
        onAddToCart={() => {}}
      />

      <ProductCard
        image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/rodillo-profesional.jpg"
        title="Rodillo Profesional 23cm"
        price={3200}
        rating={5}
        reviews={67}
        stock={3}
        fastShipping={true}
        isNew={true}
        onAddToCart={() => {}}
      />

      <ProductCard
        image="https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/pincel-angular.jpg"
        title="Pincel Angular Premium"
        price={1800}
        rating={4}
        reviews={12}
        stock={0}
        onAddToCart={() => {}}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Grid de productos mostrando diferentes estados: envío gratis, stock bajo, sin stock, productos nuevos.',
      },
    },
  },
}

// Card compleja con múltiples elementos
export const ComplexCard: Story = {
  render: () => (
    <div className="w-96">
      <Card variant="elevated" hover="lift">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Kit Pintura Completo</CardTitle>
              <CardDescription>Todo lo necesario para pintar una habitación</CardDescription>
            </div>
            <Badge variant="destructive">-25%</Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
              <span className="text-gray-500">Imagen del kit</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < 4 ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                ))}
                <span className="text-sm text-gray-600 ml-1">(89 reseñas)</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">$12.500</span>
                <span className="text-lg text-gray-500 line-through">$16.700</span>
              </div>
              
              <div className="flex gap-2">
                <Badge variant="success" size="sm">Envío gratis</Badge>
                <Badge variant="info" size="sm">Stock disponible</Badge>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-2">
          <Button variant="primary" className="flex-1">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Agregar al carrito
          </Button>
          <Button variant="outline" size="icon">
            <Heart className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Eye className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Ejemplo de tarjeta compleja con múltiples elementos: badges, rating, precios, acciones.',
      },
    },
  },
}
