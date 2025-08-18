# 🧪 Estrategia de Testing - Panel Administrativo

**Versión:** 1.0  
**Fecha:** Enero 2025  
**Cobertura Objetivo:** 90%+  
**Frameworks:** Jest + RTL + Playwright + MSW  

---

## 🎯 **OBJETIVOS DE TESTING**

### **Métricas de Calidad**
- ✅ **Cobertura de Código:** 90%+ líneas, 85%+ ramas
- ✅ **Performance:** APIs < 300ms, UI < 100ms
- ✅ **Accesibilidad:** WCAG 2.1 AA compliant
- ✅ **Cross-browser:** Chrome, Firefox, Safari, Edge
- ✅ **Responsive:** 320px - 1920px breakpoints

### **Tipos de Testing**
1. **Unit Tests** - Componentes y funciones aisladas
2. **Integration Tests** - APIs y flujos de datos
3. **E2E Tests** - Flujos completos de usuario
4. **Visual Regression** - Consistencia visual
5. **Performance Tests** - Métricas de rendimiento
6. **Accessibility Tests** - Cumplimiento WCAG

---

## 🏗️ **ARQUITECTURA DE TESTING**

### **Estructura de Archivos**
```
src/
├── components/
│   └── admin/
│       ├── __tests__/           # Unit tests
│       ├── __mocks__/           # Mocks específicos
│       └── component.test.tsx
├── hooks/
│   └── admin/
│       └── __tests__/
├── lib/
│   └── __tests__/
└── app/
    └── api/
        └── admin/
            └── __tests__/       # API tests

tests/
├── e2e/                         # Playwright E2E
│   ├── admin/
│   │   ├── products.spec.ts
│   │   ├── orders.spec.ts
│   │   └── logistics.spec.ts
│   └── fixtures/
├── integration/                 # Integration tests
│   └── api/
└── utils/                       # Test utilities
    ├── test-utils.tsx
    ├── mock-data.ts
    └── test-server.ts
```

### **Configuración Base**
```typescript
// tests/utils/test-utils.tsx

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/nextjs';
import { Provider } from 'react-redux';
import { store } from '@/redux/store';

// Mock de Clerk para testing
const mockClerkProvider = ({ children }: { children: React.ReactNode }) => (
  <div data-testid="mock-clerk-provider">{children}</div>
);

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withAuth?: boolean;
  withQuery?: boolean;
  withRedux?: boolean;
  initialState?: any;
}

function createWrapper({
  withAuth = true,
  withQuery = true,
  withRedux = true,
  initialState
}: CustomRenderOptions = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    let component = children;

    // Redux Provider
    if (withRedux) {
      const testStore = initialState ? 
        configureStore({ reducer: store.getState(), preloadedState: initialState }) : 
        store;
      component = <Provider store={testStore}>{component}</Provider>;
    }

    // React Query Provider
    if (withQuery) {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false }
        }
      });
      component = (
        <QueryClientProvider client={queryClient}>
          {component}
        </QueryClientProvider>
      );
    }

    // Auth Provider
    if (withAuth) {
      component = React.createElement(mockClerkProvider, {}, component);
    }

    return component;
  };
}

export function customRender(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { withAuth, withQuery, withRedux, initialState, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: createWrapper({ withAuth, withQuery, withRedux, initialState }),
    ...renderOptions
  });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };
```

---

## 🧪 **UNIT TESTING**

