const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://aakzspzfulgftqlgwkpb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3pzcHpmdWxnZnRxbGd3a3BiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzI1NzI5NCwiZXhwIjoyMDQ4ODMzMjk0fQ.cKHJlBJWUOHqKJOGQJhEKJOGQJhEKJOGQJhEKJOGQJhE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Productos POXIMIX con sus URLs corregidas
const poximixProducts = [
  {
    slug: 'poximix-interior-05kg-poxipol',
    imageUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-05kg-poxipol.png'
  },
  {
    slug: 'poximix-interior-125kg-poxipol',
    imageUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-125kg-poxipol.png'
  },
  {
    slug: 'poximix-interior-3kg-poxipol',
    imageUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-3kg-poxipol.png'
  },
  {
    slug: 'poximix-interior-5kg-poxipol',
    imageUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-5kg-poxipol.png'
  },
  {
    slug: 'poximix-exterior-05kg-poxipol',
    imageUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-exterior-05kg-poxipol.png'
  },
  {
    slug: 'poximix-exterior-125kg-poxipol',
    imageUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-exterior-125kg-poxipol.png'
  },
  {
    slug: 'poximix-exterior-3kg-poxipol',
    imageUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-exterior-3kg-poxipol.png'
  },
  {
    slug: 'poximix-exterior-5kg-poxipol',
    imageUrl: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-exterior-5kg-poxipol.png'
  }
];

async function updatePoximixImages() {
  console.log('🔧 Actualizando imágenes de productos POXIMIX...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const product of poximixProducts) {
    try {
      const imageData = {
        main: product.imageUrl,
        gallery: [product.imageUrl],
        thumbnail: product.imageUrl,
        previews: [product.imageUrl],
        thumbnails: [product.imageUrl]
      };

      const { data, error } = await supabase
        .from('products')
        .update({ images: imageData })
        .eq('slug', product.slug);

      if (error) {
        console.error(`❌ Error actualizando ${product.slug}:`, error.message);
        errorCount++;
        continue;
      }

      console.log(`✅ Actualizado: ${product.slug}`);
      successCount++;

      // Pequeña pausa entre actualizaciones
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Error en ${product.slug}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Resumen:');
  console.log(`✅ Productos actualizados: ${successCount}`);
  console.log(`❌ Errores: ${errorCount}`);
  console.log(`📦 Total procesados: ${successCount + errorCount}`);
}

// Ejecutar el script
updatePoximixImages().catch(console.error);