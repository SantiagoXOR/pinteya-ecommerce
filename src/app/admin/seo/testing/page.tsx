'use client'

// ===================================
// PINTEYA E-COMMERCE - SEO TESTING DASHBOARD
// Dashboard para gestión de tests automatizados SEO
// ===================================

import React, { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin/layout/AdminLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  RefreshCw,
  Download,
  Settings,
  Target,
  Globe,
  Search,
  Link,
  Shield,
  Zap,
  FileText,
} from 'lucide-react'

// ===================================
// INTERFACES
// ===================================

interface TestResult {
  testId: string
  testName: string
  testType:
    | 'metadata'
    | 'structured_data'
    | 'robots_txt'
    | 'internal_links'
    | 'compliance'
    | 'performance'
  url: string
  status: 'passed' | 'failed' | 'warning' | 'skipped'
  score: number
  executionTime: number
  timestamp: Date
  suggestions: string[]
}

interface TestSuite {
  suiteId: string
  suiteName: string
  status: 'running' | 'completed' | 'failed'
  summary: {
    totalTests: number
    passed: number
    failed: number
    warnings: number
    skipped: number
    overallScore: number
    executionTime: number
  }
  startTime: Date
  endTime?: Date
}

interface TestingStats {
  totalTestsRun: number
  averageScore: number
  testsByType: Record<string, number>
  cacheHitRate: number
  mostCommonIssues: string[]
}

// ===================================
// COMPONENTE PRINCIPAL
// ===================================

