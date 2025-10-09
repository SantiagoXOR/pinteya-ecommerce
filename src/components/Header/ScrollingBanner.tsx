'use client'

import React from 'react'
import { Truck, MapPin, Star, Shield } from 'lucide-react'

const ScrollingBanner = () => {
  const envioText = 'ENVÍO GRATIS EN 24HS EN CÓRDOBA CAPITAL'
  const tiendaText = 'TIENDA DE PINTURAS ONLINE N°1 EN CÓRDOBA CAPITAL'

  // Contenido del banner optimizado con colores específicos
  const bannerContent = (
    <>
      {/* Primer conjunto - Envío en verde */}
      <div className='inline-flex items-center gap-2 bg-green-600 px-3 py-1 rounded-full'>
        <Truck className='w-4 h-4 text-white' />
        <span className='text-xs font-semibold tracking-widest text-white'>{envioText}</span>
      </div>

      {/* Separador */}
      <div className='w-px h-4 bg-white/40 mx-6'></div>

      {/* Segundo conjunto - Tienda en naranja */}
      <div className='inline-flex items-center gap-2 bg-orange-500 px-3 py-1 rounded-full'>
        <Star className='w-4 h-4 text-white' />
        <span className='text-xs font-semibold tracking-widest text-white'>{tiendaText}</span>
      </div>

      {/* Separador */}
      <div className='w-px h-4 bg-white/40 mx-6'></div>
    </>
  )

  return (
    <div className='w-full bg-gradient-to-r from-blaze-orange-400 to-blaze-orange-500 text-white overflow-hidden relative h-[32px] flex items-center rounded-lg mx-2 my-1'>
      {/* Contenedor de animación mejorado para loop infinito */}
      <div className='whitespace-nowrap animate-scroll-banner-infinite'>
        <div className='inline-flex items-center px-4'>
          {/* Repetimos el contenido 4 veces para mejor efecto continuo */}
          {bannerContent}
          {bannerContent}
          {bannerContent}
          {bannerContent}
        </div>
      </div>

      {/* Gradientes laterales actualizados con el nuevo color naranja */}
      <div className='absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-blaze-orange-400 to-transparent pointer-events-none z-10 rounded-l-lg'></div>
      <div className='absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-blaze-orange-500 to-transparent pointer-events-none z-10 rounded-r-lg'></div>

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
          animation: scroll-banner-infinite 30s linear infinite;
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
      `}</style>
    </div>
  )
}

export default ScrollingBanner