### **Componentes Administrativos**
```typescript
// src/components/admin/__tests__/ProductList.test.tsx

import { render, screen, fireEvent, waitFor } from '@/tests/utils/test-utils';
import { ProductList } from '../products/ProductList';
import { mockProducts } from '@/tests/utils/mock-data';
import { server } from '@/tests/utils/test-server';
import { rest } from 'msw';

describe('ProductList', () => {
  beforeEach(() => {
    // Setup MSW handlers
    server.use(
      rest.get('/api/admin/products', (req, res, ctx) => {
        return res(
          ctx.json({
            data: mockProducts,
            success: true,
            meta: { total: mockProducts.length, page: 1, limit: 10 }
          })
        );
      })
    );
  });

  it('should render products list correctly', async () => {
    render(<ProductList />);

    // Loading state
    expect(screen.getByTestId('products-loading')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Producto Test 1')).toBeInTheDocument();
      expect(screen.getByText('Producto Test 2')).toBeInTheDocument();
    });
  });

  it('should handle search functionality', async () => {
    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Producto Test 1')).toBeInTheDocument();
    });

    // Search for specific product
    const searchInput = screen.getByPlaceholderText('Buscar productos...');
    fireEvent.change(searchInput, { target: { value: 'Test 1' } });

    // Wait for debounced search
    await waitFor(() => {
      expect(screen.getByText('Producto Test 1')).toBeInTheDocument();
      expect(screen.queryByText('Producto Test 2')).not.toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('should handle product selection', async () => {
    const onSelectionChange = jest.fn();
    
    render(<ProductList onSelectionChange={onSelectionChange} />);

    await waitFor(() => {
      expect(screen.getByText('Producto Test 1')).toBeInTheDocument();
    });

    // Select first product
    const checkbox = screen.getAllByRole('checkbox')[1]; // Skip header checkbox
    fireEvent.click(checkbox);

    expect(onSelectionChange).toHaveBeenCalledWith([mockProducts[0]]);
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    server.use(
      rest.get('/api/admin/products', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ success: false, error: 'Error del servidor' })
        );
      })
    );

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar productos')).toBeInTheDocument();
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
    });
  });

  it('should show empty state when no products', async () => {
    server.use(
      rest.get('/api/admin/products', (req, res, ctx) => {
        return res(
          ctx.json({
            data: [],
            success: true,
            meta: { total: 0, page: 1, limit: 10 }
          })
        );
      })
    );

    render(<ProductList />);

    await waitFor(() => {
      expect(screen.getByText('No hay productos disponibles')).toBeInTheDocument();
      expect(screen.getByText('Crear Primer Producto')).toBeInTheDocument();
    });
  });
});
```

### **Hooks Personalizados**
```typescript
// src/hooks/admin/__tests__/useAdminData.test.ts

import { renderHook, waitFor } from '@testing-library/react';
import { useAdminData } from '../useAdminData';
import { createWrapper } from '@/tests/utils/test-utils';
import { server } from '@/tests/utils/test-server';
import { rest } from 'msw';

describe('useAdminData', () => {
  it('should fetch data successfully', async () => {
    server.use(
      rest.get('/api/admin/test', (req, res, ctx) => {
        return res(
          ctx.json({
            data: { id: 1, name: 'Test' },
            success: true
          })
        );
      })
    );

    const { result } = renderHook(
      () => useAdminData({
        endpoint: '/api/admin/test'
      }),
      { wrapper: createWrapper({ withQuery: true }) }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual({ id: 1, name: 'Test' });
    });
  });

  it('should handle errors correctly', async () => {
    server.use(
      rest.get('/api/admin/test', (req, res, ctx) => {
        return res(
          ctx.status(500),
          ctx.json({ success: false, error: 'Server error' })
        );
      })
    );

    const { result } = renderHook(
      () => useAdminData({
        endpoint: '/api/admin/test'
      }),
      { wrapper: createWrapper({ withQuery: true }) }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBeDefined();
    });
  });

  it('should refetch data when params change', async () => {
    const { result, rerender } = renderHook(
      ({ params }) => useAdminData({
        endpoint: '/api/admin/test',
        params
      }),
      {
        wrapper: createWrapper({ withQuery: true }),
        initialProps: { params: { page: 1 } }
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Change params
    rerender({ params: { page: 2 } });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});
```

---

## 🔗 **INTEGRATION TESTING**

### **API Testing**
```typescript
// src/app/api/admin/__tests__/products.test.ts

import { createMocks } from 'node-mocks-http';
import { GET, POST } from '../products/route';
import { mockUser, mockSupabaseClient } from '@/tests/utils/mock-data';

// Mock dependencies
jest.mock('@/lib/auth/enterprise-auth-utils');
jest.mock('@/lib/supabase/client');

describe('/api/admin/products', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful auth
    (requireAdminAuth as jest.Mock).mockResolvedValue({
      success: true,
      user: mockUser,
      supabase: mockSupabaseClient
    });
  });

  describe('GET /api/admin/products', () => {
    it('should return products list', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/products?page=1&limit=10'
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: [
                  { id: 1, name: 'Producto 1', price: 100 },
                  { id: 2, name: 'Producto 2', price: 200 }
                ],
                error: null,
                count: 2
              })
            })
          })
        })
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.meta.total).toBe(2);
    });

    it('should handle database errors', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/products'
      });

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          or: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
                count: null
              })
            })
          })
        })
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Error al obtener productos');
    });
  });

  describe('POST /api/admin/products', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'Nuevo Producto',
        description: 'Descripción del producto',
        price: 150,
        stock: 10,
        category_id: 1
      };

      const { req } = createMocks({
        method: 'POST',
        body: productData
      });

      // Mock category check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 1, name: 'Categoría Test' },
              error: null
            })
          })
        })
      });

      // Mock product creation
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 3, ...productData },
              error: null
            })
          })
        })
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe(productData.name);
    });

    it('should validate required fields', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: { name: '' } // Invalid data
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
      expect(data.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

---

## 🎭 **E2E TESTING**

### **Playwright Configuration**
```typescript
// tests/e2e/playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/results.xml' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] }
    }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

