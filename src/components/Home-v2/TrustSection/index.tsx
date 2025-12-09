'use client'

import React, { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import { Shield, Award, Truck, Clock, Users, Star, CheckCircle } from '@/lib/optimized-imports'

const TrustSection = () => {
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

  return (
    <section
      id='trust-section'
      ref={sectionRef}
      className='py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-orange-50 via-white to-orange-50 relative overflow-hidden scroll-mt-20'
    >
      {/* Efectos de fondo decorativos */}
      <div className='absolute inset-0 opacity-30'>
        <div className='absolute top-10 left-10 w-72 h-72 bg-orange-200 rounded-full blur-3xl'></div>
        <div className='absolute bottom-10 right-10 w-96 h-96 bg-yellow-200 rounded-full blur-3xl'></div>
      </div>

      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0 relative z-10'>
        {/* Header mejorado */}
        <div className={`text-center mb-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className='inline-flex items-center gap-2 bg-gradient-to-r from-[#eb6313] to-[#bd4811] text-white px-6 py-2 rounded-full mb-4 shadow-lg'>
            <CheckCircle className='w-5 h-5' />
            <span className='font-bold text-sm'>GARANTÍA PINTEYA</span>
          </div>
          <h2 className='text-3xl lg:text-5xl font-bold text-gray-900 dark:!text-white mb-4'>
            Tu Confianza es Nuestra <span className='text-[#eb6313] dark:!text-white'>Prioridad</span>
          </h2>
          <p className='text-lg text-gray-600 dark:!text-white/80 max-w-3xl mx-auto'>
            Más de 15.000 clientes confían en nosotros. Descubre por qué somos líderes en Córdoba Capital.
          </p>
        </div>

        {/* Características con iconos circulares - REDISEÑADO */}
        <div className={`bg-white py-8 lg:py-12 rounded-3xl shadow-2xl mb-12 border-4 border-orange-100 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-10'>
              {[
                { image: '/images/hero/hero-enviogratis.png', label: 'Envíos Gratis', color: 'from-green-400 to-green-600', hoverColor: 'group-hover:from-green-500 group-hover:to-green-700' },
                { image: '/images/hero/hero-experto.png', label: 'Asesoramiento', color: 'from-[#eb6313] to-[#bd4811]', hoverColor: 'group-hover:from-orange-600 group-hover:to-orange-800' },
                { image: '/images/hero/hero-pagoseguro.png', label: 'Pagos Seguros', color: 'from-yellow-400 to-yellow-600', hoverColor: 'group-hover:from-yellow-500 group-hover:to-yellow-700' },
                { image: '/images/hero/hero-devoluciones.png', label: 'Cambios Fáciles', color: 'from-blue-400 to-blue-600', hoverColor: 'group-hover:from-blue-500 group-hover:to-blue-700' },
              ].map((item, idx) => (
                <div key={idx} className='text-center group cursor-pointer'>
                  <div className={`mx-auto w-20 h-20 lg:w-28 lg:h-28 mb-3 lg:mb-4 rounded-full bg-gradient-to-br ${item.color} ${item.hoverColor} flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:rotate-6`}>
                    <Image
                      src={item.image}
                      alt={item.label}
                      width={112}
                      height={112}
                      className='w-20 h-20 lg:w-28 lg:h-28 rounded-full transition-transform duration-300 group-hover:scale-110'
                    />
                  </div>
                  <h3 className='font-bold text-[#eb6313] dark:text-bright-sun-400 text-sm lg:text-lg transition-all duration-300 group-hover:scale-110 group-hover:text-[#bd4811] dark:group-hover:text-bright-sun-300'>
                    {item.label}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust Badges - REDISEÑADO */}
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {[
            { icon: Shield, label: 'Compra Protegida', color: 'bg-green-50 border-green-300 text-green-700' },
            { icon: Award, label: '30 días de garantía', color: 'bg-blue-50 border-blue-300 text-blue-700' },
            { icon: Truck, label: 'Envío en 24-48hs', color: 'bg-orange-50 border-orange-300 text-[#eb6313]' },
            { icon: Clock, label: 'Soporte 24/7', color: 'bg-teal-50 border-teal-300 text-teal-700' },
          ].map((badge, idx) => {
            const Icon = badge.icon
            return (
              <div key={idx} className={`flex items-center gap-3 p-4 ${badge.color} border-2 rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer`}>
                <Icon className='w-6 h-6 flex-shrink-0' />
                <span className='text-sm font-bold'>{badge.label}</span>
              </div>
            )
          })}
        </div>

        {/* Stats - REDISEÑADO */}
        <div className={`grid grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {[
            { icon: Users, value: '15.000+', label: 'Clientes satisfechos', color: 'from-blue-500 to-blue-600' },
            { icon: Star, value: '98%', label: 'Satisfacción garantizada', color: 'from-[#eb6313] to-[#bd4811]' },
            { icon: Truck, value: '24-48h', label: 'Envío rápido', color: 'from-orange-500 to-orange-600' },
            { icon: Award, value: '15 años', label: 'En el mercado', color: 'from-purple-500 to-purple-600' },
          ].map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div key={idx} className='text-center p-8 bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-orange-100 group'>
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${stat.color} mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon className='w-8 h-8 text-white' />
                </div>
                <div className='text-3xl font-bold text-gray-900 dark:!text-white mb-1 group-hover:text-[#eb6313] dark:group-hover:text-bright-sun-400 transition-colors'>{stat.value}</div>
                <div className='text-sm text-gray-600 dark:!text-white/80 font-medium'>{stat.label}</div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default TrustSection
