/**
 * Panel lateral que muestra métricas detalladas de un elemento
 * Se abre al hacer click en un ElementBadge
 */

'use client'

import React from 'react'
import { motion, AnimatePresence } from '@/lib/framer-motion-lazy'
import { X, MousePointer, Eye, Scroll, Target, Users, TrendingUp, Clock } from '@/lib/optimized-imports'

interface ElementDetailsPanelProps {
  element: {
    elementSelector: string
    elementPosition: { x: number; y: number }
    elementDimensions: { width: number; height: number }
    interactions: {
      clicks: number
      hovers: number
      scrolls: number
      conversions: number
    }
    metrics: {
      totalInteractions: number
      uniqueUsers: number
      averageHoverTime: number
      conversionRate: number
      clickThroughRate: number
    }
    deviceBreakdown: {
      mobile: { interactions: number; users: number }
      desktop: { interactions: number; users: number }
    }
  } | null
  onClose: () => void
}

export const ElementDetailsPanel: React.FC<ElementDetailsPanelProps> = ({ element, onClose }) => {
  if (!element) return null

  const { interactions, metrics, deviceBreakdown } = element

  return (
    <AnimatePresence>
      {element && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 bg-black bg-opacity-50 z-40'
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className='fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto'
          >
            <div className='p-6'>
              {/* Header */}
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-lg font-semibold text-gray-900'>Detalles del Elemento</h3>
                <button
                  onClick={onClose}
                  className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                >
                  <X className='w-5 h-5 text-gray-500' />
                </button>
              </div>

              {/* Selector */}
              <div className='mb-6'>
                <label className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block'>
                  Selector
                </label>
                <code className='block p-3 bg-gray-50 rounded-lg text-xs text-gray-800 break-all'>
                  {element.elementSelector}
                </code>
              </div>

              {/* Métricas principales */}
              <div className='grid grid-cols-2 gap-4 mb-6'>
                <div className='bg-blue-50 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-1'>
                    <MousePointer className='w-4 h-4 text-blue-600' />
                    <span className='text-xs text-gray-600'>Clicks</span>
                  </div>
                  <p className='text-2xl font-bold text-blue-600'>{interactions.clicks}</p>
                </div>
                <div className='bg-purple-50 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Eye className='w-4 h-4 text-purple-600' />
                    <span className='text-xs text-gray-600'>Hovers</span>
                  </div>
                  <p className='text-2xl font-bold text-purple-600'>{interactions.hovers}</p>
                </div>
                <div className='bg-green-50 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Users className='w-4 h-4 text-green-600' />
                    <span className='text-xs text-gray-600'>Usuarios</span>
                  </div>
                  <p className='text-2xl font-bold text-green-600'>{metrics.uniqueUsers}</p>
                </div>
                <div className='bg-yellow-50 rounded-lg p-4'>
                  <div className='flex items-center gap-2 mb-1'>
                    <Target className='w-4 h-4 text-yellow-600' />
                    <span className='text-xs text-gray-600'>Conversión</span>
                  </div>
                  <p className='text-2xl font-bold text-yellow-600'>
                    {metrics.conversionRate.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Breakdown por dispositivo */}
              <div className='mb-6'>
                <h4 className='text-sm font-semibold text-gray-900 mb-3'>Por Dispositivo</h4>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                      <span className='text-sm text-gray-700'>Desktop</span>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-semibold text-gray-900'>
                        {deviceBreakdown.desktop.interactions}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {deviceBreakdown.desktop.users} usuarios
                      </p>
                    </div>
                  </div>
                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                      <span className='text-sm text-gray-700'>Mobile</span>
                    </div>
                    <div className='text-right'>
                      <p className='text-sm font-semibold text-gray-900'>
                        {deviceBreakdown.mobile.interactions}
                      </p>
                      <p className='text-xs text-gray-500'>{deviceBreakdown.mobile.users} usuarios</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas adicionales */}
              <div className='space-y-3'>
                <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div className='flex items-center gap-2'>
                    <TrendingUp className='w-4 h-4 text-gray-500' />
                    <span className='text-sm text-gray-700'>Tasa de Click</span>
                  </div>
                  <span className='text-sm font-semibold text-gray-900'>
                    {metrics.clickThroughRate.toFixed(1)}%
                  </span>
                </div>
                {metrics.averageHoverTime > 0 && (
                  <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                    <div className='flex items-center gap-2'>
                      <Clock className='w-4 h-4 text-gray-500' />
                      <span className='text-sm text-gray-700'>Tiempo promedio hover</span>
                    </div>
                    <span className='text-sm font-semibold text-gray-900'>
                      {metrics.averageHoverTime.toFixed(1)}s
                    </span>
                  </div>
                )}
                <div className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'>
                  <div className='flex items-center gap-2'>
                    <Scroll className='w-4 h-4 text-gray-500' />
                    <span className='text-sm text-gray-700'>Total interacciones</span>
                  </div>
                  <span className='text-sm font-semibold text-gray-900'>
                    {metrics.totalInteractions}
                  </span>
                </div>
              </div>

              {/* Posición y dimensiones */}
              <div className='mt-6 pt-6 border-t border-gray-200'>
                <h4 className='text-sm font-semibold text-gray-900 mb-3'>Posición y Dimensiones</h4>
                <div className='grid grid-cols-2 gap-2 text-xs'>
                  <div>
                    <span className='text-gray-500'>X:</span>
                    <span className='ml-2 font-medium text-gray-900'>{element.elementPosition.x}px</span>
                  </div>
                  <div>
                    <span className='text-gray-500'>Y:</span>
                    <span className='ml-2 font-medium text-gray-900'>{element.elementPosition.y}px</span>
                  </div>
                  <div>
                    <span className='text-gray-500'>Ancho:</span>
                    <span className='ml-2 font-medium text-gray-900'>
                      {element.elementDimensions.width}px
                    </span>
                  </div>
                  <div>
                    <span className='text-gray-500'>Alto:</span>
                    <span className='ml-2 font-medium text-gray-900'>
                      {element.elementDimensions.height}px
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ElementDetailsPanel
