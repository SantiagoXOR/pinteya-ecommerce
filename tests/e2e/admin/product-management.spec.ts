import { test, expect } from '@playwright/test';

test.describe('Panel Administrativo - Gestión de Productos', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al panel de productos
    await page.goto('/admin/products');
  });

  test('debe cargar la lista de productos correctamente', async ({ page }) => {
    // Verificar que el título esté presente
    await expect(page.locator('h1')).toContainText('Gestión de Productos');
    
    // Verificar que las estadísticas rápidas estén presentes
    await expect(page.locator('text=Total Productos')).toBeVisible();
    await expect(page.locator('text=Productos Activos')).toBeVisible();
    await expect(page.locator('text=Stock Bajo')).toBeVisible();
    await expect(page.locator('text=Sin Stock')).toBeVisible();
    
    // Verificar que el botón de nuevo producto esté presente
    await expect(page.locator('text=Nuevo Producto')).toBeVisible();
    
    // Verificar que la tabla de productos esté presente
    await expect(page.locator('[data-testid="products-table"]')).toBeVisible();
  });

  test('debe mostrar filtros de productos funcionales', async ({ page }) => {
    // Verificar que los filtros estén presentes
    await expect(page.locator('[data-testid="product-filters"]')).toBeVisible();
    
    // Verificar barra de búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar productos"]');
    await expect(searchInput).toBeVisible();
    
    // Probar búsqueda
    await searchInput.fill('pintura');
    await page.waitForTimeout(500); // Esperar debounce
    
    // Verificar que se aplicó el filtro (la URL debería cambiar o la tabla actualizarse)
    // Esto depende de tu implementación específica
    
    // Limpiar búsqueda
    await searchInput.clear();
  });

  test('debe navegar al formulario de crear producto', async ({ page }) => {
    // Click en el botón de nuevo producto
    await page.click('text=Nuevo Producto');
    
    // Verificar que navegó a la página de creación
    await expect(page).toHaveURL('/admin/products/new');
    
    // Verificar que el formulario esté presente
    await expect(page.locator('h1')).toContainText('Crear Producto');
    await expect(page.locator('form')).toBeVisible();
  });

  test('debe mostrar la tabla de productos con columnas correctas', async ({ page }) => {
    const table = page.locator('[data-testid="products-table"]');
    await expect(table).toBeVisible();
    
    // Verificar headers de la tabla
    await expect(table.locator('th')).toContainText(['Imagen', 'Producto', 'Categoría', 'Precio', 'Stock', 'Estado', 'Creado', 'Acciones']);
  });

  test('debe permitir ordenar productos por diferentes columnas', async ({ page }) => {
    // Click en header de precio para ordenar
    await page.click('th:has-text("Precio")');
    
    // Verificar que se aplicó el ordenamiento
    // (Esto depende de tu implementación - podrías verificar que la URL cambió o que los datos se reordenaron)
    
    // Click nuevamente para cambiar dirección
    await page.click('th:has-text("Precio")');
  });

  test('debe mostrar acciones de producto en cada fila', async ({ page }) => {
    // Buscar la primera fila de producto
    const firstRow = page.locator('[data-testid="products-table"] tbody tr').first();
    
    if (await firstRow.isVisible()) {
      // Verificar que tiene botón de acciones
      const actionsButton = firstRow.locator('[data-testid="product-actions"]');
      await expect(actionsButton).toBeVisible();
      
      // Click en acciones para ver el menú
      await actionsButton.click();
      
      // Verificar opciones del menú
      await expect(page.locator('text=Ver detalles')).toBeVisible();
      await expect(page.locator('text=Editar')).toBeVisible();
      await expect(page.locator('text=Duplicar')).toBeVisible();
      await expect(page.locator('text=Eliminar')).toBeVisible();
    }
  });

  test('debe manejar la paginación correctamente', async ({ page }) => {
    // Verificar que los controles de paginación estén presentes
    const pagination = page.locator('[data-testid="pagination"]');
    
    if (await pagination.isVisible()) {
      // Verificar elementos de paginación
      await expect(pagination.locator('text=Página')).toBeVisible();
      await expect(pagination.locator('select')).toBeVisible(); // Selector de página
      
      // Si hay múltiples páginas, probar navegación
      const nextButton = pagination.locator('[data-testid="next-page"]');
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        // Verificar que cambió la página
      }
    }
  });

  test('debe mostrar estados de productos con badges correctos', async ({ page }) => {
    const table = page.locator('[data-testid="products-table"]');
    
    // Buscar badges de estado
    const statusBadges = table.locator('[data-testid="status-badge"]');
    
    if (await statusBadges.count() > 0) {
      // Verificar que los badges tienen texto apropiado
      const firstBadge = statusBadges.first();
      const badgeText = await firstBadge.textContent();
      expect(['Activo', 'Inactivo', 'Borrador']).toContain(badgeText);
    }
  });

  test('debe mostrar información de stock con indicadores visuales', async ({ page }) => {
    const table = page.locator('[data-testid="products-table"]');
    
    // Buscar indicadores de stock
    const stockCells = table.locator('[data-testid="stock-badge"]');
    
    if (await stockCells.count() > 0) {
      const firstStockCell = stockCells.first();
      await expect(firstStockCell).toBeVisible();
      
      // El contenido puede ser "Sin stock", "Stock bajo", o un número
      const stockText = await firstStockCell.textContent();
      expect(stockText).toBeTruthy();
    }
  });

  test('debe permitir selección múltiple de productos', async ({ page }) => {
    const table = page.locator('[data-testid="products-table"]');
    
    // Buscar checkboxes de selección
    const selectAllCheckbox = table.locator('th input[type="checkbox"]');
    const rowCheckboxes = table.locator('td input[type="checkbox"]');
    
    if (await selectAllCheckbox.isVisible()) {
      // Probar selección de todos
      await selectAllCheckbox.check();
      
      // Verificar que se seleccionaron las filas
      const checkedBoxes = await rowCheckboxes.count();
      if (checkedBoxes > 0) {
        // Verificar que aparecieron acciones masivas
        await expect(page.locator('[data-testid="bulk-actions"]')).toBeVisible();
      }
      
      // Deseleccionar
      await selectAllCheckbox.uncheck();
    }
  });

  test('debe mostrar mensaje cuando no hay productos', async ({ page }) => {
    // Aplicar un filtro que no devuelva resultados
    const searchInput = page.locator('input[placeholder*="Buscar productos"]');
    await searchInput.fill('producto-que-no-existe-12345');
    await page.waitForTimeout(1000);
    
    // Verificar mensaje de "no hay datos"
    await expect(page.locator('text=No se encontraron datos')).toBeVisible();
  });
});
