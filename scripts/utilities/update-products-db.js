// ===================================
// SCRIPT PARA ACTUALIZAR PRODUCTOS EN LA BASE DE DATOS
// ===================================

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ===================================
// PASO 1: ACTUALIZAR MEDIDAS (L → KG)
// ===================================

const medidasAActualizar = [
  { aikon_id: '4488', medida_nueva: '10KG', nombre: 'Plavipint Techos Poliuretánico 10L' },
  { aikon_id: '4487', medida_nueva: '20KG', nombre: 'Plavipint Techos Poliuretánico 20L' },
  { aikon_id: '2756', medida_nueva: '5KG', nombre: 'Látex Frentes 4L' },
  { aikon_id: '2757', medida_nueva: '12KG', nombre: 'Látex Frentes 10L' },
  { aikon_id: '2758', medida_nueva: '24KG', nombre: 'Látex Frentes 20L' },
  { aikon_id: '4261', medida_nueva: '5KG', nombre: 'Látex Muros 4L' },
  { aikon_id: '4103', medida_nueva: '12KG', nombre: 'Látex Muros 10L' },
  { aikon_id: '2855', medida_nueva: '24KG', nombre: 'Látex Muros 20L' },
  { aikon_id: '13', medida_nueva: '1.6KG', nombre: 'ENDUIDO 1.6KG' },
  { aikon_id: '14', medida_nueva: '6.4KG', nombre: 'ENDUIDO 6.4KG' },
  { aikon_id: '15', medida_nueva: '16KG', nombre: 'ENDUIDO 16KG' },
  { aikon_id: '16', medida_nueva: '32KG', nombre: 'ENDUIDO 32KG' }
];

async function actualizarMedidas() {
  console.log('\n📝 PASO 1: Actualizando medidas (L → KG y kg → KG)...\n');
  
  const resultados = {
    exitosos: [],
    errores: []
  };
  
  for (const item of medidasAActualizar) {
    try {
      console.log(`Actualizando ${item.nombre} (AIKON: ${item.aikon_id})`);
      console.log(`  Nueva medida: ${item.medida_nueva}`);
      
      const { data, error } = await supabase
        .from('product_variants')
        .update({ measure: item.medida_nueva })
        .eq('aikon_id', item.aikon_id)
        .select();
      
      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
        resultados.errores.push({ ...item, error: error.message });
      } else if (data && data.length > 0) {
        console.log(`  ✅ Actualizado correctamente`);
        resultados.exitosos.push({ ...item, registros: data.length });
      } else {
        console.log(`  ⚠️  No se encontró variante con AIKON ${item.aikon_id}`);
        resultados.errores.push({ ...item, error: 'No encontrado' });
      }
    } catch (error) {
      console.error(`  ❌ Excepción: ${error.message}`);
      resultados.errores.push({ ...item, error: error.message });
    }
  }
  
  console.log(`\n✅ Medidas actualizadas: ${resultados.exitosos.length}`);
  console.log(`❌ Errores: ${resultados.errores.length}\n`);
  
  return resultados;
}

// ===================================
// PASO 2: CREAR VARIANTES POR COLOR
// ===================================

const variantesColorNuevas = [
  // Plavipint Techos Poliuretánico - agregar ROJO TEJA
  {
    aikon_base: '4488',
    nuevo_aikon: '4488-ROJO-TEJA',
    color_name: 'ROJO TEJA',
    medida: '10KG',
    nombre_producto: 'Plavipint Techos Poliuretánico 10L'
  },
  {
    aikon_base: '4487',
    nuevo_aikon: '4487-ROJO-TEJA',
    color_name: 'ROJO TEJA',
    medida: '20KG',
    nombre_producto: 'Plavipint Techos Poliuretánico 20L'
  },
  // RECUPLAST FRENTES - agregar VERDE CEMENTO y GRIS
  {
    aikon_base: '3386',
    nuevo_aikon: '3386-VERDE-CEMENTO',
    color_name: 'VERDE CEMENTO',
    medida: '1L',
    nombre_producto: 'RECUPLAST FRENTES 1L'
  },
  {
    aikon_base: '3386',
    nuevo_aikon: '3386-GRIS',
    color_name: 'GRIS',
    medida: '1L',
    nombre_producto: 'RECUPLAST FRENTES 1L'
  },
  {
    aikon_base: '2750',
    nuevo_aikon: '2750-VERDE-CEMENTO',
    color_name: 'VERDE CEMENTO',
    medida: '4L',
    nombre_producto: 'RECUPLAST FRENTES 4L'
  },
  {
    aikon_base: '2750',
    nuevo_aikon: '2750-GRIS',
    color_name: 'GRIS',
    medida: '4L',
    nombre_producto: 'RECUPLAST FRENTES 4L'
  },
  {
    aikon_base: '2751',
    nuevo_aikon: '2751-VERDE-CEMENTO',
    color_name: 'VERDE CEMENTO',
    medida: '10L',
    nombre_producto: 'RECUPLAST FRENTES 10L'
  },
  {
    aikon_base: '2751',
    nuevo_aikon: '2751-GRIS',
    color_name: 'GRIS',
    medida: '10L',
    nombre_producto: 'RECUPLAST FRENTES 10L'
  },
  {
    aikon_base: '2771',
    nuevo_aikon: '2771-VERDE-CEMENTO',
    color_name: 'VERDE CEMENTO',
    medida: '20L',
    nombre_producto: 'RECUPLAST FRENTES 20L'
  },
  {
    aikon_base: '2771',
    nuevo_aikon: '2771-GRIS',
    color_name: 'GRIS',
    medida: '20L',
    nombre_producto: 'RECUPLAST FRENTES 20L'
  }
];

