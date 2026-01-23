/**
 * Visualizador Interactivo de Rutas
 * Muestra una página con badges sobre elementos interactuados
 * Permite filtrar por dispositivo y ver métricas detalladas
 */

'use client'

import React, { useState, useEffect } from 'react'
import { motion } from '@/lib/framer-motion-lazy'
import { Search, Filter } from '@/lib/optimized-imports'
import { DeviceViewToggle } from './DeviceViewToggle'
import { ElementMetricsOverlay } from './ElementMetricsOverlay'
import { ElementDetailsPanel } from './ElementDetailsPanel'
import { PageRenderer } from './PageRenderer'

interface ElementMetrics {
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
    averageHoverTime: number
    conversionRate: number
    clickThroughRate: number
  }
  deviceBreakdown: {
    mobile: { interactions: number; users: number }
    desktop: { interactions: number; users: number }
  }
}

interface RouteVisualizerProps {
  startDate: string
  endDate: string
}

export const RouteVisualizer: React.FC<RouteVisualizerProps> = ({ startDate, endDate }) => {
  const [selectedRoute, setSelectedRoute] = useState('/')
  const [device, setDevice] = useState<'mobile' | 'desktop' | 'all'>('all')
  const [elements, setElements] = useState<ElementMetrics[]>([])
  const [selectedElement, setSelectedElement] = useState<ElementMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [availableRoutes, setAvailableRoutes] = useState<string[]>(['/'])
  const [interactionFilter, setInteractionFilter] = useState<('click' | 'hover' | 'scroll')[]>([
    'click',
    'hover',
    'scroll',
  ])

  useEffect(() => {
    fetchRoutes()
  }, [])

  useEffect(() => {
    if (selectedRoute) {
      fetchElementMetrics()
    }
  }, [selectedRoute, device, startDate, endDate])

  const fetchRoutes = async () => {
    try {
      // Obtener rutas más visitadas desde la API de métricas
      const response = await fetch(
        `/api/analytics/metrics?startDate=${startDate}&endDate=${endDate}&advanced=true`
      )
      const data = await response.json()
      
      if (data.engagement?.topPages) {
        // Mapear y filtrar rutas vacías o nulas
        const routes = data.engagement.topPages
          .map((p: { page: string }) => p.page || '/')
          .filter((route: string) => route && route.trim() !== '')
          .slice(0, 10)
        
        // Eliminar duplicados usando Set y asegurar que '/' esté presente
        const uniqueRoutes = Array.from(new Set(['/', ...routes]))
        setAvailableRoutes(uniqueRoutes)
      }
    } catch (error) {
      console.error('Error fetching routes:', error)
    }
  }

  const fetchElementMetrics = async () => {
    try {
      setLoading(true)
      const url = `/api/analytics/elements?route=${encodeURIComponent(selectedRoute)}&device=${device}&startDate=${startDate}&endDate=${endDate}`
      const response = await fetch(url)
      const data = await response.json()
      setElements(data.elements || [])
    } catch (error) {
      console.error('Error fetching element metrics:', error)
      setElements([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='space-y-6'>
      {/* Controles */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
      >
        <div className='flex flex-col md:flex-row gap-4 items-start md:items-center justify-between'>
          {/* Selector de ruta */}
          <div className='flex-1 max-w-md'>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Ruta</label>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <select
                value={selectedRoute}
                onChange={e => setSelectedRoute(e.target.value)}
                className='w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400'
              >
                {availableRoutes.map((route, index) => (
                  <option key={`${route}-${index}`} value={route}>
                    {route || '/'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle de dispositivo */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Dispositivo</label>
            <DeviceViewToggle device={device} onChange={setDevice} />
          </div>

          {/* Filtro de interacciones */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2'>
              <Filter className='w-4 h-4' />
              Interacciones
            </label>
            <div className='flex gap-2'>
              {(['click', 'hover', 'scroll'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => {
                    setInteractionFilter(prev =>
                      prev.includes(type)
                        ? prev.filter(t => t !== type)
                        : [...prev, type]
                    )
                  }}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    interactionFilter.includes(type)
                      ? 'bg-yellow-400 text-gray-900'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {type === 'click' ? 'Clicks' : type === 'hover' ? 'Hovers' : 'Scrolls'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Visualizador de página */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-white rounded-xl p-6 shadow-sm border border-gray-100'
      >
        <div className='mb-4 flex items-center justify-between'>
          <h3 className='text-lg font-semibold text-gray-900'>
            Visualización: {selectedRoute || '/'}
          </h3>
          {elements.length > 0 && (
            <span className='text-sm text-gray-500'>
              {elements.length} elementos interactuados
            </span>
          )}
        </div>

        {loading ? (
          <div className='animate-pulse'>
            <div className='h-96 bg-gray-200 rounded-lg'></div>
          </div>
        ) : (
          <div className='relative'>
            <PageRenderer route={selectedRoute} device={device}>
              <ElementMetricsOverlay
                elements={elements}
                device={device}
                onElementClick={setSelectedElement}
                interactionFilter={interactionFilter}
              />
            </PageRenderer>
            {elements.length === 0 && (
              <div className='absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 shadow-sm'>
                <p className='text-sm text-yellow-800 font-medium'>
                  No hay datos de interacciones para esta ruta en el período seleccionado
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Panel de detalles */}
      <ElementDetailsPanel element={selectedElement} onClose={() => setSelectedElement(null)} />
    </div>
  )
}

export default RouteVisualizer
