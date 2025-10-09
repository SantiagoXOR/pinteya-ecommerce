const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  const page = await browser.newPage();
  
  // Capturar logs de consola
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Related products data') || 
        text.includes('Available measures from related products') ||
        text.includes('Getting widths from related products') ||
        text.includes('availableWidths') ||
        text.includes('variants')) {
      console.log('📋 Console log:', text);
    }
  });
  
  try {
    console.log('🚀 Navegando a la página principal...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    console.log('⏳ Esperando que cargue la página...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔍 Buscando productos de cinta papel...');
    
    // Buscar elementos que contengan "Cinta Papel"
    const cintaPapelElements = await page.$$eval('*', elements => {
      return elements.filter(el => {
        const text = el.textContent || '';
        return text.includes('Cinta Papel');
      }).length;
    });
    
    console.log(`📦 Elementos con "Cinta Papel": ${cintaPapelElements}`);
    
    // Buscar productos clickeables con diferentes estrategias
    const productSelectors = [
      'article[data-testid="product-card"]',
      '[data-testid="product-card"]',
      '.product-card',
      'article',
      'div[class*="card"]',
      'div[class*="product"]'
    ];
    
    let productFound = false;
    
    for (const selector of productSelectors) {
      console.log(`🔍 Probando selector: ${selector}`);
      
      const products = await page.$$(selector);
      console.log(`📦 Productos encontrados con ${selector}: ${products.length}`);
      
      for (let i = 0; i < products.length; i++) {
        try {
          const productText = await products[i].evaluate(el => el.textContent || '');
          
          if (productText.includes('Cinta Papel')) {
            console.log(`✅ Producto encontrado: ${productText.substring(0, 100)}...`);
            console.log('🖱️ Haciendo click en el producto...');
            
            await products[i].click();
            productFound = true;
            break;
          }
        } catch (error) {
          console.log(`❌ Error al procesar producto ${i}: ${error.message}`);
        }
      }
      
      if (productFound) break;
    }
    
    if (!productFound) {
      console.log('❌ No se encontró producto de cinta papel clickeable');
      
      // Intentar buscar cualquier elemento clickeable que contenga "Cinta Papel"
      const clickableElements = await page.$$eval('*', elements => {
        return elements
          .filter(el => {
            const text = el.textContent || '';
            const isClickable = el.tagName === 'BUTTON' || 
                               el.tagName === 'A' || 
                               el.onclick !== null ||
                               el.style.cursor === 'pointer' ||
                               el.getAttribute('role') === 'button';
            return text.includes('Cinta Papel') && isClickable;
          })
          .map(el => ({
            tagName: el.tagName,
            className: el.className,
            text: el.textContent?.substring(0, 50)
          }));
      });
      
      console.log('🔍 Elementos clickeables con "Cinta Papel":', clickableElements);
      
      // Intentar hacer click en cualquier elemento que contenga "Cinta Papel"
      const anyElement = await page.$('*');
      const allElements = await page.$$('*');
      
      for (const element of allElements) {
        try {
          const text = await element.evaluate(el => el.textContent || '');
          if (text.includes('Cinta Papel Blanca')) {
            console.log('🖱️ Intentando click en elemento con "Cinta Papel Blanca"...');
            await element.click();
            productFound = true;
            break;
          }
        } catch (error) {
          // Continuar con el siguiente elemento
        }
      }
    }
    
    if (productFound) {
       console.log('⏳ Esperando que aparezca el modal...');
       await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Verificar si el modal apareció
      const modalExists = await page.$('[role="dialog"], .modal, [data-testid="modal"]');
      if (modalExists) {
         console.log('✅ Modal detectado');
         await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar más logs
      } else {
        console.log('❌ No se detectó modal');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
})();