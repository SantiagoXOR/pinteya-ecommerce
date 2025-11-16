 'use client'

 import React, { useState, useEffect, useCallback, useMemo } from 'react'
 import Image from 'next/image'
 import { ChevronLeft, ChevronRight } from 'lucide-react'

 interface Slide {
   id: string
   image: string
   alt: string
 }

 // Carrusel igual al de Hero pero con los SVG hero4, hero5 y hero6
 const slides: Slide[] = [
   { id: 'combo-hero-4', image: '/images/hero/hero2/hero4.svg', alt: 'Combo destacado - slide 1' },
   { id: 'combo-hero-5', image: '/images/hero/hero2/hero5.svg', alt: 'Combo destacado - slide 2' },
   { id: 'combo-hero-6', image: '/images/hero/hero2/hero6.svg', alt: 'Combo destacado - slide 3' },
 ]

 const CombosSection: React.FC = () => {
   const [currentIndex, setCurrentIndex] = useState(1)
   const [isTransitioning, setIsTransitioning] = useState(false)
   const [isAutoPlaying, setIsAutoPlaying] = useState(true)

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

   return (
     <section className='w-full pt-2 pb-2 px-4 bg-transparent'>
       <div className='max-w-[1200px] mx-auto'>
         <div className='relative w-full overflow-hidden rounded-2xl' style={{ aspectRatio: '2.77' }}>
           <div
             className={`flex h-full ${isTransitioning ? 'transition-transform duration-700 ease-in-out' : ''}`}
             style={{ transform: `translateX(-${currentIndex * 100}%)` }}
           >
             {extendedSlides.map((slide, index) => (
               <div key={`${slide.id}-${index}`} className='min-w-full h-full flex-shrink-0 relative'>
                 <Image
                   src={slide.image}
                   alt={slide.alt}
                   fill
                   priority={index === 1}
                   className='object-contain'
                   sizes='(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px'
                 />
               </div>
             ))}
           </div>

           <button
             onClick={goToPrevious}
             className='hidden md:flex absolute left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-blaze-orange-600 p-2 lg:p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 items-center justify-center group'
             aria-label='Slide anterior'
           >
             <ChevronLeft className='w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-[-2px] transition-transform' />
           </button>
           <button
             onClick={goToNext}
             className='hidden md:flex absolute right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-blaze-orange-600 p-2 lg:p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 items-center justify-center group'
             aria-label='Siguiente slide'
           >
             <ChevronRight className='w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-[2px] transition-transform' />
           </button>

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

