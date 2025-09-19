// ===================================
// PINTEYA E-COMMERCE - ENHANCED SEO OPTIMIZATION TOOLS TESTS
// Tests comprehensivos para el sistema de herramientas de optimización SEO
// ===================================

import { 
  EnhancedSEOOptimizationTools,
  enhancedSEOOptimizationTools,
  type SEOOptimizationConfig,
  type CompetitorAnalysisResult,
  type ABTestResult,
  type CoreWebVitalsOptimization,
  type ContentOptimizationSuggestion,
  type TechnicalSEOAuditResult,
  type AutomatedRecommendation
} from '@/lib/seo/seo-optimization-tools';

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
    get: jest.fn(),
    setex: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn()
  })
}));

jest.mock('@/lib/supabase', () => ({
  getSupabaseClient: jest.fn().mockResolvedValue({})
}));

jest.mock('@/lib/seo/seo-analytics-manager', () => ({
  enhancedSEOAnalyticsManager: {
    trackSEOMetrics: jest.fn()
  }
}));

describe('Enhanced SEO Optimization Tools', () => {
  let seoTools: EnhancedSEOOptimizationTools;

  beforeEach(() => {
    // Crear nueva instancia para cada test
    seoTools = EnhancedSEOOptimizationTools.getInstance();

    // Resetear configuración a valores por defecto
    seoTools.configure({
      enableCompetitorAnalysis: true,
      enableABTesting: true,
      enableCoreWebVitalsOptimization: true,
      enableKeywordResearch: true,
      enableContentOptimization: true,
      enableTechnicalAudit: true
    });

    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should create singleton instance', () => {
      const instance1 = EnhancedSEOOptimizationTools.getInstance();
      const instance2 = EnhancedSEOOptimizationTools.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(EnhancedSEOOptimizationTools);
    });

    test('should initialize with default configuration', () => {
      const stats = seoTools.getUsageStats();
      
      expect(stats).toHaveProperty('activeABTests');
      expect(stats).toHaveProperty('totalRecommendations');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('enabledFeatures');
      expect(stats.enabledFeatures).toContain('CompetitorAnalysis');
      expect(stats.enabledFeatures).toContain('ABTesting');
    });

    test('should accept custom configuration', () => {
      const customConfig: Partial<SEOOptimizationConfig> = {
        enableCompetitorAnalysis: false,
        enableABTesting: true,
        abTestDuration: 30
      };

      const customInstance = EnhancedSEOOptimizationTools.getInstance(customConfig);
      expect(customInstance).toBeInstanceOf(EnhancedSEOOptimizationTools);
    });
  });

  describe('Competitor Analysis', () => {
    test('should analyze competitors successfully', async () => {
      const competitors = ['competitor1.com', 'competitor2.com'];
      
      const results = await seoTools.analyzeCompetitors(competitors);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('competitor');
      expect(results[0]).toHaveProperty('domain');
      expect(results[0]).toHaveProperty('overallScore');
      expect(results[0]).toHaveProperty('strengths');
      expect(results[0]).toHaveProperty('weaknesses');
      expect(results[0]).toHaveProperty('opportunities');
      expect(results[0]).toHaveProperty('keywordGaps');
      expect(results[0]).toHaveProperty('contentGaps');
      expect(results[0]).toHaveProperty('backlinksAnalysis');
      expect(results[0]).toHaveProperty('socialSignals');
      
      expect(results[0].overallScore).toBeGreaterThanOrEqual(60);
      expect(results[0].overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(results[0].keywordGaps)).toBe(true);
      expect(Array.isArray(results[0].contentGaps)).toBe(true);
    });

    test('should handle competitor analysis errors', async () => {
      // Deshabilitar análisis de competidores
      seoTools.configure({ enableCompetitorAnalysis: false });
      
      await expect(seoTools.analyzeCompetitors(['test.com']))
        .rejects.toThrow('Competitor analysis is disabled');
    });

    test('should analyze keyword gaps correctly', async () => {
      const results = await seoTools.analyzeCompetitors(['competitor.com']);
      const keywordGaps = results[0].keywordGaps;
      
      expect(keywordGaps.length).toBeGreaterThan(0);
      expect(keywordGaps[0]).toHaveProperty('keyword');
      expect(keywordGaps[0]).toHaveProperty('competitorRanking');
      expect(keywordGaps[0]).toHaveProperty('searchVolume');
      expect(keywordGaps[0]).toHaveProperty('difficulty');
      expect(keywordGaps[0]).toHaveProperty('opportunity');
      expect(['high', 'medium', 'low']).toContain(keywordGaps[0].opportunity);
    });
  });

  describe('A/B Testing', () => {
    test('should create A/B test successfully', async () => {
      const testConfig = {
        name: 'Product Page Title Test',
        url: '/products/test',
        variants: [
          {
            name: 'Control',
            metadata: { title: 'Original Title' }
          },
          {
            name: 'Variant A',
            metadata: { title: 'Optimized Title' }
          }
        ]
      };
      
      const testId = await seoTools.createABTest(testConfig);
      
      expect(testId).toMatch(/^ab_test_\d+_[a-z0-9]+$/);
    });

    test('should update A/B test metrics', async () => {
      const testConfig = {
        name: 'Test',
        url: '/test',
        variants: [
          { name: 'Control', metadata: { title: 'Control' } },
          { name: 'Variant', metadata: { title: 'Variant' } }
        ]
      };
      
      const testId = await seoTools.createABTest(testConfig);
      
      await expect(seoTools.updateABTestMetrics(testId, 'variant_0', {
        impressions: 100,
        clicks: 5,
        conversions: 1
      })).resolves.not.toThrow();
    });

    test('should analyze A/B test results', async () => {
      const testConfig = {
        name: 'Test',
        url: '/test',
        variants: [
          { name: 'Control', metadata: { title: 'Control' } },
          { name: 'Variant', metadata: { title: 'Variant' } }
        ]
      };
      
      const testId = await seoTools.createABTest(testConfig);
      
      // Agregar métricas
      await seoTools.updateABTestMetrics(testId, 'variant_0', {
        impressions: 100,
        clicks: 5,
        conversions: 1
      });
      
      const results = await seoTools.analyzeABTestResults(testId);
      
      expect(results).toHaveProperty('testId', testId);
      expect(results).toHaveProperty('status');
      expect(results).toHaveProperty('variants');
      expect(results).toHaveProperty('results');
      expect(results.variants).toHaveLength(2);
    });

    test('should handle A/B testing errors', async () => {
      seoTools.configure({ enableABTesting: false });
      
      await expect(seoTools.createABTest({
        name: 'Test',
        url: '/test',
        variants: []
      })).rejects.toThrow('A/B Testing is disabled');
    });
  });

  describe('Core Web Vitals', () => {
    test('should analyze Core Web Vitals successfully', async () => {
      const url = 'https://pinteya.com/products/test';
      
      const analysis = await seoTools.analyzeCoreWebVitals(url);
      
      expect(analysis).toHaveProperty('url', url);
      expect(analysis).toHaveProperty('currentMetrics');
      expect(analysis).toHaveProperty('targetMetrics');
      expect(analysis).toHaveProperty('optimizations');
      expect(analysis).toHaveProperty('overallScore');
      expect(analysis).toHaveProperty('improvementPotential');
      
      expect(analysis.currentMetrics).toHaveProperty('lcp');
      expect(analysis.currentMetrics).toHaveProperty('fid');
      expect(analysis.currentMetrics).toHaveProperty('cls');
      expect(analysis.currentMetrics).toHaveProperty('fcp');
      expect(analysis.currentMetrics).toHaveProperty('ttfb');
      expect(analysis.currentMetrics).toHaveProperty('inp');
      
      expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(analysis.optimizations)).toBe(true);
    });

    test('should generate appropriate optimizations', async () => {
      const analysis = await seoTools.analyzeCoreWebVitals('https://test.com');
      
      if (analysis.optimizations.length > 0) {
        const optimization = analysis.optimizations[0];
        
        expect(optimization).toHaveProperty('metric');
        expect(optimization).toHaveProperty('issue');
        expect(optimization).toHaveProperty('solution');
        expect(optimization).toHaveProperty('priority');
        expect(optimization).toHaveProperty('estimatedImpact');
        expect(optimization).toHaveProperty('implementationEffort');
        expect(optimization).toHaveProperty('resources');
        
        expect(['critical', 'high', 'medium', 'low']).toContain(optimization.priority);
        expect(['low', 'medium', 'high']).toContain(optimization.implementationEffort);
        expect(Array.isArray(optimization.resources)).toBe(true);
      }
    });

    test('should handle Core Web Vitals errors', async () => {
      seoTools.configure({ enableCoreWebVitalsOptimization: false });
      
      await expect(seoTools.analyzeCoreWebVitals('https://test.com'))
        .rejects.toThrow('Core Web Vitals optimization is disabled');
    });
  });

  describe('Content Optimization', () => {
    test('should optimize content successfully', async () => {
      const url = 'https://pinteya.com/products/test';
      const contentType = 'product';
      
      const optimization = await seoTools.optimizeContent(url, contentType);
      
      expect(optimization).toHaveProperty('url', url);
      expect(optimization).toHaveProperty('contentType', contentType);
      expect(optimization).toHaveProperty('currentScore');
      expect(optimization).toHaveProperty('targetScore');
      expect(optimization).toHaveProperty('suggestions');
      expect(optimization).toHaveProperty('keywordOptimization');
      expect(optimization).toHaveProperty('readabilityAnalysis');
      
      expect(optimization.currentScore).toBeGreaterThanOrEqual(40);
      expect(optimization.currentScore).toBeLessThanOrEqual(80);
      expect(optimization.targetScore).toBe(85);
      expect(Array.isArray(optimization.suggestions)).toBe(true);
    });

    test('should generate relevant content suggestions', async () => {
      const optimization = await seoTools.optimizeContent('https://test.com', 'product');
      
      if (optimization.suggestions.length > 0) {
        const suggestion = optimization.suggestions[0];
        
        expect(suggestion).toHaveProperty('type');
        expect(suggestion).toHaveProperty('current');
        expect(suggestion).toHaveProperty('suggested');
        expect(suggestion).toHaveProperty('reason');
        expect(suggestion).toHaveProperty('impact');
        expect(suggestion).toHaveProperty('difficulty');
        
        expect(['title', 'description', 'headings', 'content', 'images', 'links', 'schema'])
          .toContain(suggestion.type);
        expect(['high', 'medium', 'low']).toContain(suggestion.impact);
        expect(['easy', 'medium', 'hard']).toContain(suggestion.difficulty);
      }
    });

    test('should handle content optimization errors', async () => {
      seoTools.configure({ enableContentOptimization: false });
      
      await expect(seoTools.optimizeContent('https://test.com', 'product'))
        .rejects.toThrow('Content optimization is disabled');
    });
  });

  describe('Technical SEO Audit', () => {
    test('should perform technical audit successfully', async () => {
      const url = 'https://pinteya.com';
      
      const audit = await seoTools.performTechnicalAudit(url);
      
      expect(audit).toHaveProperty('url', url);
      expect(audit).toHaveProperty('overallScore');
      expect(audit).toHaveProperty('issues');
      expect(audit).toHaveProperty('categories');
      expect(audit).toHaveProperty('recommendations');
      
      expect(audit.overallScore).toBeGreaterThanOrEqual(0);
      expect(audit.overallScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(audit.issues)).toBe(true);
      expect(Array.isArray(audit.recommendations)).toBe(true);
      
      expect(audit.categories).toHaveProperty('crawlability');
      expect(audit.categories).toHaveProperty('indexability');
      expect(audit.categories).toHaveProperty('performance');
      expect(audit.categories).toHaveProperty('mobile');
      expect(audit.categories).toHaveProperty('security');
      expect(audit.categories).toHaveProperty('structured_data');
    });

    test('should handle technical audit errors', async () => {
      seoTools.configure({ enableTechnicalAudit: false });
      
      await expect(seoTools.performTechnicalAudit('https://test.com'))
        .rejects.toThrow('Technical SEO audit is disabled');
    });
  });

  describe('Automated Recommendations', () => {
    test('should generate automated recommendations', async () => {
      const recommendations = await seoTools.generateAutomatedRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      const recommendation = recommendations[0];
      expect(recommendation).toHaveProperty('id');
      expect(recommendation).toHaveProperty('type');
      expect(recommendation).toHaveProperty('priority');
      expect(recommendation).toHaveProperty('title');
      expect(recommendation).toHaveProperty('description');
      expect(recommendation).toHaveProperty('actionItems');
      expect(recommendation).toHaveProperty('expectedResults');
      expect(recommendation).toHaveProperty('createdAt');
      expect(recommendation).toHaveProperty('status');
      
      expect(['keyword', 'content', 'technical', 'competitor', 'performance'])
        .toContain(recommendation.type);
      expect(['critical', 'high', 'medium', 'low']).toContain(recommendation.priority);
      expect(['pending', 'in_progress', 'completed', 'dismissed']).toContain(recommendation.status);
    });
  });

  describe('Configuration and Utilities', () => {
    test('should update configuration', () => {
      const newConfig = {
        enableCompetitorAnalysis: false,
        abTestDuration: 30
      };
      
      expect(() => seoTools.configure(newConfig)).not.toThrow();
    });

    test('should get usage statistics', () => {
      const stats = seoTools.getUsageStats();
      
      expect(stats).toHaveProperty('activeABTests');
      expect(stats).toHaveProperty('totalRecommendations');
      expect(stats).toHaveProperty('cacheSize');
      expect(stats).toHaveProperty('enabledFeatures');
      
      expect(typeof stats.activeABTests).toBe('number');
      expect(typeof stats.totalRecommendations).toBe('number');
      expect(typeof stats.cacheSize).toBe('number');
      expect(Array.isArray(stats.enabledFeatures)).toBe(true);
    });

    test('should clear cache', async () => {
      await expect(seoTools.clearCache()).resolves.not.toThrow();
    });

    test('should destroy instance properly', async () => {
      await expect(seoTools.destroy()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid competitor URLs', async () => {
      const results = await seoTools.analyzeCompetitors(['invalid-url']);
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('competitor', 'invalid-url');
    });

    test('should handle missing A/B test', async () => {
      await expect(seoTools.updateABTestMetrics('nonexistent', 'variant_0', {}))
        .rejects.toThrow('A/B Test nonexistent not found');
    });

    test('should handle invalid variant ID', async () => {
      const testConfig = {
        name: 'Test',
        url: '/test',
        variants: [{ name: 'Control', metadata: { title: 'Control' } }]
      };
      
      const testId = await seoTools.createABTest(testConfig);
      
      await expect(seoTools.updateABTestMetrics(testId, 'invalid_variant', {}))
        .rejects.toThrow('Variant invalid_variant not found');
    });
  });
});
