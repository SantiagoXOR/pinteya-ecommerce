'use client'

import React from 'react'
import { HeroSlide as HeroSlideType } from '@/types/hero'
// ⚡ PERFORMANCE: Lazy load de HeroSlideCarousel (-1s FCP)
import HeroSlideCarousel from '@/components/Common/HeroSlideCarousel.lazy'

// ⚡ HERO MODULAR Y RESPONSIVE: Diseño estilo Mercado Libre
// Contenido separado de imágenes para máxima flexibilidad responsive
const heroSlides: HeroSlideType[] = [
  {
    id: 'slide-1',
    backgroundGradient: 'from-blaze-orange-500 via-blaze-orange-400 to-blaze-orange-600',
    mainTitle: 'Pintá rápido, fácil y cotiza al instante!',
    highlightedWords: ['Pintá', 'cotiza'],
    subtitle: 'Miles de productos con envío gratis y asesoramiento experto',
    badges: [
      {
        type: 'discount',
        text: '30% OFF',
        variant: 'yellow',
      },
      {
        type: 'shipping',
        text: 'Envío Gratis',
        subtitle: 'en Córdoba Capital',
        variant: 'green',
      },
      {
        type: 'delivery',
        text: 'Llega hoy',
        variant: 'green',
      },
    ],
    productImages: [
      {
        src: '/images/hero/hero2/hero1.webp',
        alt: 'Pareja eligiendo pinturas con laptop y muestras de colores',
        priority: true,
        position: {
          top: '50%',
          left: '50%',
        },
        mobileSize: {
          width: '95%',
        },
        desktopSize: {
          width: '70%',
          height: '90%',
        },
        aspectRatio: '737/266',
        zIndex: 2,
      },
    ],
    cta: {
      text: 'Ver Todos los Productos',
      href: '/productos',
      variant: 'primary',
    },
  },
  {
    id: 'slide-2',
    backgroundGradient: 'from-blue-600 via-blue-500 to-blaze-orange-500',
    mainTitle: 'Comprá pinturas con entrega en 24 HS',
    highlightedWords: ['24 HS'],
    subtitle: 'en Córdoba Capital',
    badges: [
      {
        type: 'shipping',
        text: 'Envío Express',
        subtitle: '24 horas',
        variant: 'green',
      },
      {
        type: 'installments',
        text: '12 cuotas sin interés',
        variant: 'blue',
      },
    ],
    productImages: [
      {
        src: '/images/hero/hero2/hero2.webp',
        alt: 'Pareja en sofá con muestras de colores y app móvil',
        priority: false,
        position: {
          top: '50%',
          left: '50%',
        },
        mobileSize: {
          width: '95%',
        },
        desktopSize: {
          width: '70%',
          height: '90%',
        },
        aspectRatio: '737/266',
        zIndex: 2,
      },
    ],
    cta: {
      text: 'Ver Ofertas',
      href: '/productos',
      variant: 'primary',
    },
  },
  {
    id: 'slide-3',
    backgroundGradient: 'from-green-600 via-blaze-orange-500 to-yellow-400',
    mainTitle: 'Ahora pagás con Mercado Pago',
    highlightedWords: ['Mercado Pago'],
    subtitle: 'Rápido, fácil y seguro',
    badges: [
      {
        type: 'payment',
        text: '¡Pagás al recibir!',
        variant: 'orange',
      },
      {
        type: 'shipping',
        text: 'Envío Gratis Express',
        variant: 'green',
      },
    ],
    productImages: [
      {
        src: '/images/hero/hero2/hero3.webp',
        alt: 'Equipo de entrega con productos Pinte YA',
        priority: false,
        position: {
          top: '50%',
          left: '50%',
        },
        mobileSize: {
          width: '95%',
        },
        desktopSize: {
          width: '70%',
          height: '90%',
        },
        aspectRatio: '737/266',
        zIndex: 2,
      },
    ],
    cta: {
      text: 'Comprar Ahora',
      href: '/productos',
      variant: 'primary',
    },
  },
]

const Hero = () => {
  return (
    <section className='relative overflow-hidden w-full' style={{ minHeight: '400px' }}>
      {/* Hero Modular y Responsive - Layout único que se adapta */}
      <div className='w-full h-full' style={{ minHeight: '400px' }}>
        <HeroSlideCarousel
          slides={heroSlides}
          autoplayDelay={5000}
          showNavigation={true}
          showPagination={true}
          className='w-full h-full'
        />
      </div>
    </section>
  )
}

export default Hero
