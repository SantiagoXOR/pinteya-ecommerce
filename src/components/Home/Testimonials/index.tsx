'use client'

import CompactSlider from './CompactSlider'

const Testimonials = () => {
  return (
    <section className='py-4'>
      <div className='max-w-4xl w-full mx-auto px-8'>
        <div className='mb-6 flex items-center justify-center text-white text-xs font-semibold uppercase tracking-[0.2em]'>
          Testimonios verificados
        </div>

        <CompactSlider />
      </div>
    </section>
  )
}

export default Testimonials
