const fs = require('fs');
const path = require('path');

const chunkPath = path.join(process.cwd(), '.next', 'static', 'chunks', '92d203edc9c1b3db.js');

if (!fs.existsSync(chunkPath)) {
  console.error('❌ Chunk no encontrado');
  process.exit(1);
}

const chunk = fs.readFileSync(chunkPath, 'utf8');
const sizeKB = Math.round(fs.statSync(chunkPath).size / 1024 * 100) / 100;

console.log(`📦 Análisis del chunk más grande: 92d203edc9c1b3db.js (${sizeKB} KB)\n`);

// Buscar patrones comunes
const patterns = {
  'Turbopack': (chunk.match(/TURBOPACK/g) || []).length,
  'node_modules': (chunk.match(/node_modules/g) || []).length,
  'react': (chunk.match(/["']react["']/g) || []).length,
  'react-dom': (chunk.match(/["']react-dom["']/g) || []).length,
  '@radix-ui': (chunk.match(/@radix-ui/g) || []).length,
  'swiper': (chunk.match(/swiper/g) || []).length,
  'framer-motion': (chunk.match(/framer-motion/g) || []).length,
  'recharts': (chunk.match(/recharts/g) || []).length,
  '@tanstack': (chunk.match(/@tanstack/g) || []).length,
  'redux': (chunk.match(/redux/g) || []).length,
  'lodash': (chunk.match(/lodash/g) || []).length,
  'clsx': (chunk.match(/clsx/g) || []).length,
  'classnames': (chunk.match(/classnames/g) || []).length,
};

console.log('🔍 Patrones encontrados:');
Object.entries(patterns)
  .filter(([_, count]) => count > 0)
  .sort(([_, a], [__, b]) => b - a)
  .forEach(([pattern, count]) => {
    console.log(`  ${pattern}: ${count} referencias`);
  });

// Buscar nombres de módulos comunes
const modulePatterns = [
  /require\(["']([^"']+)["']\)/g,
  /import\(["']([^"']+)["']\)/g,
  /from ["']([^"']+)["']/g,
];

const modules = new Set();
modulePatterns.forEach(pattern => {
  let match;
  while ((match = pattern.exec(chunk)) !== null) {
    if (match[1] && !match[1].startsWith('.')) {
      modules.add(match[1].split('/')[0]);
    }
  }
});

console.log('\n📚 Módulos principales detectados:');
Array.from(modules).slice(0, 20).forEach(mod => {
  console.log(`  - ${mod}`);
});

// Análisis de tamaño
const lines = chunk.split('\n');
console.log(`\n📊 Estadísticas:`);
console.log(`  Líneas totales: ${lines.length}`);
console.log(`  Tamaño: ${sizeKB} KB`);
console.log(`  Caracteres: ${chunk.length.toLocaleString()}`);

// Verificar si es código minificado
const isMinified = lines.length < 100 && chunk.length > 100000;
console.log(`  Minificado: ${isMinified ? 'Sí' : 'No'}`);

// Recomendaciones
console.log('\n💡 Recomendaciones:');
if (sizeKB > 500) {
  console.log('  🔴 CRÍTICO: Chunk demasiado grande (>500KB)');
  console.log('     - Investigar qué librerías contiene');
  console.log('     - Aplicar code splitting más agresivo');
  console.log('     - Considerar lazy loading');
} else if (sizeKB > 200) {
  console.log('  🟡 ATENCIÓN: Chunk grande (>200KB)');
  console.log('     - Verificar si puede dividirse');
  console.log('     - Considerar optimización');
}

console.log('\n✅ Para análisis detallado, ejecutar:');
console.log('   ANALYZE=true npm run build');
