// ===================================
// SCRIPT PARA SUBIR TODAS LAS IMÁGENES RESTANTES
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

// Mapeo de imágenes a productos/códigos AIKON
const imagenesASubir = [
  // Expression
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\EXPRESSION-CIELORRASO.webp',
    remote: 'mascolor/expression-cielorraso.webp',
    producto_nombre: 'Cielorraso',
    codigo_aikon: '37'
  },
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\expression-imprimacion.webp',
    remote: 'mascolor/expression-imprimacion.webp',
    producto_nombre: 'Imprimacion',
    codigo_aikon: '22'
  },
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\expression-latex-exterior.webp',
    remote: 'mascolor/expression-latex-exterior.webp',
    producto_nombre: 'Latex Expression Exterior',
    codigo_aikon: '5'
  },
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\expression-latex-interior.webp',
    remote: 'mascolor/expression-latex-interior.webp',
    producto_nombre: 'Latex Expression Interior',
    codigo_aikon: '1'
  },
  
  // Premium
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\premium-latex-interior.webp',
    remote: 'mascolor/premium-latex-interior.webp',
    producto_nombre: 'Latex Premium Interior',
    codigo_aikon: '51'
  },
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\premium-latex-exterior.webp',
    remote: 'mascolor/premium-latex-exterior.webp',
    producto_nombre: 'Latex Premium Exterior',
    codigo_aikon: '55'
  },
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\premium-latex-interior-ext.webp',
    remote: 'mascolor/premium-latex-interior-ext.webp',
    producto_nombre: 'Latex Premium Int Ext Colores',
    codigo_aikon: '75'
  },
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\PREMIUM-LAVABLE.webp',
    remote: 'mascolor/premium-lavable.webp',
    producto_nombre: 'Latex Premium Lavable',
    codigo_aikon: '67'
  },
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\premium-membrana.webp',
    remote: 'mascolor/premium-membrana.webp',
    producto_nombre: 'Membrana Premium',
    codigo_aikon: '1702'
  },
  
  // Barniz y otros
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\premium-barniz-agua.webp',
    remote: 'mascolor/premium-barniz-agua.webp',
    producto_nombre: 'Barniz al Agua',
    codigo_aikon: '143'
  },
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\premium-esmalte-agua.webp',
    remote: 'mascolor/premium-esmalte-agua.webp',
    producto_nombre: 'Esmalte al Agua',
    codigo_aikon: '141'
  },
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\PREMIUM-HIDROLACA.webp',
    remote: 'mascolor/premium-hidrolaca.webp',
    producto_nombre: 'Hidrolaca Poliuretanica Pisos',
    codigo_aikon: '1993'
  },
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\premium-pisos-deportivos.webp',
    remote: 'mascolor/premium-pisos-deportivos.webp',
    producto_nombre: 'Cubierta Piso Deportivo',
    codigo_aikon: '119'
  },
  
  // New House
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\newhouse-barniz-marino.webp',
    remote: 'mascolor/newhouse-barniz-marino.webp',
    producto_nombre: 'Barniz New House Brillante',
    codigo_aikon: '3323'
  },
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\newhouse-impregnante.webp',
    remote: 'mascolor/newhouse-impregnante.webp',
    producto_nombre: 'Impregnante New House Brillante',
    codigo_aikon: '3258'
  },
  
  // Facilfix
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\facilfix-microcemento.webp',
    remote: 'mascolor/facilfix-microcemento.webp',
    producto_nombre: 'Microcemento Facil Fix',
    codigo_aikon: '1989'
  },
  
  // Entonador
  { 
    local: 'c:\\Users\\marti\\Desktop\\image-products\\ENTONADORUNIVERSAL.webp',
    remote: 'mascolor/entonador-universal.webp',
    producto_nombre: 'Entonadores',
    codigo_aikon: '4309'
  }
];

async function subirYAsociarImagen(imagen) {
  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(imagen.local)) {
      console.error(`❌ Archivo no encontrado: ${imagen.local}`);
      return { success: false, error: 'Archivo no encontrado' };
    }

    console.log(`\n📤 ${imagen.producto_nombre}`);
    console.log(`   Archivo: ${path.basename(imagen.local)}`);

    // Leer archivo
    const fileBuffer = fs.readFileSync(imagen.local);
    const fileStats = fs.statSync(imagen.local);
    console.log(`   Tamaño: ${(fileStats.size / 1024).toFixed(2)} KB`);

    // Subir a Supabase
    const { data, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(imagen.remote, fileBuffer, {
        contentType: 'image/webp',
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error(`   ❌ Error subiendo: ${uploadError.message}`);
      return { success: false, error: uploadError.message };
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(imagen.remote);

    console.log(`   ✅ Subida exitosa: ${urlData.publicUrl.substring(0, 60)}...`);

    // Asociar con variante
    const { error: updateError } = await supabase
      .from('product_variants')
      .update({ image_url: urlData.publicUrl })
      .eq('aikon_id', imagen.codigo_aikon);

    if (updateError) {
      console.error(`   ⚠️  Imagen subida pero no asociada: ${updateError.message}`);
      return { 
        success: true, 
        url: urlData.publicUrl, 
        associated: false,
        error: updateError.message
      };
    }

    console.log(`   ✅ Imagen asociada con variante AIKON ${imagen.codigo_aikon}`);

    return { 
      success: true, 
      url: urlData.publicUrl,
      associated: true
    };
  } catch (error) {
    console.error(`   ❌ Excepción: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Subiendo y asociando todas las imágenes restantes\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const resultados = {
    subidas: [],
    asociadas: [],
    errores: []
  };

  for (const imagen of imagenesASubir) {
    const resultado = await subirYAsociarImagen(imagen);

    if (resultado.success) {
      resultados.subidas.push(imagen);
      if (resultado.associated) {
        resultados.asociadas.push(imagen);
      }
    } else {
      resultados.errores.push({ ...imagen, error: resultado.error });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Total imágenes: ${imagenesASubir.length}`);
  console.log(`✅ Subidas exitosas: ${resultados.subidas.length}`);
  console.log(`✅ Asociadas con productos: ${resultados.asociadas.length}`);
  console.log(`❌ Errores: ${resultados.errores.length}`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (resultados.errores.length > 0) {
    console.log('❌ IMÁGENES CON ERRORES:');
    resultados.errores.forEach(e => {
      console.log(`   - ${e.producto_nombre}: ${e.error}`);
    });
    console.log('');
  }

  const success = resultados.errores.length === 0;
  console.log(success ? '✅ Todas las imágenes subidas y asociadas\n' : '⚠️  Algunas imágenes tuvieron errores\n');

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

module.exports = { subirYAsociarImagen };

