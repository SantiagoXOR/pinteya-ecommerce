'use client'

import React from 'react'
import { Truck, MapPin, Star, Shield } from '@/lib/optimized-imports'

const ScrollingBanner = () => {
  const envioText = 'ENVÍO GRATIS EN 24HS EN CÓRDOBA'
  const tiendaText = 'TIENDA DE PINTURAS ONLINE N°1 EN CÓRDOBA'

  // Contenido del banner optimizado con colores específicos
  const bannerContent = (
    <>
      {/* Primer conjunto - Envío en verde */}
      <div className='inline-flex items-center gap-1.5 bg-green-600 px-2 py-0 rounded-full h-[16px]'>
        <Truck className='w-3 h-3 text-white' />
        <span className='text-[10px] font-semibold tracking-widest text-white'>{envioText}</span>
      </div>

      {/* Separador */}
      <div className='w-px h-3 bg-white/40 mx-4'></div>

      {/* Segundo conjunto - Tienda en amarillo claro con texto negro */}
      <div className='inline-flex items-center gap-1.5 bg-bright-sun-300 px-2 py-0 rounded-full h-[16px]'>
        <Star className='w-3 h-3 text-black' />
        <span className='text-[10px] font-semibold tracking-widest text-black'>{tiendaText}</span>
      </div>

      {/* Separador */}
      <div className='w-px h-3 bg-white/40 mx-4'></div>
    </>
  )

  return (
    <div className='w-full lg:w-auto bg-blaze-orange-600 text-white overflow-hidden relative h-[22px] flex items-center rounded-lg mx-2 lg:mx-0 my-0.5'>
      {/* Contenedor de animación mejorado para loop infinito */}
      <div className='whitespace-nowrap animate-scroll-banner-infinite'>
        <div className='inline-flex items-center px-3'>
          {/* Repetimos el contenido 4 veces para mejor efecto continuo */}
          {bannerContent}
          {bannerContent}
          {bannerContent}
          {bannerContent}
        </div>
      </div>

      {/* Gradientes laterales en naranja del header */}
      <div className='absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-blaze-orange-600 to-transparent pointer-events-none z-10 rounded-l-lg'></div>
      <div className='absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-blaze-orange-600 to-transparent pointer-events-none z-10 rounded-r-lg'></div>

      {/* Estilos CSS mejorados para animación infinita suave */}
      <style jsx global>{`
        @keyframes scroll-banner-infinite {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-scroll-banner-infinite {
          animation: scroll-banner-infinite 30s linear infinite !important;
          will-change: transform;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .animate-scroll-banner-infinite:hover {
          animation-play-state: paused;
        }

        /* Asegurar transiciones suaves */
        .animate-scroll-banner-infinite {
          transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* ⚡ FIX: Excluir ScrollingBanner de la optimización de animaciones en mobile */
        /* El CSS global reduce animaciones a 0.1s en mobile, pero necesitamos mantener 30s para legibilidad */
        @media (max-width: 768px) {
          .animate-scroll-banner-infinite {
            animation: scroll-banner-infinite 30s linear infinite !important;
            animation-duration: 30s !important;
          }
        }
      `}</style>
    </div>
  )
}

export default ScrollingBanner
