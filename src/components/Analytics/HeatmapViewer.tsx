/**
 * Componente de Heatmap para visualizar interacciones de usuarios
 * Muestra zonas de mayor actividad en las páginas
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
// ⚡ PERFORMANCE: Lazy load de Framer Motion para reducir bundle inicial
import { motion } from '@/lib/framer-motion-lazy'
import { Eye, MousePointer, Zap, BarChart3 } from '@/lib/optimized-imports'
import { UserInteraction } from '@/lib/integrations/analytics'

interface HeatmapPoint {
  x: number
  y: number
  intensity: number
  type: 'click' | 'hover' | 'scroll'
}

interface HeatmapViewerProps {
  interactions: UserInteraction[]
  page: string
  className?: string
}

const HeatmapViewer: React.FC<HeatmapViewerProps> = ({ interactions, page, className = '' }) => {
  const [heatmapData, setHeatmapData] = useState<HeatmapPoint[]>([])
  const [activeType, setActiveType] = useState<'click' | 'hover' | 'scroll' | 'all'>('all')
  const [showOverlay, setShowOverlay] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    processInteractions()
  }, [interactions, activeType])

  useEffect(() => {
    if (showOverlay) {
      drawHeatmap()
    }
  }, [heatmapData, showOverlay])

  const processInteractions = () => {
    const filteredInteractions = interactions.filter(interaction => {
      if (activeType === 'all') {
        return true
      }
      return interaction.type === activeType
    })

    // Agrupar interacciones por proximidad
    const gridSize = 20
    const grid: { [key: string]: HeatmapPoint } = {}

    filteredInteractions.forEach(interaction => {
      const gridX = Math.floor(interaction.x / gridSize) * gridSize
      const gridY = Math.floor(interaction.y / gridSize) * gridSize
      const key = `${gridX}-${gridY}`

      if (grid[key]) {
        grid[key].intensity += 1
      } else {
        grid[key] = {
          x: gridX,
          y: gridY,
          intensity: 1,
          type: interaction.type as 'click' | 'hover' | 'scroll',
        }
      }
    })

    // Normalizar intensidades
    const points = Object.values(grid)
    const maxIntensity = Math.max(...points.map(p => p.intensity))

    const normalizedPoints = points.map(point => ({
      ...point,
      intensity: point.intensity / maxIntensity,
    }))

    setHeatmapData(normalizedPoints)
  }

  const drawHeatmap = () => {
    const canvas = canvasRef.current
    const container = containerRef.current

    if (!canvas || !container) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    // Ajustar tamaño del canvas
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Dibujar puntos de calor
    heatmapData.forEach(point => {
      const radius = 30
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius)

      // Color basado en el tipo de interacción
      let color = 'rgba(255, 0, 0, ' // rojo para clicks por defecto
      if (point.type === 'hover') {
        color = 'rgba(0, 255, 0, '
      }
      if (point.type === 'scroll') {
        color = 'rgba(0, 0, 255, '
      }

      gradient.addColorStop(0, `${color}${point.intensity * 0.8})`)
      gradient.addColorStop(0.5, `${color}${point.intensity * 0.4})`)
      gradient.addColorStop(1, `${color}0)`)

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  const getInteractionStats = () => {
    const stats = {
      total: interactions.length,
      clicks: interactions.filter(i => i.type === 'click').length,
      hovers: interactions.filter(i => i.type === 'hover').length,
      scrolls: interactions.filter(i => i.type === 'scroll').length,
    }

    return stats
  }

  const stats = getInteractionStats()

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 ${className}`}>
      {/* Header */}
      <div className='p-6 border-b border-gray-100'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900'>Mapa de Calor</h3>
            <p className='text-sm text-gray-600'>Interacciones de usuarios en {page}</p>
          </div>

          <div className='flex gap-2'>
            {[
              { type: 'all', label: 'Todas', icon: BarChart3 },
              { type: 'click', label: 'Clicks', icon: MousePointer },
              { type: 'hover', label: 'Hover', icon: Eye },
              { type: 'scroll', label: 'Scroll', icon: Zap },
            ].map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setActiveType(type as any)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeType === type
                    ? 'bg-yellow-400 text-gray-900'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className='w-4 h-4' />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle overlay */}
        <div className='mt-4 flex items-center gap-2'>
          <button
            onClick={() => setShowOverlay(!showOverlay)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              showOverlay ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {showOverlay ? 'Ocultar Overlay' : 'Mostrar Overlay'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className='p-6 border-b border-gray-100'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center'>
            <p className='text-2xl font-bold text-gray-900'>{stats.total}</p>
            <p className='text-sm text-gray-600'>Total interacciones</p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-red-600'>{stats.clicks}</p>
            <p className='text-sm text-gray-600'>Clicks</p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-green-600'>{stats.hovers}</p>
            <p className='text-sm text-gray-600'>Hovers</p>
          </div>
          <div className='text-center'>
            <p className='text-2xl font-bold text-blue-600'>{stats.scrolls}</p>
            <p className='text-sm text-gray-600'>Scrolls</p>
          </div>
        </div>
      </div>

      {/* Heatmap Container */}
      <div className='relative'>
        <div ref={containerRef} className='relative w-full h-96 bg-gray-50 overflow-hidden'>
          {/* Canvas overlay */}
          {showOverlay && (
            <canvas
              ref={canvasRef}
              className='absolute inset-0 pointer-events-none z-10'
              style={{ mixBlendMode: 'multiply' }}
            />
          )}

          {/* Puntos de interacción individuales */}
          {!showOverlay &&
            heatmapData.map((point, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: point.intensity }}
                className={`absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                  point.type === 'click'
                    ? 'bg-red-500'
                    : point.type === 'hover'
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                }`}
                style={{
                  left: point.x,
                  top: point.y,
                }}
              />
            ))}

          {/* Placeholder content */}
          <div className='absolute inset-0 flex items-center justify-center'>
            <div className='text-center text-gray-400'>
              <BarChart3 className='w-16 h-16 mx-auto mb-4' />
              <p className='text-lg font-medium'>Vista previa del contenido</p>
              <p className='text-sm'>Las interacciones se muestran como overlay</p>
            </div>
          </div>
        </div>

        {/* Leyenda */}
        <div className='p-4 bg-gray-50 border-t border-gray-100'>
          <div className='flex items-center justify-center gap-6 text-sm'>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-red-500 rounded-full'></div>
              <span>Clicks</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-green-500 rounded-full'></div>
              <span>Hovers</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
              <span>Scrolls</span>
            </div>
          </div>
        </div>
      </div>

      {/* Insights */}
      {heatmapData.length > 0 && (
        <div className='p-6 bg-blue-50'>
          <h4 className='font-medium text-blue-900 mb-2'>🔍 Insights</h4>
          <ul className='text-sm text-blue-800 space-y-1'>
            <li>• Se detectaron {heatmapData.length} zonas de alta actividad</li>
            {stats.clicks > stats.hovers && (
              <li>• Los usuarios prefieren hacer click directo vs explorar con hover</li>
            )}
            {stats.scrolls > stats.clicks && (
              <li>• Alta actividad de scroll indica contenido extenso</li>
            )}
            <li>• Considera optimizar las zonas con mayor concentración de interacciones</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default HeatmapViewer
