// ===================================
// PINTEYA E-COMMERCE - ENHANCED SEO TESTING SUITE TESTS
// Tests comprehensivos para el sistema de tests automatizados SEO
// ===================================

import { 
  EnhancedSEOTestingSuite,
  enhancedSEOTestingSuite,
  type SEOTestingConfig,
  type SEOTestResult,
  type SEOTestSuite
} from '@/lib/seo/seo-testing-suite';

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

jest.mock('@/lib/seo/dynamic-seo-manager', () => ({
  dynamicSEOManager: {
    generateSEOMetadata: jest.fn().mockResolvedValue({
      title: 'Test Page Title',
      description: 'Test page description for SEO testing',
      keywords: ['test', 'seo', 'page'],
      ogTitle: 'Test OG Title',
      ogDescription: 'Test OG Description',
      ogImage: '/test-image.jpg'
    }),
    analyzeSEO: jest.fn().mockResolvedValue({
      score: 85,
      issues: [],
      recommendations: []
    })
  }
}));

jest.mock('@/lib/seo/advanced-schema-markup', () => ({
  advancedSchemaMarkup: {
    validateSchema: jest.fn().mockResolvedValue(true)
  }
}));

describe('Enhanced SEO Testing Suite', () => {
  let seoTestingSuite: EnhancedSEOTestingSuite;

  beforeEach(() => {
    // Crear nueva instancia para cada test
    seoTestingSuite = EnhancedSEOTestingSuite.getInstance();
    
    // Resetear configuración a valores por defecto
    seoTestingSuite.configure({
      enableMetadataTests: true,
      enableStructuredDataTests: true,
      enableRobotsTxtTests: true,
      enableInternalLinksTests: true,
      enableComplianceTests: true,
      enablePerformanceTests: true,
      testTimeout: 30,
      maxConcurrentTests: 5
    });
    
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should create singleton instance', () => {
      const instance1 = EnhancedSEOTestingSuite.getInstance();
      const instance2 = EnhancedSEOTestingSuite.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(EnhancedSEOTestingSuite);
    });

    test('should initialize with default configuration', () => {
      const stats = seoTestingSuite.getTestingStats();
      
      expect(stats).toHaveProperty('totalTestsRun');
      expect(stats).toHaveProperty('averageScore');
      expect(stats).toHaveProperty('testsByType');
      expect(stats).toHaveProperty('cacheHitRate');
      expect(typeof stats.totalTestsRun).toBe('number');
    });

    test('should accept custom configuration', () => {
      const customConfig: Partial<SEOTestingConfig> = {
        enableMetadataTests: false,
        testTimeout: 60,
        maxConcurrentTests: 10
      };

      const customInstance = EnhancedSEOTestingSuite.getInstance(customConfig);
      expect(customInstance).toBeInstanceOf(EnhancedSEOTestingSuite);
    });
  });

  describe('Metadata Tests', () => {
    test('should run metadata tests successfully', async () => {
      const results = await seoTestingSuite.runTestsByType('metadata', ['/test-page']);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Verificar estructura de resultados
      const result = results[0];
      expect(result).toHaveProperty('testId');
      expect(result).toHaveProperty('testName');
      expect(result).toHaveProperty('testType', 'metadata');
      expect(result).toHaveProperty('url');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('details');
      expect(result).toHaveProperty('suggestions');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('timestamp');
      
      expect(['passed', 'failed', 'warning', 'skipped']).toContain(result.status);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    test('should validate title tags correctly', async () => {
      const results = await seoTestingSuite.runTestsByType('metadata', ['/test-page']);
      const titleTest = results.find(r => r.testName.includes('Title'));
      
      expect(titleTest).toBeDefined();
      expect(titleTest?.testType).toBe('metadata');
      expect(titleTest?.details.category).toBe('metadata');
      expect(Array.isArray(titleTest?.suggestions)).toBe(true);
    });

    test('should validate meta descriptions', async () => {
      const results = await seoTestingSuite.runTestsByType('metadata', ['/test-page']);
      const descriptionTest = results.find(r => r.testName.includes('Description'));
      
      expect(descriptionTest).toBeDefined();
      expect(descriptionTest?.testType).toBe('metadata');
      expect(descriptionTest?.details.impact).toBe('high');
    });

    test('should validate Open Graph tags', async () => {
      const results = await seoTestingSuite.runTestsByType('metadata', ['/test-page']);
      const ogTest = results.find(r => r.testName.includes('Open Graph'));
      
      expect(ogTest).toBeDefined();
      expect(ogTest?.testType).toBe('metadata');
      expect(Array.isArray(ogTest?.suggestions)).toBe(true);
    });

    test('should handle metadata test errors gracefully', async () => {
      // Deshabilitar metadata tests
      seoTestingSuite.configure({ enableMetadataTests: false });
      
      const results = await seoTestingSuite.runTestsByType('metadata', ['/test-page']);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Structured Data Tests', () => {
    test('should run structured data tests successfully', async () => {
      const results = await seoTestingSuite.runTestsByType('structured_data', ['/test-page']);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const result = results[0];
      expect(result.testType).toBe('structured_data');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('suggestions');
    });

    test('should validate schema presence', async () => {
      const results = await seoTestingSuite.runTestsByType('structured_data', ['/test-page']);
      const presenceTest = results.find(r => r.testName.includes('Presence'));
      
      expect(presenceTest).toBeDefined();
      expect(presenceTest?.details.category).toBe('structured_data');
    });

    test('should validate product schema for product pages', async () => {
      const results = await seoTestingSuite.runTestsByType('structured_data', ['/products/test-product']);
      const productTest = results.find(r => r.testName.includes('Product Schema'));
      
      expect(productTest).toBeDefined();
      expect(productTest?.details.impact).toBe('critical');
    });
  });

  describe('Robots.txt Tests', () => {
    test('should run robots.txt tests successfully', async () => {
      const results = await seoTestingSuite.runTestsByType('robots_txt', ['/']);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const result = results[0];
      expect(result.testType).toBe('robots_txt');
      expect(result.url).toBe('/robots.txt');
    });

    test('should validate robots.txt existence', async () => {
      const results = await seoTestingSuite.runTestsByType('robots_txt', ['/']);
      const existenceTest = results.find(r => r.testName.includes('Existence'));
      
      expect(existenceTest).toBeDefined();
      expect(existenceTest?.details.impact).toBe('high');
    });

    test('should validate sitemap reference', async () => {
      const results = await seoTestingSuite.runTestsByType('robots_txt', ['/']);
      const sitemapTest = results.find(r => r.testName.includes('Sitemap'));
      
      expect(sitemapTest).toBeDefined();
      expect(['passed', 'warning']).toContain(sitemapTest?.status);
    });
  });

  describe('Internal Links Tests', () => {
    test('should run internal links tests successfully', async () => {
      const results = await seoTestingSuite.runTestsByType('internal_links', ['/test-page']);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const result = results[0];
      expect(result.testType).toBe('internal_links');
    });

    test('should validate links count', async () => {
      const results = await seoTestingSuite.runTestsByType('internal_links', ['/test-page']);
      const countTest = results.find(r => r.testName.includes('Count'));
      
      expect(countTest).toBeDefined();
      expect(countTest?.details.category).toBe('internal_links');
    });

    test('should detect broken links', async () => {
      const results = await seoTestingSuite.runTestsByType('internal_links', ['/test-page']);
      const brokenTest = results.find(r => r.testName.includes('Broken'));
      
      expect(brokenTest).toBeDefined();
      expect(['passed', 'failed']).toContain(brokenTest?.status);
    });
  });

  describe('Compliance Tests', () => {
    test('should run compliance tests successfully', async () => {
      const results = await seoTestingSuite.runTestsByType('compliance', ['/test-page']);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const result = results[0];
      expect(result.testType).toBe('compliance');
    });

    test('should validate HTTPS security', async () => {
      const results = await seoTestingSuite.runTestsByType('compliance', ['/test-page']);
      const httpsTest = results.find(r => r.testName.includes('HTTPS'));
      
      expect(httpsTest).toBeDefined();
      expect(httpsTest?.details.category).toBe('security');
    });

    test('should validate mobile friendliness', async () => {
      const results = await seoTestingSuite.runTestsByType('compliance', ['/test-page']);
      const mobileTest = results.find(r => r.testName.includes('Mobile'));
      
      expect(mobileTest).toBeDefined();
      expect(mobileTest?.details.category).toBe('mobile');
    });
  });

  describe('Performance Tests', () => {
    test('should run performance tests successfully', async () => {
      const results = await seoTestingSuite.runTestsByType('performance', ['/test-page']);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      const result = results[0];
      expect(result.testType).toBe('performance');
    });

    test('should validate Core Web Vitals', async () => {
      const results = await seoTestingSuite.runTestsByType('performance', ['/test-page']);
      
      const lcpTest = results.find(r => r.testName.includes('LCP'));
      const fidTest = results.find(r => r.testName.includes('FID'));
      const clsTest = results.find(r => r.testName.includes('CLS'));
      
      expect(lcpTest).toBeDefined();
      expect(fidTest).toBeDefined();
      expect(clsTest).toBeDefined();
      
      expect(lcpTest?.details.category).toBe('core_web_vitals');
      expect(fidTest?.details.category).toBe('core_web_vitals');
      expect(clsTest?.details.category).toBe('core_web_vitals');
    });

    test('should validate SEO score', async () => {
      const results = await seoTestingSuite.runTestsByType('performance', ['/test-page']);
      const seoScoreTest = results.find(r => r.testName.includes('SEO Score'));
      
      expect(seoScoreTest).toBeDefined();
      expect(seoScoreTest?.details.category).toBe('seo_performance');
      expect(seoScoreTest?.score).toBeGreaterThanOrEqual(0);
      expect(seoScoreTest?.score).toBeLessThanOrEqual(100);
    });
  });

  describe('Full Test Suite', () => {
    test('should run full test suite successfully', async () => {
      const testSuite = await seoTestingSuite.runFullTestSuite(['/test-page']);
      
      expect(testSuite).toHaveProperty('suiteId');
      expect(testSuite).toHaveProperty('suiteName');
      expect(testSuite).toHaveProperty('tests');
      expect(testSuite).toHaveProperty('summary');
      expect(testSuite).toHaveProperty('coverage');
      expect(testSuite).toHaveProperty('status', 'completed');
      
      expect(Array.isArray(testSuite.tests)).toBe(true);
      expect(testSuite.tests.length).toBeGreaterThan(0);
      
      expect(testSuite.summary.totalTests).toBe(testSuite.tests.length);
      expect(testSuite.summary.overallScore).toBeGreaterThanOrEqual(0);
      expect(testSuite.summary.overallScore).toBeLessThanOrEqual(100);
    });

    test('should calculate summary correctly', async () => {
      const testSuite = await seoTestingSuite.runFullTestSuite(['/test-page']);
      const summary = testSuite.summary;
      
      expect(summary.totalTests).toBe(
        summary.passed + summary.failed + summary.warnings + summary.skipped
      );
      expect(summary.executionTime).toBeGreaterThanOrEqual(0);
    });

    test('should calculate coverage correctly', async () => {
      const testSuite = await seoTestingSuite.runFullTestSuite(['/test-page']);
      const coverage = testSuite.coverage;
      
      expect(coverage.metadataTests).toBeGreaterThanOrEqual(0);
      expect(coverage.structuredDataTests).toBeGreaterThanOrEqual(0);
      expect(coverage.robotsTxtTests).toBeGreaterThanOrEqual(0);
      expect(coverage.internalLinksTests).toBeGreaterThanOrEqual(0);
      expect(coverage.complianceTests).toBeGreaterThanOrEqual(0);
      expect(coverage.performanceTests).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration and Management', () => {
    test('should update configuration', () => {
      const newConfig = {
        enableMetadataTests: false,
        testTimeout: 60
      };
      
      expect(() => seoTestingSuite.configure(newConfig)).not.toThrow();
    });

    test('should get testing statistics', () => {
      const stats = seoTestingSuite.getTestingStats();
      
      expect(stats).toHaveProperty('totalTestsRun');
      expect(stats).toHaveProperty('averageScore');
      expect(stats).toHaveProperty('testsByType');
      expect(stats).toHaveProperty('cacheHitRate');
      
      expect(typeof stats.totalTestsRun).toBe('number');
      expect(typeof stats.averageScore).toBe('number');
      expect(typeof stats.testsByType).toBe('object');
      expect(typeof stats.cacheHitRate).toBe('number');
    });

    test('should manage test history', async () => {
      await seoTestingSuite.runFullTestSuite(['/test-page']);
      
      const history = seoTestingSuite.getTestHistory(5);
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      
      const suite = history[0];
      expect(suite).toHaveProperty('suiteId');
      expect(suite).toHaveProperty('status');
    });

    test('should get active test suites', () => {
      const activeSuites = seoTestingSuite.getActiveTestSuites();
      expect(Array.isArray(activeSuites)).toBe(true);
    });

    test('should clear cache', async () => {
      await expect(seoTestingSuite.clearCache()).resolves.not.toThrow();
    });

    test('should destroy instance properly', async () => {
      await expect(seoTestingSuite.destroy()).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle disabled test types', async () => {
      seoTestingSuite.configure({ enableMetadataTests: false });
      
      const results = await seoTestingSuite.runTestsByType('metadata', ['/test-page']);
      expect(Array.isArray(results)).toBe(true);
    });

    test('should handle invalid URLs gracefully', async () => {
      const results = await seoTestingSuite.runTestsByType('metadata', ['invalid-url']);
      expect(Array.isArray(results)).toBe(true);
    });

    test('should handle empty URL arrays', async () => {
      const results = await seoTestingSuite.runTestsByType('metadata', []);
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
