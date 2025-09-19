// ===================================
// PINTEYA E-COMMERCE - SEO ANALYSIS API
// API para análisis y optimización SEO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { enhancedSEOOptimizationTools } from '@/lib/seo/seo-optimization-tools';
import { seoAnalyticsManager } from '@/lib/seo/seo-analytics-manager';
import { dynamicSEOManager } from '@/lib/seo/dynamic-seo-manager';

// POST - Analizar contenido de una URL
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, content, keywords = [], type = 'content' } = body;

    console.log(`🔍 Analizando ${type} para URL: ${url}`);

    let result: any = {};

    switch (type) {
      case 'content':
        if (!content) {
          return NextResponse.json({
            success: false,
            error: 'Contenido HTML es requerido para análisis de contenido'
          }, { status: 400 });
        }

        // Analizar contenido
        const contentAnalysis = enhancedSEOOptimizationTools.analyzeContent(content, keywords);

        // Generar sugerencias de optimización
        const titleSuggestion = keywords.length > 0 ?
          enhancedSEOOptimizationTools.optimizeTitle('Título actual', keywords[0]) : null;

        const descriptionSuggestion = keywords.length > 0 ?
          enhancedSEOOptimizationTools.optimizeMetaDescription('Descripción actual', keywords[0]) : null;

        result = {
          contentAnalysis,
          suggestions: {
            title: titleSuggestion,
            description: descriptionSuggestion
          }
        };
        break;

      case 'keywords':
        if (!keywords.length) {
          return NextResponse.json({
            success: false,
            error: 'Al menos una keyword es requerida para análisis de keywords'
          }, { status: 400 });
        }

        // Analizar keywords
        const keywordSuggestions = await Promise.all(
          keywords.map((keyword: string) => enhancedSEOOptimizationTools.suggestKeywords(keyword))
        );

        // Análisis de competidores
        const competitorAnalysis = await enhancedSEOOptimizationTools.analyzeCompetitors(keywords);

        result = {
          keywordSuggestions: keywordSuggestions.flat(),
          competitorAnalysis
        };
        break;

      case 'technical':
        // Obtener métricas técnicas
        const metrics = await seoAnalyticsManager.collectMetrics();
        const overallScore = seoAnalyticsManager.calculateOverallSEOScore(metrics);

        result = {
          technicalMetrics: metrics.technicalSEO,
          coreWebVitals: metrics.coreWebVitals,
          indexationStatus: metrics.indexationStatus,
          overallScore
        };
        break;

      case 'metadata':
        if (!url) {
          return NextResponse.json({
            success: false,
            error: 'URL es requerida para análisis de metadata'
          }, { status: 400 });
        }

        // Simular datos de página para generar metadata optimizada
        const pageData = {
          path: new URL(url).pathname,
          title: 'Título de la página',
          description: 'Descripción de la página',
          type: 'page' as const
        };

        const optimizedMetadata = dynamicSEOManager.generatePageMetadata(pageData);

        result = {
          currentMetadata: {
            title: 'Título actual',
            description: 'Descripción actual'
          },
          optimizedMetadata,
          recommendations: [
            'Optimizar título para incluir keyword principal',
            'Mejorar descripción para aumentar CTR',
            'Agregar Open Graph tags',
            'Implementar structured data'
          ]
        };
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Tipo de análisis no soportado: ${type}`
        }, { status: 400 });
    }

    console.log(`✅ Análisis ${type} completado`);

    return NextResponse.json({
      success: true,
      type,
      url,
      timestamp: new Date().toISOString(),
      ...result
    });

  } catch (error) {
    console.error('❌ Error en análisis SEO:', error);

    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}

// GET - Obtener métricas SEO generales
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'weekly';
    const includeKeywords = searchParams.get('keywords') === 'true';
    const includeAlerts = searchParams.get('alerts') === 'true';

    console.log(`📊 Obteniendo métricas SEO (período: ${period})`);

    // Generar reporte SEO
    const report = await seoAnalyticsManager.generateSEOReport(
      period as 'daily' | 'weekly' | 'monthly'
    );

    // Filtrar datos según parámetros
    const response: any = {
      success: true,
      period,
      metrics: report.metrics,
      summary: report.summary,
      timestamp: new Date().toISOString()
    };

    if (includeKeywords) {
      response.keywords = report.keywords;
    }

    if (includeAlerts) {
      response.alerts = report.alerts;
    }

    console.log('✅ Métricas SEO obtenidas exitosamente');

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Error obteniendo métricas SEO:', error);

    return NextResponse.json({
      success: false,
      error: 'Error obteniendo métricas SEO',
      message: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}









