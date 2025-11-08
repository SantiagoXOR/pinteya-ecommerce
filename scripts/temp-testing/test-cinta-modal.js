const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navegar directamente a un producto específico de Cinta Papel Blanca
    console.log('🚀 Navegando directamente al producto Cinta Papel Blanca (ID: 52)...');
    await page.goto('http://localhost:3000/products/52');
    await page.waitForTimeout(3000);

    // Tomar screenshot de la página del producto
    await page.screenshot({ path: 'product-52-page.png', fullPage: true });
    console.log('📸 Screenshot tomado: product-52-page.png');

    // Buscar el botón "Ver detalles" o similar para abrir el modal
    console.log('🔍 Buscando botón para abrir modal...');
    
    const modalTriggers = [
      'button:has-text("Ver detalles")',
      'button:has-text("Detalles")',
      'button:has-text("Ver más")',
      '[data-testid="open-modal"]',
      '.open-modal',
      'button[class*="detail"]'
    ];
    
    let modalOpened = false;
    for (const trigger of modalTriggers) {
      const button = await page.locator(trigger).first();
      if (await button.count() > 0) {
        console.log(`✅ Botón encontrado: ${trigger}`);
        await button.click();
        await page.waitForTimeout(2000);
        modalOpened = true;
        break;
      }
    }
    
    if (!modalOpened) {
      console.log('⚠️ No se encontró botón específico, intentando clic en la imagen del producto...');
      const productImage = await page.locator('img').first();
      if (await productImage.count() > 0) {
        await productImage.click();
        await page.waitForTimeout(2000);
        modalOpened = true;
      }
    }

    if (modalOpened) {
      console.log('✅ Modal abierto');
      
      // Tomar screenshot del modal
      await page.screenshot({ path: 'modal-cinta-opened.png', fullPage: true });
      console.log('📸 Screenshot del modal tomado: modal-cinta-opened.png');

      // Buscar selectores de ancho
       console.log('🔍 Buscando selectores de ancho...');
       
       // Buscar el contenedor del selector de ancho
       const widthSelectorContainer = await page.locator('h3:has-text("Ancho")').locator('..').first();
       
       if (await widthSelectorContainer.count() > 0) {
         console.log('✅ Contenedor del selector de ancho encontrado');
         
         // Buscar todos los botones dentro del contenedor
         const widthButtons = widthSelectorContainer.locator('button');
         const count = await widthButtons.count();
         
         if (count > 0) {
           console.log(`✅ Encontrados ${count} botones de ancho`);
           
           // Probar hacer clic en diferentes anchos
           for (let i = 0; i < Math.min(count, 4); i++) {
             const button = widthButtons.nth(i);
             const text = await button.textContent();
             console.log(`🎯 Haciendo clic en ancho: ${text}`);
             
             await button.click();
             await page.waitForTimeout(1500);
             
             // Tomar screenshot después del clic
             await page.screenshot({ path: `modal-width-${text?.replace('mm', '')}.png`, fullPage: true });
             console.log(`📸 Screenshot tomado: modal-width-${text?.replace('mm', '')}.png`);
           }
         } else {
           console.log('❌ No se encontraron botones dentro del contenedor');
         }
       } else {
         console.log('❌ No se encontró el contenedor del selector de ancho');
         
         // Fallback: buscar directamente por texto
         const fallbackButtons = await page.locator('button:has-text("mm")');
         const fallbackCount = await fallbackButtons.count();
         
         if (fallbackCount > 0) {
           console.log(`✅ Encontrados ${fallbackCount} botones con "mm" (fallback)`);
           
           for (let i = 0; i < Math.min(fallbackCount, 4); i++) {
             const button = fallbackButtons.nth(i);
             const text = await button.textContent();
             console.log(`🎯 Haciendo clic en ancho (fallback): ${text}`);
             
             await button.click();
             await page.waitForTimeout(1500);
             
             await page.screenshot({ path: `modal-width-fallback-${i + 1}.png`, fullPage: true });
             console.log(`📸 Screenshot tomado: modal-width-fallback-${i + 1}.png`);
           }
         } else {
           console.log('❌ No se encontraron botones de ancho (fallback)');
         }
       }
    } else {
      console.log('❌ No se pudo abrir el modal');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'Downloads/error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();