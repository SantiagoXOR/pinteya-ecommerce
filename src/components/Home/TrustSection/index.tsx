'use client'

import React from 'react'
import { Shield, Award, Truck, Clock, Users, Star, Headphones } from '@/lib/optimized-imports'

const metrics = [
  { label: 'Clientes felices', value: '15.000+', icon: Users },
  { label: 'Satisfacción', value: '98%', icon: Star },
  { label: 'Experiencia', value: '15 años', icon: Award },
  { label: 'Envíos en', value: '24-48h', icon: Truck },
]

const benefits = [
  {
    title: 'Envíos rápidos',
    subtitle: 'Córdoba Capital sin cargo',
    icon: Truck,
    accent: 'bg-orange-100 text-orange-700',
  },
  {
    title: 'Pagos seguros',
    subtitle: 'Mercado Pago y contra entrega',
    icon: Shield,
    accent: 'bg-yellow-100 text-yellow-700',
  },
  {
    title: 'Asesoramiento experto',
    subtitle: 'Por WhatsApp o teléfono',
    icon: Headphones,
    accent: 'bg-emerald-100 text-emerald-700',
  },
  {
    title: 'Garantía y cambios',
    subtitle: 'Hasta 30 días para decidir',
    icon: Clock,
    accent: 'bg-blue-100 text-blue-700',
  },
]

const TrustSection = () => {
  return (
    <section className='py-10 sm:py-14 bg-gradient-to-br from-[#fff7ed] via-white to-white'>
      <div className='max-w-5xl mx-auto px-4 sm:px-6'>
        <div className='rounded-3xl bg-white shadow-[0_25px_60px_rgba(255,153,0,0.08)] border border-orange-50 overflow-hidden'>
          <div className='px-6 sm:px-10 py-8 text-center space-y-4'>
            <span className='inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-600'>
              Garantía Pinteya
            </span>
            <h2 className='text-2xl sm:text-3xl font-black text-gray-900'>
              Tu confianza es nuestra prioridad
            </h2>
            <p className='text-gray-600 text-base sm:text-lg max-w-3xl mx-auto'>
              Más de 15.000 clientes confían en nosotros para sus proyectos de pinturería. Servicio
              cercano, entregas rápidas y asesoramiento real.
            </p>
          </div>

          <div className='grid grid-cols-2 sm:grid-cols-4 border-y border-orange-50'>
            {metrics.map(metric => (
              <div
                key={metric.label}
                className='p-5 sm:p-6 text-center flex flex-col items-center gap-2'
              >
                <metric.icon className='w-6 h-6 text-orange-500' />
                <p className='text-xl font-bold text-gray-900'>{metric.value}</p>
                <p className='text-xs text-gray-500 uppercase tracking-wide'>{metric.label}</p>
              </div>
            ))}
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 sm:p-8'>
            {benefits.map(benefit => (
              <div
                key={benefit.title}
                className='rounded-2xl border border-orange-50 bg-orange-50/40 p-4 sm:p-5 flex items-start gap-3'
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${benefit.accent}`}>
                  <benefit.icon className='w-5 h-5' />
                </div>
                <div>
                  <h3 className='text-base font-semibold text-gray-900'>{benefit.title}</h3>
                  <p className='text-sm text-gray-600'>{benefit.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TrustSection
