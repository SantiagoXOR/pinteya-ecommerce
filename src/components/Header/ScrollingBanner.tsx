'use client'

import React from 'react'
import { Truck, MapPin, Star, Shield } from '@/lib/optimized-imports'
import { useTenantSafe } from '@/contexts/TenantContext'

const ScrollingBanner = () => {
  const tenant = useTenantSafe()
  
  // Textos configurables por tenant (con fallbacks)
  const envioText = tenant?.name === 'Pintemas' 
    ? 'ENVÍO GRATIS EN 24HS EN CÓRDOBA'
    : 'ENVÍO GRATIS EN 24HS EN CÓRDOBA'
  const tiendaText = tenant?.name === 'Pintemas'
    ? 'TIENDA DE PINTURAS ONLINE N°1 EN CÓRDOBA'
    : 'TIENDA DE PINTURAS ONLINE N°1 EN CÓRDOBA'

  // Contenido del banner optimizado con colores del tenant
  const bannerContent = (
    <>
      {/* Primer conjunto - Envío en verde */}
      <div className='inline-flex items-center gap-1.5 bg-green-600 px-2 py-0 rounded-full h-[16px]'>
        <Truck className='w-3 h-3 text-white' />
        <span className='text-[10px] font-semibold tracking-widest text-white'>{envioText}</span>
      </div>

      {/* Separador */}
      <div className='w-px h-3 bg-white/40 mx-4'></div>

      {/* Segundo conjunto - Tienda en amarillo del tenant con texto negro */}
      <div 
        className='inline-flex items-center gap-1.5 px-2 py-0 rounded-full h-[16px]'
        style={{ backgroundColor: 'var(--tenant-accent, #facc15)' }}
      >
        <Star className='w-3 h-3 text-black' />
        <span className='text-[10px] font-semibold tracking-widest text-black'>{tiendaText}</span>
      </div>

      {/* Separador */}
      <div className='w-px h-3 bg-white/40 mx-4'></div>
    </>
  )

  return (
    <div 
      className='w-full lg:w-auto text-white overflow-hidden relative h-[22px] flex items-center rounded-lg mx-2 lg:mx-0 my-0.5'
      style={{ backgroundColor: 'var(--tenant-header-bg, #EA5A17)' }}
    >
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

      {/* Gradientes laterales usando color del tenant */}
      <div 
        className='absolute top-0 left-0 w-12 h-full bg-gradient-to-r to-transparent pointer-events-none z-10 rounded-l-lg'
        style={{ background: `linear-gradient(to right, var(--tenant-header-bg, #EA5A17), transparent)` }}
      ></div>
      <div 
        className='absolute top-0 right-0 w-12 h-full bg-gradient-to-l to-transparent pointer-events-none z-10 rounded-r-lg'
        style={{ background: `linear-gradient(to left, var(--tenant-header-bg, #EA5A17), transparent)` }}
      ></div>

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
