// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - SEO REPORTS API
// API para generación y gestión de reportes SEO
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { EnhancedSEOAnalyticsManager } from '@/lib/seo/seo-analytics-manager'
import { SEOTestingSuite } from '@/lib/seo/seo-testing-suite'
import { DynamicSitemapGenerator } from '@/lib/seo/dynamic-sitemap-generator'
import { SEOOptimizationTools } from '@/lib/seo/seo-optimization-tools'

// ===================================
// INTERFACES
// ===================================

interface ReportRequest {
  type: 'monthly' | 'weekly' | 'custom' | 'audit' | 'keywords' | 'technical'
  dateRange: {
    start: string
    end: string
  }
  urls?: string[]
  includeMetrics?: string[]
  format?: 'json' | 'pdf' | 'csv' | 'excel'
}

interface SEOReport {
  id: string
  type: string
  title: string
  description: string
  dateRange: {
    start: string
    end: string
  }
  generatedAt: string
  status: 'generating' | 'completed' | 'failed'
  data: any
  downloadUrl?: string
  fileSize?: string
}

// ===================================
// GET - OBTENER REPORTES
// ===================================

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list'
    const reportId = searchParams.get('reportId')
    const type = searchParams.get('type')

    switch (action) {
      case 'list':
        return await getReportsList(type)
      case 'get':
        if (!reportId) {
          return NextResponse.json({ error: 'ID de reporte requerido' }, { status: 400 })
        }
        return await getReport(reportId)
      case 'download':
        if (!reportId) {
          return NextResponse.json({ error: 'ID de reporte requerido' }, { status: 400 })
        }
        return await downloadReport(reportId)
      default:
        return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error en SEO Reports API:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ===================================
// POST - GENERAR REPORTES
// ===================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const reportRequest: ReportRequest = await request.json()

    // Validar request
    if (!reportRequest.type || !reportRequest.dateRange) {
      return NextResponse.json(
        { error: 'Tipo de reporte y rango de fechas son requeridos' },
        { status: 400 }
      )
    }

    // Generar reporte según el tipo
    const report = await generateReport(reportRequest)

    return NextResponse.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error generando reporte:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

async function getReportsList(type?: string | null): Promise<NextResponse> {
  try {
    // En una implementación real, esto vendría de la base de datos
    const mockReports: SEOReport[] = [
      {
        id: 'report_001',
        type: 'monthly',
        title: 'Reporte Mensual SEO - Noviembre 2024',
        description: 'Análisis completo de métricas SEO del mes',
        dateRange: {
          start: '2024-11-01',
          end: '2024-11-30',
        },
        generatedAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'completed',
        data: {},
        downloadUrl: '/api/admin/seo/reports?action=download&reportId=report_001',
        fileSize: '2.4 MB',
      },
      {
        id: 'report_002',
        type: 'audit',
        title: 'Auditoría Técnica SEO',
        description: 'Auditoría completa de aspectos técnicos',
        dateRange: {
          start: '2024-11-15',
          end: '2024-11-15',
        },
        generatedAt: new Date(Date.now() - 172800000).toISOString(),
        status: 'completed',
        data: {},
        downloadUrl: '/api/admin/seo/reports?action=download&reportId=report_002',
        fileSize: '1.8 MB',
      },
      {
        id: 'report_003',
        type: 'keywords',
        title: 'Análisis de Keywords',
        description: 'Rendimiento de keywords principales',
        dateRange: {
          start: '2024-11-01',
          end: '2024-11-30',
        },
        generatedAt: new Date().toISOString(),
        status: 'generating',
        data: {},
      },
    ]

    // Filtrar por tipo si se especifica
    const filteredReports = type ? mockReports.filter(report => report.type === type) : mockReports

    return NextResponse.json({
      success: true,
      data: filteredReports,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error obteniendo lista de reportes:', error)
    throw error
  }
}

async function getReport(reportId: string): Promise<NextResponse> {
  try {
    // En una implementación real, esto vendría de la base de datos
    const report = await generateMockReportData(reportId)

    return NextResponse.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error obteniendo reporte:', error)
    throw error
  }
}

async function downloadReport(reportId: string): Promise<NextResponse> {
  try {
    // En una implementación real, esto generaría y devolvería el archivo
    const reportData = await generateMockReportData(reportId)

    // Simular generación de PDF/Excel
    const fileContent = JSON.stringify(reportData, null, 2)

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="seo-report-${reportId}.json"`,
      },
    })
  } catch (error) {
    console.error('Error descargando reporte:', error)
    throw error
  }
}

async function generateReport(request: ReportRequest): Promise<SEOReport> {
  try {
    const reportId = `report_${Date.now()}`

    // Obtener instancias de los managers
    const analyticsManager = SEOAnalyticsManager.getInstance()
    const testingSuite = SEOTestingSuite.getInstance()
    const sitemapGenerator = DynamicSitemapGenerator.getInstance()
    const optimizationTools = SEOOptimizationTools.getInstance()

    let reportData: any = {}
    let title = ''
    let description = ''

    switch (request.type) {
      case 'monthly':
        title = `Reporte Mensual SEO - ${new Date().toLocaleDateString()}`
        description = 'Análisis completo de métricas SEO del mes'
        reportData = await generateMonthlyReport(analyticsManager, request)
        break

      case 'audit':
        title = 'Auditoría Técnica SEO'
        description = 'Auditoría completa de aspectos técnicos'
        reportData = await generateAuditReport(testingSuite, request)
        break

      case 'keywords':
        title = 'Análisis de Keywords'
        description = 'Rendimiento de keywords principales'
        reportData = await generateKeywordsReport(analyticsManager, request)
        break

      case 'technical':
        title = 'Reporte Técnico SEO'
        description = 'Estado técnico del sitio web'
        reportData = await generateTechnicalReport(testingSuite, sitemapGenerator, request)
        break

      default:
        throw new Error('Tipo de reporte no válido')
    }

    const report: SEOReport = {
      id: reportId,
      type: request.type,
      title,
      description,
      dateRange: request.dateRange,
      generatedAt: new Date().toISOString(),
      status: 'completed',
      data: reportData,
      downloadUrl: `/api/admin/seo/reports?action=download&reportId=${reportId}`,
      fileSize: '1.2 MB', // Esto se calcularía en una implementación real
    }

    return report
  } catch (error) {
    console.error('Error generando reporte:', error)
    throw error
  }
}

async function generateMonthlyReport(
  analyticsManager: SEOAnalyticsManager,
  request: ReportRequest
) {
  try {
    const urls = request.urls || ['/']
    const reportData = {
      summary: {
        totalPages: urls.length,
        averageScore: 85,
        organicTraffic: 8920,
        searchImpressions: 125000,
        averagePosition: 3.2,
        ctr: 2.56,
      },
      metrics: {},
      trends: {},
      recommendations: [
        'Optimizar meta descriptions en páginas de productos',
        'Mejorar velocidad de carga en páginas de categorías',
        'Implementar structured data en todas las páginas de productos',
      ],
    }

    // Obtener métricas para cada URL
    for (const url of urls) {
      const metrics = await analyticsManager.getMetrics(url, {
        includePerformance: true,
        includeSearchConsole: true,
        includeConversions: true,
      })
      reportData.metrics[url] = metrics
    }

    return reportData
  } catch (error) {
    console.error('Error generando reporte mensual:', error)
    throw error
  }
}

async function generateAuditReport(testingSuite: SEOTestingSuite, request: ReportRequest) {
  try {
    const urls = request.urls || ['/']

    const reportData = {
      summary: {
        totalTests: 24,
        passed: 18,
        failed: 3,
        warnings: 3,
        overallScore: 82,
      },
      testResults: {},
      issues: [
        'Missing meta description en /products/pintura-interior',
        'Title tag demasiado largo en /categories/pinturas',
        'Falta structured data en páginas de productos',
      ],
      recommendations: [
        'Implementar meta descriptions en todas las páginas',
        'Optimizar longitud de title tags',
        'Agregar Schema.org markup',
      ],
    }

    // Ejecutar tests para cada URL
    for (const url of urls) {
      const testResults = await testingSuite.runComprehensiveTest(url)
      reportData.testResults[url] = testResults
    }

    return reportData
  } catch (error) {
    console.error('Error generando reporte de auditoría:', error)
    throw error
  }
}

async function generateKeywordsReport(
  analyticsManager: SEOAnalyticsManager,
  request: ReportRequest
) {
  try {
    const reportData = {
      summary: {
        totalKeywords: 150,
        topPositions: 25,
        averagePosition: 3.2,
        totalImpressions: 125000,
        totalClicks: 3200,
      },
      topKeywords: [
        { keyword: 'pintura interior', position: 2.1, impressions: 15000, clicks: 450 },
        { keyword: 'pintura exterior', position: 3.5, impressions: 12000, clicks: 320 },
        { keyword: 'esmalte sintético', position: 1.8, impressions: 8500, clicks: 380 },
      ],
      opportunities: [
        'Optimizar para "pintura acrílica" (posición 4.2)',
        'Crear contenido para "barniz madera" (posición 2.9)',
        'Mejorar CTR para "pintura exterior"',
      ],
    }

    return reportData
  } catch (error) {
    console.error('Error generando reporte de keywords:', error)
    throw error
  }
}

async function generateTechnicalReport(
  testingSuite: SEOTestingSuite,
  sitemapGenerator: DynamicSitemapGenerator,
  request: ReportRequest
) {
  try {
    const sitemapStats = await sitemapGenerator.getGenerationStatistics()

    const reportData = {
      sitemap: {
        totalUrls: sitemapStats.totalUrls,
        lastGenerated: sitemapStats.lastGenerated,
        errors: sitemapStats.errors,
        fileSize: '2.4 MB',
      },
      technical: {
        httpsEnabled: true,
        robotsTxtValid: true,
        canonicalTags: 95,
        metaRobots: 98,
        structuredData: 75,
      },
      performance: {
        averageLoadTime: 2.1,
        mobileOptimized: 92,
        coreWebVitals: {
          lcp: 2.1,
          fid: 85,
          cls: 0.08,
        },
      },
      issues: [
        'Algunas páginas sin canonical tags',
        'Structured data faltante en productos',
        'Optimizar imágenes para mejor rendimiento',
      ],
    }

    return reportData
  } catch (error) {
    console.error('Error generando reporte técnico:', error)
    throw error
  }
}

async function generateMockReportData(reportId: string) {
  // Datos mock para el reporte
  return {
    id: reportId,
    title: 'Reporte SEO Detallado',
    summary: {
      overallScore: 85,
      totalPages: 1247,
      organicTraffic: 8920,
      averagePosition: 3.2,
    },
    sections: {
      analytics: {
        pageViews: 45230,
        uniqueVisitors: 12450,
        bounceRate: 42.3,
        avgSessionDuration: 185,
      },
      keywords: {
        totalKeywords: 150,
        topPositions: 25,
        averagePosition: 3.2,
      },
      technical: {
        sitemapUrls: 1247,
        indexedPages: 1180,
        errors: 2,
        warnings: 5,
      },
    },
    recommendations: [
      'Optimizar meta descriptions',
      'Mejorar velocidad de carga',
      'Implementar structured data',
    ],
  }
}
