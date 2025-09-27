'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'

// Import Swiper styles
import 'swiper/css/pagination'
import 'swiper/css'

import Image from 'next/image'

const HeroCarousal = () => {
  return (
    <Swiper
      spaceBetween={30}
      centeredSlides={true}
      autoplay={{
        delay: 2500,
        disableOnInteraction: false,
      }}
      pagination={{
        clickable: true,
      }}
      modules={[Autoplay, Pagination]}
      className='hero-carousel'
    >
      <SwiperSlide>
        <div className='flex items-center pt-6 sm:pt-0 flex-col-reverse sm:flex-row'>
          <div className='max-w-[394px] py-10 sm:py-15 lg:py-24.5 pl-4 sm:pl-7.5 lg:pl-12.5'>
            <div className='flex items-center gap-4 mb-7.5 sm:mb-10'>
              <span className='block font-semibold text-heading-3 sm:text-heading-1 text-tahiti-gold-500'>
                25%
              </span>
              <span className='block text-dark text-sm sm:text-custom-1 sm:leading-[24px]'>
                Descuento
                <br />
                Especial
              </span>
            </div>

            <h1 className='font-semibold text-dark text-xl sm:text-3xl mb-3'>
              <a href='#'>Pintura Látex Premium Sherwin Williams</a>
            </h1>

            <p>
              Pintura látex de alta calidad para interiores y exteriores. Excelente cobertura y
              durabilidad para todos tus proyectos.
            </p>

            <a
              href='/shop'
              className='inline-flex font-medium text-white text-custom-sm rounded-md bg-tahiti-gold-500 py-3 px-9 ease-out duration-200 hover:bg-tahiti-gold-700 mt-10'
            >
              Comprar Ahora
            </a>
          </div>

          <div>
            <Image
              src='/images/products/product-1-bg-1.png'
              alt='Pintura Látex Premium Sherwin Williams'
              width={351}
              height={358}
            />
          </div>
        </div>
      </SwiperSlide>
      <SwiperSlide>
        {' '}
        <div className='flex items-center pt-6 sm:pt-0 flex-col-reverse sm:flex-row'>
          <div className='max-w-[394px] py-10 sm:py-15 lg:py-26 pl-4 sm:pl-7.5 lg:pl-12.5'>
            <div className='flex items-center gap-4 mb-7.5 sm:mb-10'>
              <span className='block font-semibold text-heading-3 sm:text-heading-1 text-tahiti-gold-500'>
                20%
              </span>
              <span className='block text-dark text-sm sm:text-custom-1 sm:leading-[24px]'>
                Oferta
                <br />
                Limitada
              </span>
            </div>

            <h1 className='font-semibold text-dark text-xl sm:text-3xl mb-3'>
              <a href='#'>Esmalte Sintético Petrilac Premium</a>
            </h1>

            <p>
              Esmalte sintético de alta resistencia para maderas y metales. Protección duradera
              contra la intemperie.
            </p>

            <a
              href='/shop'
              className='inline-flex font-medium text-white text-custom-sm rounded-md bg-tahiti-gold-500 py-3 px-9 ease-out duration-200 hover:bg-tahiti-gold-700 mt-10'
            >
              Comprar Ahora
            </a>
          </div>

          <div>
            <Image
              src='/images/products/product-2-bg-1.png'
              alt='Esmalte Sintético Petrilac Premium'
              width={351}
              height={358}
            />
          </div>
        </div>
      </SwiperSlide>
    </Swiper>
  )
}

export default HeroCarousal
