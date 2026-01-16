/**
 * Componente de Analytics de Categorías
 * Muestra categorías de productos más visitadas con métricas detalladas
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from '@/lib/framer-motion-lazy'
import { Tag, Eye, ShoppingCart, DollarSign, TrendingUp, Users, Activity } from '@/lib/optimized-imports'

interface CategoryData {
  category: string
  totalEvents: number
  uniqueSessions: number
  uniqueUsers: number
  views: number
  cartAdditions: number
  purchases: number
  totalRevenue: number
  conversionRate: number
}

interface CategoryAnalyticsProps {
  startDate: string
  endDate: string
}

const CategoryAnalyticsComponent: React.FC<CategoryAnalyticsProps> = ({ startDate, endDate }) => {
  const [categories, setCategories] = useState<CategoryData[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'events' | 'revenue' | 'conversion'>('events')

  useEffect(() => {
    fetchCategoryData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, sortBy])

  const fetchCategoryData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/analytics/categories?startDate=${startDate}&endDate=${endDate}`
      )
      const data = await response.json()
      
      // Ordenar según el criterio seleccionado
      let sorted = [...data]
      if (sortBy === 'revenue') {
        sorted.sort((a, b) => b.totalRevenue - a.totalRevenue)
      } else if (sortBy === 'conversion') {
        sorted.sort((a, b) => b.conversionRate - a.conversionRate)
      } else {
        sorted.sort((a, b) => b.totalEvents - a.totalEvents)
      }
      
      setCategories(sorted)
    } catch (error) {
      console.error('Error fetching category analytics:', error)
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
              <div key={i} className='h-16 bg-gray-200 rounded'></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'>
        <p className='text-sm text-gray-500 text-center py-4'>
          No hay datos de categorías disponibles para el período seleccionado
        </p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Encabezado con filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
      >
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
            <Tag className='w-5 h-5' />
            Categorías Más Visitadas
          </h3>
          <div className='flex gap-2'>
            <button
              onClick={() => setSortBy('events')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'events'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Eventos
            </button>
            <button
              onClick={() => setSortBy('revenue')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'revenue'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setSortBy('conversion')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'conversion'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Conversión
            </button>
          </div>
        </div>

        {/* Tabla de categorías */}
        <div className='overflow-x-auto'>
          <table className='w-full'>
            <thead>
              <tr className='border-b border-gray-200'>
                <th className='text-left py-3 px-4 text-sm font-medium text-gray-700'>Categoría</th>
                <th className='text-right py-3 px-4 text-sm font-medium text-gray-700'>Eventos</th>
                <th className='text-right py-3 px-4 text-sm font-medium text-gray-700'>Vistas</th>
                <th className='text-right py-3 px-4 text-sm font-medium text-gray-700'>Carrito</th>
                <th className='text-right py-3 px-4 text-sm font-medium text-gray-700'>Compras</th>
                <th className='text-right py-3 px-4 text-sm font-medium text-gray-700'>Revenue</th>
                <th className='text-right py-3 px-4 text-sm font-medium text-gray-700'>Conversión</th>
                <th className='text-right py-3 px-4 text-sm font-medium text-gray-700'>Sesiones</th>
                <th className='text-right py-3 px-4 text-sm font-medium text-gray-700'>Usuarios</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category, index) => (
                <motion.tr
                  key={category.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className='border-b border-gray-100 hover:bg-gray-50'
                >
                  <td className='py-3 px-4'>
                    <div className='flex items-center gap-2'>
                      <Tag className='w-4 h-4 text-gray-400' />
                      <span className='font-medium text-gray-900'>{category.category}</span>
                    </div>
                  </td>
                  <td className='text-right py-3 px-4'>
                    <div className='flex items-center justify-end gap-1'>
                      <Activity className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-900'>{category.totalEvents.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className='text-right py-3 px-4'>
                    <div className='flex items-center justify-end gap-1'>
                      <Eye className='w-4 h-4 text-blue-400' />
                      <span className='text-sm text-gray-900'>{category.views.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className='text-right py-3 px-4'>
                    <div className='flex items-center justify-end gap-1'>
                      <ShoppingCart className='w-4 h-4 text-green-400' />
                      <span className='text-sm text-gray-900'>{category.cartAdditions.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className='text-right py-3 px-4'>
                    <div className='flex items-center justify-end gap-1'>
                      <TrendingUp className='w-4 h-4 text-purple-400' />
                      <span className='text-sm text-gray-900'>{category.purchases.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className='text-right py-3 px-4'>
                    <div className='flex items-center justify-end gap-1'>
                      <DollarSign className='w-4 h-4 text-green-500' />
                      <span className='text-sm font-medium text-gray-900'>
                        ${category.totalRevenue.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </td>
                  <td className='text-right py-3 px-4'>
                    <span
                      className={`text-sm font-medium ${
                        category.conversionRate >= 10
                          ? 'text-green-600'
                          : category.conversionRate >= 5
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}
                    >
                      {category.conversionRate.toFixed(2)}%
                    </span>
                  </td>
                  <td className='text-right py-3 px-4'>
                    <div className='flex items-center justify-end gap-1'>
                      <Users className='w-4 h-4 text-gray-400' />
                      <span className='text-sm text-gray-900'>{category.uniqueSessions.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className='text-right py-3 px-4'>
                    <span className='text-sm text-gray-900'>{category.uniqueUsers.toLocaleString()}</span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Resumen estadístico */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className='grid grid-cols-1 md:grid-cols-4 gap-4'
      >
        <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'>
          <div className='flex items-center gap-2 mb-2'>
            <Tag className='w-5 h-5 text-blue-500' />
            <p className='text-sm text-gray-600'>Total Categorías</p>
          </div>
          <p className='text-2xl font-bold text-gray-900'>{categories.length}</p>
        </div>
        <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'>
          <div className='flex items-center gap-2 mb-2'>
            <Activity className='w-5 h-5 text-green-500' />
            <p className='text-sm text-gray-600'>Total Eventos</p>
          </div>
          <p className='text-2xl font-bold text-gray-900'>
            {categories.reduce((sum, c) => sum + c.totalEvents, 0).toLocaleString()}
          </p>
        </div>
        <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'>
          <div className='flex items-center gap-2 mb-2'>
            <DollarSign className='w-5 h-5 text-purple-500' />
            <p className='text-sm text-gray-600'>Revenue Total</p>
          </div>
          <p className='text-2xl font-bold text-gray-900'>
            ${categories.reduce((sum, c) => sum + c.totalRevenue, 0).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className='bg-white rounded-xl p-4 shadow-sm border border-gray-100'>
          <div className='flex items-center gap-2 mb-2'>
            <TrendingUp className='w-5 h-5 text-yellow-500' />
            <p className='text-sm text-gray-600'>Conversión Promedio</p>
          </div>
          <p className='text-2xl font-bold text-gray-900'>
            {categories.length > 0
              ? (
                  categories.reduce((sum, c) => sum + c.conversionRate, 0) / categories.length
                ).toFixed(2)
              : '0.00'}
            %
          </p>
        </div>
      </motion.div>
    </div>
  )
}

CategoryAnalyticsComponent.displayName = 'CategoryAnalytics'

export const CategoryAnalytics = React.memo(CategoryAnalyticsComponent)
export default CategoryAnalytics
