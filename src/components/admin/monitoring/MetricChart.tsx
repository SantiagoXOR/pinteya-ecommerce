'use client'

// ===================================
// PINTEYA E-COMMERCE - METRIC CHART COMPONENT
// ===================================

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from '@/lib/optimized-imports'

interface MetricDataPoint {
  timestamp: string
  value: number
}

interface MetricChartProps {
  title: string
  description?: string
  data: MetricDataPoint[]
  color?: string
  unit?: string
  decimals?: number
  height?: number
}

/**
 * Componente de gráfico de métricas simple (sin dependencias externas)
 */
export default function MetricChart({
  title,
  description,
  data,
  color = '#3b82f6',
  unit = '',
  decimals = 0,
  height = 200,
}: MetricChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-48 text-muted-foreground'>
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calcular valores para el gráfico
  const values = data.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const range = maxValue - minValue
  const currentValue = values[values.length - 1]
  const previousValue = values.length > 1 ? values[values.length - 2] : currentValue

  // Calcular tendencia
  const trend =
    currentValue > previousValue ? 'up' : currentValue < previousValue ? 'down' : 'stable'
  const trendPercentage =
    previousValue !== 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0

  // Generar puntos SVG para la línea
  const svgWidth = 400
  const svgHeight = height
  const padding = 20
  const chartWidth = svgWidth - padding * 2
  const chartHeight = svgHeight - padding * 2

  const points = data
    .map((point, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth
      const y =
        range > 0
          ? padding + chartHeight - ((point.value - minValue) / range) * chartHeight
          : padding + chartHeight / 2
      return `${x},${y}`
    })
    .join(' ')

  // Generar área bajo la curva
  const areaPoints = data.map((point, index) => {
    const x = padding + (index / (data.length - 1)) * chartWidth
    const y =
      range > 0
        ? padding + chartHeight - ((point.value - minValue) / range) * chartHeight
        : padding + chartHeight / 2
    return `${x},${y}`
  })

  const areaPath = `M${areaPoints[0]} L${areaPoints.join(' L')} L${padding + chartWidth},${padding + chartHeight} L${padding},${padding + chartHeight} Z`

  // Formatear valor
  const formatValue = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  // Obtener icono de tendencia
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className='h-4 w-4 text-green-500' />
      case 'down':
        return <TrendingDown className='h-4 w-4 text-red-500' />
      default:
        return <Minus className='h-4 w-4 text-gray-500' />
    }
  }

  // Obtener color de tendencia
  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className='flex items-center space-x-2'>
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {Math.abs(trendPercentage).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* Valor actual */}
          <div>
            <div className='text-2xl font-bold'>
              {formatValue(currentValue)}
              {unit}
            </div>
            <p className='text-xs text-muted-foreground'>Valor actual</p>
          </div>

          {/* Gráfico SVG */}
          <div className='w-full'>
            <svg
              width='100%'
              height={height}
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className='overflow-visible'
            >
              {/* Área bajo la curva */}
              <path d={areaPath} fill={color} fillOpacity={0.1} stroke='none' />

              {/* Línea principal */}
              <polyline
                points={points}
                fill='none'
                stroke={color}
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
              />

              {/* Puntos de datos */}
              {data.map((point, index) => {
                const x = padding + (index / (data.length - 1)) * chartWidth
                const y =
                  range > 0
                    ? padding + chartHeight - ((point.value - minValue) / range) * chartHeight
                    : padding + chartHeight / 2

                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r={3}
                    fill={color}
                    stroke='white'
                    strokeWidth={2}
                    className='hover:r-4 transition-all duration-200'
                  >
                    <title>
                      {new Date(point.timestamp).toLocaleTimeString('es-AR')}:{' '}
                      {formatValue(point.value)}
                      {unit}
                    </title>
                  </circle>
                )
              })}

              {/* Líneas de grid horizontales */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = padding + chartHeight * ratio
                const value = maxValue - ratio * range

                return (
                  <g key={index}>
                    <line
                      x1={padding}
                      y1={y}
                      x2={padding + chartWidth}
                      y2={y}
                      stroke='#e5e7eb'
                      strokeWidth={1}
                      strokeDasharray='2,2'
                    />
                    <text x={padding - 5} y={y + 4} textAnchor='end' fontSize='10' fill='#6b7280'>
                      {formatValue(value)}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>

          {/* Estadísticas adicionales */}
          <div className='grid grid-cols-3 gap-4 text-sm'>
            <div>
              <div className='font-medium text-green-600'>
                {formatValue(maxValue)}
                {unit}
              </div>
              <div className='text-muted-foreground'>Máximo</div>
            </div>
            <div>
              <div className='font-medium'>
                {formatValue((minValue + maxValue) / 2)}
                {unit}
              </div>
              <div className='text-muted-foreground'>Promedio</div>
            </div>
            <div>
              <div className='font-medium text-red-600'>
                {formatValue(minValue)}
                {unit}
              </div>
              <div className='text-muted-foreground'>Mínimo</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Componente de gráfico de barras simple
 */
interface BarChartProps {
  title: string
  description?: string
  data: Array<{ label: string; value: number; color?: string }>
  unit?: string
  decimals?: number
}

export function SimpleBarChart({
  title,
  description,
  data,
  unit = '',
  decimals = 0,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center h-48 text-muted-foreground'>
            No hay datos disponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...data.map(d => d.value))

  const formatValue = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {data.map((item, index) => {
            const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0
            const color = item.color || '#3b82f6'

            return (
              <div key={index} className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='font-medium'>{item.label}</span>
                  <span className='text-muted-foreground'>
                    {formatValue(item.value)}
                    {unit}
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='h-2 rounded-full transition-all duration-500 ease-out'
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
