// ===================================
// SCRIPT PARA RECREAR VARIANTES PERDIDAS
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

// Función para parsear precio
function parsearPrecio(precioStr) {
  if (!precioStr) return null;
  const cleaned = precioStr.toString().replace(/[,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

// Función para generar slug
function generarSlug(nombre, color = null, medida = null) {
  let slug = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  if (color) {
    slug += '-' + color.toLowerCase().replace(/\s+/g, '-');
  }
  if (medida) {
    slug += '-' + medida.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  
  return slug;
}

// Mapeo de productos maestros con sus variantes a recrear
const variantesARecrear = [
  // Imprimacion - maestro ID 181
  {
    maestro_id: 181,
    nombre_base: 'Imprimacion',
    variantes: [
      { codigo_aikon: '22', medida: '4L', precio: 26394, precio_desc: 18475.80 },
      { codigo_aikon: '23', medida: '10L', precio: 62441, precio_desc: 43708.70 },
      { codigo_aikon: '24', medida: '20L', precio: 120428, precio_desc: 84299.60 }
    ]
  },
  // Membrana Premium - maestro ID 116
  {
    maestro_id: 116,
    nombre_base: 'Membrana Premium',
    variantes: [
      { codigo_aikon: '1702', medida: '4KG', precio: 30666, precio_desc: 21466.20 },
      { codigo_aikon: '1703', medida: '10KG', precio: 72680, precio_desc: 50876.00 },
      { codigo_aikon: '1704', medida: '20KG', precio: 140324, precio_desc: 98226.80 }
    ]
  },
  // Cielorraso - maestro ID 123
  {
    maestro_id: 123,
    nombre_base: 'Cielorraso',
    variantes: [
      { codigo_aikon: '37', medida: '1L', precio: 6881, precio_desc: 4816.70 },
      { codigo_aikon: '38', medida: '4L', precio: 22098, precio_desc: 15468.60 },
      { codigo_aikon: '39', medida: '10L', precio: 51222, precio_desc: 35855.40 },
      { codigo_aikon: '40', medida: '20L', precio: 97485, precio_desc: 68239.50 }
    ]
  },
  // Latex Premium Lavable - maestro ID 195
  {
    maestro_id: 195,
    nombre_base: 'Latex Premium Lavable',
    variantes: [
      { codigo_aikon: '67', medida: '1L', precio: 9104, precio_desc: 6372.80 },
      { codigo_aikon: '68', medida: '4L', precio: 30999, precio_desc: 21699.30 },
      { codigo_aikon: '69', medida: '10L', precio: 73415, precio_desc: 51390.50 },
      { codigo_aikon: '70', medida: '20L', precio: 141667, precio_desc: 99166.90 }
    ]
  },
  // Latex Premium Interior - maestro ID 199
  {
    maestro_id: 199,
    nombre_base: 'Latex Premium Interior',
    variantes: [
      { codigo_aikon: '51', medida: '1L', precio: 7303, precio_desc: 5112.10 },
      { codigo_aikon: '52', medida: '4L', precio: 23807, precio_desc: 16664.90 },
      { codigo_aikon: '53', medida: '10L', precio: 55495, precio_desc: 38846.50 },
      { codigo_aikon: '54', medida: '20L', precio: 106009, precio_desc: 74206.30 }
    ]
  },
  // Latex Premium Exterior - maestro ID 203
  {
    maestro_id: 203,
    nombre_base: 'Latex Premium Exterior',
    variantes: [
      { codigo_aikon: '55', medida: '1L', precio: 7884, precio_desc: 5518.80 },
      { codigo_aikon: '56', medida: '4L', precio: 26096, precio_desc: 18267.20 },
      { codigo_aikon: '57', medida: '10L', precio: 61180, precio_desc: 42826.00 },
      { codigo_aikon: '58', medida: '20L', precio: 117301, precio_desc: 82110.70 }
    ]
  },
  // Barniz al Agua - maestro ID 211
  {
    maestro_id: 211,
    nombre_base: 'Barniz al Agua',
    variantes: [
      { codigo_aikon: '143', medida: '1L', precio: 12361, precio_desc: 8652.70 },
      { codigo_aikon: '144', medida: '4L', precio: 42789, precio_desc: 29952.30 }
    ]
  },
  // Esmalte al Agua - maestro ID 213
  {
    maestro_id: 213,
    nombre_base: 'Esmalte al Agua',
    variantes: [
      { codigo_aikon: '141', medida: '1L', precio: 15387, precio_desc: 10770.90 },
      { codigo_aikon: '142', medida: '4L', precio: 54891, precio_desc: 38423.70 }
    ]
  },
  // Hidrolaca Poliuretanica Pisos - maestro ID 215
  {
    maestro_id: 215,
    nombre_base: 'Hidrolaca Poliuretanica Pisos',
    variantes: [
      { codigo_aikon: '1993', medida: '1L', precio: 25610, precio_desc: 17927.00 },
      { codigo_aikon: '1994', medida: '4L', precio: 96052, precio_desc: 67236.40 }
    ]
  },
  // Barniz New House Brillante - maestro ID 217
  {
    maestro_id: 217,
    nombre_base: 'Barniz New House Brillante',
    variantes: [
      { codigo_aikon: '3323', medida: '1L', precio: 10194, precio_desc: 7135.80 },
      { codigo_aikon: '3324', medida: '4L', precio: 36816, precio_desc: 25771.20 }
    ]
  },
  // Latex Expression Interior - maestro ID 223
  {
    maestro_id: 223,
    nombre_base: 'Latex Expression Interior',
    variantes: [
      { codigo_aikon: '1', medida: '1L', precio: 5817, precio_desc: 4071.90 },
      { codigo_aikon: '2', medida: '4L', precio: 18114, precio_desc: 12679.80 },
      { codigo_aikon: '3', medida: '10L', precio: 41484, precio_desc: 29038.80 },
      { codigo_aikon: '4', medida: '20L', precio: 78324, precio_desc: 54826.80 }
    ]
  },
  // Latex Expression Exterior - maestro ID 227
  {
    maestro_id: 227,
    nombre_base: 'Latex Expression Exterior',
    variantes: [
      { codigo_aikon: '5', medida: '1L', precio: 6080, precio_desc: 4256.00 },
      { codigo_aikon: '6', medida: '4L', precio: 19195, precio_desc: 13436.50 },
      { codigo_aikon: '7', medida: '10L', precio: 44199, precio_desc: 30939.30 },
      { codigo_aikon: '8', medida: '20L', precio: 83753, precio_desc: 58627.10 }
    ]
  }
];

async function recrearVariantes(grupo) {
  console.log(`\n📦 Recreando variantes para: ${grupo.nombre_base} (ID: ${grupo.maestro_id})`);
  
  let creadas = 0;
  let errores = 0;
  let omitidas = 0;
  
  for (const variante of grupo.variantes) {
    try {
      // Verificar si ya existe
      const { data: existente } = await supabase
        .from('product_variants')
        .select('id')
        .eq('aikon_id', variante.codigo_aikon)
        .single();
      
      if (existente) {
        console.log(`   ⏭️  AIKON ${variante.codigo_aikon} ya existe`);
        omitidas++;
        continue;
      }
      
      // Crear nueva variante
      const nuevaVariante = {
        product_id: grupo.maestro_id,
        aikon_id: variante.codigo_aikon,
        variant_slug: generarSlug(grupo.nombre_base, null, variante.medida),
        measure: variante.medida,
        price_list: parsearPrecio(variante.precio),
        price_sale: parsearPrecio(variante.precio_desc),
        stock: 0,
        is_active: true,
        is_default: false
      };
      
      const { error } = await supabase
        .from('product_variants')
        .insert(nuevaVariante);
      
      if (error) {
        console.error(`   ❌ Error creando AIKON ${variante.codigo_aikon}: ${error.message}`);
        errores++;
      } else {
        console.log(`   ✅ Variante creada: ${variante.medida} (AIKON: ${variante.codigo_aikon})`);
        creadas++;
      }
    } catch (error) {
      console.error(`   ❌ Excepción: ${error.message}`);
      errores++;
    }
  }
  
  return { creadas, errores, omitidas };
}

async function main() {
  console.log('🚀 Recreando variantes perdidas durante la consolidación\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  let totalCreadas = 0;
  let totalErrores = 0;
  let totalOmitidas = 0;
  
  for (const grupo of variantesARecrear) {
    const resultado = await recrearVariantes(grupo);
    totalCreadas += resultado.creadas;
    totalErrores += resultado.errores;
    totalOmitidas += resultado.omitidas;
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`Variantes creadas: ${totalCreadas}`);
  console.log(`Variantes omitidas (ya existen): ${totalOmitidas}`);
  console.log(`Errores: ${totalErrores}`);
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const success = totalErrores === 0;
  console.log(success ? '✅ Recreación completada exitosamente\n' : '⚠️  Recreación completada con errores\n');
  
  return { success, totalCreadas, totalErrores };
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

module.exports = { recrearVariantes };

