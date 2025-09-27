// Configuración para Node.js Runtime
export const runtime = 'nodejs'

// ===================================
// PINTEYA E-COMMERCE - CORE WEB VITALS API
// API específica para análisis y optimización de Core Web Vitals
// ===================================

import { NextRequest, NextResponse } from 'next/server'
import { enhancedSEOOptimizationTools } from '@/lib/seo/seo-optimization-tools'
import { logger, LogCategory, LogLevel } from '@/lib/enterprise/logger'
import { generateCorsHeaders } from '@/lib/security/cors-config'

// ===================================
// GET - Obtener información de Core Web Vitals
// ===================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Core Web Vitals Analysis API',
          description: 'Analyze and optimize Core Web Vitals metrics',
          usage: {
            'GET ?url=https://example.com': 'Analyze Core Web Vitals for specific URL',
            POST: 'Batch analyze multiple URLs',
            PUT: 'Update Core Web Vitals thresholds',
          },
          metrics: {
            LCP: 'Largest Contentful Paint - measures loading performance',
            FID: 'First Input Delay - measures interactivity',
            CLS: 'Cumulative Layout Shift - measures visual stability',
            FCP: 'First Contentful Paint - measures perceived loading speed',
            TTFB: 'Time to First Byte - measures server response time',
            INP: 'Interaction to Next Paint - measures responsiveness',
          },
          thresholds: {
            good: 'Green zone - optimal performance',
            needsImprovement: 'Yellow zone - needs optimization',
            poor: 'Red zone - critical issues',
          },
        },
      })
    }

    // Analizar Core Web Vitals para la URL específica
    const analysis = await enhancedSEOOptimizationTools.analyzeCoreWebVitals(url)

    logger.info(
      LogLevel.INFO,
      'Core Web Vitals analysis completed',
      {
        url,
        overallScore: analysis.overallScore,
      },
      LogCategory.SEO
    )

    return NextResponse.json({
      success: true,
      data: analysis,
    })
  } catch (error) {
    logger.error(LogLevel.ERROR, 'Core Web Vitals API GET error', error as Error, LogCategory.SEO)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze Core Web Vitals',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ===================================
// POST - Análisis batch de múltiples URLs
// ===================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { urls, options } = body

    // Validar parámetros
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'urls array is required and must not be empty',
          example: {
            urls: [
              'https://pinteya.com',
              'https://pinteya.com/products/pintura-interior',
              'https://pinteya.com/categories/pinturas',
            ],
            options: {
              includeOptimizations: true,
              priorityOnly: false,
            },
          },
        },
        { status: 400 }
      )
    }

    // Limitar número de URLs para evitar sobrecarga
    if (urls.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum 10 URLs allowed per batch request',
        },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    // Analizar cada URL
    for (const url of urls) {
      try {
        const analysis = await enhancedSEOOptimizationTools.analyzeCoreWebVitals(url)

        // Filtrar resultados según opciones
        let result = analysis
        if (options?.priorityOnly) {
          result = {
            ...analysis,
            optimizations: analysis.optimizations.filter(
              opt => opt.priority === 'critical' || opt.priority === 'high'
            ),
          }
        }

        if (!options?.includeOptimizations) {
          const { optimizations, ...resultWithoutOptimizations } = result
          result = resultWithoutOptimizations
        }

        results.push(result)
      } catch (error) {
        errors.push({
          url,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    logger.info(
      LogLevel.INFO,
      'Batch Core Web Vitals analysis completed',
      {
        totalUrls: urls.length,
        successfulAnalyses: results.length,
        errors: errors.length,
      },
      LogCategory.SEO
    )

    return NextResponse.json({
      success: true,
      data: {
        results,
        errors,
        summary: {
          totalUrls: urls.length,
          successful: results.length,
          failed: errors.length,
          averageScore:
            results.length > 0
              ? Math.round(results.reduce((sum, r) => sum + r.overallScore, 0) / results.length)
              : 0,
        },
      },
    })
  } catch (error) {
    logger.error(LogLevel.ERROR, 'Core Web Vitals API POST error', error as Error, LogCategory.SEO)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to perform batch analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ===================================
// PUT - Actualizar umbrales de Core Web Vitals
// ===================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { thresholds } = body

    if (!thresholds || typeof thresholds !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'thresholds object is required',
          example: {
            thresholds: {
              lcp: { good: 2.5, needsImprovement: 4.0 },
              fid: { good: 100, needsImprovement: 300 },
              cls: { good: 0.1, needsImprovement: 0.25 },
              fcp: { good: 1.8, needsImprovement: 3.0 },
              ttfb: { good: 600, needsImprovement: 1500 },
              inp: { good: 200, needsImprovement: 500 },
            },
          },
        },
        { status: 400 }
      )
    }

    // Validar estructura de umbrales
    const requiredMetrics = ['lcp', 'fid', 'cls', 'fcp', 'ttfb', 'inp']
    for (const metric of requiredMetrics) {
      if (thresholds[metric]) {
        const threshold = thresholds[metric]
        if (!threshold.good || !threshold.needsImprovement) {
          return NextResponse.json(
            {
              success: false,
              error: `Threshold for ${metric} must have 'good' and 'needsImprovement' values`,
            },
            { status: 400 }
          )
        }

        if (threshold.good >= threshold.needsImprovement) {
          return NextResponse.json(
            {
              success: false,
              error: `For ${metric}, 'good' threshold must be less than 'needsImprovement' threshold`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Actualizar configuración
    enhancedSEOOptimizationTools.configure({
      coreWebVitalsThresholds: thresholds,
    })

    logger.info(
      LogLevel.INFO,
      'Core Web Vitals thresholds updated',
      {
        updatedMetrics: Object.keys(thresholds),
      },
      LogCategory.SEO
    )

    return NextResponse.json({
      success: true,
      data: {
        message: 'Core Web Vitals thresholds updated successfully',
        updatedThresholds: thresholds,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error(LogLevel.ERROR, 'Core Web Vitals API PUT error', error as Error, LogCategory.SEO)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update thresholds',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ===================================
// DELETE - Resetear umbrales a valores por defecto
// ===================================
export async function DELETE(request: NextRequest) {
  try {
    // Resetear a configuración por defecto
    enhancedSEOOptimizationTools.configure({
      coreWebVitalsThresholds: {
        lcp: { good: 2.5, needsImprovement: 4.0 },
        fid: { good: 100, needsImprovement: 300 },
        cls: { good: 0.1, needsImprovement: 0.25 },
        fcp: { good: 1.8, needsImprovement: 3.0 },
        ttfb: { good: 600, needsImprovement: 1500 },
        inp: { good: 200, needsImprovement: 500 },
      },
    })

    logger.info(LogLevel.INFO, 'Core Web Vitals thresholds reset to defaults', {}, LogCategory.SEO)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Core Web Vitals thresholds reset to default values',
        defaultThresholds: {
          lcp: { good: 2.5, needsImprovement: 4.0 },
          fid: { good: 100, needsImprovement: 300 },
          cls: { good: 0.1, needsImprovement: 0.25 },
          fcp: { good: 1.8, needsImprovement: 3.0 },
          ttfb: { good: 600, needsImprovement: 1500 },
          inp: { good: 200, needsImprovement: 500 },
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error(
      LogLevel.ERROR,
      'Core Web Vitals API DELETE error',
      error as Error,
      LogCategory.SEO
    )

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset thresholds',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ===================================
// OPCIONES CORS
// ===================================
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = generateCorsHeaders(origin, 'public')

  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  })
}
