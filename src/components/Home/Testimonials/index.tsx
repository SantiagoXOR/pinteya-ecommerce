'use client'

import { useEffect, useRef, useState } from 'react'
import TestimonialSlider from '@/components/ui/testimonial-slider'
import testimonialsData from './testimonialsData'

const mapTestimonials = () =>
  testimonialsData.map(item => ({
    img: item.authorImg || 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop',
    quote: item.review,
    name: item.authorName,
    role: item.authorRole,
  }))

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
    <section ref={sectionRef} className='py-6 sm:py-10 bg-white'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
        <div
          className={`mb-6 flex items-center justify-center text-orange-600 text-xs font-semibold uppercase tracking-[0.2em] transition-all duration-500 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          Testimonios verificados
        </div>

        <TestimonialSlider testimonials={mapTestimonials()} autorotateTiming={6000} />
      </div>
    </section>
  )
}

export default Testimonials
