'use client'

import React from 'react'
import Hero from '@/components/Home/Hero'

interface HeroSectionProps {
  isDesktop?: boolean
}

/**
 * HeroSection - Client Component con carrusel hero
 * Renderiza el carrusel hero con autoplay funcional
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
            <Hero />
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
        <Hero />
      </div>
    </div>
  )
}
