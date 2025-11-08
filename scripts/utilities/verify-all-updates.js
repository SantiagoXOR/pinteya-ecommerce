// ===================================
// SCRIPT PARA VERIFICAR TODAS LAS ACTUALIZACIONES
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

async function verificarMedidasActualizadas() {
  console.log('\n📝 1. Verificando medidas actualizadas (L → KG)...');
  
  const medidas = [
    { aikon: '4488', esperado: '10KG', nombre: 'Plavipint Techos Poliuretánico 10L' },
    { aikon: '4487', esperado: '20KG', nombre: 'Plavipint Techos Poliuretánico 20L' },
    { aikon: '2756', esperado: '5KG', nombre: 'Látex Frentes 4L' },
    { aikon: '2757', esperado: '12KG', nombre: 'Látex Frentes 10L' },
    { aikon: '2758', esperado: '24KG', nombre: 'Látex Frentes 20L' },
    { aikon: '4261', esperado: '5KG', nombre: 'Látex Muros 4L' },
    { aikon: '4103', esperado: '12KG', nombre: 'Látex Muros 10L' },
    { aikon: '2855', esperado: '24KG', nombre: 'Látex Muros 20L' },
    { aikon: '13', esperado: '1.6KG', nombre: 'ENDUIDO 1.6KG' },
    { aikon: '14', esperado: '6.4KG', nombre: 'ENDUIDO 6.4KG' },
    { aikon: '15', esperado: '16KG', nombre: 'ENDUIDO 16KG' },
    { aikon: '16', esperado: '32KG', nombre: 'ENDUIDO 32KG' }
  ];
  
  let correctos = 0;
  let incorrectos = [];
  
  for (const medida of medidas) {
    const { data } = await supabase
      .from('product_variants')
      .select('measure')
      .eq('aikon_id', medida.aikon)
      .single();
    
    if (data && data.measure === medida.esperado) {
      correctos++;
      console.log(`   ✅ ${medida.nombre}: ${data.measure}`);
    } else {
      incorrectos.push({ ...medida, actual: data?.measure || 'N/A' });
      console.log(`   ❌ ${medida.nombre}: esperado ${medida.esperado}, actual ${data?.measure || 'N/A'}`);
    }
  }
  
  console.log(`\n   Resultado: ${correctos}/${medidas.length} correctos`);
  return { correctos, incorrectos };
}

async function verificarVariantesColor() {
  console.log('\n🎨 2. Verificando variantes por color creadas...');
  
  const variantes = [
    { aikon: '4488-ROJO-TEJA', nombre: 'Plavipint Techos 10L - ROJO TEJA' },
    { aikon: '4487-ROJO-TEJA', nombre: 'Plavipint Techos 20L - ROJO TEJA' },
    { aikon: '3386-VERDE-CEMENTO', nombre: 'RECUPLAST FRENTES 1L - VERDE CEMENTO' },
    { aikon: '3386-GRIS', nombre: 'RECUPLAST FRENTES 1L - GRIS' },
    { aikon: '2750-VERDE-CEMENTO', nombre: 'RECUPLAST FRENTES 4L - VERDE CEMENTO' },
    { aikon: '2750-GRIS', nombre: 'RECUPLAST FRENTES 4L - GRIS' },
    { aikon: '2751-VERDE-CEMENTO', nombre: 'RECUPLAST FRENTES 10L - VERDE CEMENTO' },
    { aikon: '2751-GRIS', nombre: 'RECUPLAST FRENTES 10L - GRIS' },
    { aikon: '2771-VERDE-CEMENTO', nombre: 'RECUPLAST FRENTES 20L - VERDE CEMENTO' },
    { aikon: '2771-GRIS', nombre: 'RECUPLAST FRENTES 20L - GRIS' }
  ];
  
  let encontradas = 0;
  let noEncontradas = [];
  
  for (const variante of variantes) {
    const { data } = await supabase
      .from('product_variants')
      .select('id, color_name')
      .eq('aikon_id', variante.aikon)
      .single();
    
    if (data) {
      encontradas++;
      console.log(`   ✅ ${variante.nombre}`);
    } else {
      noEncontradas.push(variante);
      console.log(`   ❌ ${variante.nombre}: No encontrada`);
    }
  }
  
  console.log(`\n   Resultado: ${encontradas}/${variantes.length} encontradas`);
  return { encontradas, noEncontradas };
}

async function verificarProductosNuevos() {
  console.log('\n📦 3. Verificando productos nuevos creados...');
  
  // Verificar algunos productos clave
  const productosVerificar = [
    { nombre: 'LATEX PREMIUM INT EXT 1L COLORES', aikonBase: '75', variantesEsperadas: 11 },
    { nombre: 'IMPREGNANTE NEW HOUSE BRILLANTE 1L', aikonBase: '3258', variantesEsperadas: 8 },
    { nombre: 'CUBIERTA PISO DEPORTIVO 1L', aikonBase: '119', variantesEsperadas: 5 },
    { nombre: 'MICROCEMENTO FACIL FIX 20KG', aikonBase: '1989', variantesEsperadas: 4 },
    { nombre: 'ENTONADORES 30CC', aikonBase: '4309', variantesEsperadas: 11 }
  ];
  
  let correctos = 0;
  let detalles = [];
  
  for (const producto of productosVerificar) {
    const { data: variante } = await supabase
      .from('product_variants')
      .select('product_id')
      .eq('aikon_id', producto.aikonBase)
      .single();
    
    if (!variante) {
      console.log(`   ❌ ${producto.nombre}: No encontrado`);
      continue;
    }
    
    const { count } = await supabase
      .from('product_variants')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', variante.product_id);
    
    if (count === producto.variantesEsperadas) {
      correctos++;
      console.log(`   ✅ ${producto.nombre}: ${count} variantes`);
    } else {
      console.log(`   ⚠️  ${producto.nombre}: esperadas ${producto.variantesEsperadas}, encontradas ${count}`);
      detalles.push({ ...producto, encontradas: count });
    }
  }
  
  console.log(`\n   Resultado: ${correctos}/${productosVerificar.length} correctos`);
  return { correctos, detalles };
}

