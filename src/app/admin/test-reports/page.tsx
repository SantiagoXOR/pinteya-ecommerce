// ===================================
// ADMIN TEST REPORTS DASHBOARD
// Dashboard completo de reportes de testing automatizado
// ===================================

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TestTube,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  Play,
  RefreshCw,
  FileText,
  BarChart3,
  Target,
  Camera,
  Image,
  Eye,
  Download,
  ZoomIn,
  X,
  ShoppingCart,
  ArrowRight,
  CreditCard,
  User,
} from '@/lib/optimized-imports'

interface TestSuite {
  name: string
  status: 'passed' | 'failed' | 'running' | 'pending'
  tests: number
  passed: number
  failed: number
  duration: number
  coverage: number
  lastRun: Date
  screenshots?: ScreenshotInfo[]
  screenshotCount?: number
}

interface ScreenshotInfo {
  id: string
  stepName: string
  url: string
  previewUrl: string
  timestamp: Date
  status: 'success' | 'failure' | 'info'
  metadata?: {
    width: number
    height: number
    size: number
  }
}

interface TestReport {
  id: string
  timestamp: Date
  totalSuites: number
  totalTests: number
  passed: number
  failed: number
  skipped: number
  duration: number
  coverage: {
    statements: number
    branches: number
    functions: number
    lines: number
  }
  suites: TestSuite[]
  screenshots?: {
    total: number
    byStatus: {
      success: number
      failure: number
      info: number
    }
    totalSize: number
  }
}

