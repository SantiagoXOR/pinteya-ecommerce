console.log('=== DEBUG TEST CHECKOUT FLOW ===');

// Verificar que el archivo existe
const fs = require('fs');
const path = require('path');

const testFile = 'src/components/ui/__tests__/checkout-flow.test.tsx';
console.log('Verificando archivo:', testFile);
console.log('Existe:', fs.existsSync(testFile));

if (fs.existsSync(testFile)) {
  console.log('Tamaño del archivo:', fs.statSync(testFile).size, 'bytes');
  
  // Leer las primeras líneas
  const content = fs.readFileSync(testFile, 'utf8');
  const lines = content.split('\n').slice(0, 10);
  console.log('Primeras 10 líneas:');
  lines.forEach((line, i) => {
    console.log(`${i + 1}: ${line}`);
  });
}

// Verificar Jest
console.log('\n=== VERIFICANDO JEST ===');
try {
  const jest = require('jest');
  console.log('Jest disponible:', !!jest);
} catch (e) {
  console.log('Error cargando Jest:', e.message);
}

// Verificar configuración
console.log('\n=== VERIFICANDO CONFIGURACIÓN ===');
console.log('jest.config.js existe:', fs.existsSync('jest.config.js'));
console.log('jest.setup.js existe:', fs.existsSync('jest.setup.js'));

console.log('\n=== FIN DEBUG ===');