'use client'

import React from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ShoppingCart } from 'lucide-react'

const PromoBanner = () => {
  return (
    <section className='overflow-hidden py-4 sm:py-8'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
        {/* <!-- promo banner big --> */}
        <Card className='relative z-1 overflow-hidden bg-gradient-to-r from-blaze-orange-50 to-blaze-orange-100 py-12.5 lg:py-17.5 xl:py-22.5 px-4 sm:px-7.5 lg:px-14 xl:px-19 mb-7.5 border-0 shadow-2 hover:shadow-3 transition-all duration-300'>
          <div className='max-w-[550px] w-full relative z-10'>
            <div className='flex items-center gap-3 mb-4'>
              <Badge
                variant='default'
                size='md'
                className='font-bold bg-blaze-orange-500 text-white'
              >
                PLAVICON
              </Badge>
              <Badge
                variant='destructive'
                size='md'
                animation='pulse'
                className='font-bold bg-fun-green-500'
              >
                40% OFF
              </Badge>
            </div>

            <span className='block font-medium text-xl text-gray-700 mb-3'>
              Plavicon Látex Frentes 4L
            </span>

            <h2 className='font-bold text-xl lg:text-heading-4 xl:text-heading-3 text-blaze-orange-600 mb-5'>
              HASTA 40% DE DESCUENTO
            </h2>

            <p className='text-gray-600 mb-4 leading-relaxed'>
              Pintura látex de máxima calidad para frentes y exteriores. Resistente a la intemperie
              con tecnología argentina que protege y embellece.
            </p>

            <div className='flex items-center gap-4 mb-6'>
              <div className='flex items-center gap-2'>
                <span className='text-gray-400 line-through text-lg'>$5.817</span>
                <span className='text-3xl font-bold text-blaze-orange-600'>$3.490</span>
              </div>
            </div>

            <Button
              variant='ghost'
              size='lg'
              className='w-full sm:w-auto text-blaze-orange-600 font-bold py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 text-lg flex items-center gap-2'
              style={{
                backgroundColor: '#facc15',
                borderColor: '#facc15',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = '#eab308'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#facc15'
              }}
              asChild
            >
              <a href='/shop'>
                <ShoppingCart className='w-5 h-5' />
                Agregar al Carrito
              </a>
            </Button>
          </div>

          <div className='absolute bottom-0 right-0 lg:right-10 -z-1 w-[400px] h-[500px] lg:w-[500px] lg:h-[600px]'>
            {/* Fondo circular sutil para el producto */}
            <div className='absolute inset-0 bg-blaze-orange-100/40 rounded-full blur-3xl scale-75'></div>
            <Image
              src='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-4l-plavicon.webp'
              alt='Plavicon Látex Frentes 4L - Pintura para exteriores'
              fill
              className='object-contain drop-shadow-2xl opacity-30 mix-blend-multiply'
              style={{
                filter: 'contrast(1.1) saturate(1.2) brightness(0.95)',
              }}
            />
          </div>
        </Card>

        <div className='grid gap-7.5 grid-cols-1 lg:grid-cols-2'>
          {/* <!-- promo banner small --> */}
          <Card className='relative z-1 overflow-hidden bg-gradient-to-br from-fun-green-50 to-fun-green-100 py-10 xl:py-16 px-4 sm:px-7.5 xl:px-10 border-0 shadow-1 hover:shadow-2 transition-all duration-300 group'>
            <div className='absolute top-1/2 -translate-y-1/2 left-0 sm:left-5 -z-1 group-hover:scale-105 transition-transform duration-300 w-[350px] h-[350px]'>
              {/* Fondo circular sutil para el producto */}
              <div className='absolute inset-0 bg-fun-green-100/40 rounded-full blur-3xl scale-75'></div>
              <Image
                src='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-125kg-poxipol.png'
                alt='Kit Reparación Poximix - Masilla epóxica'
                fill
                className='object-contain drop-shadow-2xl opacity-25 mix-blend-multiply'
                style={{
                  filter: 'contrast(1.1) saturate(1.2) brightness(0.95)',
                }}
              />
            </div>

            <div className='text-right relative z-10'>
              <Badge variant='secondary' size='sm' className='mb-3 bg-fun-green-500 text-white'>
                25% OFF
              </Badge>

              <span className='block text-lg text-gray-700 mb-1.5'>Kit Reparación Completo</span>

              <h2 className='font-bold text-xl lg:text-heading-4 text-gray-900 mb-2.5'>
                Poximix Interior + Exterior
              </h2>

              <div className='flex flex-col items-end mb-3'>
                <span className='text-gray-400 line-through text-sm'>$11.700</span>
                <span className='text-xl font-bold text-fun-green-600'>$8.775</span>
              </div>

              <p className='font-semibold text-sm text-gray-600 mb-4'>
                Marca Akapol - Masilla epóxica
              </p>

              <Button
                variant='ghost'
                size='md'
                className='text-blaze-orange-600 font-bold py-2 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2'
                style={{
                  backgroundColor: '#facc15',
                  borderColor: '#facc15',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#eab308'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#facc15'
                }}
                asChild
              >
                <a href='/shop'>
                  <ShoppingCart className='w-4 h-4' />
                  Agregar al Carrito
                </a>
              </Button>
            </div>
          </Card>

          {/* <!-- promo banner small --> */}
          <Card className='relative z-1 overflow-hidden bg-gradient-to-br from-yellow-50 to-yellow-100 py-10 xl:py-16 px-4 sm:px-7.5 xl:px-10 border-0 shadow-1 hover:shadow-2 transition-all duration-300 group'>
            <div className='absolute top-1/2 -translate-y-1/2 right-0 sm:right-5 -z-1 group-hover:scale-105 transition-transform duration-300 w-[300px] h-[300px]'>
              {/* Fondo circular sutil para el producto */}
              <div className='absolute inset-0 bg-bright-sun-100/40 rounded-full blur-3xl scale-75'></div>
              <Image
                src='https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-4l-sinteplast.webp'
                alt='Sinteplast Recuplast Baño y Cocina - Antihumedad'
                fill
                className='object-contain drop-shadow-2xl opacity-25 mix-blend-multiply'
                style={{
                  filter: 'contrast(1.1) saturate(1.2) brightness(0.95)',
                }}
              />
            </div>

            <div className='relative z-10'>
              <Badge
                variant='warning'
                size='sm'
                className='mb-3 font-bold bg-yellow-500 text-black'
              >
                30% OFF
              </Badge>

              <span className='block text-lg text-gray-700 mb-1.5'>Sinteplast Antihumedad</span>

              <h2 className='font-bold text-xl lg:text-heading-4 text-gray-900 mb-2.5'>
                Recuplast Baño y Cocina 4L
              </h2>

              <div className='flex flex-col mb-3'>
                <span className='text-gray-400 line-through text-sm'>$8.807</span>
                <span className='text-xl font-bold text-yellow-600'>$4.315</span>
              </div>

              <p className='max-w-[285px] text-sm text-gray-600 mb-6 leading-relaxed'>
                Protección superior contra humedad y hongos. Ideal para baños, cocinas y ambientes
                húmedos.
              </p>

              <Button
                variant='ghost'
                size='md'
                className='text-blaze-orange-600 font-bold py-2 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-2'
                style={{
                  backgroundColor: '#facc15',
                  borderColor: '#facc15',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#eab308'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#facc15'
                }}
                asChild
              >
                <a href='/shop'>
                  <ShoppingCart className='w-4 h-4' />
                  Agregar al Carrito
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}

export default PromoBanner
