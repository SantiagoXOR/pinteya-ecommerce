'use client'

import React from 'react'
import { Truck, MapPin, Star } from '@/lib/optimized-imports'
import { useTenantSafe } from '@/contexts/TenantContext'

/**
 * Formatea el texto del banner con capitalize y diferentes pesos en palabras clave
 */
const formatBannerText = (text: string, tenantSlug?: string): React.ReactNode => {
  // Definir palabras clave por tenant (en minúsculas para comparación)
  const keywordWeights: Record<string, { keywords: string[]; weight: 'bold' | 'semibold' | 'normal' }> = {
    pinteya: {
      keywords: ['n°1', 'nº1', 'online', 'gratis', '24hs', 'córdoba'],
      weight: 'bold'
    },
    pintemas: {
      keywords: ['gratis', '24hs', 'alta gracia', 'alrededores'],
      weight: 'bold'
    }
  }

  const config = tenantSlug ? keywordWeights[tenantSlug] : keywordWeights.pinteya
  const keywords = config?.keywords || []
  const keywordWeight = config?.weight || 'bold'

  // Convertir texto a minúsculas para comparación
  const lowerText = text.toLowerCase()
  
  // Crear un array de partes (palabras y espacios)
  const parts: Array<{ text: string; isKeyword: boolean; isSpace: boolean }> = []
  let currentWord = ''
  let i = 0

  while (i < text.length) {
    const char = text[i]
    const lowerChar = char.toLowerCase()
    
    if (char === ' ' || char === '-' || char === '/') {
      // Si hay una palabra acumulada, procesarla
      if (currentWord) {
        const lowerWord = currentWord.toLowerCase()
        const isKeyword = keywords.some(keyword => {
          // Comparación exacta o que contenga la palabra clave
          return lowerWord === keyword || 
                 lowerWord.includes(keyword) || 
                 keyword.includes(lowerWord) ||
                 // Casos especiales: números y símbolos
                 (keyword.includes('°') && lowerWord.includes('°')) ||
                 (keyword.includes('24') && lowerWord.includes('24'))
        })
        parts.push({ text: currentWord, isKeyword, isSpace: false })
        currentWord = ''
      }
      // Agregar el separador
      parts.push({ text: char, isKeyword: false, isSpace: true })
    } else {
      currentWord += char
    }
    i++
  }

  // Procesar última palabra si existe
  if (currentWord) {
    const lowerWord = currentWord.toLowerCase()
    const isKeyword = keywords.some(keyword => {
      return lowerWord === keyword || 
             lowerWord.includes(keyword) || 
             keyword.includes(lowerWord) ||
             (keyword.includes('°') && lowerWord.includes('°')) ||
             (keyword.includes('24') && lowerWord.includes('24'))
    })
    parts.push({ text: currentWord, isKeyword, isSpace: false })
  }

  // Renderizar con capitalize y pesos diferentes
  return (
    <>
      {parts.map((part, index) => {
        if (part.isSpace) {
          return <React.Fragment key={index}>{part.text}</React.Fragment>
        }

        // Capitalize: primera letra mayúscula, resto minúsculas
        const capitalized = part.text.charAt(0).toUpperCase() + part.text.slice(1).toLowerCase()

        if (part.isKeyword) {
          // Usar clases estáticas de Tailwind según el peso
          const fontWeightClass = keywordWeight === 'bold' ? 'font-bold' : 
                                  keywordWeight === 'semibold' ? 'font-semibold' : 
                                  'font-normal'
          return (
            <span key={index} className={fontWeightClass}>
              {capitalized}
            </span>
          )
        }

        return (
          <span key={index} className="font-normal">
            {capitalized}
          </span>
        )
      })}
    </>
  )
}

