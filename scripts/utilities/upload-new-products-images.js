const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Configuración de Supabase
const supabaseUrl = 'https://aakzspzfulgftqlgwkpb.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no está configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Imágenes a subir
const imagesToUpload = [
  // Lijas El Galgo
  { local: 'edited-images/galgo/lija-al-agua-40.png', remote: 'lija-al-agua-40.png' },
  { local: 'edited-images/galgo/lija-al-agua-50.png', remote: 'lija-al-agua-50.png' },
  { local: 'edited-images/galgo/lija-al-agua-80.png', remote: 'lija-al-agua-80.png' },
  { local: 'edited-images/galgo/lija-al-agua-120.png', remote: 'lija-al-agua-120.png' },
  { local: 'edited-images/galgo/lija-al-agua-180.png', remote: 'lija-al-agua-180.png' },
  // Accesorios
  { local: 'edited-images/genericos/bandeja-chata.png', remote: 'bandeja-chata.png' },
  { local: 'edited-images/genericos/pinceleta-obra.png', remote: 'pinceleta-obra.png' }
];

async function optimizeImage(inputPath, outputPath) {
  try {
    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;
    
    await sharp(inputPath)
      .resize(800, 800, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .png({ 
        quality: 85,
        compressionLevel: 9 
      })
      .toFile(outputPath);
    
    const optimizedStats = fs.statSync(outputPath);
    const optimizedSize = optimizedStats.size;
    const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
    
    console.log(`✅ Optimizada: ${path.basename(inputPath)}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)}KB → Optimizada: ${(optimizedSize / 1024).toFixed(1)}KB (${reduction}% reducción)`);
    
    return outputPath;
  } catch (error) {
    console.error(`❌ Error optimizando ${inputPath}:`, error.message);
    return inputPath; // Usar original si falla la optimización
  }
}

async function uploadImage(localPath, remoteName) {
  try {
    // Crear directorio temporal si no existe
    const tempDir = 'temp-optimized';
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Optimizar imagen
    const tempPath = path.join(tempDir, remoteName);
    const optimizedPath = await optimizeImage(localPath, tempPath);
    
    // Leer archivo optimizado
    const fileBuffer = fs.readFileSync(optimizedPath);
    
    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(remoteName, fileBuffer, {
        contentType: 'image/png',
        upsert: true
      });
    
    if (error) {
      console.error(`❌ Error subiendo ${remoteName}:`, error.message);
      return false;
    }
    
    console.log(`🚀 Subida exitosa: ${remoteName}`);
    
    // Limpiar archivo temporal
    if (fs.existsSync(optimizedPath)) {
      fs.unlinkSync(optimizedPath);
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Error procesando ${localPath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Iniciando subida y optimización de imágenes de productos...\n');
  
  let successCount = 0;
  let totalCount = imagesToUpload.length;
  
  for (const image of imagesToUpload) {
    console.log(`📸 Procesando: ${image.local}`);
    
    if (!fs.existsSync(image.local)) {
      console.error(`❌ Archivo no encontrado: ${image.local}`);
      continue;
    }
    
    const success = await uploadImage(image.local, image.remote);
    if (success) {
      successCount++;
    }
    
    console.log(''); // Línea en blanco para separar
  }
  
  // Limpiar directorio temporal
  const tempDir = 'temp-optimized';
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true });
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`✅ Imágenes subidas exitosamente: ${successCount}/${totalCount}`);
  
  if (successCount === totalCount) {
    console.log('🎉 ¡Todas las imágenes se subieron correctamente!');
    console.log('\n🔗 Las imágenes están disponibles en:');
    imagesToUpload.forEach(img => {
      console.log(`   https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/${img.remote}`);
    });
  } else {
    console.log('⚠️  Algunas imágenes no se pudieron subir. Revisa los errores arriba.');
  }
}

main().catch(console.error);
