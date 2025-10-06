// Script de debug final para verificar badges en productos específicos
// Ejecutar en la consola del navegador en http://localhost:3000

console.log('🔍 INICIANDO DEBUG FINAL DE BADGES');

// Función para buscar productos específicos por nombre
function findProductsByName(name) {
  const products = document.querySelectorAll('[data-product-id]');
  const found = [];
  
  products.forEach(product => {
    const titleElement = product.querySelector('h3, h2, .product-title, [class*="title"]');
    if (titleElement && titleElement.textContent.toLowerCase().includes(name.toLowerCase())) {
      found.push({
        element: product,
        id: product.getAttribute('data-product-id'),
        title: titleElement.textContent.trim()
      });
    }
  });
  
  return found;
}

// Función para verificar badges en un producto específico
function debugProductBadges(productElement) {
  console.group(`🎯 Debuggeando producto: ${productElement.title}`);
  
  // Buscar badges en el elemento
  const badgeSelectors = [
    '.badge',
    '[class*="badge"]',
    '.bg-yellow-400',
    '.bg-green-500',
    '.bg-blue-500',
    '.bg-orange-500',
    '[class*="rounded"]'
  ];
  
  let foundBadges = [];
  badgeSelectors.forEach(selector => {
    const badges = productElement.element.querySelectorAll(selector);
    badges.forEach(badge => {
      if (badge.textContent.trim() && !foundBadges.includes(badge)) {
        foundBadges.push(badge);
      }
    });
  });
  
  console.log(`📊 Badges encontrados: ${foundBadges.length}`);
  foundBadges.forEach((badge, index) => {
    console.log(`  ${index + 1}. "${badge.textContent.trim()}" - Classes: ${badge.className}`);
  });
  
  // Verificar atributos de datos
  const dataAttrs = {};
  Array.from(productElement.element.attributes).forEach(attr => {
    if (attr.name.startsWith('data-')) {
      dataAttrs[attr.name] = attr.value;
    }
  });
  
  console.log('📋 Atributos data:', dataAttrs);
  console.groupEnd();
  
  return foundBadges;
}

// Función principal de debug
function debugBarnizCampbell() {
  console.log('🔍 Buscando productos "Barniz Campbell"...');
  
  const barnizProducts = findProductsByName('Barniz Campbell');
  console.log(`📦 Productos encontrados: ${barnizProducts.length}`);
  
  if (barnizProducts.length === 0) {
    console.warn('⚠️ No se encontraron productos "Barniz Campbell" en la página');
    console.log('💡 Productos disponibles:');
    const allProducts = document.querySelectorAll('[data-product-id]');
    allProducts.forEach((product, index) => {
      const titleElement = product.querySelector('h3, h2, .product-title, [class*="title"]');
      if (titleElement && index < 10) {
        console.log(`  ${index + 1}. ${titleElement.textContent.trim()}`);
      }
    });
    return;
  }
  
  barnizProducts.forEach(product => {
    debugProductBadges(product);
  });
}

// Función para verificar logs de React en la consola
function checkReactLogs() {
  console.log('📝 Verificando logs de React...');
  console.log('💡 Busca en la consola logs que empiecen con:');
  console.log('  - 🎨 [ProductCardCommercial] Generando badges');
  console.log('  - 📋 extractedInfo:');
  console.log('  - 🎯 Badges generados:');
  console.log('  - ⚠️ NO SE GENERARON BADGES');
}

// Función para verificar la función formatProductBadges
function testFormatProductBadges() {
  console.log('🧪 Testeando formatProductBadges...');
  
  // Datos de prueba basados en los productos reales
  const testData = {
    capacity: '1L',
    color: 'INCOLORO',
    material: null,
    grit: null,
    dimensions: null
  };
  
  const testConfig = {
    showCapacity: true,
    showColor: true,
    showMaterial: true,
    showGrit: true,
    showDimensions: true,
    maxBadges: 3
  };
  
  console.log('📋 Datos de prueba:', testData);
  console.log('⚙️ Configuración de prueba:', testConfig);
  
  // Intentar acceder a la función desde el contexto global
  if (typeof window.formatProductBadges === 'function') {
    const result = window.formatProductBadges(testData, testConfig);
    console.log('🎯 Resultado:', result);
  } else {
    console.warn('⚠️ formatProductBadges no está disponible en el contexto global');
  }
}

// Ejecutar debug automáticamente
setTimeout(() => {
  console.log('🚀 Ejecutando debug automático...');
  checkReactLogs();
  debugBarnizCampbell();
  testFormatProductBadges();
}, 2000);

// Exportar funciones para uso manual
window.debugBarnizCampbell = debugBarnizCampbell;
window.checkReactLogs = checkReactLogs;
window.testFormatProductBadges = testFormatProductBadges;

console.log('✅ Script de debug cargado. Funciones disponibles:');
console.log('  - debugBarnizCampbell()');
console.log('  - checkReactLogs()');
console.log('  - testFormatProductBadges()');