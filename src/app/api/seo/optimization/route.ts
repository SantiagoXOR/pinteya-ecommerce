// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - SEO OPTIMIZATION API
// API endpoints para herramientas de optimización SEO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { enhancedSEOOptimizationTools } from '@/lib/seo/seo-optimization-tools';
import { logger, LogCategory, LogLevel } from '@/lib/enterprise/logger';

// ===================================
// GET - Obtener estadísticas y configuración
// ===================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const stats = enhancedSEOOptimizationTools.getUsageStats();
        return NextResponse.json({
          success: true,
          data: stats
        });

      case 'recommendations':
        const recommendations = await enhancedSEOOptimizationTools.generateAutomatedRecommendations();
        return NextResponse.json({
          success: true,
          data: recommendations
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'SEO Optimization Tools API',
            version: '1.0.0',
            endpoints: {
              'GET ?action=stats': 'Get usage statistics',
              'GET ?action=recommendations': 'Get automated recommendations',
              'POST': 'Perform SEO analysis',
              'PUT': 'Update configuration',
              'DELETE': 'Clear cache'
            }
          }
        });
    }

  } catch (error) {
    logger.error(LogLevel.ERROR, 'SEO optimization API GET error', error as Error, LogCategory.SEO);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ===================================
// POST - Realizar análisis SEO
// ===================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    let result;

    switch (action) {
      case 'analyze_competitors':
        if (!params.competitors || !Array.isArray(params.competitors)) {
          return NextResponse.json({
            success: false,
            error: 'competitors array is required'
          }, { status: 400 });
        }
        
        result = await enhancedSEOOptimizationTools.analyzeCompetitors(params.competitors);
        break;

      case 'create_ab_test':
        if (!params.name || !params.url || !params.variants) {
          return NextResponse.json({
            success: false,
            error: 'name, url, and variants are required'
          }, { status: 400 });
        }
        
        result = await enhancedSEOOptimizationTools.createABTest({
          name: params.name,
          url: params.url,
          variants: params.variants
        });
        break;

      case 'update_ab_test':
        if (!params.testId || !params.variantId || !params.metrics) {
          return NextResponse.json({
            success: false,
            error: 'testId, variantId, and metrics are required'
          }, { status: 400 });
        }
        
        await enhancedSEOOptimizationTools.updateABTestMetrics(
          params.testId,
          params.variantId,
          params.metrics
        );
        result = { message: 'A/B test metrics updated successfully' };
        break;

      case 'analyze_ab_test':
        if (!params.testId) {
          return NextResponse.json({
            success: false,
            error: 'testId is required'
          }, { status: 400 });
        }
        
        result = await enhancedSEOOptimizationTools.analyzeABTestResults(params.testId);
        break;

      case 'analyze_core_web_vitals':
        if (!params.url) {
          return NextResponse.json({
            success: false,
            error: 'url is required'
          }, { status: 400 });
        }
        
        result = await enhancedSEOOptimizationTools.analyzeCoreWebVitals(params.url);
        break;

      case 'optimize_content':
        if (!params.url || !params.contentType) {
          return NextResponse.json({
            success: false,
            error: 'url and contentType are required'
          }, { status: 400 });
        }
        
        result = await enhancedSEOOptimizationTools.optimizeContent(
          params.url,
          params.contentType
        );
        break;

      case 'technical_audit':
        if (!params.url) {
          return NextResponse.json({
            success: false,
            error: 'url is required'
          }, { status: 400 });
        }
        
        result = await enhancedSEOOptimizationTools.performTechnicalAudit(params.url);
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          availableActions: [
            'analyze_competitors',
            'create_ab_test',
            'update_ab_test',
            'analyze_ab_test',
            'analyze_core_web_vitals',
            'optimize_content',
            'technical_audit'
          ]
        }, { status: 400 });
    }

    logger.info(LogLevel.INFO, 'SEO optimization analysis completed', {
      action,
      params: Object.keys(params)
    }, LogCategory.SEO);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'SEO optimization API POST error', error as Error, LogCategory.SEO);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to perform SEO analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ===================================
// PUT - Actualizar configuración
// ===================================
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { config } = body;

    if (!config || typeof config !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'config object is required'
      }, { status: 400 });
    }

    enhancedSEOOptimizationTools.configure(config);

    logger.info(LogLevel.INFO, 'SEO optimization tools reconfigured', {
      configKeys: Object.keys(config)
    }, LogCategory.SEO);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Configuration updated successfully',
        updatedKeys: Object.keys(config)
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'SEO optimization API PUT error', error as Error, LogCategory.SEO);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ===================================
// DELETE - Limpiar cache
// ===================================
export async function DELETE(request: NextRequest) {
  try {
    await enhancedSEOOptimizationTools.clearCache();

    logger.info(LogLevel.INFO, 'SEO optimization tools cache cleared', {}, LogCategory.SEO);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Cache cleared successfully'
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'SEO optimization API DELETE error', error as Error, LogCategory.SEO);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clear cache',
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










