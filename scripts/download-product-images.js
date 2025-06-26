/**
 * Script para descargar todas las imágenes de productos para edición en Photoshop
 * Pinteya E-commerce - Descarga masiva de imágenes
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
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

// Configuración de descarga
const DOWNLOAD_DIR = path.join(__dirname, '..', 'downloaded-images');
const ORGANIZED_DIR = path.join(DOWNLOAD_DIR, 'organized');

// Crear directorios si no existen
function createDirectories() {
  if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(ORGANIZED_DIR)) {
    fs.mkdirSync(ORGANIZED_DIR, { recursive: true });
  }

  // Crear subdirectorios por marca
  const brands = ['plavicon', 'petrilac', 'poxipol', 'sinteplast', 'galgo', 'genericos'];
  brands.forEach(brand => {
    const brandDir = path.join(ORGANIZED_DIR, brand);
    if (!fs.existsSync(brandDir)) {
      fs.mkdirSync(brandDir, { recursive: true });
    }
  });
}

// Función para descargar una imagen
function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(filepath);
        });
        
        fileStream.on('error', (error) => {
          fs.unlink(filepath, () => {}); // Eliminar archivo parcial
          reject(error);
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Manejar redirecciones
        const redirectUrl = response.headers.location;
        downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
      } else {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
      }
    });
    
    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.abort();
      reject(new Error('Timeout de descarga'));
    });
  });
}

// Función para obtener la extensión de archivo desde URL
function getFileExtension(url) {
  const urlPath = new URL(url).pathname;
  const ext = path.extname(urlPath).toLowerCase();
  
  // Si no hay extensión o es desconocida, usar .jpg por defecto
  if (!ext || !['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext)) {
    return '.jpg';
  }
  
  return ext;
}

// Función para determinar la marca desde el slug
function getBrandFromSlug(slug) {
  if (slug.includes('plavicon')) return 'plavicon';
  if (slug.includes('petrilac')) return 'petrilac';
  if (slug.includes('poxipol')) return 'poxipol';
  if (slug.includes('sinteplast')) return 'sinteplast';
  if (slug.includes('galgo')) return 'galgo';
  return 'genericos';
}

// Función para limpiar nombre de archivo
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-z0-9\-_.]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

// Función principal para descargar todas las imágenes
async function downloadAllProductImages() {
  console.log('🚀 Iniciando descarga de imágenes de productos...\n');
  
  createDirectories();
  
  try {
    // Obtener todos los productos con imágenes
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, images')
      .not('images', 'is', null);

    if (error) {
      throw new Error(`Error obteniendo productos: ${error.message}`);
    }

    console.log(`📦 Encontrados ${products.length} productos con imágenes\n`);

    let successCount = 0;
    let errorCount = 0;
    const downloadLog = [];

    for (const product of products) {
      console.log(`📥 Procesando: ${product.name}`);
      
      const brand = getBrandFromSlug(product.slug);
      const productDir = path.join(ORGANIZED_DIR, brand);
      
      try {
        const images = product.images;
        const mainImageUrl = images.main;
        
        if (mainImageUrl && mainImageUrl.startsWith('http')) {
          const extension = getFileExtension(mainImageUrl);
          const sanitizedName = sanitizeFilename(product.slug);
          const filename = `${sanitizedName}${extension}`;
          const filepath = path.join(productDir, filename);
          
          // Verificar si ya existe
          if (fs.existsSync(filepath)) {
            console.log(`   ⏭️  Ya existe: ${filename}`);
            downloadLog.push({
              product: product.name,
              slug: product.slug,
              brand: brand,
              status: 'exists',
              filename: filename,
              url: mainImageUrl
            });
            successCount++;
            continue;
          }
          
          await downloadImage(mainImageUrl, filepath);
          console.log(`   ✅ Descargado: ${filename}`);
          
          downloadLog.push({
            product: product.name,
            slug: product.slug,
            brand: brand,
            status: 'downloaded',
            filename: filename,
            url: mainImageUrl
          });
          
          successCount++;
          
          // Pausa entre descargas para ser respetuosos
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } else {
          console.log(`   ⚠️  URL inválida: ${mainImageUrl}`);
          downloadLog.push({
            product: product.name,
            slug: product.slug,
            brand: brand,
            status: 'invalid_url',
            filename: null,
            url: mainImageUrl
          });
          errorCount++;
        }
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        downloadLog.push({
          product: product.name,
          slug: product.slug,
          brand: getBrandFromSlug(product.slug),
          status: 'error',
          filename: null,
          url: product.images?.main || 'N/A',
          error: error.message
        });
        errorCount++;
      }
    }

    // Guardar log de descarga
    const logPath = path.join(DOWNLOAD_DIR, 'download-log.json');
    fs.writeFileSync(logPath, JSON.stringify(downloadLog, null, 2));

    // Crear resumen por marca
    const brandSummary = {};
    downloadLog.forEach(item => {
      if (!brandSummary[item.brand]) {
        brandSummary[item.brand] = { total: 0, downloaded: 0, exists: 0, errors: 0 };
      }
      brandSummary[item.brand].total++;
      if (item.status === 'downloaded') brandSummary[item.brand].downloaded++;
      if (item.status === 'exists') brandSummary[item.brand].exists++;
      if (item.status === 'error' || item.status === 'invalid_url') brandSummary[item.brand].errors++;
    });

    console.log('\n📊 Resumen de descarga:');
    console.log(`✅ Imágenes procesadas exitosamente: ${successCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📦 Total procesado: ${successCount + errorCount}`);
    
    console.log('\n📁 Resumen por marca:');
    Object.entries(brandSummary).forEach(([brand, stats]) => {
      console.log(`   ${brand.toUpperCase()}: ${stats.total} total (${stats.downloaded} nuevas, ${stats.exists} existentes, ${stats.errors} errores)`);
    });

    console.log(`\n📄 Log detallado guardado en: ${logPath}`);
    console.log(`📂 Imágenes organizadas en: ${ORGANIZED_DIR}`);

  } catch (error) {
    console.error('\n💥 Error en la descarga:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  downloadAllProductImages()
    .then(() => {
      console.log('\n🎉 Descarga completada!');
      console.log('\n📝 Próximos pasos:');
      console.log('1. Revisar las imágenes en /downloaded-images/organized/');
      console.log('2. Editar en Photoshop según estándares definidos');
      console.log('3. Ejecutar script de subida a Supabase Storage');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en la descarga:', error);
      process.exit(1);
    });
}

module.exports = { downloadAllProductImages };
