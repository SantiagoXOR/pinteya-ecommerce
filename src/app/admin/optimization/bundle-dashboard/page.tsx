'use client'

// ===================================
// BUNDLE OPTIMIZATION DASHBOARD
// ===================================
// Dashboard administrativo para monitoreo de optimización de bundles

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// ⚡ PERFORMANCE: Lazy load Recharts usando wrapper centralizado
// El wrapper asegura carga async consistente y reduce duplicación de código
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from '@/lib/recharts-lazy'

import {
  Package,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  RefreshCw,
  Settings,
} from '@/lib/optimized-imports'

// ===================================
// INTERFACES
// ===================================

interface BundleMetrics {
  totalSize: number
  gzippedSize: number
  firstLoadJS: number
  chunkCount: number
  score: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
}

interface ChunkData {
  name: string
  size: number
  type: string
  priority: string
}

interface ViolationData {
  name: string
  severity: 'warning' | 'error'
  impact: string
  actual: number
  expected: number
  recommendation: string
}

interface TrendData {
  date: string
  bundleSize: number
  firstLoadJS: number
  score: number
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export default function BundleDashboard() {
  const [metrics, setMetrics] = useState<BundleMetrics | null>(null)
  const [chunks, setChunks] = useState<ChunkData[]>([])
  const [violations, setViolations] = useState<ViolationData[]>([])
  const [trends, setTrends] = useState<TrendData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastAnalysis, setLastAnalysis] = useState<string>('')

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    loadDashboardData()
  }, [])

  // ===================================
  // FUNCIONES
  // ===================================

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Simular carga de datos (en implementación real, llamaría a APIs)
      await new Promise(resolve => setTimeout(resolve, 1000))

      setMetrics({
        totalSize: 420 * 1024,
        gzippedSize: 145 * 1024,
        firstLoadJS: 88 * 1024,
        chunkCount: 12,
        score: 87,
        grade: 'B',
      })

      setChunks([
        { name: 'framework', size: 65 * 1024, type: 'vendor', priority: 'critical' },
        { name: 'vendor', size: 85 * 1024, type: 'vendor', priority: 'critical' },
        { name: 'main', size: 45 * 1024, type: 'app', priority: 'critical' },
        { name: 'admin', size: 75 * 1024, type: 'dynamic', priority: 'medium' },
        { name: 'ui-components', size: 35 * 1024, type: 'shared', priority: 'high' },
        { name: 'charts', size: 55 * 1024, type: 'dynamic', priority: 'low' },
      ])

      setViolations([
        {
          name: 'Admin Chunk Size',
          severity: 'warning',
          impact: 'medium',
          actual: 75 * 1024,
          expected: 60 * 1024,
          recommendation: 'Dividir chunk admin en módulos más pequeños',
        },
      ])

      setTrends([
        { date: '2024-01-01', bundleSize: 450, firstLoadJS: 95, score: 82 },
        { date: '2024-01-02', bundleSize: 435, firstLoadJS: 90, score: 85 },
        { date: '2024-01-03', bundleSize: 420, firstLoadJS: 88, score: 87 },
      ])

      setLastAnalysis(new Date().toLocaleString())
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runAnalysis = async () => {
    setIsLoading(true)
    try {
      // Simular análisis
      await new Promise(resolve => setTimeout(resolve, 2000))
      await loadDashboardData()
    } catch (error) {
      console.error('Error running analysis:', error)
    }
  }

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      chunks,
      violations,
      trends,
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bundle-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatBytes = (bytes: number) => {
    return `${Math.round(bytes / 1024)}KB`
  }

  const getGradeColor = (grade: string) => {
    const colors = { A: 'green', B: 'blue', C: 'yellow', D: 'orange', F: 'red' }
    return colors[grade as keyof typeof colors] || 'gray'
  }

  const getSeverityColor = (severity: string) => {
    return severity === 'error' ? 'destructive' : 'warning'
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  if (isLoading && !metrics) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <RefreshCw className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p>Cargando dashboard de optimización...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Bundle Optimization Dashboard</h1>
          <p className='text-muted-foreground'>Monitoreo y análisis de optimización de bundles</p>
          {lastAnalysis && (
            <p className='text-sm text-muted-foreground mt-1'>Último análisis: {lastAnalysis}</p>
          )}
        </div>
        <div className='flex gap-2'>
          <Button onClick={runAnalysis} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Analizando...' : 'Analizar'}
          </Button>
          <Button variant='outline' onClick={exportReport}>
            <Download className='h-4 w-4 mr-2' />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas principales */}
      {metrics && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Bundle Total</CardTitle>
              <Package className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{formatBytes(metrics.totalSize)}</div>
              <p className='text-xs text-muted-foreground'>
                Gzipped: {formatBytes(metrics.gzippedSize)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>First Load JS</CardTitle>
              <Zap className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{formatBytes(metrics.firstLoadJS)}</div>
              <Progress value={(metrics.firstLoadJS / (128 * 1024)) * 100} className='mt-2' />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Chunks</CardTitle>
              <FileText className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{metrics.chunkCount}</div>
              <p className='text-xs text-muted-foreground'>Archivos generados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Score</CardTitle>
              <Badge variant={getGradeColor(metrics.grade) as any}>{metrics.grade}</Badge>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{metrics.score}/100</div>
              <Progress value={metrics.score} className='mt-2' />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Violaciones de presupuesto */}
      {violations.length > 0 && (
        <Alert>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>Violaciones de Presupuesto Detectadas</AlertTitle>
          <AlertDescription>
            Se encontraron {violations.length} violación(es) de presupuesto de performance.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs principales */}
      <Tabs defaultValue='chunks' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='chunks'>Análisis de Chunks</TabsTrigger>
          <TabsTrigger value='violations'>Violaciones</TabsTrigger>
          <TabsTrigger value='trends'>Tendencias</TabsTrigger>
          <TabsTrigger value='recommendations'>Recomendaciones</TabsTrigger>
        </TabsList>

        {/* Tab: Análisis de Chunks */}
        <TabsContent value='chunks' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Gráfico de barras de chunks */}
            <Card>
              <CardHeader>
                <CardTitle>Tamaño por Chunk</CardTitle>
                <CardDescription>Distribución de tamaños de chunks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart data={chunks}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis tickFormatter={value => `${Math.round(value / 1024)}KB`} />
                    <Tooltip
                      formatter={value => [`${Math.round(Number(value) / 1024)}KB`, 'Tamaño']}
                    />
                    <Bar dataKey='size' fill='#8884d8' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico circular de tipos */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución por Tipo</CardTitle>
                <CardDescription>Tipos de chunks generados</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={chunks}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${Math.round(value / 1024)}KB`}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='size'
                    >
                      {chunks.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={value => [`${Math.round(Number(value) / 1024)}KB`, 'Tamaño']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de chunks */}
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Chunks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b'>
                      <th className='text-left p-2'>Nombre</th>
                      <th className='text-left p-2'>Tamaño</th>
                      <th className='text-left p-2'>Tipo</th>
                      <th className='text-left p-2'>Prioridad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chunks.map((chunk, index) => (
                      <tr key={index} className='border-b'>
                        <td className='p-2 font-medium'>{chunk.name}</td>
                        <td className='p-2'>{formatBytes(chunk.size)}</td>
                        <td className='p-2'>
                          <Badge variant='outline'>{chunk.type}</Badge>
                        </td>
                        <td className='p-2'>
                          <Badge
                            variant={chunk.priority === 'critical' ? 'destructive' : 'secondary'}
                          >
                            {chunk.priority}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Violaciones */}
        <TabsContent value='violations' className='space-y-4'>
          {violations.length === 0 ? (
            <Card>
              <CardContent className='flex items-center justify-center py-8'>
                <div className='text-center'>
                  <CheckCircle className='h-12 w-12 text-green-500 mx-auto mb-4' />
                  <h3 className='text-lg font-semibold'>¡Excelente!</h3>
                  <p className='text-muted-foreground'>
                    No se encontraron violaciones de presupuesto de performance.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-4'>
              {violations.map((violation, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='flex items-center gap-2'>
                        <AlertTriangle className='h-5 w-5' />
                        {violation.name}
                      </CardTitle>
                      <Badge variant={getSeverityColor(violation.severity) as any}>
                        {violation.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                      <div>
                        <p className='text-sm font-medium'>Actual</p>
                        <p className='text-lg'>{formatBytes(violation.actual)}</p>
                      </div>
                      <div>
                        <p className='text-sm font-medium'>Esperado</p>
                        <p className='text-lg'>{formatBytes(violation.expected)}</p>
                      </div>
                      <div>
                        <p className='text-sm font-medium'>Impacto</p>
                        <Badge variant='outline'>{violation.impact}</Badge>
                      </div>
                    </div>
                    <div>
                      <p className='text-sm font-medium mb-2'>Recomendación</p>
                      <p className='text-sm text-muted-foreground'>{violation.recommendation}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab: Tendencias */}
        <TabsContent value='trends' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Tendencias de Performance</CardTitle>
              <CardDescription>Evolución de métricas clave en el tiempo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={400}>
                <LineChart data={trends}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='date' />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type='monotone'
                    dataKey='bundleSize'
                    stroke='#8884d8'
                    name='Bundle Size (KB)'
                  />
                  <Line
                    type='monotone'
                    dataKey='firstLoadJS'
                    stroke='#82ca9d'
                    name='First Load JS (KB)'
                  />
                  <Line type='monotone' dataKey='score' stroke='#ffc658' name='Score' />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Recomendaciones */}
        <TabsContent value='recommendations' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Optimizaciones Automáticas</CardTitle>
                <CardDescription>Mejoras que se pueden aplicar automáticamente</CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span>Lazy Loading de Componentes</span>
                  <Button size='sm'>Aplicar</Button>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Compresión Gzip</span>
                  <Button size='sm'>Aplicar</Button>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Tree Shaking Avanzado</span>
                  <Button size='sm'>Aplicar</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimizaciones Manuales</CardTitle>
                <CardDescription>Mejoras que requieren intervención manual</CardDescription>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='p-3 border rounded'>
                  <h4 className='font-medium'>Dividir Admin Chunk</h4>
                  <p className='text-sm text-muted-foreground'>
                    El chunk admin es demasiado grande. Considerar dividirlo en módulos más
                    pequeños.
                  </p>
                </div>
                <div className='p-3 border rounded'>
                  <h4 className='font-medium'>Optimizar Dependencias</h4>
                  <p className='text-sm text-muted-foreground'>
                    Revisar dependencias pesadas como recharts y maplibre-gl para lazy loading.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
