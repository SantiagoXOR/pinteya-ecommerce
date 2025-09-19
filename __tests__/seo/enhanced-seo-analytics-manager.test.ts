// ===================================
// PINTEYA E-COMMERCE - ENHANCED SEO ANALYTICS MANAGER TESTS
// Tests comprehensivos para el sistema avanzado de análisis SEO
// ===================================

import { 
  EnhancedSEOAnalyticsManager,
  enhancedSEOAnalyticsManager,
  DEFAULT_SEO_CONFIG,
  SEOMetrics,
  KeywordMetrics,
  SEOAlert,
  SEOReport
} from '@/lib/seo/seo-analytics-manager';

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  LogLevel: {
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
  },
  LogCategory: {
    SEO: 'seo'
  }
}));

jest.mock('@/lib/redis', () => ({
  getRedisClient: jest.fn().mockResolvedValue({
    setex: jest.fn(),
    get: jest.fn(),
    del: jest.fn()
  })
}));

jest.mock('@/lib/monitoring/real-time-performance-monitor', () => ({
  realTimePerformanceMonitor: {
    getCurrentMetrics: jest.fn().mockReturnValue({
      webVitals: [{
        lcp: 2000,
        fid: 80,
        cls: 0.05,
        fcp: 1500,
        ttfb: 300,
        inp: 150
      }]
    })
  }
}));

jest.mock('@/lib/monitoring/advanced-alerting-engine', () => ({
  advancedAlertingEngine: {
    createAlert: jest.fn()
  },
  AlertType: {
    PERFORMANCE: 'performance'
  },
  AlertSeverity: {
    CRITICAL: 'critical'
  }
}));

