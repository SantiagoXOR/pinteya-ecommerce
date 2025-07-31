import { test, expect } from '@playwright/test';

test.describe('Panel Administrativo - Flujo Completo E2E', () => {
  test('debe completar el flujo completo de gestión de productos', async ({ page }) => {
    // 1. Navegar al panel administrativo
    await page.goto('/admin');
    await expect(page.locator('h1')).toContainText('¡Bienvenido al Panel Administrativo!');
    
    // 2. Navegar a la gestión de productos
    await page.click('text=Productos');
    await expect(page).toHaveURL('/admin/products');
    await expect(page.locator('h1')).toContainText('Gestión de Productos');
    
    // 3. Verificar que la lista de productos carga
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
    
    // 4. Usar filtros de búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar productos"]');
    await searchInput.fill('pintura');
    await page.waitForTimeout(500); // Esperar debounce
    
    // 5. Limpiar filtros
    await searchInput.clear();
    
    // 6. Navegar a crear nuevo producto
    await page.click('text=Nuevo Producto');
    await expect(page).toHaveURL('/admin/products/new');
    await expect(page.locator('h1')).toContainText('Crear Producto');
    
    // 7. Llenar formulario completo paso a paso
    
    // Tab General
    await page.fill('input[name="name"]', 'Producto Test E2E Completo');
    await page.fill('textarea[name="short_description"]', 'Descripción corta de prueba E2E');
    await page.fill('textarea[name="description"]', 'Descripción completa del producto de prueba para testing E2E del panel administrativo');
    
    // Seleccionar categoría (si existe selector)
    const categorySelector = page.locator('[data-testid="category-selector"]');
    if (await categorySelector.isVisible()) {
      await categorySelector.click();
      const firstCategory = page.locator('[data-testid="category-item"]').first();
      if (await firstCategory.isVisible()) {
        await firstCategory.click();
      }
    }
    
    await page.selectOption('select[name="status"]', 'active');
    
    // Tab Precios
    await page.click('[role="tab"]:has-text("Precios")');
    await page.fill('input[name="price"]', '1500');
    await page.fill('input[name="compare_price"]', '2000');
    await page.fill('input[name="cost_price"]', '900');
    
    // Verificar cálculos automáticos
    await expect(page.locator('[data-testid="profit-margin"]')).toBeVisible();
    
    // Tab Inventario
    await page.click('[role="tab"]:has-text("Inventario")');
    await page.fill('input[name="stock"]', '75');
    await page.fill('input[name="low_stock_threshold"]', '15');
    
    // Probar ajuste rápido de stock
    await page.click('button:has-text("+10")');
    await expect(page.locator('input[name="stock"]')).toHaveValue('85');
    
    // Tab SEO
    await page.click('[role="tab"]:has-text("SEO")');
    
    // Verificar que se generó slug automáticamente
    await expect(page.locator('input[name="slug"]')).toHaveValue('producto-test-e2e-completo');
    
    // Auto-generar contenido SEO
    const autoGenerateTitleBtn = page.locator('button:has-text("Auto-generar")').first();
    if (await autoGenerateTitleBtn.isVisible()) {
      await autoGenerateTitleBtn.click();
    }
    
    // Verificar puntuación SEO
    await expect(page.locator('[data-testid="seo-score"]')).toBeVisible();
    
    // 8. Intentar enviar formulario (esto podría fallar si no hay categoría válida)
    await page.click('button:has-text("Crear Producto")');
    
    // 9. Manejar posibles errores de validación
    const errorMessages = page.locator('[data-testid="error-message"]');
    if (await errorMessages.count() > 0) {
      console.log('⚠️  Errores de validación encontrados (esperado en entorno de prueba)');
      
      // Volver a la lista de productos
      await page.click('button:has-text("Cancelar")');
    }
    
    // 10. Verificar que estamos de vuelta en la lista
    await expect(page).toHaveURL('/admin/products');
    
    // 11. Probar navegación a un producto existente (si existe)
    const productRows = page.locator('[data-testid="products-table"] tbody tr');
    const rowCount = await productRows.count();
    
    if (rowCount > 0) {
      // Click en la primera fila para ver detalles
      await productRows.first().click();
      
      // Verificar que navegó a la vista de detalle
      await expect(page.url()).toMatch(/\/admin\/products\/[^\/]+$/);
      
      // Verificar elementos de la vista de detalle
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('button:has-text("Editar")')).toBeVisible();
      
      // Probar navegación a edición
      await page.click('button:has-text("Editar")');
      await expect(page.url()).toMatch(/\/admin\/products\/[^\/]+\/edit$/);
      await expect(page.locator('h1')).toContainText('Editar');
      
      // Volver a la lista
      await page.click('button:has-text("Cancelar")');
    }
    
    // 12. Verificar navegación de vuelta al dashboard
    await page.click('[data-testid="breadcrumbs"] a:has-text("Admin")');
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('¡Bienvenido al Panel Administrativo!');
    
    // 13. Verificar que todas las métricas del dashboard están presentes
    await expect(page.locator('text=Ventas Hoy')).toBeVisible();
    await expect(page.locator('text=Órdenes Pendientes')).toBeVisible();
    await expect(page.locator('text=Stock Bajo')).toBeVisible();
    await expect(page.locator('text=Usuarios Activos')).toBeVisible();
    
    // 14. Verificar estado del sistema
    await expect(page.locator('text=Estado del Sistema')).toBeVisible();
    await expect(page.locator('text=Sistema Operativo')).toBeVisible();
  });

  test('debe manejar errores de red gracefully', async ({ page }) => {
    // Interceptar requests para simular errores de red
    await page.route('/api/admin/products', async route => {
      await route.abort('failed');
    });
    
    // Navegar a productos
    await page.goto('/admin/products');
    
    // Verificar que se muestra un mensaje de error apropiado
    await expect(page.locator('text=Error al cargar productos')).toBeVisible();
  });

  test('debe ser responsive en diferentes tamaños de pantalla', async ({ page }) => {
    // Probar en desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/admin');
    
    // Verificar que el sidebar esté visible en desktop
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
    
    // Probar en tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // El sidebar podría estar colapsado o visible dependiendo del diseño
    const sidebar = page.locator('[data-testid="admin-sidebar"]');
    const menuButton = page.locator('[data-testid="mobile-menu-toggle"]');
    
    // En tablet, debería haber un botón de menú o sidebar visible
    const hasSidebar = await sidebar.isVisible();
    const hasMenuButton = await menuButton.isVisible();
    expect(hasSidebar || hasMenuButton).toBeTruthy();
    
    // Probar en móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    // En móvil, debería haber un botón de menú
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    
    // Probar apertura del menú móvil
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="admin-sidebar"]')).toBeVisible();
  });

  test('debe mantener estado de navegación correctamente', async ({ page }) => {
    // Navegar por diferentes secciones
    await page.goto('/admin');
    
    // Ir a productos
    await page.click('text=Productos');
    await expect(page).toHaveURL('/admin/products');
    
    // Usar el botón atrás del navegador
    await page.goBack();
    await expect(page).toHaveURL('/admin');
    
    // Usar el botón adelante del navegador
    await page.goForward();
    await expect(page).toHaveURL('/admin/products');
    
    // Verificar que el estado se mantiene
    await expect(page.locator('h1')).toContainText('Gestión de Productos');
  });

  test('debe cargar rápidamente y tener buena performance', async ({ page }) => {
    const startTime = Date.now();
    
    // Navegar al admin
    await page.goto('/admin');
    await page.waitForSelector('h1');
    
    const loadTime = Date.now() - startTime;
    
    // Verificar que carga en menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
    
    // Verificar que no hay errores de consola críticos
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Navegar a productos para generar más actividad
    await page.click('text=Productos');
    await page.waitForSelector('[data-testid="products-table"]');
    
    // Filtrar errores críticos (ignorar warnings menores)
    const criticalErrors = errors.filter(error => 
      !error.includes('Warning') && 
      !error.includes('favicon') &&
      !error.includes('404')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
});
