'use client'

import { useEffect, useRef, useState } from 'react'
import CompactSlider from './CompactSlider'

const Testimonials = () => {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
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
    <section ref={sectionRef} className='py-4'>
      <div className='max-w-4xl w-full mx-auto px-4'>
        <div
          className={`mb-6 flex items-center justify-center text-white text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Testimonios verificados
        </div>

        <CompactSlider />
      </div>
    </section>
  )
}

export default Testimonials
