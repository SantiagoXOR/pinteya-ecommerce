'use client'

import React, { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, Keyboard, A11y } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

interface HeroImage {
  src: string
  alt: string
  priority?: boolean
  unoptimized?: boolean
}

interface HeroCarouselProps {
  images: HeroImage[]
  autoplayDelay?: number
  className?: string
  showNavigation?: boolean
  showPagination?: boolean
  onSlideChange?: (index: number) => void
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({
  images,
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!swiperRef.current) {
        return
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault()
          swiperRef.current.slidePrev()
          break
        case 'ArrowRight':
          event.preventDefault()
          swiperRef.current.slideNext()
          break
        case 'Escape':
          event.preventDefault()
          if (isAutoplayPaused) {
            handleMouseLeave()
          } else {
            handleMouseEnter()
          }
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isAutoplayPaused])

  return (
    <div
      role='region'
      aria-label='Carrusel de imágenes principales'
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
          pauseOnMouseEnter: true,
        }}
        pagination={
          showPagination
            ? {
                clickable: true,
                bulletClass: 'hero-carousel-bullet',
                bulletActiveClass: 'hero-carousel-bullet-active',
                dynamicBullets: false,
                renderBullet: function (index: number, className: string) {
                  return `<span class="${className}" data-index="${index}" role="button" aria-label="Ir a imagen ${index + 1}" tabindex="0"></span>`
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
        onSlideChange={handleSlideChange}
        onSwiper={(swiper: any) => {
          swiperRef.current = swiper
        }}
        aria-label='Galería de imágenes de productos'
        className='w-full h-full'
      >
        {images.map((image, index) => (
          <SwiperSlide
            key={`${image.src}-${index}`}
            role='group'
            aria-label={`${index + 1} de ${images.length}`}
            className='flex items-center justify-center'
          >
            <div className='relative w-full h-full'>
              <Image
                src={image.src}
                alt={image.alt}
                fill
                className='object-contain transition-all duration-500 ease-in-out'
                priority={image.priority || index === 0}
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw'
                quality={95}
                unoptimized={image.unoptimized || true}
                aria-describedby={`slide-description-${index}`}
              />
              <div id={`slide-description-${index}`} className='sr-only'>
                {image.alt}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom Navigation Buttons */}
      {showNavigation && (
        <>
          <button
            className='hero-carousel-button-prev absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-blaze-orange-600 hover:text-blaze-orange-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2'
            aria-label='Imagen anterior'
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
            className='hero-carousel-button-next absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 md:w-12 md:h-12 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-blaze-orange-600 hover:text-blaze-orange-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2'
            aria-label='Imagen siguiente'
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
        Imagen {currentSlide + 1} de {images.length}
        {isAutoplayPaused
          ? ' - Reproducción automática pausada'
          : ' - Reproducción automática activa'}
      </div>
    </div>
  )
}

export default HeroCarousel
