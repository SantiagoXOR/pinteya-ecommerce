import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import {
  Toast,
  Spinner,
  PulseEffect,
  RippleEffect,
  SuccessAnimation,
  CartAddedAnimation,
  FavoriteAnimation,
  RatingAnimation,
} from './feedback'
import { Button } from './button'
import { Card, CardContent } from './card'
import { ShoppingCart, Heart } from 'lucide-react'

const meta = {
  title: 'UI/Feedback',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
# Feedback Components

Sistema completo de componentes de feedback y microinteracciones para mejorar la experiencia de usuario.

## Componentes

- **Toast**: Notificaciones temporales con múltiples variantes
- **Spinner**: Indicadores de carga con diferentes tamaños
- **PulseEffect**: Efecto de pulso para llamar la atención
- **RippleEffect**: Efecto de ondas al hacer click
- **SuccessAnimation**: Animación de éxito
- **CartAddedAnimation**: Animación específica para agregar al carrito
- **FavoriteAnimation**: Botón de favoritos animado
- **RatingAnimation**: Sistema de calificación interactivo

## Características

- **Animaciones fluidas**: Transiciones suaves y naturales
- **Múltiples variantes**: Diferentes estilos para cada contexto
- **Accesible**: Compatible con screen readers
- **Personalizable**: Fácil de customizar colores y tamaños
        `,
      },
    },
  },
} satisfies Meta

export default meta

export const ToastExamples: StoryObj = {
  render: () => {
    type ToastVariant = 'default' | 'destructive' | 'success' | 'warning' | 'info'
    const [toasts, setToasts] = useState<
      Array<{ id: number; variant: ToastVariant; title: string; description: string }>
    >([])

    const addToast = (variant: ToastVariant, title: string, description: string) => {
      const id = Date.now()
      setToasts(prev => [...prev, { id, variant, title, description }])
    }

    const removeToast = (id: number) => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }

    return (
      <div className='space-y-4'>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            onClick={() => addToast('success', '¡Éxito!', 'Producto agregado al carrito')}
          >
            Success Toast
          </Button>
          <Button
            variant='outline'
            onClick={() => addToast('error', 'Error', 'No se pudo procesar la solicitud')}
          >
            Error Toast
          </Button>
          <Button
            variant='outline'
            onClick={() => addToast('warning', 'Advertencia', 'Stock limitado disponible')}
          >
            Warning Toast
          </Button>
          <Button
            variant='outline'
            onClick={() =>
              addToast('info', 'Información', 'Envío gratis en compras mayores a $25.000')
            }
          >
            Info Toast
          </Button>
          <Button
            variant='outline'
            onClick={() => addToast('cart', 'Carrito', 'Pintura Látex agregada')}
          >
            Cart Toast
          </Button>
        </div>

        {toasts.map(toast => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            onClose={() => removeToast(toast.id)}
            duration={3000}
          />
        ))}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Diferentes variantes de Toast para notificaciones.',
      },
    },
  },
}

export const SpinnerExamples: StoryObj = {
  render: () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Tamaños</h3>
        <div className='flex items-center gap-4'>
          <Spinner size='sm' text='Pequeño' />
          <Spinner size='md' text='Mediano' />
          <Spinner size='lg' text='Grande' />
          <Spinner size='xl' text='Extra Grande' />
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-3'>Variantes</h3>
        <div className='flex items-center gap-4'>
          <Spinner variant='primary' text='Primary' />
          <Spinner variant='secondary' text='Secondary' />
          <div className='bg-gray-900 p-2 rounded'>
            <Spinner variant='white' text='White' />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes tamaños y variantes de Spinner.',
      },
    },
  },
}

export const AnimationEffects: StoryObj = {
  render: () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Pulse Effect</h3>
        <div className='flex gap-4'>
          <PulseEffect variant='primary' intensity='low'>
            <div className='w-20 h-20 bg-primary rounded-lg flex items-center justify-center text-white font-bold'>
              Low
            </div>
          </PulseEffect>
          <PulseEffect variant='primary' intensity='medium'>
            <div className='w-20 h-20 bg-primary rounded-lg flex items-center justify-center text-white font-bold'>
              Medium
            </div>
          </PulseEffect>
          <PulseEffect variant='primary' intensity='high'>
            <div className='w-20 h-20 bg-primary rounded-lg flex items-center justify-center text-white font-bold'>
              High
            </div>
          </PulseEffect>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-3'>Ripple Effect</h3>
        <RippleEffect>
          <Button className='w-32'>Click me!</Button>
        </RippleEffect>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-3'>Success Animation</h3>
        <div className='flex gap-4'>
          <SuccessAnimation size='sm' />
          <SuccessAnimation size='md' />
          <SuccessAnimation size='lg' />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Diferentes efectos de animación disponibles.',
      },
    },
  },
}

export const EcommerceAnimations: StoryObj = {
  render: () => {
    const [showCartAnimation, setShowCartAnimation] = useState(false)
    const [isFavorite, setIsFavorite] = useState(false)
    const [rating, setRating] = useState(0)

    return (
      <div className='space-y-6'>
        <div>
          <h3 className='text-lg font-semibold mb-3'>Cart Added Animation</h3>
          <div className='space-y-4'>
            <Button onClick={() => setShowCartAnimation(true)} disabled={showCartAnimation}>
              Agregar al Carrito
            </Button>
            {showCartAnimation && (
              <CartAddedAnimation
                productName='Pintura Látex Premium'
                onComplete={() => setShowCartAnimation(false)}
              />
            )}
          </div>
        </div>

        <div>
          <h3 className='text-lg font-semibold mb-3'>Favorite Animation</h3>
          <div className='flex items-center gap-4'>
            <FavoriteAnimation isFavorite={isFavorite} onToggle={setIsFavorite} />
            <span className='text-sm text-gray-600'>
              {isFavorite ? 'Agregado a favoritos' : 'Agregar a favoritos'}
            </span>
          </div>
        </div>

        <div>
          <h3 className='text-lg font-semibold mb-3'>Rating Animation</h3>
          <div className='space-y-4'>
            <div>
              <p className='text-sm text-gray-600 mb-2'>Interactivo:</p>
              <RatingAnimation rating={rating} onRate={setRating} size='lg' />
              <p className='text-sm text-gray-500 mt-1'>Rating: {rating}/5</p>
            </div>

            <div>
              <p className='text-sm text-gray-600 mb-2'>Solo lectura:</p>
              <RatingAnimation rating={4} readonly size='md' />
            </div>
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Animaciones específicas para e-commerce.',
      },
    },
  },
}

export const ProductCardWithFeedback: StoryObj = {
  render: () => {
    const [isFavorite, setIsFavorite] = useState(false)
    const [rating, setRating] = useState(4)
    const [showCartAnimation, setShowCartAnimation] = useState(false)

    return (
      <Card className='w-80'>
        <CardContent className='p-6'>
          <div className='space-y-4'>
            {/* Product Image Placeholder */}
            <div className='w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center'>
              <span className='text-gray-500'>Imagen del Producto</span>
            </div>

            {/* Product Info */}
            <div>
              <div className='flex justify-between items-start mb-2'>
                <h3 className='font-semibold text-lg'>Pintura Látex Premium</h3>
                <FavoriteAnimation isFavorite={isFavorite} onToggle={setIsFavorite} />
              </div>

              <div className='flex items-center gap-2 mb-2'>
                <RatingAnimation rating={rating} readonly size='sm' />
                <span className='text-sm text-gray-600'>(24 reseñas)</span>
              </div>

              <p className='text-2xl font-bold text-primary'>$15.500</p>
            </div>

            {/* Cart Animation */}
            {showCartAnimation && (
              <CartAddedAnimation
                productName='Pintura Látex Premium'
                onComplete={() => setShowCartAnimation(false)}
              />
            )}

            {/* Add to Cart Button */}
            <RippleEffect>
              <Button
                className='w-full'
                onClick={() => setShowCartAnimation(true)}
                disabled={showCartAnimation}
              >
                <ShoppingCart className='w-4 h-4 mr-2' />
                Agregar al Carrito
              </Button>
            </RippleEffect>
          </div>
        </CardContent>
      </Card>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Ejemplo completo de card de producto con todas las animaciones.',
      },
    },
  },
}

export const LoadingStates: StoryObj = {
  render: () => (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-3'>Loading Buttons</h3>
        <div className='flex gap-4'>
          <Button disabled>
            <Spinner size='sm' variant='white' className='mr-2' />
            Cargando...
          </Button>
          <Button variant='outline' disabled>
            <Spinner size='sm' variant='primary' className='mr-2' />
            Procesando
          </Button>
        </div>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-3'>Loading Cards</h3>
        <Card className='w-80'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-center h-32'>
              <Spinner size='lg' text='Cargando productos...' />
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className='text-lg font-semibold mb-3'>Success State</h3>
        <Card className='w-80'>
          <CardContent className='p-6'>
            <div className='flex flex-col items-center justify-center h-32 space-y-4'>
              <SuccessAnimation size='lg' />
              <p className='text-center font-medium'>¡Pedido confirmado!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Estados de carga y éxito para diferentes componentes.',
      },
    },
  },
}
