/**
 * ⚡ PERFORMANCE: Lazy Loading de HeroCarousel
 * 
 * Reduce FCP ~1s al cargar Swiper de forma diferida
 * Bundle de Swiper (~60KB JS + CSS) se carga solo cuando es necesario
 */

'use client'

import dynamic from 'next/dynamic'
import React from 'react'

// Skeleton optimizado mientras carga el carousel
const HeroCarouselSkeleton = () => (
  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 animate-pulse relative overflow-hidden">
    {/* Efecto shimmer */}
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    
    {/* Contenido placeholder */}
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="space-y-4 text-center px-4">
        <div className="h-12 bg-white/20 rounded-lg w-64 mx-auto"></div>
        <div className="h-8 bg-white/20 rounded-lg w-48 mx-auto"></div>
        <div className="flex gap-3 justify-center mt-6">
          <div className="h-12 bg-white/20 rounded-lg w-32"></div>
          <div className="h-12 bg-white/20 rounded-lg w-32"></div>
        </div>
      </div>
    </div>

    {/* Indicadores de carga */}
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-white/40"
        ></div>
      ))}
    </div>
  </div>
)

// ⚡ Dynamic import con SSR deshabilitado
// Esto evita que Swiper se incluya en el bundle inicial
const HeroCarousel = dynamic(
  () => import('./HeroCarousel'),
  {
    ssr: false, // No renderizar en servidor
    loading: () => <HeroCarouselSkeleton />,
  }
)

export default HeroCarousel

