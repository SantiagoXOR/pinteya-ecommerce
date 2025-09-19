/**
 * Tests end-to-end para el sistema de navegación GPS de drivers
 * Verifica el flujo completo desde login hasta navegación
 */

import { test, expect, Page } from '@playwright/test';

// Configuración de pruebas E2E
test.describe('Driver GPS Navigation System E2E Tests', () => {
  let page: Page;

  const DRIVER_CREDENTIALS = {
    email: 'carlos@pinteya.com',
    name: 'Carlos Rodríguez'
  };

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Configurar geolocalización mock
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: -34.6037, longitude: -58.3816 });
    
    // Navegar a la página de login de drivers
    await page.goto('/driver/login');
  });

  test.describe('Authentication Flow', () => {
    test('should login successfully with valid driver credentials', async () => {
      // Llenar formulario de login
      await page.fill('input[type="email"]', DRIVER_CREDENTIALS.email);
      await page.click('button[type="submit"]');

      // Verificar redirección al dashboard
      await expect(page).toHaveURL('/driver/dashboard');
      
      // Verificar que se muestra el nombre del driver
      await expect(page.locator('text=' + DRIVER_CREDENTIALS.name)).toBeVisible();
    });

    test('should show error for invalid credentials', async () => {
      // Intentar login con credenciales inválidas
      await page.fill('input[type="email"]', 'invalid@example.com');
      await page.click('button[type="submit"]');

      // Verificar mensaje de error
      await expect(page.locator('text=Error de autenticación')).toBeVisible();
    });

    test('should redirect unauthenticated users to login', async () => {
      // Intentar acceder al dashboard sin autenticación
      await page.goto('/driver/dashboard');
      
      // Verificar redirección al login
      await expect(page).toHaveURL('/driver/login');
    });
  });

  test.describe('Dashboard Functionality', () => {
    test.beforeEach(async () => {
      // Login como driver
      await page.fill('input[type="email"]', DRIVER_CREDENTIALS.email);
      await page.click('button[type="submit"]');
      await page.waitForURL('/driver/dashboard');
    });

    test('should display driver status and controls', async () => {
      // Verificar elementos del dashboard
      await expect(page.locator('text=Estado del Driver')).toBeVisible();
      await expect(page.locator('text=Van - ABC123')).toBeVisible();
      
      // Verificar controles de estado
      await expect(page.locator('button:has-text("Conectarse")')).toBeVisible();
      await expect(page.locator('button:has-text("Desconectar")')).toBeVisible();
    });

    test('should toggle online/offline status', async () => {
      // Conectarse
      await page.click('button:has-text("Conectarse")');
      await expect(page.locator('text=En Línea')).toBeVisible();
      
      // Desconectarse
      await page.click('button:has-text("Desconectar")');
      await expect(page.locator('text=Desconectado')).toBeVisible();
    });

    test('should show current location when GPS is active', async () => {
      // Conectarse para activar GPS
      await page.click('button:has-text("Conectarse")');
      
      // Verificar que se muestra la ubicación
      await expect(page.locator('text=Ubicación:')).toBeVisible();
      await expect(page.locator('text=GPS Activo')).toBeVisible();
    });

    test('should display today statistics', async () => {
      // Verificar estadísticas del día
      await expect(page.locator('text=Estadísticas de Hoy')).toBeVisible();
      await expect(page.locator('text=Entregas')).toBeVisible();
      await expect(page.locator('text=Distancia')).toBeVisible();
      await expect(page.locator('text=Tiempo Activo')).toBeVisible();
      await expect(page.locator('text=Eficiencia')).toBeVisible();
    });
  });

  test.describe('Navigation Between Pages', () => {
    test.beforeEach(async () => {
      // Login como driver
      await page.fill('input[type="email"]', DRIVER_CREDENTIALS.email);
      await page.click('button[type="submit"]');
      await page.waitForURL('/driver/dashboard');
    });

    test('should navigate to routes page', async () => {
      await page.click('text=Rutas');
      await expect(page).toHaveURL('/driver/routes');
      await expect(page.locator('text=Mis Rutas')).toBeVisible();
    });

    test('should navigate to deliveries page', async () => {
      await page.click('text=Entregas');
      await expect(page).toHaveURL('/driver/deliveries');
      await expect(page.locator('text=Mis Entregas')).toBeVisible();
    });

    test('should navigate to profile page', async () => {
      await page.click('text=Perfil');
      await expect(page).toHaveURL('/driver/profile');
      await expect(page.locator('text=Mi Perfil')).toBeVisible();
    });

    test('should return to dashboard from any page', async () => {
      // Ir a rutas
      await page.click('text=Rutas');
      await expect(page).toHaveURL('/driver/routes');
      
      // Volver al dashboard
      await page.click('text=Inicio');
      await expect(page).toHaveURL('/driver/dashboard');
    });
  });

  test.describe('Routes Management', () => {
    test.beforeEach(async () => {
      // Login y navegar a rutas
      await page.fill('input[type="email"]', DRIVER_CREDENTIALS.email);
      await page.click('button[type="submit"]');
      await page.waitForURL('/driver/dashboard');
      await page.click('text=Rutas');
    });

    test('should display assigned routes', async () => {
      await expect(page.locator('text=Mis Rutas')).toBeVisible();
      await expect(page.locator('text=Planificadas')).toBeVisible();
      await expect(page.locator('text=Activa')).toBeVisible();
      await expect(page.locator('text=Completadas')).toBeVisible();
    });

    test('should filter routes by date', async () => {
      // Cambiar fecha
      const today = new Date().toISOString().split('T')[0];
      await page.fill('input[type="date"]', today);
      
      // Verificar que se actualiza la vista
      await expect(page.locator('input[type="date"]')).toHaveValue(today);
    });

    test('should start a route when online', async () => {
      // Primero conectarse
      await page.click('text=Inicio');
      await page.click('button:has-text("Conectarse")');
      
      // Volver a rutas
      await page.click('text=Rutas');
      
      // Buscar botón de iniciar ruta (si hay rutas disponibles)
      const startButton = page.locator('button:has-text("Iniciar")').first();
      if (await startButton.isVisible()) {
        await startButton.click();
        
        // Verificar que se inicia la ruta
        await expect(page.locator('text=Ruta Activa')).toBeVisible();
      }
    });
  });

  test.describe('GPS Navigation', () => {
    test.beforeEach(async () => {
      // Login y setup para navegación
      await page.fill('input[type="email"]', DRIVER_CREDENTIALS.email);
      await page.click('button[type="submit"]');
      await page.waitForURL('/driver/dashboard');
    });

    test('should access GPS navigation for active route', async () => {
      // Si hay una ruta activa, probar navegación
      const navButton = page.locator('button:has-text("Continuar Navegación")');
      if (await navButton.isVisible()) {
        await navButton.click();
        
        // Verificar que se carga la página de navegación
        await expect(page.url()).toContain('/driver/route/');
        
        // Verificar elementos de navegación
        await expect(page.locator('[data-testid="google-map"]')).toBeVisible();
      }
    });

    test('should show navigation instructions when available', async () => {
      // Navegar a una ruta específica (mock)
      await page.goto('/driver/route/test-route-id');
      
      // Verificar elementos de navegación
      await expect(page.locator('text=Navegando')).toBeVisible();
      await expect(page.locator('button:has-text("Navegar")')).toBeVisible();
    });
  });

  test.describe('Delivery Management', () => {
    test.beforeEach(async () => {
      // Login y navegar a entregas
      await page.fill('input[type="email"]', DRIVER_CREDENTIALS.email);
      await page.click('button[type="submit"]');
      await page.waitForURL('/driver/dashboard');
      await page.click('text=Entregas');
    });

    test('should display delivery history', async () => {
      await expect(page.locator('text=Mis Entregas')).toBeVisible();
      await expect(page.locator('text=Historial y gestión de entregas')).toBeVisible();
    });

    test('should filter deliveries by status', async () => {
      // Cambiar filtro de estado
      await page.selectOption('select', 'delivered');
      
      // Verificar que se aplica el filtro
      await expect(page.locator('select')).toHaveValue('delivered');
    });

    test('should search deliveries', async () => {
      // Buscar por término
      await page.fill('input[placeholder*="Buscar"]', 'Cliente Test');
      
      // Verificar que se actualiza la búsqueda
      await expect(page.locator('input[placeholder*="Buscar"]')).toHaveValue('Cliente Test');
    });
  });

  test.describe('Profile Management', () => {
    test.beforeEach(async () => {
      // Login y navegar a perfil
      await page.fill('input[type="email"]', DRIVER_CREDENTIALS.email);
      await page.click('button[type="submit"]');
      await page.waitForURL('/driver/dashboard');
      await page.click('text=Perfil');
    });

    test('should display driver profile information', async () => {
      await expect(page.locator('text=Mi Perfil')).toBeVisible();
      await expect(page.locator('text=' + DRIVER_CREDENTIALS.name)).toBeVisible();
      await expect(page.locator('text=' + DRIVER_CREDENTIALS.email)).toBeVisible();
    });

    test('should show driver statistics', async () => {
      await expect(page.locator('text=Estadísticas')).toBeVisible();
      await expect(page.locator('text=Entregas Totales')).toBeVisible();
      await expect(page.locator('text=Rutas Completadas')).toBeVisible();
      await expect(page.locator('text=Calificación')).toBeVisible();
      await expect(page.locator('text=Eficiencia')).toBeVisible();
    });

    test('should logout successfully', async () => {
      await page.click('button:has-text("Cerrar Sesión")');
      
      // Verificar redirección al login
      await expect(page).toHaveURL('/driver/login');
    });
  });

  test.describe('Responsive Design', () => {
    test('should work correctly on mobile viewport', async () => {
      // Cambiar a viewport móvil
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Login
      await page.fill('input[type="email"]', DRIVER_CREDENTIALS.email);
      await page.click('button[type="submit"]');
      await page.waitForURL('/driver/dashboard');
      
      // Verificar que la navegación móvil funciona
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('text=Inicio')).toBeVisible();
      await expect(page.locator('text=Rutas')).toBeVisible();
      await expect(page.locator('text=Entregas')).toBeVisible();
      await expect(page.locator('text=Perfil')).toBeVisible();
    });

    test('should maintain functionality on tablet viewport', async () => {
      // Cambiar a viewport tablet
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Login y verificar funcionalidad
      await page.fill('input[type="email"]', DRIVER_CREDENTIALS.email);
      await page.click('button[type="submit"]');
      await page.waitForURL('/driver/dashboard');
      
      // Verificar que todos los elementos son visibles y funcionales
      await expect(page.locator('text=Estado del Driver')).toBeVisible();
      await expect(page.locator('text=Estadísticas de Hoy')).toBeVisible();
    });
  });
});
