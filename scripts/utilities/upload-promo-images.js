// ===================================
// SCRIPT PARA OPTIMIZAR Y SUBIR IMÁGENES PROMO A SUPABASE STORAGE
// ===================================

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://aakzspzfulgftqlgwkpb.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY no está configurada');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const BUCKET = 'product-images';
const PROMO_FOLDER = 'promo';

// Rutas de las imágenes locales
const promoImagesDir = path.join(__dirname, '..', '..', 'public', 'images', 'promo');
const imagesToUpload = [
  {
    local: path.join(promoImagesDir, '30%off.png'),
    remote: `${PROMO_FOLDER}/30-off.webp`,
    description: 'Promoción 30% OFF'
  },
  {
    local: path.join(promoImagesDir, 'calculator.png'),
    remote: `${PROMO_FOLDER}/calculator.webp`,
    description: 'Calculadora de pintura'
  },
  {
    local: path.join(promoImagesDir, 'help.png'),
    remote: `${PROMO_FOLDER}/help.webp`,
    description: 'Ayuda por WhatsApp'
  }
];

async function optimizeImage(inputPath, outputPath) {
  try {
    if (!fs.existsSync(inputPath)) {
      console.error(`❌ Archivo no encontrado: ${inputPath}`);
      return null;
    }

    const stats = fs.statSync(inputPath);
    const originalSize = stats.size;

    // Optimizar imagen: convertir a WebP y redimensionar si es necesario
    await sharp(inputPath)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({
        quality: 85,
        effort: 6,
      })
      .toFile(outputPath);

    const optimizedStats = fs.statSync(outputPath);
    const optimizedSize = optimizedStats.size;
    const reduction = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(1);

    console.log(`✅ Optimizada: ${path.basename(inputPath)}`);
    console.log(
      `   Original: ${(originalSize / 1024).toFixed(1)}KB → Optimizada: ${(optimizedSize / 1024).toFixed(1)}KB (${reduction}% reducción)`
    );

    return outputPath;
  } catch (error) {
    console.error(`❌ Error optimizando ${inputPath}:`, error.message);
    return null;
  }
}

async function uploadImage(imageInfo) {
  try {
    // Crear directorio temporal si no existe
    const tempDir = path.join(__dirname, '..', '..', 'temp-optimized');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Optimizar imagen
    const tempPath = path.join(tempDir, path.basename(imageInfo.remote));
    const optimizedPath = await optimizeImage(imageInfo.local, tempPath);

    if (!optimizedPath) {
      console.error(`❌ No se pudo optimizar: ${imageInfo.description}`);
      return null;
    }

    // Leer archivo optimizado
    const fileBuffer = fs.readFileSync(optimizedPath);
    const fileStats = fs.statSync(optimizedPath);

    console.log(`\n📤 Subiendo: ${imageInfo.description}`);
    console.log(`   Tamaño: ${(fileStats.size / 1024).toFixed(2)} KB`);
    console.log(`   Destino: ${imageInfo.remote}`);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(imageInfo.remote, fileBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600'
      });

    if (error) {
      console.error(`❌ Error al subir: ${error.message}`);
      return null;
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(imageInfo.remote);

    console.log(`✅ Subida exitosa`);
    console.log(`   URL: ${urlData.publicUrl}`);

    // Limpiar archivo temporal
    try {
      fs.unlinkSync(optimizedPath);
    } catch (cleanupError) {
      console.warn(`⚠️ No se pudo eliminar archivo temporal: ${cleanupError.message}`);
    }

    return {
      local: imageInfo.local,
      remote: imageInfo.remote,
      url: urlData.publicUrl,
      description: imageInfo.description,
      size: fileStats.size
    };
  } catch (error) {
    console.error(`❌ Error procesando ${imageInfo.description}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Iniciando optimización y subida de imágenes promo a Supabase Storage\n');
  console.log(`📁 Directorio de imágenes: ${promoImagesDir}\n`);

  const results = [];

  for (const imageInfo of imagesToUpload) {
    const result = await uploadImage(imageInfo);
    if (result) {
      results.push(result);
    }
  }

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`✅ Imágenes subidas exitosamente: ${results.length}/${imagesToUpload.length}\n`);

  if (results.length > 0) {
    console.log('📋 URLs públicas:');
    results.forEach((result) => {
      console.log(`\n   ${result.description}:`);
      console.log(`   ${result.url}`);
    });

    // Actualizar los componentes con las nuevas URLs
    console.log('\n📝 Actualiza los componentes con las siguientes URLs:');
    results.forEach((result) => {
      const componentName = result.remote.includes('30-off') ? 'PromoCard' :
                           result.remote.includes('calculator') ? 'CalculatorCard' :
                           'HelpCard';
      console.log(`\n   ${componentName}:`);
      console.log(`   ${result.url}`);
    });
  }

  // Limpiar directorio temporal
  const tempDir = path.join(__dirname, '..', '..', 'temp-optimized');
  if (fs.existsSync(tempDir)) {
    try {
      const files = fs.readdirSync(tempDir);
      if (files.length === 0) {
        fs.rmdirSync(tempDir);
      }
    } catch (error) {
      // Ignorar errores de limpieza
    }
  }

  console.log('\n✅ Proceso completado\n');
}

main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
