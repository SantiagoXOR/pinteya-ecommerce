/**
 * Componente para indicar la fuente de datos de analytics
 */

'use client'

import React from 'react'
import { AnalyticsSource } from '@/types/analytics'
import { CheckCircle, XCircle, Clock, Database, BarChart3, Facebook } from '@/lib/optimized-imports'

interface AnalyticsSourceIndicatorProps {
  source: AnalyticsSource
  className?: string
}

const AnalyticsSourceIndicator: React.FC<AnalyticsSourceIndicatorProps> = ({
  source,
  className = '',
}) => {
  const getIcon = () => {
    switch (source.name) {
      case 'own':
        return <Database className='w-4 h-4' />
      case 'google':
        return <BarChart3 className='w-4 h-4' />
      case 'meta':
        return <Facebook className='w-4 h-4' />
      default:
        return <Database className='w-4 h-4' />
    }
  }

  const getStatusIcon = () => {
    if (source.available) {
      return <CheckCircle className='w-4 h-4 text-green-500' />
    }
    return <XCircle className='w-4 h-4 text-gray-400' />
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
        source.available
          ? 'bg-green-50 border-green-200 text-green-800'
          : 'bg-gray-50 border-gray-200 text-gray-600'
      } ${className}`}
    >
      {getIcon()}
      <span className='text-sm font-medium'>{source.label}</span>
      {getStatusIcon()}
      {source.lastUpdated && (
        <span className='text-xs text-gray-500 flex items-center gap-1'>
          <Clock className='w-3 h-3' />
          {new Date(source.lastUpdated).toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      )}
    </div>
  )
}

export default AnalyticsSourceIndicator


