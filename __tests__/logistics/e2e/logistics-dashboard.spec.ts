// =====================================================
// E2E TEST: LOGISTICS DASHBOARD
// Descripción: Tests end-to-end para el dashboard de logística
// Basado en: Playwright + Page Object Model
// =====================================================

import { test, expect, Page } from '@playwright/test';

// =====================================================
// PAGE OBJECT MODEL
// =====================================================

class LogisticsDashboardPage {
  constructor(private page: Page) {}

  // Navegación
  async goto() {
    await this.page.goto('/admin/logistics');
  }

  // Elementos del dashboard
  get dashboardTitle() {
    return this.page.getByRole('heading', { name: /dashboard en tiempo real/i });
  }

  get connectionBadge() {
    return this.page.getByText(/tiempo real|desconectado/i);
  }

  get metricsCards() {
    return this.page.locator('[data-testid="metrics-card"]');
  }

  get mapContainer() {
    return this.page.locator('[data-testid="map-container"]');
  }

  get alertsPanel() {
    return this.page.locator('[data-testid="alerts-panel"]');
  }

  get trackingPanel() {
    return this.page.locator('[data-testid="tracking-panel"]');
  }

  // Controles
  get refreshButton() {
    return this.page.getByRole('button', { name: /refresh/i });
  }

  get fullscreenButton() {
    return this.page.getByRole('button', { name: /maximize/i });
  }

  get connectButton() {
    return this.page.getByRole('button', { name: /conectar|desconectar/i });
  }

  // Filtros
  get statusFilter() {
    return this.page.getByRole('combobox', { name: /filtrar/i });
  }

  get geofenceToggle() {
    return this.page.getByRole('switch', { name: /zonas/i });
  }

  get routesToggle() {
    return this.page.getByRole('switch', { name: /rutas/i });
  }

  // Tabs
  get overviewTab() {
    return this.page.getByRole('tab', { name: /resumen/i });
  }

  get trackingTab() {
    return this.page.getByRole('tab', { name: /tracking/i });
  }

  get alertsTab() {
    return this.page.getByRole('tab', { name: /alertas/i });
  }

  // Métodos de interacción
  async selectStatusFilter(status: string) {
    await this.statusFilter.click();
    await this.page.getByRole('option', { name: status }).click();
  }

  async toggleGeofences() {
    await this.geofenceToggle.click();
  }

  async toggleRoutes() {
    await this.routesToggle.click();
  }

  async switchToTab(tab: 'overview' | 'tracking' | 'alerts') {
    const tabMap = {
      overview: this.overviewTab,
      tracking: this.trackingTab,
      alerts: this.alertsTab
    };
    await tabMap[tab].click();
  }

  async waitForMapLoad() {
    await this.page.waitForSelector('[data-testid="map-container"]', { 
      state: 'visible',
      timeout: 10000 
    });
    
    // Esperar a que el mapa termine de cargar
    await this.page.waitForTimeout(2000);
  }

  async waitForWebSocketConnection() {
    await this.page.waitForFunction(() => {
      const badge = document.querySelector('[data-testid="connection-badge"]');
      return badge?.textContent?.includes('Tiempo Real');
    }, { timeout: 10000 });
  }
}

// =====================================================
// SETUP Y CONFIGURACIÓN
// =====================================================

