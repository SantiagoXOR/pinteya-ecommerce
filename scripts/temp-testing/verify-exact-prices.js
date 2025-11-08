const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 Verificando precios exactos de Cinta Papel 18mm x 40m');
    console.log('📊 Precios esperados según base de datos:');
    console.log('   - Precio original: $2.141,00');
    console.log('   - Precio con descuento 30%: $1.498,70');
    console.log('');

    // Navegar a la página principal
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Buscar productos con múltiples selectores
    const productSelectors = [
      '[data-testid="commercial-product-card"]',
      '.product-card',
      '[class*="product"]',
      'article',
      'div[role="article"]'
    ];

    let productCards = [];
    for (const selector of productSelectors) {
      productCards = await page.locator(selector).all();
      if (productCards.length > 0) {
        console.log(`✅ Encontrados ${productCards.length} productos usando selector: ${selector}`);
        break;
      }
    }

    if (productCards.length === 0) {
      console.log('❌ No se encontraron productos con ningún selector');
      return;
    }

    // Buscar específicamente la cinta papel de 18mm
    let cintaPapelFound = false;
    
    for (let i = 0; i < productCards.length; i++) {
      const card = productCards[i];
      const cardText = await card.textContent();
      
      // Buscar "Cinta Papel" y "18mm"
      if (cardText.includes('Cinta Papel') && cardText.includes('18mm')) {
        console.log(`🎯 Encontrada Cinta Papel 18mm en tarjeta ${i + 1}`);
        console.log(`📝 Contenido de la tarjeta: ${cardText}`);
        
        // Extraer precios directamente de la tarjeta
        const priceMatches = cardText.match(/\$[\d.,]+/g);
        if (priceMatches && priceMatches.length >= 2) {
          const discountedPrice = priceMatches[0]; // Primer precio (con descuento)
          const originalPrice = priceMatches[1];   // Segundo precio (original)
          
          console.log('');
          console.log('💰 VERIFICACIÓN DE PRECIOS:');
          console.log(`   Precio con descuento mostrado: ${discountedPrice}`);
          console.log(`   Precio original mostrado: ${originalPrice}`);
          console.log('');
          console.log('🎯 COMPARACIÓN CON BASE DE DATOS:');
          console.log(`   ✅ Precio original esperado: $2.141 | Mostrado: ${originalPrice}`);
          console.log(`   ✅ Precio con descuento esperado: $1.498,7 | Mostrado: ${discountedPrice}`);
          
          // Verificar si los precios coinciden (considerando diferentes formatos)
          const originalMatch = originalPrice.includes('2.141') || originalPrice.includes('2141');
          const discountedMatch = discountedPrice.includes('1.498') || discountedPrice.includes('1498');
          
          if (originalMatch && discountedMatch) {
            console.log('');
            console.log('🎉 ¡PRECIOS CORRECTOS! Los precios mostrados coinciden con la base de datos.');
          } else {
            console.log('');
            console.log('⚠️  DISCREPANCIA DETECTADA: Los precios no coinciden exactamente.');
          }
        }
        
        // Intentar hacer clic para abrir el modal
        try {
          await card.click();
          await page.waitForTimeout(2000);
          
          // Buscar el modal
          const modal = page.locator('[role="dialog"]').first();
          if (await modal.isVisible()) {
            console.log('');
            console.log('🔍 Modal abierto - Verificando precios en modal...');
            
            const modalText = await modal.textContent();
            const modalPrices = modalText.match(/\$[\d.,]+/g);
            
            if (modalPrices) {
              console.log(`💰 Precios en modal: ${modalPrices.join(', ')}`);
            }
            
            // Buscar opciones de ancho
            const widthOptions = await modal.locator('button, select option, [role="option"]').all();
            console.log(`📏 Opciones de ancho encontradas: ${widthOptions.length}`);
            
            for (let j = 0; j < Math.min(widthOptions.length, 5); j++) {
              const optionText = await widthOptions[j].textContent();
              if (optionText && optionText.includes('18mm')) {
                console.log(`🎯 Opción 18mm encontrada: ${optionText}`);
                
                try {
                  await widthOptions[j].click();
                  await page.waitForTimeout(1000);
                  
                  const updatedModalText = await modal.textContent();
                  const updatedPrices = updatedModalText.match(/\$[\d.,]+/g);
                  
                  if (updatedPrices) {
                    console.log('');
                    console.log('🔄 PRECIOS DESPUÉS DE SELECCIONAR 18mm:');
                    console.log(`   Precios actualizados: ${updatedPrices.join(', ')}`);
                    
                    // Verificar si algún precio coincide con los esperados
                    const hasCorrectOriginal = updatedPrices.some(p => p.includes('2.141') || p.includes('2141'));
                    const hasCorrectDiscounted = updatedPrices.some(p => p.includes('1.498') || p.includes('1498'));
                    
                    if (hasCorrectOriginal && hasCorrectDiscounted) {
                      console.log('   ✅ ¡Precios correctos confirmados en modal!');
                    } else {
                      console.log('   ⚠️  Los precios en modal no coinciden exactamente');
                    }
                  }
                } catch (clickError) {
                  console.log(`   ⚠️  No se pudo hacer clic en opción 18mm: ${clickError.message}`);
                }
                break;
              }
            }
          }
        } catch (modalError) {
          console.log(`⚠️  Error al abrir modal: ${modalError.message}`);
        }
        
        cintaPapelFound = true;
        break;
      }
    }
    
    if (!cintaPapelFound) {
      console.log('❌ No se encontró producto de Cinta Papel 18mm específicamente');
    }
    
    // Tomar screenshot final
    await page.screenshot({ 
      path: 'verificacion-precios-exactos.png', 
      fullPage: true 
    });
    console.log('');
    console.log('📸 Screenshot guardado como: verificacion-precios-exactos.png');
    
  } catch (error) {
    console.error('❌ Error durante la verificación:', error.message);
  } finally {
    await browser.close();
  }
})();