// ===================================
// PINTEYA E-COMMERCE - SEO TESTING API TESTS
// Tests para las APIs de testing automatizado SEO
// ===================================

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '@/app/api/seo/testing/route';

// Mock dependencies
jest.mock('@/lib/seo/seo-testing-suite', () => ({
  enhancedSEOTestingSuite: {
    getTestingStats: jest.fn().mockReturnValue({
      totalTestsRun: 150,
      averageScore: 85,
      testsByType: {
        metadata: 50,
        structured_data: 30,
        robots_txt: 10,
        internal_links: 25,
        compliance: 20,
        performance: 15
      },
      cacheHitRate: 0.85,
      mostCommonIssues: ['Missing meta description', 'Title too long']
    }),
    getTestHistory: jest.fn().mockReturnValue([
      {
        suiteId: 'suite_123',
        suiteName: 'Test Suite',
        status: 'completed',
        summary: { totalTests: 10, passed: 8, failed: 1, warnings: 1 }
      }
    ]),
    getActiveTestSuites: jest.fn().mockReturnValue([]),
    runTestsByType: jest.fn().mockResolvedValue([
      {
        testId: 'test_123',
        testName: 'Title Tag Validation',
        testType: 'metadata',
        url: '/test-page',
        status: 'passed',
        score: 90,
        details: {
          description: 'Test description',
          expectedValue: '30-60 characters',
          actualValue: '45 characters',
          impact: 'high',
          category: 'metadata'
        },
        suggestions: ['Title looks good'],
        executionTime: 100,
        timestamp: new Date()
      }
    ]),
    runFullTestSuite: jest.fn().mockResolvedValue({
      suiteId: 'suite_456',
      suiteName: 'Full SEO Test Suite',
      tests: [],
      summary: {
        totalTests: 20,
        passed: 15,
        failed: 2,
        warnings: 3,
        skipped: 0,
        overallScore: 82,
        executionTime: 5000
      },
      coverage: {
        metadataTests: 5,
        structuredDataTests: 3,
        robotsTxtTests: 2,
        internalLinksTests: 4,
        complianceTests: 3,
        performanceTests: 3
      },
      status: 'completed'
    }),
    configure: jest.fn(),
    clearCache: jest.fn().mockResolvedValue(undefined)
  }
}));

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

