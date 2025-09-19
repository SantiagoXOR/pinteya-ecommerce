// ===================================
// PINTEYA E-COMMERCE - MONITORING DASHBOARD E2E TESTS
// ===================================

import { test, expect, Page } from '@playwright/test';

// Configuración de test
test.describe('Monitoring Dashboard E2E', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Mock de autenticación admin
    await page.route('**/api/auth/**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: 'admin-123', role: 'admin' },
          isAdmin: true
        })
      });
    });

    // Mock de métricas del dashboard
    await page.route('**/api/admin/monitoring/metrics', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            metrics: {
              performance: {
                responseTime: 285,
                errorRate: 0.004,
                throughput: 120,
                uptime: 0.9997
              },
              business: {
                totalRevenue: 15000.50,
                ordersToday: 25,
                conversionRate: 0.034,
                activeUsers: 42
              },
              security: {
                securityEvents: 2,
                blockedRequests: 1,
                authFailures: 0,
                riskLevel: 'low'
              },
              infrastructure: {
                circuitBreakerStatus: 'closed',
                cacheHitRate: 0.87,
                databaseConnections: 8,
                memoryUsage: 0.65
              }
            },
            alerts: [
              {
                id: 'alert-1',
                level: 'warning',
                message: 'Response time above threshold',
                timestamp: new Date().toISOString(),
                metric: 'performance.api.duration',
                value: 1200,
                threshold: 1000
              }
            ],
            trends: {
              'performance.api.duration': [
                { timestamp: new Date(Date.now() - 3600000).toISOString(), value: 250 },
                { timestamp: new Date(Date.now() - 1800000).toISOString(), value: 285 },
                { timestamp: new Date().toISOString(), value: 300 }
              ]
            },
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    // Mock de health checks
    await page.route('**/api/admin/monitoring/health', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            overall: 'healthy',
            services: [
              {
                service: 'database',
                status: 'healthy',
                responseTime: 150,
                message: 'Database responding in 150ms',
                lastChecked: new Date().toISOString()
              },
              {
                service: 'cache',
                status: 'healthy',
                responseTime: 25,
                message: 'Cache responding in 25ms',
                lastChecked: new Date().toISOString()
              }
            ],
            summary: { healthy: 2, degraded: 0, unhealthy: 0, total: 2 },
            uptime: 99.97,
            version: '3.0.0',
            timestamp: new Date().toISOString()
          }
        })
      });
    });
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('debe cargar el dashboard de monitoreo correctamente', async () => {
    await page.goto('/admin/monitoring');

    // Verificar título
    await expect(page.locator('h1')).toContainText('Dashboard de Monitoreo');
    
    // Verificar descripción
    await expect(page.getByText('Métricas en tiempo real del sistema Pinteya E-commerce')).toBeVisible();
  });

  test('debe mostrar métricas de performance', async () => {
    await page.goto('/admin/monitoring');

    // Esperar a que carguen las métricas
    await page.waitForSelector('[data-testid="performance-metrics"]', { timeout: 10000 });

    // Verificar métricas de performance
    await expect(page.getByText('285ms')).toBeVisible(); // Response time
    await expect(page.getByText('0,40%')).toBeVisible(); // Error rate
    await expect(page.getByText('120')).toBeVisible(); // Throughput
    await expect(page.getByText('99,97%')).toBeVisible(); // Uptime
  });

  test('debe mostrar métricas de negocio', async () => {
    await page.goto('/admin/monitoring');

    // Esperar a que carguen las métricas
    await page.waitForSelector('[data-testid="business-metrics"]', { timeout: 10000 });

    // Verificar métricas de negocio
    await expect(page.getByText('$ 15.000,50')).toBeVisible(); // Revenue
    await expect(page.getByText('25')).toBeVisible(); // Orders
    await expect(page.getByText('3,4%')).toBeVisible(); // Conversion
    await expect(page.getByText('42')).toBeVisible(); // Active users
  });

  test('debe mostrar alertas activas', async () => {
    await page.goto('/admin/monitoring');

    // Esperar a que carguen las alertas
    await page.waitForSelector('[data-testid="active-alerts"]', { timeout: 10000 });

    // Verificar alertas
    await expect(page.getByText('Alertas Activas (1)')).toBeVisible();
    await expect(page.getByText('Response time above threshold')).toBeVisible();
    await expect(page.getByText('WARNING')).toBeVisible();
  });

  test('debe mostrar métricas de seguridad', async () => {
    await page.goto('/admin/monitoring');

    // Esperar a que carguen las métricas de seguridad
    await page.waitForSelector('[data-testid="security-metrics"]', { timeout: 10000 });

    // Verificar métricas de seguridad
    await expect(page.getByText('LOW')).toBeVisible(); // Risk level
    await expect(page.getByText('2')).toBeVisible(); // Security events
    await expect(page.getByText('1')).toBeVisible(); // Blocked requests
    await expect(page.getByText('0')).toBeVisible(); // Auth failures
  });

  test('debe mostrar métricas de infraestructura', async () => {
    await page.goto('/admin/monitoring');

    // Esperar a que carguen las métricas de infraestructura
    await page.waitForSelector('[data-testid="infrastructure-metrics"]', { timeout: 10000 });

    // Verificar métricas de infraestructura
    await expect(page.getByText('CLOSED')).toBeVisible(); // Circuit breaker
    await expect(page.getByText('87,0%')).toBeVisible(); // Cache hit rate
    await expect(page.getByText('8')).toBeVisible(); // DB connections
    await expect(page.getByText('65,0%')).toBeVisible(); // Memory usage
  });

  test('debe permitir pausar y reanudar auto-refresh', async () => {
    await page.goto('/admin/monitoring');

    // Buscar botón de pausa
    const pauseButton = page.getByRole('button', { name: /pausar/i });
    await expect(pauseButton).toBeVisible();

    // Hacer click en pausar
    await pauseButton.click();

    // Verificar que cambió a "Reanudar"
    await expect(page.getByRole('button', { name: /reanudar/i })).toBeVisible();

    // Hacer click en reanudar
    await page.getByRole('button', { name: /reanudar/i }).click();

    // Verificar que volvió a "Pausar"
    await expect(page.getByRole('button', { name: /pausar/i })).toBeVisible();
  });

  test('debe permitir refresh manual', async () => {
    await page.goto('/admin/monitoring');

    // Buscar botón de actualizar
    const refreshButton = page.getByRole('button', { name: /actualizar/i });
    await expect(refreshButton).toBeVisible();

    // Hacer click en actualizar
    await refreshButton.click();

    // Verificar que se muestra el timestamp de última actualización
    await expect(page.getByText(/última actualización:/i)).toBeVisible();
  });

  test('debe mostrar timestamp de última actualización', async () => {
    await page.goto('/admin/monitoring');

    // Esperar a que aparezca el timestamp
    await expect(page.getByText(/última actualización:/i)).toBeVisible({ timeout: 10000 });
  });

  test('debe ser responsive en móvil', async () => {
    // Configurar viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/admin/monitoring');

    // Verificar que el contenido se adapta
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('Dashboard de Monitoreo')).toBeVisible();

    // Verificar que las métricas se muestran en columnas
    const metricsGrid = page.locator('[data-testid="metrics-grid"]');
    await expect(metricsGrid).toBeVisible();
  });

  test('debe manejar errores de carga gracefully', async () => {
    // Mock error en API
    await page.route('**/api/admin/monitoring/metrics', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Internal server error'
        })
      });
    });

    await page.goto('/admin/monitoring');

    // Verificar que se muestra el error
    await expect(page.getByText('Error de Conexión')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Internal server error')).toBeVisible();
  });

  test('debe auto-refresh cada 5 segundos', async () => {
    let requestCount = 0;
    
    await page.route('**/api/admin/monitoring/metrics', async route => {
      requestCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            metrics: {
              performance: { responseTime: 285 + requestCount * 10 },
              business: {},
              security: {},
              infrastructure: {}
            },
            alerts: [],
            trends: {},
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    await page.goto('/admin/monitoring');

    // Esperar primera carga
    await page.waitForSelector('[data-testid="performance-metrics"]');
    expect(requestCount).toBe(1);

    // Esperar 6 segundos para el auto-refresh
    await page.waitForTimeout(6000);
    expect(requestCount).toBeGreaterThan(1);
  });

  test('debe navegar desde el admin dashboard', async () => {
    // Ir al dashboard principal del admin
    await page.goto('/admin');

    // Buscar y hacer click en el enlace de monitoreo
    const monitoringLink = page.getByRole('link', { name: /monitoreo/i });
    await expect(monitoringLink).toBeVisible();
    await monitoringLink.click();

    // Verificar que navegó correctamente
    await expect(page).toHaveURL('/admin/monitoring');
    await expect(page.getByText('Dashboard de Monitoreo')).toBeVisible();
  });

  test('debe mostrar información del sistema', async () => {
    await page.goto('/admin/monitoring');

    // Verificar información del sistema en el footer
    await expect(page.getByText('Dashboard de Monitoreo Enterprise - Pinteya E-commerce v3.0')).toBeVisible();
    await expect(page.getByText('Versión: 3.0.0')).toBeVisible();
  });

  test('debe mostrar cards de información del sistema', async () => {
    await page.goto('/admin/monitoring');

    // Verificar cards de información
    await expect(page.getByText('Óptimo')).toBeVisible(); // Performance
    await expect(page.getByText('Seguro')).toBeVisible(); // Security
    await expect(page.getByText('99.97%')).toBeVisible(); // Availability
    await expect(page.getByText('+12%')).toBeVisible(); // Trend
  });

  test('debe mostrar información de compliance', async () => {
    await page.goto('/admin/monitoring');

    // Verificar información de compliance
    await expect(page.getByText('ISO/IEC 27001:2013')).toBeVisible();
    await expect(page.getByText('✓ Compliant')).toBeVisible();
    await expect(page.getByText('GDPR')).toBeVisible();
    await expect(page.getByText('✓ AES-256')).toBeVisible();
  });

  test('debe mostrar información de soporte', async () => {
    await page.goto('/admin/monitoring');

    // Verificar información de soporte
    await expect(page.getByText('/docs/monitoring/dashboard')).toBeVisible();
    await expect(page.getByText('/api/admin/monitoring/*')).toBeVisible();
    await expect(page.getByText('Enterprise support')).toBeVisible();
  });

  test('debe manejar múltiples alertas', async () => {
    // Mock múltiples alertas
    await page.route('**/api/admin/monitoring/metrics', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            metrics: {
              performance: {},
              business: {},
              security: {},
              infrastructure: {}
            },
            alerts: [
              {
                id: 'alert-1',
                level: 'warning',
                message: 'Response time above threshold',
                timestamp: new Date().toISOString(),
                metric: 'performance.api.duration',
                value: 1200,
                threshold: 1000
              },
              {
                id: 'alert-2',
                level: 'critical',
                message: 'Error rate too high',
                timestamp: new Date().toISOString(),
                metric: 'performance.api.error_rate',
                value: 0.1,
                threshold: 0.05
              },
              {
                id: 'alert-3',
                level: 'emergency',
                message: 'System overload detected',
                timestamp: new Date().toISOString(),
                metric: 'system.load',
                value: 0.95,
                threshold: 0.8
              }
            ],
            trends: {},
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    await page.goto('/admin/monitoring');

    // Verificar que se muestran múltiples alertas
    await expect(page.getByText('Alertas Activas (3)')).toBeVisible();
    await expect(page.getByText('WARNING')).toBeVisible();
    await expect(page.getByText('CRITICAL')).toBeVisible();
    await expect(page.getByText('EMERGENCY')).toBeVisible();
  });

  test('debe funcionar sin alertas', async () => {
    // Mock sin alertas
    await page.route('**/api/admin/monitoring/metrics', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            metrics: {
              performance: { responseTime: 285 },
              business: {},
              security: {},
              infrastructure: {}
            },
            alerts: [],
            trends: {},
            timestamp: new Date().toISOString()
          }
        })
      });
    });

    await page.goto('/admin/monitoring');

    // Verificar que no se muestra la sección de alertas
    await expect(page.getByText('Alertas Activas')).not.toBeVisible();
  });
});









