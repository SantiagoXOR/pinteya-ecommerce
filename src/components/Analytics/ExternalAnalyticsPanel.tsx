/**
 * Panel de Analytics Externos
 * Muestra estado de conexión con GA4 y Meta, y permite consultar journeys de órdenes
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
// ⚡ OPTIMIZACIÓN: Usar lazy loader de framer-motion para reducir bundle inicial
import { motion, AnimatePresence } from '@/lib/framer-motion-lazy'
import {
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface ConnectionStatus {
  connected: boolean
  propertyId?: string | null
  pixelId?: string | null
  pixelName?: string
  error?: string
}

interface ExternalStatus {
  googleAnalytics: ConnectionStatus
  metaPixel: ConnectionStatus
  lastChecked: string
}

interface OrderJourneyResult {
  orderId: string
  local: {
    events: Array<{ eventName: string; timestamp: string; metadata?: Record<string, unknown> }>
    totalEvents: number
    purchaseEvent?: { timestamp: string; revenue: number; items: number }
  }
  googleAnalytics: {
    available: boolean
    purchase?: { found: boolean; revenue?: number; date?: string } | null
    error?: string
  }
  metaPixel: {
    available: boolean
    eventsSent: boolean
    error?: string
  }
  verification: {
    ga4PurchaseReceived: boolean
    metaPurchaseReceived: boolean
    dataMatch: boolean
    discrepancies?: string[]
  }
}

interface ComparisonData {
  dateRange: { startDate: string; endDate: string }
  local: {
    sessions: number
    users: number
    pageViews: number
    addToCarts: number
    checkouts: number
    purchases: number
    revenue: number
  }
  googleAnalytics: {
    available: boolean
    addToCarts?: number
    checkouts?: number
    purchases?: number
    revenue?: number
    error?: string
  }
  metaPixel: {
    available: boolean
    addToCarts?: number
    checkouts?: number
    purchases?: number
    revenue?: number
    error?: string
  }
  discrepancies: Array<{
    metric: string
    local: number
    ga4?: number
    meta?: number
    percentageDiff: number
  }>
}

const ExternalAnalyticsPanel: React.FC = () => {
  const [status, setStatus] = useState<ExternalStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderIdInput, setOrderIdInput] = useState('')
  const [journeyResult, setJourneyResult] = useState<OrderJourneyResult | null>(null)
  const [journeyLoading, setJourneyLoading] = useState(false)
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [comparisonLoading, setComparisonLoading] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar estado de conexiones
  const loadStatus = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [ga4Res, metaRes] = await Promise.all([
        fetch('/api/analytics/google?type=status'),
        fetch('/api/analytics/meta?type=status'),
      ])

      const ga4Data = await ga4Res.json()
      const metaData = await metaRes.json()

      setStatus({
        googleAnalytics: ga4Data.status || { connected: false, error: ga4Data.error },
        metaPixel: metaData.status || { connected: false, error: metaData.error },
        lastChecked: new Date().toISOString(),
      })
    } catch (err) {
      setError('Error al verificar conexiones')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
  }, [loadStatus])

  // Buscar journey de orden
  const searchOrderJourney = async () => {
    if (!orderIdInput.trim()) return

    setJourneyLoading(true)
    setJourneyResult(null)
    try {
      const res = await fetch(`/api/analytics/external?type=journey&orderId=${orderIdInput}`)
      const data = await res.json()

      if (data.success) {
        setJourneyResult(data.journey)
      } else {
        setError(data.error || 'Error al buscar journey')
      }
    } catch (err) {
      setError('Error al buscar journey de orden')
      console.error(err)
    } finally {
      setJourneyLoading(false)
    }
  }

  // Cargar comparación
  const loadComparison = async () => {
    setComparisonLoading(true)
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const res = await fetch(
        `/api/analytics/external?type=compare&startDate=${startDate}&endDate=${endDate}`
      )
      const data = await res.json()

      if (data.success) {
        setComparison(data.comparison)
      }
    } catch (err) {
      console.error('Error cargando comparación:', err)
    } finally {
      setComparisonLoading(false)
    }
  }

  // Status badge component
  const StatusBadge: React.FC<{ connected: boolean; label: string }> = ({ connected, label }) => (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
        connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {connected ? <CheckCircle2 className='w-4 h-4' /> : <XCircle className='w-4 h-4' />}
      {label}: {connected ? 'Conectado' : 'Desconectado'}
    </div>
  )

  return (
    <div className='bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden'>
      {/* Header */}
      <div className='p-6 border-b border-gray-100'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-indigo-100 rounded-lg'>
              <Activity className='w-5 h-5 text-indigo-600' />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900'>Analytics Externos</h3>
              <p className='text-sm text-gray-500'>Google Analytics 4 y Meta Pixel</p>
            </div>
          </div>
          <button
            onClick={loadStatus}
            disabled={loading}
            className='flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50'
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Estado de conexiones */}
      <div className='p-6 border-b border-gray-100'>
        <h4 className='text-sm font-medium text-gray-700 mb-4'>Estado de Conexiones</h4>

        {loading ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* Google Analytics */}
            <div className='p-4 bg-gray-50 rounded-lg'>
              <div className='flex items-center justify-between mb-3'>
                <span className='font-medium text-gray-900'>Google Analytics 4</span>
                <StatusBadge connected={status?.googleAnalytics?.connected || false} label='GA4' />
              </div>
              {status?.googleAnalytics?.propertyId && (
                <p className='text-sm text-gray-600'>
                  Property ID: <code className='bg-gray-200 px-1 rounded'>{status.googleAnalytics.propertyId}</code>
                </p>
              )}
              {status?.googleAnalytics?.error && (
                <p className='text-sm text-red-600 mt-2 flex items-center gap-1'>
                  <AlertTriangle className='w-4 h-4' />
                  {status.googleAnalytics.error}
                </p>
              )}
              <a
                href='https://analytics.google.com'
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 mt-2'
              >
                Abrir GA4 <ExternalLink className='w-3 h-3' />
              </a>
            </div>

            {/* Meta Pixel */}
            <div className='p-4 bg-gray-50 rounded-lg'>
              <div className='flex items-center justify-between mb-3'>
                <span className='font-medium text-gray-900'>Meta Pixel</span>
                <StatusBadge connected={status?.metaPixel?.connected || false} label='Meta' />
              </div>
              {status?.metaPixel?.pixelId && (
                <p className='text-sm text-gray-600'>
                  Pixel ID: <code className='bg-gray-200 px-1 rounded'>{status.metaPixel.pixelId}</code>
                </p>
              )}
              {status?.metaPixel?.pixelName && (
                <p className='text-sm text-gray-600'>Nombre: {status.metaPixel.pixelName}</p>
              )}
              {status?.metaPixel?.error && (
                <p className='text-sm text-red-600 mt-2 flex items-center gap-1'>
                  <AlertTriangle className='w-4 h-4' />
                  {status.metaPixel.error}
                </p>
              )}
              <a
                href={`https://business.facebook.com/events_manager2/list/pixel/${status?.metaPixel?.pixelId || ''}`}
                target='_blank'
                rel='noopener noreferrer'
                className='inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 mt-2'
              >
                Abrir Events Manager <ExternalLink className='w-3 h-3' />
              </a>
            </div>
          </div>
        )}

        {status?.lastChecked && (
          <p className='text-xs text-gray-500 mt-4'>
            Última verificación: {new Date(status.lastChecked).toLocaleString()}
          </p>
        )}
      </div>

      {/* Búsqueda de Journey */}
      <div className='p-6 border-b border-gray-100'>
        <h4 className='text-sm font-medium text-gray-700 mb-4'>Buscar Journey de Orden</h4>
        <div className='flex gap-2'>
          <div className='relative flex-1'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
            <input
              type='text'
              value={orderIdInput}
              onChange={e => setOrderIdInput(e.target.value)}
              placeholder='ID de orden o transaction_id...'
              className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
              onKeyDown={e => e.key === 'Enter' && searchOrderJourney()}
            />
          </div>
          <button
            onClick={searchOrderJourney}
            disabled={journeyLoading || !orderIdInput.trim()}
            className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
          >
            {journeyLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : <Search className='w-4 h-4' />}
            Buscar
          </button>
        </div>

        {/* Resultado del Journey */}
        <AnimatePresence>
          {journeyResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='mt-4 p-4 bg-gray-50 rounded-lg'
            >
              <h5 className='font-medium text-gray-900 mb-3'>Orden #{journeyResult.orderId}</h5>

              {/* Verificación */}
              <div className='grid grid-cols-3 gap-2 mb-4'>
                <div
                  className={`p-2 rounded text-center text-sm ${
                    journeyResult.local.purchaseEvent ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Local: {journeyResult.local.purchaseEvent ? '✓' : '✗'}
                </div>
                <div
                  className={`p-2 rounded text-center text-sm ${
                    journeyResult.verification.ga4PurchaseReceived
                      ? 'bg-green-100 text-green-800'
                      : journeyResult.googleAnalytics.available
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  GA4: {journeyResult.verification.ga4PurchaseReceived ? '✓' : journeyResult.googleAnalytics.available ? 'Pendiente' : 'N/A'}
                </div>
                <div
                  className={`p-2 rounded text-center text-sm ${
                    journeyResult.verification.metaPurchaseReceived
                      ? 'bg-green-100 text-green-800'
                      : journeyResult.metaPixel.available
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Meta: {journeyResult.verification.metaPurchaseReceived ? '✓' : journeyResult.metaPixel.available ? 'Pendiente' : 'N/A'}
                </div>
              </div>

              {/* Detalles de purchase */}
              {journeyResult.local.purchaseEvent && (
                <div className='mb-4 p-3 bg-white rounded border'>
                  <p className='text-sm text-gray-600'>
                    <strong>Revenue:</strong> ${journeyResult.local.purchaseEvent.revenue.toLocaleString()}
                  </p>
                  <p className='text-sm text-gray-600'>
                    <strong>Items:</strong> {journeyResult.local.purchaseEvent.items}
                  </p>
                  <p className='text-sm text-gray-600'>
                    <strong>Fecha:</strong> {new Date(journeyResult.local.purchaseEvent.timestamp).toLocaleString()}
                  </p>
                </div>
              )}

              {/* Discrepancias */}
              {journeyResult.verification.discrepancies && journeyResult.verification.discrepancies.length > 0 && (
                <div className='p-3 bg-yellow-50 rounded border border-yellow-200'>
                  <p className='text-sm font-medium text-yellow-800 mb-2'>Discrepancias detectadas:</p>
                  <ul className='text-sm text-yellow-700 space-y-1'>
                    {journeyResult.verification.discrepancies.map((d, i) => (
                      <li key={i}>• {d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Timeline de eventos */}
              <details className='mt-4'>
                <summary className='cursor-pointer text-sm text-gray-600 hover:text-gray-800'>
                  Ver {journeyResult.local.totalEvents} eventos locales
                </summary>
                <div className='mt-2 max-h-48 overflow-y-auto'>
                  {journeyResult.local.events.map((event, i) => (
                    <div key={i} className='flex items-center gap-2 py-1 text-xs'>
                      <span className='text-gray-400'>{new Date(event.timestamp).toLocaleTimeString()}</span>
                      <span className='font-medium text-gray-700'>{event.eventName}</span>
                    </div>
                  ))}
                </div>
              </details>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Comparación de Métricas */}
      <div className='p-6'>
        <button
          onClick={() => {
            setShowComparison(!showComparison)
            if (!comparison && !showComparison) {
              loadComparison()
            }
          }}
          className='flex items-center justify-between w-full text-left'
        >
          <div className='flex items-center gap-2'>
            <BarChart3 className='w-5 h-5 text-gray-500' />
            <span className='font-medium text-gray-900'>Comparación de Métricas (7 días)</span>
          </div>
          {showComparison ? (
            <ChevronUp className='w-5 h-5 text-gray-400' />
          ) : (
            <ChevronDown className='w-5 h-5 text-gray-400' />
          )}
        </button>

        <AnimatePresence>
          {showComparison && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className='mt-4'
            >
              {comparisonLoading ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='w-6 h-6 animate-spin text-gray-400' />
                </div>
              ) : comparison ? (
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b'>
                        <th className='text-left py-2 px-3'>Métrica</th>
                        <th className='text-right py-2 px-3'>Local</th>
                        <th className='text-right py-2 px-3'>GA4</th>
                        <th className='text-right py-2 px-3'>Meta</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className='border-b'>
                        <td className='py-2 px-3'>Add to Cart</td>
                        <td className='text-right py-2 px-3'>{comparison.local.addToCarts}</td>
                        <td className='text-right py-2 px-3'>
                          {comparison.googleAnalytics.available ? comparison.googleAnalytics.addToCarts : '-'}
                        </td>
                        <td className='text-right py-2 px-3'>
                          {comparison.metaPixel.available ? comparison.metaPixel.addToCarts : '-'}
                        </td>
                      </tr>
                      <tr className='border-b'>
                        <td className='py-2 px-3'>Checkouts</td>
                        <td className='text-right py-2 px-3'>{comparison.local.checkouts}</td>
                        <td className='text-right py-2 px-3'>
                          {comparison.googleAnalytics.available ? comparison.googleAnalytics.checkouts : '-'}
                        </td>
                        <td className='text-right py-2 px-3'>
                          {comparison.metaPixel.available ? comparison.metaPixel.checkouts : '-'}
                        </td>
                      </tr>
                      <tr className='border-b'>
                        <td className='py-2 px-3'>Purchases</td>
                        <td className='text-right py-2 px-3'>{comparison.local.purchases}</td>
                        <td className='text-right py-2 px-3'>
                          {comparison.googleAnalytics.available ? comparison.googleAnalytics.purchases : '-'}
                        </td>
                        <td className='text-right py-2 px-3'>
                          {comparison.metaPixel.available ? comparison.metaPixel.purchases : '-'}
                        </td>
                      </tr>
                      <tr>
                        <td className='py-2 px-3'>Revenue</td>
                        <td className='text-right py-2 px-3'>${comparison.local.revenue.toLocaleString()}</td>
                        <td className='text-right py-2 px-3'>
                          {comparison.googleAnalytics.available
                            ? `$${(comparison.googleAnalytics.revenue || 0).toLocaleString()}`
                            : '-'}
                        </td>
                        <td className='text-right py-2 px-3'>
                          {comparison.metaPixel.available
                            ? `$${(comparison.metaPixel.revenue || 0).toLocaleString()}`
                            : '-'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {comparison.discrepancies.length > 0 && (
                    <div className='mt-4 p-3 bg-yellow-50 rounded-lg'>
                      <p className='text-sm font-medium text-yellow-800 flex items-center gap-1'>
                        <AlertTriangle className='w-4 h-4' />
                        Discrepancias significativas (&gt;10%):
                      </p>
                      <ul className='mt-2 text-sm text-yellow-700'>
                        {comparison.discrepancies.map((d, i) => (
                          <li key={i}>
                            • {d.metric}: Local={d.local}, GA4={d.ga4 ?? 'N/A'}, Meta={d.meta ?? 'N/A'} ({d.percentageDiff}% diff)
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className='text-sm text-gray-500 text-center py-4'>
                  Configura las credenciales de GA4 y Meta para ver la comparación
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='p-4 bg-red-50 border-t border-red-100'
          >
            <p className='text-sm text-red-700 flex items-center gap-2'>
              <AlertTriangle className='w-4 h-4' />
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ExternalAnalyticsPanel
