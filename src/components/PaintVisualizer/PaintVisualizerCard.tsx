'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Paintbrush, Sparkles } from '@/lib/optimized-imports'
import { cn } from '@/lib/utils'
import { PaintVisualizer } from './PaintVisualizer'
import type { PaintVisualizerCardProps } from './types'

export function PaintVisualizerCard({ className }: PaintVisualizerCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <>
      <div
        className={cn(
          'relative rounded-xl bg-white shadow-md flex flex-col w-full cursor-pointer',
          'h-[300px] sm:h-[360px]',
          'md:h-[450px] lg:h-[500px]',
          'md:rounded-2xl',
          'transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-xl',
          'transform-gpu will-change-transform',
          className
        )}
        style={{
          transformOrigin: 'center',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
          boxShadow: isHovered ? '0 10px 25px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsModalOpen(true)}
      >
        {/* Sección superior - Imagen de fondo */}
        <div className='relative w-full h-[140px] sm:h-[160px] md:h-[200px] rounded-t-xl md:rounded-t-2xl overflow-hidden'>
          {/* Gradiente de fondo */}
          <div className='absolute inset-0 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500'>
            <div className='absolute inset-0 flex items-center justify-center'>
              <Paintbrush className='w-20 h-20 text-white/30' />
            </div>
          </div>
          
          {/* Overlay sutil */}
          <div className='absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent' />
          
          {/* Badge AR en esquina superior */}
          <div className='absolute top-2 right-2 md:top-3 md:right-3 z-10 flex items-center gap-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 md:px-3 md:py-1.5 rounded-full text-[10px] md:text-xs font-medium shadow-md'>
            <Sparkles className='w-3 h-3' />
            <span>AR</span>
          </div>
        </div>

        {/* Sección inferior - Contenido */}
        <div className='flex flex-col flex-1 p-3 sm:p-4 md:p-5 justify-between'>
          {/* Texto principal */}
          <div className='space-y-1.5 md:space-y-2 text-left'>
            <h3 className='text-sm sm:text-base md:text-lg font-bold text-gray-900 leading-tight'>
              ¡Pruébalo antes de pintar!
            </h3>
            <p className='text-xs md:text-sm text-gray-600 leading-relaxed'>
              Visualiza tu color ideal con AR en tiempo real. Mira cómo quedará tu pared al instante.
            </p>
          </div>

          {/* Botón CTA */}
          <div className='mt-auto pt-4 md:pt-5'>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                setIsModalOpen(true)
              }}
              className='w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 group h-10 md:h-11 px-4 md:px-6'
            >
              <Paintbrush className='w-5 h-5 md:w-6 md:h-6 mr-2 transition-transform duration-200 group-hover:scale-110' />
              <span className='text-sm md:text-base font-semibold'>
                Probar PinteYa ColorMate
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Modal del visualizador */}
      <PaintVisualizer isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  )
}

