'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Eye, ArrowRight } from 'lucide-react'
import { trackEvent } from '@/lib/google-analytics'

const combosData = [
  {
    id: 'combo-verano',
    image: '/images/promo/comboverano.png',
    url: '/search?search=Piscinas',
    title: 'Combo Verano - Piscinas',
    description: 'Todo lo que necesitás para tu pileta',
  },
  {
    id: 'combo-eco',
    image: '/images/promo/comboeco.png',
    url: '/search?search=Ecopainting',
    title: 'Combo Eco - Pinturas Ecológicas',
    description: 'Cuidá el ambiente con nuestras pinturas eco-friendly',
  },
  {
    id: 'combo-plavicon',
    image: '/images/promo/comboplavicon.png',
    url: '/search?search=Plavicon+Muros',
    title: 'Combo Plavicon - Impermeabilizantes',
    description: 'Protegé tus muros con la mejor tecnología',
  },
  {
    id: 'combo-poximix',
    image: '/images/promo/combopoximix.png',
    url: '/search?search=Poximix',
    title: 'Combo Poximix - Epoxi Premium',
    description: 'Acabados profesionales para pisos y superficies',
  },
]

const CombosSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(true)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Duplicar las imágenes para crear efecto infinito
  const infiniteData = [...combosData, ...combosData]

  // Scroll automático infinito
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex(prevIndex => prevIndex + 1)
    }, 5000) // Cambiar cada 5 segundos (más tiempo para leer)

    return () => clearInterval(interval)
  }, [])

  // Manejar el reinicio del scroll infinito
  useEffect(() => {
    if (currentIndex === combosData.length) {
      const timeout = setTimeout(() => {
        setIsTransitioning(false)
        setCurrentIndex(0)
        requestAnimationFrame(() => {
          setIsTransitioning(true)
        })
      }, 300)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex])

  const handleComboClick = (comboId: string, comboTitle: string) => {
    trackEvent('combo_click', 'engagement', comboTitle)
  }

  return (
    <section className='w-full pt-6 pb-2 px-4 bg-white'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-4 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold text-gray-900 mb-1'>
              Productos Destacados
            </h2>
            <p className='text-gray-600 text-sm'>
              Ofertas especiales en productos seleccionados
            </p>
          </div>
          <Link
            href='/search?search=combos'
            className='hidden md:flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium text-sm transition-colors'
          >
            Ver todos
            <ArrowRight className='w-4 h-4' />
          </Link>
        </div>

        {/* Carrusel horizontal mejorado */}
        <div className='relative group'>
          {/* Contenedor del carrusel */}
          <div className='overflow-hidden rounded-2xl'>
            <div
              ref={containerRef}
              className={`flex ${isTransitioning ? 'transition-transform duration-300 ease-in-out' : ''}`}
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {infiniteData.map((combo, index) => (
                <div key={index} className='w-full flex-shrink-0 px-1'>
                  <Link
                    href={combo.url}
                    onClick={() =>
                      handleComboClick(combo.id, combo.title)
                    }
                    className='group/card block relative'
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Imagen del combo */}
                    <div className='relative overflow-hidden rounded-2xl'>
                      <img
                        src={combo.image}
                        alt={combo.title}
                        className='w-full h-auto object-contain max-h-[300px] md:max-h-[400px] transition-transform duration-500 group-hover/card:scale-105'
                      />

                      {/* Overlay con gradiente en hover */}
                      <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 rounded-2xl'>
                        {/* Texto informativo en hover */}
                        <div className='absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover/card:translate-y-0 transition-transform duration-300'>
                          <h3 className='font-bold text-xl mb-2'>
                            {combo.title}
                          </h3>
                          <p className='text-white/90 text-sm mb-4'>
                            {combo.description}
                          </p>

                          {/* CTA Button */}
                          <div className='flex items-center gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-medium px-4 py-2 rounded-lg w-fit transition-all'>
                            <Eye className='w-4 h-4' />
                            <span>Ver detalles</span>
                            <ArrowRight className='w-4 h-4 group-hover/card:translate-x-1 transition-transform' />
                          </div>
                        </div>
                      </div>

                      {/* Badge de "Oferta" */}
                      <div className='absolute top-4 right-4 bg-red-500 text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg transform group-hover/card:scale-110 transition-transform'>
                        🔥 Oferta
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Indicadores de posición */}
          <div className='flex justify-center gap-2 mt-4'>
            {combosData.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`transition-all ${
                  index === currentIndex % combosData.length
                    ? 'bg-orange-500 w-8 h-2'
                    : 'bg-gray-300 w-2 h-2 hover:bg-gray-400'
                } rounded-full`}
                aria-label={`Ir al combo ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default CombosSection

