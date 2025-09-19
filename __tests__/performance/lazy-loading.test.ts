// ===================================
// TESTS - LAZY LOADING PERFORMANCE
// ===================================

import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import '@testing-library/jest-dom';

// Mock de componentes lazy
const MockLazyComponent = () => <div>Lazy Component Loaded</div>;

// Mock de React.lazy
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  lazy: jest.fn((importFn) => {
    // Simular carga asíncrona
    return jest.fn((props) => {
      const [loaded, setLoaded] = jest.requireActual('react').useState(false);
      
      jest.requireActual('react').useEffect(() => {
        const timer = setTimeout(() => setLoaded(true), 100);
        return () => clearTimeout(timer);
      }, []);
      
      return loaded ? MockLazyComponent(props) : null;
    });
  })
}));

describe('Lazy Loading Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock performance.now
    global.performance.now = jest.fn(() => Date.now());
  });

  describe('LazyComponents', () => {
    it('should load components lazily', async () => {
      const LazyTestComponent = require('react').lazy(() => 
        Promise.resolve({ default: MockLazyComponent })
      );

      render(
        <Suspense fallback={<div>Loading...</div>}>
          <LazyTestComponent />
        </Suspense>
      );

      // Verificar que muestra el fallback inicialmente
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Esperar a que cargue el componente
      await waitFor(() => {
        expect(screen.getByText('Lazy Component Loaded')).toBeInTheDocument();
      });
    });

    it('should measure component load time', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Mock performance.now para simular tiempo de carga
      let callCount = 0;
      global.performance.now = jest.fn(() => {
        callCount++;
        return callCount === 1 ? 0 : 150; // 150ms de carga
      });

      const { measureComponentLoad } = require('@/lib/performance/lazy-components');
      
      const measurement = measureComponentLoad('TestComponent');
      const loadTime = measurement.end();

      expect(loadTime).toBe(150);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Performance] TestComponent load time: 150.00ms'
      );

      consoleSpy.mockRestore();
    });

    it('should preload components correctly', async () => {
      const { preloadComponents } = require('@/lib/performance/lazy-components');
      
      // Mock dynamic import
      const mockImport = jest.fn(() => Promise.resolve({ default: MockLazyComponent }));
      jest.doMock('@/components/ShopDetails', () => mockImport, { virtual: true });

      await preloadComponents.shopDetails();

      // Verificar que se llamó el import
      expect(mockImport).toHaveBeenCalled();
    });
  });

  describe('Performance Monitoring', () => {
    it('should track render performance', () => {
      const { usePerformanceOptimized } = require('@/hooks/performance/usePerformanceOptimized');
      
      const TestComponent = () => {
        const { metrics, isOptimized } = usePerformanceOptimized({
          componentName: 'TestComponent',
          threshold: 16
        });

        return (
          <div>
            <span data-testid="optimized">{isOptimized.toString()}</span>
            <span data-testid="render-time">{metrics.renderTime}</span>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId('optimized')).toBeInTheDocument();
      expect(screen.getByTestId('render-time')).toBeInTheDocument();
    });

    it('should provide performance recommendations', () => {
      const { usePerformanceOptimized } = require('@/hooks/performance/usePerformanceOptimized');
      
      // Mock métricas de performance pobres
      const mockMetrics = {
        renderTime: 50, // Excede threshold de 16ms
        memoryUsage: 60, // Excede 50MB
        loadTime: 0,
        componentSize: 0
      };

      const TestComponent = () => {
        const { recommendations, optimizationScore } = usePerformanceOptimized({
          componentName: 'SlowComponent',
          threshold: 16
        });

        // Simular métricas pobres
        Object.assign(require('@/hooks/performance/usePerformanceOptimized').metricsRef.current, mockMetrics);

        return (
          <div>
            <span data-testid="score">{optimizationScore}</span>
            <div data-testid="recommendations">
              {recommendations.map((rec, i) => (
                <div key={i}>{rec}</div>
              ))}
            </div>
          </div>
        );
      };

      render(<TestComponent />);

      const scoreElement = screen.getByTestId('score');
      const recommendationsElement = screen.getByTestId('recommendations');

      expect(scoreElement).toBeInTheDocument();
      expect(recommendationsElement).toBeInTheDocument();
    });
  });

  describe('Performance Utils', () => {
    it('should measure function execution time', () => {
      const { performanceUtils } = require('@/hooks/performance/usePerformanceOptimized');
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Mock performance.now
      let callCount = 0;
      global.performance.now = jest.fn(() => {
        callCount++;
        return callCount === 1 ? 0 : 25; // 25ms de ejecución
      });

      const testFunction = (x: number, y: number) => x + y;
      const measuredFunction = performanceUtils.measureFunction(testFunction, 'testFunction');

      const result = measuredFunction(2, 3);

      expect(result).toBe(5);
      expect(consoleSpy).toHaveBeenCalledWith('[Performance] testFunction: 25.00ms');

      consoleSpy.mockRestore();
    });

    it('should debounce function calls', (done) => {
      const { performanceUtils } = require('@/hooks/performance/usePerformanceOptimized');
      
      const mockFn = jest.fn();
      const debouncedFn = performanceUtils.debounce(mockFn, 100);

      // Llamar múltiples veces rápidamente
      debouncedFn('call1');
      debouncedFn('call2');
      debouncedFn('call3');

      // Verificar que no se ha llamado inmediatamente
      expect(mockFn).not.toHaveBeenCalled();

      // Esperar a que se ejecute el debounce
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        expect(mockFn).toHaveBeenCalledWith('call3');
        done();
      }, 150);
    });

    it('should throttle function calls', (done) => {
      const { performanceUtils } = require('@/hooks/performance/usePerformanceOptimized');
      
      const mockFn = jest.fn();
      const throttledFn = performanceUtils.throttle(mockFn, 100);

      // Llamar múltiples veces rápidamente
      throttledFn('call1');
      throttledFn('call2');
      throttledFn('call3');

      // Verificar que se llamó solo una vez inmediatamente
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('call1');

      // Esperar y verificar que no se llamó más veces
      setTimeout(() => {
        expect(mockFn).toHaveBeenCalledTimes(1);
        done();
      }, 150);
    });

    it('should get browser performance metrics', () => {
      const { performanceUtils } = require('@/hooks/performance/usePerformanceOptimized');

      // Mock performance API
      const mockNavigation = {
        domContentLoadedEventEnd: 1000,
        domContentLoadedEventStart: 500,
        loadEventEnd: 1500,
        loadEventStart: 1000
      };

      global.performance.getEntriesByType = jest.fn((type) => {
        if (type === 'navigation') return [mockNavigation];
        return [];
      });

      global.performance.getEntriesByName = jest.fn((name) => {
        if (name === 'first-paint') return [{ startTime: 800 }];
        if (name === 'first-contentful-paint') return [{ startTime: 900 }];
        return [];
      });

      // @ts-ignore
      global.performance.memory = { usedJSHeapSize: 50000000 }; // 50MB

      const metrics = performanceUtils.getBrowserMetrics();

      expect(metrics).toEqual({
        domContentLoaded: 500,
        loadComplete: 500,
        firstPaint: 800,
        firstContentfulPaint: 900,
        memoryUsage: 50000000
      });
    });
  });

  describe('Integration Tests', () => {
    it('should integrate lazy loading with performance tracking', async () => {
      const { withLazyLoading } = require('@/lib/performance/lazy-components');
      const { withPerformanceTracking } = require('@/hooks/performance/usePerformanceOptimized');

      const BaseComponent = () => <div>Base Component</div>;
      
      // Combinar lazy loading con performance tracking
      const OptimizedComponent = withPerformanceTracking(
        withLazyLoading(
          () => Promise.resolve({ default: BaseComponent }),
          <div>Loading...</div>,
          'OptimizedComponent'
        ),
        'OptimizedComponent'
      );

      render(<OptimizedComponent />);

      // Verificar que muestra el fallback
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Esperar a que cargue
      await waitFor(() => {
        expect(screen.getByText('Base Component')).toBeInTheDocument();
      });
    });
  });
});
