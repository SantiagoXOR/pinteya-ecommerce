import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { ShoppingCart, Trash2, Eye, Heart, AlertTriangle } from 'lucide-react'
import { Modal, ConfirmModal, AddToCartModal, useModal } from './modal'
import { Button } from './button'
import { Card, CardContent, ProductCard } from './card'

const meta = {
  title: 'UI/Modal',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Modal Components

Sistema completo de modales para e-commerce con múltiples variantes y casos de uso específicos.

## Componentes

- **Modal**: Modal básico y flexible para cualquier contenido
- **ConfirmModal**: Modal de confirmación con variantes semánticas
- **AddToCartModal**: Modal específico para confirmación de agregado al carrito
- **useModal**: Hook para manejo simplificado de estado de modales

## Características

- **Accesibilidad**: WCAG 2.1 AA compliant con Radix UI
- **Animaciones**: Transiciones suaves y naturales
- **Responsive**: Optimizado para móvil y desktop
- **Variantes semánticas**: Success, Error, Warning, Info
- **E-commerce ready**: Componentes específicos para tienda online
- **TypeScript**: Completamente tipado

## Casos de Uso

- Confirmación de acciones destructivas
- Vista rápida de productos
- Confirmación de agregado al carrito
- Formularios modales
- Galerías de imágenes
- Información adicional

## Paleta de Colores

Utiliza la paleta Tahiti Gold del Design System:
- **Primary**: #fc9d04 (Tahiti Gold)
- **Success**: #22ad5c (Verde)
- **Error**: #f23030 (Rojo)
- **Warning**: #fbbf24 (Amarillo)
- **Info**: #3b82f6 (Azul)
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>

export default meta
type Story = StoryObj<typeof meta>

// Modal básico
export const Basic: Story = {
  render: () => {
    const { open, openModal, closeModal } = useModal()

    return (
      <div className='space-y-4'>
        <Button onClick={openModal}>Abrir Modal Básico</Button>

        <Modal
          open={open}
          onOpenChange={closeModal}
          title='Modal Básico'
          description='Este es un modal básico con título y descripción'
        >
          <div className='space-y-4'>
            <p>Contenido del modal. Aquí puedes agregar cualquier componente o información.</p>
            <div className='flex justify-end gap-2'>
              <Button variant='outline' onClick={closeModal}>
                Cancelar
              </Button>
              <Button onClick={closeModal}>Aceptar</Button>
            </div>
          </div>
        </Modal>
      </div>
    )
  },
}

// Modal con trigger
export const WithTrigger: Story = {
  render: () => (
    <Modal
      trigger={<Button>Abrir con Trigger</Button>}
      title='Modal con Trigger'
      description='Este modal se abre usando la prop trigger'
      size='lg'
    >
      <div className='space-y-4'>
        <p>El trigger permite abrir el modal directamente desde un botón u otro elemento.</p>
        <p>Es útil cuando no necesitas controlar el estado manualmente.</p>
      </div>
    </Modal>
  ),
}

// Diferentes tamaños
export const Sizes: Story = {
  render: () => (
    <div className='flex flex-wrap gap-2'>
      {(['sm', 'md', 'lg', 'xl', '2xl'] as const).map(size => (
        <Modal
          key={size}
          trigger={<Button variant='outline'>Modal {size.toUpperCase()}</Button>}
          title={`Modal ${size.toUpperCase()}`}
          description={`Este es un modal de tamaño ${size}`}
          size={size}
        >
          <div className='space-y-4'>
            <p>Contenido del modal de tamaño {size}.</p>
            <p>Los modales se adaptan automáticamente al contenido y al viewport.</p>
          </div>
        </Modal>
      ))}
    </div>
  ),
}

// Modal de confirmación - Variantes
export const ConfirmVariants: Story = {
  render: () => (
    <div className='grid grid-cols-2 gap-4'>
      <ConfirmModal
        trigger={<Button variant='destructive'>Eliminar Producto</Button>}
        title='¿Eliminar producto?'
        description='Esta acción no se puede deshacer. El producto será eliminado permanentemente.'
        variant='destructive'
        confirmText='Sí, eliminar'
        cancelText='Cancelar'
        onConfirm={() => alert('Producto eliminado')}
      />

      <ConfirmModal
        trigger={<Button variant='warning'>Acción de Advertencia</Button>}
        title='¿Continuar con la acción?'
        description='Esta acción puede tener consecuencias importantes.'
        variant='warning'
        confirmText='Sí, continuar'
        onConfirm={() => alert('Acción confirmada')}
      />

      <ConfirmModal
        trigger={<Button variant='success'>Confirmar Compra</Button>}
        title='¿Confirmar compra?'
        description='Se procesará el pago y se enviará el pedido.'
        variant='success'
        confirmText='Confirmar compra'
        onConfirm={() => alert('Compra confirmada')}
      />

      <ConfirmModal
        trigger={<Button>Información</Button>}
        title='Información importante'
        description='Por favor lee esta información antes de continuar.'
        variant='info'
        confirmText='Entendido'
        onConfirm={() => alert('Información leída')}
      />
    </div>
  ),
}

// Quick View Modal para productos
// Story de QuickView reemplazada por Modal estándar
export const QuickView: Story = {
  render: () => {
    const sampleProduct = {
      id: 1,
      name: 'Pintura Látex Interior Sherwin Williams',
      price: 15999,
      originalPrice: 18999,
      image: '/api/placeholder/400/400',
      category: 'Pinturas',
      brand: 'Sherwin Williams',
      stock: 15,
      description:
        'Pintura látex de alta calidad para interiores. Excelente cobertura y durabilidad.',
      features: ['Fácil aplicación', 'Secado rápido', 'Lavable', 'Sin olor'],
    }

    return (
      <Modal
        trigger={
          <Button>
            <Eye className='mr-2 h-4 w-4' />
            Vista Rápida
          </Button>
        }
        title='Vista Rápida del Producto'
        size='2xl'
      >
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <img
              src={sampleProduct.image}
              alt={sampleProduct.name}
              className='w-full h-80 object-cover rounded-lg'
            />
          </div>

          <div className='space-y-4'>
            <div>
              <h3 className='text-xl font-semibold'>{sampleProduct.name}</h3>
              <p className='text-gray-600'>{sampleProduct.brand}</p>
            </div>

            <div className='flex items-center gap-2'>
              <span className='text-2xl font-bold text-primary'>
                ${sampleProduct.price.toLocaleString()}
              </span>
              {sampleProduct.originalPrice && (
                <span className='text-lg text-gray-500 line-through'>
                  ${sampleProduct.originalPrice.toLocaleString()}
                </span>
              )}
            </div>

            <p className='text-gray-600'>{sampleProduct.description}</p>

            <div>
              <h4 className='font-medium mb-2'>Características:</h4>
              <ul className='list-disc list-inside space-y-1 text-sm text-gray-600'>
                {sampleProduct.features.map((feature, index) => (
                  <li key={index}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className='flex gap-2'>
              <Button className='flex-1'>
                <ShoppingCart className='mr-2 h-4 w-4' />
                Agregar al Carrito
              </Button>
              <Button variant='outline' size='icon'>
                <Heart className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    )
  },
}

// Modal de agregado al carrito
export const AddToCart: Story = {
  render: () => (
    <AddToCartModal
      trigger={
        <Button>
          <ShoppingCart className='mr-2 h-4 w-4' />
          Simular Agregar al Carrito
        </Button>
      }
      productName='Pintura Látex Interior Sherwin Williams'
      productImage='/api/placeholder/80/80'
      onContinueShopping={() => alert('Continuar comprando')}
      onGoToCart={() => alert('Ir al carrito')}
    />
  ),
}

// Modal con loading state
export const WithLoading: Story = {
  render: () => {
    const [loading, setLoading] = useState(false)

    const handleConfirm = () => {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
        alert('Acción completada')
      }, 2000)
    }

    return (
      <ConfirmModal
        trigger={<Button>Acción con Loading</Button>}
        title='¿Procesar pedido?'
        description='Se procesará el pedido y se enviará la confirmación.'
        confirmText='Procesar'
        loading={loading}
        onConfirm={handleConfirm}
      />
    )
  },
}

// Ejemplo completo de e-commerce
export const EcommerceExample: Story = {
  render: () => {
    const { open: quickViewOpen, openModal: openQuickView, closeModal: closeQuickView } = useModal()
    const { open: cartOpen, openModal: openCart, closeModal: closeCart } = useModal()
    const { open: deleteOpen, openModal: openDelete, closeModal: closeDelete } = useModal()

    const product = {
      name: 'Pintura Látex Premium',
      price: 12999,
      image: '/api/placeholder/300/300',
    }

    return (
      <div className='space-y-4'>
        <Card className='w-80'>
          <CardContent className='p-4'>
            <img
              src={product.image}
              alt={product.name}
              className='w-full h-48 object-cover rounded-lg mb-4'
            />
            <h3 className='font-semibold mb-2'>{product.name}</h3>
            <p className='text-xl font-bold text-primary mb-4'>${product.price.toLocaleString()}</p>

            <div className='flex gap-2'>
              <Button size='sm' onClick={openQuickView}>
                <Eye className='mr-1 h-3 w-3' />
                Ver
              </Button>
              <Button size='sm' onClick={openCart}>
                <ShoppingCart className='mr-1 h-3 w-3' />
                Agregar
              </Button>
              <Button size='sm' variant='destructive' onClick={openDelete}>
                <Trash2 className='mr-1 h-3 w-3' />
                Eliminar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick View Modal - Reemplazado por Modal estándar */}
        <Modal
          open={quickViewOpen}
          onOpenChange={closeQuickView}
          title='Vista Rápida del Producto'
          size='lg'
        >
          <div className='text-center py-8'>
            <p>Aquí iría el contenido completo del producto...</p>
          </div>
        </Modal>

        {/* Add to Cart Modal */}
        <AddToCartModal
          open={cartOpen}
          onOpenChange={closeCart}
          productName={product.name}
          productImage={product.image}
          onContinueShopping={closeCart}
          onGoToCart={() => {
            closeCart()
            alert('Ir al carrito')
          }}
        />

        {/* Delete Confirmation */}
        <ConfirmModal
          open={deleteOpen}
          onOpenChange={closeDelete}
          title='¿Eliminar producto?'
          description='Esta acción no se puede deshacer.'
          variant='destructive'
          confirmText='Sí, eliminar'
          onConfirm={() => {
            closeDelete()
            alert('Producto eliminado')
          }}
        />
      </div>
    )
  },
}
