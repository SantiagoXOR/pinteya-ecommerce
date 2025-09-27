/**
 * HeroCarouselInteractive Component
 * Carousel interactivo para la sección hero
 */

import React, { useState, useEffect } from 'react'

interface HeroSlide {
  id: string
  title: string
  subtitle?: string
  image: string
  cta?: {
    text: string
    href: string
  }
}

interface HeroCarouselInteractiveProps {
  slides?: HeroSlide[]
  autoPlay?: boolean
  interval?: number
  className?: string
}

const defaultSlides: HeroSlide[] = [
  {
    id: '1',
    title: 'Bienvenido a Pinteya',
    subtitle: 'Tu tienda de pinturería y ferretería',
    image: '/images/hero/slide1.jpg',
    cta: {
      text: 'Ver Productos',
      href: '/productos',
    },
  },
  {
    id: '2',
    title: 'Ofertas Especiales',
    subtitle: 'Descuentos en productos seleccionados',
    image: '/images/hero/slide2.jpg',
    cta: {
      text: 'Ver Ofertas',
      href: '/ofertas',
    },
  },
]

export const HeroCarouselInteractive: React.FC<HeroCarouselInteractiveProps> = ({
  slides = defaultSlides,
  autoPlay = true,
  interval = 5000,
  className = '',
}) => {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    if (!autoPlay) {
      return
    }

    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, interval, slides.length])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div className={`relative w-full h-96 overflow-hidden rounded-lg ${className}`}>
      {/* Slides */}
      <div className='relative w-full h-full'>
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className='w-full h-full bg-cover bg-center'
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className='absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center'>
                <div className='text-center text-white'>
                  <h2 className='text-4xl font-bold mb-4'>{slide.title}</h2>
                  {slide.subtitle && <p className='text-xl mb-6'>{slide.subtitle}</p>}
                  {slide.cta && (
                    <a
                      href={slide.cta.href}
                      className='inline-block bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-dark transition-colors'
                    >
                      {slide.cta.text}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className='absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all'
        aria-label='Slide anterior'
      >
        <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
        </svg>
      </button>

      <button
        onClick={nextSlide}
        className='absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-full transition-all'
        aria-label='Slide siguiente'
      >
        <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2'>
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
            aria-label={`Ir al slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default HeroCarouselInteractive
