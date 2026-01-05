'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Transition } from '@headlessui/react'

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

  // ⚡ FASE 5: Optimizado - agrupar lectura de geometría en requestAnimationFrame
  const heightFix = () => {
    if (testimonialsRef.current && testimonialsRef.current.parentElement) {
      // ⚡ FASE 5: Agrupar lectura de geometría antes de escribir estilo
      requestAnimationFrame(() => {
        if (testimonialsRef.current && testimonialsRef.current.parentElement) {
          const height = testimonialsRef.current.clientHeight
          // Escribir estilo en el siguiente frame para evitar forced reflow
          requestAnimationFrame(() => {
            if (testimonialsRef.current?.parentElement) {
              testimonialsRef.current.parentElement.style.height = `${height}px`
            }
          })
        }
      })
    }
  }

  useEffect(() => {
    heightFix()
  }, [])

  useEffect(() => {
    const container = namesRef.current
    const pill = pillRefs.current[active]

    if (!container || !pill) return

    // ⚡ OPTIMIZACIÓN: Usar requestAnimationFrame para agrupar lecturas de geometría y evitar reprocesamiento forzado
    requestAnimationFrame(() => {
      const offset = pill.offsetLeft - container.clientWidth / 2 + pill.clientWidth / 2
      container.scrollTo({ left: offset, behavior: 'smooth' })
    })
  }, [active])

  return (
    <div className='mx-auto w-full max-w-3xl text-center'>
      <div className='relative h-24'>
        <div className='pointer-events-none absolute left-1/2 top-0 h-[240px] w-[240px] -translate-x-1/2 before:absolute before:inset-0 before:-z-10 before:rounded-full before:bg-gradient-to-b before:from-orange-500/20 before:via-orange-500/5 before:via-25% before:to-orange-500/0 before:to-75%'>
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
                beforeEnter={() => heightFix()}
              >
                <Image
                  className='relative left-1/2 top-8 -translate-x-1/2 rounded-full border-4 border-white shadow-lg shadow-orange-900/10'
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
      <div className='mb-6 transition-all delay-300 duration-150 ease-in-out'>
        <div className='relative flex flex-col' ref={testimonialsRef}>
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
              beforeEnter={() => heightFix()}
            >
              <blockquote className='text-lg sm:text-xl font-semibold text-white leading-relaxed'>
                "{testimonial.quote}"
              </blockquote>
            </Transition>
          ))}
        </div>
      </div>
      <div
        ref={namesRef}
        className='flex gap-3 overflow-x-auto px-2 py-3 rounded-2xl border border-orange-50 bg-orange-50/40'
        style={{ scrollbarWidth: 'none' }}
      >
        {testimonials.map((testimonial, index) => {
          const isActive = active === index

          return (
            <button
              key={testimonial.name}
              ref={el => (pillRefs.current[index] = el)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs sm:text-sm shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring focus-visible:ring-orange-200 ${
                isActive
                  ? 'bg-orange-500 text-white shadow-orange-500/20'
                  : 'bg-white text-gray-900 hover:bg-orange-50'
              }`}
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
