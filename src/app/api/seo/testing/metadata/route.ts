// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - METADATA TESTING API
// API específica para validación de metadata SEO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { enhancedSEOTestingSuite } from '@/lib/seo/seo-testing-suite';
import { logger, LogCategory, LogLevel } from '@/lib/enterprise/logger';

// ===================================
// GET - Validar metadata de URLs específicas
// ===================================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const urls = searchParams.get('urls')?.split(',');

    if (!url && !urls) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'Metadata Testing API',
          description: 'Validate SEO metadata including titles, descriptions, keywords, and Open Graph tags',
          usage: {
            'GET ?url=/products/example': 'Test metadata for single URL',
            'GET ?urls=/,/shop,/about': 'Test metadata for multiple URLs',
            'POST': 'Batch validate metadata with custom configuration'
          },
          validationCriteria: {
            title: 'Length: 30-60 characters, unique, contains keywords',
            description: 'Length: 120-160 characters, unique, contains call-to-action',
            keywords: '3-5 relevant keywords',
            openGraph: 'og:title, og:description, og:image, og:url',
            twitter: 'twitter:card, twitter:title, twitter:description, twitter:image'
          }
        }
      });
    }

    const testUrls = urls || [url!];
    const results = await enhancedSEOTestingSuite.runTestsByType('metadata', testUrls);

    // Agrupar resultados por URL
    const resultsByUrl = testUrls.reduce((acc, testUrl) => {
      acc[testUrl] = results.filter(r => r.url === testUrl);
      return acc;
    }, {} as Record<string, any[]>);

    // Generar recomendaciones específicas
    const recommendations = generateMetadataRecommendations(results);

    logger.info(LogLevel.INFO, 'Metadata validation completed', {
      urlsCount: testUrls.length,
      testsRun: results.length
    }, LogCategory.SEO);

    return NextResponse.json({
      success: true,
      data: {
        results: resultsByUrl,
        summary: {
          totalTests: results.length,
          passed: results.filter(r => r.status === 'passed').length,
          failed: results.filter(r => r.status === 'failed').length,
          warnings: results.filter(r => r.status === 'warning').length,
          averageScore: results.length > 0 
            ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
            : 0
        },
        recommendations,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Metadata testing API GET error', error as Error, LogCategory.SEO);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to validate metadata',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ===================================
// POST - Validación batch con configuración personalizada
// ===================================
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, thresholds, includeRecommendations = true } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'urls array is required and must not be empty',
        example: {
          urls: ['/products/pintura-interior', '/categories/pinturas', '/'],
          thresholds: {
            titleMinLength: 30,
            titleMaxLength: 60,
            descriptionMinLength: 120,
            descriptionMaxLength: 160
          },
          includeRecommendations: true
        }
      }, { status: 400 });
    }

    // Limitar número de URLs
    if (urls.length > 20) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 20 URLs allowed per batch request'
      }, { status: 400 });
    }

    // Configurar umbrales temporalmente si se proporcionan
    if (thresholds) {
      enhancedSEOTestingSuite.configure({ thresholds });
    }

    // Ejecutar tests de metadata
    const results = await enhancedSEOTestingSuite.runTestsByType('metadata', urls);

    // Analizar resultados por categoría
    const analysis = analyzeMetadataResults(results);

    // Generar recomendaciones si se solicitan
    const recommendations = includeRecommendations 
      ? generateDetailedMetadataRecommendations(results, analysis)
      : [];

    logger.info(LogLevel.INFO, 'Batch metadata validation completed', {
      urlsCount: urls.length,
      testsRun: results.length,
      averageScore: analysis.averageScore
    }, LogCategory.SEO);

    return NextResponse.json({
      success: true,
      data: {
        results,
        analysis,
        recommendations,
        configuration: thresholds || 'default',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error(LogLevel.ERROR, 'Metadata testing API POST error', error as Error, LogCategory.SEO);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to perform batch metadata validation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
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

function analyzeMetadataResults(results: any[]): {
  averageScore: number;
  titleIssues: number;
  descriptionIssues: number;
  keywordIssues: number;
  openGraphIssues: number;
  mostCommonIssues: string[];
  urlsWithIssues: string[];
} {
  const averageScore = results.length > 0 
    ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
    : 0;

  const titleIssues = results.filter(r => 
    r.testName.includes('Title') && r.status !== 'passed'
  ).length;

  const descriptionIssues = results.filter(r => 
    r.testName.includes('Description') && r.status !== 'passed'
  ).length;

  const keywordIssues = results.filter(r => 
    r.testName.includes('Keywords') && r.status !== 'passed'
  ).length;

  const openGraphIssues = results.filter(r => 
    r.testName.includes('Open Graph') && r.status !== 'passed'
  ).length;

  const mostCommonIssues = [];
  if (titleIssues > 0) {mostCommonIssues.push('Title optimization needed');}
  if (descriptionIssues > 0) {mostCommonIssues.push('Meta description issues');}
  if (keywordIssues > 0) {mostCommonIssues.push('Keyword optimization required');}
  if (openGraphIssues > 0) {mostCommonIssues.push('Missing Open Graph tags');}

  const urlsWithIssues = [...new Set(
    results
      .filter(r => r.status !== 'passed')
      .map(r => r.url)
  )];

  return {
    averageScore,
    titleIssues,
    descriptionIssues,
    keywordIssues,
    openGraphIssues,
    mostCommonIssues,
    urlsWithIssues
  };
}

function generateDetailedMetadataRecommendations(results: any[], analysis: any): Array<{
  priority: 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  solution: string;
  affectedUrls: string[];
}> {
  const recommendations = [];

  if (analysis.titleIssues > 0) {
    const affectedUrls = results
      .filter(r => r.testName.includes('Title') && r.status !== 'passed')
      .map(r => r.url);

    recommendations.push({
      priority: 'high' as const,
      category: 'Title Tags',
      issue: `${analysis.titleIssues} pages have title tag issues`,
      solution: 'Optimize title tags to 30-60 characters, include primary keywords, and ensure uniqueness',
      affectedUrls
    });
  }

  if (analysis.descriptionIssues > 0) {
    const affectedUrls = results
      .filter(r => r.testName.includes('Description') && r.status !== 'passed')
      .map(r => r.url);

    recommendations.push({
      priority: 'high' as const,
      category: 'Meta Descriptions',
      issue: `${analysis.descriptionIssues} pages have meta description issues`,
      solution: 'Write compelling meta descriptions of 120-160 characters with clear call-to-action',
      affectedUrls
    });
  }

  if (analysis.openGraphIssues > 0) {
    const affectedUrls = results
      .filter(r => r.testName.includes('Open Graph') && r.status !== 'passed')
      .map(r => r.url);

    recommendations.push({
      priority: 'medium' as const,
      category: 'Open Graph',
      issue: `${analysis.openGraphIssues} pages missing Open Graph tags`,
      solution: 'Add og:title, og:description, og:image, and og:url tags for better social media sharing',
      affectedUrls
    });
  }

  if (analysis.keywordIssues > 0) {
    const affectedUrls = results
      .filter(r => r.testName.includes('Keywords') && r.status !== 'passed')
      .map(r => r.url);

    recommendations.push({
      priority: 'medium' as const,
      category: 'Keywords',
      issue: `${analysis.keywordIssues} pages need keyword optimization`,
      solution: 'Include 3-5 relevant keywords that match user search intent and page content',
      affectedUrls
    });
  }

  return recommendations;
}

// ===================================
// OPCIONES CORS
// ===================================
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}










