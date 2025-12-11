'use client'
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Gift, Palette, Trophy, Sparkles, Clock, Star } from '@/lib/optimized-imports'

const PinteyaRaffle = () => {
  const [days, setDays] = useState(0)
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)

  // Fecha del sorteo - 15 días desde hoy
  const deadline = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toDateString()

  useEffect(() => {
    const getTime = () => {
      const time = Date.parse(deadline) - Date.now()

      if (time > 0) {
        setDays(Math.floor(time / (1000 * 60 * 60 * 24)))
        setHours(Math.floor((time / (1000 * 60 * 60)) % 24))
        setMinutes(Math.floor((time / 1000 / 60) % 60))
        setSeconds(Math.floor((time / 1000) % 60))
      } else {
        setDays(0)
        setHours(0)
        setMinutes(0)
        setSeconds(0)
      }
    }

    const interval = setInterval(() => getTime(), 1000)
    getTime() // Llamada inicial

    return () => clearInterval(interval)
  }, [deadline])

  return (
    <section className='overflow-hidden py-4 sm:py-6 lg:py-8'>
      <div className='max-w-[1170px] w-full mx-auto px-4 sm:px-8 xl:px-0'>
        <Card className='relative overflow-hidden bg-gradient-to-br from-blaze-orange-50 via-bright-sun-50 to-fun-green-50 border-2 border-blaze-orange-200 shadow-2xl hover:shadow-3xl transition-all duration-500'>
          <CardContent className='p-4 lg:p-6 xl:p-8'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center'>
              <div className='w-full relative z-10 order-1 lg:order-1'>
                <div className='flex items-center gap-2 mb-3'>
                  <Badge
                    variant='default'
                    className='bg-blaze-orange-500 text-white font-bold text-sm px-4 py-2 rounded-full shadow-lg'
                  >
                    <Gift className='w-4 h-4 mr-2' />
                    ¡GRAN SORTEO!
                  </Badge>
                  <Badge
                    variant='secondary'
                    className='bg-fun-green-500 text-white font-bold text-sm px-4 py-2 rounded-full shadow-lg animate-pulse'
                  >
                    <Sparkles className='w-4 h-4 mr-2' />
                    GRATIS
                  </Badge>
                </div>

                <h2 className='font-bold text-xl lg:text-3xl xl:text-4xl text-blaze-orange-800 mb-3 leading-tight'>
                  Ganá un Kit Completo de Pinturería
                </h2>

                <p className='text-sm lg:text-base text-blaze-orange-700 mb-4 leading-relaxed'>
                  Participá por un kit valorado en{' '}
                  <span className='font-bold text-blaze-orange-600'>$150.000</span> con productos
                  premium de las mejores marcas: Plavicon, Petrilac, Sinteplast y más.
                </p>

                {/* Kit de productos incluidos */}
                <div className='grid grid-cols-2 lg:grid-cols-4 gap-2 mb-5'>
                  <div className='flex items-center gap-1.5 bg-white/80 rounded-lg p-2 shadow-sm'>
                    <Palette className='w-4 h-4 text-blaze-orange-500' />
                    <span className='text-xs font-medium text-blaze-orange-700'>Látex Premium</span>
                  </div>
                  <div className='flex items-center gap-1.5 bg-white/80 rounded-lg p-2 shadow-sm'>
                    <Palette className='w-4 h-4 text-fun-green-500' />
                    <span className='text-xs font-medium text-blaze-orange-700'>Esmaltes</span>
                  </div>
                  <div className='flex items-center gap-1.5 bg-white/80 rounded-lg p-2 shadow-sm'>
                    <Palette className='w-4 h-4 text-bright-sun-500' />
                    <span className='text-xs font-medium text-blaze-orange-700'>Herramientas</span>
                  </div>
                  <div className='flex items-center gap-1.5 bg-white/80 rounded-lg p-2 shadow-sm'>
                    <Trophy className='w-4 h-4 text-blaze-orange-500' />
                    <span className='text-xs font-medium text-blaze-orange-700'>Accesorios</span>
                  </div>
                </div>

                {/* Contador regresivo */}
                <div className='mb-5'>
                  <div className='flex items-center gap-2 mb-3'>
                    <Clock className='w-4 h-4 text-blaze-orange-600' />
                    <span className='font-semibold text-sm text-blaze-orange-800'>
                      Tiempo restante para participar:
                    </span>
                  </div>

                  <div className='flex flex-wrap gap-3 lg:gap-4'>
                    {/* Días */}
                    <div className='text-center'>
                      <div className='bg-white rounded-lg shadow-lg border-2 border-blaze-orange-200 p-2 min-w-[60px] lg:min-w-[70px]'>
                        <span className='block text-lg lg:text-2xl font-bold text-blaze-orange-600'>
                          {days < 10 ? '0' + days : days}
                        </span>
                      </div>
                      <span className='block text-xs font-medium text-blaze-orange-700 mt-1'>
                        Días
                      </span>
                    </div>

                    {/* Horas */}
                    <div className='text-center'>
                      <div className='bg-white rounded-lg shadow-lg border-2 border-blaze-orange-200 p-2 min-w-[60px] lg:min-w-[70px]'>
                        <span className='block text-lg lg:text-2xl font-bold text-blaze-orange-600'>
                          {hours < 10 ? '0' + hours : hours}
                        </span>
                      </div>
                      <span className='block text-xs font-medium text-blaze-orange-700 mt-1'>
                        Horas
                      </span>
                    </div>

                    {/* Minutos */}
                    <div className='text-center'>
                      <div className='bg-white rounded-lg shadow-lg border-2 border-blaze-orange-200 p-2 min-w-[60px] lg:min-w-[70px]'>
                        <span className='block text-lg lg:text-2xl font-bold text-blaze-orange-600'>
                          {minutes < 10 ? '0' + minutes : minutes}
                        </span>
                      </div>
                      <span className='block text-xs font-medium text-blaze-orange-700 mt-1'>
                        Minutos
                      </span>
                    </div>

                    {/* Segundos */}
                    <div className='text-center'>
                      <div className='bg-white rounded-lg shadow-lg border-2 border-blaze-orange-200 p-2 min-w-[60px] lg:min-w-[70px]'>
                        <span className='block text-lg lg:text-2xl font-bold text-blaze-orange-600 animate-pulse'>
                          {seconds < 10 ? '0' + seconds : seconds}
                        </span>
                      </div>
                      <span className='block text-xs font-medium text-blaze-orange-700 mt-1'>
                        Segundos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón de participación */}
                <Button
                  size='lg'
                  className='bg-bright-sun-400 hover:bg-bright-sun-500 text-blaze-orange-800 font-bold text-base px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105'
                >
                  <Gift className='w-4 h-4 mr-2' />
                  ¡Participar Ahora!
                </Button>

                <p className='text-xs text-blaze-orange-600 mt-2'>
                  * Solo necesitás seguirnos en redes sociales. Sin compra mínima.
                </p>
              </div>

              {/* Imagen de productos */}
              <div className='relative w-full max-w-[400px] mx-auto lg:mx-0 order-2 lg:order-2'>
                <div className='relative'>
                  {/* Imagen principal del kit */}
                  <div className='relative bg-white/20 rounded-2xl p-6 backdrop-blur-sm border border-white/30'>
                    <Image
                      src='/images/promo/promo-04.png'
                      alt='Kit de Pinturería Pinteya'
                      width={300}
                      height={300}
                      className='w-full h-auto object-contain rounded-lg'
                    />

                    {/* Badge de valor */}
                    <div className='absolute -top-3 -right-3 bg-fun-green-500 text-white font-bold px-4 py-2 rounded-full shadow-lg'>
                      $150.000
                    </div>
                  </div>

                  {/* Efectos decorativos */}
                  <div className='absolute top-1/2 -left-8 w-4 h-4 bg-bright-sun-400 rounded-full animate-bounce'></div>
                  <div className='absolute top-1/4 -right-6 w-3 h-3 bg-fun-green-400 rounded-full animate-pulse'></div>
                  <div className='absolute bottom-1/4 -left-6 w-2 h-2 bg-blaze-orange-400 rounded-full animate-ping'></div>
                </div>
              </div>
            </div>

            {/* Términos y condiciones */}
            <div className='mt-5 pt-4 border-t border-blaze-orange-200'>
              <div className='flex items-center gap-2 mb-2'>
                <Star className='w-4 h-4 text-bright-sun-500' />
                <span className='font-semibold text-sm text-blaze-orange-800'>
                  Cómo participar:
                </span>
              </div>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blaze-orange-700'>
                <div className='flex items-center gap-2'>
                  <span className='bg-blaze-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'>
                    1
                  </span>
                  <span>Seguinos en Instagram @pinteya</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='bg-blaze-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'>
                    2
                  </span>
                  <span>Compartí esta publicación en tu historia</span>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='bg-blaze-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold'>
                    3
                  </span>
                  <span>Etiquetá a 3 amigos en los comentarios</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export default PinteyaRaffle
