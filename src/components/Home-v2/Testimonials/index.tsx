'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'
import { useCallback, useRef, useState, useEffect } from 'react'
import testimonialsData from './testimonialsData'
import Image from 'next/image'
import { Quote } from 'lucide-react'

import 'swiper/css/navigation'
import 'swiper/css'
import SingleItem from './SingleItem'

const Testimonials = () => {
  const sliderRef = useRef<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry && entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handlePrev = useCallback(() => {
    if (!sliderRef.current) return
    sliderRef.current.swiper.slidePrev()
  }, [])

  const handleNext = useCallback(() => {
    if (!sliderRef.current) return
    sliderRef.current.swiper.slideNext()
  }, [])

  return (
    <section 
      ref={sectionRef}
      className='overflow-hidden py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-gray-50 to-white relative'
    >
      {/* Decoración de fondo */}
      <div className='absolute inset-0 opacity-10'>
        <Quote className='absolute top-20 left-20 w-64 h-64 text-[#eb6313] rotate-12' />
        <Quote className='absolute bottom-20 right-20 w-64 h-64 text-[#eb6313] -rotate-12' />
      </div>

      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 relative z-10'>
        <div className='swiper testimonial-carousel common-carousel'>
          {/* Header mejorado */}
          <div className={`mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className='text-center'>
              <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#eb6313] to-[#bd4811] text-white px-6 py-2 rounded-full mb-4 shadow-lg'>
                <Image src='/images/icons/icon-08.svg' alt='icon' width={17} height={17} />
                <span className='font-bold text-sm'>TESTIMONIOS</span>
              </div>
              <h2 className='font-bold text-3xl lg:text-5xl text-gray-900 mb-4'>
                Lo que dicen nuestros <span className='text-[#eb6313]'>clientes</span>
              </h2>
              <p className='text-gray-600 text-lg max-w-2xl mx-auto'>
                Opiniones reales de clientes satisfechos con nuestros productos y servicios
              </p>
            </div>

            {/* Controles mejorados */}
            <div className='flex items-center justify-center gap-4 mt-8'>
              <button
                onClick={handlePrev}
                className='w-12 h-12 rounded-full bg-gradient-to-r from-[#eb6313] to-[#bd4811] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300'
                aria-label='Anterior'
              >
                <svg className='w-6 h-6' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                  <path fillRule='evenodd' clipRule='evenodd' d='M15.4881 4.43057C15.8026 4.70014 15.839 5.17361 15.5694 5.48811L9.98781 12L15.5694 18.5119C15.839 18.8264 15.8026 19.2999 15.4881 19.5695C15.1736 19.839 14.7001 19.8026 14.4306 19.4881L8.43056 12.4881C8.18981 12.2072 8.18981 11.7928 8.43056 11.5119L14.4306 4.51192C14.7001 4.19743 15.1736 4.161 15.4881 4.43057Z' fill='currentColor' />
                </svg>
              </button>

              <button
                onClick={handleNext}
                className='w-12 h-12 rounded-full bg-gradient-to-r from-[#eb6313] to-[#bd4811] text-white flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300'
                aria-label='Siguiente'
              >
                <svg className='w-6 h-6' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                  <path fillRule='evenodd' clipRule='evenodd' d='M8.51192 4.43057C8.82641 4.161 9.29989 4.19743 9.56946 4.51192L15.5695 11.5119C15.8102 11.7928 15.8102 12.2072 15.5695 12.4881L9.56946 19.4881C9.29989 19.8026 8.82641 19.839 8.51192 19.5695C8.19743 19.2999 8.161 18.8264 8.43057 18.5119L14.0122 12L8.43057 5.48811C8.161 5.17361 8.19743 4.70014 8.51192 4.43057Z' fill='currentColor' />
                </svg>
              </button>
            </div>
          </div>

          <Swiper
            ref={sliderRef}
            modules={[Autoplay, Navigation]}
            slidesPerView={3}
            spaceBetween={20}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={true}
            breakpoints={{
              0: { slidesPerView: 1 },
              1000: { slidesPerView: 2 },
              1200: { slidesPerView: 3 },
            }}
          >
            {testimonialsData.map((item, key) => (
              <SwiperSlide key={key}>
                <SingleItem testimonial={item} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  )
}

export default Testimonials
