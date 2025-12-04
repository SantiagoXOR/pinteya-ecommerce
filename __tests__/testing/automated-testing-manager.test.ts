// ===================================
// TESTS - AUTOMATED TESTING MANAGER
// ===================================

import { automatedTestingManager } from '@/lib/testing/automated-testing-manager'
import type { RegressionTestConfig } from '@/lib/testing/automated-testing-manager'

// Mock performance.now
const mockPerformanceNow = jest.fn()
global.performance.now = mockPerformanceNow

describe('AutomatedTestingManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    automatedTestingManager.clearResults()

    // Mock performance.now to return predictable values
    let callCount = 0
    mockPerformanceNow.mockImplementation(() => {
      callCount++
      return callCount * 100 // 100ms increments
    })
  })

  describe('Regression Testing', () => {
    it('should run regression tests successfully', async () => {
      const config: RegressionTestConfig = {
        threshold: 0.1, // 10%
        components: ['TestComponent'],
        apis: ['/api/test'],
      }

      const result = await automatedTestingManager.runRegressionTests(config)

      expect(result.name).toBe('Regression Tests')
      expect(result.totalTests).toBe(2) // 1 component + 1 api
      expect(result.duration).toBeGreaterThan(0)
      expect(result.tests).toHaveLength(2)
    })

    it('should detect performance regression', async () => {
      const config: RegressionTestConfig = {
        threshold: 0.05, // 5% threshold
        components: ['SlowComponent'],
        apis: [],
      }

      // First run to set baseline
      await automatedTestingManager.runRegressionTests(config)

      // Mock slower performance for second run
      jest
        .spyOn(automatedTestingManager as any, 'measureComponentPerformance')
        .mockResolvedValueOnce({
          loadTime: 100,
          renderTime: 50, // Much slower than baseline
          memoryUsage: 10,
          bundleSize: 30,
        })

      const result = await automatedTestingManager.runRegressionTests(config)

      // Should detect regression
      const componentTest = result.tests.find(t => t.name.includes('SlowComponent'))
      expect(componentTest?.status).toBe('failed')
      expect(componentTest?.error).toContain('Performance degraded')
    })

    it('should handle API timeout errors', async () => {
      const config: RegressionTestConfig = {
        threshold: 100, // 100ms threshold
        components: [],
        apis: ['/api/slow-endpoint'],
      }

      // Mock slow API response
      jest.spyOn(automatedTestingManager as any, 'testApiEndpoint').mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ status: 200, responseTime: 150 }), 150)
        })
      })

      const result = await automatedTestingManager.runRegressionTests(config)

      const apiTest = result.tests.find(t => t.name.includes('/api/slow-endpoint'))
      expect(apiTest?.status).toBe('failed')
      expect(apiTest?.error).toContain('exceeds threshold')
    })
  })

  describe('Performance Testing', () => {
    it('should run performance tests for components', async () => {
      const components = ['Component1', 'Component2']

      const result = await automatedTestingManager.runPerformanceTests(components)

      expect(result.name).toBe('Performance Tests')
      expect(result.totalTests).toBe(4) // 2 components + bundle + memory tests
      expect(result.tests).toHaveLength(4)
    })

    it('should fail tests when performance thresholds are exceeded', async () => {
      // Mock poor performance metrics
      jest.spyOn(automatedTestingManager as any, 'measureComponentPerformance').mockResolvedValue({
        loadTime: 100,
        renderTime: 25, // Exceeds 16ms threshold
        memoryUsage: 60, // Exceeds 50MB threshold
        bundleSize: 120, // Exceeds 100KB threshold
      })

      const result = await automatedTestingManager.runPerformanceTests(['SlowComponent'])

      const componentTest = result.tests.find(t => t.name.includes('SlowComponent - Performance'))
      expect(componentTest?.status).toBe('failed')
      expect(componentTest?.error).toContain('Render time > 16ms')
      expect(componentTest?.error).toContain('Memory usage > 50MB')
      expect(componentTest?.error).toContain('Bundle size > 100KB')
    })

    it('should test bundle size correctly', async () => {
      const result = await automatedTestingManager.runPerformanceTests([])

      const bundleTest = result.tests.find(t => t.name === 'Bundle Size Check')
      expect(bundleTest).toBeDefined()
      expect(bundleTest?.duration).toBeGreaterThan(0)
      expect(bundleTest?.details).toHaveProperty('bundleSize')
      expect(bundleTest?.details).toHaveProperty('threshold')
    })

    it('should test memory leaks', async () => {
      const result = await automatedTestingManager.runPerformanceTests([])

      const memoryTest = result.tests.find(t => t.name === 'Memory Leak Check')
      expect(memoryTest).toBeDefined()
      expect(memoryTest?.duration).toBeGreaterThan(0)
      expect(memoryTest?.details).toHaveProperty('memoryGrowth')
      expect(memoryTest?.details).toHaveProperty('threshold')
    })
  })

  describe('Accessibility Testing', () => {
    it('should run accessibility tests for pages', async () => {
      const pages = ['/home', '/products']

      const result = await automatedTestingManager.runAccessibilityTests(pages)

      expect(result.name).toBe('Accessibility Tests')
      expect(result.totalTests).toBe(2)
      expect(result.tests).toHaveLength(2)
    })

    it('should fail tests when accessibility score is low', async () => {
      // Mock poor accessibility score
      jest.spyOn(automatedTestingManager as any, 'runAccessibilityAudit').mockResolvedValue({
        violations: [
          { id: 'color-contrast', impact: 'serious', description: 'Poor contrast', nodes: 3 },
          { id: 'missing-alt', impact: 'critical', description: 'Missing alt text', nodes: 2 },
        ],
        passes: 10,
        incomplete: 1,
        score: 65, // Below 80% threshold
      })

      const result = await automatedTestingManager.runAccessibilityTests(['/poor-accessibility'])

      const accessibilityTest = result.tests[0]
      expect(accessibilityTest.status).toBe('failed')
      expect(accessibilityTest.error).toContain('Accessibility score 65% below 80%')
      expect(accessibilityTest.details.violations).toHaveLength(2)
    })

    it('should pass tests when accessibility score is high', async () => {
      // Mock good accessibility score
      jest.spyOn(automatedTestingManager as any, 'runAccessibilityAudit').mockResolvedValue({
        violations: [],
        passes: 25,
        incomplete: 0,
        score: 95, // Above 80% threshold
      })

      const result = await automatedTestingManager.runAccessibilityTests(['/good-accessibility'])

      const accessibilityTest = result.tests[0]
      expect(accessibilityTest.status).toBe('passed')
      expect(accessibilityTest.error).toBeUndefined()
      expect(accessibilityTest.details.score).toBe(95)
    })
  })

  describe('Test Results Management', () => {
    it('should store and retrieve test results', async () => {
      const config: RegressionTestConfig = {
        threshold: 0.1,
        components: ['TestComponent'],
        apis: [],
      }

      await automatedTestingManager.runRegressionTests(config)

      const results = automatedTestingManager.getTestResults()
      expect(results.has('regression')).toBe(true)

      const regressionSuite = results.get('regression')
      expect(regressionSuite?.name).toBe('Regression Tests')
    })

    it('should generate test summary correctly', async () => {
      // Run multiple test suites
      await automatedTestingManager.runRegressionTests({
        threshold: 0.1,
        components: ['Component1'],
        apis: ['/api/test'],
      })

      await automatedTestingManager.runPerformanceTests(['Component1'])

      const summary = automatedTestingManager.getTestSummary()

      expect(summary.totalSuites).toBe(2)
      expect(summary.totalTests).toBeGreaterThan(0)
      expect(summary.passedTests).toBeGreaterThanOrEqual(0)
      expect(summary.failedTests).toBeGreaterThanOrEqual(0)
      expect(summary.successRate).toBeGreaterThanOrEqual(0)
      expect(summary.successRate).toBeLessThanOrEqual(100)
      expect(summary.totalDuration).toBeGreaterThan(0)
    })

    it('should clear results correctly', async () => {
      // Add some test results
      await automatedTestingManager.runRegressionTests({
        threshold: 0.1,
        components: ['TestComponent'],
        apis: [],
      })

      expect(automatedTestingManager.getTestResults().size).toBe(1)

      automatedTestingManager.clearResults()

      expect(automatedTestingManager.getTestResults().size).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle component testing errors gracefully', async () => {
      // Mock error in component measurement
      jest
        .spyOn(automatedTestingManager as any, 'measureComponentPerformance')
        .mockRejectedValue(new Error('Component measurement failed'))

      const config: RegressionTestConfig = {
        threshold: 0.1,
        components: ['ErrorComponent'],
        apis: [],
      }

      const result = await automatedTestingManager.runRegressionTests(config)

      const componentTest = result.tests[0]
      expect(componentTest.status).toBe('failed')
      expect(componentTest.error).toBe('Component measurement failed')
    })

    it('should handle API testing errors gracefully', async () => {
      // Mock error in API testing
      jest
        .spyOn(automatedTestingManager as any, 'testApiEndpoint')
        .mockRejectedValue(new Error('Network error'))

      const config: RegressionTestConfig = {
        threshold: 0.1,
        components: [],
        apis: ['/api/error'],
      }

      const result = await automatedTestingManager.runRegressionTests(config)

      const apiTest = result.tests[0]
      expect(apiTest.status).toBe('failed')
      expect(apiTest.error).toBe('Network error')
    })

    it('should handle accessibility testing errors gracefully', async () => {
      // Mock error in accessibility audit
      jest
        .spyOn(automatedTestingManager as any, 'runAccessibilityAudit')
        .mockRejectedValue(new Error('Accessibility audit failed'))

      const result = await automatedTestingManager.runAccessibilityTests(['/error-page'])

      const accessibilityTest = result.tests[0]
      expect(accessibilityTest.status).toBe('failed')
      expect(accessibilityTest.error).toBe('Accessibility audit failed')
    })
  })

  describe('Performance Baselines', () => {
    it('should establish baselines for new components', async () => {
      const config: RegressionTestConfig = {
        threshold: 0.1,
        components: ['NewComponent'],
        apis: [],
      }

      const result = await automatedTestingManager.runRegressionTests(config)

      const componentTest = result.tests[0]
      expect(componentTest.name).toContain('Baseline Set')
      expect(componentTest.status).toBe('passed')
      expect(componentTest.details).toBeDefined()
    })

    it('should compare against existing baselines', async () => {
      const config: RegressionTestConfig = {
        threshold: 0.1,
        components: ['ExistingComponent'],
        apis: [],
      }

      // First run to establish baseline
      await automatedTestingManager.runRegressionTests(config)

      // Second run should compare against baseline
      const result = await automatedTestingManager.runRegressionTests(config)

      const componentTest = result.tests[0]
      expect(componentTest.name).toContain('Performance Check')
      expect(componentTest.details).toHaveProperty('current')
      expect(componentTest.details).toHaveProperty('baseline')
    })
  })
})
