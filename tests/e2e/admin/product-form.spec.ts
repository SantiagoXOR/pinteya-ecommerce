import { test, expect } from '@playwright/test';

test.describe('Panel Administrativo - Formulario de Productos', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar al formulario de crear producto
    await page.goto('/admin/products/new');
  });

  test('debe cargar el formulario de crear producto correctamente', async ({ page }) => {
    // Verificar título
    await expect(page.locator('h1')).toContainText('Crear Producto');
    
    // Verificar que todos los tabs estén presentes
    const tabs = ['General', 'Precios', 'Inventario', 'Imágenes', 'Variantes', 'SEO'];
    for (const tab of tabs) {
      await expect(page.locator(`[role="tab"]:has-text("${tab}")`)).toBeVisible();
    }
    
    // Verificar que el tab General esté activo por defecto
    await expect(page.locator('[role="tab"]:has-text("General")[aria-selected="true"]')).toBeVisible();
    
    // Verificar botones de acción
    await expect(page.locator('button:has-text("Crear Producto")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancelar")')).toBeVisible();
  });

  test('debe validar campos requeridos en el tab General', async ({ page }) => {
    // Intentar enviar formulario sin llenar campos requeridos
    await page.click('button:has-text("Crear Producto")');
    
    // Verificar mensajes de error
    await expect(page.locator('text=El nombre es requerido')).toBeVisible();
    await expect(page.locator('text=Selecciona una categoría válida')).toBeVisible();
  });

  test('debe llenar correctamente el tab General', async ({ page }) => {
    // Llenar nombre del producto
    await page.fill('input[name="name"]', 'Pintura Látex Blanco 4L');
    
    // Verificar que se generó el slug automáticamente
    await page.click('[role="tab"]:has-text("SEO")');
    const slugInput = page.locator('input[name="slug"]');
    await expect(slugInput).toHaveValue('pintura-latex-blanco-4l');
    
    // Volver al tab General
    await page.click('[role="tab"]:has-text("General")');
    
    // Llenar descripción corta
    await page.fill('textarea[name="short_description"]', 'Pintura látex de alta calidad para interiores');
    
    // Llenar descripción completa
    await page.fill('textarea[name="description"]', 'Pintura látex premium ideal para paredes interiores. Excelente cobertura y durabilidad.');
    
    // Seleccionar categoría (esto depende de tu implementación del CategorySelector)
    await page.click('[data-testid="category-selector"]');
    await page.click('text=Interiores'); // Asumiendo que existe esta categoría
    
    // Seleccionar estado
    await page.selectOption('select[name="status"]', 'active');
  });

  test('debe configurar precios correctamente en el tab Precios', async ({ page }) => {
    // Navegar al tab de precios
    await page.click('[role="tab"]:has-text("Precios")');
    
    // Llenar precio de venta
    await page.fill('input[name="price"]', '2500');
    
    // Llenar precio de comparación
    await page.fill('input[name="compare_price"]', '3000');
    
    // Llenar precio de costo
    await page.fill('input[name="cost_price"]', '1500');
    
    // Verificar que se calcularon las métricas automáticamente
    await expect(page.locator('[data-testid="profit-margin"]')).toContainText('40.0%');
    await expect(page.locator('[data-testid="markup"]')).toContainText('66.7%');
    await expect(page.locator('[data-testid="discount"]')).toContainText('16.7%');
  });

  test('debe configurar inventario en el tab Inventario', async ({ page }) => {
    // Navegar al tab de inventario
    await page.click('[role="tab"]:has-text("Inventario")');
    
    // Verificar que el rastreo de inventario esté habilitado por defecto
    const trackInventoryToggle = page.locator('input[name="track_inventory"]');
    await expect(trackInventoryToggle).toBeChecked();
    
    // Configurar stock
    await page.fill('input[name="stock"]', '100');
    
    // Configurar umbral de stock bajo
    await page.fill('input[name="low_stock_threshold"]', '10');
    
    // Habilitar pedidos pendientes
    await page.check('input[name="allow_backorder"]');
    
    // Probar ajustes rápidos de stock
    await page.click('button:has-text("+50")');
    await expect(page.locator('input[name="stock"]')).toHaveValue('150');
  });

  test('debe gestionar imágenes en el tab Imágenes', async ({ page }) => {
    // Navegar al tab de imágenes
    await page.click('[role="tab"]:has-text("Imágenes")');
    
    // Verificar que el área de upload esté presente
    await expect(page.locator('[data-testid="image-upload-area"]')).toBeVisible();
    
    // Verificar mensaje de instrucciones
    await expect(page.locator('text=Arrastra imágenes aquí')).toBeVisible();
    
    // Verificar límite de imágenes
    await expect(page.locator('text=Máximo 10 imágenes')).toBeVisible();
    
    // Nota: Para probar upload real de archivos, necesitarías archivos de prueba
    // y usar page.setInputFiles()
  });

  test('debe configurar variantes en el tab Variantes', async ({ page }) => {
    // Navegar al tab de variantes
    await page.click('[role="tab"]:has-text("Variantes")');
    
    // Verificar tipos de variantes predefinidos
    await expect(page.locator('text=Color')).toBeVisible();
    await expect(page.locator('text=Tamaño')).toBeVisible();
    await expect(page.locator('text=Material')).toBeVisible();
    
    // Agregar variante de color
    await page.click('button:has-text("Color")');
    
    // Verificar que se agregó la variante
    await expect(page.locator('[data-testid="variant-color"]')).toBeVisible();
    
    // Agregar variante personalizada
    await page.fill('input[placeholder*="Nombre de la variante"]', 'Acabado');
    await page.click('button[data-testid="add-custom-variant"]');
    
    // Verificar que se agregó
    await expect(page.locator('text=Acabado')).toBeVisible();
  });

  test('debe optimizar SEO en el tab SEO', async ({ page }) => {
    // Primero llenar el nombre del producto para auto-generación
    await page.click('[role="tab"]:has-text("General")');
    await page.fill('input[name="name"]', 'Pintura Látex Premium Blanco');
    
    // Navegar al tab SEO
    await page.click('[role="tab"]:has-text("SEO")');
    
    // Verificar que se generó el slug automáticamente
    await expect(page.locator('input[name="slug"]')).toHaveValue('pintura-latex-premium-blanco');
    
    // Auto-generar título SEO
    await page.click('button:has-text("Auto-generar"):near(input[name="seo_title"])');
    await expect(page.locator('input[name="seo_title"]')).toHaveValue(/Pintura Látex Premium Blanco/);
    
    // Auto-generar descripción SEO
    await page.click('button:has-text("Auto-generar"):near(textarea[name="seo_description"])');
    await expect(page.locator('textarea[name="seo_description"]')).toHaveValue(/Compra Pintura Látex Premium Blanco/);
    
    // Verificar puntuación SEO
    await expect(page.locator('[data-testid="seo-score"]')).toBeVisible();
    
    // Verificar vista previa de Google
    await expect(page.locator('[data-testid="google-preview"]')).toBeVisible();
  });

  test('debe mostrar indicadores de error en tabs con problemas', async ({ page }) => {
    // Intentar enviar formulario incompleto
    await page.click('button:has-text("Crear Producto")');
    
    // Verificar que los tabs con errores muestran indicadores
    const generalTab = page.locator('[role="tab"]:has-text("General")');
    await expect(generalTab.locator('[data-testid="error-indicator"]')).toBeVisible();
  });

  test('debe permitir cancelar la creación', async ({ page }) => {
    // Llenar algunos campos
    await page.fill('input[name="name"]', 'Producto de Prueba');
    
    // Click en cancelar
    await page.click('button:has-text("Cancelar")');
    
    // Verificar que navegó de vuelta a la lista
    await expect(page).toHaveURL('/admin/products');
  });

  test('debe crear producto exitosamente con datos válidos', async ({ page }) => {
    // Llenar formulario completo
    await page.fill('input[name="name"]', 'Pintura Test E2E');
    await page.fill('textarea[name="description"]', 'Descripción de prueba para E2E');
    
    // Seleccionar categoría (mock o usar una existente)
    await page.click('[data-testid="category-selector"]');
    await page.click('text=Interiores');
    
    // Configurar precios
    await page.click('[role="tab"]:has-text("Precios")');
    await page.fill('input[name="price"]', '1000');
    
    // Configurar inventario
    await page.click('[role="tab"]:has-text("Inventario")');
    await page.fill('input[name="stock"]', '50');
    
    // Enviar formulario
    await page.click('button:has-text("Crear Producto")');
    
    // Verificar redirección exitosa (esto depende de tu implementación)
    // Podría redirigir a la vista del producto o a la lista
    await expect(page).toHaveURL(/\/admin\/products/);
    
    // Verificar mensaje de éxito (si usas toast notifications)
    await expect(page.locator('[data-testid="success-toast"]')).toContainText('Producto creado exitosamente');
  });
});
