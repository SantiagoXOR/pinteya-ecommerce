'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const combosData = [
  { image: '/images/promo/comboverano.png', url: '/search?search=Piscinas' },
  { image: '/images/promo/comboeco.png', url: '/search?search=Ecopainting' },
  { image: '/images/promo/comboplavicon.png', url: '/search?search=Plavicon+Muros' },
  { image: '/images/promo/combopoximix.png', url: '/search?search=Poximix' }
]

const CombosSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Duplicar las imágenes para crear efecto infinito
  const infiniteData = [...combosData, ...combosData]

  // Scroll automático infinito
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => prevIndex + 1)
    }, 3000) // Cambiar cada 3 segundos

    return () => clearInterval(interval)
  }, [])

  // Manejar el reinicio del scroll infinito
  useEffect(() => {
    if (currentIndex === combosData.length) {
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
    <section className='w-full pt-6 pb-2 px-4 bg-white'>
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
              {infiniteData.map((combo, index) => (
                <div key={index} className='w-full flex-shrink-0'>
                  <Link href={combo.url} className='block'>
                    <img
                      src={combo.image}
                      alt={`Combo promocional ${(index % combosData.length) + 1}`}
                      className='w-full h-auto object-contain max-h-[300px] md:max-h-[400px] hover:scale-105 transition-transform duration-300 cursor-pointer hover:shadow-xl rounded-2xl'
                    />
                  </Link>
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
