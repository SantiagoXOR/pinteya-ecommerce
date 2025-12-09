// ===================================
// PINTEYA E-COMMERCE - TESTING DASHBOARD
// Dashboard administrativo para gestión de testing automatizado
// ===================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  Shield,
  Zap,
  Eye,
} from '@/lib/optimized-imports'

// Importar managers de testing
import { automatedTestingManager } from '@/lib/testing/automated-testing-manager'
import { ciTestingPipeline, CI_CONFIGS } from '@/lib/testing/ci-testing-pipeline'
import type { TestSuite, PipelineResult } from '@/lib/testing/ci-testing-pipeline'

// ===================================
// INTERFACES
// ===================================

interface TestingStats {
  totalTests: number
  passedTests: number
  failedTests: number
  successRate: number
  lastRun: Date
  averageDuration: number
}

// ===================================
// TESTING DASHBOARD COMPONENT
// ===================================

export default function TestingDashboard() {
  const [isRunning, setIsRunning] = useState(false)
  const [currentPipeline, setCurrentPipeline] = useState<PipelineResult | null>(null)
  const [testHistory, setTestHistory] = useState<PipelineResult[]>([])
  const [stats, setStats] = useState<TestingStats>({
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    successRate: 0,
    lastRun: new Date(),
    averageDuration: 0,
  })

  // ===================================
  // EFFECTS
  // ===================================

  useEffect(() => {
    loadTestHistory()
  }, [])

  // ===================================
  // HANDLERS
  // ===================================

  const loadTestHistory = () => {
    // Simular carga de historial
    const mockHistory: PipelineResult[] = [
      {
        success: true,
        duration: 45000,
        suites: [],
        summary: { totalTests: 25, passedTests: 25, failedTests: 0, successRate: 100 },
        errors: [],
        recommendations: [],
      },
      {
        success: false,
        duration: 38000,
        suites: [],
        summary: { totalTests: 25, passedTests: 22, failedTests: 3, successRate: 88 },
        errors: ['3 tests de performance fallaron'],
        recommendations: ['Optimizar componentes lentos'],
      },
    ]

    setTestHistory(mockHistory)

    // Calcular estadísticas
    const totalRuns = mockHistory.length
    const successfulRuns = mockHistory.filter(r => r.success).length
    const totalTests = mockHistory.reduce((sum, r) => sum + r.summary.totalTests, 0)
    const passedTests = mockHistory.reduce((sum, r) => sum + r.summary.passedTests, 0)
    const avgDuration = mockHistory.reduce((sum, r) => sum + r.duration, 0) / totalRuns

    setStats({
      totalTests: totalTests / totalRuns,
      passedTests: passedTests / totalRuns,
      failedTests: (totalTests - passedTests) / totalRuns,
      successRate: (successfulRuns / totalRuns) * 100,
      lastRun: new Date(),
      averageDuration: avgDuration,
    })
  }

  const runTestPipeline = async (environment: 'development' | 'staging' | 'production') => {
    setIsRunning(true)

    try {
      const config = CI_CONFIGS[environment]
      const result = await ciTestingPipeline.runPipeline(config)

      setCurrentPipeline(result)
      setTestHistory(prev => [result, ...prev.slice(0, 9)]) // Keep last 10 runs

      // Actualizar estadísticas
      loadTestHistory()
    } catch (error) {
      console.error('Error running test pipeline:', error)
    } finally {
      setIsRunning(false)
    }
  }

  // ===================================
  // RENDER HELPERS
  // ===================================

  const renderTestSuiteCard = (suite: TestSuite) => (
    <Card key={suite.name} className='mb-4'>
      <CardHeader className='pb-3'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-lg'>{suite.name}</CardTitle>
          <Badge variant={suite.failedTests === 0 ? 'default' : 'destructive'}>
            {suite.passedTests}/{suite.totalTests}
          </Badge>
        </div>
        <CardDescription>Duración: {(suite.duration / 1000).toFixed(2)}s</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <Progress value={(suite.passedTests / suite.totalTests) * 100} className='h-2' />

          <div className='grid grid-cols-3 gap-4 text-sm'>
            <div className='flex items-center gap-2'>
              <CheckCircle className='h-4 w-4 text-green-500' />
              <span>{suite.passedTests} Pasaron</span>
            </div>
            <div className='flex items-center gap-2'>
              <XCircle className='h-4 w-4 text-red-500' />
              <span>{suite.failedTests} Fallaron</span>
            </div>
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4 text-yellow-500' />
              <span>{suite.skippedTests} Omitidos</span>
            </div>
          </div>

          {suite.tests.filter(t => t.status === 'failed').length > 0 && (
            <div className='mt-4 p-3 bg-red-50 rounded-lg'>
              <h4 className='font-medium text-red-800 mb-2'>Tests Fallidos:</h4>
              <ul className='space-y-1 text-sm text-red-700'>
                {suite.tests
                  .filter(t => t.status === 'failed')
                  .map((test, index) => (
                    <li key={index} className='flex items-start gap-2'>
                      <XCircle className='h-3 w-3 mt-0.5 flex-shrink-0' />
                      <div>
                        <span className='font-medium'>{test.name}</span>
                        {test.error && <p className='text-xs mt-1'>{test.error}</p>}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderStatsCard = (
    title: string,
    value: string | number,
    icon: React.ReactNode,
    trend?: number
  ) => (
    <Card>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-muted-foreground'>{title}</p>
            <p className='text-2xl font-bold'>{value}</p>
            {trend !== undefined && (
              <p
                className={`text-xs ${trend >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-1 mt-1`}
              >
                <TrendingUp className='h-3 w-3' />
                {trend >= 0 ? '+' : ''}
                {trend.toFixed(1)}%
              </p>
            )}
          </div>
          <div className='h-8 w-8 text-muted-foreground'>{icon}</div>
        </div>
      </CardContent>
    </Card>
  )

  // ===================================
  // RENDER
  // ===================================

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Testing Dashboard</h1>
          <p className='text-muted-foreground'>Gestión y monitoreo de testing automatizado</p>
        </div>

        <div className='flex gap-2'>
          <Button
            onClick={() => runTestPipeline('development')}
            disabled={isRunning}
            variant='outline'
          >
            <Play className='h-4 w-4 mr-2' />
            Dev Tests
          </Button>
          <Button onClick={() => runTestPipeline('staging')} disabled={isRunning} variant='outline'>
            <Play className='h-4 w-4 mr-2' />
            Staging Tests
          </Button>
          <Button onClick={() => runTestPipeline('production')} disabled={isRunning}>
            <Play className='h-4 w-4 mr-2' />
            Production Tests
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {renderStatsCard(
          'Tests Totales',
          Math.round(stats.totalTests),
          <CheckCircle className='h-8 w-8' />,
          5.2
        )}
        {renderStatsCard(
          'Tasa de Éxito',
          `${stats.successRate.toFixed(1)}%`,
          <TrendingUp className='h-8 w-8' />,
          2.1
        )}
        {renderStatsCard(
          'Duración Promedio',
          `${(stats.averageDuration / 1000).toFixed(1)}s`,
          <Clock className='h-8 w-8' />,
          -8.3
        )}
        {renderStatsCard('Última Ejecución', 'Hace 2h', <Play className='h-8 w-8' />)}
      </div>

      {/* Current Pipeline Status */}
      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-primary'></div>
              Ejecutando Pipeline de Testing...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={65} className='h-2' />
            <p className='text-sm text-muted-foreground mt-2'>Ejecutando tests de performance...</p>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      <Tabs defaultValue='current' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='current'>Resultados Actuales</TabsTrigger>
          <TabsTrigger value='history'>Historial</TabsTrigger>
          <TabsTrigger value='config'>Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value='current' className='space-y-4'>
          {currentPipeline ? (
            <div className='space-y-4'>
              {/* Pipeline Summary */}
              <Card>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-2'>
                      {currentPipeline.success ? (
                        <CheckCircle className='h-5 w-5 text-green-500' />
                      ) : (
                        <XCircle className='h-5 w-5 text-red-500' />
                      )}
                      Pipeline {currentPipeline.success ? 'Exitoso' : 'Fallido'}
                    </CardTitle>
                    <Badge variant={currentPipeline.success ? 'default' : 'destructive'}>
                      {currentPipeline.summary.successRate.toFixed(1)}% éxito
                    </Badge>
                  </div>
                  <CardDescription>
                    Duración: {(currentPipeline.duration / 1000).toFixed(2)}s | Tests:{' '}
                    {currentPipeline.summary.passedTests}/{currentPipeline.summary.totalTests}
                  </CardDescription>
                </CardHeader>

                {currentPipeline.errors.length > 0 && (
                  <CardContent>
                    <div className='p-3 bg-red-50 rounded-lg'>
                      <h4 className='font-medium text-red-800 mb-2 flex items-center gap-2'>
                        <AlertTriangle className='h-4 w-4' />
                        Errores Encontrados:
                      </h4>
                      <ul className='space-y-1 text-sm text-red-700'>
                        {currentPipeline.errors.map((error, index) => (
                          <li key={index}>
                            •{' '}
                            {error instanceof Error
                              ? error.message
                              : error?.toString() || 'Error desconocido'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Test Suites */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {currentPipeline.suites.map(renderTestSuiteCard)}
              </div>

              {/* Recommendations */}
              {currentPipeline.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                      <TrendingUp className='h-5 w-5' />
                      Recomendaciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className='space-y-2'>
                      {currentPipeline.recommendations.map((rec, index) => (
                        <li key={index} className='flex items-start gap-2'>
                          <div className='h-2 w-2 bg-blue-500 rounded-full mt-2 flex-shrink-0'></div>
                          <span className='text-sm'>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className='p-12 text-center'>
                <Play className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-medium mb-2'>No hay resultados recientes</h3>
                <p className='text-muted-foreground mb-4'>
                  Ejecuta un pipeline de testing para ver los resultados aquí
                </p>
                <Button onClick={() => runTestPipeline('development')}>
                  Ejecutar Tests de Desarrollo
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value='history' className='space-y-4'>
          <div className='space-y-4'>
            {testHistory.map((result, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='flex items-center gap-2'>
                      {result.success ? (
                        <CheckCircle className='h-4 w-4 text-green-500' />
                      ) : (
                        <XCircle className='h-4 w-4 text-red-500' />
                      )}
                      Ejecución #{testHistory.length - index}
                    </CardTitle>
                    <div className='text-sm text-muted-foreground'>
                      {(result.duration / 1000).toFixed(2)}s
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-4'>
                      <span className='text-sm'>
                        {result.summary.passedTests}/{result.summary.totalTests} tests
                      </span>
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        {result.summary.successRate.toFixed(1)}%
                      </Badge>
                    </div>
                    <Button variant='outline' size='sm'>
                      Ver Detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='config' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='h-5 w-5' />
                  Development
                </CardTitle>
                <CardDescription>Tests básicos para desarrollo local</CardDescription>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Regresión</span>
                  <Badge variant='default'>Activo</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Performance</span>
                  <Badge variant='default'>Activo</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Accesibilidad</span>
                  <Badge variant='secondary'>Inactivo</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Seguridad</span>
                  <Badge variant='secondary'>Inactivo</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Eye className='h-5 w-5' />
                  Staging
                </CardTitle>
                <CardDescription>Tests completos para pre-producción</CardDescription>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Regresión</span>
                  <Badge variant='default'>Activo</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Performance</span>
                  <Badge variant='default'>Activo</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Accesibilidad</span>
                  <Badge variant='default'>Activo</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Seguridad</span>
                  <Badge variant='default'>Activo</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Shield className='h-5 w-5' />
                  Production
                </CardTitle>
                <CardDescription>Tests críticos para producción</CardDescription>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Regresión</span>
                  <Badge variant='default'>Activo</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Performance</span>
                  <Badge variant='default'>Activo</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Accesibilidad</span>
                  <Badge variant='default'>Activo</Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Seguridad</span>
                  <Badge variant='default'>Activo</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
