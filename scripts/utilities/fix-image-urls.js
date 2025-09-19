const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapeo de productos afectados y sus nuevas rutas
const imageUpdates = {
  // Lijas El Galgo - van a carpeta galgo/
  'lija-al-agua-grano-40-el-galgo': {
    oldPath: 'lija-al-agua-40.png',
    newPath: 'galgo/lija-al-agua-40.png'
  },
  'lija-al-agua-grano-50-el-galgo': {
    oldPath: 'lija-al-agua-50.png',
    newPath: 'galgo/lija-al-agua-50.png'
  },
  'lija-al-agua-grano-80-el-galgo': {
    oldPath: 'lija-al-agua-80.png',
    newPath: 'galgo/lija-al-agua-80.png'
  },
  'lija-al-agua-grano-120-el-galgo': {
    oldPath: 'lija-al-agua-120.png',
    newPath: 'galgo/lija-al-agua-120.png'
  },
  'lija-al-agua-grano-180-el-galgo': {
    oldPath: 'lija-al-agua-180.png',
    newPath: 'galgo/lija-al-agua-180.png'
  },
  
  // Accesorios genéricos - van a carpeta genericos/
  'bandeja-chata-para-pintura': {
    oldPath: 'bandeja-chata.png',
    newPath: 'genericos/bandeja-chata.png'
  },
  'pinceleta-para-obra': {
    oldPath: 'pinceleta-obra.png',
    newPath: 'genericos/pinceleta-obra.png'
  }
};

async function checkCurrentUrls() {
  console.log('🔍 Verificando URLs actuales en la base de datos...\n');
  
  for (const [slug, paths] of Object.entries(imageUpdates)) {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('slug, name, images')
        .eq('slug', slug)
        .single();
        
      if (error) {
        console.log(`⚠️  Producto ${slug} no encontrado`);
        continue;
      }
      
      console.log(`📦 ${product.name} (${slug})`);
      console.log(`   Imágenes actuales:`, JSON.stringify(product.images, null, 2));
      console.log(`   Ruta esperada: ${paths.newPath}\n`);
      
    } catch (error) {
      console.error(`❌ Error consultando ${slug}:`, error.message);
    }
  }
}

async function updateImageUrls() {
  console.log('🔧 Actualizando URLs de imágenes...\n');
  
  const baseUrl = 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images';
  
  for (const [slug, paths] of Object.entries(imageUpdates)) {
    try {
      // Construir nueva URL completa
      const newImageUrl = `${baseUrl}/${paths.newPath}`;
      
      // Estructura de imágenes actualizada
      const updatedImages = {
        thumbnails: [newImageUrl],
        previews: [newImageUrl],
        main: newImageUrl,
        gallery: [newImageUrl]
      };
      
      // Actualizar en la base de datos
      const { data, error } = await supabase
        .from('products')
        .update({ images: updatedImages })
        .eq('slug', slug);
        
      if (error) {
        console.error(`❌ Error actualizando ${slug}:`, error.message);
        continue;
      }
      
      console.log(`✅ ${slug} actualizado`);
      console.log(`   Nueva URL: ${newImageUrl}`);
      
      // Verificar que la imagen sea accesible
      try {
        const response = await fetch(newImageUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log(`   ✅ Imagen accesible (${response.status})`);
        } else {
          console.log(`   ⚠️  Imagen no accesible (${response.status})`);
        }
      } catch (fetchError) {
        console.log(`   ❌ Error verificando accesibilidad: ${fetchError.message}`);
      }
      
      console.log('');
      
    } catch (error) {
      console.error(`❌ Error procesando ${slug}:`, error.message);
    }
  }
}

async function verifyUpdates() {
  console.log('🔍 Verificando actualizaciones...\n');
  
  for (const [slug, paths] of Object.entries(imageUpdates)) {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('slug, name, images')
        .eq('slug', slug)
        .single();
        
      if (error) {
        console.log(`⚠️  Producto ${slug} no encontrado`);
        continue;
      }
      
      const expectedPath = paths.newPath;
      const currentUrl = product.images?.previews?.[0] || product.images?.main;
      
      if (currentUrl && currentUrl.includes(expectedPath)) {
        console.log(`✅ ${product.name}: URL correcta`);
      } else {
        console.log(`❌ ${product.name}: URL incorrecta`);
        console.log(`   Actual: ${currentUrl}`);
        console.log(`   Esperada: debe contener ${expectedPath}`);
      }
      
    } catch (error) {
      console.error(`❌ Error verificando ${slug}:`, error.message);
    }
  }
}

async function main() {
  console.log('🚀 Iniciando corrección de URLs de imágenes...\n');
  
  // Paso 1: Verificar URLs actuales
  await checkCurrentUrls();
  
  console.log('═'.repeat(60));
  console.log('¿Continuar con la actualización? (Presiona Ctrl+C para cancelar)');
  console.log('═'.repeat(60));
  
  // Esperar 3 segundos antes de continuar
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Paso 2: Actualizar URLs
  await updateImageUrls();
  
  console.log('═'.repeat(60));
  
  // Paso 3: Verificar actualizaciones
  await verifyUpdates();
  
  console.log('\n🎉 Proceso completado!');
}

// Ejecutar el script
main().catch(console.error);
