#!/usr/bin/env node
// Script para corregir TODAS las referencias al placeholder incorrecto

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPlaceholderReferences() {
  try {
    console.log('🔍 Buscando productos con referencias al placeholder incorrecto...');
    
    // Buscar todos los productos y filtrar en JavaScript
    const { data: products, error } = await supabase
      .from('products')
      .select('id, slug, name, images');
    
    if (error) {
      console.error('❌ Error al consultar productos:', error);
      return;
    }
    
    if (!products || products.length === 0) {
      console.log('✅ No se encontraron productos');
      return;
    }

    console.log(`📦 Revisando ${products.length} productos...`);

    // Filtrar productos que contengan referencias incorrectas
    const productsToFix = products.filter(product => {
      const imagesStr = typeof product.images === 'string' ? product.images : JSON.stringify(product.images);
      return imagesStr.includes('placeholder-bg.jpg') || imagesStr.includes('placeholder-sm.jpg');
    });

    if (productsToFix.length === 0) {
      console.log('✅ No se encontraron productos con referencias al placeholder incorrecto');
      return;
    }

    console.log(`🔧 Encontrados ${productsToFix.length} productos con referencias incorrectas`);
    
    for (const product of productsToFix) {
      console.log(`\n🔧 Corrigiendo producto: ${product.name} (${product.slug})`);
      
      let images = product.images;
      let needsUpdate = false;
      
      // Si images es string, parsearlo
      if (typeof images === 'string') {
        try {
          images = JSON.parse(images);
        } catch (e) {
          console.log(`⚠️ Error al parsear images para ${product.slug}`);
          continue;
        }
      }
      
      // Corregir previews
      if (images.previews) {
        images.previews = images.previews.map(url => {
          if (url.includes('placeholder-bg.jpg') || url.includes('placeholder-sm.jpg')) {
            needsUpdate = true;
            console.log(`  📝 Corrigiendo preview: ${url} -> /images/products/placeholder.svg`);
            return '/images/products/placeholder.svg';
          }
          return url;
        });
      }
      
      // Corregir thumbnails
      if (images.thumbnails) {
        images.thumbnails = images.thumbnails.map(url => {
          if (url.includes('placeholder-bg.jpg') || url.includes('placeholder-sm.jpg')) {
            needsUpdate = true;
            console.log(`  📝 Corrigiendo thumbnail: ${url} -> /images/products/placeholder.svg`);
            return '/images/products/placeholder.svg';
          }
          return url;
        });
      }
      
      // Corregir main si existe
      if (images.main && (images.main.includes('placeholder-bg.jpg') || images.main.includes('placeholder-sm.jpg'))) {
        needsUpdate = true;
        console.log(`  📝 Corrigiendo main: ${images.main} -> /images/products/placeholder.svg`);
        images.main = '/images/products/placeholder.svg';
      }
      
      if (needsUpdate) {
        // Actualizar en la base de datos
        const { error: updateError } = await supabase
          .from('products')
          .update({ images })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`❌ Error al actualizar ${product.slug}:`, updateError);
        } else {
          console.log(`✅ Producto ${product.slug} actualizado correctamente`);
        }
      } else {
        console.log(`ℹ️ Producto ${product.slug} no necesita actualización`);
      }
    }
    
    console.log('\n🎉 Corrección de referencias completada!');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
fixPlaceholderReferences();
