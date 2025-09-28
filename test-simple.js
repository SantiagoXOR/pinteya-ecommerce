// Test simple para verificar Jest
const { execSync } = require('child_process');

try {
  console.log('Ejecutando test checkout-flow...');
  const result = execSync('npx jest src/components/ui/__tests__/checkout-flow.test.tsx --verbose --no-cache', {
    encoding: 'utf8',
    stdio: 'pipe'
  });
  console.log('RESULTADO:', result);
} catch (error) {
  console.log('ERROR CAPTURADO:');
  console.log('Exit code:', error.status);
  console.log('Stdout:', error.stdout);
  console.log('Stderr:', error.stderr);
  console.log('Message:', error.message);
}