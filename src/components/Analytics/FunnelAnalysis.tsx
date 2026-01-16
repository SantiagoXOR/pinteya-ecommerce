/**
 * Componente de Análisis de Embudo de Conversión
 * Muestra el embudo completo con tasas de conversión y puntos de abandono
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from '@/lib/framer-motion-lazy'
import { TrendingDown, Clock, Target, ArrowRight } from '@/lib/optimized-imports'

interface FunnelStep {
  step: string
  count: number
  conversionRate: number
  averageTime: number
  dropOffRate: number
}

interface FunnelAnalysisProps {
  startDate: string
  endDate: string
}

const stepLabels: Record<string, string> = {
  product_view: 'Vista de Producto',
  add_to_cart: 'Agregar al Carrito',
  begin_checkout: 'Iniciar Checkout',
  purchase: 'Compra Completada',
}

export const FunnelAnalysis: React.FC<FunnelAnalysisProps> = React.memo(({ startDate, endDate }) => {
  const [funnelData, setFunnelData] = useState<{
    steps: FunnelStep[]
    dropOffPoints: Array<{
      fromStep: string
      toStep: string
      dropOffCount: number
      dropOffRate: number
    }>
    totalConversionRate: number
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFunnelData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  const fetchFunnelData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/analytics/funnel?startDate=${startDate}&endDate=${endDate}`
      )
      const data = await response.json()
      setFunnelData(data)
    } catch (error) {
      console.error('Error fetching funnel data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
        <div className='animate-pulse space-y-4'>
          <div className='h-6 bg-gray-200 rounded w-1/4'></div>
          <div className='space-y-2'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='h-16 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!funnelData || funnelData.steps.length === 0) {
    return (
      <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
        <p className='text-sm text-gray-500 text-center py-4'>No hay datos de embudo disponibles</p>
      </div>
    )
  }

  const maxCount = Math.max(...funnelData.steps.map(s => s.count))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
    >
      <div className='flex items-center justify-between mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
          <Target className='w-5 h-5' />
          Análisis de Embudo de Conversión
        </h3>
        <div className='text-right'>
          <p className='text-sm text-gray-600'>Tasa de conversión total</p>
          <p className='text-2xl font-bold text-green-600'>
            {funnelData.totalConversionRate.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Visualización del embudo */}
      <div className='space-y-4 mb-6'>
        {funnelData.steps.map((step, index) => {
          const widthPercent = maxCount > 0 ? (step.count / maxCount) * 100 : 0
          const isLast = index === funnelData.steps.length - 1

          return (
            <div key={step.step} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='text-sm font-medium text-gray-700'>
                    {stepLabels[step.step] || step.step}
                  </span>
                  {!isLast && <ArrowRight className='w-4 h-4 text-gray-400' />}
                </div>
                <div className='flex items-center gap-4'>
                  <span className='text-sm font-semibold text-gray-900'>{step.count.toLocaleString()}</span>
                  {step.conversionRate > 0 && (
                    <span
                      className={`text-sm font-medium ${
                        step.conversionRate >= 50
                          ? 'text-green-600'
                          : step.conversionRate >= 25
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {step.conversionRate.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div className='relative w-full bg-gray-200 rounded-full h-8 overflow-hidden'>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPercent}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`h-full ${
                    step.conversionRate >= 50
                      ? 'bg-green-500'
                      : step.conversionRate >= 25
                        ? 'bg-yellow-400'
                        : 'bg-red-500'
                  }`}
                ></motion.div>
                <div className='absolute inset-0 flex items-center justify-center'>
                  <span className='text-xs font-medium text-gray-900'>
                    {step.count.toLocaleString()} usuarios
                  </span>
                </div>
              </div>
              {step.averageTime > 0 && (
                <div className='flex items-center gap-2 text-xs text-gray-500'>
                  <Clock className='w-3 h-3' />
                  <span>Tiempo promedio: {Math.round(step.averageTime)}s</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Puntos de abandono */}
      {funnelData.dropOffPoints.length > 0 && (
        <div className='mt-6 pt-6 border-t border-gray-200'>
          <h4 className='text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2'>
            <TrendingDown className='w-4 h-4' />
            Puntos de Abandono
          </h4>
          <div className='space-y-2'>
            {funnelData.dropOffPoints.map((dropOff, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 bg-red-50 rounded-lg'
              >
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-gray-700'>
                    {stepLabels[dropOff.fromStep] || dropOff.fromStep} →{' '}
                    {stepLabels[dropOff.toStep] || dropOff.toStep}
                  </span>
                </div>
                <div className='flex items-center gap-4'>
                  <span className='text-sm font-medium text-gray-900'>
                    {dropOff.dropOffCount.toLocaleString()} abandonos
                  </span>
                  <span className='text-sm font-semibold text-red-600'>
                    {dropOff.dropOffRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

FunnelAnalysis.displayName = 'FunnelAnalysis'

export default FunnelAnalysis
