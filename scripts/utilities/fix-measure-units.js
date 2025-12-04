// ===================================
// SCRIPT PARA CORREGIR UNIDADES DE MEDIDA EN TÍTULOS
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

function corregirUnidades(nombre) {
  if (!nombre) return nombre;
  
  // Patrones a corregir: medidas en minúsculas al final del nombre
  return nombre
    .replace(/(\d+)l\b/gi, '$1L')      // 4l → 4L, 10l → 10L
    .replace(/(\d+)kg\b/gi, '$1KG')    // 10kg → 10KG, 20kg → 20KG
    .replace(/(\d+)cc\b/gi, '$1CC')    // 30cc → 30CC, 120cc → 120CC
    .replace(/(\d+)mm\b/gi, '$1MM')    // 18mm → 18MM, 24mm → 24MM
    .replace(/(\d+)cm\b/gi, '$1CM')    // 17cm → 17CM
    .replace(/(\d+)gr\b/gi, '$1GR');   // 350gr → 350GR
}

async function main() {
  console.log('🚀 Corrigiendo unidades de medida en títulos\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Obtener todos los productos que puedan tener unidades incorrectas
  const { data: productos, error } = await supabase
    .from('products')
    .select('id, name')
    .gte('id', 115);
  
  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
  
  console.log(`📊 Productos a revisar: ${productos.length}\n`);
  
  let actualizados = 0;
  let sinCambios = 0;
  
  for (const producto of productos) {
    const nombreCorregido = corregirUnidades(producto.name);
    
    if (nombreCorregido !== producto.name) {
      console.log(`📝 ${producto.name}`);
      console.log(`   → ${nombreCorregido}`);
      
      const { error: updateError } = await supabase
        .from('products')
        .update({ name: nombreCorregido })
        .eq('id', producto.id);
      
      if (updateError) {
        console.error(`   ❌ Error: ${updateError.message}\n`);
      } else {
        console.log(`   ✅ Actualizado\n`);
        actualizados++;
      }
    } else {
      sinCambios++;
    }
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total revisados: ${productos.length}`);
  console.log(`✅ Actualizados: ${actualizados}`);
  console.log(`⏭️  Sin cambios: ${sinCambios}`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('✅ Corrección de unidades completada\n');
}

if (require.main === module) {
  main()
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = { corregirUnidades };

