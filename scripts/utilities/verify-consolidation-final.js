// ===================================
// SCRIPT PARA VERIFICAR CONSOLIDACIÓN FINAL
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

// Productos que deberían tener múltiples variantes
const productosEsperados = [
  { id: 181, nombre: 'Imprimacion', variantes_esperadas: 3 },
  { id: 116, nombre: 'Membrana Premium', variantes_esperadas: 3 },
  { id: 123, nombre: 'Cielorraso', variantes_esperadas: 4 },
  { id: 187, nombre: 'Cubierta Piso Deportivo', variantes_esperadas: 20 }, // 4 medidas x 5 colores
  { id: 195, nombre: 'Latex Premium Lavable', variantes_esperadas: 4 },
  { id: 199, nombre: 'Latex Premium Interior', variantes_esperadas: 4 },
  { id: 203, nombre: 'Latex Premium Exterior', variantes_esperadas: 4 },
  { id: 211, nombre: 'Barniz al Agua', variantes_esperadas: 2 },
  { id: 213, nombre: 'Esmalte al Agua', variantes_esperadas: 2 },
  { id: 215, nombre: 'Hidrolaca Poliuretanica Pisos', variantes_esperadas: 2 },
  { id: 217, nombre: 'Barniz New House Brillante', variantes_esperadas: 2 },
  { id: 219, nombre: 'Impregnante New House Brillante', variantes_esperadas: 16 }, // 2 medidas x 8 colores
  { id: 221, nombre: 'Impregnante New House Satinado', variantes_esperadas: 16 }, // 2 medidas x 8 colores
  { id: 223, nombre: 'Latex Expression Interior', variantes_esperadas: 4 },
  { id: 227, nombre: 'Latex Expression Exterior', variantes_esperadas: 4 },
  { id: 231, nombre: 'Microcemento Facil Fix', variantes_esperadas: 8 }, // 2 medidas x 4 colores
  { id: 233, nombre: 'Entonadores', variantes_esperadas: 23 } // 30CC (11) + 120CC (12)
];

async function verificarProducto(producto) {
  const { count, error } = await supabase
    .from('product_variants')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', producto.id);
  
  if (error) {
    console.error(`❌ ${producto.nombre}: Error consultando`);
    return { producto: producto.nombre, error: error.message };
  }
  
  const correcto = count === producto.variantes_esperadas;
  const estado = correcto ? '✅' : '⚠️ ';
  
  console.log(`${estado} ${producto.nombre}: ${count}/${producto.variantes_esperadas} variantes`);
  
  return {
    producto: producto.nombre,
    id: producto.id,
    esperadas: producto.variantes_esperadas,
    actual: count,
    correcto
  };
}

async function main() {
  console.log('🚀 Verificando consolidación final de productos\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const resultados = [];
  let correctos = 0;
  let incorrectos = 0;
  
  for (const producto of productosEsperados) {
    const resultado = await verificarProducto(producto);
    resultados.push(resultado);
    
    if (resultado.correcto) {
      correctos++;
    } else {
      incorrectos++;
    }
  }
  
  // Estadísticas generales
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 ESTADÍSTICAS GENERALES');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const { count: totalProductos } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });
  
  const { count: totalVariantes } = await supabase
    .from('product_variants')
    .select('id', { count: 'exact', head: true });
  
  const { count: variantesConImagen } = await supabase
    .from('product_variants')
    .select('id', { count: 'exact', head: true })
    .not('image_url', 'is', null);
  
  console.log(`Total productos: ${totalProductos}`);
  console.log(`Total variantes: ${totalVariantes}`);
  console.log(`Variantes con imagen: ${variantesConImagen}`);
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE CONSOLIDACIÓN');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Productos correctos: ${correctos}/${productosEsperados.length}`);
  console.log(`Productos con diferencias: ${incorrectos}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  if (incorrectos > 0) {
    console.log('⚠️  PRODUCTOS CON DIFERENCIAS:\n');
    resultados
      .filter(r => !r.correcto)
      .forEach(r => {
        console.log(`   ${r.producto}: tiene ${r.actual}, esperadas ${r.esperadas} (faltan ${r.esperadas - r.actual})`);
      });
    console.log('');
  }
  
  // Guardar reporte
  const reportePath = path.join(process.cwd(), 'reports', `verificacion-consolidacion-${Date.now()}.json`);
  fs.writeFileSync(reportePath, JSON.stringify({
    fecha: new Date().toISOString(),
    total_productos: totalProductos,
    total_variantes: totalVariantes,
    variantes_con_imagen: variantesConImagen,
    productos_consolidados: resultados,
    correctos,
    incorrectos
  }, null, 2));
  
  console.log(`📄 Reporte guardado en: ${reportePath}\n`);
  
  const success = incorrectos === 0;
  console.log(success ? '✅ Consolidación verificada exitosamente\n' : '⚠️  Hay productos con variantes faltantes\n');
  
  return { success, correctos, incorrectos };
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

module.exports = { main };

