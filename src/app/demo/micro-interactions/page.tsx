'use client'

import React from 'react'
import {
  AnimatedButton,
  FloatingAction,
  PulseIndicator,
  AnimatedCounter,
  InteractiveRating,
} from '@/components/ui/micro-interactions'
import {
  LoadingSpinner,
  LoadingSkeleton,
  LoadingState,
  ProductCardSkeleton,
  ProductGridSkeleton,
} from '@/components/ui/enhanced-loading'
import { CommercialProductCard } from '@/components/ui/product-card-commercial'
import { ShoppingCart, Heart, Star, Zap, Package } from 'lucide-react'

export default function MicroInteractionsDemo() {
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [rating, setRating] = React.useState(4)
  const [counter, setCounter] = React.useState(1250)

  const handleButtonClick = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    }, 2000)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-8'>
      <div className='max-w-6xl mx-auto'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>🎨 Micro-interacciones Pinteya</h1>
          <p className='text-lg text-gray-600 max-w-2xl mx-auto'>
            Demostración de las nuevas micro-interacciones y animaciones implementadas para mejorar
            la experiencia de usuario en Pinteya E-commerce.
          </p>
        </div>

        {/* Botones Animados */}
        <section className='mb-16'>
          <h2 className='text-2xl font-semibold mb-6 text-gray-800'>Botones Animados</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <div className='space-y-4'>
              <h3 className='font-medium text-gray-700'>Estados del Botón</h3>
              <AnimatedButton
                variant='primary'
                onClick={handleButtonClick}
                loading={loading}
                success={success}
              >
                <ShoppingCart className='w-4 h-4' />
                Agregar al Carrito
              </AnimatedButton>
            </div>

            <div className='space-y-4'>
              <h3 className='font-medium text-gray-700'>Variantes</h3>
              <AnimatedButton variant='secondary'>Secundario</AnimatedButton>
              <AnimatedButton variant='success'>
                <Heart className='w-4 h-4' />
                Éxito
              </AnimatedButton>
              <AnimatedButton variant='cart'>
                <Star className='w-4 h-4' />
                Carrito
              </AnimatedButton>
            </div>

            <div className='space-y-4'>
              <h3 className='font-medium text-gray-700'>Tamaños</h3>
              <AnimatedButton size='sm' variant='primary'>
                Pequeño
              </AnimatedButton>
              <AnimatedButton size='md' variant='primary'>
                Mediano
              </AnimatedButton>
              <AnimatedButton size='lg' variant='primary'>
                Grande
              </AnimatedButton>
            </div>

            <div className='space-y-4'>
              <h3 className='font-medium text-gray-700'>Estados</h3>
              <AnimatedButton disabled>Deshabilitado</AnimatedButton>
              <AnimatedButton loading>Cargando</AnimatedButton>
              <AnimatedButton success>Completado</AnimatedButton>
            </div>
          </div>
        </section>

        {/* Loading States */}
        <section className='mb-16'>
          <h2 className='text-2xl font-semibold mb-6 text-gray-800'>Estados de Carga</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            <div className='space-y-4'>
              <h3 className='font-medium text-gray-700'>Spinners</h3>
              <div className='flex items-center gap-4'>
                <LoadingSpinner size='sm' variant='primary' />
                <LoadingSpinner size='md' variant='secondary' />
                <LoadingSpinner size='lg' variant='accent' />
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='font-medium text-gray-700'>Skeletons</h3>
              <LoadingSkeleton variant='text' lines={3} />
              <LoadingSkeleton variant='button' />
            </div>

            <div className='space-y-4'>
              <h3 className='font-medium text-gray-700'>Estados Contextuales</h3>
              <LoadingState type='products' showIcon={false} />
            </div>
          </div>
        </section>

        {/* Indicadores y Contadores */}
        <section className='mb-16'>
          <h2 className='text-2xl font-semibold mb-6 text-gray-800'>Indicadores Interactivos</h2>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='space-y-4'>
              <h3 className='font-medium text-gray-700'>Indicadores de Pulso</h3>
              <div className='flex items-center gap-4'>
                <PulseIndicator color='primary' />
                <PulseIndicator color='success' size='md' />
                <PulseIndicator color='warning' size='lg' />
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='font-medium text-gray-700'>Contador Animado</h3>
              <div className='text-center'>
                <AnimatedCounter
                  value={counter}
                  className='text-3xl font-bold text-blaze-orange-600'
                />
                <p className='text-sm text-gray-600 mt-2'>Productos vendidos</p>
                <button
                  onClick={() => setCounter(counter + 100)}
                  className='mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
                >
                  +100
                </button>
              </div>
            </div>

            <div className='space-y-4'>
              <h3 className='font-medium text-gray-700'>Rating Interactivo</h3>
              <div className='text-center'>
                <InteractiveRating value={rating} onChange={setRating} size='lg' />
                <p className='text-sm text-gray-600 mt-2'>Calificación: {rating}/5 estrellas</p>
              </div>
            </div>
          </div>
        </section>

        {/* ProductCard Mejorado */}
        <section className='mb-16'>
          <h2 className='text-2xl font-semibold mb-6 text-gray-800'>
            ProductCard con Micro-interacciones
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            <CommercialProductCard
              image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sherwin-williams/pintura-sherwin-williams.jpg'
              title='Pintura Látex Premium Sherwin Williams'
              brand='Sherwin Williams'
              price={2500}
              originalPrice={3200}
              discount='25%'
              cta='Agregar al carrito'
              onAddToCart={() => console.log('Agregado con animación')}
              freeShipping={true}
              installments={{
                quantity: 3,
                amount: 833,
                interestFree: true,
              }}
            />

            <CommercialProductCard
              image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/petrilac/pintura-petrilac.jpg'
              title='Esmalte Sintético Petrilac'
              brand='Petrilac'
              price={1800}
              originalPrice={2200}
              discount='18%'
              cta='Agregar al carrito'
              onAddToCart={() => console.log('Agregado con animación')}
              stock={15}
            />

            <CommercialProductCard
              image='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/products/sinteplast/pintura-sinteplast.jpg'
              title='Pintura Acrílica Sinteplast'
              brand='Sinteplast'
              price={1200}
              cta='Agregar al carrito'
              onAddToCart={() => console.log('Agregado con animación')}
              stock={8}
            />
          </div>
        </section>

        {/* Skeleton Loading Demo */}
        <section className='mb-16'>
          <h2 className='text-2xl font-semibold mb-6 text-gray-800'>Loading Skeletons</h2>
          <div className='space-y-8'>
            <div>
              <h3 className='font-medium text-gray-700 mb-4'>Product Card Skeleton</h3>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Actions */}
      <FloatingAction
        icon={<ShoppingCart className='w-6 h-6' />}
        label='Ver Carrito'
        onClick={() => console.log('Carrito abierto')}
        variant='primary'
        position='bottom-right'
      />

      <FloatingAction
        icon={<Heart className='w-6 h-6' />}
        label='Lista de Deseos'
        onClick={() => console.log('Wishlist abierta')}
        variant='secondary'
        position='bottom-left'
      />
    </div>
  )
}
