// ===================================
// TESTS DE PERFORMANCE BUDGETS CI/CD
// ===================================

const fs = require('fs').promises;
const path = require('path');
const CIPerformanceChecker = require('../../scripts/ci-performance-check.js');
const budgetConfig = require('../../performance-budgets.config.js');

// Mock file system y child_process
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    appendFile: jest.fn()
  }
}));

jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

describe('Performance Budgets CI/CD System', () => {
  let originalEnv;
  let checker;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv };
    checker = new CIPerformanceChecker();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Budget Configuration', () => {
    it('should have valid budget configuration structure', () => {
      expect(budgetConfig).toHaveProperty('general');
      expect(budgetConfig).toHaveProperty('budgets');
      expect(budgetConfig).toHaveProperty('environments');
      expect(budgetConfig).toHaveProperty('analysis');
      expect(budgetConfig).toHaveProperty('helpers');
    });

    it('should have critical budgets defined', () => {
      const { critical } = budgetConfig.budgets;
      
      expect(critical).toHaveProperty('totalBundleSize');
      expect(critical).toHaveProperty('firstLoadJS');
      expect(critical).toHaveProperty('performanceScore');
      expect(critical).toHaveProperty('chunkCount');
      
      // Verificar estructura de presupuesto
      const bundleBudget = critical.totalBundleSize;
      expect(bundleBudget).toHaveProperty('threshold');
      expect(bundleBudget).toHaveProperty('warning');
      expect(bundleBudget).toHaveProperty('unit');
      expect(bundleBudget).toHaveProperty('description');
      expect(bundleBudget).toHaveProperty('category');
      expect(bundleBudget).toHaveProperty('failBuild');
      
      expect(bundleBudget.failBuild).toBe(true);
      expect(bundleBudget.category).toBe('critical');
    });

    it('should have environment-specific configurations', () => {
      const { environments } = budgetConfig;
      
      expect(environments).toHaveProperty('production');
      expect(environments).toHaveProperty('staging');
      expect(environments).toHaveProperty('development');
      expect(environments).toHaveProperty('ci');
      
      // Verificar multiplicadores
      expect(environments.production.multipliers.critical).toBe(1.0);
      expect(environments.staging.multipliers.critical).toBe(1.1);
      expect(environments.development.multipliers.critical).toBe(2.0);
    });

    it('should have helper functions working correctly', () => {
      const { helpers } = budgetConfig;
      
      // Test formatBytes
      expect(helpers.formatBytes(1024)).toBe('1 KB');
      expect(helpers.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(helpers.formatBytes(0)).toBe('0 B');
      
      // Test formatTime
      expect(helpers.formatTime(30)).toBe('30s');
      expect(helpers.formatTime(90)).toBe('1m 30s');
      expect(helpers.formatTime(120)).toBe('2m 0s');
      
      // Test getBudgetForEnvironment
      const prodBudget = helpers.getBudgetForEnvironment('totalBundleSize', 'critical', 'production');
      const devBudget = helpers.getBudgetForEnvironment('totalBundleSize', 'critical', 'development');
      
      expect(prodBudget.threshold).toBe(500 * 1024);
      expect(devBudget.threshold).toBe(1000 * 1024); // 2x multiplier
    });
  });

  describe('CIPerformanceChecker', () => {
    it('should initialize with correct default configuration', () => {
      expect(checker.results).toHaveProperty('timestamp');
      expect(checker.results).toHaveProperty('environment');
      expect(checker.results).toHaveProperty('metrics');
      expect(checker.results).toHaveProperty('violations');
      expect(checker.results).toHaveProperty('score');
      expect(checker.results).toHaveProperty('grade');
    });

    it('should calculate performance score correctly', () => {
      // Test con métricas buenas
      checker.results.metrics = {
        bundleSize: 300 * 1024,    // 300KB - bueno
        firstLoadJS: 80 * 1024,    // 80KB - bueno
        chunkCount: 10,            // 10 chunks - bueno
        duplicateModules: 0        // sin duplicados - excelente
      };
      
      const score = checker.calculatePerformanceScore();
      expect(score).toBeGreaterThan(90);
      
      // Test con métricas malas
      checker.results.metrics = {
        bundleSize: 600 * 1024,    // 600KB - malo
        firstLoadJS: 150 * 1024,   // 150KB - malo
        chunkCount: 25,            // 25 chunks - malo
        duplicateModules: 5        // muchos duplicados - malo
      };
      
      const badScore = checker.calculatePerformanceScore();
      expect(badScore).toBeLessThan(50);
    });

    it('should calculate grades correctly', () => {
      expect(checker.calculateGrade(95)).toBe('A');
      expect(checker.calculateGrade(85)).toBe('B');
      expect(checker.calculateGrade(75)).toBe('C');
      expect(checker.calculateGrade(65)).toBe('D');
      expect(checker.calculateGrade(45)).toBe('F');
    });

    it('should detect budget violations correctly', () => {
      const budget = {
        threshold: 100 * 1024,
        warning: 80 * 1024,
        category: 'critical',
        description: 'Test budget',
        failBuild: true,
        unit: 'bytes'
      };
      
      const metrics = {
        bundleSize: 120 * 1024  // Excede threshold
      };
      
      const violation = checker.checkBudgetViolation('totalBundleSize', budget, metrics);
      
      expect(violation).toBeTruthy();
      expect(violation.severity).toBe('error');
      expect(violation.failBuild).toBe(true);
      expect(violation.value).toBe(120 * 1024);
      expect(violation.threshold).toBe(100 * 1024);
    });

    it('should format violation messages correctly', () => {
      const budget = { threshold: 100 * 1024, warning: 80 * 1024 };
      const message = checker.formatViolationMessage('bundleSize', 120 * 1024, budget, 'bytes');
      
      expect(message).toContain('120 KB');
      expect(message).toContain('100 KB');
      expect(message).toContain('exceeds threshold');
    });

    it('should generate markdown report correctly', () => {
      checker.results = {
        metrics: {
          bundleSize: 400 * 1024,
          gzippedSize: 140 * 1024,
          firstLoadJS: 85 * 1024,
          chunkCount: 12
        },
        score: 87,
        grade: 'B',
        violations: [
          {
            name: 'Test Violation',
            severity: 'warning',
            category: 'important',
            message: 'Test violation message'
          }
        ],
        comparison: null
      };
      
      const report = checker.generateMarkdownReport();
      
      expect(report).toContain('# CI Performance Report');
      expect(report).toContain('Score**: 87/100 (Grade: B)');
      expect(report).toContain('400 KB');
      expect(report).toContain('❌ 1 budget violation(s) detected');
      expect(report).toContain('Test Violation');
    });

    it('should generate violations CSV correctly', () => {
      checker.results.violations = [
        {
          name: 'Bundle Size',
          category: 'critical',
          severity: 'error',
          value: 600000,
          threshold: 500000,
          unit: 'bytes',
          message: 'Bundle too large'
        }
      ];
      
      const csv = checker.generateViolationsCSV();
      
      expect(csv).toContain('Name,Category,Severity,Value,Threshold,Unit,Message');
      expect(csv).toContain('Bundle Size');
      expect(csv).toContain('critical');
      expect(csv).toContain('error');
      expect(csv).toContain('600000');
    });

    it('should determine build failure correctly', () => {
      // Sin violaciones críticas
      checker.results.violations = [
        { failBuild: false, severity: 'warning' }
      ];
      expect(checker.shouldFailBuild()).toBe(false);
      
      // Con violaciones críticas
      checker.results.violations = [
        { failBuild: true, severity: 'error' },
        { failBuild: false, severity: 'warning' }
      ];
      expect(checker.shouldFailBuild()).toBe(true);
    });
  });

  describe('Environment Configuration', () => {
    it('should apply correct multipliers for different environments', () => {
      const baseBudget = {
        threshold: 100 * 1024,
        warning: 80 * 1024,
        category: 'critical'
      };
      
      // Production - sin multiplicador
      const prodBudget = budgetConfig.helpers.getBudgetForEnvironment('test', 'critical', 'production');
      // Como no existe 'test', debería retornar null
      expect(prodBudget).toBeNull();
      
      // Test con presupuesto real
      const realProdBudget = budgetConfig.helpers.getBudgetForEnvironment('totalBundleSize', 'critical', 'production');
      const realDevBudget = budgetConfig.helpers.getBudgetForEnvironment('totalBundleSize', 'critical', 'development');
      
      expect(realProdBudget.threshold).toBe(500 * 1024);
      expect(realDevBudget.threshold).toBe(1000 * 1024); // 2x multiplier
    });

    it('should handle budget violation checking with environment multipliers', () => {
      const violation = budgetConfig.helpers.checkBudgetViolation(
        600 * 1024, // 600KB
        { 
          name: 'totalBundleSize', 
          category: 'critical',
          threshold: 500 * 1024,
          warning: 400 * 1024
        },
        'production'
      );
      
      expect(violation.violation).toBe(true);
      expect(violation.severity).toBe('error');
      expect(violation.percentageOver).toBeCloseTo(20, 1); // 20% over
    });
  });

  describe('Integration Tests', () => {
    it('should work with mocked file system operations', async () => {
      // Mock successful file operations
      require('fs').promises.access.mockResolvedValue();
      require('fs').promises.mkdir.mockResolvedValue();
      require('fs').promises.writeFile.mockResolvedValue();
      require('fs').promises.appendFile.mockResolvedValue();
      
      // Mock successful bundle analysis
      require('child_process').execSync.mockReturnValue('Bundle analysis output');
      
      // Mock environment variables
      process.env.GITHUB_OUTPUT = '/tmp/github-output';
      process.env.FAIL_ON_VIOLATIONS = 'false';
      
      // Verificar que no arroje errores
      expect(() => {
        checker.verifyBuild();
        checker.runPerformanceAnalysis();
        checker.checkBudgets();
        checker.generateReports();
      }).not.toThrow();
    });

    it('should handle missing build gracefully', async () => {
      require('fs').promises.access.mockRejectedValue(new Error('ENOENT'));
      
      await expect(checker.verifyBuild()).rejects.toThrow('Build not found');
    });

    it('should handle bundle analysis failure gracefully', async () => {
      require('child_process').execSync.mockImplementation(() => {
        throw new Error('Bundle analysis failed');
      });
      
      // Debería usar métricas por defecto sin fallar
      await checker.runPerformanceAnalysis();
      
      expect(checker.results.metrics).toBeDefined();
      expect(checker.results.score).toBeGreaterThan(0);
    });
  });

  describe('GitHub Actions Integration', () => {
    it('should export correct GitHub outputs', async () => {
      process.env.GITHUB_OUTPUT = '/tmp/github-output';
      
      checker.results = {
        score: 87,
        grade: 'B',
        metrics: { bundleSize: 400000, firstLoadJS: 85000 },
        violations: [
          { severity: 'error', failBuild: true },
          { severity: 'warning', failBuild: false }
        ]
      };
      
      await checker.exportGitHubOutputs();
      
      const writeCall = require('fs').promises.appendFile.mock.calls[0];
      const outputContent = writeCall[1];
      
      expect(outputContent).toContain('performance-score=87');
      expect(outputContent).toContain('performance-grade=B');
      expect(outputContent).toContain('bundle-size=400000');
      expect(outputContent).toContain('violations-count=2');
      expect(outputContent).toContain('critical-violations=1');
      expect(outputContent).toContain('has-critical-violations=true');
      expect(outputContent).toContain('should-fail-build=true');
    });
  });
});
