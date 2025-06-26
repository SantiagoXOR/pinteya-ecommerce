/**
 * Script para subir imágenes editadas a Supabase Storage y actualizar base de datos
 * Pinteya E-commerce - Upload de imágenes profesionales
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Leer variables de entorno desde .env.local
function loadEnvVars() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Error leyendo .env.local:', error.message);
    return {};
  }
}

const envVars = loadEnvVars();

// Configuración de Supabase
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Configuración
const BUCKET_ID = 'product-images';
const OPTIMIZED_IMAGES_DIR = path.join(__dirname, '..', 'optimized-images');
const EDITED_IMAGES_DIR = path.join(__dirname, '..', 'edited-images');
const SUPPORTED_FORMATS = ['.webp', '.jpg', '.jpeg', '.png'];

// Función para obtener la URL pública de Supabase Storage
function getPublicUrl(filePath) {
  const { data } = supabase.storage
    .from(BUCKET_ID)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

// Función para subir un archivo a Supabase Storage
async function uploadFile(localPath, remotePath) {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const fileExt = path.extname(localPath).toLowerCase();
    
    // Determinar content type
    let contentType = 'image/jpeg';
    if (fileExt === '.webp') contentType = 'image/webp';
    if (fileExt === '.png') contentType = 'image/png';
    
    const { data, error } = await supabase.storage
      .from(BUCKET_ID)
      .upload(remotePath, fileBuffer, {
        contentType: contentType,
        upsert: true // Sobrescribir si existe
      });

    if (error) {
      throw error;
    }

    return {
      success: true,
      path: data.path,
      publicUrl: getPublicUrl(data.path)
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Función para escanear archivos optimizados
function scanOptimizedImages() {
  const imageFiles = [];

  // Priorizar imágenes optimizadas si existen
  const sourceDir = fs.existsSync(OPTIMIZED_IMAGES_DIR) ? OPTIMIZED_IMAGES_DIR : EDITED_IMAGES_DIR;
  const dirName = sourceDir === OPTIMIZED_IMAGES_DIR ? 'optimizadas' : 'editadas';

  if (!fs.existsSync(sourceDir)) {
    console.log(`⚠️ Directorio de imágenes ${dirName} no encontrado:`, sourceDir);
    return imageFiles;
  }

  console.log(`📁 Usando imágenes ${dirName} desde: ${sourceDir}`);

  // Escanear subdirectorios por marca (poximix en lugar de poxipol)
  const brands = ['plavicon', 'petrilac', 'poximix', 'sinteplast', 'galgo', 'genericos'];
  
  brands.forEach(brand => {
    const brandDir = path.join(sourceDir, brand);
    
    if (fs.existsSync(brandDir)) {
      const files = fs.readdirSync(brandDir);
      
      files.forEach(file => {
        const fileExt = path.extname(file).toLowerCase();
        
        if (SUPPORTED_FORMATS.includes(fileExt)) {
          const localPath = path.join(brandDir, file);
          const remotePath = `${brand}/${file}`;
          const slug = path.basename(file, fileExt);
          
          imageFiles.push({
            brand: brand,
            filename: file,
            slug: slug,
            localPath: localPath,
            remotePath: remotePath,
            format: fileExt.substring(1) // sin el punto
          });
        }
      });
    }
  });

  return imageFiles;
}

// Función para actualizar URLs en la base de datos
async function updateProductImages(slug, imageUrls) {
  try {
    const imageData = {
      main: imageUrls.webp || imageUrls.jpg || imageUrls.jpeg || imageUrls.png,
      gallery: [imageUrls.webp || imageUrls.jpg || imageUrls.jpeg || imageUrls.png],
      thumbnail: imageUrls.webp || imageUrls.jpg || imageUrls.jpeg || imageUrls.png
    };

    const { data, error } = await supabase
      .from('products')
      .update({ images: imageData })
      .eq('slug', slug);

    if (error) {
      throw error;
    }

    return { success: true };

  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}

// Función principal para subir todas las imágenes
async function uploadAllEditedImages() {
  console.log('🚀 Iniciando subida de imágenes editadas...\n');

  try {
    // 1. Escanear archivos optimizados/editados
    const imageFiles = scanOptimizedImages();
    
    if (imageFiles.length === 0) {
      console.log('⚠️ No se encontraron imágenes editadas para subir');
      console.log(`📁 Asegúrate de que las imágenes estén en: ${EDITED_IMAGES_DIR}`);
      return;
    }

    console.log(`📦 Encontradas ${imageFiles.length} imágenes para subir\n`);

    // 2. Agrupar por slug para manejar múltiples formatos
    const imagesBySlug = {};
    imageFiles.forEach(img => {
      if (!imagesBySlug[img.slug]) {
        imagesBySlug[img.slug] = {
          slug: img.slug,
          brand: img.brand,
          formats: {}
        };
      }
      imagesBySlug[img.slug].formats[img.format] = img;
    });

    let successCount = 0;
    let errorCount = 0;
    const uploadLog = [];

    // 3. Subir imágenes por producto
    for (const [slug, productImages] of Object.entries(imagesBySlug)) {
      console.log(`📤 Subiendo: ${slug}`);
      
      const uploadedUrls = {};
      let productSuccess = true;
      
      // Subir cada formato disponible
      for (const [format, imageInfo] of Object.entries(productImages.formats)) {
        console.log(`   📎 Formato ${format.toUpperCase()}...`);
        
        const uploadResult = await uploadFile(imageInfo.localPath, imageInfo.remotePath);
        
        if (uploadResult.success) {
          uploadedUrls[format] = uploadResult.publicUrl;
          console.log(`   ✅ Subido: ${imageInfo.filename}`);
        } else {
          console.log(`   ❌ Error: ${uploadResult.error}`);
          productSuccess = false;
        }
        
        // Pausa entre uploads
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // 4. Actualizar base de datos si al menos una imagen se subió
      if (Object.keys(uploadedUrls).length > 0) {
        console.log(`   🔄 Actualizando base de datos...`);
        
        const updateResult = await updateProductImages(slug, uploadedUrls);
        
        if (updateResult.success) {
          console.log(`   ✅ Base de datos actualizada`);
          successCount++;
        } else {
          console.log(`   ❌ Error BD: ${updateResult.error}`);
          productSuccess = false;
          errorCount++;
        }
      } else {
        productSuccess = false;
        errorCount++;
      }

      // Log del resultado
      uploadLog.push({
        slug: slug,
        brand: productImages.brand,
        success: productSuccess,
        formats: Object.keys(uploadedUrls),
        urls: uploadedUrls,
        error: productSuccess ? null : 'Error en subida o actualización'
      });

      console.log(''); // Línea en blanco
    }

    // 5. Guardar log de subida
    const logPath = path.join(__dirname, '..', 'upload-log.json');
    fs.writeFileSync(logPath, JSON.stringify(uploadLog, null, 2));

    // 6. Resumen final
    console.log('📊 Resumen de subida:');
    console.log(`✅ Productos actualizados: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📦 Total procesados: ${successCount + errorCount}`);

    // Resumen por marca
    const brandSummary = {};
    uploadLog.forEach(item => {
      if (!brandSummary[item.brand]) {
        brandSummary[item.brand] = { success: 0, errors: 0 };
      }
      if (item.success) {
        brandSummary[item.brand].success++;
      } else {
        brandSummary[item.brand].errors++;
      }
    });

    console.log('\n📁 Resumen por marca:');
    Object.entries(brandSummary).forEach(([brand, stats]) => {
      console.log(`   ${brand.toUpperCase()}: ${stats.success} exitosos, ${stats.errors} errores`);
    });

    console.log(`\n📄 Log detallado guardado en: ${logPath}`);

    if (successCount > 0) {
      console.log('\n🎉 ¡Imágenes subidas exitosamente!');
      console.log('🌐 Las nuevas URLs ya están activas en el e-commerce');
    }

  } catch (error) {
    console.error('\n💥 Error en la subida:', error);
    process.exit(1);
  }
}

// Función para verificar configuración
async function verifySetup() {
  try {
    // Verificar bucket
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw new Error(`Error verificando buckets: ${error.message}`);
    }

    const bucket = buckets.find(b => b.id === BUCKET_ID);
    if (!bucket) {
      throw new Error(`Bucket '${BUCKET_ID}' no encontrado. Ejecuta setup-storage.js primero.`);
    }

    console.log('✅ Configuración verificada correctamente');
    return true;

  } catch (error) {
    console.error('❌ Error en verificación:', error.message);
    return false;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  verifySetup()
    .then((isValid) => {
      if (!isValid) {
        console.log('\n📝 Ejecuta primero: node scripts/setup-storage.js');
        process.exit(1);
      }
      
      return uploadAllEditedImages();
    })
    .then(() => {
      console.log('\n🎉 Proceso completado!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error:', error);
      process.exit(1);
    });
}

module.exports = { uploadAllEditedImages, updateProductImages };
