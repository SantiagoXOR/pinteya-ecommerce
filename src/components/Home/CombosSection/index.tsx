'use client'

import React, { useState, useEffect, useRef } from 'react'

const combosImages = [
  '/images/promo/combopoximix.png',
  '/images/promo/comboverano.png',
  '/images/promo/comboplavicon.png',
]

const CombosSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Duplicar las imágenes para crear efecto infinito
  const infiniteImages = [...combosImages, ...combosImages]

  // Scroll automático infinito
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => prevIndex + 1)
    }, 3000) // Cambiar cada 3 segundos

    return () => clearInterval(interval)
  }, [])

  // Manejar el reinicio del scroll infinito
  useEffect(() => {
    if (currentIndex === combosImages.length) {
      // Cuando llegamos al final de las imágenes originales, esperamos a que termine la transición
      const timeout = setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(0)
        // Reactivar la transición en el siguiente frame
        requestAnimationFrame(() => {
          setIsTransitioning(true)
        })
      }, 300) // Duración de la transición CSS

      return () => clearTimeout(timeout)
    }
  }, [currentIndex])

  return (
    <section className='w-full py-2 px-4 bg-white'>
      <div className='max-w-7xl mx-auto'>
        {/* Carrusel horizontal */}
        <div className='relative'>
          {/* Contenedor del carrusel */}
          <div className='overflow-hidden rounded-2xl'>
            <div
              ref={containerRef}
              className={`flex ${isTransitioning ? 'transition-transform duration-300 ease-in-out' : ''}`}
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {infiniteImages.map((image, index) => (
                <div key={index} className='w-full flex-shrink-0'>
                  <img
                    src={image}
                    alt={`Combo promocional ${(index % combosImages.length) + 1}`}
                    className='w-full h-auto object-contain max-h-[300px] md:max-h-[400px]'
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CombosSection
