// ===================================
// SCRIPT PARA LIMPIEZA FINAL
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

// PASO 1: Eliminar pinceleta duplicada (Genérico)
async function eliminarPinceletaDuplicada() {
  console.log('\n🗑️  PASO 1: Eliminando pinceleta duplicada...\n');
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', 69);
  
  if (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
  
  console.log('✅ Pinceleta para Obra V2 N40 (Genérico, ID 69) eliminada\n');
  return { success: true };
}

// PASO 2: Eliminar color INCOLORO de rodillos y pinceletas
async function eliminarColorIncoloro() {
  console.log('🎨 PASO 2: Eliminando color INCOLORO de herramientas...\n');
  
  // Buscar variantes de rodillos y pinceletas con color INCOLORO
  const { data: variantes, error: selectError } = await supabase
    .from('product_variants')
    .select('id, product_id, aikon_id, color_name')
    .eq('color_name', 'INCOLORO');
  
  if (selectError) {
    console.error(`❌ Error buscando variantes: ${selectError.message}`);
    return { success: false, error: selectError.message };
  }
  
  console.log(`Variantes encontradas con INCOLORO: ${variantes?.length || 0}\n`);
  
  if (!variantes || variantes.length === 0) {
    console.log('✅ No hay variantes con color INCOLORO\n');
    return { success: true, actualizadas: 0 };
  }
  
  // Actualizar color_name a NULL para estas variantes
  const { error: updateError } = await supabase
    .from('product_variants')
    .update({ color_name: null })
    .eq('color_name', 'INCOLORO');
  
  if (updateError) {
    console.error(`❌ Error actualizando: ${updateError.message}`);
    return { success: false, error: updateError.message };
  }
  
  console.log(`✅ ${variantes.length} variantes actualizadas (INCOLORO → NULL)\n`);
  
  // Mostrar qué productos fueron afectados
  const productosAfectados = [...new Set(variantes.map(v => v.product_id))];
  console.log(`Productos afectados: ${productosAfectados.length}`);
  
  for (const productId of productosAfectados) {
    const { data: producto } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .single();
    
    if (producto) {
      console.log(`   - ${producto.name} (ID: ${productId})`);
    }
  }
  console.log('');
  
  return { success: true, actualizadas: variantes.length };
}

// Función principal
async function main() {
  console.log('🚀 Iniciando limpieza final de datos\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    const resultadoDuplicado = await eliminarPinceletaDuplicada();
    const resultadoIncoloro = await eliminarColorIncoloro();
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN FINAL');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`1. Pinceleta duplicada eliminada: ${resultadoDuplicado.success ? 'Sí ✅' : 'No ❌'}`);
    console.log(`2. Color INCOLORO eliminado: ${resultadoIncoloro.actualizadas || 0} variantes`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const success = resultadoDuplicado.success && resultadoIncoloro.success;
    console.log(success ? '✅ Limpieza final completada exitosamente\n' : '⚠️  Limpieza con errores\n');
    
    return { success };
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    return { success: false };
  }
}

if (require.main === module) {
  main()
    .then(({ success }) => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { main };

