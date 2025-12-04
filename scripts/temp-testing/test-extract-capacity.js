// Test específico para extractProductCapacity
// Ejecutar en la consola del navegador

console.log('=== TEST EXTRACT CAPACITY ===');

// Simular datos de productos que deberían tener badges
const testProducts = [
  {
    id: 1,
    name: 'Pincel Persianero',
    color: null,
    medida: 'Nº10'
  },
  {
    id: 2,
    name: 'Pincel Persianero',
    color: null,
    medida: 'Nº15'
  },
  {
    id: 3,
    name: 'Barniz Campbell',
    color: 'INCOLORO',
    medida: '1Lt'
  }
];

// Función para testear extractProductCapacity manualmente
function testExtractProductCapacity(productName, databaseData) {
  console.log(`\n🧪 Testing: ${productName}`);
  console.log('📋 Database data:', databaseData);
  
  // Simular la lógica de extractProductCapacity
  const result = {};
  
  if (databaseData) {
    if (databaseData.color) {
      result.color = databaseData.color;
      console.log(`✅ Color asignado: ${result.color}`);
    }
    if (databaseData.medida) {
      result.capacity = databaseData.medida;
      console.log(`✅ Capacity (medida) asignado: ${result.capacity}`);
    }
  }
  
  console.log('🎯 Resultado final:', result);
  
  // Simular formatProductBadges
  const badges = [];
  
  if (result.capacity) {
    badges.push({
      type: 'capacity',
      value: result.capacity,
      displayText: result.capacity,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100'
    });
  }
  
  if (result.color) {
    badges.push({
      type: 'color',
      value: result.color,
      displayText: result.color,
      color: 'text-red-700',
      bgColor: 'bg-red-100'
    });
  }
  
  console.log('🎨 Badges que deberían generarse:', badges);
  return { result, badges };
}

// Ejecutar tests
testProducts.forEach(product => {
  testExtractProductCapacity(product.name, {
    color: product.color,
    medida: product.medida
  });
});

console.log('\n=== VERIFICACIÓN EN PÁGINA ===');

// Verificar si los productos están en la página actual
testProducts.forEach(product => {
  const card = document.querySelector(`[data-product-id="${product.id}"]`);
  if (card) {
    console.log(`\n✅ Producto ${product.id} encontrado en página`);
    
    // Buscar título
    const titleElement = card.querySelector('h3, [class*="font-bold"]');
    const title = titleElement ? titleElement.textContent.trim() : 'Sin título';
    console.log(`📝 Título en página: "${title}"`);
    
    // Buscar badges
    const badges = card.querySelectorAll('[class*="bg-blue-100"], [class*="bg-red-100"]');
    console.log(`🎯 Badges encontrados: ${badges.length}`);
    
    if (badges.length === 0) {
      console.log('❌ PROBLEMA: No hay badges visibles');
      console.log('💡 Verificar logs de React en la consola');
    } else {
      badges.forEach((badge, index) => {
        console.log(`  Badge ${index + 1}: "${badge.textContent.trim()}"`);
      });
    }
  } else {
    console.log(`❌ Producto ${product.id} no encontrado en página`);
  }
});

console.log('\n=== FIN TEST ===');