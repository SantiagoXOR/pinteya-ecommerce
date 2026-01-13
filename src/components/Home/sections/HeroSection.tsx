'use client'

import React from 'react'
import SimpleHeroCarousel from '@/components/Home/Hero/SimpleHeroCarousel'

interface HeroSectionProps {
  isDesktop?: boolean
}

/**
 * HeroSection - Client Component con carrusel simple
 * Renderiza carrusel con las 3 imágenes hero (hero1, hero2, hero3.webp)
 * Similar a CombosSection - solo imágenes sin contenido adicional
 */
export function HeroSection({ isDesktop = false }: HeroSectionProps) {
  if (isDesktop) {
    return (
      <div className='pt-1 sm:pt-2 -mt-[105px]'>
        <div className='max-w-[1170px] mx-auto lg:px-8 xl:px-8 pt-[105px]'>
          <div 
            className="relative overflow-hidden rounded-3xl"
            style={{ 
              aspectRatio: '2.77',
              width: '100%',
              maxWidth: '100%',
              margin: '0 auto',
              position: 'relative',
            }}
          >
            <SimpleHeroCarousel />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='pt-1 sm:pt-2 w-full' style={{ width: '100%', maxWidth: '100%' }}>
      <div 
        className="relative w-full overflow-hidden"
        style={{ 
          aspectRatio: '2.77',
          width: '100%',
          maxWidth: '100%',
          margin: '0 auto',
        }}
      >
        <SimpleHeroCarousel />
      </div>
    </div>
  )
}
