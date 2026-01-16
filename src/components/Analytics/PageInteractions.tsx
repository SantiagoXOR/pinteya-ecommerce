/**
 * Componente que muestra interacciones detalladas por página
 * Incluye clicks, hovers, scrolls y tiempo promedio
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from '@/lib/framer-motion-lazy'
import { MousePointer, Eye, Scroll, Clock, TrendingUp } from '@/lib/optimized-imports'

interface PageInteractionsProps {
  startDate: string
  endDate: string
}

interface PageInteraction {
  page: string
  clicks: number
  hovers: number
  scrolls: number
  averageTime: number
}

const PageInteractionsComponent: React.FC<PageInteractionsProps> = ({ startDate, endDate }) => {
  const [pageInteractions, setPageInteractions] = useState<PageInteraction[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'total' | 'clicks' | 'time'>('total')

  const fetchPageInteractions = React.useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/analytics/metrics?startDate=${startDate}&endDate=${endDate}&advanced=true`
      )
      const data = await response.json()
      
      if (data.interactions?.pageInteractions) {
        let sorted = [...data.interactions.pageInteractions]
        
        // Ordenar según criterio seleccionado
        if (sortBy === 'clicks') {
          sorted.sort((a, b) => b.clicks - a.clicks)
        } else if (sortBy === 'time') {
          sorted.sort((a, b) => b.averageTime - a.averageTime)
        } else {
          sorted.sort((a, b) => (b.clicks + b.hovers + b.scrolls) - (a.clicks + a.hovers + a.scrolls))
        }
        
        setPageInteractions(sorted.slice(0, 20))
      }
    } catch (error) {
      console.error('Error fetching page interactions:', error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, sortBy])

  useEffect(() => {
    fetchPageInteractions()
  }, [fetchPageInteractions])

  if (loading) {
    return (
      <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
        <div className='animate-pulse space-y-4'>
          <div className='h-6 bg-gray-200 rounded w-1/4'></div>
          <div className='space-y-2'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-16 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
    >
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold text-gray-900'>Interacciones por Página</h3>
        <div className='flex gap-2'>
          <button
            onClick={() => setSortBy('total')}
            className={`px-3 py-1 rounded text-xs ${
              sortBy === 'total'
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Total
          </button>
          <button
            onClick={() => setSortBy('clicks')}
            className={`px-3 py-1 rounded text-xs ${
              sortBy === 'clicks'
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Clicks
          </button>
          <button
            onClick={() => setSortBy('time')}
            className={`px-3 py-1 rounded text-xs ${
              sortBy === 'time'
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tiempo
          </button>
        </div>
      </div>

      <div className='space-y-3'>
        {pageInteractions.length > 0 ? (
          pageInteractions.map((page, index) => {
            const totalInteractions = page.clicks + page.hovers + page.scrolls
            return (
              <div
                key={page.page}
                className='flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
              >
                <div className='flex items-center gap-4 flex-1 min-w-0'>
                  <span className='w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0'>
                    {index + 1}
                  </span>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>{page.page || '/'}</p>
                    <div className='flex items-center gap-4 mt-1'>
                      <div className='flex items-center gap-1 text-xs text-gray-600'>
                        <MousePointer className='w-3 h-3' />
                        <span>{page.clicks}</span>
                      </div>
                      <div className='flex items-center gap-1 text-xs text-gray-600'>
                        <Eye className='w-3 h-3' />
                        <span>{page.hovers}</span>
                      </div>
                      <div className='flex items-center gap-1 text-xs text-gray-600'>
                        <Scroll className='w-3 h-3' />
                        <span>{page.scrolls}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-6'>
                  <div className='text-right'>
                    <p className='text-sm font-semibold text-gray-900'>{totalInteractions}</p>
                    <p className='text-xs text-gray-500'>total</p>
                  </div>
                  {page.averageTime > 0 && (
                    <div className='text-right flex items-center gap-1'>
                      <Clock className='w-4 h-4 text-gray-400' />
                      <div>
                        <p className='text-sm font-semibold text-gray-900'>
                          {Math.round(page.averageTime)}s
                        </p>
                        <p className='text-xs text-gray-500'>promedio</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        ) : (
          <p className='text-sm text-gray-500 text-center py-4'>No hay datos de interacciones disponibles</p>
        )}
      </div>
    </motion.div>
  )
}

PageInteractionsComponent.displayName = 'PageInteractions'

export const PageInteractions = React.memo(PageInteractionsComponent)
export default PageInteractions
