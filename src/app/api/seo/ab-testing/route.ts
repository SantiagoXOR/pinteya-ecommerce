// ===================================
// PINTEYA E-COMMERCE - A/B TESTING API
// API específica para gestión de A/B tests de metadata SEO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { enhancedSEOOptimizationTools } from '@/lib/seo/seo-optimization-tools';
import { logger, LogCategory, LogLevel } from '@/lib/enterprise/logger';

// ===================================
// GET - Obtener información de A/B tests
// ===================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');
    const action = searchParams.get('action');

    if (testId && action === 'analyze') {
      // Analizar resultados de un test específico
      const results = await enhancedSEOOptimizationTools.analyzeABTestResults(testId);
      
      return NextResponse.json({
        success: true,
        data: results
      });
    }

    if (testId) {
      // Obtener información de un test específico
      const stats = enhancedSEOOptimizationTools.getUsageStats();
      
      return NextResponse.json({
        success: true,
        data: {
          testId,
          message: 'Use POST with action=analyze_ab_test to get detailed results',
          activeTests: stats.activeABTests
        }
      });
    }

    // Obtener estadísticas generales de A/B testing
    const stats = enhancedSEOOptimizationTools.getUsageStats();
    
    return NextResponse.json({
      success: true,
      data: {
        activeTests: stats.activeABTests,
        endpoints: {
          'GET ?testId=xxx': 'Get test info',
          'GET ?testId=xxx&action=analyze': 'Analyze test results',
          'POST': 'Create new A/B test',
          'PUT': 'Update test metrics',
          'DELETE ?testId=xxx': 'Stop/cancel test'
        }
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'A/B testing API GET error', error as Error, LogCategory.SEO);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ===================================
// POST - Crear nuevo A/B test
// ===================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, variants } = body;

    // Validar parámetros requeridos
    if (!name || !url || !variants || !Array.isArray(variants)) {
      return NextResponse.json({
        success: false,
        error: 'name, url, and variants array are required',
        example: {
          name: 'Product Page Title Test',
          url: '/products/pintura-interior',
          variants: [
            {
              name: 'Control',
              metadata: {
                title: 'Pintura Interior - Pinteya',
                description: 'Compra pintura interior de calidad'
              }
            },
            {
              name: 'Variant A',
              metadata: {
                title: 'Pintura Interior Premium - Colores Vibrantes | Pinteya',
                description: 'Descubre nuestra pintura interior premium con colores vibrantes y acabado duradero. ¡Envío gratis!'
              }
            }
          ]
        }
      }, { status: 400 });
    }

    // Validar que cada variante tenga la estructura correcta
    for (const variant of variants) {
      if (!variant.name || !variant.metadata) {
        return NextResponse.json({
          success: false,
          error: 'Each variant must have name and metadata properties'
        }, { status: 400 });
      }
    }

    // Crear el A/B test
    const testId = await enhancedSEOOptimizationTools.createABTest({
      name,
      url,
      variants
    });

    logger.info(LogLevel.INFO, 'A/B test created successfully', {
      testId,
      name,
      url,
      variantsCount: variants.length
    }, LogCategory.SEO);

    return NextResponse.json({
      success: true,
      data: {
        testId,
        message: 'A/B test created successfully',
        name,
        url,
        variants: variants.length,
        status: 'running',
        createdAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'A/B testing API POST error', error as Error, LogCategory.SEO);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create A/B test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ===================================
// PUT - Actualizar métricas de A/B test
// ===================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, variantId, metrics } = body;

    // Validar parámetros requeridos
    if (!testId || !variantId || !metrics) {
      return NextResponse.json({
        success: false,
        error: 'testId, variantId, and metrics are required',
        example: {
          testId: 'ab_test_1234567890_abc123',
          variantId: 'variant_0',
          metrics: {
            impressions: 100,
            clicks: 5,
            conversions: 1,
            revenue: 25.99
          }
        }
      }, { status: 400 });
    }

    // Validar que metrics sea un objeto
    if (typeof metrics !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'metrics must be an object with impressions, clicks, conversions, and/or revenue'
      }, { status: 400 });
    }

    // Actualizar métricas
    await enhancedSEOOptimizationTools.updateABTestMetrics(testId, variantId, metrics);

    logger.info(LogLevel.INFO, 'A/B test metrics updated', {
      testId,
      variantId,
      metrics
    }, LogCategory.SEO);

    return NextResponse.json({
      success: true,
      data: {
        message: 'A/B test metrics updated successfully',
        testId,
        variantId,
        updatedMetrics: metrics,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'A/B testing API PUT error', error as Error, LogCategory.SEO);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update A/B test metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ===================================
// DELETE - Detener/cancelar A/B test
// ===================================
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return NextResponse.json({
        success: false,
        error: 'testId parameter is required'
      }, { status: 400 });
    }

    // En una implementación real, aquí se marcaría el test como cancelado
    // Por ahora, solo registramos la acción
    logger.info(LogLevel.INFO, 'A/B test cancellation requested', {
      testId
    }, LogCategory.SEO);

    return NextResponse.json({
      success: true,
      data: {
        message: 'A/B test cancellation requested',
        testId,
        status: 'cancelled',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'A/B testing API DELETE error', error as Error, LogCategory.SEO);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to cancel A/B test',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ===================================
// OPCIONES CORS
// ===================================
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}









