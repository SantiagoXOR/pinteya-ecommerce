'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Mail, Send, CheckCircle } from '@/lib/optimized-imports'

const Newsletter = () => {
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica de suscripción
    setIsSubmitted(true)
    setTimeout(() => {
      setIsSubmitted(false)
      setEmail('')
    }, 3000)
  }

  return (
    <section className='overflow-hidden py-12 sm:py-16 lg:py-20 bg-white/50 backdrop-blur-sm'>
      <div className='max-w-[1170px] mx-auto px-4 sm:px-8 xl:px-0'>
        <div className='relative z-1 overflow-hidden rounded-3xl shadow-2xl'>
          {/* Background Image */}
          <Image
            src='/images/shapes/newsletter-bg.jpg'
            alt='background'
            className='absolute -z-1 w-full h-full left-0 top-0 rounded-3xl object-cover'
            width={1170}
            height={400}
          />
          
          {/* Overlay gradiente Pinteya */}
          <div className='absolute -z-1 w-full h-full left-0 top-0 bg-gradient-to-r from-[#eb6313] via-[#bd4811] to-[#eb6313] opacity-95 rounded-3xl'></div>
          
          {/* Patrón de puntos */}
          <div className='absolute -z-1 w-full h-full left-0 top-0 opacity-10'>
            <div className='absolute inset-0' style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }}></div>
          </div>

          <div className='relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 px-6 sm:px-8 xl:px-16 py-12 lg:py-16'>
            {/* Contenido izquierdo */}
            <div className='max-w-[550px] w-full'>
              <div className='inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4'>
                <Mail className='w-5 h-5 text-yellow-300' />
                <span className='text-white font-bold text-sm'>OFERTAS EXCLUSIVAS</span>
              </div>
              
              <h2 className='text-white font-bold text-2xl sm:text-3xl xl:text-4xl mb-4 leading-tight'>
                No te pierdas las últimas{' '}
                <span className='text-yellow-300'>ofertas</span> en pinturería
              </h2>
              
              <p className='text-white/90 text-lg mb-6'>
                Suscribite para recibir noticias sobre las mejores ofertas, lanzamientos y códigos de descuento exclusivos
              </p>

              {/* Features */}
              <div className='flex flex-col gap-3'>
                {['10% descuento en tu primera compra', 'Acceso anticipado a ofertas', 'Contenido exclusivo y tips'].map((feature, idx) => (
                  <div key={idx} className='flex items-center gap-2 text-white/90'>
                    <CheckCircle className='w-5 h-5 text-yellow-300 flex-shrink-0' />
                    <span className='text-sm font-medium'>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Formulario derecho */}
            <div className='max-w-[500px] w-full'>
              {isSubmitted ? (
                <div className='bg-white/20 backdrop-blur-md border-2 border-white/30 rounded-2xl p-8 text-center'>
                  <div className='w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <CheckCircle className='w-8 h-8 text-white' />
                  </div>
                  <h3 className='text-white font-bold text-xl mb-2'>¡Suscripción exitosa!</h3>
                  <p className='text-white/90'>Revisa tu email para confirmar tu suscripción</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='bg-white/10 backdrop-blur-md border-2 border-white/30 rounded-2xl p-6 sm:p-8'>
                  <div className='flex flex-col gap-4'>
                    <div className='relative'>
                      <Mail className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400' />
                      <input
                        type='email'
                        name='email'
                        id='email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder='tuemail@ejemplo.com'
                        required
                        className='w-full bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 focus:border-[#eb6313] dark:focus:border-blaze-orange-500 outline-none rounded-xl placeholder:text-gray-400 dark:placeholder:!text-white/60 py-4 pl-12 pr-4 text-gray-900 dark:!text-white font-medium transition-all'
                      />
                    </div>
                    
                    <button
                      type='submit'
                      className='group w-full inline-flex items-center justify-center gap-2 py-4 px-7 text-white bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 font-bold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105'
                    >
                      <span>Suscribirse</span>
                      <Send className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                    </button>

                    <p className='text-white/70 text-xs text-center'>
                      Al suscribirte aceptas recibir emails con ofertas. Puedes darte de baja en cualquier momento.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Newsletter
