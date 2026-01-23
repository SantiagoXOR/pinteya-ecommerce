const fs = require('fs');
const path = require('path');

const chunksDir = path.join(process.cwd(), '.next', 'static', 'chunks');

if (!fs.existsSync(chunksDir)) {
  console.error('❌ Directorio .next/static/chunks no encontrado');
  process.exit(1);
}

const chunks = fs.readdirSync(chunksDir)
  .filter(file => file.endsWith('.js'))
  .map(file => {
    const filePath = path.join(chunksDir, file);
    const stats = fs.statSync(filePath);
    return {
      name: file,
      size: stats.size,
      sizeKB: Math.round(stats.size / 1024 * 100) / 100,
      sizeMB: Math.round(stats.size / (1024 * 1024) * 100) / 100
    };
  })
  .sort((a, b) => b.size - a.size);

const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
const totalSizeMB = Math.round(totalSize / (1024 * 1024) * 100) / 100;

console.log('📊 ANÁLISIS DE CHUNKS - BUILD OPTIMIZADO\n');
console.log('='.repeat(60));
console.log(`Total de chunks: ${chunks.length}`);
console.log(`Tamaño total: ${totalSizeMB} MB`);
console.log('='.repeat(60));

// Chunks grandes (>100KB)
const largeChunks = chunks.filter(c => c.size > 100 * 1024);
console.log(`\n🔴 Chunks grandes (>100KB): ${largeChunks.length}`);
largeChunks.forEach(chunk => {
  console.log(`  - ${chunk.name}: ${chunk.sizeKB} KB (${chunk.sizeMB} MB)`);
});

// Chunks medianos (50KB - 100KB)
const mediumChunks = chunks.filter(c => c.size > 50 * 1024 && c.size <= 100 * 1024);
console.log(`\n🟡 Chunks medianos (50KB-100KB): ${mediumChunks.length}`);
if (mediumChunks.length > 0) {
  mediumChunks.slice(0, 10).forEach(chunk => {
    console.log(`  - ${chunk.name}: ${chunk.sizeKB} KB`);
  });
  if (mediumChunks.length > 10) {
    console.log(`  ... y ${mediumChunks.length - 10} más`);
  }
}

// Chunks pequeños (<50KB)
const smallChunks = chunks.filter(c => c.size <= 50 * 1024);
console.log(`\n🟢 Chunks pequeños (<50KB): ${smallChunks.length}`);

// Análisis de distribución
console.log('\n📈 Distribución de tamaños:');
const sizeRanges = {
  '>500KB': chunks.filter(c => c.size > 500 * 1024).length,
  '200-500KB': chunks.filter(c => c.size > 200 * 1024 && c.size <= 500 * 1024).length,
  '100-200KB': chunks.filter(c => c.size > 100 * 1024 && c.size <= 200 * 1024).length,
  '50-100KB': chunks.filter(c => c.size > 50 * 1024 && c.size <= 100 * 1024).length,
  '<50KB': chunks.filter(c => c.size <= 50 * 1024).length
};

Object.entries(sizeRanges).forEach(([range, count]) => {
  const percentage = Math.round((count / chunks.length) * 100);
  console.log(`  ${range}: ${count} chunks (${percentage}%)`);
});

// Top 10 chunks más grandes
console.log('\n🔝 Top 10 chunks más grandes:');
chunks.slice(0, 10).forEach((chunk, index) => {
  console.log(`  ${index + 1}. ${chunk.name}: ${chunk.sizeKB} KB (${chunk.sizeMB} MB)`);
});

// Verificar si hay chunks problemáticos
console.log('\n⚠️  Verificaciones:');
const problematicChunks = chunks.filter(c => c.size > 200 * 1024);
if (problematicChunks.length > 0) {
  console.log(`  ⚠️  ${problematicChunks.length} chunks >200KB encontrados:`);
  problematicChunks.forEach(chunk => {
    console.log(`     - ${chunk.name}: ${chunk.sizeKB} KB`);
  });
} else {
  console.log('  ✅ No hay chunks problemáticos (>200KB)');
}

// Verificar code splitting
const avgChunkSize = totalSize / chunks.length;
const avgChunkSizeKB = Math.round(avgChunkSize / 1024 * 100) / 100;
console.log(`\n📊 Tamaño promedio por chunk: ${avgChunkSizeKB} KB`);

if (avgChunkSizeKB > 100) {
  console.log('  ⚠️  Tamaño promedio alto - considerar más code splitting');
} else if (avgChunkSizeKB > 50) {
  console.log('  🟡 Tamaño promedio moderado');
} else {
  console.log('  ✅ Tamaño promedio bueno');
}

console.log('\n' + '='.repeat(60));
