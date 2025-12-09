'use client'

import React, { useState, useEffect } from 'react'
import { Truck, Shield, Headphones, Trophy } from '@/lib/optimized-imports'

const BenefitsBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const benefits = [
    {
      icon: Trophy,
      text: 'Líderes en Córdoba Capital',
      color: 'text-orange-600',
    },
    {
      icon: Truck,
      text: 'Envío gratis en compras +$50.000',
      color: 'text-green-600',
    },
    {
      icon: Shield,
      text: 'Compra 100% segura',
      color: 'text-purple-600',
    },
    {
      icon: Headphones,
      text: 'Asesoramiento gratis por WhatsApp',
      color: 'text-blue-600',
    },
  ]

  // Rotar beneficios cada 4 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % benefits.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  // Esconder al hacer scroll para no molestar
  useEffect(() => {
    let lastScroll = 0

    const handleScroll = () => {
      const currentScroll = window.scrollY

      if (currentScroll > 200 && currentScroll > lastScroll) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      lastScroll = currentScroll
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const currentBenefit = benefits[currentIndex]
  if (!currentBenefit) return null

  const CurrentIcon = currentBenefit.icon

  return (
    <div
      className={`
        relative bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div className='max-w-7xl mx-auto px-4 py-0.5'>
        <div className='flex items-center justify-center gap-3 overflow-hidden'>
          {/* Vista desktop - mostrar todos */}
          <div className='hidden md:flex items-center justify-center gap-8 flex-wrap'>
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon
              return (
                <div
                  key={index}
                  className='flex items-center gap-2 group hover:scale-105 transition-transform'
                >
                  <div
                    className={`${benefit.color} bg-white p-2 rounded-full shadow-sm group-hover:shadow-md transition-shadow`}
                  >
                    <Icon className='w-4 h-4' />
                  </div>
                  <span className='text-sm font-medium text-gray-700'>
                    {benefit.text}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Vista mobile - rotar */}
          <div className='md:hidden flex items-center gap-2 animate-fadeIn'>
            <div
              className={`${currentBenefit.color} bg-white p-2 rounded-full shadow-sm`}
            >
              <CurrentIcon className='w-4 h-4' />
            </div>
            <span className='text-sm font-medium text-gray-700'>
              {currentBenefit.text}
            </span>
          </div>

          {/* Indicadores para mobile */}
          <div className='md:hidden flex gap-1 ml-2'>
            {benefits.map((_, index) => (
              <div
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-orange-500 w-3' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BenefitsBar

