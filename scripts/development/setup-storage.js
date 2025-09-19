/**
 * Script para configurar Supabase Storage para imágenes de productos
 * Pinteya E-commerce - Configuración de almacenamiento
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

// Configuración del bucket
const BUCKET_CONFIG = {
  id: 'product-images',
  name: 'product-images',
  public: true,
  fileSizeLimit: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
};

// Función para crear el bucket
async function createBucket() {
  try {
    console.log('🗄️ Creando bucket de Storage...');
    
    const { data, error } = await supabase.storage.createBucket(BUCKET_CONFIG.id, {
      public: BUCKET_CONFIG.public,
      fileSizeLimit: BUCKET_CONFIG.fileSizeLimit,
      allowedMimeTypes: BUCKET_CONFIG.allowedMimeTypes
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket ya existe, continuando...');
        return true;
      }
      throw error;
    }

    console.log('✅ Bucket creado exitosamente:', data);
    return true;
  } catch (error) {
    console.error('❌ Error creando bucket:', error.message);
    return false;
  }
}

// Función para verificar bucket existente
async function checkBucket() {
  try {
    console.log('🔍 Verificando bucket existente...');
    
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }

    const existingBucket = data.find(bucket => bucket.id === BUCKET_CONFIG.id);
    
    if (existingBucket) {
      console.log('✅ Bucket encontrado:', existingBucket);
      return true;
    } else {
      console.log('⚠️ Bucket no encontrado, será creado...');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verificando bucket:', error.message);
    return false;
  }
}

// Función para configurar políticas de acceso
async function setupPolicies() {
  try {
    console.log('🔐 Configurando políticas de acceso...');
    
    // Política para lectura pública
    const readPolicy = {
      name: 'Public read access for product images',
      definition: `
        CREATE POLICY "Public read access for product images" ON storage.objects
        FOR SELECT USING (bucket_id = 'product-images');
      `
    };

    // Política para escritura autenticada
    const writePolicy = {
      name: 'Authenticated write access for product images',
      definition: `
        CREATE POLICY "Authenticated write access for product images" ON storage.objects
        FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
      `
    };

    console.log('📝 Políticas configuradas (aplicar manualmente en Supabase Dashboard):');
    console.log('1. Lectura pública:', readPolicy.name);
    console.log('2. Escritura autenticada:', writePolicy.name);
    
    return true;
  } catch (error) {
    console.error('❌ Error configurando políticas:', error.message);
    return false;
  }
}

// Función para crear estructura de carpetas
async function createFolderStructure() {
  try {
    console.log('📁 Creando estructura de carpetas...');
    
    const folders = [
      'plavicon',
      'petrilac', 
      'poxipol',
      'sinteplast',
      'galgo',
      'genericos'
    ];

    for (const folder of folders) {
      // Crear archivo placeholder para crear la carpeta
      const placeholderPath = `${folder}/.placeholder`;
      const placeholderContent = new Blob([''], { type: 'text/plain' });
      
      const { data, error } = await supabase.storage
        .from(BUCKET_CONFIG.id)
        .upload(placeholderPath, placeholderContent);

      if (error && !error.message.includes('already exists')) {
        console.log(`⚠️ Error creando carpeta ${folder}:`, error.message);
      } else {
        console.log(`✅ Carpeta creada: ${folder}/`);
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Error creando estructura de carpetas:', error.message);
    return false;
  }
}

// Función para generar URLs de ejemplo
function generateExampleUrls() {
  const baseUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_CONFIG.id}`;
  
  console.log('\n📋 URLs de ejemplo para imágenes:');
  console.log(`Base URL: ${baseUrl}`);
  console.log('\nEjemplos:');
  console.log(`- ${baseUrl}/plavicon/plavipint-techos-poliuretanico-20l-plavicon.webp`);
  console.log(`- ${baseUrl}/petrilac/barniz-campbell-1l-petrilac.webp`);
  console.log(`- ${baseUrl}/poxipol/poximix-interior-5kg-poxipol.webp`);
  
  return baseUrl;
}

// Función principal
async function setupStorage() {
  console.log('🚀 Configurando Supabase Storage para Pinteya E-commerce...\n');

  try {
    // 1. Verificar bucket existente
    const bucketExists = await checkBucket();
    
    // 2. Crear bucket si no existe
    if (!bucketExists) {
      const bucketCreated = await createBucket();
      if (!bucketCreated) {
        throw new Error('No se pudo crear el bucket');
      }
    }

    // 3. Configurar políticas
    await setupPolicies();

    // 4. Crear estructura de carpetas
    await createFolderStructure();

    // 5. Generar URLs de ejemplo
    const baseUrl = generateExampleUrls();

    console.log('\n✅ Configuración de Storage completada!');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Verificar políticas en Supabase Dashboard');
    console.log('2. Ejecutar script de descarga de imágenes');
    console.log('3. Editar imágenes en Photoshop');
    console.log('4. Ejecutar script de subida de imágenes editadas');

    return {
      success: true,
      bucketId: BUCKET_CONFIG.id,
      baseUrl: baseUrl
    };

  } catch (error) {
    console.error('\n💥 Error en la configuración:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  setupStorage()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 Setup completado exitosamente!');
        process.exit(0);
      } else {
        console.error('\n💥 Setup falló:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Error en setup:', error);
      process.exit(1);
    });
}

module.exports = { setupStorage, BUCKET_CONFIG };
