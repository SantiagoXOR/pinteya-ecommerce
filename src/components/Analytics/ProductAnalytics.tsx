/**
 * Componente de Analytics de Productos
 * Muestra productos más agregados al carrito, más vistos, y distribución por categoría
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from '@/lib/framer-motion-lazy'
import { ShoppingCart, Eye, TrendingUp, DollarSign } from '@/lib/optimized-imports'

interface ProductData {
  productId: string
  productName: string
  category: string
  totalAdditions?: number
  totalRevenue?: number
  averagePrice?: number
  views?: number
}

interface ProductAnalyticsProps {
  startDate: string
  endDate: string
}

export const ProductAnalytics: React.FC<ProductAnalyticsProps> = React.memo(({ startDate, endDate }) => {
  const [topProducts, setTopProducts] = useState<ProductData[]>([])
  const [topViewed, setTopViewed] = useState<ProductData[]>([])
  const [productsByCategory, setProductsByCategory] = useState<Array<{
    category: string
    count: number
    revenue: number
  }>>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'additions' | 'revenue' | 'views'>('additions')

  useEffect(() => {
    fetchProductData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, sortBy])

  const fetchProductData = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/analytics/products?startDate=${startDate}&endDate=${endDate}&sortBy=${sortBy}&limit=10`
      )
      const data = await response.json()
      setTopProducts(data.topProductsAddedToCart || [])
      setTopViewed(data.topProductsViewed || [])
      setProductsByCategory(data.productsByCategory || [])
    } catch (error) {
      console.error('Error fetching product analytics:', error)
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
      {/* Productos agregados al carrito */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
      >
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-lg font-semibold text-gray-900 flex items-center gap-2'>
            <ShoppingCart className='w-5 h-5' />
            Productos Agregados al Carrito
          </h3>
          <div className='flex gap-2'>
            <button
              onClick={() => setSortBy('additions')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'additions'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Veces
            </button>
            <button
              onClick={() => setSortBy('revenue')}
              className={`px-3 py-1 rounded text-sm ${
                sortBy === 'revenue'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Ingresos
            </button>
          </div>
        </div>

        <div className='space-y-3'>
          {topProducts.length > 0 ? (
            topProducts.map((product, index) => (
              <div
                key={product.productId}
                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
              >
                <div className='flex items-center gap-3 flex-1'>
                  <span className='w-8 h-8 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center text-sm font-medium'>
                    {index + 1}
                  </span>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>{product.productName}</p>
                    <p className='text-xs text-gray-500'>{product.category}</p>
                  </div>
                </div>
                <div className='flex items-center gap-4'>
                  {product.totalAdditions !== undefined && (
                    <div className='text-right'>
                      <p className='text-sm font-semibold text-gray-900'>{product.totalAdditions}</p>
                      <p className='text-xs text-gray-500'>veces</p>
                    </div>
                  )}
                  {product.totalRevenue !== undefined && product.totalRevenue > 0 && (
                    <div className='text-right'>
                      <p className='text-sm font-semibold text-green-600'>
                        ${product.totalRevenue.toFixed(2)}
                      </p>
                      <p className='text-xs text-gray-500'>ingresos</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className='text-sm text-gray-500 text-center py-4'>No hay datos disponibles</p>
          )}
        </div>
      </motion.div>

      {/* Productos más vistos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
      >
        <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
          <Eye className='w-5 h-5' />
          Productos Más Vistos
        </h3>
        <div className='space-y-3'>
          {topViewed.length > 0 ? (
            topViewed.map((product, index) => (
              <div
                key={product.productId}
                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
              >
                <div className='flex items-center gap-3 flex-1'>
                  <span className='w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium'>
                    {index + 1}
                  </span>
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium text-gray-900 truncate'>{product.productName}</p>
                    <p className='text-xs text-gray-500'>{product.category}</p>
                  </div>
                </div>
                <div className='text-right'>
                  <p className='text-sm font-semibold text-gray-900'>{product.views || 0}</p>
                  <p className='text-xs text-gray-500'>vistas</p>
                </div>
              </div>
            ))
          ) : (
            <p className='text-sm text-gray-500 text-center py-4'>No hay datos disponibles</p>
          )}
        </div>
      </motion.div>

      {/* Distribución por categoría */}
      {productsByCategory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
        >
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <TrendingUp className='w-5 h-5' />
            Distribución por Categoría
          </h3>
          <div className='space-y-3'>
            {productsByCategory.slice(0, 10).map((cat, index) => (
              <div key={cat.category} className='space-y-1'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium text-gray-700'>{cat.category}</span>
                  <div className='flex items-center gap-4'>
                    <span className='text-sm text-gray-600'>{cat.count} eventos</span>
                    {cat.revenue > 0 && (
                      <span className='text-sm font-semibold text-green-600'>
                        ${cat.revenue.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-yellow-400 h-2 rounded-full'
                    style={{
                      width: `${(cat.count / productsByCategory[0]?.count) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}

ProductAnalytics.displayName = 'ProductAnalytics'

export default ProductAnalytics
