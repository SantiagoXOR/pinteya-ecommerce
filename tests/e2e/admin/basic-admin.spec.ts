import { test, expect } from '@playwright/test';

test.describe('Panel Administrativo - Tests Básicos', () => {
  test('debe cargar el dashboard administrativo', async ({ page }) => {
    // Navegar al panel administrativo
    await page.goto('/admin');
    
    // Verificar que la página carga
    await expect(page).toHaveTitle(/Admin Panel - Pinteya E-commerce/);
    
    // Verificar que hay contenido principal
    await expect(page.locator('h1')).toBeVisible();
    
    // Verificar que no hay errores críticos de JavaScript
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Esperar un momento para que se ejecute JavaScript
    await page.waitForTimeout(2000);
    
    // Filtrar errores críticos (ignorar warnings y errores menores)
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('favicon') &&
      !error.includes('404') &&
      !error.includes('Failed to load resource')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('debe navegar a la página de productos', async ({ page }) => {
    await page.goto('/admin');
    
    // Buscar y hacer click en el enlace de productos
    const productLink = page.locator('text=Productos').first();
    await expect(productLink).toBeVisible();
    await productLink.click();
    
    // Verificar que navegó correctamente
    await expect(page).toHaveURL('/admin/products');
    
    // Verificar que la página de productos carga
    await expect(page.locator('h1')).toBeVisible();
  });

  test('debe mostrar el formulario de crear producto', async ({ page }) => {
    await page.goto('/admin/products/new');
    
    // Verificar que el formulario está presente
    await expect(page.locator('form')).toBeVisible();
    
    // Verificar que hay campos básicos
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="price"]')).toBeVisible();
    
    // Verificar botones de acción
    await expect(page.locator('button:has-text("Crear Producto")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancelar")')).toBeVisible();
  });

  test('debe validar campos requeridos en el formulario', async ({ page }) => {
    await page.goto('/admin/products/new');
    
    // Intentar enviar formulario vacío
    await page.click('button:has-text("Crear Producto")');
    
    // Verificar que aparecen mensajes de error
    const errorMessages = page.locator('text=requerido');
    await expect(errorMessages.first()).toBeVisible();
  });

  test('debe ser responsive en móviles', async ({ page }) => {
    // Cambiar a viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/admin');
    
    // Verificar que la página carga en móvil
    await expect(page.locator('h1')).toBeVisible();
    
    // Verificar que el contenido se adapta
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('debe cargar rápidamente', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/admin');
    await page.waitForSelector('h1');
    
    const loadTime = Date.now() - startTime;
    
    // Verificar que carga en menos de 5 segundos (más permisivo)
    expect(loadTime).toBeLessThan(5000);
  });

  test('debe manejar rutas no encontradas', async ({ page }) => {
    await page.goto('/admin/ruta-que-no-existe');
    
    // Debería redirigir o mostrar error 404
    // Verificar que no se queda en blanco
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);
  });

  test('debe tener navegación funcional entre páginas', async ({ page }) => {
    // Ir al admin
    await page.goto('/admin');
    await expect(page.locator('h1')).toBeVisible();
    
    // Ir a productos
    await page.goto('/admin/products');
    await expect(page.locator('h1')).toBeVisible();
    
    // Ir a crear producto
    await page.goto('/admin/products/new');
    await expect(page.locator('form')).toBeVisible();
    
    // Usar botón atrás del navegador
    await page.goBack();
    await expect(page).toHaveURL('/admin/products');
  });

  test('debe mostrar contenido apropiado en cada página', async ({ page }) => {
    // Dashboard
    await page.goto('/admin');
    await expect(page.locator('text=Panel')).toBeVisible();
    
    // Productos
    await page.goto('/admin/products');
    await expect(page.locator('text=Productos')).toBeVisible();
    
    // Nuevo producto
    await page.goto('/admin/products/new');
    await expect(page.locator('text=Crear')).toBeVisible();
  });
});
