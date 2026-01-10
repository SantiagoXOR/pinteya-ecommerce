/**
 * Componente optimizado para renderizar una slide del carousel
 * Memoizado para evitar re-renders innecesarios
 */

'use client'

import React, { memo } from 'react'
import Image from 'next/image'
import type { SlideProps } from './types'

const Slide: React.FC<SlideProps> = memo(({ slide, index, isTransitioning }) => {
  if (!slide) return null

  return (
    <div
      key={`${slide.id}-${index}`}
      className="min-w-full h-full flex-shrink-0 relative"
      style={{
        willChange: isTransitioning ? 'transform' : 'auto',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
      }}
    >
      <Image
        src={slide.image}
        alt={slide.alt}
        fill
        priority={false}
        loading="lazy"
        fetchPriority="auto"
        className="object-cover"
        style={{ objectPosition: 'center' }}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
        quality={75}
        decoding="async"
      />
    </div>
  )
})

Slide.displayName = 'HeroSlide'

export default Slide