### **E2E Test Example**
```typescript
// tests/e2e/admin/products.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Admin Products Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/admin/login');
    await page.fill('[data-testid="email-input"]', 'admin@pinteya.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin');
    
    // Navigate to products
    await page.click('[data-testid="products-nav-link"]');
    await page.waitForURL('/admin/products');
  });

  test('should display products list', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Gestión de Productos');
    
    // Check products table
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
    
    // Check at least one product row
    await expect(page.locator('[data-testid="product-row"]').first()).toBeVisible();
  });

  test('should create new product', async ({ page }) => {
    // Click create button
    await page.click('[data-testid="create-product-button"]');
    
    // Fill form
    await page.fill('[data-testid="product-name-input"]', 'Producto E2E Test');
    await page.fill('[data-testid="product-description-input"]', 'Descripción de prueba');
    await page.fill('[data-testid="product-price-input"]', '299.99');
    await page.fill('[data-testid="product-stock-input"]', '50');
    await page.selectOption('[data-testid="product-category-select"]', '1');
    
    // Submit form
    await page.click('[data-testid="save-product-button"]');
    
    // Check success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Producto creado exitosamente');
    
    // Verify product appears in list
    await expect(page.locator('[data-testid="products-table"]')).toContainText('Producto E2E Test');
  });

  test('should edit existing product', async ({ page }) => {
    // Click edit button on first product
    await page.click('[data-testid="product-row"]:first-child [data-testid="edit-button"]');
    
    // Update name
    await page.fill('[data-testid="product-name-input"]', 'Producto Editado E2E');
    
    // Save changes
    await page.click('[data-testid="save-product-button"]');
    
    // Check success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Producto actualizado exitosamente');
    
    // Verify changes in list
    await expect(page.locator('[data-testid="products-table"]')).toContainText('Producto Editado E2E');
  });

  test('should filter products by search', async ({ page }) => {
    // Get initial product count
    const initialCount = await page.locator('[data-testid="product-row"]').count();
    
    // Search for specific product
    await page.fill('[data-testid="search-input"]', 'Pintura');
    
    // Wait for search results
    await page.waitForTimeout(500); // Debounce
    
    // Check filtered results
    const filteredCount = await page.locator('[data-testid="product-row"]').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    
    // All visible products should contain search term
    const productNames = await page.locator('[data-testid="product-name"]').allTextContents();
    productNames.forEach(name => {
      expect(name.toLowerCase()).toContain('pintura');
    });
  });

  test('should handle bulk actions', async ({ page }) => {
    // Select multiple products
    await page.check('[data-testid="product-row"]:nth-child(1) [data-testid="select-checkbox"]');
    await page.check('[data-testid="product-row"]:nth-child(2) [data-testid="select-checkbox"]');
    
    // Check bulk actions appear
    await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
    
    // Test bulk delete
    await page.click('[data-testid="bulk-delete-button"]');
    
    // Confirm deletion
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Check success message
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Productos eliminados exitosamente');
  });
});
```

---

## 📊 **SCRIPTS DE TESTING**

### **Package.json Scripts**
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "test:ci": "npm run test:coverage && npm run test:e2e"
  }
}
```

---

## 🎯 **MÉTRICAS Y REPORTES**

### **Coverage Thresholds**
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/components/admin/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  }
};
```

---

## 🔗 **PRÓXIMOS DOCUMENTOS**

- [Casos de Prueba Específicos](./TEST_CASES.md)
- [Configuración de Automatización](./AUTOMATION_SETUP.md)

---

**Estado:** ✅ Completado  
**Próxima actualización:** Al implementar nuevos tipos de testing
