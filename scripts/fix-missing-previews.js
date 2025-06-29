#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - CORRECCIÓN DE PREVIEWS FALTANTES
 * =====================================================
 * 
 * Script para corregir productos que tienen imagen 'main' pero no tienen
 * el array 'previews' poblado, causando que se muestren placeholders
 */

const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Función principal para corregir previews faltantes
 */
async function fixMissingPreviews() {
  console.log('🔧 CORRIGIENDO PREVIEWS FALTANTES');
  console.log('=================================\n');
  
  try {
    // Obtener todos los productos
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, slug, images')
      .order('id');
      
    if (error) {
      throw new Error(`Error obteniendo productos: ${error.message}`);
    }
    
    console.log(`📦 Encontrados ${products.length} productos\n`);
    
    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      const images = product.images;
      
      // Verificar si necesita corrección
      if (!images) {
        console.log(`⏭️ ${product.id}. ${product.name} - Sin imágenes configuradas`);
        skippedCount++;
        continue;
      }
      
      // Verificar si tiene main pero no previews
      const hasMain = images.main;
      const hasPreviews = images.previews && images.previews.length > 0;
      const hasGallery = images.gallery && images.gallery.length > 0;
      
      if (hasMain && !hasPreviews) {
        console.log(`🔧 ${product.id}. ${product.name}`);
        console.log(`   📸 Main: ${images.main}`);
        console.log(`   ❌ Previews: ${images.previews?.length || 0} (necesita corrección)`);
        
        // Crear nueva estructura con previews poblado
        const updatedImages = {
          ...images,
          previews: [images.main], // Usar la imagen main como preview
          thumbnails: images.thumbnails?.length > 0 ? images.thumbnails : [images.main]
        };
        
        // Si tiene gallery pero no previews, usar la primera imagen de gallery
        if (hasGallery && !hasPreviews) {
          updatedImages.previews = [images.gallery[0]];
          if (!updatedImages.thumbnails || updatedImages.thumbnails.length === 0) {
            updatedImages.thumbnails = [images.gallery[0]];
          }
        }
        
        try {
          // Actualizar en la base de datos
          const { error: updateError } = await supabase
            .from('products')
            .update({ images: updatedImages })
            .eq('id', product.id);
            
          if (updateError) {
            console.log(`   ❌ Error actualizando: ${updateError.message}`);
            errorCount++;
          } else {
            console.log(`   ✅ Corregido - Previews: ${updatedImages.previews.length}`);
            fixedCount++;
          }
        } catch (error) {
          console.log(`   ❌ Error: ${error.message}`);
          errorCount++;
        }
        
      } else if (hasPreviews) {
        console.log(`✅ ${product.id}. ${product.name} - Ya tiene previews configurados`);
        skippedCount++;
      } else {
        console.log(`⚠️ ${product.id}. ${product.name} - Sin imagen main ni previews`);
        skippedCount++;
      }
      
      // Pequeña pausa entre actualizaciones
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 RESUMEN DE CORRECCIONES');
    console.log('==========================');
    console.log(`✅ Productos corregidos: ${fixedCount}`);
    console.log(`⏭️ Productos omitidos: ${skippedCount}`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log(`📦 Total procesados: ${products.length}`);
    
    if (fixedCount > 0) {
      console.log('\n🎉 ¡Corrección completada! Los productos ahora deberían mostrar sus imágenes correctamente.');
      console.log('💡 Recomendación: Limpiar caché del navegador para ver los cambios.');
    }
    
  } catch (error) {
    console.error('❌ Error durante la corrección:', error.message);
    process.exit(1);
  }
}

// Ejecutar corrección
fixMissingPreviews().catch(console.error);
