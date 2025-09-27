// Configuración para Node.js Runtime
export const runtime = 'nodejs';

// ===================================
// PINTEYA E-COMMERCE - SEO DASHBOARD API
// API principal para el dashboard administrativo SEO
// ===================================

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { EnhancedSEOAnalyticsManager } from '@/lib/seo/seo-analytics-manager';
import { DynamicSEOManager } from '@/lib/seo/dynamic-seo-manager';
import { SEOTestingSuite } from '@/lib/seo/seo-testing-suite';
import { DynamicSitemapGenerator } from '@/lib/seo/dynamic-sitemap-generator';
import { SEOOptimizationTools } from '@/lib/seo/seo-optimization-tools';

// ===================================
// INTERFACES
// ===================================

interface SEOOverviewData {
  overallScore: number;
  totalPages: number;
  indexedPages: number;
  organicTraffic: number;
  avgPosition: number;
  ctr: number;
  coreWebVitals: {
    lcp: number;
    fid: number;
    cls: number;
    fcp: number;
    ttfb: number;
    inp: number;
  };
  recentTests: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  sitemapStatus: {
    totalUrls: number;
    lastGenerated: string;
    errors: number;
  };
  optimizationStatus: {
    activeTools: number;
    improvements: number;
    issues: number;
  };
}

interface SEOAlert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  url?: string;
  action?: {
    label: string;
    href: string;
  };
}

