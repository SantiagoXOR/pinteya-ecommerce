const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 Navegando a la página principal...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Esperar a que los productos se carguen
    await page.waitForTimeout(3000);
    
    console.log('📦 Buscando productos con diferentes selectores...');
    
    // Intentar múltiples selectores
    const selectors = [
      '[data-testid="commercial-product-card"]',
      '.commercial-product-card',
      '[class*="product-card"]',
      '[class*="ProductCard"]',
      'div[class*="card"]:has(img)',
      'div:has(h3):has(img):has([class*="price"])'
    ];
    
    let productCards = [];
    let usedSelector = '';
    
    for (const selector of selectors) {
      try {
        const cards = await page.locator(selector).all();
        if (cards.length > 0) {
          productCards = cards;
          usedSelector = selector;
          console.log(`✅ Encontrados ${cards.length} productos con selector: ${selector}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Selector ${selector} falló: ${error.message}`);
      }
    }
    
    if (productCards.length === 0) {
      console.log('🔍 Intentando buscar elementos que contengan texto de productos...');
      
      // Buscar por texto específico
      const textSelectors = [
        'text=Cinta',
        'text=Papel',
        'text=cinta',
        'text=papel'
      ];
      
      for (const textSelector of textSelectors) {
        try {
          const elements = await page.locator(textSelector).all();
          if (elements.length > 0) {
            console.log(`📝 Encontrados ${elements.length} elementos con texto: ${textSelector}`);
            
            // Buscar el contenedor padre que podría ser la tarjeta
            for (let i = 0; i < Math.min(elements.length, 3); i++) {
              const element = elements[i];
              const parentCard = await element.locator('xpath=ancestor::div[contains(@class, "card") or contains(@class, "product") or contains(@class, "item")]').first();
              if (await parentCard.count() > 0) {
                productCards.push(parentCard);
              }
            }
          }
        } catch (error) {
          console.log(`❌ Texto selector ${textSelector} falló: ${error.message}`);
        }
      }
    }
    
    if (productCards.length === 0) {
      console.log('🔍 Buscando cualquier elemento con imagen y precio...');
      
      // Último intento: buscar elementos que tengan imagen y precio
      const genericCards = await page.locator('div:has(img):has([class*="price"], [class*="$"])').all();
      if (genericCards.length > 0) {
        productCards = genericCards;
        usedSelector = 'div:has(img):has([class*="price"])';
        console.log(`✅ Encontrados ${genericCards.length} elementos genéricos con imagen y precio`);
      }
    }
    
    console.log(`\n📊 RESUMEN: ${productCards.length} productos encontrados con selector: ${usedSelector}`);
    
    if (productCards.length === 0) {
      console.log('❌ No se encontraron productos. Tomando screenshot para debug...');
      await page.screenshot({ path: 'debug-no-products.png', fullPage: true });
      return;
    }
    
    // Buscar producto de cinta papel
    let cintaPapelFound = false;
    
    for (let i = 0; i < Math.min(productCards.length, 10); i++) {
      const card = productCards[i];
      
      try {
        // Buscar texto en toda la tarjeta
        const cardText = await card.textContent();
        console.log(`\n🔍 Producto ${i + 1}: "${cardText?.substring(0, 100)}..."`);
        
        if (cardText && (cardText.toLowerCase().includes('cinta') && cardText.toLowerCase().includes('papel'))) {
          console.log(`🎯 ¡Encontrado producto de cinta papel!`);
          
          // Intentar hacer click
          await card.click();
          await page.waitForTimeout(2000);
          
          // Buscar modal
          const modal = await page.locator('[role="dialog"], .modal, [class*="modal"]').first();
          if (await modal.count() > 0) {
            console.log('📋 Modal abierto exitosamente');
            
            // Extraer información del modal
            const modalText = await modal.textContent();
            console.log(`📝 Contenido del modal: ${modalText?.substring(0, 200)}...`);
            
            // Buscar precios en el modal
            const priceElements = await modal.locator('[class*="price"], [class*="$"], text=/\\$[0-9]/', 'text=/[0-9]+,[0-9]+/').all();
            console.log(`💰 Elementos de precio encontrados: ${priceElements.length}`);
            
            for (let j = 0; j < priceElements.length; j++) {
              const priceText = await priceElements[j].textContent();
              console.log(`  💵 Precio ${j + 1}: ${priceText}`);
            }
            
            // Buscar opciones de ancho
            const widthButtons = await modal.locator('button:has-text("mm"), button:has-text("18"), button:has-text("24"), button:has-text("36")').all();
            console.log(`📏 Botones de ancho encontrados: ${widthButtons.length}`);
            
            for (let k = 0; k < widthButtons.length; k++) {
              const buttonText = await widthButtons[k].textContent();
              console.log(`  📐 Opción ${k + 1}: ${buttonText}`);
            }
            
            // Verificar precios específicos
            console.log('\n🧮 VERIFICACIÓN DE PRECIOS:');
            console.log('Precio esperado original: $2.141');
            console.log('Precio esperado con descuento 30%: $1.498,70');
            
            cintaPapelFound = true;
            break;
          } else {
            console.log('❌ No se pudo abrir el modal');
          }
        }
      } catch (error) {
        console.log(`❌ Error procesando producto ${i + 1}: ${error.message}`);
      }
    }
    
    if (!cintaPapelFound) {
      console.log('❌ No se encontró producto de cinta papel específicamente');
      console.log('📸 Tomando screenshot para análisis...');
      await page.screenshot({ path: 'debug-products-found.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();