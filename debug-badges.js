// Script de debug para verificar badges en productos específicos
// Ejecutar en la consola del navegador

console.log('=== DEBUG BADGES ===');

// Función para verificar un producto específico
function debugProduct(productId) {
  const productCard = document.querySelector(`[data-product-id="${productId}"]`);
  if (!productCard) {
    console.log(`❌ Producto ${productId} no encontrado en el DOM`);
    return;
  }
  
  console.log(`🔍 Analizando producto ${productId}:`);
  
  // Buscar badges
  const badges = productCard.querySelectorAll('[class*="badge"], [class*="bg-blue-100"], [class*="bg-red-100"], [class*="bg-purple-100"]');
  console.log(`📊 Badges encontrados: ${badges.length}`);
  
  badges.forEach((badge, index) => {
    console.log(`  Badge ${index + 1}: "${badge.textContent.trim()}" - Classes: ${badge.className}`);
  });
  
  // Verificar datos del producto
  const productData = productCard.getAttribute('data-product-data');
  if (productData) {
    try {
      const data = JSON.parse(productData);
      console.log(`📋 Datos del producto:`, {
        color: data.color,
        medida: data.medida,
        name: data.name
      });
    } catch (e) {
      console.log('❌ Error parseando datos del producto');
    }
  }
  
  console.log('---');
}

// Verificar productos específicos que deberían tener badges
console.log('Verificando productos con medida...');
debugProduct(1); // Pincel Persianero Nº10
debugProduct(2); // Pincel Persianero Nº15
debugProduct(3); // Pincel Persianero Nº20

// Función para verificar todos los productos visibles
function debugAllProducts() {
  const productCards = document.querySelectorAll('[data-product-id]');
  console.log(`🔍 Total productos en página: ${productCards.length}`);
  
  productCards.forEach((card, index) => {
    const productId = card.getAttribute('data-product-id');
    const badges = card.querySelectorAll('[class*="badge"], [class*="bg-blue-100"], [class*="bg-red-100"], [class*="bg-purple-100"]');
    console.log(`Producto ${productId}: ${badges.length} badges`);
  });
}

// Ejecutar debug completo
debugAllProducts();

console.log('=== FIN DEBUG ===');