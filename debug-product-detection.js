// Script simple para debuggear la detección del tipo de producto
console.log('=== DEBUG DETECCIÓN DE PRODUCTO ===');

const productName = 'Cinta Papel Blanca';
const category = 'Profesionales';

console.log('Producto:', productName);
console.log('Categoría:', category);

const name = productName.toLowerCase();
console.log('Nombre en minúsculas:', name);

// Verificar condiciones
console.log('¿Contiene "cinta"?', name.includes('cinta'));
console.log('¿Contiene "papel"?', name.includes('papel'));
console.log('¿Contiene "enmascarar"?', name.includes('enmascarar'));

const condition = name.includes('cinta') && (name.includes('papel') || name.includes('enmascarar'));
console.log('¿Cumple condición para cintas-papel?', condition);

// Simular el tipo de producto que debería retornar
const expectedType = {
  id: 'cintas-papel',
  name: 'Cintas de Papel',
  hasColorSelector: false,
  capacityUnit: 'metros',
  defaultCapacities: ['40m'],
  category: 'accesorios',
  hasWidthSelector: true,
  widthOptions: ['18mm', '24mm', '36mm', '48mm'],
};

console.log('Tipo esperado:', JSON.stringify(expectedType, null, 2));