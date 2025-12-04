// ===================================
// SCRIPT PARA AJUSTAR TÍTULOS DE PRODUCTOS A FORMATO TÍTULO
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

// Palabras que deben permanecer en minúsculas (excepto al inicio)
const palabrasMinusculas = ['de', 'del', 'la', 'el', 'los', 'las', 'y', 'para', 'con', 'en', 'al', 'a'];

// Palabras que deben permanecer en mayúsculas
const palabrasMayusculas = ['UV', 'PVC', 'KG', 'CC', 'MM', 'L', 'N', 'V2'];

function toTitleCase(str) {
  if (!str) return str;
  
  return str
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      // Mantener siglas y códigos en mayúsculas
      if (palabrasMayusculas.includes(word.toUpperCase())) {
        return word.toUpperCase();
      }
      
      // Palabras pequeñas en minúsculas (excepto al inicio)
      if (index > 0 && palabrasMinusculas.includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      
      // Manejar palabras con números (ej: "n42" → "N42")
      if (/^n\d+$/i.test(word)) {
        return word.toUpperCase();
      }
      
      // Manejar unidades de medida con números (ej: "4l" → "4L", "10kg" → "10KG")
      if (/^\d+[a-z]+$/i.test(word)) {
        return word.toUpperCase();
      }
      
      // Manejar medidas tipo "17cm" → "17cm" pero "N7" → "N7"
      if (/^\d+(kg|l|cc|mm|cm|gr)$/i.test(word)) {
        return word.toUpperCase();
      }
      
      // Primera letra en mayúscula
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

async function obtenerProductosMayusculas() {
  console.log('🔍 Buscando productos con nombres en mayúsculas...\n');
  
  const { data, error } = await supabase
    .from('products')
    .select('id, name')
    .gte('id', 115); // Solo productos nuevos
  
  if (error) {
    console.error('❌ Error:', error.message);
    return [];
  }
  
  // Filtrar productos que están completamente en mayúsculas
  const productosMayusculas = data.filter(p => {
    const nombreSinNumeros = p.name.replace(/\d+/g, '');
    return nombreSinNumeros === nombreSinNumeros.toUpperCase() && 
           nombreSinNumeros !== nombreSinNumeros.toLowerCase();
  });
  
  console.log(`Encontrados ${productosMayusculas.length} productos en mayúsculas\n`);
  return productosMayusculas;
}

async function actualizarTitulo(producto) {
  const nombreNuevo = toTitleCase(producto.name);
  
  // No actualizar si ya está en formato correcto
  if (nombreNuevo === producto.name) {
    console.log(`⏭️  ${producto.name} - Ya está en formato correcto`);
    return { success: true, skipped: true };
  }
  
  console.log(`📝 Actualizando: "${producto.name}"`);
  console.log(`   → "${nombreNuevo}"`);
  
  try {
    const { error } = await supabase
      .from('products')
      .update({ name: nombreNuevo })
      .eq('id', producto.id);
    
    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    console.log(`   ✅ Actualizado correctamente\n`);
    return { success: true, anterior: producto.name, nuevo: nombreNuevo };
  } catch (error) {
    console.error(`   ❌ Excepción: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Iniciando ajuste de títulos de productos\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const productos = await obtenerProductosMayusculas();
  
  if (productos.length === 0) {
    console.log('✅ No hay productos que requieran ajuste\n');
    return { success: true, actualizados: 0 };
  }
  
  const resultados = {
    exitosos: [],
    omitidos: [],
    errores: []
  };
  
  for (const producto of productos) {
    const resultado = await actualizarTitulo(producto);
    
    if (resultado.success && !resultado.skipped) {
      resultados.exitosos.push({
        id: producto.id,
        anterior: resultado.anterior,
        nuevo: resultado.nuevo
      });
    } else if (resultado.skipped) {
      resultados.omitidos.push(producto);
    } else {
      resultados.errores.push({
        id: producto.id,
        nombre: producto.name,
        error: resultado.error
      });
    }
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Total productos revisados: ${productos.length}`);
  console.log(`✅ Actualizados: ${resultados.exitosos.length}`);
  console.log(`⏭️  Omitidos (ya correctos): ${resultados.omitidos.length}`);
  console.log(`❌ Errores: ${resultados.errores.length}`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  if (resultados.errores.length > 0) {
    console.log('❌ ERRORES:');
    resultados.errores.forEach(e => {
      console.log(`  - ${e.nombre} (ID: ${e.id}): ${e.error}`);
    });
    console.log('');
  }
  
  const success = resultados.errores.length === 0;
  console.log(success ? '✅ Ajuste de títulos completado exitosamente\n' : '⚠️  Ajuste completado con errores\n');
  
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

module.exports = { toTitleCase, main };

