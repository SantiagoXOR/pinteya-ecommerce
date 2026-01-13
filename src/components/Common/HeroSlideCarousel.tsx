/**
 * HeroSlideCarousel Component
 * Carrusel optimizado para renderizar HeroSlide con Swiper
 */

'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, Keyboard, A11y } from 'swiper/modules'
import HeroSlide from '@/components/Home/Hero/HeroSlide'
import { HeroSlide as HeroSlideType } from '@/types/hero'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

interface HeroSlideCarouselProps {
  slides: HeroSlideType[]
  autoplayDelay?: number
  className?: string
  showNavigation?: boolean
  showPagination?: boolean
  onSlideChange?: (index: number) => void
}

const HeroSlideCarousel: React.FC<HeroSlideCarouselProps> = ({
  slides,
  autoplayDelay = 5000,
  className = '',
  showNavigation = true,
  showPagination = true,
  onSlideChange,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoplayPaused, setIsAutoplayPaused] = useState(false)
  const swiperRef = useRef<any>(null)

  // Handle slide change
  const handleSlideChange = (swiper: any) => {
    const newIndex = swiper.realIndex
    setCurrentSlide(newIndex)
    onSlideChange?.(newIndex)
  }

  // Handle mouse enter/leave for autoplay pause
  const handleMouseEnter = () => {
    setIsAutoplayPaused(true)
    if (swiperRef.current?.autoplay) {
      swiperRef.current.autoplay.stop()
    }
  }

  const handleMouseLeave = () => {
    setIsAutoplayPaused(false)
    if (swiperRef.current?.autoplay) {
      swiperRef.current.autoplay.start()
    }
  }

  // Asegurar que el autoplay se inicie correctamente después de que Swiper esté completamente inicializado
  useEffect(() => {
    // Usar un pequeño delay para asegurar que Swiper esté completamente montado
    const timer = setTimeout(() => {
      if (swiperRef.current?.autoplay && !isAutoplayPaused) {
        // Verificar que el swiper esté inicializado y tenga slides
        if (swiperRef.current.slides && swiperRef.current.slides.length > 0) {
          // Forzar inicio del autoplay
          swiperRef.current.autoplay.start()
          // También actualizar el swiper para asegurar que esté sincronizado
          swiperRef.current.update()
        }
      }
    }, 100) // Pequeño delay para asegurar que todo esté montado

    return () => clearTimeout(timer)
  }, [isAutoplayPaused, slides.length])

  return (
    <div
      role='region'
      aria-label='Carrusel de banners hero'
      aria-live='polite'
      className={`hero-carousel relative w-full h-full ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Swiper
        modules={[Autoplay, Pagination, Navigation, Keyboard, A11y]}
        autoplay={{
          delay: autoplayDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: false, // Deshabilitar pauseOnMouseEnter para que funcione con nuestros handlers
        }}
        pagination={
          showPagination
            ? {
                clickable: true,
                bulletClass: 'hero-carousel-bullet',
                bulletActiveClass: 'hero-carousel-bullet-active',
                dynamicBullets: false,
                renderBullet: function (index: number, className: string) {
                  return `<span class="${className}" data-index="${index}" role="button" aria-label="Ir a slide ${index + 1}" tabindex="0"></span>`
                },
              }
            : false
        }
        navigation={
          showNavigation
            ? {
                nextEl: '.hero-carousel-button-next',
                prevEl: '.hero-carousel-button-prev',
              }
            : false
        }
        keyboard={{
          enabled: true,
          onlyInViewport: true,
        }}
        a11y={{
          enabled: true,
        }}
        loop={true}
        speed={800}
        effect='slide'
        spaceBetween={0}
        slidesPerView={1}
        centeredSlides={true}
        // Habilitar drag con mouse en desktop
        simulateTouch={true}
        allowTouchMove={true}
        touchRatio={1}
        longSwipes={true}
        longSwipesRatio={0.5}
        longSwipesMs={300}
        followFinger={true}
        // Optimizar touch en móvil - NO prevenir default para permitir scroll
        touchStartPreventDefault={false}
        touchMoveStopPropagation={false}
        threshold={10}
        touchAngle={45}
        resistance={true}
        resistanceRatio={0.85}
        // Permitir deslizar en ambas direcciones
        allowSlidePrev={true}
        allowSlideNext={true}
        // Cursor grab en desktop
        grabCursor={true}
        // Prevenir clicks durante el drag
        preventClicks={true}
        preventClicksPropagation={true}
        // Detectar la dirección del swipe
        touchEventsTarget='container'
        onSlideChange={handleSlideChange}
        onSwiper={(swiper: any) => {
          swiperRef.current = swiper
          // Iniciar autoplay después de que Swiper esté completamente inicializado
          // Usar setTimeout para asegurar que el DOM esté listo
          setTimeout(() => {
            if (swiper.autoplay && !isAutoplayPaused && swiper.slides && swiper.slides.length > 0) {
              swiper.autoplay.start()
              swiper.update() // Actualizar para sincronizar
            }
          }, 50)
        }}
        aria-label='Galería de banners promocionales'
        className='w-full h-full'
      >
        {slides.map((slide, index) => (
          <SwiperSlide
            key={slide.id}
            role='group'
            aria-label={`${index + 1} de ${slides.length}`}
            className='flex items-center justify-center'
          >
            <HeroSlide slide={slide} isActive={index === currentSlide} />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons - Solo en desktop */}
      {showNavigation && (
        <>
          <button
            className='hero-carousel-button-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/80 hover:bg-white rounded-full shadow-lg hidden lg:flex items-center justify-center text-blaze-orange-600 hover:text-blaze-orange-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2'
            aria-label='Slide anterior'
            type='button'
          >
            <svg
              className='w-5 h-5 md:w-6 md:h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </button>

          <button
            className='hero-carousel-button-next absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/80 hover:bg-white rounded-full shadow-lg hidden lg:flex items-center justify-center text-blaze-orange-600 hover:text-blaze-orange-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2'
            aria-label='Slide siguiente'
            type='button'
          >
            <svg
              className='w-5 h-5 md:w-6 md:h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              aria-hidden='true'
            >
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
            </svg>
          </button>
        </>
      )}

      {/* Slide Counter for Screen Readers */}
      <div className='sr-only' aria-live='polite' aria-atomic='true'>
        Slide {currentSlide + 1} de {slides.length}
        {isAutoplayPaused
          ? ' - Reproducción automática pausada'
          : ' - Reproducción automática activa'}
      </div>
    </div>
  )
}

export default HeroSlideCarousel

