'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Calculator } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'

interface CalculatorCardProps {
  className?: string
}

const CalculatorCard: React.FC<CalculatorCardProps> = ({ className }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const handleClick = () => {
    window.location.href = 'https://www.pinteya.com/calculator'
  }

  return (
    <div
      className={cn(
        'relative rounded-xl bg-white shadow-md flex flex-col w-full cursor-pointer overflow-hidden',
        'h-[300px] sm:h-[360px]',
        'md:h-[400px] lg:h-[440px]',
        'md:rounded-2xl',
        'transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-xl',
        'transform-gpu will-change-transform',
        className
      )}
      style={{
        transformOrigin: 'center',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Imagen de fondo */}
      <div className='relative w-full h-full'>
        <Image
          src='/images/promo/calculator.png'
          alt='Calculadora de pintura'
          fill
          className='object-cover'
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          priority
          quality={90}
        />
        
        {/* Contenido superpuesto */}
        <div className='absolute inset-0 flex flex-col'>
          {/* Sección superior azul - Recuadro verde */}
          <div className='flex-1 relative flex items-start justify-center pt-4 sm:pt-6 md:pt-8'>
            <div className='bg-green-500/90 backdrop-blur-sm px-3 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg shadow-lg'>
              <p className='text-white text-[10px] sm:text-xs md:text-sm font-semibold text-center'>
                Obtené un presupuesto detallado al instante.
              </p>
            </div>
          </div>
          
          {/* Sección inferior amarilla - Texto y calculadora */}
          <div className='relative flex flex-col items-center justify-center pb-4 sm:pb-6 md:pb-8 space-y-2 sm:space-y-3'>
            <h3 className='text-orange-600 text-lg sm:text-xl md:text-2xl font-bold drop-shadow-md'>
              Calculá tu pintura
            </h3>
            
            {/* Icono de calculadora en cuadrado blanco */}
            <div className='w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-lg flex items-center justify-center shadow-lg'>
              <Calculator className='w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-orange-600' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalculatorCard
