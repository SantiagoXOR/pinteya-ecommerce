#!/usr/bin/env node

/**
 * Script de análisis de imágenes para optimización
 * 
 * Este script escanea el directorio public/images y genera un reporte
 * de las imágenes que necesitan optimización.
 * 
 * Uso:
 *   node scripts/optimize-images.js
 * 
 * Para optimizar realmente las imágenes, se recomienda usar:
 *   - sharp-cli: npx sharp-cli -i input.png -o output.webp --webp
 *   - squoosh-cli: npx @squoosh/cli --webp auto input.png
 *   - Servicio online: squoosh.app
 */

const fs = require('fs');
const path = require('path');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.svg'];
const PRIORITY_DIRS = ['hero', 'products', 'categories', 'logo'];

// Tamaño mínimo para considerar optimización (50KB)
const MIN_SIZE_FOR_OPTIMIZATION = 50 * 1024;

function getDirectorySize(dirPath) {
  let totalSize = 0;
  
  try {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else if (stats.isFile()) {
        totalSize += stats.size;
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error.message);
  }
  
  return totalSize;
}

function scanImages(dir, baseDir = dir, results = []) {
  try {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        scanImages(filePath, baseDir, results);
      } else if (stats.isFile()) {
        const ext = path.extname(file).toLowerCase();
        
        if (IMAGE_EXTENSIONS.includes(ext)) {
          const relativePath = path.relative(baseDir, filePath);
          const sizeKB = (stats.size / 1024).toFixed(2);
          const isPriority = PRIORITY_DIRS.some(dir => relativePath.includes(dir));
          const needsOptimization = stats.size > MIN_SIZE_FOR_OPTIMIZATION && ext !== '.svg';
          
          results.push({
            path: relativePath,
            size: stats.size,
            sizeKB,
            ext,
            isPriority,
            needsOptimization,
            hasWebP: false, // Se actualizará después
          });
        }
      }
    }
  } catch (error) {
    console.error(`Error scanning ${dir}:`, error.message);
  }
  
  return results;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function generateReport() {
  const publicImagesPath = path.join(process.cwd(), 'public', 'images');
  
  console.log('🔍 Analizando imágenes en public/images...\n');
  
  if (!fs.existsSync(publicImagesPath)) {
    console.error('❌ No se encontró el directorio public/images');
    process.exit(1);
  }
  
  const images = scanImages(publicImagesPath);
  
  // Verificar si existen versiones WebP
  images.forEach(img => {
    const webpPath = img.path.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    const fullWebpPath = path.join(publicImagesPath, webpPath);
    img.hasWebP = fs.existsSync(fullWebpPath);
  });
  
  // Estadísticas
  const totalImages = images.length;
  const totalSize = images.reduce((sum, img) => sum + img.size, 0);
  const needsOptimization = images.filter(img => img.needsOptimization);
  const priorityImages = images.filter(img => img.isPriority);
  const withoutWebP = images.filter(img => !img.hasWebP && img.ext !== '.svg');
  
  console.log('📊 RESUMEN');
  console.log('═'.repeat(60));
  console.log(`Total de imágenes: ${totalImages}`);
  console.log(`Tamaño total: ${formatBytes(totalSize)}`);
  console.log(`Imágenes que necesitan optimización: ${needsOptimization.length}`);
  console.log(`Imágenes prioritarias: ${priorityImages.length}`);
  console.log(`Imágenes sin versión WebP: ${withoutWebP.length}`);
  console.log('');
  
  // Imágenes prioritarias que necesitan optimización
  const priorityNeedsOptimization = needsOptimization.filter(img => img.isPriority);
  
  if (priorityNeedsOptimization.length > 0) {
    console.log('🎯 IMÁGENES PRIORITARIAS PARA OPTIMIZAR');
    console.log('═'.repeat(60));
    
    priorityNeedsOptimization
      .sort((a, b) => b.size - a.size)
      .forEach(img => {
        console.log(`${img.hasWebP ? '✓' : '✗'} ${img.path} (${img.sizeKB} KB)`);
      });
    console.log('');
  }
  
  // Top 10 imágenes más grandes
  const largestImages = [...images]
    .filter(img => img.ext !== '.svg')
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);
  
  console.log('🔴 TOP 10 IMÁGENES MÁS GRANDES');
  console.log('═'.repeat(60));
  largestImages.forEach((img, i) => {
    console.log(`${i + 1}. ${img.path} (${formatBytes(img.size)})`);
  });
  console.log('');
  
  // Recomendaciones
  console.log('💡 RECOMENDACIONES');
  console.log('═'.repeat(60));
  console.log('1. Convertir imágenes PNG/JPG a WebP para reducir ~30% el tamaño');
  console.log('2. Usar AVIF cuando sea posible (mejor compresión que WebP)');
  console.log('3. Implementar lazy loading para imágenes below-the-fold');
  console.log('4. Usar responsive images con sizes apropiados');
  console.log('');
  console.log('🛠️  HERRAMIENTAS RECOMENDADAS:');
  console.log('   - Squoosh: https://squoosh.app (online, fácil de usar)');
  console.log('   - Sharp: npm install -g sharp-cli');
  console.log('   - ImageMagick: convert input.jpg -quality 85 output.webp');
  console.log('');
  console.log('📝 SCRIPT DE CONVERSIÓN MASIVA:');
  console.log('   # Instalar sharp-cli globalmente');
  console.log('   npm install -g sharp-cli');
  console.log('');
  console.log('   # Convertir todas las imágenes de un directorio');
  console.log('   cd public/images/hero');
  console.log('   for file in *.{jpg,png}; do');
  console.log('     sharp -i "$file" -o "${file%.*}.webp" --webp');
  console.log('   done');
  console.log('');
  
  // Generar archivo JSON con el reporte
  const reportPath = path.join(process.cwd(), 'image-optimization-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalImages,
      totalSize: formatBytes(totalSize),
      needsOptimization: needsOptimization.length,
      priorityImages: priorityImages.length,
      withoutWebP: withoutWebP.length,
    },
    priorityImages: priorityNeedsOptimization.map(img => ({
      path: img.path,
      size: formatBytes(img.size),
      hasWebP: img.hasWebP,
    })),
    largestImages: largestImages.map(img => ({
      path: img.path,
      size: formatBytes(img.size),
      hasWebP: img.hasWebP,
    })),
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Reporte detallado guardado en: ${reportPath}`);
}

// Ejecutar el análisis
generateReport();





















