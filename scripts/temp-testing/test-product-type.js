// Test script para verificar la detección del tipo de producto
const fs = require('fs');
const path = require('path');

// Leer el archivo TypeScript y convertirlo a JavaScript básico para testing
const productUtilsPath = path.join(__dirname, 'src', 'utils', 'product-utils.ts');
let content = fs.readFileSync(productUtilsPath, 'utf8');

// Remover imports/exports de TypeScript y convertir a JavaScript básico
content = content
  .replace(/export\s+/g, '')
  .replace(/import\s+.*?from\s+.*?;/g, '')
  .replace(/:\s*\w+(\[\])?/g, '') // Remover type annotations básicas
  .replace(/interface\s+\w+\s*{[^}]*}/g, '') // Remover interfaces
  .replace(/type\s+\w+\s*=\s*[^;]+;/g, ''); // Remover type aliases

// Evaluar el código
eval(content);

// Test
const productName = 'Cinta Papel Blanca';
const category = 'Profesionales';
const result = detectProductType(productName, category);

console.log('=== TEST DE DETECCIÓN DE TIPO DE PRODUCTO ===');
console.log('Producto:', productName);
console.log('Categoría:', category);
console.log('Tipo detectado:', JSON.stringify(result, null, 2));
console.log('¿Tiene selector de ancho?', result.hasWidthSelector);
console.log('Opciones de ancho:', result.widthOptions);