describe('SEO Testing API', () => {
  describe('GET /api/seo/testing', () => {
    test('should return API information by default', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/testing');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('message');
      expect(data.data).toHaveProperty('endpoints');
      expect(data.data).toHaveProperty('testTypes');
      expect(Array.isArray(data.data.testTypes)).toBe(true);
    });

    test('should return testing statistics', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/testing?action=stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalTestsRun', 150);
      expect(data.data).toHaveProperty('averageScore', 85);
      expect(data.data).toHaveProperty('testsByType');
      expect(data.data).toHaveProperty('cacheHitRate', 0.85);
    });

    test('should return test history', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/testing?action=history&limit=5');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0]).toHaveProperty('suiteId');
      expect(data.data[0]).toHaveProperty('status');
    });

    test('should return active test suites', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/testing?action=active');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('should run tests by type', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/testing?action=run-by-type&testType=metadata&urls=/test-page');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('testType', 'metadata');
      expect(data.data).toHaveProperty('results');
      expect(data.data).toHaveProperty('summary');
      expect(Array.isArray(data.data.results)).toBe(true);
    });

    test('should return error for invalid test type', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/testing?action=run-by-type&testType=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('testType parameter is required');
      expect(data).toHaveProperty('availableTypes');
    });

    test('should return error for missing test type', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/testing?action=run-by-type');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data).toHaveProperty('availableTypes');
    });
  });

  describe('POST /api/seo/testing', () => {
    test('should run full test suite', async () => {
      const requestBody = {
        action: 'run-full-suite',
        urls: ['/test-page', '/another-page']
      };

      const request = new NextRequest('http://localhost:3000/api/seo/testing', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('suiteId');
      expect(data.data).toHaveProperty('summary');
      expect(data.data).toHaveProperty('coverage');
      expect(data.data.status).toBe('completed');
    });

    test('should run specific test types', async () => {
      const requestBody = {
        action: 'run-specific-tests',
        testTypes: ['metadata', 'structured_data'],
        urls: ['/test-page']
      };

      const request = new NextRequest('http://localhost:3000/api/seo/testing', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('testTypes');
      expect(data.data).toHaveProperty('results');
      expect(data.data).toHaveProperty('summary');
      expect(Array.isArray(data.data.testTypes)).toBe(true);
    });

    test('should validate metadata', async () => {
      const requestBody = {
        action: 'validate-metadata',
        urls: ['/test-page']
      };

      const request = new NextRequest('http://localhost:3000/api/seo/testing', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('testType', 'metadata');
      expect(data.data).toHaveProperty('results');
    });

    test('should return error for invalid action', async () => {
      const requestBody = {
        action: 'invalid-action'
      };

      const request = new NextRequest('http://localhost:3000/api/seo/testing', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid action');
      expect(data).toHaveProperty('availableActions');
    });

    test('should return error for missing testTypes in run-specific-tests', async () => {
      const requestBody = {
        action: 'run-specific-tests',
        urls: ['/test-page']
      };

      const request = new NextRequest('http://localhost:3000/api/seo/testing', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('testTypes array is required');
      expect(data).toHaveProperty('availableTypes');
    });
  });

  describe('PUT /api/seo/testing', () => {
    test('should update configuration', async () => {
      const requestBody = {
        config: {
          enableMetadataTests: true,
          testTimeout: 60,
          thresholds: {
            titleMinLength: 30,
            titleMaxLength: 60
          }
        }
      };

      const request = new NextRequest('http://localhost:3000/api/seo/testing', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('message');
      expect(data.data).toHaveProperty('updatedKeys');
      expect(Array.isArray(data.data.updatedKeys)).toBe(true);
    });

    test('should return error for missing config', async () => {
      const requestBody = {};

      const request = new NextRequest('http://localhost:3000/api/seo/testing', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('config object is required');
      expect(data).toHaveProperty('example');
    });

    test('should return error for invalid config', async () => {
      const requestBody = {
        config: 'invalid-config'
      };

      const request = new NextRequest('http://localhost:3000/api/seo/testing', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('config object is required');
    });
  });

  describe('DELETE /api/seo/testing', () => {
    test('should clear cache', async () => {
      const request = new NextRequest('http://localhost:3000/api/seo/testing', {
        method: 'DELETE'
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('message');
      expect(data.data.message).toContain('Cache cleared successfully');
    });
  });

  describe('Error Handling', () => {
    test('should handle GET errors gracefully', async () => {
      // Mock error
      const { enhancedSEOTestingSuite } = require('@/lib/seo/seo-testing-suite');
      enhancedSEOTestingSuite.getTestingStats.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const request = new NextRequest('http://localhost:3000/api/seo/testing?action=stats');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to process request');
      expect(data.details).toBe('Test error');
    });

    test('should handle POST errors gracefully', async () => {
      // Mock error
      const { enhancedSEOTestingSuite } = require('@/lib/seo/seo-testing-suite');
      enhancedSEOTestingSuite.runFullTestSuite.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const requestBody = {
        action: 'run-full-suite',
        urls: ['/test-page']
      };

      const request = new NextRequest('http://localhost:3000/api/seo/testing', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to run SEO tests');
      expect(data.details).toBe('Test error');
    });

    test('should handle PUT errors gracefully', async () => {
      // Mock error
      const { enhancedSEOTestingSuite } = require('@/lib/seo/seo-testing-suite');
      enhancedSEOTestingSuite.configure.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const requestBody = {
        config: { enableMetadataTests: true }
      };

      const request = new NextRequest('http://localhost:3000/api/seo/testing', {
        method: 'PUT',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to update configuration');
      expect(data.details).toBe('Test error');
    });

    test('should handle DELETE errors gracefully', async () => {
      // Mock error
      const { enhancedSEOTestingSuite } = require('@/lib/seo/seo-testing-suite');
      enhancedSEOTestingSuite.clearCache.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      const request = new NextRequest('http://localhost:3000/api/seo/testing', {
        method: 'DELETE'
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to clear cache');
      expect(data.details).toBe('Test error');
    });
  });
});
