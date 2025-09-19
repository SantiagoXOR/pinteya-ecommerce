// ===================================
// PINTEYA E-COMMERCE - SEO TESTING API
// API endpoints para la suite de tests automatizados SEO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { enhancedSEOTestingSuite } from '@/lib/seo/seo-testing-suite';
import { logger, LogCategory, LogLevel } from '@/lib/enterprise/logger';

// ===================================
// GET - Obtener información y estadísticas
// ===================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const testType = searchParams.get('testType') as any;
    const limit = searchParams.get('limit');

    switch (action) {
      case 'stats':
        const stats = enhancedSEOTestingSuite.getTestingStats();
        return NextResponse.json({
          success: true,
          data: stats
        });

      case 'history':
        const history = enhancedSEOTestingSuite.getTestHistory(
          limit ? parseInt(limit) : undefined
        );
        return NextResponse.json({
          success: true,
          data: history
        });

      case 'active':
        const activeSuites = enhancedSEOTestingSuite.getActiveTestSuites();
        return NextResponse.json({
          success: true,
          data: activeSuites
        });

      case 'run-by-type':
        if (!testType || !['metadata', 'structured_data', 'robots_txt', 'internal_links', 'compliance', 'performance'].includes(testType)) {
          return NextResponse.json({
            success: false,
            error: 'testType parameter is required and must be valid',
            availableTypes: ['metadata', 'structured_data', 'robots_txt', 'internal_links', 'compliance', 'performance']
          }, { status: 400 });
        }

        const urls = searchParams.get('urls')?.split(',');
        const testResults = await enhancedSEOTestingSuite.runTestsByType(testType, urls);
        
        return NextResponse.json({
          success: true,
          data: {
            testType,
            results: testResults,
            summary: {
              totalTests: testResults.length,
              passed: testResults.filter(t => t.status === 'passed').length,
              failed: testResults.filter(t => t.status === 'failed').length,
              warnings: testResults.filter(t => t.status === 'warning').length,
              averageScore: testResults.length > 0 
                ? Math.round(testResults.reduce((sum, t) => sum + t.score, 0) / testResults.length)
                : 0
            }
          }
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'SEO Testing Suite API',
            version: '1.0.0',
            endpoints: {
              'GET ?action=stats': 'Get testing statistics',
              'GET ?action=history&limit=10': 'Get test history',
              'GET ?action=active': 'Get active test suites',
              'GET ?action=run-by-type&testType=metadata': 'Run specific test type',
              'POST': 'Run full test suite',
              'PUT': 'Update configuration',
              'DELETE': 'Clear cache'
            },
            testTypes: ['metadata', 'structured_data', 'robots_txt', 'internal_links', 'compliance', 'performance']
          }
        });
    }

  } catch (error) {
    logger.error(LogLevel.ERROR, 'SEO testing API GET error', error as Error, LogCategory.SEO);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ===================================
// POST - Ejecutar tests
// ===================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, urls, testTypes, config } = body;

    let result;

    switch (action) {
      case 'run-full-suite':
        result = await enhancedSEOTestingSuite.runFullTestSuite(urls);
        break;

      case 'run-specific-tests':
        if (!testTypes || !Array.isArray(testTypes)) {
          return NextResponse.json({
            success: false,
            error: 'testTypes array is required',
            availableTypes: ['metadata', 'structured_data', 'robots_txt', 'internal_links', 'compliance', 'performance']
          }, { status: 400 });
        }

        const allResults = [];
        for (const testType of testTypes) {
          const typeResults = await enhancedSEOTestingSuite.runTestsByType(testType, urls);
          allResults.push(...typeResults);
        }

        result = {
          testTypes,
          results: allResults,
          summary: {
            totalTests: allResults.length,
            passed: allResults.filter(t => t.status === 'passed').length,
            failed: allResults.filter(t => t.status === 'failed').length,
            warnings: allResults.filter(t => t.status === 'warning').length,
            averageScore: allResults.length > 0 
              ? Math.round(allResults.reduce((sum, t) => sum + t.score, 0) / allResults.length)
              : 0
          }
        };
        break;

      case 'validate-metadata':
        const metadataResults = await enhancedSEOTestingSuite.runTestsByType('metadata', urls);
        result = {
          testType: 'metadata',
          results: metadataResults,
          recommendations: generateMetadataRecommendations(metadataResults)
        };
        break;

      case 'validate-structured-data':
        const structuredDataResults = await enhancedSEOTestingSuite.runTestsByType('structured_data', urls);
        result = {
          testType: 'structured_data',
          results: structuredDataResults,
          recommendations: generateStructuredDataRecommendations(structuredDataResults)
        };
        break;

      case 'audit-internal-links':
        const linksResults = await enhancedSEOTestingSuite.runTestsByType('internal_links', urls);
        result = {
          testType: 'internal_links',
          results: linksResults,
          recommendations: generateLinksRecommendations(linksResults)
        };
        break;

      case 'check-compliance':
        const complianceResults = await enhancedSEOTestingSuite.runTestsByType('compliance', urls);
        result = {
          testType: 'compliance',
          results: complianceResults,
          recommendations: generateComplianceRecommendations(complianceResults)
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          availableActions: [
            'run-full-suite',
            'run-specific-tests',
            'validate-metadata',
            'validate-structured-data',
            'audit-internal-links',
            'check-compliance'
          ]
        }, { status: 400 });
    }

    logger.info(LogLevel.INFO, 'SEO testing completed', {
      action,
      urlsCount: urls?.length || 0
    }, LogCategory.SEO);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'SEO testing API POST error', error as Error, LogCategory.SEO);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to run SEO tests',
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
        error: 'config object is required',
        example: {
          config: {
            enableMetadataTests: true,
            enableStructuredDataTests: true,
            testTimeout: 30,
            thresholds: {
              titleMinLength: 30,
              titleMaxLength: 60,
              descriptionMinLength: 120,
              descriptionMaxLength: 160
            }
          }
        }
      }, { status: 400 });
    }

    enhancedSEOTestingSuite.configure(config);

    logger.info(LogLevel.INFO, 'SEO testing suite reconfigured', {
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
    logger.error(LogLevel.ERROR, 'SEO testing API PUT error', error as Error, LogCategory.SEO);
    
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
    await enhancedSEOTestingSuite.clearCache();

    logger.info(LogLevel.INFO, 'SEO testing suite cache cleared', {}, LogCategory.SEO);

    return NextResponse.json({
      success: true,
      data: {
        message: 'Cache cleared successfully'
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'SEO testing API DELETE error', error as Error, LogCategory.SEO);
    
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

// ===================================
// FUNCIONES DE UTILIDAD
// ===================================

function generateMetadataRecommendations(results: any[]): string[] {
  const recommendations = [];

  const failedTitles = results.filter(r => r.testName.includes('Title') && r.status === 'failed');
  const failedDescriptions = results.filter(r => r.testName.includes('Description') && r.status === 'failed');
  const failedKeywords = results.filter(r => r.testName.includes('Keywords') && r.status !== 'passed');
  const failedOpenGraph = results.filter(r => r.testName.includes('Open Graph') && r.status !== 'passed');

  if (failedTitles.length > 0) {
    recommendations.push(`Fix ${failedTitles.length} title tag issues - ensure 30-60 character length`);
  }

  if (failedDescriptions.length > 0) {
    recommendations.push(`Improve ${failedDescriptions.length} meta descriptions - aim for 120-160 characters`);
  }

  if (failedKeywords.length > 0) {
    recommendations.push(`Optimize keywords for ${failedKeywords.length} pages - include 3-5 relevant terms`);
  }

  if (failedOpenGraph.length > 0) {
    recommendations.push(`Add Open Graph tags to ${failedOpenGraph.length} pages for better social sharing`);
  }

  if (recommendations.length === 0) {
    recommendations.push('All metadata tests passed - excellent SEO optimization!');
  }

  return recommendations;
}

function generateStructuredDataRecommendations(results: any[]): string[] {
  const recommendations = [];

  const failedPresence = results.filter(r => r.testName.includes('Presence') && r.status === 'failed');
  const failedValidation = results.filter(r => r.testName.includes('Validation') && r.status === 'failed');
  const failedProduct = results.filter(r => r.testName.includes('Product') && r.status === 'failed');

  if (failedPresence.length > 0) {
    recommendations.push(`Add structured data to ${failedPresence.length} pages`);
  }

  if (failedValidation.length > 0) {
    recommendations.push(`Fix structured data validation errors on ${failedValidation.length} pages`);
  }

  if (failedProduct.length > 0) {
    recommendations.push(`Add Product schema to ${failedProduct.length} product pages`);
  }

  if (recommendations.length === 0) {
    recommendations.push('All structured data tests passed - excellent implementation!');
  }

  return recommendations;
}

function generateLinksRecommendations(results: any[]): string[] {
  const recommendations = [];

  const brokenLinks = results.filter(r => r.testName.includes('Broken') && r.status === 'failed');
  const anchorIssues = results.filter(r => r.testName.includes('Anchor') && r.status !== 'passed');
  const hierarchyIssues = results.filter(r => r.testName.includes('Hierarchy') && r.status !== 'passed');

  if (brokenLinks.length > 0) {
    recommendations.push(`Fix broken links on ${brokenLinks.length} pages`);
  }

  if (anchorIssues.length > 0) {
    recommendations.push(`Improve anchor text on ${anchorIssues.length} pages`);
  }

  if (hierarchyIssues.length > 0) {
    recommendations.push(`Improve link hierarchy on ${hierarchyIssues.length} pages`);
  }

  if (recommendations.length === 0) {
    recommendations.push('All internal links tests passed - excellent link structure!');
  }

  return recommendations;
}

function generateComplianceRecommendations(results: any[]): string[] {
  const recommendations = [];

  const httpsIssues = results.filter(r => r.testName.includes('HTTPS') && r.status === 'failed');
  const mobileIssues = results.filter(r => r.testName.includes('Mobile') && r.status === 'failed');
  const accessibilityIssues = results.filter(r => r.testName.includes('Accessibility') && r.status !== 'passed');
  const speedIssues = results.filter(r => r.testName.includes('Speed') && r.status !== 'passed');

  if (httpsIssues.length > 0) {
    recommendations.push(`Implement HTTPS on ${httpsIssues.length} pages`);
  }

  if (mobileIssues.length > 0) {
    recommendations.push(`Improve mobile optimization on ${mobileIssues.length} pages`);
  }

  if (accessibilityIssues.length > 0) {
    recommendations.push(`Improve accessibility on ${accessibilityIssues.length} pages`);
  }

  if (speedIssues.length > 0) {
    recommendations.push(`Optimize page speed on ${speedIssues.length} pages`);
  }

  if (recommendations.length === 0) {
    recommendations.push('All compliance tests passed - excellent technical implementation!');
  }

  return recommendations;
}









