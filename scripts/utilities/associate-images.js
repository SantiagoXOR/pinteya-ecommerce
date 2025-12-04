// ===================================
// SCRIPT PARA ASOCIAR IMÁGENES CON PRODUCTOS
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

// Mapeo de imágenes a códigos AIKON
const imagenesAAsociar = [
  {
    nombre: 'Cinta Enmascarar RAPIFIX',
    aikon_id: '4526', // CINTA ENMASCARAR AZUL 18MM PINTOR
    url: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/rapifix/cinta-enmascarar-rapifix.webp'
  },
  {
    nombre: 'Pinceleta Black N42 El Galgo',
    aikon_id: '529', // PINCELETA BLACK N42
    url: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pinceleta-black-n42-galgo.webp'
  },
  {
    nombre: 'Rodillo 17cm Lanar Elefante',
    aikon_id: '2061', // RODILLO 17CM LANAR ELEFANTE
    url: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/rodillo-17cm-lanar-elefante-galgo.webp'
  },
  {
    nombre: 'Rodillo Gold Flock N7',
    aikon_id: '2755', // RODILLO GOLD FLOCK N7
    url: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/rodillo-gold-flock-galgo.webp'
  },
  {
    nombre: 'Rodillo Mini Epoxi N5',
    aikon_id: '201', // RODILLO MINI EPOXI N5
    url: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/rodillo-mini-epoxi-galgo.webp'
  }
];

async function asociarImagen(imagen) {
  try {
    console.log(`\n📷 Asociando: ${imagen.nombre}`);
    console.log(`   AIKON ID: ${imagen.aikon_id}`);
    console.log(`   URL: ${imagen.url}`);
    
    // Actualizar la variante con la imagen
    const { data, error } = await supabase
      .from('product_variants')
      .update({ image_url: imagen.url })
      .eq('aikon_id', imagen.aikon_id)
      .select();
    
    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      return { success: false, error: error.message };
    }
    
    if (!data || data.length === 0) {
      console.log(`   ⚠️  No se encontró variante con AIKON ${imagen.aikon_id}`);
      return { success: false, error: 'Variante no encontrada' };
    }
    
    console.log(`   ✅ Imagen asociada correctamente (${data.length} variante(s))`);
    return { success: true, variantes: data.length };
  } catch (error) {
    console.error(`   ❌ Excepción: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Iniciando asociación de imágenes con productos\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const resultados = {
    exitosos: [],
    errores: []
  };
  
  for (const imagen of imagenesAAsociar) {
    const resultado = await asociarImagen(imagen);
    
    if (resultado.success) {
      resultados.exitosos.push(imagen);
    } else {
      resultados.errores.push({ ...imagen, error: resultado.error });
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Imágenes asociadas: ${resultados.exitosos.length} / ${imagenesAAsociar.length}`);
  console.log(`Errores: ${resultados.errores.length}`);
  
  if (resultados.errores.length > 0) {
    console.log('\n❌ IMÁGENES CON ERRORES:');
    resultados.errores.forEach(e => {
      console.log(`  - ${e.nombre} (AIKON: ${e.aikon_id}): ${e.error}`);
    });
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
  
  const success = resultados.errores.length === 0;
  console.log(success ? '✅ Asociación completada exitosamente\n' : '⚠️  Asociación completada con errores\n');
  
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

module.exports = { asociarImagen };

