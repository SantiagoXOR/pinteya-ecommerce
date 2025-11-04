/**
 * ⚡ PERFORMANCE: Lazy Loading de HeroCarousel
 * 
 * Reduce FCP ~1s al cargar Swiper de forma diferida
 * Bundle de Swiper (~60KB JS + CSS) se carga solo cuando es necesario
 */

'use client'

import dynamic from 'next/dynamic'
import React from 'react'
import { HeroSkeleton } from '@/components/ui/advanced-skeleton'

// ⚡ Dynamic import con SSR deshabilitado
// Esto evita que Swiper se incluya en el bundle inicial
const HeroCarousel = dynamic(
  () => import('./HeroCarousel'),
  {
    ssr: false, // No renderizar en servidor
    loading: () => <HeroSkeleton />, // Skeleton moderno con shimmer
  }
)

export default HeroCarousel

