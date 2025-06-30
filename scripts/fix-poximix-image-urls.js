const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://aakzspzfulgftqlgwkpb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3pzcHpmdWxnZnRxbGd3a3BiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMzNDExMiwiZXhwIjoyMDY0OTEwMTEyfQ.r-RFBL09kjQtMO3_RrHyh4sqOiaYrkT86knc_bP0c6g';

const supabase = createClient(supabaseUrl, supabaseKey);

// Mapeo de productos Poximix con sus URLs correctas
const poximixProducts = [
  {
    slug: 'poximix-exterior-05kg',
    correctImageName: 'poximix-exterior-05kg-poxipol.png'
  },
  {
    slug: 'poximix-exterior-125kg',
    correctImageName: 'poximix-exterior-125kg-poxipol.png'
  },
  {
    slug: 'poximix-exterior-3kg',
    correctImageName: 'poximix-exterior-3kg-poxipol.png'
  },
  {
    slug: 'poximix-exterior-5kg',
    correctImageName: 'poximix-exterior-5kg-poxipol.png'
  },
  {
    slug: 'poximix-interior-05kg',
    correctImageName: 'poximix-interior-05kg-poxipol.png'
  },
  {
    slug: 'poximix-interior-125kg',
    correctImageName: 'poximix-interior-125kg-poxipol.png'
  },
  {
    slug: 'poximix-interior-3kg',
    correctImageName: 'poximix-interior-3kg-poxipol.png'
  },
  {
    slug: 'poximix-interior-5kg',
    correctImageName: 'poximix-interior-5kg-poxipol.png'
  }
];

async function fixPoximixImageUrls() {
  console.log('🔧 Iniciando corrección de URLs de imágenes Poximix...');
  
  let successCount = 0;
  let errorCount = 0;

  for (const product of poximixProducts) {
    try {
      // Construir la URL correcta
      const correctUrl = `https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/${product.correctImageName}`;
      
      // Crear el objeto de imágenes con todas las propiedades necesarias
      const imageData = {
        main: correctUrl,
        gallery: [correctUrl],
        thumbnail: correctUrl,
        previews: [correctUrl],
        thumbnails: [correctUrl]
      };

      // Actualizar el producto en la base de datos
      const { data, error } = await supabase
        .from('products')
        .update({ 
          images: imageData,
          updated_at: new Date().toISOString()
        })
        .eq('slug', product.slug);

      if (error) {
        console.error(`❌ Error actualizando ${product.slug}:`, error.message);
        errorCount++;
        continue;
      }

      console.log(`✅ Actualizado: ${product.slug} -> ${product.correctImageName}`);
      successCount++;

      // Pequeña pausa entre actualizaciones
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Error en ${product.slug}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Resumen de la corrección:');
  console.log(`✅ Productos actualizados exitosamente: ${successCount}`);
  console.log(`❌ Productos con errores: ${errorCount}`);
  console.log(`📦 Total de productos procesados: ${poximixProducts.length}`);

  if (successCount > 0) {
    console.log('\n🎉 ¡Corrección completada! Las imágenes de productos Poximix ahora deberían mostrarse correctamente.');
  }
}

// Ejecutar el script
fixPoximixImageUrls().catch(console.error);