// ===================================
// HANDLERS
// ===================================

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';

    switch (type) {
      case 'overview':
        return await getOverviewData();
      case 'alerts':
        return await getAlertsData();
      case 'quick-stats':
        return await getQuickStats();
      default:
        return NextResponse.json(
          { error: 'Tipo de datos no válido' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error en SEO Dashboard API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// ===================================
// FUNCIONES AUXILIARES
// ===================================

async function getOverviewData(): Promise<NextResponse> {
  try {
    // Obtener instancias de los managers
    const analyticsManager = EnhancedSEOAnalyticsManager.getInstance();
    const seoManager = DynamicSEOManager.getInstance();
    const testingSuite = SEOTestingSuite.getInstance();
    const sitemapGenerator = DynamicSitemapGenerator.getInstance();
    const optimizationTools = SEOOptimizationTools.getInstance();

    // Obtener métricas de analytics
    const analyticsMetrics = await analyticsManager.getMetrics('/', {
      includePerformance: true,
      includeSearchConsole: true,
      includeConversions: true
    });

    // Obtener estadísticas de testing
    const testingStats = await testingSuite.getTestingStatistics();

    // Obtener estado del sitemap
    const sitemapStats = await sitemapGenerator.getGenerationStatistics();

    // Obtener estado de optimización
    const optimizationStats = await optimizationTools.getOptimizationStatistics();

    // Construir datos de overview
    const overviewData: SEOOverviewData = {
      overallScore: Math.round(
        (analyticsMetrics.seoScore + 
         testingStats.averageScore + 
         optimizationStats.averageScore) / 3
      ),
      totalPages: 1247, // Esto vendría de la base de datos
      indexedPages: 1180,
      organicTraffic: analyticsMetrics.organicTraffic || 8920,
      avgPosition: analyticsMetrics.averagePosition || 3.2,
      ctr: analyticsMetrics.clickThroughRate || 2.56,
      coreWebVitals: {
        lcp: analyticsMetrics.coreWebVitals?.lcp || 2.1,
        fid: analyticsMetrics.coreWebVitals?.fid || 85,
        cls: analyticsMetrics.coreWebVitals?.cls || 0.08,
        fcp: analyticsMetrics.coreWebVitals?.fcp || 1.8,
        ttfb: analyticsMetrics.coreWebVitals?.ttfb || 420,
        inp: analyticsMetrics.coreWebVitals?.inp || 180
      },
      recentTests: {
        total: testingStats.totalTestsRun,
        passed: testingStats.passedTests,
        failed: testingStats.failedTests,
        warnings: testingStats.warningTests
      },
      sitemapStatus: {
        totalUrls: sitemapStats.totalUrls,
        lastGenerated: sitemapStats.lastGenerated.toISOString(),
        errors: sitemapStats.errors
      },
      optimizationStatus: {
        activeTools: optimizationStats.activeTools,
        improvements: optimizationStats.totalImprovements,
        issues: optimizationStats.totalIssues
      }
    };

    return NextResponse.json({
      success: true,
      data: overviewData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo datos de overview:', error);
    throw error;
  }
}

async function getAlertsData(): Promise<NextResponse> {
  try {
    // Obtener instancias de los managers
    const analyticsManager = EnhancedSEOAnalyticsManager.getInstance();
    const testingSuite = SEOTestingSuite.getInstance();
    const sitemapGenerator = DynamicSitemapGenerator.getInstance();

    // Obtener alertas de diferentes fuentes
    const analyticsAlerts = await analyticsManager.getActiveAlerts();
    const testingAlerts = await testingSuite.getActiveAlerts();
    const sitemapAlerts = await sitemapGenerator.getActiveAlerts();

    // Combinar y formatear alertas
    const allAlerts: SEOAlert[] = [
      ...analyticsAlerts.map(alert => ({
        id: `analytics_${alert.id}`,
        type: alert.severity as SEOAlert['type'],
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        url: alert.url,
        action: alert.action ? {
          label: alert.action.label,
          href: alert.action.href
        } : undefined
      })),
      ...testingAlerts.map(alert => ({
        id: `testing_${alert.id}`,
        type: alert.severity as SEOAlert['type'],
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        url: alert.url,
        action: alert.action ? {
          label: alert.action.label,
          href: alert.action.href
        } : undefined
      })),
      ...sitemapAlerts.map(alert => ({
        id: `sitemap_${alert.id}`,
        type: alert.severity as SEOAlert['type'],
        title: alert.title,
        message: alert.message,
        timestamp: alert.timestamp.toISOString(),
        url: alert.url,
        action: alert.action ? {
          label: alert.action.label,
          href: alert.action.href
        } : undefined
      }))
    ];

    // Ordenar por timestamp (más recientes primero)
    allAlerts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      data: allAlerts.slice(0, 20), // Limitar a 20 alertas más recientes
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    throw error;
  }
}

async function getQuickStats(): Promise<NextResponse> {
  try {
    // Obtener estadísticas rápidas para widgets
    const analyticsManager = EnhancedSEOAnalyticsManager.getInstance();
    
    const quickMetrics = await analyticsManager.getMetrics('/', {
      includePerformance: false,
      includeSearchConsole: true,
      includeConversions: false
    });

    const quickStats = {
      organicTraffic: quickMetrics.organicTraffic || 8920,
      searchImpressions: quickMetrics.searchImpressions || 125000,
      avgPosition: quickMetrics.averagePosition || 3.2,
      ctr: quickMetrics.clickThroughRate || 2.56,
      seoScore: quickMetrics.seoScore || 85,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: quickStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas rápidas:', error);
    throw error;
  }
}

// ===================================
// POST - ACCIONES DEL DASHBOARD
// ===================================

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'refresh-data':
        return await refreshDashboardData();
      case 'run-quick-audit':
        return await runQuickAudit(data);
      case 'dismiss-alert':
        return await dismissAlert(data.alertId);
      default:
        return NextResponse.json(
          { error: 'Acción no válida' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error en acción del dashboard:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

async function refreshDashboardData(): Promise<NextResponse> {
  try {
    // Forzar actualización de caché en todos los managers
    const analyticsManager = EnhancedSEOAnalyticsManager.getInstance();
    const testingSuite = SEOTestingSuite.getInstance();
    const sitemapGenerator = DynamicSitemapGenerator.getInstance();
    const optimizationTools = SEOOptimizationTools.getInstance();

    // Limpiar cachés
    await Promise.all([
      analyticsManager.clearCache(),
      testingSuite.clearCache(),
      sitemapGenerator.clearCache(),
      optimizationTools.clearCache()
    ]);

    return NextResponse.json({
      success: true,
      message: 'Datos del dashboard actualizados',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error refrescando datos:', error);
    throw error;
  }
}

async function runQuickAudit(data: { urls?: string[] }): Promise<NextResponse> {
  try {
    const testingSuite = SEOTestingSuite.getInstance();
    
    // Ejecutar auditoría rápida
    const auditResults = await testingSuite.runQuickAudit(data.urls || ['/']);

    return NextResponse.json({
      success: true,
      data: auditResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error ejecutando auditoría rápida:', error);
    throw error;
  }
}

async function dismissAlert(alertId: string): Promise<NextResponse> {
  try {
    // Marcar alerta como descartada
    // En una implementación real, esto se guardaría en la base de datos
    
    return NextResponse.json({
      success: true,
      message: 'Alerta descartada',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error descartando alerta:', error);
    throw error;
  }
}










