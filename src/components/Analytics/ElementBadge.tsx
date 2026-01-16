/**
 * Componente Badge individual que muestra métricas sobre un elemento
 * Se posiciona sobre el elemento en el visualizador de rutas
 */

'use client'

import React from 'react'
import { motion } from '@/lib/framer-motion-lazy'
import { MousePointer, Eye, Scroll, Target, TrendingUp } from '@/lib/optimized-imports'

interface ElementBadgeProps {
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
      conversionRate: number
      clickThroughRate: number
    }
    deviceBreakdown: {
      mobile: { interactions: number; users: number }
      desktop: { interactions: number; users: number }
    }
  }
  position: { x: number; y: number }
  device: 'mobile' | 'desktop' | 'all'
  onClick: () => void
}

export const ElementBadge: React.FC<ElementBadgeProps> = ({ element, position, device, onClick }) => {
  const { interactions, metrics } = element

  // Determinar tipo de interacción más común
  const getPrimaryInteraction = () => {
    if (interactions.clicks > interactions.hovers && interactions.clicks > interactions.scrolls) {
      return { type: 'click', icon: MousePointer, color: 'bg-green-500' }
    }
    if (interactions.hovers > interactions.scrolls) {
      return { type: 'hover', icon: Eye, color: 'bg-blue-500' }
    }
    return { type: 'scroll', icon: Scroll, color: 'bg-yellow-500' }
  }

  const primaryInteraction = getPrimaryInteraction()
  const Icon = primaryInteraction.icon

  // Determinar color según métricas
  const getBadgeColor = () => {
    if (metrics.conversionRate > 10) return 'bg-green-500'
    if (metrics.conversionRate > 5) return 'bg-yellow-500'
    if (metrics.conversionRate > 0) return 'bg-orange-500'
    return 'bg-gray-500'
  }

  // Obtener métricas según dispositivo
  const getDeviceMetrics = () => {
    if (device === 'mobile') {
      return {
        interactions: element.deviceBreakdown.mobile.interactions,
        users: element.deviceBreakdown.mobile.users,
      }
    }
    if (device === 'desktop') {
      return {
        interactions: element.deviceBreakdown.desktop.interactions,
        users: element.deviceBreakdown.desktop.users,
      }
    }
    return {
      interactions: metrics.totalInteractions,
      users: metrics.uniqueUsers,
    }
  }

  const deviceMetrics = getDeviceMetrics()
  const interactionRate =
    deviceMetrics.users > 0 ? (deviceMetrics.interactions / deviceMetrics.users) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.1, zIndex: 50 }}
      className={`absolute ${getBadgeColor()} text-white rounded-lg shadow-lg cursor-pointer p-2 min-w-[120px]`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
        marginTop: '-8px',
      }}
      onClick={onClick}
    >
      <div className='flex items-center gap-2 mb-1'>
        <Icon className='w-4 h-4' />
        <span className='text-xs font-semibold'>
          {deviceMetrics.interactions.toLocaleString()}
        </span>
      </div>
      <div className='text-xs space-y-0.5'>
        <div className='flex items-center justify-between'>
          <span className='opacity-90'>Usuarios:</span>
          <span className='font-semibold'>{deviceMetrics.users}</span>
        </div>
        {metrics.conversionRate > 0 && (
          <div className='flex items-center justify-between'>
            <span className='opacity-90'>Conversión:</span>
            <span className='font-semibold flex items-center gap-1'>
              <Target className='w-3 h-3' />
              {metrics.conversionRate.toFixed(1)}%
            </span>
          </div>
        )}
        {interactionRate > 0 && (
          <div className='flex items-center justify-between'>
            <span className='opacity-90'>Tasa:</span>
            <span className='font-semibold flex items-center gap-1'>
              <TrendingUp className='w-3 h-3' />
              {interactionRate.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
      {/* Indicador de posición */}
      <div
        className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-${getBadgeColor().replace('bg-', '')}`}
      ></div>
    </motion.div>
  )
}

export default ElementBadge
