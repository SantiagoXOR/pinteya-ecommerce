// ===================================
// SCRIPT PARA CONSOLIDAR PRODUCTOS POR VARIANTES DE MEDIDA
// ===================================

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para identificar grupos de productos a consolidar
async function identificarGrupos() {
  console.log('🔍 PASO 1: Identificando grupos de productos a consolidar...\n');
  
  const { data: productos, error } = await supabase
    .from('products')
    .select('id, name, slug, brand')
    .gte('id', 115)
    .order('name');
  
  if (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
  
  // Agrupar productos por nombre base (sin la medida)
  const grupos = {};
  
  productos.forEach(producto => {
    // Remover medidas del nombre para encontrar el nombre base
    const nombreBase = producto.name
      .replace(/\s+(1L|4L|10L|20L|1KG|4KG|10KG|20KG|25KG|30CC|120CC)$/i, '')
      .trim();
    
    if (!grupos[nombreBase]) {
      grupos[nombreBase] = [];
    }
    
    grupos[nombreBase].push(producto);
  });
  
  // Filtrar solo grupos con más de 1 producto
  const gruposAConsolidar = Object.entries(grupos)
    .filter(([_, productos]) => productos.length > 1)
    .map(([nombreBase, productos]) => ({
      nombreBase,
      productos: productos.sort((a, b) => a.id - b.id), // Ordenar por ID
      maestro: productos.sort((a, b) => a.id - b.id)[0], // Primer producto es maestro
      secundarios: productos.sort((a, b) => a.id - b.id).slice(1)
    }));
  
  console.log(`✅ Encontrados ${gruposAConsolidar.length} grupos para consolidar\n`);
  
  gruposAConsolidar.forEach((grupo, idx) => {
    console.log(`${idx + 1}. ${grupo.nombreBase}`);
    console.log(`   Productos: ${grupo.productos.length}`);
    console.log(`   Maestro: ID ${grupo.maestro.id} - ${grupo.maestro.name}`);
    console.log(`   Secundarios: ${grupo.secundarios.map(p => `ID ${p.id}`).join(', ')}\n`);
  });
  
  return gruposAConsolidar;
}

// Función para consolidar un grupo
async function consolidarGrupo(grupo) {
  console.log(`\n📦 Consolidando: ${grupo.nombreBase}`);
  console.log(`   Maestro: ID ${grupo.maestro.id}`);
  
  const variantesMigradas = [];
  const errores = [];
  
  try {
    // 1. Migrar variantes de productos secundarios al maestro
    for (const secundario of grupo.secundarios) {
      console.log(`   Migrando variantes de ID ${secundario.id}...`);
      
      // Obtener variantes del producto secundario
      const { data: variantes, error: errorVariantes } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', secundario.id);
      
      if (errorVariantes) {
        console.error(`   ❌ Error obteniendo variantes: ${errorVariantes.message}`);
        errores.push({ producto: secundario.id, error: errorVariantes.message });
        continue;
      }
      
      if (!variantes || variantes.length === 0) {
        console.log(`   ⚠️  No hay variantes para migrar`);
        continue;
      }
      
      console.log(`   Encontradas ${variantes.length} variantes`);
      
      // Primero, marcar todas las variantes como NO default
      const { error: unsetDefaultError } = await supabase
        .from('product_variants')
        .update({ is_default: false })
        .eq('product_id', secundario.id);
      
      if (unsetDefaultError) {
        console.error(`   ❌ Error desactivando defaults: ${unsetDefaultError.message}`);
        errores.push({ producto: secundario.id, error: unsetDefaultError.message });
        continue;
      }
      
      // Ahora migrar las variantes al maestro
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ product_id: grupo.maestro.id })
        .eq('product_id', secundario.id);
      
      if (updateError) {
        console.error(`   ❌ Error migrando variantes: ${updateError.message}`);
        errores.push({ producto: secundario.id, error: updateError.message });
      } else {
        console.log(`   ✅ ${variantes.length} variantes migradas`);
        variantesMigradas.push(...variantes);
      }
    }
    
    // 2. Actualizar nombre del producto maestro (remover medida)
    const nombreSinMedida = grupo.nombreBase;
    const slugSinMedida = nombreSinMedida
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    console.log(`   Actualizando nombre maestro: "${grupo.maestro.name}" → "${nombreSinMedida}"`);
    
    const { error: updateNombreError } = await supabase
      .from('products')
      .update({ 
        name: nombreSinMedida,
        slug: slugSinMedida
      })
      .eq('id', grupo.maestro.id);
    
    if (updateNombreError) {
      console.error(`   ❌ Error actualizando nombre: ${updateNombreError.message}`);
      errores.push({ producto: grupo.maestro.id, error: updateNombreError.message });
    } else {
      console.log(`   ✅ Nombre actualizado`);
    }
    
    // 3. Eliminar productos secundarios (ahora vacíos)
    console.log(`   Eliminando ${grupo.secundarios.length} productos secundarios...`);
    
    for (const secundario of grupo.secundarios) {
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', secundario.id);
      
      if (deleteError) {
        console.error(`   ❌ Error eliminando ID ${secundario.id}: ${deleteError.message}`);
        errores.push({ producto: secundario.id, error: deleteError.message });
      } else {
        console.log(`   ✅ Producto ID ${secundario.id} eliminado`);
      }
    }
    
    return {
      success: errores.length === 0,
      nombreBase: grupo.nombreBase,
      maestroId: grupo.maestro.id,
      variantesMigradas: variantesMigradas.length,
      productosEliminados: grupo.secundarios.length,
      errores
    };
  } catch (error) {
    console.error(`   ❌ Excepción: ${error.message}`);
    return {
      success: false,
      nombreBase: grupo.nombreBase,
      error: error.message
    };
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando consolidación de productos por variantes de medida\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Paso 1: Identificar grupos
  const grupos = await identificarGrupos();
  
  if (grupos.length === 0) {
    console.log('✅ No hay grupos para consolidar\n');
    return { success: true, consolidados: 0 };
  }
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔄 PASO 2: Consolidando productos...');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const resultados = {
    exitosos: [],
    errores: []
  };
  
  // Consolidar cada grupo
  for (const grupo of grupos) {
    const resultado = await consolidarGrupo(grupo);
    
    if (resultado.success) {
      resultados.exitosos.push(resultado);
    } else {
      resultados.errores.push(resultado);
    }
  }
  
  // Resumen final
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN FINAL DE CONSOLIDACIÓN');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Grupos consolidados: ${resultados.exitosos.length} / ${grupos.length}`);
  console.log(`Total variantes migradas: ${resultados.exitosos.reduce((sum, r) => sum + r.variantesMigradas, 0)}`);
  console.log(`Total productos eliminados: ${resultados.exitosos.reduce((sum, r) => sum + r.productosEliminados, 0)}`);
  
  if (resultados.errores.length > 0) {
    console.log(`\n❌ Grupos con errores: ${resultados.errores.length}`);
    resultados.errores.forEach(e => {
      console.log(`   - ${e.nombreBase}: ${e.error || 'Ver detalles en el log'}`);
    });
  }
  
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  // Guardar reporte
  const reportePath = path.join(process.cwd(), 'reports', `consolidacion-productos-${Date.now()}.json`);
  fs.writeFileSync(reportePath, JSON.stringify({
    fecha: new Date().toISOString(),
    grupos_consolidados: resultados.exitosos.length,
    grupos_con_errores: resultados.errores.length,
    detalles: resultados
  }, null, 2));
  
  console.log(`📄 Reporte guardado en: ${reportePath}\n`);
  
  const success = resultados.errores.length === 0;
  console.log(success ? '✅ Consolidación completada exitosamente\n' : '⚠️  Consolidación completada con errores\n');
  
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

module.exports = { identificarGrupos, consolidarGrupo };

