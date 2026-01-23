/**
 * Componente de Embudo de Conversión para Analytics
 * Visualiza el flujo de conversión desde vista de producto hasta compra
 */

'use client'

import React, { useState, useEffect } from 'react'
// ⚡ PERFORMANCE: Lazy load de Framer Motion para reducir bundle inicial
import { motion } from '@/lib/framer-motion-lazy'
import { Eye, ShoppingCart, CreditCard, CheckCircle, TrendingDown } from '@/lib/optimized-imports'

interface FunnelStep {
  name: string
  value: number
  icon: React.ReactNode
  color: string
  description: string
}

interface ConversionFunnelProps {
  data?: {
    productViews: number
    cartAdditions: number
    checkoutStarts: number
    checkoutCompletions: number
  }
  className?: string
}

const ConversionFunnel: React.FC<ConversionFunnelProps> = ({ data, className = '' }) => {
  const [animatedValues, setAnimatedValues] = useState({
    productViews: 0,
    cartAdditions: 0,
    checkoutStarts: 0,
    checkoutCompletions: 0,
  })

  useEffect(() => {
    if (!data) {
      return
    }

    // Animar los valores gradualmente
    const duration = 1500
    const steps = 60
    const interval = duration / steps

    let currentStep = 0
    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setAnimatedValues({
        productViews: Math.round(data.productViews * progress),
        cartAdditions: Math.round(data.cartAdditions * progress),
        checkoutStarts: Math.round(data.checkoutStarts * progress),
        checkoutCompletions: Math.round(data.checkoutCompletions * progress),
      })

      if (currentStep >= steps) {
        clearInterval(timer)
        setAnimatedValues(data)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [data])

  const steps: FunnelStep[] = [
    {
      name: 'Vistas de Producto',
      value: animatedValues.productViews,
      icon: <Eye className='w-6 h-6' />,
      color: 'bg-blue-500',
      description: 'Usuarios que vieron productos',
    },
    {
      name: 'Agregados al Carrito',
      value: animatedValues.cartAdditions,
      icon: <ShoppingCart className='w-6 h-6' />,
      color: 'bg-green-500',
      description: 'Productos agregados al carrito',
    },
    {
      name: 'Checkout Iniciado',
      value: animatedValues.checkoutStarts,
      icon: <CreditCard className='w-6 h-6' />,
      color: 'bg-yellow-500',
      description: 'Usuarios que iniciaron checkout',
    },
    {
      name: 'Compras Completadas',
      value: animatedValues.checkoutCompletions,
      icon: <CheckCircle className='w-6 h-6' />,
      color: 'bg-purple-500',
      description: 'Transacciones exitosas',
    },
  ]

  const calculateConversionRate = (current: number, previous: number): number => {
    return previous > 0 ? (current / previous) * 100 : 0
  }

  const calculateDropoffRate = (current: number, previous: number): number => {
    return previous > 0 ? ((previous - current) / previous) * 100 : 0
  }

  const maxValue = Math.max(...steps.map(step => step.value))

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className='mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Embudo de Conversión</h3>
        <p className='text-sm text-gray-600'>
          Análisis del flujo de conversión desde vista de producto hasta compra
        </p>
      </div>

      <div className='space-y-4'>
        {steps.map((step, index) => {
          const previousStep = index > 0 ? steps[index - 1] : null
          const conversionRate = previousStep
            ? calculateConversionRate(step.value, previousStep.value)
            : 100
          const dropoffRate = previousStep
            ? calculateDropoffRate(step.value, previousStep.value)
            : 0
          const widthPercentage = maxValue > 0 ? (step.value / maxValue) * 100 : 0

          return (
            <motion.div
              key={step.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className='relative'
            >
              {/* Línea de conexión */}
              {index > 0 && (
                <div className='absolute -top-2 left-1/2 transform -translate-x-1/2 w-px h-4 bg-gray-300'></div>
              )}

              <div className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'>
                {/* Icono */}
                <div className={`p-3 rounded-lg text-white ${step.color}`}>{step.icon}</div>

                {/* Contenido principal */}
                <div className='flex-1'>
                  <div className='flex items-center justify-between mb-2'>
                    <h4 className='font-medium text-gray-900'>{step.name}</h4>
                    <div className='text-right'>
                      <span className='text-lg font-bold text-gray-900'>
                        {step.value.toLocaleString()}
                      </span>
                      {previousStep && (
                        <div className='text-sm text-gray-600'>
                          {conversionRate.toFixed(1)}% conversión
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className='w-full bg-gray-200 rounded-full h-2 mb-2'>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPercentage}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-2 rounded-full ${step.color}`}
                    ></motion.div>
                  </div>

                  <p className='text-xs text-gray-600'>{step.description}</p>

                  {/* Indicador de abandono */}
                  {previousStep && dropoffRate > 0 && (
                    <div className='mt-2 flex items-center gap-1 text-xs text-red-600'>
                      <TrendingDown className='w-3 h-3' />
                      <span>{dropoffRate.toFixed(1)}% abandono</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Resumen de métricas */}
      <div className='mt-6 pt-6 border-t border-gray-200'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
          <div>
            <p className='text-sm text-gray-600'>Tasa de Conversión Global</p>
            <p className='text-lg font-bold text-purple-600'>
              {maxValue > 0
                ? ((animatedValues.checkoutCompletions / maxValue) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-600'>Producto → Carrito</p>
            <p className='text-lg font-bold text-green-600'>
              {calculateConversionRate(
                animatedValues.cartAdditions,
                animatedValues.productViews
              ).toFixed(1)}
              %
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-600'>Carrito → Checkout</p>
            <p className='text-lg font-bold text-yellow-600'>
              {calculateConversionRate(
                animatedValues.checkoutStarts,
                animatedValues.cartAdditions
              ).toFixed(1)}
              %
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-600'>Checkout → Compra</p>
            <p className='text-lg font-bold text-purple-600'>
              {calculateConversionRate(
                animatedValues.checkoutCompletions,
                animatedValues.checkoutStarts
              ).toFixed(1)}
              %
            </p>
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className='mt-6 p-4 bg-blue-50 rounded-lg'>
        <h4 className='font-medium text-blue-900 mb-2'>💡 Recomendaciones</h4>
        <ul className='text-sm text-blue-800 space-y-1'>
          {calculateConversionRate(animatedValues.cartAdditions, animatedValues.productViews) <
            5 && <li>• Mejorar la presentación de productos para aumentar agregados al carrito</li>}
          {calculateConversionRate(animatedValues.checkoutStarts, animatedValues.cartAdditions) <
            50 && <li>• Optimizar el proceso de carrito para reducir abandono</li>}
          {calculateConversionRate(
            animatedValues.checkoutCompletions,
            animatedValues.checkoutStarts
          ) < 70 && <li>• Simplificar el proceso de checkout para mejorar conversión</li>}
        </ul>
      </div>
    </div>
  )
}

export default ConversionFunnel
