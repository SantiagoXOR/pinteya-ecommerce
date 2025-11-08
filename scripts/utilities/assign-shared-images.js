// ===================================
// SCRIPT PARA ASIGNAR IMÁGENES COMPARTIDAS
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

// Mapeo de productos sin imagen → imagen compartida
const asignacionesImagenes = [
  // Impregnante New House Satinado usa la misma imagen que Brillante
  {
    codigo_aikon: '3218', // Impregnante New House Satinado 1L - CAOBA
    imagen_compartida: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/mascolor/newhouse-impregnante.webp',
    producto: 'Impregnante New House Satinado'
  },
  
  // Rodillo Gold Flock - todos usan la misma imagen
  {
    codigo_aikon: '2379', // N11
    imagen_compartida: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/rodillo-gold-flock-galgo.webp',
    producto: 'Rodillo Gold Flock N11'
  },
  {
    codigo_aikon: '4315', // N16
    imagen_compartida: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/rodillo-gold-flock-galgo.webp',
    producto: 'Rodillo Gold Flock N16'
  },
  
  // Rodillo Mini Epoxi - todos usan la misma imagen
  {
    codigo_aikon: '200', // N8
    imagen_compartida: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/rodillo-mini-epoxi-galgo.webp',
    producto: 'Rodillo Mini Epoxi N8'
  },
  {
    codigo_aikon: '2090', // N11
    imagen_compartida: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/rodillo-mini-epoxi-galgo.webp',
    producto: 'Rodillo Mini Epoxi N11'
  },
  
  // Pinceleta Obra V2 N40
  {
    codigo_aikon: '3065',
    imagen_compartida: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/pinceleta-obra.png',
    producto: 'Pinceleta Obra V2 N40'
  },
  
  // Pinceleta Black N50 usa la misma que N42
  {
    codigo_aikon: '530',
    imagen_compartida: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pinceleta-black-n42-galgo.webp',
    producto: 'Pinceleta Black N50'
  },
  
  // Cintas Enmascarar - todas usan la misma imagen
  {
    codigo_aikon: '4527', // 24MM
    imagen_compartida: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/rapifix/cinta-enmascarar-rapifix.webp',
    producto: 'Cinta Enmascarar Azul 24MM'
  },
  {
    codigo_aikon: '4528', // 36MM
    imagen_compartida: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/rapifix/cinta-enmascarar-rapifix.webp',
    producto: 'Cinta Enmascarar Azul 36MM'
  },
  {
    codigo_aikon: '4529', // 48MM
    imagen_compartida: 'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/rapifix/cinta-enmascarar-rapifix.webp',
    producto: 'Cinta Enmascarar Azul 48MM'
  }
];

async function asignarImagen(asignacion) {
  try {
    console.log(`📷 ${asignacion.producto} (AIKON: ${asignacion.codigo_aikon})`);
    
    const { error } = await supabase
      .from('product_variants')
      .update({ image_url: asignacion.imagen_compartida })
      .eq('aikon_id', asignacion.codigo_aikon);
    
    if (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      return { success: false, error: error.message };
    }
    
    console.log(`   ✅ Imagen asignada\n`);
    return { success: true };
  } catch (error) {
    console.error(`   ❌ Excepción: ${error.message}\n`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Asignando imágenes compartidas a productos restantes\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let exitosos = 0;
  let errores = 0;

  for (const asignacion of asignacionesImagenes) {
    const resultado = await asignarImagen(asignacion);
    
    if (resultado.success) {
      exitosos++;
    } else {
      errores++;
    }
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total asignaciones: ${asignacionesImagenes.length}`);
  console.log(`✅ Exitosas: ${exitosos}`);
  console.log(`❌ Errores: ${errores}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  const success = errores === 0;
  console.log(success ? '✅ Asignación completada exitosamente\n' : '⚠️  Asignación completada con errores\n');

  return { success, exitosos, errores };
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

module.exports = { asignarImagen };

