// ===================================
// SCRIPT PARA RECREAR VARIANTES DE COLOR PERDIDAS
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

function parsearPrecio(precioStr) {
  if (!precioStr) return null;
  const cleaned = precioStr.toString().replace(/[,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

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

function normalizarColor(colorTexto) {
  if (!colorTexto || colorTexto === '-') return null;
  
  const mapeoColores = {
    'V CLARO': 'VERDE CLARO',
    'V OSCURO': 'VERDE OSCURO',
    'V MANZANA': 'VERDE MANZANA',
    'V CEMENTO': 'VERDE CEMENTO',
    'ROBLE OSC': 'ROBLE OSCURO',
    'ROBLE CLA': 'ROBLE CLARO'
  };
  
  return mapeoColores[colorTexto] || colorTexto;
}

// Cubierta Piso Deportivo (4 medidas x 5 colores, maestro ID 187 ya tiene 1L x 5 colores)
const cubiertaPisoDeportivo = {
  maestro_id: 187,
  nombre_base: 'Cubierta Piso Deportivo',
  variantes: [
    // 4L
    { codigo_aikon: '120', medida: '4L', color: 'ROJO', precio: 49319, precio_desc: 34523.30 },
    { codigo_aikon: '124', medida: '4L', color: 'VERDE', precio: 49319, precio_desc: 34523.30 },
    { codigo_aikon: '3339', medida: '4L', color: 'AZUL', precio: 49319, precio_desc: 34523.30 },
    { codigo_aikon: '3343', medida: '4L', color: 'GRIS', precio: 49319, precio_desc: 34523.30 },
    { codigo_aikon: '3347', medida: '4L', color: 'NEGRO', precio: 49319, precio_desc: 34523.30 },
    // 10L
    { codigo_aikon: '121', medida: '10L', color: 'ROJO', precio: 118995, precio_desc: 83296.50 },
    { codigo_aikon: '125', medida: '10L', color: 'VERDE', precio: 118995, precio_desc: 83296.50 },
    { codigo_aikon: '3340', medida: '10L', color: 'AZUL', precio: 118995, precio_desc: 83296.50 },
    { codigo_aikon: '3344', medida: '10L', color: 'GRIS', precio: 118995, precio_desc: 83296.50 },
    { codigo_aikon: '3348', medida: '10L', color: 'NEGRO', precio: 118995, precio_desc: 83296.50 },
    // 20L
    { codigo_aikon: '122', medida: '20L', color: 'ROJO', precio: 232320, precio_desc: 162624.00 },
    { codigo_aikon: '126', medida: '20L', color: 'VERDE', precio: 232320, precio_desc: 162624.00 },
    { codigo_aikon: '3341', medida: '20L', color: 'AZUL', precio: 232320, precio_desc: 162624.00 },
    { codigo_aikon: '3345', medida: '20L', color: 'GRIS', precio: 232320, precio_desc: 162624.00 },
    { codigo_aikon: '3349', medida: '20L', color: 'NEGRO', precio: 232320, precio_desc: 162624.00 }
  ]
};

// Entonadores (maestro ID 233 tiene 30CC x 11 colores, falta 120CC x 12 colores)
const entonadores120cc = {
  maestro_id: 233,
  nombre_base: 'Entonadores',
  variantes: [
    { codigo_aikon: '4139', medida: '120CC', color: 'AMARILLO', precio: 3572, precio_desc: 2500.40 },
    { codigo_aikon: '4419', medida: '120CC', color: 'AZUL', precio: 3572, precio_desc: 2500.40 },
    { codigo_aikon: '4416', medida: '120CC', color: 'BERMELLON', precio: 3572, precio_desc: 2500.40 },
    { codigo_aikon: '4417', medida: '120CC', color: 'CEDRO', precio: 3572, precio_desc: 2500.40 },
    { codigo_aikon: '4418', medida: '120CC', color: 'MARRON', precio: 3572, precio_desc: 2500.40 },
    { codigo_aikon: '4105', medida: '120CC', color: 'NARANJA', precio: 3572, precio_desc: 2500.40 },
    { codigo_aikon: '3949', medida: '120CC', color: 'NEGRO', precio: 3572, precio_desc: 2500.40 },
    { codigo_aikon: '4140', medida: '120CC', color: 'OCRE', precio: 3572, precio_desc: 2500.40 },
    { codigo_aikon: '4415', medida: '120CC', color: 'SIENA', precio: 3572, precio_desc: 2500.40 },
    { codigo_aikon: '4141', medida: '120CC', color: 'VERDE CLARO', precio: 3572, precio_desc: 2500.40 },
    { codigo_aikon: '4142', medida: '120CC', color: 'VERDE OSCURO', precio: 3572, precio_desc: 2500.40 },
    { codigo_aikon: '4420', medida: '120CC', color: 'VIOLETA', precio: 3572, precio_desc: 2500.40 }
  ]
};

// Impregnante New House Brillante (maestro ID 219 tiene 1L x 8 colores, falta 4L x 8 colores)
const impregnanteNewHouseBrillante4L = {
  maestro_id: 219,
  nombre_base: 'Impregnante New House Brillante',
  variantes: [
    { codigo_aikon: '3259', medida: '4L', color: 'ROBLE OSCURO', precio: 47063, precio_desc: 32944.10 },
    { codigo_aikon: '3264', medida: '4L', color: 'ROBLE CLARO', precio: 47063, precio_desc: 32944.10 },
    { codigo_aikon: '3269', medida: '4L', color: 'NATURAL', precio: 47063, precio_desc: 32944.10 },
    { codigo_aikon: '3274', medida: '4L', color: 'CRISTAL', precio: 47063, precio_desc: 32944.10 },
    { codigo_aikon: '3279', medida: '4L', color: 'CEDRO', precio: 47063, precio_desc: 32944.10 },
    { codigo_aikon: '3284', medida: '4L', color: 'NOGAL', precio: 47063, precio_desc: 32944.10 },
    { codigo_aikon: '3289', medida: '4L', color: 'WENGUE', precio: 47063, precio_desc: 32944.10 },
    { codigo_aikon: '3356', medida: '4L', color: 'CAOBA', precio: 47063, precio_desc: 32944.10 }
  ]
};

// Impregnante New House Satinado (maestro ID 221 tiene 1L x 8 colores, falta 4L x 8 colores)
const impregnanteNewHouseSatinado4L = {
  maestro_id: 221,
  nombre_base: 'Impregnante New House Satinado',
  variantes: [
    { codigo_aikon: '3219', medida: '4L', color: 'CAOBA', precio: 52484, precio_desc: 36738.80 },
    { codigo_aikon: '3224', medida: '4L', color: 'CRISTAL', precio: 52484, precio_desc: 36738.80 },
    { codigo_aikon: '3229', medida: '4L', color: 'NATURAL', precio: 52484, precio_desc: 36738.80 },
    { codigo_aikon: '3234', medida: '4L', color: 'CEDRO', precio: 52484, precio_desc: 36738.80 },
    { codigo_aikon: '3239', medida: '4L', color: 'NOGAL', precio: 52484, precio_desc: 36738.80 },
    { codigo_aikon: '3244', medida: '4L', color: 'WENGUE', precio: 52484, precio_desc: 36738.80 },
    { codigo_aikon: '3249', medida: '4L', color: 'ROBLE CLARO', precio: 52484, precio_desc: 36738.80 },
    { codigo_aikon: '3254', medida: '4L', color: 'ROBLE OSCURO', precio: 52484, precio_desc: 36738.80 }
  ]
};

// Microcemento Facil Fix (maestro ID 231 tiene 20KG x 4 colores, falta 4KG x 4 colores)
const microcemento4KG = {
  maestro_id: 231,
  nombre_base: 'Microcemento Facil Fix',
  variantes: [
    { codigo_aikon: '3139', medida: '4KG', color: 'MARFIL', precio: 25657, precio_desc: 17959.90 },
    { codigo_aikon: '3350', medida: '4KG', color: 'ARENA', precio: 25657, precio_desc: 17959.90 },
    { codigo_aikon: '3351', medida: '4KG', color: 'GRIS', precio: 25657, precio_desc: 17959.90 },
    { codigo_aikon: '3352', medida: '4KG', color: 'ROJO', precio: 25657, precio_desc: 17959.90 }
  ]
};

const gruposConColores = [
  cubiertaPisoDeportivo,
  entonadores120cc,
  impregnanteNewHouseBrillante4L,
  impregnanteNewHouseSatinado4L,
  microcemento4KG
];

async function recrearVariante(maestro_id, nombreBase, variante) {
  try {
    // Verificar si ya existe
    const { data: existente } = await supabase
      .from('product_variants')
      .select('id')
      .eq('aikon_id', variante.codigo_aikon)
      .maybeSingle();
    
    if (existente) {
      return { omitida: true };
    }
    
    // Crear variante
    const nuevaVariante = {
      product_id: maestro_id,
      aikon_id: variante.codigo_aikon,
      variant_slug: generarSlug(nombreBase, variante.color, variante.medida),
      color_name: normalizarColor(variante.color),
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
      console.error(`   ❌ Error: ${error.message}`);
      return { error: error.message };
    }
    
    console.log(`   ✅ ${variante.color} ${variante.medida} (AIKON: ${variante.codigo_aikon})`);
    return { creada: true };
  } catch (error) {
    console.error(`   ❌ Excepción: ${error.message}`);
    return { error: error.message };
  }
}

async function main() {
  console.log('🚀 Recreando variantes de color perdidas\n');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  let totalCreadas = 0;
  let totalOmitidas = 0;
  let totalErrores = 0;
  
  for (const grupo of gruposConColores) {
    console.log(`\n📦 ${grupo.nombre_base} (ID: ${grupo.maestro_id})`);
    console.log(`   Variantes a recrear: ${grupo.variantes.length}\n`);
    
    for (const variante of grupo.variantes) {
      const resultado = await recrearVariante(grupo.maestro_id, grupo.nombre_base, variante);
      
      if (resultado.creada) {
        totalCreadas++;
      } else if (resultado.omitida) {
        totalOmitidas++;
      } else if (resultado.error) {
        totalErrores++;
      }
    }
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
  
  return { success, totalCreadas };
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

