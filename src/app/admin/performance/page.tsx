// ===================================
// ADMIN PERFORMANCE DASHBOARD
// Dashboard de monitoreo de performance en tiempo real
// ===================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePerformanceBudget } from '@/utils/performanceBudget'
import PerformanceMonitor from '@/components/admin/PerformanceMonitor'
import {
  Activity,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Monitor,
  Gauge,
  Server,
  BarChart3,
} from 'lucide-react'

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  status: 'good' | 'warning' | 'poor'
  budget: number
  description: string
}

const PerformanceDashboard = () => {
  const {
    getCurrentMetrics,
    getCurrentScore,
    getCurrentViolations,
    isWithinBudget,
    generateReport,
  } = usePerformanceBudget()

  const [metrics, setMetrics] = useState<PerformanceMetric[]>([])
  const [score, setScore] = useState(0)
  const [violations, setViolations] = useState<string[]>([])
  const [withinBudget, setWithinBudget] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // Actualizar métricas cada 5 segundos
  useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = getCurrentMetrics()
      const currentScore = getCurrentScore()
      const currentViolations = getCurrentViolations()
      const budget = isWithinBudget()

      setScore(currentScore)
      setViolations(currentViolations)
      setWithinBudget(budget)
      setLastUpdate(new Date())

      // Convertir métricas a formato del dashboard
      if (currentMetrics) {
        const formattedMetrics: PerformanceMetric[] = [
          {
            name: 'Largest Contentful Paint',
            value: currentMetrics.metrics.LCP || 0,
            unit: 'ms',
            status:
              (currentMetrics.metrics.LCP || 0) < 2500
                ? 'good'
                : (currentMetrics.metrics.LCP || 0) < 4000
                  ? 'warning'
                  : 'poor',
            budget: 2500,
            description: 'Tiempo hasta que el contenido principal se carga',
          },
          {
            name: 'First Input Delay',
            value: currentMetrics.metrics.FID || 0,
            unit: 'ms',
            status:
              (currentMetrics.metrics.FID || 0) < 100
                ? 'good'
                : (currentMetrics.metrics.FID || 0) < 300
                  ? 'warning'
                  : 'poor',
            budget: 100,
            description: 'Tiempo de respuesta a la primera interacción',
          },
          {
            name: 'Cumulative Layout Shift',
            value: currentMetrics.metrics.CLS || 0,
            unit: 'score',
            status:
              (currentMetrics.metrics.CLS || 0) < 0.1
                ? 'good'
                : (currentMetrics.metrics.CLS || 0) < 0.25
                  ? 'warning'
                  : 'poor',
            budget: 0.1,
            description: 'Estabilidad visual de la página',
          },
          {
            name: 'First Contentful Paint',
            value: currentMetrics.metrics.FCP || 0,
            unit: 'ms',
            status:
              (currentMetrics.metrics.FCP || 0) < 1800
                ? 'good'
                : (currentMetrics.metrics.FCP || 0) < 3000
                  ? 'warning'
                  : 'poor',
            budget: 1800,
            description: 'Tiempo hasta el primer contenido visible',
          },
        ].filter(metric => metric.value > 0)

        setMetrics(formattedMetrics)
      }
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 5000)

    return () => clearInterval(interval)
  }, [getCurrentMetrics, getCurrentScore, getCurrentViolations, isWithinBudget])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 bg-green-50'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50'
      case 'poor':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) {
      return 'text-green-600'
    }
    if (score >= 70) {
      return 'text-yellow-600'
    }
    return 'text-red-600'
  }

  const refreshMetrics = () => {
    window.location.reload()
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Performance Dashboard</h1>
          <p className='text-gray-600 mt-1'>Monitoreo en tiempo real de métricas de performance</p>
        </div>
        <div className='flex items-center gap-4'>
          <Badge variant={withinBudget ? 'default' : 'destructive'}>
            {withinBudget ? 'Dentro del presupuesto' : 'Fuera del presupuesto'}
          </Badge>
          <Button onClick={refreshMetrics} variant='outline' size='sm'>
            <Activity className='w-4 h-4 mr-2' />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Score General */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Gauge className='w-5 h-5' />
            Score General de Performance
          </CardTitle>
          <CardDescription>
            Puntuación basada en Core Web Vitals y métricas de carga
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className={`text-4xl font-bold ${getScoreColor(score)}`}>{score.toFixed(0)}</div>
              <div className='text-gray-500'>
                <div className='text-sm'>de 100</div>
                <div className='text-xs'>Actualizado: {lastUpdate.toLocaleTimeString()}</div>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {score >= 90 ? (
                <CheckCircle className='w-8 h-8 text-green-600' />
              ) : score >= 70 ? (
                <AlertTriangle className='w-8 h-8 text-yellow-600' />
              ) : (
                <AlertTriangle className='w-8 h-8 text-red-600' />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Web Vitals */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium text-gray-600'>{metric.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <div className='text-2xl font-bold'>
                    {metric.value.toFixed(metric.unit === 'score' ? 3 : 0)}
                    <span className='text-sm text-gray-500 ml-1'>{metric.unit}</span>
                  </div>
                  <Badge className={getStatusColor(metric.status)}>
                    {metric.status === 'good'
                      ? 'Bueno'
                      : metric.status === 'warning'
                        ? 'Regular'
                        : 'Malo'}
                  </Badge>
                </div>
                <div className='text-xs text-gray-500'>
                  Presupuesto: {metric.budget} {metric.unit}
                </div>
                <div className='text-xs text-gray-600'>{metric.description}</div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className={`h-2 rounded-full ${
                      metric.status === 'good'
                        ? 'bg-green-500'
                        : metric.status === 'warning'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (metric.value / (metric.budget * 2)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Violaciones */}
      {violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-red-600'>
              <AlertTriangle className='w-5 h-5' />
              Violaciones del Presupuesto de Performance
            </CardTitle>
            <CardDescription>Métricas que exceden los límites establecidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {violations.map((violation, index) => (
                <div key={index} className='flex items-center gap-2 p-3 bg-red-50 rounded-lg'>
                  <AlertTriangle className='w-4 h-4 text-red-500' />
                  <span className='text-sm text-red-700'>{violation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas Adicionales */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Monitor className='w-5 h-5' />
              Métricas de Carga
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Bundle JavaScript</span>
                <span className='font-medium'>531 kB</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Páginas generadas</span>
                <span className='font-medium'>148</span>
              </div>
              <div className='flex justify-between items-center'>
                <span className='text-sm text-gray-600'>Tiempo de build</span>
                <span className='font-medium'>24.4s</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='w-5 h-5' />
              Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {score >= 90 ? (
                <div className='flex items-center gap-2 text-green-600'>
                  <CheckCircle className='w-4 h-4' />
                  <span className='text-sm'>Performance excelente</span>
                </div>
              ) : (
                <>
                  <div className='flex items-center gap-2 text-blue-600'>
                    <Zap className='w-4 h-4' />
                    <span className='text-sm'>Optimizar lazy loading</span>
                  </div>
                  <div className='flex items-center gap-2 text-blue-600'>
                    <Clock className='w-4 h-4' />
                    <span className='text-sm'>Reducir JavaScript blocking</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para integrar dashboards */}
      <Tabs defaultValue='performance' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='performance' className='flex items-center gap-2'>
            <BarChart3 className='w-4 h-4' />
            Performance Monitor
          </TabsTrigger>
          <TabsTrigger value='server' className='flex items-center gap-2'>
            <Server className='w-4 h-4' />
            Server Metrics
          </TabsTrigger>
        </TabsList>

        <TabsContent value='performance' className='mt-6'>
          <PerformanceMonitor />
        </TabsContent>

        <TabsContent value='server' className='mt-6'>
          <Card>
            <CardHeader>
              <CardTitle>Métricas del Servidor</CardTitle>
              <CardDescription>Monitoreo de recursos del servidor y base de datos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='text-center py-8 text-gray-500'>
                <Server className='w-12 h-12 mx-auto mb-4 opacity-50' />
                <p>Dashboard de servidor en desarrollo</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PerformanceDashboard
