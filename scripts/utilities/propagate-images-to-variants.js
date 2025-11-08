// ===================================
// SCRIPT PARA PROPAGAR IMÁGENES A TODAS LAS VARIANTES
// ===================================

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function propagarImagenesProducto(producto) {
  try {
    console.log(`\n📦 ${producto.name} (ID: ${producto.id})`);
    
    // Obtener todas las variantes del producto
    const { data: variantes, error: variantesError } = await supabase
      .from('product_variants')
      .select('id, aikon_id, image_url, color_name, measure')
      .eq('product_id', producto.id)
      .order('id');
    
    if (variantesError) {
      console.error(`   ❌ Error: ${variantesError.message}`);
      return { success: false, error: variantesError.message };
    }
    
    console.log(`   Total variantes: ${variantes.length}`);
    
    // Encontrar la primera variante con imagen
    const varianteConImagen = variantes.find(v => v.image_url);
    
    if (!varianteConImagen) {
      console.log(`   ⚠️  Ninguna variante tiene imagen`);
      return { success: false, error: 'Sin imagen base' };
    }
    
    console.log(`   Imagen base: ${varianteConImagen.image_url.substring(0, 60)}...`);
    
    // Contar variantes sin imagen
    const variantesSinImagen = variantes.filter(v => !v.image_url);
    console.log(`   Variantes sin imagen: ${variantesSinImagen.length}`);
    
    if (variantesSinImagen.length === 0) {
      console.log(`   ✅ Todas las variantes ya tienen imagen`);
      return { success: true, actualizadas: 0 };
    }
    
    // Actualizar todas las variantes sin imagen
    const { error: updateError } = await supabase
      .from('product_variants')
      .update({ image_url: varianteConImagen.image_url })
      .eq('product_id', producto.id)
      .is('image_url', null);
    
    if (updateError) {
      console.error(`   ❌ Error actualizando: ${updateError.message}`);
      return { success: false, error: updateError.message };
    }
    
    console.log(`   ✅ ${variantesSinImagen.length} variantes actualizadas con imagen`);
    
    return { 
      success: true, 
      actualizadas: variantesSinImagen.length 
    };
  } catch (error) {
    console.error(`   ❌ Excepción: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Propagando imágenes a todas las variantes\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Obtener todos los productos nuevos
  const { data: productos, error } = await supabase
    .from('products')
    .select('id, name')
    .gte('id', 115)
    .order('id');

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`Productos a procesar: ${productos.length}\n`);

  let totalActualizadas = 0;
  let productosExitosos = 0;
  let productosConError = 0;

  for (const producto of productos) {
    const resultado = await propagarImagenesProducto(producto);
    
    if (resultado.success) {
      productosExitosos++;
      totalActualizadas += resultado.actualizadas || 0;
    } else {
      productosConError++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Productos procesados: ${productos.length}`);
  console.log(`✅ Exitosos: ${productosExitosos}`);
  console.log(`❌ Con errores: ${productosConError}`);
  console.log(`📷 Total variantes actualizadas: ${totalActualizadas}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Verificación final
  const { data: estadisticas } = await supabase
    .from('product_variants')
    .select('image_url', { count: 'exact', head: false })
    .gte('product_id', 115);

  const conImagen = estadisticas.filter(v => v.image_url).length;
  const sinImagen = estadisticas.filter(v => !v.image_url).length;

  console.log('📊 ESTADO FINAL DE VARIANTES NUEVAS:');
  console.log(`   Con imagen: ${conImagen}/${estadisticas.length}`);
  console.log(`   Sin imagen: ${sinImagen}/${estadisticas.length}\n`);

  const success = sinImagen === 0;
  console.log(success ? '✅ Todas las variantes tienen imagen\n' : `⚠️  Aún hay ${sinImagen} variantes sin imagen\n`);

  return { success, totalActualizadas, sinImagen };
}

if (require.main === module) {
  main()
    .then(({ success }) => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { propagarImagenesProducto };

