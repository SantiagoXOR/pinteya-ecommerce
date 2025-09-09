// ===================================
// PINTEYA E-COMMERCE - LAZY COMPONENTS MOCKS
// Mocks para componentes lazy loading en tests
// ===================================

import React from 'react';
import { jest } from '@jest/globals';

// ===================================
// MOCK COMPONENTS
// ===================================

// Mock de componente admin dashboard
const MockAdminDashboard = React.forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref} data-testid="mock-admin-dashboard" {...props}>
    <h1>Mock Admin Dashboard</h1>
    <div>Dashboard content loaded</div>
  </div>
));
MockAdminDashboard.displayName = 'MockAdminDashboard';

// Mock de componente product list
const MockProductList = React.forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref} data-testid="mock-product-list" {...props}>
    <h2>Mock Product List</h2>
    <div>Products loaded</div>
  </div>
));
MockProductList.displayName = 'MockProductList';

// Mock de componente product form
const MockProductForm = React.forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref} data-testid="mock-product-form" {...props}>
    <h2>Mock Product Form</h2>
    <form>Form loaded</form>
  </div>
));
MockProductForm.displayName = 'MockProductForm';

// Mock de componente logistics map
const MockLogisticsMap = React.forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref} data-testid="mock-logistics-map" {...props}>
    <h2>Mock Logistics Map</h2>
    <div>Map loaded</div>
  </div>
));
MockLogisticsMap.displayName = 'MockLogisticsMap';

// Mock de componente real time dashboard
const MockRealTimeDashboard = React.forwardRef<HTMLDivElement, any>((props, ref) => (
  <div ref={ref} data-testid="mock-realtime-dashboard" {...props}>
    <h2>Mock Real Time Dashboard</h2>
    <div>Real time data loaded</div>
  </div>
));
MockRealTimeDashboard.displayName = 'MockRealTimeDashboard';

// ===================================
// MOCK IMPLEMENTATIONS
// ===================================

// Mock de React.lazy
export const mockLazy = jest.fn((importFn: () => Promise<any>) => {
  return React.forwardRef((props: any, ref: any) => {
    const [Component, setComponent] = React.useState<React.ComponentType | null>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<Error | null>(null);

    React.useEffect(() => {
      importFn()
        .then((module) => {
          setComponent(() => module.default || module);
          setLoading(false);
        })
        .catch((err) => {
          setError(err);
          setLoading(false);
        });
    }, []);

    if (loading) {
      return React.createElement('div', { 
        'data-testid': 'lazy-loading',
        children: 'Loading...' 
      });
    }

    if (error) {
      return React.createElement('div', { 
        'data-testid': 'lazy-error',
        children: `Error: ${error.message}` 
      });
    }

    if (Component) {
      return React.createElement(Component, { ...props, ref });
    }

    return null;
  });
});

// Mock de React.Suspense
export const mockSuspense = jest.fn(({ children, fallback }: any) => {
  return React.createElement('div', {
    'data-testid': 'suspense-boundary',
    children: [
      React.createElement('div', {
        key: 'fallback',
        'data-testid': 'suspense-fallback',
        children: fallback
      }),
      React.createElement('div', {
        key: 'content',
        'data-testid': 'suspense-content',
        children
      })
    ]
  });
});

// ===================================
// MOCK MODULES
// ===================================

// Mock del módulo admin page
export const mockAdminPageModule = {
  default: MockAdminDashboard,
  AdminPage: MockAdminDashboard
};

// Mock del módulo product list
export const mockProductListModule = {
  default: MockProductList,
  ProductList: MockProductList
};

// Mock del módulo product form
export const mockProductFormModule = {
  default: MockProductForm,
  ProductForm: MockProductForm
};

// Mock del módulo logistics map
export const mockLogisticsMapModule = {
  default: MockLogisticsMap,
  LogisticsMap: MockLogisticsMap
};

// Mock del módulo real time dashboard
export const mockRealTimeDashboardModule = {
  default: MockRealTimeDashboard,
  RealTimeDashboard: MockRealTimeDashboard
};

// ===================================
// MOCK FACTORIES
// ===================================