async function crearVariantesColor() {
  console.log('\n🎨 PASO 2: Creando variantes adicionales por color...\n');
  
  const resultados = {
    exitosos: [],
    errores: []
  };
  
  for (const variante of variantesColorNuevas) {
    try {
      console.log(`Creando variante: ${variante.nombre_producto} - ${variante.color_name}`);
      
      // Obtener variante base
      const { data: varianteBase, error: errorBase } = await supabase
        .from('product_variants')
        .select('*')
        .eq('aikon_id', variante.aikon_base)
        .single();
      
      if (errorBase || !varianteBase) {
        console.log(`  ⚠️  No se encontró variante base con AIKON ${variante.aikon_base}`);
        resultados.errores.push({ ...variante, error: 'Base no encontrada' });
        continue;
      }
      
      // Crear nueva variante
      const nuevaVariante = {
        product_id: varianteBase.product_id,
        aikon_id: variante.nuevo_aikon,
        variant_slug: `${varianteBase.variant_slug}-${variante.color_name.toLowerCase().replace(/\s+/g, '-')}`,
        color_name: variante.color_name,
        measure: variante.medida,
        price_list: varianteBase.price_list,
        price_sale: varianteBase.price_sale,
        stock: 0,
        is_active: true,
        is_default: false,
        image_url: varianteBase.image_url
      };
      
      const { data, error } = await supabase
        .from('product_variants')
        .insert(nuevaVariante)
        .select();
      
      if (error) {
        console.error(`  ❌ Error: ${error.message}`);
        resultados.errores.push({ ...variante, error: error.message });
      } else {
        console.log(`  ✅ Variante creada correctamente`);
        resultados.exitosos.push(variante);
      }
    } catch (error) {
      console.error(`  ❌ Excepción: ${error.message}`);
      resultados.errores.push({ ...variante, error: error.message });
    }
  }
  
  console.log(`\n✅ Variantes creadas: ${resultados.exitosos.length}`);
  console.log(`❌ Errores: ${resultados.errores.length}\n`);
  
  return resultados;
}

// ===================================
// EJECUTAR TODO
// ===================================

async function main() {
  console.log('🚀 Iniciando actualización de productos en la base de datos\n');
  console.log('═══════════════════════════════════════════════════════');
  
  try {
    // Paso 1: Actualizar medidas
    const resultadosMedidas = await actualizarMedidas();
    
    // Paso 2: Crear variantes por color
    const resultadosVariantes = await crearVariantesColor();
    
    // Resumen final
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN FINAL');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Medidas actualizadas: ${resultadosMedidas.exitosos.length} / ${medidasAActualizar.length}`);
    console.log(`Variantes creadas: ${resultadosVariantes.exitosos.length} / ${variantesColorNuevas.length}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Guardar reporte
    const reportePath = path.join(process.cwd(), 'reports', `actualizacion-productos-${Date.now()}.json`);
    fs.writeFileSync(reportePath, JSON.stringify({
      fecha: new Date().toISOString(),
      medidas: resultadosMedidas,
      variantes: resultadosVariantes
    }, null, 2));
    
    console.log(`📄 Reporte guardado en: ${reportePath}\n`);
    
    if (resultadosMedidas.errores.length === 0 && resultadosVariantes.errores.length === 0) {
      console.log('✅ Actualización completada sin errores\n');
      return { success: true };
    } else {
      console.log('⚠️  Actualización completada con algunos errores\n');
      return { success: false, errores: [...resultadosMedidas.errores, ...resultadosVariantes.errores] };
    }
  } catch (error) {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(result => {
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { actualizarMedidas, crearVariantesColor };

