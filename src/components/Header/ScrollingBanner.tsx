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
    <div className='w-full bg-gradient-to-r from-[#007638] to-[#00a84a] text-white overflow-hidden relative h-[32px] flex items-center rounded-lg mx-2 my-1'>
      {/* Contenedor de animación */}
      <div className='whitespace-nowrap animate-scroll-banner'>
        <div className='inline-flex items-center px-4'>
          {/* Repetimos el contenido 3 veces para el efecto continuo */}
          {bannerContent}
          {bannerContent}
          {bannerContent}
        </div>
      </div>

      {/* Gradientes laterales para efecto de desvanecimiento con bordes redondeados */}
      <div className='absolute top-0 left-0 w-12 h-full bg-gradient-to-r from-[#007638] to-transparent pointer-events-none z-10 rounded-l-lg'></div>
      <div className='absolute top-0 right-0 w-12 h-full bg-gradient-to-l from-[#007638] to-transparent pointer-events-none z-10 rounded-r-lg'></div>

      {/* Estilos CSS para la animación */}
      <style jsx global>{`
        @keyframes scroll-banner {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-scroll-banner {
          animation: scroll-banner 25s linear infinite;
          will-change: transform;
        }

        .animate-scroll-banner:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}

export default ScrollingBanner
