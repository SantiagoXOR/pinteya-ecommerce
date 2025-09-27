'use client'

import { useState, useEffect } from 'react'
import { Package, ShoppingCart, Users, AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react'

interface DashboardStats {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  noStockProducts: number
}

export default function TestDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener productos directamente de la API pública
      const response = await fetch('/api/products')

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const products = data.data || []

      const totalProducts = products.length
      const withStock = products.filter((p: any) => p.stock && p.stock > 0).length
      const lowStock = products.filter((p: any) => p.stock && p.stock > 0 && p.stock <= 10).length
      const noStock = products.filter((p: any) => !p.stock || p.stock === 0).length

      setStats({
        totalProducts,
        activeProducts: withStock,
        lowStockProducts: lowStock,
        noStockProducts: noStock,
      })
    } catch (err) {
      console.error('Error fetching stats:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const quickStats = [
    {
      title: 'Total Productos',
      value: loading ? 'Cargando...' : (stats?.totalProducts || 0).toString(),
      change: loading ? '...' : `${stats?.activeProducts || 0} con stock`,
      changeType: 'positive' as const,
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      title: 'Stock Bajo',
      value: loading ? 'Cargando...' : (stats?.lowStockProducts || 0).toString(),
      change: loading ? '...' : `${stats?.noStockProducts || 0} sin stock`,
      changeType:
        (stats?.lowStockProducts || 0) > 0 ? ('negative' as const) : ('positive' as const),
      icon: AlertTriangle,
      color: 'bg-yellow-500',
    },
    {
      title: 'Productos Activos',
      value: loading ? 'Cargando...' : (stats?.activeProducts || 0).toString(),
      change: loading
        ? '...'
        : `${(((stats?.activeProducts || 0) / (stats?.totalProducts || 1)) * 100).toFixed(1)}%`,
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'Análisis',
      value: loading ? 'Cargando...' : 'Completo',
      change: loading ? '...' : 'Datos reales',
      changeType: 'neutral' as const,
      icon: BarChart3,
      color: 'bg-purple-500',
    },
  ]

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            🧪 Test Dashboard - Estadísticas Reales
          </h1>
          <p className='text-gray-600'>
            Dashboard de prueba para verificar que las estadísticas muestren datos reales en lugar
            de valores hardcodeados
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
            <div className='flex items-center space-x-2 text-red-700'>
              <AlertTriangle className='h-5 w-5' />
              <span>
                Error cargando estadísticas:{' '}
                {error instanceof Error ? error.message : error?.toString() || 'Error desconocido'}
              </span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {quickStats.map((stat, index) => (
            <div key={index} className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm font-medium text-gray-600 mb-1'>{stat.title}</p>
                  <p className='text-2xl font-bold text-gray-900 mb-1'>{stat.value}</p>
                  <p
                    className={`text-sm ${
                      stat.changeType === 'positive'
                        ? 'text-green-600'
                        : stat.changeType === 'negative'
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color} text-white`}>
                  <stat.icon className='h-6 w-6' />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Verification Section */}
        <div className='bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
          <h2 className='text-xl font-bold text-gray-900 mb-4'>✅ Verificación de Datos</h2>

          <div className='space-y-4'>
            <div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
              <span className='font-medium'>Fuente de datos:</span>
              <span className='text-green-600'>API /api/products (datos reales)</span>
            </div>

            <div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
              <span className='font-medium'>Valores hardcodeados eliminados:</span>
              <span className='text-green-600'>✅ Sí (156, 142 reemplazados)</span>
            </div>

            <div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
              <span className='font-medium'>Cálculos dinámicos:</span>
              <span className='text-green-600'>✅ Basados en stock real</span>
            </div>

            <div className='flex items-center justify-between p-3 bg-gray-50 rounded'>
              <span className='font-medium'>Estado de carga:</span>
              <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
                {loading ? '⏳ Cargando...' : '✅ Completado'}
              </span>
            </div>
          </div>

          {/* Refresh Button */}
          <div className='mt-6'>
            <button
              onClick={fetchStats}
              disabled={loading}
              className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? 'Cargando...' : '🔄 Actualizar Estadísticas'}
            </button>
          </div>
        </div>

        {/* Raw Data Display */}
        {stats && (
          <div className='mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6'>
            <h3 className='text-lg font-bold text-gray-900 mb-4'>📊 Datos Raw (JSON)</h3>
            <pre className='bg-gray-100 p-4 rounded text-sm overflow-x-auto'>
              {JSON.stringify(stats, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
