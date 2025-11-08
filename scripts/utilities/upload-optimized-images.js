// ===================================
// SCRIPT PARA SUBIR IMÁGENES OPTIMIZADAS A SUPABASE STORAGE
// ===================================

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Definir las imágenes y sus rutas de destino en Supabase Storage
const imagesToUpload = [
  {
    local: 'c:\\Users\\marti\\Desktop\\image-products\\optimized\\CINTA DE ENMASCARAR RAPIFIX.webp',
    remote: 'rapifix/cinta-enmascarar-rapifix.webp',
    description: 'Cinta de Enmascarar Rapifix'
  },
  {
    local: 'c:\\Users\\marti\\Desktop\\image-products\\optimized\\PINCELETA BLACK EL GALGO N42.webp',
    remote: 'galgo/pinceleta-black-n42-galgo.webp',
    description: 'Pinceleta Black El Galgo N42'
  },
  {
    local: 'c:\\Users\\marti\\Desktop\\image-products\\optimized\\RODILLO CUERO LANAR ELEFANTE 17CM EL GALGO.webp',
    remote: 'galgo/rodillo-17cm-lanar-elefante-galgo.webp',
    description: 'Rodillo 17cm Lanar Elefante El Galgo'
  },
  {
    local: 'c:\\Users\\marti\\Desktop\\image-products\\optimized\\RODILLO GOLD FLOCK.webp',
    remote: 'galgo/rodillo-gold-flock-galgo.webp',
    description: 'Rodillo Gold Flock El Galgo'
  },
  {
    local: 'c:\\Users\\marti\\Desktop\\image-products\\optimized\\RODILLO MINI EPOXI.webp',
    remote: 'galgo/rodillo-mini-epoxi-galgo.webp',
    description: 'Rodillo Mini Epoxi El Galgo'
  }
];

async function uploadImage(imageInfo) {
  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(imageInfo.local)) {
      console.error(`❌ Archivo no encontrado: ${imageInfo.local}`);
      return null;
    }

    // Leer el archivo
    const fileBuffer = fs.readFileSync(imageInfo.local);
    const fileStats = fs.statSync(imageInfo.local);

    console.log(`\n📤 Subiendo: ${imageInfo.description}`);
    console.log(`   Tamaño: ${(fileStats.size / 1024).toFixed(2)} KB`);
    console.log(`   Destino: ${imageInfo.remote}`);

    // Subir a Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
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
      .from('product-images')
      .getPublicUrl(imageInfo.remote);

    console.log(`✅ Subida exitosa`);
    console.log(`   URL: ${urlData.publicUrl}`);

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
  console.log('🚀 Iniciando subida de imágenes a Supabase Storage\n');
  console.log('═══════════════════════════════════════════');
  console.log(`Bucket: product-images`);
  console.log(`Total de imágenes: ${imagesToUpload.length}`);
  console.log('═══════════════════════════════════════════');

  const results = [];
  const errors = [];

  for (const imageInfo of imagesToUpload) {
    const result = await uploadImage(imageInfo);
    if (result) {
      results.push(result);
    } else {
      errors.push(imageInfo);
    }
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('📊 RESUMEN DE SUBIDA');
  console.log('═══════════════════════════════════════════');
  console.log(`✅ Subidas exitosas: ${results.length}`);
  console.log(`❌ Errores: ${errors.length}`);
  console.log('═══════════════════════════════════════════\n');

  if (results.length > 0) {
    console.log('✅ IMÁGENES SUBIDAS:');
    console.log('─────────────────────────────────────────');
    results.forEach((result, idx) => {
      console.log(`\n${idx + 1}. ${result.description}`);
      console.log(`   URL: ${result.url}`);
    });
    console.log('');
  }

  if (errors.length > 0) {
    console.log('❌ ERRORES:');
    console.log('─────────────────────────────────────────');
    errors.forEach((error, idx) => {
      console.log(`${idx + 1}. ${error.description}`);
    });
    console.log('');
  }

  // Guardar resultados en un archivo JSON
  const reportPath = path.join(process.cwd(), 'reports', `upload-images-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    fecha: new Date().toISOString(),
    bucket: 'product-images',
    total: imagesToUpload.length,
    exitosas: results.length,
    errores: errors.length,
    resultados: results
  }, null, 2));

  console.log(`📄 Reporte guardado en: ${reportPath}\n`);

  return { results, errors };
}

main()
  .then(({ results, errors }) => {
    console.log('✨ Proceso de subida completado');
    if (errors.length === 0) {
      console.log('✅ Todas las imágenes fueron subidas exitosamente\n');
      process.exit(0);
    } else {
      console.log('⚠️  Algunas imágenes no pudieron ser subidas\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Error en el proceso:', error);
    process.exit(1);
  });

