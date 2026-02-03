'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Transition } from '@headlessui/react'
import { useTenantSafe } from '@/contexts/TenantContext'

interface Testimonial {
  img: string
  quote: string
  name: string
  role: string
}

interface TestimonialSliderProps {
  testimonials: Testimonial[]
  autorotate?: boolean
  autorotateTiming?: number
}

const TestimonialSlider = ({
  testimonials,
  autorotate = true,
  autorotateTiming = 7000,
}: TestimonialSliderProps) => {
  // ⚡ MULTITENANT: Color del tenant para pills y elementos naranjas
  const tenant = useTenantSafe()
  const accentColor = tenant?.accentColor || '#ffd549' // Amarillo por defecto
  const primaryColor = tenant?.primaryColor || '#ea5a17' // Naranja por defecto
  
  const testimonialsRef = useRef<HTMLDivElement>(null)
  const namesRef = useRef<HTMLDivElement>(null)
  const pillRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [active, setActive] = useState<number>(0)
  const [autoPlayEnabled, setAutoPlayEnabled] = useState<boolean>(autorotate)

  useEffect(() => {
    if (!autoPlayEnabled) return

    const interval = setInterval(() => {
      setActive(prev => (prev + 1 === testimonials.length ? 0 : prev + 1))
    }, autorotateTiming)

    return () => clearInterval(interval)
  }, [autoPlayEnabled, autorotateTiming, testimonials.length])

  // ⚡ FIX: Altura fija para evitar redimensionamiento al cambiar testimonios
  // Ya no necesitamos heightFix() porque usamos min-height fijo

  useEffect(() => {
    const container = namesRef.current
    const pill = pillRefs.current[active]

    if (!container || !pill) return

    // ⚡ PERFORMANCE: Lecturas en un rAF, escritura (scrollTo) en el siguiente para evitar forced reflow
    requestAnimationFrame(() => {
      const offset = pill.offsetLeft - container.clientWidth / 2 + pill.clientWidth / 2
      requestAnimationFrame(() => {
        container.scrollTo({ left: offset, behavior: 'smooth' })
      })
    })
  }, [active])

  return (
    <div className='mx-auto w-full max-w-3xl text-center'>
      <div className='relative h-24'>
        {/* ⚡ MULTITENANT: usar accentColor para gradiente semicircular */}
        <div className='pointer-events-none absolute left-1/2 top-0 h-[240px] w-[240px] -translate-x-1/2'>
          {/* Degradado semicircular detrás de la imagen */}
          <div 
            className='absolute left-1/2 top-0 h-[120px] w-[240px] -translate-x-1/2 -z-10'
            style={{
              background: `radial-gradient(ellipse 120px 120px at center top, ${accentColor}33 0%, ${accentColor}1a 20%, ${accentColor}0d 40%, transparent 70%)`,
              borderRadius: '120px 120px 0 0',
            }}
          />
          <div className='h-24 [mask-image:_linear-gradient(0deg,transparent,theme(colors.white)_20%,theme(colors.white))]'>
            {testimonials.map((testimonial, index) => (
              <Transition
                as='div'
                key={index}
                show={active === index}
                className='absolute inset-0 -z-10 h-full'
                enter='transition ease-&lsqb;cubic-bezier(0.68,-0.3,0.32,1)&rsqb; duration-700 order-first'
                enterFrom='opacity-0 -rotate-[60deg]'
                enterTo='opacity-100 rotate-0'
                leave='transition ease-&lsqb;cubic-bezier(0.68,-0.3,0.32,1)&rsqb; duration-700'
                leaveFrom='opacity-100 rotate-0'
                leaveTo='opacity-0 rotate-[60deg]'
              >
                <Image
                  className='relative left-1/2 top-8 -translate-x-1/2 rounded-full border-4 border-white shadow-lg'
                  style={{
                    boxShadow: `0 10px 25px ${accentColor}1a`
                  }}
                  src={testimonial.img}
                  width={64}
                  height={64}
                  alt={testimonial.name}
                />
              </Transition>
            ))}
          </div>
        </div>
      </div>
      {/* ⚡ FIX: Altura fija para evitar redimensionamiento - soporta hasta 3 líneas */}
      <div className='mb-6 transition-all delay-300 duration-150 ease-in-out min-h-[120px] sm:min-h-[100px]'>
        <div className='relative flex flex-col items-center justify-center' ref={testimonialsRef} style={{ minHeight: '120px' }}>
          {testimonials.map((testimonial, index) => (
            <Transition
              key={index}
              show={active === index}
              enter='transition ease-in-out duration-500 delay-200 order-first'
              enterFrom='opacity-0 -translate-x-4'
              enterTo='opacity-100 translate-x-0'
              leave='transition ease-out duration-300 delay-300 absolute'
              leaveFrom='opacity-100 translate-x-0'
              leaveTo='opacity-0 translate-x-4'
            >
              <blockquote 
                className='text-lg sm:text-xl font-semibold leading-relaxed px-4 text-white'
                style={{ 
                  minHeight: '120px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center'
                }}
              >
                "{testimonial.quote}"
              </blockquote>
            </Transition>
          ))}
        </div>
      </div>
      {/* ⚡ MULTITENANT: usar accentColor para contenedor y pills */}
      <div
        ref={namesRef}
        className='flex gap-3 overflow-x-auto px-2 py-3 rounded-2xl border'
        style={{ 
          scrollbarWidth: 'none',
          borderColor: `${accentColor}40`,
          backgroundColor: `${accentColor}1a`
        }}
      >
        {testimonials.map((testimonial, index) => {
          const isActive = active === index

          return (
            <button
              key={testimonial.name}
              ref={el => (pillRefs.current[index] = el)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm shadow-sm transition-colors duration-150 focus-visible:outline-none ${
                isActive
                  ? ''
                  : 'bg-white text-gray-900'
              }`}
              style={{
                backgroundColor: isActive ? accentColor : undefined,
                color: isActive ? primaryColor : undefined,
                boxShadow: isActive ? `0 2px 8px ${accentColor}33` : undefined,
                focusVisibleRingColor: `${accentColor}80`
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = `${accentColor}20`
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'white'
                }
              }}
              onClick={() => {
                setActive(index)
                setAutoPlayEnabled(false)
              }}
            >
              {testimonial.name} · {testimonial.role}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default TestimonialSlider
