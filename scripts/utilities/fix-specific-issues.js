// ===================================
// SCRIPT PARA CORREGIR DETALLES ESPECÍFICOS
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

// PASO 1: Cambiar marca MAS COLOR a +COLOR
async function corregirMarca() {
  console.log('\n🏷️  PASO 1: Corrigiendo marca "MAS COLOR" → "+COLOR"...\n');
  
  const { data: productos, error } = await supabase
    .from('products')
    .select('id, name, brand')
    .eq('brand', 'MAS COLOR');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return { exitosos: 0, errores: 1 };
  }
  
  console.log(`Productos encontrados con marca "MAS COLOR": ${productos.length}\n`);
  
  const { error: updateError } = await supabase
    .from('products')
    .update({ brand: '+COLOR' })
    .eq('brand', 'MAS COLOR');
  
  if (updateError) {
    console.error(`❌ Error actualizando marca: ${updateError.message}`);
    return { exitosos: 0, errores: productos.length };
  }
  
  console.log(`✅ ${productos.length} productos actualizados con marca "+COLOR"\n`);
  return { exitosos: productos.length, errores: 0 };
}

// PASO 2: Consolidar Latex Premium Int Ext (4 medidas)
async function consolidarLatexIntExt() {
  console.log('🔄 PASO 2: Consolidando Latex Premium Int Ext...\n');
  
  // Buscar los 4 productos
  const { data: productos, error } = await supabase
    .from('products')
    .select('id, name')
    .ilike('name', 'Latex Premium Int Ext%Colores%')
    .order('id');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return { success: false };
  }
  
  console.log(`Productos encontrados: ${productos.length}`);
  productos.forEach(p => console.log(`  ID ${p.id}: ${p.name}`));
  
  if (productos.length !== 4) {
    console.log('\n⚠️  No se encontraron exactamente 4 productos para consolidar');
    return { success: false };
  }
  
  const maestro = productos[0];
  const secundarios = productos.slice(1);
  
  console.log(`\nMaestro: ID ${maestro.id} - ${maestro.name}`);
  console.log(`Secundarios: ${secundarios.map(p => p.id).join(', ')}\n`);
  
  // Migrar variantes
  let totalMigradas = 0;
  
  for (const secundario of secundarios) {
    // Desactivar defaults primero
    await supabase
      .from('product_variants')
      .update({ is_default: false })
      .eq('product_id', secundario.id);
    
    // Migrar variantes
    const { error: migrateError } = await supabase
      .from('product_variants')
      .update({ product_id: maestro.id })
      .eq('product_id', secundario.id);
    
    if (migrateError) {
      console.error(`  ❌ Error migrando ID ${secundario.id}: ${migrateError.message}`);
    } else {
      console.log(`  ✅ Variantes migradas de ID ${secundario.id}`);
      totalMigradas++;
    }
  }
  
  // Actualizar nombre del maestro
  const { error: updateNameError } = await supabase
    .from('products')
    .update({ 
      name: 'Latex Premium Int Ext Colores',
      slug: 'latex-premium-int-ext-colores'
    })
    .eq('id', maestro.id);
  
  if (updateNameError) {
    console.error(`  ❌ Error actualizando nombre: ${updateNameError.message}`);
  } else {
    console.log(`  ✅ Nombre actualizado`);
  }
  
  // Eliminar productos secundarios
  for (const secundario of secundarios) {
    const { error: deleteError } = await supabase
      .from('products')
      .delete()
      .eq('id', secundario.id);
    
    if (deleteError) {
      console.error(`  ❌ Error eliminando ID ${secundario.id}: ${deleteError.message}`);
    } else {
      console.log(`  ✅ Producto ID ${secundario.id} eliminado`);
    }
  }
  
  console.log(`\n✅ Consolidación completada: ${totalMigradas}/${secundarios.length} productos\n`);
  return { success: true, migrados: totalMigradas };
}

// PASO 3: Agregar color BLANCO a productos
async function agregarColorBlanco() {
  console.log('🎨 PASO 3: Agregando color BLANCO a productos...\n');
  
  // Productos que deben tener color BLANCO
  const productosBlanco = [
    { nombre: 'Latex Premium Lavable', id: 195 },
    { nombre: 'Latex Premium Interior', id: 199 },
    { nombre: 'Latex Premium Exterior', id: 203 },
    { nombre: 'Membrana Premium', id: 116 },
    { nombre: 'Latex Expression Interior', id: 223 },
    { nombre: 'Latex Expression Exterior', id: 227 },
    { nombre: 'Cielorraso', id: 123 }
  ];
  
  let actualizados = 0;
  
  for (const producto of productosBlanco) {
    console.log(`Actualizando: ${producto.nombre} (ID: ${producto.id})`);
    
    const { error } = await supabase
      .from('product_variants')
      .update({ color_name: 'BLANCO' })
      .eq('product_id', producto.id)
      .is('color_name', null);
    
    if (error) {
      console.error(`  ❌ Error: ${error.message}`);
    } else {
      console.log(`  ✅ Color BLANCO agregado a todas las variantes\n`);
      actualizados++;
    }
  }
  
  console.log(`✅ ${actualizados}/${productosBlanco.length} productos actualizados con color BLANCO\n`);
  return { actualizados, total: productosBlanco.length };
}

// Función principal
async function main() {
  console.log('🚀 Iniciando correcciones específicas\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  try {
    const resultadoMarca = await corregirMarca();
    const resultadoConsolidacion = await consolidarLatexIntExt();
    const resultadoColor = await agregarColorBlanco();
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 RESUMEN FINAL');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`1. Marca corregida: ${resultadoMarca.exitosos} productos`);
    console.log(`2. Latex Int Ext consolidado: ${resultadoConsolidacion.success ? 'Sí ✅' : 'No ❌'}`);
    console.log(`3. Color BLANCO agregado: ${resultadoColor.actualizados}/${resultadoColor.total} productos`);
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    const success = 
      resultadoMarca.errores === 0 &&
      resultadoConsolidacion.success &&
      resultadoColor.actualizados === resultadoColor.total;
    
    console.log(success ? '✅ Todas las correcciones aplicadas exitosamente\n' : '⚠️  Algunas correcciones tuvieron problemas\n');
    
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