async function verificarImagenesAsociadas() {
  console.log('\n📷 4. Verificando imágenes asociadas...');
  
  const imagenes = [
    { aikon: '4526', nombre: 'Cinta Enmascarar RAPIFIX' },
    { aikon: '529', nombre: 'Pinceleta Black N42' },
    { aikon: '2061', nombre: 'Rodillo 17cm Lanar Elefante' },
    { aikon: '2755', nombre: 'Rodillo Gold Flock N7' },
    { aikon: '201', nombre: 'Rodillo Mini Epoxi N5' }
  ];
  
  let conImagen = 0;
  let sinImagen = [];
  
  for (const img of imagenes) {
    const { data } = await supabase
      .from('product_variants')
      .select('image_url')
      .eq('aikon_id', img.aikon)
      .single();
    
    if (data && data.image_url) {
      conImagen++;
      console.log(`   ✅ ${img.nombre}: ${data.image_url.substring(0, 70)}...`);
    } else {
      sinImagen.push(img);
      console.log(`   ❌ ${img.nombre}: Sin imagen`);
    }
  }
  
  console.log(`\n   Resultado: ${conImagen}/${imagenes.length} con imagen`);
  return { conImagen, sinImagen };
}

async function obtenerEstadisticasGenerales() {
  console.log('\n📊 5. Estadísticas generales...');
  
  // Total de productos
  const { count: totalProductos } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });
  
  // Total de variantes
  const { count: totalVariantes } = await supabase
    .from('product_variants')
    .select('id', { count: 'exact', head: true });
  
  // Variantes con imagen
  const { count: variantesConImagen } = await supabase
    .from('product_variants')
    .select('id', { count: 'exact', head: true })
    .not('image_url', 'is', null);
  
  console.log(`   Total de productos: ${totalProductos}`);
  console.log(`   Total de variantes: ${totalVariantes}`);
  console.log(`   Variantes con imagen: ${variantesConImagen}`);
  
  return { totalProductos, totalVariantes, variantesConImagen };
}

async function main() {
  console.log('🚀 Iniciando verificación de todas las actualizaciones\n');
  console.log('═══════════════════════════════════════════════════════');
  
  try {
    const medidasResult = await verificarMedidasActualizadas();
    const variantesResult = await verificarVariantesColor();
    const productosResult = await verificarProductosNuevos();
    const imagenesResult = await verificarImagenesAsociadas();
    const estadisticas = await obtenerEstadisticasGenerales();
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN FINAL DE VERIFICACIÓN');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`1. Medidas actualizadas: ${medidasResult.correctos}/12 ✓`);
    console.log(`2. Variantes por color: ${variantesResult.encontradas}/10 ✓`);
    console.log(`3. Productos nuevos (muestra): ${productosResult.correctos}/5 ✓`);
    console.log(`4. Imágenes asociadas: ${imagenesResult.conImagen}/5 ✓`);
    console.log('\n5. Estadísticas generales:');
    console.log(`   - Total productos: ${estadisticas.totalProductos}`);
    console.log(`   - Total variantes: ${estadisticas.totalVariantes}`);
    console.log(`   - Variantes con imagen: ${estadisticas.variantesConImagen}`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    const todosCorrecto = 
      medidasResult.incorrectos.length === 0 &&
      variantesResult.noEncontradas.length === 0 &&
      imagenesResult.sinImagen.length === 0 &&
      productosResult.correctos >= 4; // Permitir 1 error en la muestra
    
    if (todosCorrecto) {
      console.log('✅ TODAS LAS VERIFICACIONES PASARON EXITOSAMENTE\n');
    } else {
      console.log('⚠️  ALGUNAS VERIFICACIONES TIENEN ADVERTENCIAS\n');
    }
    
    // Guardar reporte
    const reportePath = path.join(process.cwd(), 'reports', `verificacion-final-${Date.now()}.json`);
    fs.writeFileSync(reportePath, JSON.stringify({
      fecha: new Date().toISOString(),
      medidas: medidasResult,
      variantes: variantesResult,
      productos: productosResult,
      imagenes: imagenesResult,
      estadisticas,
      todoCorrecto: todosCorrecto
    }, null, 2));
    
    console.log(`📄 Reporte guardado en: ${reportePath}\n`);
    
    return { success: todosCorrecto };
  } catch (error) {
    console.error('\n❌ Error durante la verificación:', error);
    return { success: false, error };
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