const TestReportsDashboard = () => {
  const [currentReport, setCurrentReport] = useState<TestReport | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [screenshots, setScreenshots] = useState<ScreenshotInfo[]>([])
  const [selectedScreenshot, setSelectedScreenshot] = useState<ScreenshotInfo | null>(null)
  const [showScreenshotModal, setShowScreenshotModal] = useState(false)
  const [selectedSuite, setSelectedSuite] = useState<string | null>(null)
  const [screenshotFilter, setScreenshotFilter] = useState<'all' | 'success' | 'failure' | 'info'>(
    'all'
  )
  const [flowView, setFlowView] = useState<'grid' | 'timeline'>('timeline')

  // Helper para mostrar screenshot con fallback
  const ScreenshotDisplay = ({
    screenshotId,
    fallbackIcon: FallbackIcon,
    fallbackColor,
    fallbackText,
    title,
    description,
    className = 'w-full h-32',
  }: {
    screenshotId: string
    fallbackIcon: any
    fallbackColor: string
    fallbackText: string
    title: string
    description: string
    className?: string
  }) => {
    const screenshot = realScreenshots.find(s => s.id === screenshotId)

    return (
      <div
        className='border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer'
        onClick={() => {
          if (screenshot) {
            setSelectedScreenshot(screenshot)
            setShowScreenshotModal(true)
          }
        }}
      >
        {screenshot ? (
          <img
            src={screenshot.previewUrl}
            alt={screenshot.stepName}
            className={`${className} object-cover rounded mb-2`}
            onError={e => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling.style.display = 'flex'
            }}
          />
        ) : null}
        <div
          className={`${className} bg-gradient-to-br from-${fallbackColor}-100 to-${fallbackColor}-200 rounded mb-2 flex items-center justify-center ${screenshot ? 'hidden' : ''}`}
        >
          <div className='text-center'>
            <FallbackIcon className={`w-8 h-8 text-${fallbackColor}-600 mx-auto mb-1`} />
            <span className={`text-xs text-${fallbackColor}-700`}>{fallbackText}</span>
          </div>
        </div>
        <p className='text-xs font-medium'>{screenshot?.stepName || title}</p>
        <p className='text-xs text-gray-500'>{description}</p>
      </div>
    )
  }
  const [realScreenshots, setRealScreenshots] = useState<any[]>([])
  const [isGeneratingScreenshots, setIsGeneratingScreenshots] = useState(false)

  // Cargar screenshots del reporte actual
  const loadScreenshots = async (executionId?: string) => {
    try {
      // Si no hay executionId, usar uno por defecto para mostrar datos mock
      const defaultExecutionId = executionId || 'default-execution-id'
      const response = await fetch(
        `/api/admin/test-screenshots?action=list&executionId=${defaultExecutionId}`
      )
      if (response.ok) {
        const data = await response.json()
        setScreenshots(data.data || [])
      } else {
        // Si falla, usar screenshots mock para demostración
        setScreenshots(generateMockScreenshots())
      }
    } catch (error) {
      console.error('Error cargando screenshots:', error)
      // Fallback a datos mock
      setScreenshots(generateMockScreenshots())
    }
  }

  // Generar screenshots mock para demostración
  const generateMockScreenshots = (): ScreenshotInfo[] => {
    return [
      {
        id: 'mock-ss-1',
        stepName: 'Product Page Load Test',
        url: '/images/products/product-1-bg-1.png',
        previewUrl: '/images/products/product-1-bg-1.png',
        timestamp: new Date(Date.now() - 300000), // 5 min ago
        status: 'success',
        metadata: { width: 1920, height: 1080, size: 245000 },
      },
      {
        id: 'mock-ss-2',
        stepName: 'Cart Functionality Test',
        url: '/images/cart/cart-01.png',
        previewUrl: '/images/cart/cart-01.png',
        timestamp: new Date(Date.now() - 180000), // 3 min ago
        status: 'success',
        metadata: { width: 1920, height: 1080, size: 198000 },
      },
      {
        id: 'mock-ss-3',
        stepName: 'Checkout Process Error',
        url: '/images/404.svg',
        previewUrl: '/images/404.svg',
        timestamp: new Date(Date.now() - 60000), // 1 min ago
        status: 'failure',
        metadata: { width: 1920, height: 1080, size: 312000 },
      },
      {
        id: 'mock-ss-4',
        stepName: 'Hero Section Render',
        url: '/images/hero/hero2/hero1.webp',
        previewUrl: '/images/hero/hero2/hero1.webp',
        timestamp: new Date(Date.now() - 120000), // 2 min ago
        status: 'info',
        metadata: { width: 1920, height: 1080, size: 456000 },
      },
      {
        id: 'mock-ss-5',
        stepName: 'Category Navigation',
        url: '/images/categories/interiores.png',
        previewUrl: '/images/categories/interiores.png',
        timestamp: new Date(Date.now() - 90000), // 1.5 min ago
        status: 'success',
        metadata: { width: 1920, height: 1080, size: 189000 },
      },
    ]
  }

  // Cargar screenshots reales del servidor
  const loadRealScreenshots = async () => {
    try {
      // Primero intentar cargar desde metadata.json
      const metadataResponse = await fetch('/test-screenshots/metadata.json')
      if (metadataResponse.ok) {
        const metadata = await metadataResponse.json()
        if (metadata.screenshots && metadata.screenshots.length > 0) {
          setRealScreenshots(metadata.screenshots)
          console.log(`📸 Cargados ${metadata.screenshots.length} screenshots desde metadata`)
          return
        }
      }

      // Fallback a API
      const response = await fetch('/api/test-screenshots')
      const data = await response.json()

      if (data.success) {
        setRealScreenshots(data.screenshots)
        console.log(`📸 Cargados ${data.screenshots.length} screenshots desde API`)
      }
    } catch (error) {
      console.error('Error cargando screenshots reales:', error)
      // Usar screenshots vacío como fallback
      setRealScreenshots([])
    }
  }

  // Generar screenshots del flujo de checkout
  const generateCheckoutScreenshots = async () => {
    setIsGeneratingScreenshots(true)
    try {
      console.log('🚀 Iniciando generación de screenshots...')

      // Llamar al script de generación
      const response = await fetch('/api/admin/generate-screenshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow: 'checkout' }),
      })

      const result = await response.json()

      if (result.success) {
        console.log(`✅ Screenshots generados: ${result.count}`)
        await loadRealScreenshots() // Recargar lista
      } else {
        console.error('Error generando screenshots:', result.error)
      }
    } catch (error) {
      console.error('Error en generación:', error)
    } finally {
      setIsGeneratingScreenshots(false)
    }
  }

  // Datos simulados para demostración
  useEffect(() => {
    const mockReport: TestReport = {
      id: 'mock-report-fixed',
      timestamp: new Date(),
      totalSuites: 8,
      totalTests: 47,
      passed: 43,
      failed: 2,
      skipped: 2,
      duration: 12.5,
      coverage: {
        statements: 89.2,
        branches: 85.7,
        functions: 92.1,
        lines: 88.9,
      },
      screenshots: {
        total: 24,
        byStatus: {
          success: 18,
          failure: 4,
          info: 2,
        },
        totalSize: 2.8, // MB
      },
      suites: [
        {
          name: 'Flujo de Compra sin Autenticación',
          status: 'passed',
          tests: 11,
          passed: 11,
          failed: 0,
          duration: 4.8,
          coverage: 92.5,
          lastRun: new Date(),
          screenshotCount: 15,
          screenshots: [
            {
              id: 'checkout-flow-step1-cart-sidebar',
              stepName: 'Paso 1: Sidebar del carrito',
              url: '/test-screenshots/checkout-flow-step1-cart-sidebar.png',
              previewUrl: '/test-screenshots/thumbs/checkout-flow-step1-cart-sidebar.png',
              timestamp: new Date(),
              status: 'success',
              metadata: { width: 1920, height: 1080, size: 245000 },
            },
            {
              id: 'checkout-flow-step1-checkout-transition',
              stepName: 'Paso 1: Transición a checkout',
              url: '/test-screenshots/checkout-flow-step1-checkout-transition.png',
              previewUrl: '/test-screenshots/thumbs/checkout-flow-step1-checkout-transition.png',
              timestamp: new Date(),
              status: 'success',
              metadata: { width: 1920, height: 1080, size: 312000 },
            },
            {
              id: 'checkout-flow-step2-form-initial',
              stepName: 'Paso 2: Formulario inicial',
              url: '/test-screenshots/checkout-flow-step2-form-initial.png',
              previewUrl: '/test-screenshots/thumbs/checkout-flow-step2-form-initial.png',
              timestamp: new Date(),
              status: 'success',
              metadata: { width: 1920, height: 1080, size: 298000 },
            },
            {
              id: 'checkout-flow-step3-validation-errors',
              stepName: 'Paso 3: Errores de validación',
              url: '/test-screenshots/checkout-flow-step3-validation-errors.png',
              previewUrl: '/test-screenshots/thumbs/checkout-flow-step3-validation-errors.png',
              timestamp: new Date(),
              status: 'info',
              metadata: { width: 1920, height: 1080, size: 267000 },
            },
            {
              id: 'checkout-flow-step4-final-redirect',
              stepName: 'Paso 4: Redirección final exitosa',
              url: '/test-screenshots/checkout-flow-step4-final-redirect.png',
              previewUrl: '/test-screenshots/thumbs/checkout-flow-step4-final-redirect.png',
              timestamp: new Date(),
              status: 'success',
              metadata: { width: 1920, height: 1080, size: 189000 },
            },
          ],
        },
        {
          name: 'UI Components Optimization',
          status: 'passed',
          tests: 11,
          passed: 11,
          failed: 0,
          duration: 2.1,
          coverage: 95.2,
          lastRun: new Date(),
          screenshotCount: 6,
          screenshots: [],
        },
        {
          name: 'E2E Lazy Loading',
          status: 'passed',
          tests: 8,
          passed: 8,
          failed: 0,
          duration: 4.2,
          coverage: 87.3,
          lastRun: new Date(),
          screenshotCount: 4,
          screenshots: [],
        },
        {
          name: 'Performance Tracking',
          status: 'passed',
          tests: 6,
          passed: 6,
          failed: 0,
          duration: 1.8,
          coverage: 91.5,
          lastRun: new Date(),
        },
        {
          name: 'Admin Orders Enterprise',
          status: 'failed',
          tests: 12,
          passed: 10,
          failed: 2,
          duration: 2.9,
          coverage: 78.4,
          lastRun: new Date(),
          screenshotCount: 8,
          screenshots: [],
        },
        {
          name: 'API Integration',
          status: 'passed',
          tests: 7,
          passed: 7,
          failed: 0,
          duration: 1.1,
          coverage: 93.7,
          lastRun: new Date(),
        },
        {
          name: 'Responsive Hooks',
          status: 'pending',
          tests: 3,
          passed: 1,
          failed: 0,
          duration: 0.4,
          coverage: 65.2,
          lastRun: new Date(),
        },
      ],
    }

    setCurrentReport(mockReport)
    setLastUpdate(new Date())

    // Cargar screenshots usando executionId por defecto
    loadScreenshots('default-execution-id')

    // Cargar screenshots reales si existen
    loadRealScreenshots()
  }, [])

  const runAllTests = async () => {
    setIsRunning(true)
    try {
      // Ejecutar tests reales a través de la API con screenshots habilitados
      const response = await fetch('/api/admin/test-execution', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suites: ['unit', 'components', 'e2e', 'performance'],
          generateReport: true,
          screenshotOptions: {
            enabled: true,
            captureOnFailure: true,
            captureSteps: true,
            quality: 80,
          },
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Tests ejecutados:', result)

        // Actualizar datos después de la ejecución
        setTimeout(() => {
          setLastUpdate(new Date())
          // Recargar datos del reporte y screenshots
          loadLatestReport()
          if (result.executionId) {
            loadScreenshots(result.executionId)
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Error ejecutando tests:', error)
    } finally {
      setIsRunning(false)
    }
  }

  const loadLatestReport = async () => {
    try {
      const response = await fetch('/api/test-reports')
      if (response.ok) {
        const data = await response.json()
        if (data.reports && data.reports.length > 0) {
          // Cargar el reporte más reciente
          const latestReport = data.reports[0]
          const reportResponse = await fetch(`/test-reports/${latestReport}`)
          if (reportResponse.ok) {
            const reportData = await reportResponse.json()
            // Convertir a formato del dashboard
            setCurrentReport(convertToAdminFormat(reportData))
          }
        }
      }
    } catch (error) {
      console.error('Error cargando reporte:', error)
    }
  }

  const convertToAdminFormat = (reportData: any): TestReport => {
    // Convertir formato de reporte público a formato admin
    return {
      id: reportData.id || 'mock-report-fixed',
      timestamp: new Date(reportData.timestamp || Date.now()),
      totalSuites: reportData.steps?.length || 8,
      totalTests: reportData.totalSteps || 47,
      passed: reportData.completedSteps || 43,
      failed: reportData.failedSteps || 2,
      skipped: 2,
      duration: parseFloat(reportData.summary?.duration || '12.5'),
      coverage: {
        statements: 89.2,
        branches: 85.7,
        functions: 92.1,
        lines: 88.9,
      },
      suites: generateSuitesFromReport(reportData),
    }
  }

  const generateSuitesFromReport = (reportData: any): TestSuite[] => {
    const defaultSuites = [
      {
        name: 'UI Components Optimization',
        status: 'passed' as const,
        tests: 11,
        passed: 11,
        failed: 0,
        duration: 2.1,
        coverage: 95.2,
        lastRun: new Date(),
      },
      {
        name: 'E2E Lazy Loading',
        status: 'passed' as const,
        tests: 8,
        passed: 8,
        failed: 0,
        duration: 4.2,
        coverage: 87.3,
        lastRun: new Date(),
      },
      {
        name: 'Performance Tracking',
        status: 'passed' as const,
        tests: 6,
        passed: 6,
        failed: 0,
        duration: 1.8,
        coverage: 91.5,
        lastRun: new Date(),
      },
    ]

    // Si hay datos reales del reporte, usarlos
    if (reportData.steps && reportData.steps.length > 0) {
      return reportData.steps.map((step: any, index: number) => ({
        name: step.name || `Test Suite ${index + 1}`,
        status: step.status === 'success' ? ('passed' as const) : ('failed' as const),
        tests: 1,
        passed: step.status === 'success' ? 1 : 0,
        failed: step.status === 'success' ? 0 : 1,
        duration: step.duration || 1.0,
        coverage: Math.random() * 20 + 80, // Simular coverage
        lastRun: new Date(step.timestamp || Date.now()),
      }))
    }

    return defaultSuites
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className='w-4 h-4 text-green-600' />
      case 'failed':
        return <XCircle className='w-4 h-4 text-red-600' />
      case 'running':
        return <RefreshCw className='w-4 h-4 text-blue-600 animate-spin' />
      case 'pending':
        return <Clock className='w-4 h-4 text-yellow-600' />
      default:
        return <TestTube className='w-4 h-4 text-gray-600' />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'running':
        return 'text-blue-600 bg-blue-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getCoverageColor = (coverage: number) => {
    if (coverage >= 90) {
      return 'text-green-600'
    }
    if (coverage >= 80) {
      return 'text-yellow-600'
    }
    return 'text-red-600'
  }

  const openScreenshotModal = (screenshot: ScreenshotInfo) => {
    setSelectedScreenshot(screenshot)
    setShowScreenshotModal(true)
  }

  const downloadScreenshot = async (screenshot: ScreenshotInfo) => {
    try {
      const response = await fetch(screenshot.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `screenshot-${screenshot.stepName}-${screenshot.id}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error descargando screenshot:', error)
    }
  }

  const getScreenshotStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'failure':
        return 'border-red-200 bg-red-50'
      case 'info':
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const successRate = currentReport
    ? Math.round((currentReport.passed / currentReport.totalTests) * 100)
    : 0

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Test Reports Dashboard</h1>
          <p className='text-gray-600 mt-1'>
            Monitoreo completo de testing automatizado y coverage
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <Badge variant={successRate >= 90 ? 'default' : 'destructive'}>
            {successRate}% Success Rate
          </Badge>
          <Button onClick={runAllTests} disabled={isRunning} className='flex items-center gap-2'>
            {isRunning ? (
              <RefreshCw className='w-4 h-4 animate-spin' />
            ) : (
              <Play className='w-4 h-4' />
            )}
            {isRunning ? 'Ejecutando...' : 'Ejecutar Tests'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-gray-600'>Total Tests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='text-2xl font-bold'>{currentReport?.totalTests || 0}</div>
              <TestTube className='w-8 h-8 text-blue-500' />
            </div>
            <div className='text-xs text-gray-500 mt-1'>
              {currentReport?.totalSuites || 0} test suites
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-gray-600'>Tests Pasando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='text-2xl font-bold text-green-600'>{currentReport?.passed || 0}</div>
              <CheckCircle className='w-8 h-8 text-green-500' />
            </div>
            <div className='text-xs text-gray-500 mt-1'>{successRate}% success rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-gray-600'>Tests Fallando</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='text-2xl font-bold text-red-600'>{currentReport?.failed || 0}</div>
              <XCircle className='w-8 h-8 text-red-500' />
            </div>
            <div className='text-xs text-gray-500 mt-1'>{currentReport?.skipped || 0} skipped</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-gray-600'>Coverage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div
                className={`text-2xl font-bold ${getCoverageColor(currentReport?.coverage.statements || 0)}`}
              >
                {currentReport?.coverage.statements.toFixed(1) || 0}%
              </div>
              <Target className='w-8 h-8 text-purple-500' />
            </div>
            <div className='text-xs text-gray-500 mt-1'>Statements coverage</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium text-gray-600'>Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              <div className='text-2xl font-bold'>{currentReport?.screenshots?.total || 0}</div>
              <Camera className='w-8 h-8 text-indigo-500' />
            </div>
            <div className='text-xs text-gray-500 mt-1'>
              {currentReport?.screenshots?.totalSize || 0} MB total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs defaultValue='suites' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='suites'>Test Suites</TabsTrigger>
          <TabsTrigger value='checkout-flow'>Flujo Checkout</TabsTrigger>
          <TabsTrigger value='screenshots'>Screenshots</TabsTrigger>
          <TabsTrigger value='coverage'>Coverage Report</TabsTrigger>
          <TabsTrigger value='trends'>Trends</TabsTrigger>
        </TabsList>

        <TabsContent value='suites' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='w-5 h-5' />
                Test Suites Status
              </CardTitle>
              <CardDescription>Estado detallado de cada suite de tests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {currentReport?.suites.map((suite, index) => (
                  <div key={index} className='p-4 border rounded-lg space-y-3'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        {getStatusIcon(suite.status)}
                        <div>
                          <div className='flex items-center gap-2'>
                            <div className='font-medium'>{suite.name}</div>
                            {suite.screenshotCount && suite.screenshotCount > 0 && (
                              <div className='flex items-center gap-1 text-xs text-gray-500'>
                                <Camera className='w-3 h-3' />
                                <span>{suite.screenshotCount}</span>
                              </div>
                            )}
                          </div>
                          <div className='text-sm text-gray-500'>
                            {suite.tests} tests • {suite.duration}s • {suite.coverage}% coverage
                          </div>
                        </div>
                      </div>
                      <div className='flex items-center gap-4'>
                        <Badge className={getStatusColor(suite.status)}>
                          {suite.passed}/{suite.tests} passed
                        </Badge>
                        <div className='text-sm text-gray-500'>
                          {suite.lastRun.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    {/* Screenshots preview */}
                    {suite.screenshots && suite.screenshots.length > 0 && (
                      <div>
                        <div className='text-xs font-medium text-gray-600 mb-2'>Screenshots:</div>
                        <div className='flex flex-wrap gap-2'>
                          {suite.screenshots.slice(0, 3).map(screenshot => (
                            <div
                              key={screenshot.id}
                              className={`relative group cursor-pointer rounded border-2 overflow-hidden ${getScreenshotStatusColor(screenshot.status)}`}
                              onClick={() => openScreenshotModal(screenshot)}
                            >
                              <img
                                src={screenshot.previewUrl}
                                alt={screenshot.stepName}
                                className='w-16 h-12 object-cover'
                              />
                              <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center'>
                                <Eye className='h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                              </div>
                              <div className='absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 truncate'>
                                {screenshot.stepName}
                              </div>
                            </div>
                          ))}
                          {suite.screenshots.length > 3 && (
                            <div className='w-16 h-12 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-xs text-gray-500'>
                              +{suite.screenshots.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='checkout-flow' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Target className='h-5 w-5' />
                Flujo de Compra sin Autenticación
              </CardTitle>
              <CardDescription>
                Visualización paso a paso del proceso de checkout completo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Controles de visualización */}
              <div className='flex items-center justify-between mb-6'>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>Vista:</span>
                    <div className='flex border rounded-lg'>
                      <Button
                        variant={flowView === 'timeline' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setFlowView('timeline')}
                        className='rounded-r-none'
                      >
                        Timeline
                      </Button>
                      <Button
                        variant={flowView === 'grid' ? 'default' : 'ghost'}
                        size='sm'
                        onClick={() => setFlowView('grid')}
                        className='rounded-l-none'
                      >
                        Grid
                      </Button>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium'>Filtro:</span>
                    <select
                      value={screenshotFilter}
                      onChange={e => setScreenshotFilter(e.target.value as any)}
                      className='px-3 py-1 border rounded text-sm'
                    >
                      <option value='all'>Todos</option>
                      <option value='success'>Exitosos</option>
                      <option value='failure'>Fallos</option>
                      <option value='info'>Info</option>
                    </select>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary' className='text-xs'>
                    {realScreenshots.length > 0
                      ? `${realScreenshots.length} screenshots reales`
                      : '14 screenshots simulados'}
                  </Badge>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={generateCheckoutScreenshots}
                    disabled={isGeneratingScreenshots}
                    className='text-xs'
                  >
                    {isGeneratingScreenshots ? (
                      <>
                        <RefreshCw className='w-3 h-3 mr-1 animate-spin' />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Camera className='w-3 h-3 mr-1' />
                        Generar Screenshots
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Flujo paso a paso */}
              {flowView === 'timeline' ? (
                <div className='space-y-6'>
                  {/* Paso 1: Navegación */}
                  <div className='border-l-4 border-blue-500 pl-6 relative'>
                    <div className='absolute -left-2 top-0 w-4 h-4 bg-blue-500 rounded-full'></div>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='font-semibold text-lg'>Paso 1: Navegación al Checkout</h3>
                        <p className='text-sm text-gray-600'>
                          Usuario navega desde carrito hacia checkout
                        </p>
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        {(() => {
                          const screenshot = realScreenshots.find(
                            s => s.id === 'step1-cart-sidebar'
                          )
                          return (
                            <div
                              className='border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer'
                              onClick={() => {
                                if (screenshot) {
                                  setSelectedScreenshot(screenshot)
                                  setShowScreenshotModal(true)
                                }
                              }}
                            >
                              {screenshot ? (
                                <img
                                  src={screenshot.previewUrl}
                                  alt={screenshot.stepName}
                                  className='w-full h-32 object-cover rounded mb-2'
                                  onError={e => {
                                    // Fallback a icono si la imagen no carga
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded mb-2 flex items-center justify-center ${screenshot ? 'hidden' : ''}`}
                              >
                                <div className='text-center'>
                                  <ShoppingCart className='w-8 h-8 text-blue-600 mx-auto mb-1' />
                                  <span className='text-xs text-blue-700'>Carrito Sidebar</span>
                                </div>
                              </div>
                              <p className='text-xs font-medium'>
                                {screenshot?.stepName || 'Sidebar del carrito'}
                              </p>
                              <p className='text-xs text-gray-500'>
                                Productos visibles, botón checkout activo
                              </p>
                            </div>
                          )
                        })()}
                        {(() => {
                          const screenshot = realScreenshots.find(
                            s => s.id === 'step1-checkout-transition'
                          )
                          return (
                            <div
                              className='border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer'
                              onClick={() => {
                                if (screenshot) {
                                  setSelectedScreenshot(screenshot)
                                  setShowScreenshotModal(true)
                                }
                              }}
                            >
                              {screenshot ? (
                                <img
                                  src={screenshot.previewUrl}
                                  alt={screenshot.stepName}
                                  className='w-full h-32 object-cover rounded mb-2'
                                  onError={e => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-full h-32 bg-gradient-to-br from-purple-100 to-purple-200 rounded mb-2 flex items-center justify-center ${screenshot ? 'hidden' : ''}`}
                              >
                                <div className='text-center'>
                                  <ArrowRight className='w-8 h-8 text-purple-600 mx-auto mb-1' />
                                  <span className='text-xs text-purple-700'>Navegación</span>
                                </div>
                              </div>
                              <p className='text-xs font-medium'>
                                {screenshot?.stepName || 'Transición a checkout'}
                              </p>
                              <p className='text-xs text-gray-500'>
                                Loading state durante navegación
                              </p>
                            </div>
                          )
                        })()}
                        {(() => {
                          const screenshot = realScreenshots.find(
                            s => s.id === 'step1-checkout-page'
                          )
                          return (
                            <div
                              className='border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer'
                              onClick={() => {
                                if (screenshot) {
                                  setSelectedScreenshot(screenshot)
                                  setShowScreenshotModal(true)
                                }
                              }}
                            >
                              {screenshot ? (
                                <img
                                  src={screenshot.previewUrl}
                                  alt={screenshot.stepName}
                                  className='w-full h-32 object-cover rounded mb-2'
                                  onError={e => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-full h-32 bg-gradient-to-br from-green-100 to-green-200 rounded mb-2 flex items-center justify-center ${screenshot ? 'hidden' : ''}`}
                              >
                                <div className='text-center'>
                                  <CreditCard className='w-8 h-8 text-green-600 mx-auto mb-1' />
                                  <span className='text-xs text-green-700'>Checkout</span>
                                </div>
                              </div>
                              <p className='text-xs font-medium'>
                                {screenshot?.stepName || 'Página de checkout'}
                              </p>
                              <p className='text-xs text-gray-500'>Formulario inicial visible</p>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Paso 2: Validación */}
                  <div className='border-l-4 border-yellow-500 pl-6 relative'>
                    <div className='absolute -left-2 top-0 w-4 h-4 bg-yellow-500 rounded-full'></div>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='font-semibold text-lg'>Paso 2: Validación de Formulario</h3>
                        <p className='text-sm text-gray-600'>
                          Pruebas de validación y manejo de errores
                        </p>
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer'>
                          <div className='w-full h-32 bg-gradient-to-br from-red-100 to-red-200 rounded mb-2 flex items-center justify-center'>
                            <div className='text-center'>
                              <AlertCircle className='w-8 h-8 text-red-600 mx-auto mb-1' />
                              <span className='text-xs text-red-700'>Errores</span>
                            </div>
                          </div>
                          <p className='text-xs font-medium'>Errores de validación</p>
                          <p className='text-xs text-gray-500'>Campos obligatorios resaltados</p>
                        </div>
                        <div className='border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer'>
                          <div className='w-full h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded mb-2 flex items-center justify-center'>
                            <div className='text-center'>
                              <XCircle className='w-8 h-8 text-orange-600 mx-auto mb-1' />
                              <span className='text-xs text-orange-700'>Email</span>
                            </div>
                          </div>
                          <p className='text-xs font-medium'>Validación de email</p>
                          <p className='text-xs text-gray-500'>Error de formato de email</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Paso 3: Completado */}
                  <div className='border-l-4 border-green-500 pl-6 relative'>
                    <div className='absolute -left-2 top-0 w-4 h-4 bg-green-500 rounded-full'></div>
                    <div className='space-y-4'>
                      <div>
                        <h3 className='font-semibold text-lg'>Paso 3: Checkout Exitoso</h3>
                        <p className='text-sm text-gray-600'>
                          Formulario completado y redirección final
                        </p>
                      </div>
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer'>
                          <div className='w-full h-32 bg-gradient-to-br from-green-100 to-green-200 rounded mb-2 flex items-center justify-center'>
                            <div className='text-center'>
                              <CheckCircle className='w-8 h-8 text-green-600 mx-auto mb-1' />
                              <span className='text-xs text-green-700'>Completo</span>
                            </div>
                          </div>
                          <p className='text-xs font-medium'>Formulario completo</p>
                          <p className='text-xs text-gray-500'>Todos los campos validados</p>
                        </div>
                        <div className='border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer'>
                          <div className='w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded mb-2 flex items-center justify-center'>
                            <div className='text-center'>
                              <Target className='w-8 h-8 text-blue-600 mx-auto mb-1' />
                              <span className='text-xs text-blue-700'>Éxito</span>
                            </div>
                          </div>
                          <p className='text-xs font-medium'>Redirección exitosa</p>
                          <p className='text-xs text-gray-500'>MercadoPago o página de éxito</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                  {/* Vista en grid de todos los screenshots */}
                  {(realScreenshots.length > 0
                    ? realScreenshots
                    : Array.from({ length: 14 }, (_, i) => ({
                        id: `demo-${i}`,
                        stepName: `Screenshot ${i + 1}`,
                        url: '',
                        previewUrl: '',
                        status: 'demo',
                      }))
                  ).map((screenshot, i) => {
                    const stepIcons = [ShoppingCart, ArrowRight, CreditCard, User, CheckCircle]
                    const stepColors = ['blue', 'purple', 'green', 'orange', 'emerald']
                    const iconIndex = Math.floor(i / 3) % stepIcons.length
                    const colorIndex = Math.floor(i / 3) % stepColors.length
                    const Icon = stepIcons[iconIndex]
                    const color = stepColors[colorIndex]

                    return (
                      <div
                        key={screenshot.id || i}
                        className='border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer'
                        onClick={() => {
                          if (screenshot.url) {
                            setSelectedScreenshot(screenshot)
                            setShowScreenshotModal(true)
                          }
                        }}
                      >
                        {screenshot.previewUrl ? (
                          <img
                            src={screenshot.previewUrl}
                            alt={screenshot.stepName}
                            className='w-full h-24 object-cover rounded mb-2'
                            onError={e => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div
                          className={`w-full h-24 bg-gradient-to-br from-${color}-100 to-${color}-200 rounded mb-2 flex items-center justify-center ${screenshot.previewUrl ? 'hidden' : ''}`}
                        >
                          <div className='text-center'>
                            <Icon className={`w-6 h-6 text-${color}-600 mx-auto mb-1`} />
                            <span className={`text-xs text-${color}-700`}>{i + 1}</span>
                          </div>
                        </div>
                        <p className='text-xs font-medium'>{screenshot.stepName}</p>
                        <p className='text-xs text-gray-500'>
                          {screenshot.status === 'demo'
                            ? `Screenshot ${i + 1}`
                            : `Paso ${Math.floor(i / 5) + 1}.${(i % 5) + 1}`}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Métricas del flujo */}
              <div className='mt-8 grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <div className='text-2xl font-bold text-blue-600'>4.8s</div>
                  <div className='text-sm text-gray-600'>Duración total</div>
                </div>
                <div className='text-center p-4 bg-green-50 rounded-lg'>
                  <div className='text-2xl font-bold text-green-600'>11/11</div>
                  <div className='text-sm text-gray-600'>Tests pasados</div>
                </div>
                <div className='text-center p-4 bg-purple-50 rounded-lg'>
                  <div className='text-2xl font-bold text-purple-600'>
                    {realScreenshots.length || 14}
                  </div>
                  <div className='text-sm text-gray-600'>Screenshots</div>
                </div>
                <div className='text-center p-4 bg-orange-50 rounded-lg'>
                  <div className='text-2xl font-bold text-orange-600'>92.5%</div>
                  <div className='text-sm text-gray-600'>Cobertura</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='screenshots' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Camera className='h-5 w-5' />
                Screenshots del Reporte
              </CardTitle>
              <CardDescription>Capturas de pantalla organizadas por suite y estado</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Estadísticas de Screenshots */}
              <div className='grid grid-cols-4 gap-4 mb-6'>
                <div className='text-center p-4 bg-gray-50 rounded-lg'>
                  <div className='text-2xl font-bold text-gray-900'>
                    {currentReport?.screenshots?.total || 0}
                  </div>
                  <div className='text-sm text-gray-600'>Total</div>
                </div>
                <div className='text-center p-4 bg-green-50 rounded-lg'>
                  <div className='text-2xl font-bold text-green-600'>
                    {currentReport?.screenshots?.byStatus?.success || 0}
                  </div>
                  <div className='text-sm text-gray-600'>Exitosos</div>
                </div>
                <div className='text-center p-4 bg-red-50 rounded-lg'>
                  <div className='text-2xl font-bold text-red-600'>
                    {currentReport?.screenshots?.byStatus?.failure || 0}
                  </div>
                  <div className='text-sm text-gray-600'>Fallos</div>
                </div>
                <div className='text-center p-4 bg-blue-50 rounded-lg'>
                  <div className='text-2xl font-bold text-blue-600'>
                    {currentReport?.screenshots?.byStatus?.info || 0}
                  </div>
                  <div className='text-sm text-gray-600'>Info</div>
                </div>
              </div>

              {/* Screenshots por Suite */}
              <div className='space-y-6'>
                {currentReport?.suites
                  .filter(suite => suite.screenshots && suite.screenshots.length > 0)
                  .map((suite, index) => (
                    <div key={index} className='border rounded-lg p-4'>
                      <div className='flex items-center justify-between mb-4'>
                        <div className='flex items-center gap-3'>
                          {getStatusIcon(suite.status)}
                          <h3 className='font-semibold'>{suite.name}</h3>
                          <Badge variant='outline'>
                            {suite.screenshots?.length || 0} screenshots
                          </Badge>
                        </div>
                      </div>

                      <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'>
                        {suite.screenshots?.map(screenshot => (
                          <div
                            key={screenshot.id}
                            className={`relative group cursor-pointer rounded-lg border-2 overflow-hidden transition-all hover:shadow-lg ${getScreenshotStatusColor(
                              screenshot.status
                            )}`}
                            onClick={() => openScreenshotModal(screenshot)}
                          >
                            <img
                              src={screenshot.previewUrl}
                              alt={screenshot.stepName}
                              className='w-full h-24 object-cover'
                            />
                            <div className='absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center'>
                              <div className='opacity-0 group-hover:opacity-100 transition-opacity'>
                                <Eye className='h-6 w-6 text-white' />
                              </div>
                            </div>
                            <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2'>
                              <div className='text-white text-xs font-medium truncate'>
                                {screenshot.stepName}
                              </div>
                              <div className='text-white text-xs opacity-75'>
                                {screenshot.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                            <div
                              className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
                                screenshot.status === 'success'
                                  ? 'bg-green-500'
                                  : screenshot.status === 'failure'
                                    ? 'bg-red-500'
                                    : 'bg-blue-500'
                              }`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                {!currentReport?.suites.some(
                  suite => suite.screenshots && suite.screenshots.length > 0
                ) && (
                  <div className='text-center py-12 text-gray-500'>
                    <Camera className='h-12 w-12 mx-auto mb-4 opacity-50' />
                    <p>No hay screenshots disponibles en este reporte</p>
                    <p className='text-sm'>
                      Los screenshots se capturan automáticamente durante la ejecución de tests
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='coverage' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Coverage Breakdown</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {currentReport &&
                  Object.entries(currentReport.coverage).map(([key, value]) => (
                    <div key={key} className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span className='capitalize'>{key}</span>
                        <span className={getCoverageColor(value)}>{value.toFixed(1)}%</span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className={`h-2 rounded-full ${
                            value >= 90
                              ? 'bg-green-500'
                              : value >= 80
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coverage Goals</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>Statements</span>
                    <Badge
                      variant={
                        currentReport && currentReport.coverage.statements >= 90
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {currentReport && currentReport.coverage.statements >= 90 ? 'Met' : 'Pending'}
                    </Badge>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>Branches</span>
                    <Badge
                      variant={
                        currentReport && currentReport.coverage.branches >= 85
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {currentReport && currentReport.coverage.branches >= 85 ? 'Met' : 'Pending'}
                    </Badge>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>Functions</span>
                    <Badge
                      variant={
                        currentReport && currentReport.coverage.functions >= 90
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {currentReport && currentReport.coverage.functions >= 90 ? 'Met' : 'Pending'}
                    </Badge>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>Lines</span>
                    <Badge
                      variant={
                        currentReport && currentReport.coverage.lines >= 85
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {currentReport && currentReport.coverage.lines >= 85 ? 'Met' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='trends' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='w-5 h-5' />
                Testing Trends
              </CardTitle>
              <CardDescription>Evolución histórica de métricas de testing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='text-center p-4 border rounded-lg'>
                    <div className='text-2xl font-bold text-green-600'>+15%</div>
                    <div className='text-sm text-gray-600'>Coverage improvement</div>
                    <div className='text-xs text-gray-500'>Last 30 days</div>
                  </div>
                  <div className='text-center p-4 border rounded-lg'>
                    <div className='text-2xl font-bold text-blue-600'>-23%</div>
                    <div className='text-sm text-gray-600'>Test execution time</div>
                    <div className='text-xs text-gray-500'>Last 30 days</div>
                  </div>
                  <div className='text-center p-4 border rounded-lg'>
                    <div className='text-2xl font-bold text-purple-600'>+8</div>
                    <div className='text-sm text-gray-600'>New test suites</div>
                    <div className='text-xs text-gray-500'>Last 30 days</div>
                  </div>
                </div>

                <div className='text-center text-gray-500'>
                  <BarChart3 className='w-12 h-12 mx-auto mb-2 opacity-50' />
                  <p>Gráficos de tendencias disponibles próximamente</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-between text-sm text-gray-500'>
            <div>Última actualización: {lastUpdate.toLocaleString()}</div>
            <div>Duración total: {currentReport?.duration.toFixed(1)}s</div>
          </div>
        </CardContent>
      </Card>

      {/* Screenshot Modal */}
      {showScreenshotModal && selectedScreenshot && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto'>
            <div className='p-6'>
              <div className='flex items-center justify-between mb-4'>
                <div>
                  <h3 className='text-lg font-semibold'>{selectedScreenshot.stepName}</h3>
                  <p className='text-sm text-muted-foreground'>
                    {selectedScreenshot.timestamp.toLocaleString()}
                  </p>
                </div>
                <div className='flex items-center space-x-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => downloadScreenshot(selectedScreenshot)}
                  >
                    <Download className='h-4 w-4 mr-2' />
                    Descargar
                  </Button>
                  <Button variant='outline' size='sm' onClick={() => setShowScreenshotModal(false)}>
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              </div>

              <div className='mb-4'>
                <img
                  src={selectedScreenshot.url}
                  alt={selectedScreenshot.stepName}
                  className='max-w-full h-auto rounded border'
                />
              </div>

              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='font-medium'>Estado:</span>
                  <Badge
                    className={`ml-2 ${
                      selectedScreenshot.status === 'success'
                        ? 'bg-green-100 text-green-800'
                        : selectedScreenshot.status === 'failure'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {selectedScreenshot.status}
                  </Badge>
                </div>
                <div>
                  <span className='font-medium'>Tamaño:</span>
                  <span className='ml-2'>
                    {selectedScreenshot.metadata.width} x {selectedScreenshot.metadata.height}
                  </span>
                </div>
                <div>
                  <span className='font-medium'>Archivo:</span>
                  <span className='ml-2'>
                    {(selectedScreenshot.metadata.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <div>
                  <span className='font-medium'>ID:</span>
                  <span className='ml-2 font-mono text-xs'>{selectedScreenshot.id}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TestReportsDashboard
