const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navegar a la página principal
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Buscar cinta papel
    const searchInput = page.locator('[data-testid=\
search-input\]');
    await searchInput.fill('cinta papel');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Tomar screenshot de los resultados
    await page.screenshot({ path: 'search-results.png', fullPage: true });

    // Hacer clic en el primer producto de cinta papel
    const productCards = page.locator('[data-testid=\commercial-product-card\]');
    const firstProduct = productCards.first();
    await firstProduct.click();
    await page.waitForTimeout(2000);

    // Verificar que el modal se abrió
    const modal = page.locator('[role=\dialog\]');
    await modal.waitFor({ state: 'visible' });

    // Tomar screenshot del modal
    await page.screenshot({ path: 'modal-cinta-papel.png', fullPage: true });

    // Verificar elementos del modal
    const productTitle = await page.locator('h1, h2, h3').first().textContent();
    const price = await page.locator('text=/\\$[0-9,]+/').first().textContent();
    
    console.log('Producto:', productTitle);
    console.log('Precio:', price);

    // Verificar opciones de ancho
    const widthOptions = page.locator('button:has-text(\mm\)');
    const widthCount = await widthOptions.count();
    console.log('Opciones de ancho encontradas:', widthCount);

    for (let i = 0; i < widthCount; i++) {
      const width = await widthOptions.nth(i).textContent();
      console.log('Ancho disponible:', width);
    }

    // Verificar opciones de longitud
    const lengthOptions = page.locator('button:has-text(\m\)');
    const lengthCount = await lengthOptions.count();
    console.log('Opciones de longitud encontradas:', lengthCount);

    for (let i = 0; i < lengthCount; i++) {
      const length = await lengthOptions.nth(i).textContent();
      console.log('Longitud disponible:', length);
    }

    // Probar cambio de ancho y verificar precio
    if (widthCount > 1) {
      const secondWidth = widthOptions.nth(1);
      await secondWidth.click();
      await page.waitForTimeout(1000);
      
      const newPrice = await page.locator('text=/\\$[0-9,]+/').first().textContent();
      console.log('Precio después de cambiar ancho:', newPrice);
    }

    await page.waitForTimeout(5000); // Mantener abierto para inspección

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
