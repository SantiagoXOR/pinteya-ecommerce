'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { ArrowRight } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'

interface DiscountCardProps {
  className?: string
}

const DiscountCard: React.FC<DiscountCardProps> = ({ className }) => {
  const [isHovered, setIsHovered] = useState(false)
  
  const handleClick = () => {
    window.location.href = 'https://www.pinteya.com/products'
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
          src='/images/promo/30%off.png'
          alt='30% OFF en todos nuestros productos'
          fill
          className='object-cover'
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
          priority
          quality={90}
        />
        
        {/* Overlay para mejorar legibilidad del texto */}
        <div className='absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-orange-500/20' />
        
        {/* Contenido superpuesto */}
        <div className='absolute inset-0 flex flex-col justify-between p-4 sm:p-5 md:p-6'>
          {/* Texto principal centrado */}
          <div className='flex-1 flex flex-col items-center justify-center text-center space-y-2 sm:space-y-3'>
            <h2 className='text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-yellow-400 drop-shadow-lg'>
              30% OFF
            </h2>
            <p className='text-white text-sm sm:text-base md:text-lg font-semibold drop-shadow-md'>
              En todos nuestros productos
            </p>
          </div>
          
          {/* Botón circular amarillo con flecha en esquina inferior derecha */}
          <div className='flex justify-end items-end'>
            <div className='w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg hover:bg-yellow-500 transition-colors'>
              <ArrowRight className='w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-orange-600' />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DiscountCard