// Factory para crear mocks de import dinámico
export const createMockDynamicImport = (component: React.ComponentType, delay = 100) => {
  return jest.fn(() => 
    new Promise((resolve) => {
      setTimeout(() => {
        resolve({ default: component });
      }, delay);
    })
  );
};

// Factory para crear mocks de import que fallan
export const createFailingMockDynamicImport = (errorMessage = 'Failed to load component') => {
  return jest.fn(() => 
    new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(errorMessage));
      }, 100);
    })
  );
};

// ===================================
// MOCK SETUP HELPERS
// ===================================

// Helper para configurar mocks de lazy loading exitosos
export const setupSuccessfulLazyMocks = () => {
  // Mock de dynamic imports
  jest.doMock('@/app/admin/page', () => mockAdminPageModule);
  jest.doMock('@/components/admin/products/ProductList', () => mockProductListModule);
  jest.doMock('@/components/admin/products/ProductForm', () => mockProductFormModule);
  jest.doMock('@/components/admin/logistics/LogisticsMap', () => mockLogisticsMapModule);
  jest.doMock('@/components/admin/logistics/RealTimeDashboard', () => mockRealTimeDashboardModule);

  // Mock de React.lazy
  const originalLazy = React.lazy;
  React.lazy = mockLazy;

  // Mock de React.Suspense
  const originalSuspense = React.Suspense;
  React.Suspense = mockSuspense as any;

  return () => {
    // Cleanup function
    React.lazy = originalLazy;
    React.Suspense = originalSuspense;
    jest.dontMock('@/app/admin/page');
    jest.dontMock('@/components/admin/products/ProductList');
    jest.dontMock('@/components/admin/products/ProductForm');
    jest.dontMock('@/components/admin/logistics/LogisticsMap');
    jest.dontMock('@/components/admin/logistics/RealTimeDashboard');
  };
};

// Helper para configurar mocks de lazy loading que fallan
export const setupFailingLazyMocks = () => {
  // Mock de dynamic imports que fallan
  jest.doMock('@/app/admin/page', () => {
    throw new Error('Failed to load admin page');
  });
  jest.doMock('@/components/admin/products/ProductList', () => {
    throw new Error('Failed to load product list');
  });

  const originalLazy = React.lazy;
  React.lazy = jest.fn((importFn) => {
    return React.forwardRef((props: any, ref: any) => {
      React.useEffect(() => {
        importFn().catch(() => {
          // Error será manejado por error boundary
        });
      }, []);

      throw new Error('Component failed to load');
    });
  });

  return () => {
    React.lazy = originalLazy;
    jest.dontMock('@/app/admin/page');
    jest.dontMock('@/components/admin/products/ProductList');
  };
};

// ===================================
// MOCK UTILITIES
// ===================================

// Utility para simular tiempo de carga
export const simulateLoadingTime = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Utility para verificar que un componente lazy se cargó
export const waitForLazyComponent = async (testId: string, timeout = 5000) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(`[data-testid="${testId}"]`);
    if (element) {
      return element;
    }
    await simulateLoadingTime(100);
  }
  
  throw new Error(`Lazy component with testId "${testId}" did not load within ${timeout}ms`);
};

// Utility para verificar estados de loading
export const checkLoadingStates = () => {
  const loadingElements = document.querySelectorAll('[data-testid="lazy-loading"]');
  const errorElements = document.querySelectorAll('[data-testid="lazy-error"]');
  const suspenseElements = document.querySelectorAll('[data-testid="suspense-boundary"]');
  
  return {
    loading: loadingElements.length,
    errors: errorElements.length,
    suspense: suspenseElements.length,
    hasLoading: loadingElements.length > 0,
    hasErrors: errorElements.length > 0,
    hasSuspense: suspenseElements.length > 0
  };
};

// ===================================
// EXPORT DEFAULT
// ===================================

export default {
  mockLazy,
  mockSuspense,
  setupSuccessfulLazyMocks,
  setupFailingLazyMocks,
  createMockDynamicImport,
  createFailingMockDynamicImport,
  simulateLoadingTime,
  waitForLazyComponent,
  checkLoadingStates,
  components: {
    MockAdminDashboard,
    MockProductList,
    MockProductForm,
    MockLogisticsMap,
    MockRealTimeDashboard
  }
};