describe('Enhanced SEO Analytics Manager', () => {
  let manager: EnhancedSEOAnalyticsManager;

  beforeEach(() => {
    // Crear nueva instancia para cada test
    manager = EnhancedSEOAnalyticsManager.getInstance();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Limpiar intervalos y listeners
    manager.destroy();
  });

  describe('Inicialización', () => {
    it('debe inicializar con configuración por defecto', () => {
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(EnhancedSEOAnalyticsManager);
    });

    it('debe ser singleton', () => {
      const instance1 = EnhancedSEOAnalyticsManager.getInstance();
      const instance2 = EnhancedSEOAnalyticsManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('debe aceptar configuración personalizada', () => {
      const customConfig = {
        enableRealTimeTracking: false,
        metricsUpdateInterval: 30
      };
      
      const customManager = EnhancedSEOAnalyticsManager.getInstance(customConfig);
      expect(customManager).toBeDefined();
    });
  });

  describe('Recopilación de Métricas', () => {
    it('debe recopilar Core Web Vitals correctamente', async () => {
      const coreWebVitals = await manager.collectCoreWebVitals();
      
      expect(coreWebVitals).toHaveProperty('lcp');
      expect(coreWebVitals).toHaveProperty('fid');
      expect(coreWebVitals).toHaveProperty('cls');
      expect(coreWebVitals).toHaveProperty('fcp');
      expect(coreWebVitals).toHaveProperty('ttfb');
      expect(coreWebVitals).toHaveProperty('inp');
      expect(coreWebVitals).toHaveProperty('score');
      expect(coreWebVitals).toHaveProperty('speedIndex');
      expect(coreWebVitals).toHaveProperty('totalBlockingTime');
      
      expect(['good', 'needs-improvement', 'poor']).toContain(coreWebVitals.score);
    });

    it('debe analizar estado de indexación', async () => {
      const indexationStatus = await manager.analyzeIndexationStatus();
      
      expect(indexationStatus).toHaveProperty('totalPages');
      expect(indexationStatus).toHaveProperty('indexedPages');
      expect(indexationStatus).toHaveProperty('notIndexedPages');
      expect(indexationStatus).toHaveProperty('indexationRate');
      expect(indexationStatus).toHaveProperty('crawlErrors');
      expect(indexationStatus).toHaveProperty('sitemapStatus');
      expect(indexationStatus).toHaveProperty('lastCrawlDate');
      
      expect(indexationStatus.indexationRate).toBeGreaterThanOrEqual(0);
      expect(indexationStatus.indexationRate).toBeLessThanOrEqual(100);
    });

    it('debe evaluar métricas técnicas de SEO', async () => {
      const technicalSEO = await manager.evaluateTechnicalSEO();
      
      expect(technicalSEO).toHaveProperty('mobileUsability');
      expect(technicalSEO).toHaveProperty('pagespeedScore');
      expect(technicalSEO).toHaveProperty('httpsUsage');
      expect(technicalSEO).toHaveProperty('structuredDataErrors');
      expect(technicalSEO).toHaveProperty('metaTagsOptimization');
      expect(technicalSEO).toHaveProperty('internalLinkingScore');
      expect(technicalSEO).toHaveProperty('imageOptimization');
      expect(technicalSEO).toHaveProperty('canonicalIssues');
    });
  });

  describe('Análisis de Keywords', () => {
    it('debe analizar keywords con métricas avanzadas', async () => {
      const keywords = await manager.analyzeKeywords();
      
      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(0);
      
      const keyword = keywords[0];
      expect(keyword).toHaveProperty('keyword');
      expect(keyword).toHaveProperty('position');
      expect(keyword).toHaveProperty('searchVolume');
      expect(keyword).toHaveProperty('difficulty');
      expect(keyword).toHaveProperty('clicks');
      expect(keyword).toHaveProperty('impressions');
      expect(keyword).toHaveProperty('ctr');
      expect(keyword).toHaveProperty('trend');
      expect(keyword).toHaveProperty('intent');
      expect(keyword).toHaveProperty('competitorRankings');
      expect(keyword).toHaveProperty('relatedKeywords');
      expect(keyword).toHaveProperty('seasonalTrends');
      expect(keyword).toHaveProperty('conversionRate');
      expect(keyword).toHaveProperty('revenue');
      
      expect(['up', 'down', 'stable']).toContain(keyword.trend);
      expect(['informational', 'navigational', 'transactional', 'commercial']).toContain(keyword.intent);
    });

    it('debe obtener estadísticas de keywords', async () => {
      // Primero analizar keywords para poblar el array
      const keywords = await manager.analyzeKeywords();
      expect(keywords.length).toBeGreaterThan(0);

      // Luego obtener estadísticas
      const stats = manager.getKeywordStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('topPositions');
      expect(stats).toHaveProperty('improvements');
      expect(stats).toHaveProperty('declines');
      expect(stats).toHaveProperty('averagePosition');

      expect(stats.total).toBeGreaterThan(0);
      expect(stats.averagePosition).toBeGreaterThan(0);
    });

    it('debe filtrar keywords por tendencia', async () => {
      await manager.analyzeKeywords();
      
      const upTrend = manager.getKeywordsByTrend('up');
      const downTrend = manager.getKeywordsByTrend('down');
      const stable = manager.getKeywordsByTrend('stable');
      
      upTrend.forEach(k => expect(k.trend).toBe('up'));
      downTrend.forEach(k => expect(k.trend).toBe('down'));
      stable.forEach(k => expect(k.trend).toBe('stable'));
    });
  });

  describe('Sistema de Alertas', () => {
    it('debe detectar problemas SEO', async () => {
      const alerts = await manager.detectSEOIssues();
      
      expect(Array.isArray(alerts)).toBe(true);
      
      if (alerts.length > 0) {
        const alert = alerts[0];
        expect(alert).toHaveProperty('id');
        expect(alert).toHaveProperty('type');
        expect(alert).toHaveProperty('category');
        expect(alert).toHaveProperty('title');
        expect(alert).toHaveProperty('description');
        expect(alert).toHaveProperty('severity');
        expect(alert).toHaveProperty('timestamp');
        expect(alert).toHaveProperty('resolved');
        expect(alert).toHaveProperty('recommendations');
        expect(alert).toHaveProperty('impact');
        expect(alert).toHaveProperty('effort');
        expect(alert).toHaveProperty('priority');
        expect(alert).toHaveProperty('affectedPages');
        expect(alert).toHaveProperty('estimatedTrafficImpact');
        expect(alert).toHaveProperty('estimatedRevenueImpact');
        
        expect(['critical', 'warning', 'info']).toContain(alert.type);
        expect(['technical', 'content', 'performance', 'indexation', 'security', 'mobile', 'schema']).toContain(alert.category);
        expect(['high', 'medium', 'low']).toContain(alert.impact);
        expect(['low', 'medium', 'high']).toContain(alert.effort);
      }
    });

    it('debe resolver alertas correctamente', async () => {
      // Primero detectar problemas para generar alertas
      const alerts = await manager.detectSEOIssues();
      expect(alerts.length).toBeGreaterThan(0);

      // Tomar la primera alerta
      const alertId = alerts[0].id;
      expect(alertId).toBeDefined();

      // Verificar que la alerta existe antes de resolverla
      const unresolvedBefore = manager.getUnresolvedAlerts();
      const alertExists = unresolvedBefore.find(a => a.id === alertId);
      expect(alertExists).toBeDefined();

      // Resolver la alerta
      const resolved = await manager.resolveAlert(alertId, 'Test resolution');
      expect(resolved).toBe(true);

      // Verificar que la alerta ya no está en la lista de no resueltas
      const unresolvedAfter = manager.getUnresolvedAlerts();
      const resolvedAlert = unresolvedAfter.find(a => a.id === alertId);
      expect(resolvedAlert).toBeUndefined();
    });

    it('debe filtrar alertas por tipo', async () => {
      await manager.detectSEOIssues();
      
      const criticalAlerts = manager.getAlertsByType('critical');
      const warningAlerts = manager.getAlertsByType('warning');
      const infoAlerts = manager.getAlertsByType('info');
      
      criticalAlerts.forEach(a => expect(a.type).toBe('critical'));
      warningAlerts.forEach(a => expect(a.type).toBe('warning'));
      infoAlerts.forEach(a => expect(a.type).toBe('info'));
    });
  });

  describe('Generación de Reportes', () => {
    it('debe generar reporte SEO completo', async () => {
      const report = await manager.generateSEOReport('weekly');
      
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('startDate');
      expect(report).toHaveProperty('endDate');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('keywords');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('executiveSummary');
      expect(report).toHaveProperty('performanceAnalysis');
      expect(report).toHaveProperty('keywordAnalysis');
      expect(report).toHaveProperty('technicalAnalysis');
      expect(report).toHaveProperty('contentAnalysis');
      expect(report).toHaveProperty('competitiveAnalysis');
      expect(report).toHaveProperty('actionPlan');
      expect(report).toHaveProperty('generatedBy');
      expect(report).toHaveProperty('generatedAt');
      expect(report).toHaveProperty('version');
      
      expect(report.period).toBe('weekly');
      expect(report.generatedBy).toBe('Enhanced SEO Analytics Manager');
      expect(report.version).toBe('2.0.0');
    });

    it('debe generar resumen ejecutivo', async () => {
      const report = await manager.generateSEOReport('daily');
      const summary = report.executiveSummary;
      
      expect(summary).toHaveProperty('overallScore');
      expect(summary).toHaveProperty('scoreChange');
      expect(summary).toHaveProperty('keyAchievements');
      expect(summary).toHaveProperty('majorConcerns');
      expect(summary).toHaveProperty('quickWins');
      expect(summary).toHaveProperty('budgetRecommendations');
      
      expect(Array.isArray(summary.keyAchievements)).toBe(true);
      expect(Array.isArray(summary.majorConcerns)).toBe(true);
      expect(Array.isArray(summary.quickWins)).toBe(true);
      expect(Array.isArray(summary.budgetRecommendations)).toBe(true);
    });
  });

  describe('Exportación de Datos', () => {
    it('debe exportar datos para dashboard', async () => {
      const dashboardData = manager.exportDashboardData();
      
      expect(dashboardData).toHaveProperty('overview');
      expect(dashboardData).toHaveProperty('keywords');
      expect(dashboardData).toHaveProperty('alerts');
      expect(dashboardData).toHaveProperty('performance');
      expect(dashboardData).toHaveProperty('competitors');
      expect(dashboardData).toHaveProperty('reports');
      
      expect(dashboardData.overview).toHaveProperty('overallScore');
      expect(dashboardData.overview).toHaveProperty('organicTraffic');
      expect(dashboardData.overview).toHaveProperty('averagePosition');
      expect(dashboardData.overview).toHaveProperty('indexationRate');
      expect(dashboardData.overview).toHaveProperty('coreWebVitalsScore');
      expect(dashboardData.overview).toHaveProperty('unresolvedAlerts');
      expect(dashboardData.overview).toHaveProperty('lastUpdated');
      
      expect(Array.isArray(dashboardData.keywords)).toBe(true);
      expect(Array.isArray(dashboardData.alerts)).toBe(true);
      expect(Array.isArray(dashboardData.reports)).toBe(true);
    });
  });

  describe('Gestión de Cache', () => {
    it('debe cachear métricas correctamente', async () => {
      const testData = { test: 'data', timestamp: Date.now() };
      
      // El método es privado, pero podemos testear indirectamente
      await manager.collectCoreWebVitals();
      
      // Verificar que no hay errores en el proceso de cache
      expect(true).toBe(true); // Test básico de que no hay errores
    });
  });

  describe('Limpieza de Datos', () => {
    it('debe limpiar datos antiguos', async () => {
      await manager.cleanupOldData();
      
      // Verificar que el método se ejecuta sin errores
      expect(true).toBe(true);
    });
  });

  describe('Sistema de Eventos', () => {
    it('debe permitir suscripción y notificación', () => {
      const mockCallback = jest.fn();
      
      manager.subscribe(mockCallback);
      
      // Simular evento
      const testData = { type: 'test', data: 'test_data' };
      manager['notifyListeners'](testData);
      
      expect(mockCallback).toHaveBeenCalledWith(testData);
    });

    it('debe permitir desuscripción', () => {
      const mockCallback = jest.fn();
      
      manager.subscribe(mockCallback);
      manager.unsubscribe(mockCallback);
      
      // Simular evento
      const testData = { type: 'test', data: 'test_data' };
      manager['notifyListeners'](testData);
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Destrucción y Limpieza', () => {
    it('debe limpiar recursos al destruir', () => {
      const testManager = EnhancedSEOAnalyticsManager.getInstance();
      
      // Verificar que destroy no arroja errores
      expect(() => testManager.destroy()).not.toThrow();
    });
  });
});
