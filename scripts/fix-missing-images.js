const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://aakzspzfulgftqlgwkpb.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3pzcHpmVWxnZnRxbGd3a3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTg4MzI4NzMsImV4cCI6MjAzNDQwODg3M30.Ej_2Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeo de correcciones de URLs
const urlCorrections = {
  // Recuplast Frentes - archivo no existe, usar placeholder
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-4l-sinteplast.jpg': 
    '/images/products/placeholder.svg',
  
  // Poximix Interior - usar archivo existente de 5kg
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-25kg-poxipol.png': 
    'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-5kg-poxipol.png',
  
  // Sellador Multiuso - usar placeholder
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/sellador-multiuso.png': 
    '/images/products/placeholder.svg'
};

async function fixImageUrls() {
  console.log('🔧 Iniciando corrección de URLs de imágenes...\n');

  try {
    // Obtener productos con URLs problemáticas
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, images')
      .or(`images.cs.["${Object.keys(urlCorrections).join('"], images.cs.["')}"]`);

    if (error) {
      console.error('❌ Error al obtener productos:', error);
      return;
    }

    console.log(`📦 Encontrados ${products.length} productos con URLs problemáticas:`);
    
    for (const product of products) {
      console.log(`\n🔍 Procesando: ${product.name} (ID: ${product.id})`);
      console.log(`   URLs actuales: ${JSON.stringify(product.images)}`);
      
      // Corregir URLs
      const correctedImages = product.images.map(url => {
        if (urlCorrections[url]) {
          console.log(`   ✅ Corrigiendo: ${url} → ${urlCorrections[url]}`);
          return urlCorrections[url];
        }
        return url;
      });

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from('products')
        .update({ images: correctedImages })
        .eq('id', product.id);

      if (updateError) {
        console.error(`   ❌ Error al actualizar producto ${product.id}:`, updateError);
      } else {
        console.log(`   ✅ Producto ${product.id} actualizado correctamente`);
      }
    }

    console.log('\n🎉 Corrección de URLs completada!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar corrección
fixImageUrls();