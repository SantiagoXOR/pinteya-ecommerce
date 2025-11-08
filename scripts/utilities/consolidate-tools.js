// ===================================
// SCRIPT PARA CONSOLIDAR HERRAMIENTAS (RODILLOS, PINCELETAS, CINTAS)
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

// Grupos de herramientas a consolidar
const gruposHerramientas = [
  // Rodillo Gold Flock
  {
    nombreBase: 'Rodillo Gold Flock',
    slug: 'rodillo-gold-flock',
    productos: [
      { id: 235, nombre: 'Rodillo Gold Flock N7', aikon: '2755', medida: 'N7' },
      { id: 236, nombre: 'Rodillo Gold Flock N11', aikon: '2379', medida: 'N11' },
      { id: 237, nombre: 'Rodillo Gold Flock N16', aikon: '4315', medida: 'N16' }
    ]
  },
  // Rodillo Mini Epoxi
  {
    nombreBase: 'Rodillo Mini Epoxi',
    slug: 'rodillo-mini-epoxi',
    productos: [
      { id: 238, nombre: 'Rodillo Mini Epoxi N5', aikon: '201', medida: 'N5' },
      { id: 239, nombre: 'Rodillo Mini Epoxi N8', aikon: '200', medida: 'N8' },
      { id: 240, nombre: 'Rodillo Mini Epoxi N11', aikon: '2090', medida: 'N11' }
    ]
  },
  // Pinceleta Black
  {
    nombreBase: 'Pinceleta Black',
    slug: 'pinceleta-black',
    productos: [
      { id: 243, nombre: 'Pinceleta Black N42', aikon: '529', medida: 'N42' },
      { id: 244, nombre: 'Pinceleta Black N50', aikon: '530', medida: 'N50' }
    ]
  },
  // Cinta Enmascarar Azul Pintor
  {
    nombreBase: 'Cinta Enmascarar Azul Pintor',
    slug: 'cinta-enmascarar-azul-pintor',
    productos: [
      { id: 245, nombre: 'Cinta Enmascarar Azul 18MM Pintor', aikon: '4526', medida: '18MM' },
      { id: 246, nombre: 'Cinta Enmascarar Azul 24MM Pintor', aikon: '4527', medida: '24MM' },
      { id: 247, nombre: 'Cinta Enmascarar Azul 36MM Pintor', aikon: '4528', medida: '36MM' },
      { id: 248, nombre: 'Cinta Enmascarar Azul 48MM Pintor', aikon: '4529', medida: '48MM' }
    ]
  }
];

async function consolidarGrupoHerramientas(grupo) {
  console.log(`\n🔧 Consolidando: ${grupo.nombreBase}`);
  console.log(`   Productos a consolidar: ${grupo.productos.length}`);
  
  try {
    const maestro = grupo.productos[0];
    const secundarios = grupo.productos.slice(1);
    
    console.log(`   Maestro: ID ${maestro.id}`);
    console.log(`   Secundarios: ${secundarios.map(p => p.id).join(', ')}\n`);
    
    // 1. Migrar variantes de productos secundarios al maestro
    for (const secundario of secundarios) {
      console.log(`   Migrando ID ${secundario.id}...`);
      
      // Desactivar default primero
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
        console.error(`   ❌ Error migrando: ${migrateError.message}`);
        return { success: false, error: migrateError.message };
      }
      
      console.log(`   ✅ Variante migrada`);
    }
    
    // 2. Actualizar nombre y slug del maestro
    console.log(`\n   Actualizando maestro...`);
    const { error: updateError } = await supabase
      .from('products')
      .update({ 
        name: grupo.nombreBase,
        slug: grupo.slug
      })
      .eq('id', maestro.id);
    
    if (updateError) {
      console.error(`   ❌ Error actualizando nombre: ${updateError.message}`);
      return { success: false, error: updateError.message };
    }
    
    console.log(`   ✅ Nombre actualizado: "${grupo.nombreBase}"`);
    
    // 3. Eliminar productos secundarios
    console.log(`\n   Eliminando productos secundarios...`);
    for (const secundario of secundarios) {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', secundario.id);
      
      if (deleteError) {
        console.error(`   ❌ Error eliminando ID ${secundario.id}: ${deleteError.message}`);
      } else {
        console.log(`   ✅ Producto ID ${secundario.id} eliminado`);
      }
    }
    
    console.log(`\n✅ Grupo consolidado: ${grupo.nombreBase}`);
    return { 
      success: true, 
      maestroId: maestro.id,
      variantes: grupo.productos.length,
      eliminados: secundarios.length
    };
  } catch (error) {
    console.error(`   ❌ Excepción: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Consolidando herramientas en variantes\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const resultados = {
    exitosos: [],
    errores: []
  };
  
  for (const grupo of gruposHerramientas) {
    const resultado = await consolidarGrupoHerramientas(grupo);
    
    if (resultado.success) {
      resultados.exitosos.push({ ...grupo, ...resultado });
    } else {
      resultados.errores.push({ ...grupo, error: resultado.error });
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Grupos consolidados: ${resultados.exitosos.length}/${gruposHerramientas.length}`);
  console.log(`Total variantes consolidadas: ${resultados.exitosos.reduce((sum, r) => sum + r.variantes, 0)}`);
  console.log(`Total productos eliminados: ${resultados.exitosos.reduce((sum, r) => sum + r.eliminados, 0)}`);
  
  if (resultados.errores.length > 0) {
    console.log(`\n❌ Grupos con errores: ${resultados.errores.length}`);
    resultados.errores.forEach(e => {
      console.log(`   - ${e.nombreBase}: ${e.error}`);
    });
  }
  
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const success = resultados.errores.length === 0;
  console.log(success ? '✅ Consolidación de herramientas completada\n' : '⚠️  Consolidación con errores\n');
  
  return { success, resultados };
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

module.exports = { consolidarGrupoHerramientas };

