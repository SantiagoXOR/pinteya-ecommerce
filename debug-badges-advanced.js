// Script de debug avanzado para verificar el flujo completo de badges
// Ejecutar en la consola del navegador

console.log('=== DEBUG BADGES AVANZADO ===');

// Función para interceptar y debuggear extractProductCapacity
function debugExtractProductCapacity() {
  console.log('🔍 Interceptando extractProductCapacity...');
  
  // Buscar productos con datos de medida en la página
  const productCards = document.querySelectorAll('[data-product-id]');
  console.log(`📊 Total productos encontrados: ${productCards.length}`);
  
  productCards.forEach((card, index) => {
    const productId = card.getAttribute('data-product-id');
    console.log(`\n🔍 Analizando producto ${productId}:`);
    
    // Buscar el título del producto
    const titleElement = card.querySelector('h3, .product-title, [class*="font-bold"]');
    const title = titleElement ? titleElement.textContent.trim() : 'Sin título';
    console.log(`  📝 Título: "${title}"`);
    
    // Buscar badges
    const badges = card.querySelectorAll('[class*="bg-blue-100"], [class*="bg-red-100"], [class*="bg-purple-100"], [class*="bg-amber-100"], [class*="bg-green-100"], [class*="bg-pink-100"]');
    console.log(`  🎯 Badges encontrados: ${badges.length}`);
    
    if (badges.length > 0) {
      badges.forEach((badge, badgeIndex) => {
        console.log(`    Badge ${badgeIndex + 1}: "${badge.textContent.trim()}" - Classes: ${badge.className}`);
      });
    } else {
      console.log('    ❌ No se encontraron badges');
      
      // Verificar si es un producto que debería tener badges
      if (title.includes('Pincel') || title.includes('Nº') || title.includes('Lt') || title.includes('Kg')) {
        console.log('    ⚠️ Este producto debería tener badges basado en su título');
      }
    }
  });
}

// Función para verificar datos específicos de productos
function debugSpecificProducts() {
  console.log('\n🎯 Verificando productos específicos que deberían tener badges...');
  
  // Productos que sabemos que tienen medida en la BD
  const expectedProducts = [
    { id: 1, name: 'Pincel Persianero', medida: 'Nº10' },
    { id: 2, name: 'Pincel Persianero', medida: 'Nº15' },
    { id: 3, name: 'Pincel Persianero', medida: 'Nº20' }
  ];
  
  expectedProducts.forEach(product => {
    const card = document.querySelector(`[data-product-id="${product.id}"]`);
    if (card) {
      console.log(`\n✅ Producto ${product.id} encontrado:`);
      console.log(`  📝 Esperado: ${product.name} - ${product.medida}`);
      
      const badges = card.querySelectorAll('[class*="bg-blue-100"], [class*="bg-red-100"], [class*="bg-purple-100"]');
      console.log(`  🎯 Badges encontrados: ${badges.length}`);
      
      if (badges.length === 0) {
        console.log('  ❌ PROBLEMA: No se encontraron badges para este producto');
        
        // Verificar si hay logs de debug en la consola
        console.log('  🔍 Verificar logs de debug en la consola para este producto');
      } else {
        badges.forEach((badge, index) => {
          const text = badge.textContent.trim();
          console.log(`    Badge ${index + 1}: "${text}"`);
          if (text === product.medida) {
            console.log('    ✅ Badge de medida correcto encontrado');
          }
        });
      }
    } else {
      console.log(`❌ Producto ${product.id} no encontrado en la página`);
    }
  });
}

// Función para verificar el estado de React
function debugReactState() {
  console.log('\n🔍 Verificando estado de React...');
  
  // Buscar elementos React
  const reactElements = document.querySelectorAll('[data-reactroot], [data-react-helmet]');
  console.log(`⚛️ Elementos React encontrados: ${reactElements.length}`);
  
  // Verificar si hay errores de React en la consola
  console.log('📋 Verificar la consola para errores de React o warnings');
}

// Ejecutar todas las verificaciones
debugExtractProductCapacity();
debugSpecificProducts();
debugReactState();

console.log('\n=== FIN DEBUG AVANZADO ===');
console.log('💡 Sugerencias:');
console.log('1. Verificar logs de debug en la consola para extractProductCapacity');
console.log('2. Verificar que los datos lleguen correctamente desde la API');
console.log('3. Verificar que no haya errores de React que impidan el renderizado');