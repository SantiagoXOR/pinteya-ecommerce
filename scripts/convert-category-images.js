const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const CATEGORIES_DIR = path.join(process.cwd(), 'public', 'images', 'categories');
const OUTPUT_DIR = path.join(CATEGORIES_DIR, 'optimized');
const WEBP_QUALITY = 90;
const TARGET_SIZE = 512; // Tamaño consistente: 512x512px

async function convertToWebP() {
  try {
    // Crear directorio de salida si no existe
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    console.log('📁 Directorio de salida creado: public/images/categories/optimized/\n');
    
    // Leer archivos PNG
    const files = await fs.readdir(CATEGORIES_DIR);
    const pngFiles = files.filter(f => f.endsWith('.png'));
    
    console.log(`📸 Encontradas ${pngFiles.length} imágenes PNG para convertir\n`);
    
    let totalOriginalSize = 0;
    let totalOptimizedSize = 0;
    
    for (const file of pngFiles) {
      const inputPath = path.join(CATEGORIES_DIR, file);
      const outputPath = path.join(OUTPUT_DIR, file.replace('.png', '.webp'));
      
      console.log(`🔄 Convirtiendo: ${file}`);
      
      // Convertir a WebP con optimización
      await sharp(inputPath)
        .resize(TARGET_SIZE, TARGET_SIZE, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .webp({ 
          quality: WEBP_QUALITY,
          alphaQuality: 100,
          effort: 6
        })
        .toFile(outputPath);
      
      // Calcular estadísticas
      const originalStats = await fs.stat(inputPath);
      const optimizedStats = await fs.stat(outputPath);
      
      totalOriginalSize += originalStats.size;
      totalOptimizedSize += optimizedStats.size;
      
      const originalSizeKB = (originalStats.size / 1024).toFixed(2);
      const optimizedSizeKB = (optimizedStats.size / 1024).toFixed(2);
      const saved = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1);
      
      console.log(`   Original: ${originalSizeKB} KB`);
      console.log(`   Optimizada: ${optimizedSizeKB} KB`);
      console.log(`   ✅ Ahorro: ${saved}%\n`);
    }
    
    // Resumen final
    const totalOriginalMB = (totalOriginalSize / 1024 / 1024).toFixed(2);
    const totalOptimizedMB = (totalOptimizedSize / 1024 / 1024).toFixed(2);
    const totalSaved = ((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 RESUMEN DE OPTIMIZACIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Imágenes convertidas: ${pngFiles.length}`);
    console.log(`   Tamaño original total: ${totalOriginalMB} MB`);
    console.log(`   Tamaño optimizado total: ${totalOptimizedMB} MB`);
    console.log(`   🎉 Ahorro total: ${totalSaved}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('✅ Las imágenes optimizadas están en:');
    console.log('   public/images/categories/optimized/\n');
    console.log('📤 Próximos pasos:');
    console.log('   1. Sube las imágenes .webp a tu bucket de Supabase');
    console.log('   2. Copia las URLs públicas de las imágenes');
    console.log('   3. Pasa las URLs para actualizar el código\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

convertToWebP();
