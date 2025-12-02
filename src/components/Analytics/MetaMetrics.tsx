/**
 * Componente para mostrar métricas del Meta Pixel
 * Basado en eventos que ya se están trackeando y enviando al Pixel
 */

'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { getMetaEventsManagerUrl } from '@/lib/integrations/meta-pixel-analytics'
import { MetaPixelMetrics } from '@/types/analytics'
import { ShoppingCart, CreditCard, CheckCircle, Eye, Search, ExternalLink, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface MetaMetricsProps {
  pixelId?: string
  startDate?: string
  endDate?: string
  className?: string
}

const MetaMetrics: React.FC<MetaMetricsProps> = ({
  pixelId,
  startDate,
  endDate,
  className = '',
}) => {
  const [metrics, setMetrics] = useState<MetaPixelMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const metaPixelId = pixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID || ''

  // Memoizar las fechas para evitar recálculos innecesarios
  const memoizedStartDate = useMemo(() => {
    return startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }, [startDate])

  const memoizedEndDate = useMemo(() => {
    return endDate || new Date().toISOString()
  }, [endDate])

  useEffect(() => {
    // Cancelar solicitud anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const fetchMetrics = async () => {
      // Crear nuevo AbortController para esta solicitud
      const abortController = new AbortController()
      abortControllerRef.current = abortController

      try {
        setIsLoading(true)
        setError(null)

        const start = memoizedStartDate
        const end = memoizedEndDate

        // Llamar al endpoint API con señal de cancelación
        const response = await fetch(
          `/api/analytics/meta?startDate=${encodeURIComponent(start)}&endDate=${encodeURIComponent(end)}`,
          { signal: abortController.signal }
        )

        // Verificar si la solicitud fue cancelada
        if (abortController.signal.aborted) {
          return
        }

        if (!response.ok) {
          throw new Error('Error al obtener métricas de Meta Pixel')
        }

        const result = await response.json()
        if (result.success && result.metrics) {
          setMetrics(result.metrics)
        } else {
          throw new Error(result.error || 'Error al procesar métricas')
        }
      } catch (err) {
        // Ignorar errores de cancelación
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }
        console.error('Error fetching Meta Pixel metrics:', err)
        setError(err instanceof Error ? err.message : 'Error al cargar métricas de Meta')
      } finally {
        // Solo actualizar el estado si la solicitud no fue cancelada
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    if (metaPixelId) {
      fetchMetrics()
    } else {
      setError('Meta Pixel ID no configurado')
      setIsLoading(false)
    }

    // Cleanup: cancelar solicitud al desmontar o cambiar dependencias
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [metaPixelId, memoizedStartDate, memoizedEndDate])

  if (!metaPixelId) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <p className='text-yellow-800 text-sm'>Meta Pixel ID no configurado</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
            <p className='text-gray-600'>Cargando métricas de Meta Pixel...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Meta Pixel Analytics</h3>
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-sm text-red-800'>{error || 'No se pudieron cargar las métricas'}</p>
        </div>
      </div>
    )
  }

  const eventCards = [
    {
      title: 'Vistas de Contenido',
      value: metrics.viewContent,
      icon: Eye,
      color: 'bg-blue-500',
    },
    {
      title: 'Agregados al Carrito',
      value: metrics.addToCart,
      icon: ShoppingCart,
      color: 'bg-green-500',
    },
    {
      title: 'Checkouts Iniciados',
      value: metrics.initiateCheckout,
      icon: CreditCard,
      color: 'bg-yellow-500',
    },
    {
      title: 'Compras Completadas',
      value: metrics.purchase,
      icon: CheckCircle,
      color: 'bg-purple-500',
    },
    {
      title: 'Búsquedas',
      value: metrics.search,
      icon: Search,
      color: 'bg-teal-500',
    },
  ]

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className='mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2'>Meta Pixel Analytics</h3>
        <p className='text-sm text-gray-600'>
          Métricas basadas en eventos trackeados (Pixel ID: {metaPixelId})
        </p>
      </div>

      {/* Total de eventos */}
      <div className='mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600'>Total de Eventos Trackeados</p>
            <p className='text-3xl font-bold text-gray-900 mt-1'>{metrics.totalEvents}</p>
            <p className='text-xs text-gray-500 mt-1'>Últimos 7 días</p>
          </div>
          <TrendingUp className='w-12 h-12 text-blue-500' />
        </div>
      </div>

      {/* Cards de eventos */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6'>
        {eventCards.map((card, index) => {
          const Icon = card.icon
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className='bg-gray-50 rounded-lg p-4 border border-gray-200'
            >
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600'>{card.title}</p>
                  <p className='text-2xl font-bold text-gray-900 mt-1'>{card.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color}`}>
                  <Icon className='w-6 h-6 text-white' />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Gráfico de tendencias (simplificado) */}
      {metrics.eventsByDate.length > 0 && (
        <div className='mb-6'>
          <h4 className='text-sm font-semibold text-gray-900 mb-3'>Tendencias de Eventos</h4>
          <div className='space-y-2'>
            {metrics.eventsByDate.slice(-7).map((item, index) => (
              <div key={index} className='flex items-center gap-3'>
                <span className='text-xs text-gray-500 w-20'>
                  {new Date(item.date).toLocaleDateString('es-AR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                <div className='flex-1 bg-gray-200 rounded-full h-2 overflow-hidden'>
                  <div
                    className='bg-blue-500 h-full rounded-full transition-all'
                    style={{ width: `${(item.count / metrics.totalEvents) * 100}%` }}
                  ></div>
                </div>
                <span className='text-xs font-medium text-gray-700 w-12 text-right'>
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Link a Meta Events Manager */}
      <div className='pt-4 border-t border-gray-200'>
        <a
          href={getMetaEventsManagerUrl(metaPixelId)}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700'
        >
          <ExternalLink className='w-4 h-4' />
          Ver eventos completos en Meta Events Manager
        </a>
        <p className='text-xs text-gray-500 mt-2'>
          Nota: Estas métricas están basadas en eventos trackeados desde nuestro sistema. Para
          métricas completas incluyendo impresiones, clicks y conversiones de ads, consulta Meta
          Events Manager.
        </p>
      </div>
    </div>
  )
}

export default MetaMetrics

