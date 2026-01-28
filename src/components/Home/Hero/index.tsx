'use client'

import React, { useMemo } from 'react'
import { HeroSlide as HeroSlideType } from '@/types/hero'
// ⚡ FIX: Importar directamente sin lazy loading para evitar skeleton
import HeroSlideCarousel from '@/components/Common/HeroSlideCarousel'
import { useTenantSafe, useTenantAssets } from '@/contexts/TenantContext'

// Función para generar hero slides dinámicos por tenant (src se sobrescribe con URLs del bucket)
const generateHeroSlides = (tenantSlug: string, serviceArea: string = 'Córdoba Capital', getHeroUrl: (index: number) => string): HeroSlideType[] => [
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
        subtitle: `en ${serviceArea}`,
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
        src: getHeroUrl(1),
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
    subtitle: `en ${serviceArea}`,
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
        src: getHeroUrl(2),
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
        src: getHeroUrl(3),
        alt: 'Equipo de entrega con productos',
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
  const tenant = useTenantSafe()
  const { heroImage } = useTenantAssets()
  const tenantSlug = tenant?.slug || 'pinteya'
  const serviceArea = tenant?.contactCity || 'Córdoba Capital'
  
  // Generar hero slides con URLs del bucket (Supabase) o fallback local
  const heroSlides = useMemo(() => generateHeroSlides(tenantSlug, serviceArea, heroImage), [tenantSlug, serviceArea, heroImage])
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