export default function SEOTestingDashboard() {
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [stats, setStats] = useState<TestingStats | null>(null)
  const [recentSuites, setRecentSuites] = useState<TestSuite[]>([])
  const [recentResults, setRecentResults] = useState<TestResult[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const [testUrls, setTestUrls] = useState('/\n/shop\n/products/pintura-interior')

  // ===================================
  // EFECTOS
  // ===================================

  useEffect(() => {
    loadTestingData()
  }, [])

  // ===================================
  // FUNCIONES
  // ===================================

  const loadTestingData = async () => {
    try {
      setLoading(true)

      // Simular carga de datos (en producción vendría de la API)
      await new Promise(resolve => setTimeout(resolve, 1000))

      const mockStats: TestingStats = {
        totalTestsRun: 1250,
        averageScore: 87,
        testsByType: {
          metadata: 400,
          structured_data: 200,
          robots_txt: 50,
          internal_links: 300,
          compliance: 200,
          performance: 100,
        },
        cacheHitRate: 0.85,
        mostCommonIssues: [
          'Missing meta description',
          'Title too long',
          'No structured data',
          'Slow page load',
          'Missing alt text',
        ],
      }

      const mockSuites: TestSuite[] = [
        {
          suiteId: 'suite_123',
          suiteName: 'Full SEO Audit',
          status: 'completed',
          summary: {
            totalTests: 24,
            passed: 18,
            failed: 3,
            warnings: 3,
            skipped: 0,
            overallScore: 82,
            executionTime: 15420,
          },
          startTime: new Date(Date.now() - 3600000),
          endTime: new Date(Date.now() - 3585000),
        },
        {
          suiteId: 'suite_124',
          suiteName: 'Metadata Validation',
          status: 'completed',
          summary: {
            totalTests: 12,
            passed: 10,
            failed: 1,
            warnings: 1,
            skipped: 0,
            overallScore: 88,
            executionTime: 8200,
          },
          startTime: new Date(Date.now() - 7200000),
          endTime: new Date(Date.now() - 7192000),
        },
      ]

      const mockResults: TestResult[] = [
        {
          testId: 'test_1',
          testName: 'Title Tag Validation',
          testType: 'metadata',
          url: '/products/pintura-interior',
          status: 'passed',
          score: 90,
          executionTime: 150,
          timestamp: new Date(),
          suggestions: ['Title looks good'],
        },
        {
          testId: 'test_2',
          testName: 'Meta Description Validation',
          testType: 'metadata',
          url: '/products/pintura-interior',
          status: 'warning',
          score: 65,
          executionTime: 120,
          timestamp: new Date(),
          suggestions: ['Description is too short', 'Add call-to-action'],
        },
        {
          testId: 'test_3',
          testName: 'Structured Data Presence',
          testType: 'structured_data',
          url: '/products/pintura-interior',
          status: 'failed',
          score: 0,
          executionTime: 200,
          timestamp: new Date(),
          suggestions: ['Add Product schema', 'Include price and availability'],
        },
      ]

      setStats(mockStats)
      setRecentSuites(mockSuites)
      setRecentResults(mockResults)
    } catch (error) {
      console.error('Error loading testing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const runFullTestSuite = async () => {
    try {
      setRunning(true)

      // Simular ejecución de tests
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Recargar datos
      await loadTestingData()
    } catch (error) {
      console.error('Error running test suite:', error)
    } finally {
      setRunning(false)
    }
  }

  const runSpecificTests = async (testType: string) => {
    try {
      setRunning(true)

      // Simular ejecución de tests específicos
      await new Promise(resolve => setTimeout(resolve, 2000))

      await loadTestingData()
    } catch (error) {
      console.error('Error running specific tests:', error)
    } finally {
      setRunning(false)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className='h-4 w-4 text-green-500' />
      case 'failed':
        return <XCircle className='h-4 w-4 text-red-500' />
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />
      case 'skipped':
        return <Clock className='h-4 w-4 text-gray-500' />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge className='bg-green-100 text-green-800'>Passed</Badge>
      case 'failed':
        return <Badge className='bg-red-100 text-red-800'>Failed</Badge>
      case 'warning':
        return <Badge className='bg-yellow-100 text-yellow-800'>Warning</Badge>
      case 'skipped':
        return <Badge className='bg-gray-100 text-gray-800'>Skipped</Badge>
    }
  }

  const getTestTypeIcon = (type: TestResult['testType']) => {
    switch (type) {
      case 'metadata':
        return <FileText className='h-4 w-4' />
      case 'structured_data':
        return <Target className='h-4 w-4' />
      case 'robots_txt':
        return <Globe className='h-4 w-4' />
      case 'internal_links':
        return <Link className='h-4 w-4' />
      case 'compliance':
        return <Shield className='h-4 w-4' />
      case 'performance':
        return <Zap className='h-4 w-4' />
    }
  }

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) {
      return `${ms}ms`
    }
    return `${(ms / 1000).toFixed(1)}s`
  }

  // ===================================
  // TIPOS DE TESTS DISPONIBLES
  // ===================================

  const testTypes = [
    {
      id: 'metadata',
      name: 'Metadata Tests',
      description: 'Valida títulos, descripciones, keywords y Open Graph',
      icon: <FileText className='h-6 w-6' />,
      color: 'bg-blue-500',
      count: stats?.testsByType.metadata || 0,
    },
    {
      id: 'structured_data',
      name: 'Structured Data',
      description: 'Validación de Schema.org y JSON-LD',
      icon: <Target className='h-6 w-6' />,
      color: 'bg-green-500',
      count: stats?.testsByType.structured_data || 0,
    },
    {
      id: 'robots_txt',
      name: 'Robots.txt',
      description: 'Análisis de configuración robots.txt',
      icon: <Globe className='h-6 w-6' />,
      color: 'bg-purple-500',
      count: stats?.testsByType.robots_txt || 0,
    },
    {
      id: 'internal_links',
      name: 'Internal Links',
      description: 'Auditoría de enlaces internos',
      icon: <Link className='h-6 w-6' />,
      color: 'bg-orange-500',
      count: stats?.testsByType.internal_links || 0,
    },
    {
      id: 'compliance',
      name: 'Compliance',
      description: 'HTTPS, mobile-friendly, accesibilidad',
      icon: <Shield className='h-6 w-6' />,
      color: 'bg-red-500',
      count: stats?.testsByType.compliance || 0,
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'Core Web Vitals y métricas de rendimiento',
      icon: <Zap className='h-6 w-6' />,
      color: 'bg-yellow-500',
      count: stats?.testsByType.performance || 0,
    },
  ]

  // ===================================
  // RENDER
  // ===================================

  if (loading) {
    return (
      <AdminLayout
        title='SEO Testing'
        breadcrumbs={[
          { label: 'Admin', href: '/admin' },
          { label: 'SEO Dashboard', href: '/admin/seo' },
          { label: 'Testing' },
        ]}
      >
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {[...Array(6)].map((_, i) => (
              <Card key={i} className='animate-pulse'>
                <CardHeader className='space-y-2'>
                  <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                  <div className='h-8 bg-gray-200 rounded w-1/2'></div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title='SEO Testing Suite'
      breadcrumbs={[
        { label: 'Admin', href: '/admin' },
        { label: 'SEO Dashboard', href: '/admin/seo' },
        { label: 'Testing' },
      ]}
      actions={
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={loadTestingData} disabled={running}>
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button size='sm' onClick={runFullTestSuite} disabled={running}>
            <Play className='h-4 w-4 mr-2' />
            {running ? 'Ejecutando...' : 'Ejecutar Tests'}
          </Button>
        </div>
      }
    >
      <div className='space-y-6'>
        {/* Estadísticas Generales */}
        {stats && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Tests Ejecutados</CardTitle>
                <CheckCircle className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.totalTestsRun.toLocaleString()}</div>
                <p className='text-xs text-gray-500'>Total histórico</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Score Promedio</CardTitle>
                <Target className='h-4 w-4 text-blue-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.averageScore}/100</div>
                <Progress value={stats.averageScore} className='mt-2' />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Cache Hit Rate</CardTitle>
                <Zap className='h-4 w-4 text-purple-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{(stats.cacheHitRate * 100).toFixed(1)}%</div>
                <p className='text-xs text-gray-500'>Optimización de performance</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Issues Comunes</CardTitle>
                <AlertTriangle className='h-4 w-4 text-orange-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{stats.mostCommonIssues.length}</div>
                <p className='text-xs text-gray-500'>Tipos de problemas detectados</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs de Contenido */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='overview'>Overview</TabsTrigger>
            <TabsTrigger value='run-tests'>Ejecutar Tests</TabsTrigger>
            <TabsTrigger value='results'>Resultados</TabsTrigger>
            <TabsTrigger value='history'>Historial</TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-6'>
            {/* Tipos de Tests */}
            <Card>
              <CardHeader>
                <CardTitle>Tipos de Tests Disponibles</CardTitle>
                <CardDescription>Suite completa de validaciones SEO automatizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {testTypes.map(testType => (
                    <Card
                      key={testType.id}
                      className='hover:shadow-md transition-shadow cursor-pointer'
                    >
                      <CardHeader className='pb-3'>
                        <div className='flex items-center justify-between'>
                          <div className={`p-2 rounded-lg ${testType.color} text-white`}>
                            {testType.icon}
                          </div>
                          <Badge variant='secondary'>{testType.count} tests</Badge>
                        </div>
                        <CardTitle className='text-lg'>{testType.name}</CardTitle>
                        <CardDescription>{testType.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button
                          variant='outline'
                          size='sm'
                          className='w-full'
                          onClick={() => runSpecificTests(testType.id)}
                          disabled={running}
                        >
                          <Play className='h-4 w-4 mr-2' />
                          Ejecutar
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Issues Más Comunes */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Issues Más Comunes</CardTitle>
                  <CardDescription>
                    Problemas detectados frecuentemente en los tests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    {stats.mostCommonIssues.map((issue, index) => (
                      <div key={index} className='flex items-center gap-3 p-2 border rounded'>
                        <AlertTriangle className='h-4 w-4 text-yellow-500' />
                        <span className='flex-1'>{issue}</span>
                        <Badge variant='outline'>{Math.floor(Math.random() * 20) + 5} veces</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value='run-tests' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Configurar y Ejecutar Tests</CardTitle>
                <CardDescription>Personaliza las URLs y tipos de tests a ejecutar</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <label className='text-sm font-medium'>URLs a Testear</label>
                  <Textarea
                    value={testUrls}
                    onChange={e => setTestUrls(e.target.value)}
                    placeholder='Una URL por línea...'
                    className='mt-1'
                    rows={5}
                  />
                  <p className='text-xs text-gray-500 mt-1'>
                    Ingresa una URL por línea. Ejemplo: /products/pintura-interior
                  </p>
                </div>

                <div className='flex gap-4'>
                  <Button onClick={runFullTestSuite} disabled={running} className='flex-1'>
                    <Play className='h-4 w-4 mr-2' />
                    {running ? 'Ejecutando Suite Completa...' : 'Ejecutar Suite Completa'}
                  </Button>
                  <Button variant='outline' disabled={running}>
                    <Settings className='h-4 w-4 mr-2' />
                    Configuración Avanzada
                  </Button>
                </div>

                {running && (
                  <Alert>
                    <Clock className='h-4 w-4' />
                    <AlertDescription>
                      Ejecutando tests... Esto puede tomar unos minutos dependiendo del número de
                      URLs.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='results' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Resultados Recientes</CardTitle>
                <CardDescription>
                  Últimos tests ejecutados con detalles y sugerencias
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {recentResults.map(result => (
                    <div key={result.testId} className='border rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='flex items-center gap-3'>
                          {getTestTypeIcon(result.testType)}
                          <div>
                            <h4 className='font-medium'>{result.testName}</h4>
                            <p className='text-sm text-gray-500'>{result.url}</p>
                          </div>
                        </div>
                        <div className='flex items-center gap-3'>
                          <div className='text-right'>
                            <div className='font-semibold'>{result.score}/100</div>
                            <div className='text-xs text-gray-500'>
                              {formatExecutionTime(result.executionTime)}
                            </div>
                          </div>
                          {getStatusBadge(result.status)}
                        </div>
                      </div>

                      {result.suggestions.length > 0 && (
                        <div className='mt-3 p-3 bg-gray-50 rounded'>
                          <h5 className='text-sm font-medium mb-2'>Sugerencias:</h5>
                          <ul className='text-sm space-y-1'>
                            {result.suggestions.map((suggestion, index) => (
                              <li key={index} className='flex items-start gap-2'>
                                <span className='text-blue-500'>•</span>
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='history' className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Historial de Test Suites</CardTitle>
                <CardDescription>Suites de tests ejecutadas anteriormente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {recentSuites.map(suite => (
                    <div key={suite.suiteId} className='border rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-3'>
                        <div>
                          <h4 className='font-medium'>{suite.suiteName}</h4>
                          <p className='text-sm text-gray-500'>
                            {suite.startTime.toLocaleString()}
                            {suite.endTime &&
                              ` - ${formatExecutionTime(suite.summary.executionTime)}`}
                          </p>
                        </div>
                        <Badge
                          className={
                            suite.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : suite.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {suite.status}
                        </Badge>
                      </div>

                      <div className='grid grid-cols-2 md:grid-cols-5 gap-4 text-sm'>
                        <div>
                          <span className='text-gray-500'>Total:</span>
                          <div className='font-semibold'>{suite.summary.totalTests}</div>
                        </div>
                        <div>
                          <span className='text-gray-500'>Passed:</span>
                          <div className='font-semibold text-green-600'>{suite.summary.passed}</div>
                        </div>
                        <div>
                          <span className='text-gray-500'>Failed:</span>
                          <div className='font-semibold text-red-600'>{suite.summary.failed}</div>
                        </div>
                        <div>
                          <span className='text-gray-500'>Warnings:</span>
                          <div className='font-semibold text-yellow-600'>
                            {suite.summary.warnings}
                          </div>
                        </div>
                        <div>
                          <span className='text-gray-500'>Score:</span>
                          <div className='font-semibold'>{suite.summary.overallScore}/100</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  )
}
