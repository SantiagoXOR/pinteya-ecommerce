// Script para encontrar y hacer clic en un producto con selector de ancho
const script = 
// Buscar productos que contengan 'cinta' en el nombre
const productCards = document.querySelectorAll('[data-testid*="product"], .product-card, [class*="product"]');
console.log('Productos encontrados:', productCards.length);

let targetProduct = null;
productCards.forEach((card, index) => {
  const text = card.textContent.toLowerCase();
  console.log('Producto', index, ':', text.substring(0, 100));
  
  if (text.includes('cinta') && text.includes('papel')) {
    targetProduct = card;
    console.log('¡Producto objetivo encontrado!', card);
  }
});

if (targetProduct) {
  console.log('Haciendo clic en el producto objetivo...');
  targetProduct.click();
  return 'SUCCESS: Clicked on cinta papel product';
} else {
  // Si no encontramos por nombre, buscar por cualquier producto
  if (productCards.length > 0) {
    console.log('Haciendo clic en el primer producto disponible...');
    productCards[0].click();
    return 'SUCCESS: Clicked on first available product';
  }
  return 'ERROR: No products found';
}
;

console.log(script);
