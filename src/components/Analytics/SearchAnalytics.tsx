/**
 * Componente de Analytics de Búsquedas
 * Muestra términos más buscados, búsquedas sin resultados y tasa de conversión
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from '@/lib/framer-motion-lazy'
import { Search, TrendingUp, AlertCircle, Target } from '@/lib/optimized-imports'

interface SearchAnalyticsProps {
  startDate: string
  endDate: string
}

interface SearchQuery {
  query: string
  count: number
  conversionRate: number
}

const SearchAnalyticsComponent: React.FC<SearchAnalyticsProps> = ({ startDate, endDate }) => {
  const [topQueries, setTopQueries] = useState<SearchQuery[]>([])
  const [noResults, setNoResults] = useState<Array<{ query: string; count: number }>>([])
  const [conversionRate, setConversionRate] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSearchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate])

  const fetchSearchData = async () => {
    try {
      setLoading(true)
      // Usar el endpoint de métricas avanzadas que incluye search analytics
      const response = await fetch(
        `/api/analytics/metrics?startDate=${startDate}&endDate=${endDate}&advanced=true`
      )
      const data = await response.json()
      
      if (data.search) {
        setTopQueries(data.search.topQueries || [])
        setNoResults(data.search.noResults || [])
        setConversionRate(data.search.conversionRate || 0)
      }
    } catch (error) {
      console.error('Error fetching search analytics:', error)
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
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-12 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Resumen */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
      >
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
            <Search className='w-5 h-5' />
            Análisis de Búsquedas
          </h3>
          <div className='text-right'>
            <p className='text-sm text-gray-600'>Tasa de conversión</p>
            <p className='text-2xl font-bold text-green-600'>{conversionRate.toFixed(2)}%</p>
          </div>
        </div>
      </motion.div>

      {/* Términos más buscados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
      >
        <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
          <TrendingUp className='w-5 h-5' />
          Términos Más Buscados
        </h3>
        <div className='space-y-3'>
          {topQueries.length > 0 ? (
            topQueries.map((query, index) => (
              <div
                key={query.query}
                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
              >
                <div className='flex items-center gap-3 flex-1'>
                  <span className='w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium'>
                    {index + 1}
                  </span>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>{query.query}</p>
                    <p className='text-xs text-gray-500'>{query.count} búsquedas</p>
                  </div>
                </div>
                <div className='flex items-center gap-4'>
                  {query.conversionRate > 0 && (
                    <div className='text-right'>
                      <p className='text-sm font-semibold text-green-600 flex items-center gap-1'>
                        <Target className='w-4 h-4' />
                        {query.conversionRate.toFixed(1)}%
                      </p>
                      <p className='text-xs text-gray-500'>conversión</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className='text-sm text-gray-500 text-center py-4'>No hay datos de búsquedas disponibles</p>
          )}
        </div>
      </motion.div>

      {/* Búsquedas sin resultados */}
      {noResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
        >
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <AlertCircle className='w-5 h-5 text-orange-500' />
            Búsquedas Sin Resultados
          </h3>
          <div className='space-y-2'>
            {noResults.map((item, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-2 bg-orange-50 rounded-lg'
              >
                <span className='text-sm text-gray-700'>{item.query}</span>
                <span className='text-xs font-medium text-orange-600'>{item.count} veces</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

SearchAnalyticsComponent.displayName = 'SearchAnalytics'

export const SearchAnalytics = React.memo(SearchAnalyticsComponent)
export default SearchAnalytics