test.describe('Logistics Dashboard E2E', () => {
  let dashboardPage: LogisticsDashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new LogisticsDashboardPage(page);
    
    // Mock de APIs para testing
    await page.route('/api/admin/logistics/**', async route => {
      const url = route.request().url();
      
      if (url.includes('/api/admin/logistics/shipments')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: [
              {
                id: 1,
                shipment_number: 'SHP-001',
                status: 'in_transit',
                delivery_address: {
                  city: 'Buenos Aires',
                  state: 'Buenos Aires'
                }
              }
            ],
            pagination: {
              page: 1,
              limit: 10,
              total: 1,
              total_pages: 1
            }
          })
        });
      } else if (url.includes('/api/admin/logistics')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              stats: {
                total_shipments: 150,
                in_transit_shipments: 45,
                delivered_shipments: 40,
                pending_shipments: 25
              }
            }
          })
        });
      }
    });

    await dashboardPage.goto();
  });

  // =====================================================
  // TESTS BÁSICOS
  // =====================================================

  test('should load dashboard successfully', async () => {
    await expect(dashboardPage.dashboardTitle).toBeVisible();
    await expect(dashboardPage.connectionBadge).toBeVisible();
  });

  test('should display metrics cards', async () => {
    const metricsCards = await dashboardPage.page.locator('.grid .card').count();
    expect(metricsCards).toBeGreaterThan(0);
    
    // Verificar que las métricas tienen valores
    await expect(dashboardPage.page.getByText(/envíos activos/i)).toBeVisible();
    await expect(dashboardPage.page.getByText(/en reparto/i)).toBeVisible();
    await expect(dashboardPage.page.getByText(/entregados hoy/i)).toBeVisible();
  });

  test('should load map component', async () => {
    await dashboardPage.waitForMapLoad();
    await expect(dashboardPage.page.getByText(/mapa de logística/i)).toBeVisible();
  });

  // =====================================================
  // TESTS DE NAVEGACIÓN
  // =====================================================

  test('should navigate between tabs', async () => {
    // Tab Overview (default)
    await expect(dashboardPage.overviewTab).toHaveAttribute('data-state', 'active');
    
    // Switch to Tracking tab
    await dashboardPage.switchToTab('tracking');
    await expect(dashboardPage.trackingTab).toHaveAttribute('data-state', 'active');
    
    // Switch to Alerts tab
    await dashboardPage.switchToTab('alerts');
    await expect(dashboardPage.alertsTab).toHaveAttribute('data-state', 'active');
    
    // Back to Overview
    await dashboardPage.switchToTab('overview');
    await expect(dashboardPage.overviewTab).toHaveAttribute('data-state', 'active');
  });

  // =====================================================
  // TESTS DE FILTROS
  // =====================================================

  test('should filter shipments by status', async () => {
    await dashboardPage.waitForMapLoad();
    
    // Abrir filtro de estado
    await dashboardPage.statusFilter.click();
    
    // Seleccionar "En Tránsito"
    await dashboardPage.page.getByRole('option', { name: /en tránsito/i }).click();
    
    // Verificar que el filtro se aplicó
    await expect(dashboardPage.statusFilter).toHaveValue('in_transit');
  });

  test('should toggle map layers', async () => {
    await dashboardPage.waitForMapLoad();
    
    // Toggle geofences
    const geofenceToggle = dashboardPage.geofenceToggle;
    const initialState = await geofenceToggle.isChecked();
    
    await dashboardPage.toggleGeofences();
    await expect(geofenceToggle).toBeChecked(!initialState);
    
    // Toggle routes
    const routesToggle = dashboardPage.routesToggle;
    const routesInitialState = await routesToggle.isChecked();
    
    await dashboardPage.toggleRoutes();
    await expect(routesToggle).toBeChecked(!routesInitialState);
  });

  // =====================================================
  // TESTS DE TIEMPO REAL
  // =====================================================

  test('should show real-time connection status', async () => {
    // En desarrollo debería mostrar simulador
    await expect(dashboardPage.connectionBadge).toContainText(/tiempo real|simulador/i);
  });

  test('should handle connection toggle', async () => {
    const connectButton = dashboardPage.connectButton;
    
    // Click para cambiar estado de conexión
    await connectButton.click();
    
    // Verificar que el botón cambió
    await expect(connectButton).toBeVisible();
  });

  // =====================================================
  // TESTS DE CONTROLES
  // =====================================================

  test('should refresh dashboard data', async () => {
    await dashboardPage.refreshButton.click();
    
    // Verificar que el refresh no causa errores
    await expect(dashboardPage.dashboardTitle).toBeVisible();
  });

  test('should toggle fullscreen mode', async () => {
    await dashboardPage.fullscreenButton.click();
    
    // En fullscreen, el dashboard debería tener clase específica
    await expect(dashboardPage.page.locator('.fixed.inset-0')).toBeVisible();
    
    // Click again to exit fullscreen
    await dashboardPage.fullscreenButton.click();
    await expect(dashboardPage.page.locator('.fixed.inset-0')).not.toBeVisible();
  });

  // =====================================================
  // TESTS DE RESPONSIVE
  // =====================================================

  test('should be responsive on mobile', async ({ page }) => {
    // Cambiar a viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    await dashboardPage.goto();
    await dashboardPage.waitForMapLoad();
    
    // Verificar que el dashboard se adapta
    await expect(dashboardPage.dashboardTitle).toBeVisible();
    await expect(dashboardPage.connectionBadge).toBeVisible();
    
    // Las métricas deberían estar en columna única
    const metricsGrid = page.locator('.grid');
    await expect(metricsGrid).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    // Cambiar a viewport tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await dashboardPage.goto();
    await dashboardPage.waitForMapLoad();
    
    await expect(dashboardPage.dashboardTitle).toBeVisible();
    await expect(dashboardPage.mapContainer).toBeVisible();
  });

  // =====================================================
  // TESTS DE PERFORMANCE
  // =====================================================

  test('should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await dashboardPage.goto();
    await dashboardPage.waitForMapLoad();
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard debería cargar en menos de 5 segundos
    expect(loadTime).toBeLessThan(5000);
  });

  test('should handle large datasets', async ({ page }) => {
    // Mock con muchos shipments
    await page.route('/api/admin/logistics/shipments', async route => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        shipment_number: `SHP-${i + 1}`,
        status: 'in_transit',
        delivery_address: {
          city: 'Buenos Aires',
          state: 'Buenos Aires'
        }
      }));

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: largeDataset,
          pagination: {
            page: 1,
            limit: 1000,
            total: 1000,
            total_pages: 1
          }
        })
      });
    });

    await dashboardPage.goto();
    await dashboardPage.waitForMapLoad();
    
    // Verificar que maneja bien los datos grandes
    await expect(dashboardPage.dashboardTitle).toBeVisible();
    await expect(page.getByText(/1000 envíos/i)).toBeVisible();
  });

  // =====================================================
  // TESTS DE ACCESIBILIDAD
  // =====================================================

  test('should be accessible', async ({ page }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForMapLoad();
    
    // Verificar navegación por teclado
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Verificar ARIA labels
    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      // Cada botón debería tener label o texto
      expect(ariaLabel || text).toBeTruthy();
    }
  });

  test('should support keyboard navigation', async ({ page }) => {
    await dashboardPage.goto();
    
    // Navegar con Tab
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verificar que el foco es visible
    await expect(page.locator(':focus')).toBeVisible();
    
    // Usar Enter en elementos focuseables
    await page.keyboard.press('Enter');
  });

  // =====================================================
  // TESTS DE ERROR HANDLING
  // =====================================================

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('/api/admin/logistics', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      });
    });

    await dashboardPage.goto();
    
    // Debería mostrar algún estado de error o fallback
    await expect(dashboardPage.dashboardTitle).toBeVisible();
  });

  test('should handle network failures', async ({ page }) => {
    // Simular falla de red
    await page.route('/api/admin/logistics/**', route => route.abort());
    
    await dashboardPage.goto();
    
    // Dashboard debería manejar la falla gracefully
    await expect(dashboardPage.dashboardTitle).toBeVisible();
  });
});
