 'use client'

 import React, { useState, useEffect, useCallback, useMemo } from 'react'
 import Image from 'next/image'
 import { ChevronLeft, ChevronRight } from 'lucide-react'
 import { useSwipeGestures } from '@/hooks/useSwipeGestures'
 import { useRouter } from 'next/navigation'

 interface Slide {
   id: string
   image: string
   alt: string
   productSlug: string
 }

 // Carrusel igual al de Hero pero con los SVG hero4, hero5 y hero6
 const slides: Slide[] = [
   { id: 'combo-hero-4', image: '/images/hero/hero2/hero4.svg', alt: 'Combo destacado - slide 1', productSlug: 'plavicon-fibrado-plavicon' },
   { id: 'combo-hero-5', image: '/images/hero/hero2/hero5.svg', alt: 'Combo destacado - slide 2', productSlug: 'sintetico-converlux' },
   { id: 'combo-hero-6', image: '/images/hero/hero2/hero6.svg', alt: 'Combo destacado - slide 3', productSlug: 'recuplast-frentes' },
 ]

 const CombosSection: React.FC = () => {
   const [currentIndex, setCurrentIndex] = useState(1)
   const [isTransitioning, setIsTransitioning] = useState(false)
   const [isAutoPlaying, setIsAutoPlaying] = useState(true)
   const router = useRouter()

   const extendedSlides = useMemo(
     () => [slides[slides.length - 1], ...slides, slides[0]],
     []
   )

   const goToSlide = useCallback((index: number) => {
     setIsTransitioning(true)
     setCurrentIndex(index + 1)
     setIsAutoPlaying(false)
     setTimeout(() => setIsAutoPlaying(true), 10000)
   }, [])

   const goToPrevious = useCallback(() => {
     setIsTransitioning(true)
     setCurrentIndex((prev) => prev - 1)
     setIsAutoPlaying(false)
     setTimeout(() => setIsAutoPlaying(true), 10000)
   }, [])

   const goToNext = useCallback(() => {
     setIsTransitioning(true)
     setCurrentIndex((prev) => prev + 1)
     setIsAutoPlaying(false)
     setTimeout(() => setIsAutoPlaying(true), 10000)
   }, [])

   useEffect(() => {
     if (!isAutoPlaying) return
     const interval = setInterval(() => {
       goToNext()
     }, 5000)
     return () => clearInterval(interval)
   }, [isAutoPlaying, goToNext])

   useEffect(() => {
     if (!isTransitioning) return
     if (currentIndex === extendedSlides.length - 1) {
       setTimeout(() => {
         setIsTransitioning(false)
         setCurrentIndex(1)
       }, 700)
     }
     if (currentIndex === 0) {
       setTimeout(() => {
         setIsTransitioning(false)
         setCurrentIndex(slides.length)
       }, 700)
     }
   }, [currentIndex, isTransitioning, extendedSlides.length])

   // Configurar gestos táctiles para mobile
   const swipeRef = useSwipeGestures({
     onSwipeLeft: goToNext, // Deslizar izquierda = siguiente slide
     onSwipeRight: goToPrevious, // Deslizar derecha = slide anterior
     threshold: 50, // Distancia mínima de 50px para detectar swipe
     preventDefaultTouchmove: false, // No interferir con scroll vertical
   })

   // Handler para abrir el modal del producto al hacer click en el slide
   const handleSlideClick = useCallback((productSlug: string, e: React.MouseEvent) => {
     // Prevenir que el click interfiera con los gestos de swipe
     e.stopPropagation()
     
     // Navegar a la página del producto que automáticamente abre el modal
     router.push(`/products/${productSlug}`)
   }, [router])

  return (
    <section className='w-full pt-2 pb-2 px-4 bg-transparent'>
      <div className='max-w-[1200px] mx-auto'>
        <div className='relative w-full overflow-visible rounded-2xl' style={{ aspectRatio: '2.77' }}>
          {/* Contenedor interno con overflow-hidden para las slides */}
          <div ref={swipeRef as React.RefObject<HTMLDivElement>} className='relative w-full h-full overflow-hidden rounded-2xl'>
            <div
              className={`flex h-full ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {extendedSlides.map((slide, index) => {
                if (!slide) return null
                
                // Usar directamente el productSlug del slide actual
                // Cada slide en extendedSlides ya tiene su productSlug correcto
                const productSlug = slide.productSlug
                
                return (
                  <div 
                    key={`${slide.id}-${index}`} 
                    className='min-w-full h-full flex-shrink-0 relative cursor-pointer'
                    onClick={(e) => productSlug && handleSlideClick(productSlug, e)}
                  >
                    <Image
                      src={slide.image}
                      alt={slide.alt}
                      fill
                      priority={index === 1}
                      fetchPriority={index === 1 ? 'high' : 'auto'} // ⚡ CRITICAL: fetchPriority para primera imagen
                      className='object-contain'
                      sizes='(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px'
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Botones de navegación - Solo en desktop, mitad y mitad al borde del banner */}
          <button
            onClick={goToPrevious}
            className='hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 
                     w-10 h-10 rounded-full bg-white/90 hover:bg-white border-2 border-gray-200
                     text-blaze-orange-600 shadow-lg hover:shadow-xl
                     transition-all duration-300 hover:scale-110 active:scale-95
                     items-center justify-center group'
            aria-label='Slide anterior'
          >
            <ChevronLeft className='w-5 h-5 group-hover:translate-x-[-2px] transition-transform' />
          </button>
          <button
            onClick={goToNext}
            className='hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 
                     w-10 h-10 rounded-full bg-white/90 hover:bg-white border-2 border-gray-200
                     text-blaze-orange-600 shadow-lg hover:shadow-xl
                     transition-all duration-300 hover:scale-110 active:scale-95
                     items-center justify-center group'
            aria-label='Siguiente slide'
          >
            <ChevronRight className='w-5 h-5 group-hover:translate-x-[2px] transition-transform' />
          </button>

          {/* Indicadores (dots) - Estilo Mercado Libre */}
          <div className='absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2 sm:gap-3'>
            {slides.map((_, index) => {
              let realIndex = currentIndex - 1
              if (currentIndex === 0) realIndex = slides.length - 1
              if (currentIndex === extendedSlides.length - 1) realIndex = 0
              return (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`transition-all duration-300 rounded-full ${realIndex === index ? 'bg-white w-6 sm:w-8 h-2 sm:h-2.5 shadow-md' : 'bg-white/60 hover:bg-white/80 w-2 sm:w-2.5 h-2 sm:h-2.5'}`}
                  aria-label={`Ir al slide ${index + 1}`}
                />
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
 }

 export default CombosSection

