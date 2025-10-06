// Script de debug para verificar datos de productos en el navegador
// Ejecutar en la consola del navegador en http://localhost:3000

console.log('🔍 INICIANDO DEBUG DE DATOS DE PRODUCTOS');
console.log('=' .repeat(60));

// Función para verificar datos de productos específicos
function debugProductsData() {
  // Buscar todos los productos en la página
  const productCards = document.querySelectorAll('[data-product-id]');
  console.log(`📊 Total productos encontrados: ${productCards.length}`);
  
  if (productCards.length === 0) {
    console.log('❌ No se encontraron productos en la página');
    return;
  }
  
  // Verificar los primeros 5 productos
  const productsToCheck = Array.from(productCards).slice(0, 5);
  
  productsToCheck.forEach((card, index) => {
    const productId = card.getAttribute('data-product-id');
    console.log(`\n🔍 PRODUCTO ${index + 1}/${productsToCheck.length} (ID: ${productId})`);
    console.log('=' .repeat(40));
    
    // Buscar el título
    const titleElement = card.querySelector('h3, h2, .product-title, [class*="font-bold"], [class*="text-lg"]');
    const title = titleElement ? titleElement.textContent.trim() : 'Sin título';
    console.log(`📝 Título: "${title}"`);
    
    // Buscar badges existentes
    const badgeSelectors = [
      '.bg-blue-100',
      '.bg-red-100', 
      '.bg-purple-100',
      '.bg-amber-100',
      '.bg-green-100',
      '.bg-pink-100',
      '.bg-indigo-100',
      '[class*="badge"]'
    ];
    
    let foundBadges = [];
    badgeSelectors.forEach(selector => {
      const badges = card.querySelectorAll(selector);
      badges.forEach(badge => {
        const text = badge.textContent.trim();
        if (text && !foundBadges.some(b => b.text === text)) {
          foundBadges.push({
            text: text,
            classes: badge.className,
            element: badge
          });
        }
      });
    });
    
    console.log(`🎯 Badges encontrados: ${foundBadges.length}`);
    if (foundBadges.length > 0) {
      foundBadges.forEach((badge, badgeIndex) => {
        console.log(`  ${badgeIndex + 1}. "${badge.text}" - Classes: ${badge.classes}`);
      });
    } else {
      console.log('  ❌ NO SE ENCONTRARON BADGES');
    }
    
    // Verificar si debería tener badges basado en el título
    const shouldHaveBadges = (
      title.includes('Nº') || 
      title.includes('Lt') || 
      title.includes('Kg') || 
      title.includes('mm') ||
      title.includes('cm') ||
      title.includes('Grano') ||
      title.includes('Pincel') ||
      title.includes('Lija')
    );
    
    if (shouldHaveBadges && foundBadges.length === 0) {
      console.log('  ⚠️ PROBLEMA: Este producto debería tener badges basado en su título');
    }
    
    // Buscar atributos data-* que puedan contener información del producto
    const dataAttrs = {};
    Array.from(card.attributes).forEach(attr => {
      if (attr.name.startsWith('data-')) {
        dataAttrs[attr.name] = attr.value;
      }
    });
    
    if (Object.keys(dataAttrs).length > 0) {
      console.log('📋 Atributos data encontrados:', dataAttrs);
    }
  });
}

// Función para hacer una petición directa a la API y comparar
async function compareWithAPI() {
  console.log('\n🌐 COMPARANDO CON DATOS DE LA API');
  console.log('=' .repeat(40));
  
  try {
    const response = await fetch('/api/products?limit=5');
    const data = await response.json();
    
    console.log(`📊 Productos de la API: ${data.products?.length || 0}`);
    
    if (data.products && data.products.length > 0) {
      data.products.forEach((product, index) => {
        console.log(`\n📦 PRODUCTO API ${index + 1}:`);
        console.log(`  ID: ${product.id}`);
        console.log(`  Nombre: "${product.name}"`);
        console.log(`  Color: ${product.color || 'null'}`);
        console.log(`  Medida: ${product.medida || 'null'}`);
        
        // Verificar si este producto está en la página
        const cardInPage = document.querySelector(`[data-product-id="${product.id}"]`);
        if (cardInPage) {
          console.log(`  ✅ Producto encontrado en la página`);
          
          // Verificar badges en este producto específico
          const badges = cardInPage.querySelectorAll('.bg-blue-100, .bg-red-100, .bg-purple-100, .bg-amber-100, .bg-green-100, .bg-pink-100, .bg-indigo-100');
          console.log(`  🎯 Badges en página: ${badges.length}`);
          
          if (badges.length === 0 && (product.color || product.medida)) {
            console.log(`  ❌ PROBLEMA: Producto tiene datos (color: ${product.color}, medida: ${product.medida}) pero no badges en página`);
          }
        } else {
          console.log(`  ❌ Producto NO encontrado en la página`);
        }
      });
    }
  } catch (error) {
    console.error('❌ Error al obtener datos de la API:', error);
  }
}

// Ejecutar ambas funciones
debugProductsData();
compareWithAPI();

console.log('\n✅ DEBUG COMPLETADO');
console.log('💡 Si no ves badges, revisa los logs de la consola para ver si hay errores en extractProductCapacity o formatProductBadges');