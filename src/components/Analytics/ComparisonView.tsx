/**
 * Componente para comparar métricas entre diferentes fuentes de datos
 * Compara datos propios vs Google Analytics vs Meta
 */

'use client'

import React from 'react'
import { AnalyticsComparison, ComparisonMetrics } from '@/types/analytics'
import AnalyticsSourceIndicator from './AnalyticsSourceIndicator'
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion } from 'framer-motion'

interface ComparisonViewProps {
  comparison: AnalyticsComparison
  className?: string
}

const ComparisonView: React.FC<ComparisonViewProps> = ({ comparison, className = '' }) => {
  const sources = [
    { key: 'own' as const, label: 'Datos Propios', data: comparison.own },
    { key: 'google' as const, label: 'Google Analytics', data: comparison.google },
    { key: 'meta' as const, label: 'Meta Pixel', data: comparison.meta },
  ].filter(source => source.data)

  const calculateChange = (own: number, other?: number): number | null => {
    if (!other || other === 0) return null
    if (own === 0) return other > 0 ? 100 : 0
    return ((other - own) / own) * 100
  }

  const formatChange = (change: number | null): { value: string; icon: React.ReactNode; color: string } => {
    if (change === null) {
      return { value: 'N/A', icon: <Minus className='w-4 h-4' />, color: 'text-gray-500' }
    }
    if (change > 0) {
      return {
        value: `+${change.toFixed(1)}%`,
        icon: <TrendingUp className='w-4 h-4' />,
        color: 'text-green-600',
      }
    }
    if (change < 0) {
      return {
        value: `${change.toFixed(1)}%`,
        icon: <TrendingDown className='w-4 h-4' />,
        color: 'text-red-600',
      }
    }
    return { value: '0%', icon: <Minus className='w-4 h-4' />, color: 'text-gray-500' }
  }

  const metricsToCompare = [
    { key: 'sessions' as const, label: 'Sesiones', own: comparison.own.sessions },
    { key: 'users' as const, label: 'Usuarios', own: comparison.own.users },
    { key: 'cartAdditions' as const, label: 'Agregados al Carrito', own: comparison.own.cartAdditions },
    { key: 'checkoutStarts' as const, label: 'Checkouts Iniciados', own: comparison.own.checkoutStarts },
    { key: 'conversions' as const, label: 'Conversiones', own: comparison.own.conversions },
    { key: 'revenue' as const, label: 'Ingresos', own: comparison.own.revenue },
  ]

  return (
    <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
      <div className='mb-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2'>
          <BarChart3 className='w-5 h-5' />
          Comparación de Fuentes
        </h3>
        <p className='text-sm text-gray-600'>
          Comparación de métricas entre diferentes fuentes de datos de analytics
        </p>
      </div>

      {/* Indicadores de fuentes */}
      <div className='flex flex-wrap gap-2 mb-6'>
        {sources.map(source => (
          <AnalyticsSourceIndicator
            key={source.key}
            source={{
              name: source.key,
              label: source.label,
              available: !!source.data,
              lastUpdated: source.data?.source?.lastUpdated,
            }}
          />
        ))}
      </div>

      {/* Tabla de comparación */}
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead>
            <tr className='border-b border-gray-200'>
              <th className='text-left py-3 px-4 text-sm font-semibold text-gray-900'>Métrica</th>
              {sources.map(source => (
                <th key={source.key} className='text-right py-3 px-4 text-sm font-semibold text-gray-900'>
                  {source.label}
                </th>
              ))}
              {comparison.google && (
                <th className='text-right py-3 px-4 text-sm font-semibold text-gray-900'>
                  Diferencia GA
                </th>
              )}
              {comparison.meta && (
                <th className='text-right py-3 px-4 text-sm font-semibold text-gray-900'>
                  Diferencia Meta
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {metricsToCompare.map((metric, index) => {
              const ownValue = metric.own || 0
              const googleValue = comparison.google?.[metric.key] || 0
              const metaValue = comparison.meta?.[metric.key] || 0

              const googleChange = calculateChange(ownValue, googleValue)
              const metaChange = calculateChange(ownValue, metaValue)

              const googleChangeFormatted = formatChange(googleChange)
              const metaChangeFormatted = formatChange(metaChange)

              return (
                <motion.tr
                  key={metric.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className='border-b border-gray-100 hover:bg-gray-50'
                >
                  <td className='py-3 px-4 text-sm text-gray-900'>{metric.label}</td>
                  {sources.map(source => {
                    const value = source.data?.[metric.key] || 0
                    return (
                      <td key={source.key} className='text-right py-3 px-4 text-sm font-medium text-gray-700'>
                        {typeof value === 'number' ? value.toLocaleString() : value || 'N/A'}
                      </td>
                    )
                  })}
                  {comparison.google && (
                    <td className='text-right py-3 px-4'>
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${googleChangeFormatted.color}`}>
                        {googleChangeFormatted.icon}
                        {googleChangeFormatted.value}
                      </span>
                    </td>
                  )}
                  {comparison.meta && (
                    <td className='text-right py-3 px-4'>
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${metaChangeFormatted.color}`}>
                        {metaChangeFormatted.icon}
                        {metaChangeFormatted.value}
                      </span>
                    </td>
                  )}
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Notas */}
      <div className='mt-6 pt-4 border-t border-gray-200'>
        <p className='text-xs text-gray-500'>
          <strong>Nota:</strong> Las diferencias se calculan comparando cada fuente con los datos
          propios. Los valores pueden variar debido a diferencias en metodología de tracking,
          timing, y definiciones de eventos entre plataformas.
        </p>
      </div>
    </div>
  )
}

export default ComparisonView