const ScrollingBanner = () => {
  const tenant = useTenantSafe()
  
  // ⚡ FIX: Fallbacks específicos por tenant para evitar que Pinteya use valores de Pintemas
  const getDefaultLocationText = (slug?: string) => {
    if (slug === 'pintemas') return 'ESPAÑA 375 - ALTA GRACIA'
    if (slug === 'pinteya') return 'TIENDA DE PINTURAS ONLINE N°1 EN CÓRDOBA' // Valor original de Pinteya
    return 'TIENDA DE PINTURAS ONLINE N°1 EN CÓRDOBA' // Fallback genérico
  }
  
  const getDefaultShippingText = (slug?: string) => {
    if (slug === 'pintemas') return 'ENVIO GRATIS EN 24HS ALTA GRACIA Y ALREDEDORES'
    if (slug === 'pinteya') return 'ENVIO GRATIS EN 24HS EN CÓRDOBA' // Valor original de Pinteya
    return 'ENVIO GRATIS EN 24HS EN CÓRDOBA' // Fallback genérico
  }
  
  // ⚡ FIX: Colores específicos por tenant
  const getDefaultLocationBgColor = (slug?: string) => {
    if (slug === 'pintemas') return '#ffffff' // Blanco para Pintemas
    if (slug === 'pinteya') return '#ffd549' // Amarillo accent color de Pinteya
    return '#ffd549' // Fallback genérico
  }
  
  const getDefaultShippingBgColor = (slug?: string) => {
    if (slug === 'pintemas') return '#ffe200' // Amarillo para Pintemas
    if (slug === 'pinteya') return '#007638' // Verde para Pinteya (secondaryColor correcto)
    return '#007638' // Fallback genérico
  }
  
  // Textos configurables por tenant (con fallbacks específicos por tenant)
  const locationText = tenant?.scrollingBannerLocationText 
    || getDefaultLocationText(tenant?.slug)
  const shippingText = tenant?.scrollingBannerShippingText 
    || getDefaultShippingText(tenant?.slug)
  
  // Colores configurables por tenant (con fallbacks específicos por tenant)
  // ⚡ FIX: Usar accentColor del tenant si no hay scrolling_banner_location_bg_color configurado
  const locationBgColor = tenant?.scrollingBannerLocationBgColor 
    || tenant?.accentColor 
    || getDefaultLocationBgColor(tenant?.slug)
  const shippingBgColor = tenant?.scrollingBannerShippingBgColor 
    || getDefaultShippingBgColor(tenant?.slug)
  
  // ⚡ FIX: Color del texto del location banner - usar primaryDark para ambos tenants
  const getLocationTextColor = (slug?: string) => {
    if (slug === 'pinteya') return '#bd4811' // primaryDark de Pinteya
    if (slug === 'pintemas') return '#6a0f54' // primaryDark de Pintemas
    return '#bd4811' // Fallback genérico
  }
  const locationTextColor = tenant?.primaryDark 
    || getLocationTextColor(tenant?.slug)
  
  // ⚡ FIX: Color del texto del shipping banner - usar primaryDark para Pintemas también
  const getShippingTextColor = (slug?: string) => {
    if (slug === 'pinteya') {
      // Para Pinteya: blanco en fondo verde, negro en otros
      return shippingBgColor === '#007638' ? '#ffffff' : '#000000'
    }
    if (slug === 'pintemas') return '#6a0f54' // primaryDark de Pintemas para ambos banners
    return '#000000' // Fallback genérico
  }
  const shippingTextColor = tenant?.slug === 'pintemas' 
    ? (tenant?.primaryDark || '#6a0f54')
    : getShippingTextColor(tenant?.slug)

  // Contenido del banner optimizado con colores del tenant
  const bannerContent = (
    <>
      {/* Primer conjunto - Tienda (amarillo para Pinteya, blanco para Pintemas) */}
      <div 
        className='inline-flex items-center gap-1.5 px-2 py-0 rounded-full h-[16px]'
        style={{ backgroundColor: locationBgColor }}
      >
        {/* Icono de Tabler: estrella para Pinteya, MapPin para Pintemas cuando es blanco */}
        {locationBgColor !== '#ffffff' ? (
          <Star className='w-3 h-3' style={{ color: locationTextColor }} />
        ) : tenant?.slug === 'pintemas' ? (
          <MapPin className='w-3 h-3' style={{ color: locationTextColor }} />
        ) : null}
        <span 
          className='text-[10px] tracking-widest'
          style={{ color: locationTextColor }}
        >
          {formatBannerText(locationText, tenant?.slug)}
        </span>
      </div>

      {/* Separador */}
      <div className='w-px h-3 bg-white/40 mx-4'></div>

      {/* Segundo conjunto - Envío (verde para Pinteya, amarillo para Pintemas) */}
      <div 
        className='inline-flex items-center gap-1.5 px-2 py-0 rounded-full h-[16px]'
        style={{ backgroundColor: shippingBgColor }}
      >
        <Truck className='w-3 h-3' style={{ color: shippingTextColor }} />
        <span 
          className='text-[10px] tracking-widest'
          style={{ color: shippingTextColor }}
        >
          {formatBannerText(shippingText, tenant?.slug)}
        </span>
      </div>

      {/* Separador */}
      <div className='w-px h-3 bg-white/40 mx-4'></div>
    </>
  )

  // ⚡ FIX: Usar valor del tenant directamente si está disponible
  const headerBgColor = tenant?.headerBgColor || 'var(--tenant-header-bg)'
  
  return (
    <div 
      className='w-full lg:w-auto text-white overflow-hidden relative h-[22px] flex items-center rounded-lg mx-2 lg:mx-0 my-0.5'
      style={{ backgroundColor: headerBgColor }}
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
        style={{ background: `linear-gradient(to right, ${headerBgColor}, transparent)` }}
      ></div>
      <div 
        className='absolute top-0 right-0 w-12 h-full bg-gradient-to-l to-transparent pointer-events-none z-10 rounded-r-lg'
        style={{ background: `linear-gradient(to left, ${headerBgColor}, transparent)` }}
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
