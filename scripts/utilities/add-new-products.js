// ===================================
// SCRIPT PARA AGREGAR 68 PRODUCTOS NUEVOS
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

// Mapeo de categorías (nombre → ID)
// IDs reales de la BD: 33=Reparaciones, 35=Techos, 37=Piscinas, 38=Paredes, 39=Metales y Maderas, 40=Complementos, 41=Antihumedad, 42=Pisos
const CATEGORIAS = {
  'PAREDES, COMPLEMENTOS': 38,
  'TECHOS, PAREDES': 35,
  'PISOS': 42,
  'PAREDES, TECHOS': 38,
  'MADERAS Y METALES, PISOS, PAREDES': 39,
  'MADERAS Y METALES, PAREDES': 39,
  'PISOS, MADERAS Y METALES, PAREDES': 42,
  'MADERAS Y METALES': 39,
  'COMPLEMENTOS, METALES Y MADERAS': 40,
  'COMPLEMENTOS, PAREDES, TECHOS, PISOS': 40,
  'COMPLEMENTOS, PAREDES, TECHOS, PISOS, METALES Y MADERAS': 40,
  'COMPLEMENTOS, PAREDES, TECHOS': 40,
  'PISOS, PAREDES': 42
};

// Función para normalizar color (manejar casos especiales)
function normalizarColor(colorTexto) {
  if (!colorTexto || colorTexto === '-') return null;
  
  const mapeoColores = {
    'V CLARO': 'VERDE CLARO',
    'V OSCURO': 'VERDE OSCURO',
    'V MANZANA': 'VERDE MANZANA',
    'V CEMENTO': 'VERDE CEMENTO',
    'CEMENTO': 'VERDE CEMENTO',
    'ROBLE OSC': 'ROBLE OSCURO',
    'ROBLE CLA': 'ROBLE CLARO'
  };
  
  return mapeoColores[colorTexto] || colorTexto;
}

// Función para parsear códigos AIKON múltiples
// Formato: "ROJO 119, VERDE 123, AZUL 3338"
function parsearCodigosAikon(codigoTexto) {
  if (!codigoTexto || codigoTexto === '-') return [];
  
  const partes = codigoTexto.split(',').map(p => p.trim());
  const variantes = [];
  
  for (const parte of partes) {
    // Extraer color y código
    const match = parte.match(/^(.+?)\s+(\d+)$/);
    if (match) {
      const color = normalizarColor(match[1].trim());
      const codigo = match[2].trim();
      variantes.push({ color, codigo });
    } else {
      // Solo es un número
      if (/^\d+$/.test(parte)) {
        variantes.push({ color: null, codigo: parte });
      }
    }
  }
  
  return variantes;
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

// Función para parsear precio
function parsearPrecio(precioStr) {
  if (!precioStr) return null;
  const cleaned = precioStr.toString().replace(/[,\s]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

// Datos de los 68 productos nuevos
const productosNuevos = [
  { nombre: 'IMPRIMACION 4L', marca: 'MAS COLOR', categoria: 'PAREDES, COMPLEMENTOS', precio: 26394, precio_desc: 18475.80, codigo_aikon: '22', medida: '4L' },
  { nombre: 'IMPRIMACION 10L', marca: 'MAS COLOR', categoria: 'PAREDES, COMPLEMENTOS', precio: 62441, precio_desc: 43708.70, codigo_aikon: '23', medida: '10L' },
  { nombre: 'IMPRIMACION 20L', marca: 'MAS COLOR', categoria: 'PAREDES, COMPLEMENTOS', precio: 120428, precio_desc: 84299.60, codigo_aikon: '24', medida: '20L' },
  { nombre: 'MEMBRANA PREMIUM 4KG', marca: 'MAS COLOR', categoria: 'TECHOS, PAREDES', precio: 30666, precio_desc: 21466.20, codigo_aikon: '1702', medida: '4KG' },
  { nombre: 'MEMBRANA PREMIUM 10KG', marca: 'MAS COLOR', categoria: 'TECHOS, PAREDES', precio: 72680, precio_desc: 50876.00, codigo_aikon: '1703', medida: '10KG' },
  { nombre: 'MEMBRANA PREMIUM 20KG', marca: 'MAS COLOR', categoria: 'TECHOS, PAREDES', precio: 140324, precio_desc: 98226.80, codigo_aikon: '1704', medida: '20KG' },
  
  // CUBIERTA PISO DEPORTIVO - múltiples colores
  { nombre: 'CUBIERTA PISO DEPORTIVO 1L', marca: 'MAS COLOR', categoria: 'PISOS', precio: 13714, precio_desc: 9599.80, codigo_aikon: 'ROJO 119, VERDE 123, AZUL 3338, GRIS 3342, NEGRO 3346', medida: '1L' },
  { nombre: 'CUBIERTA PISO DEPORTIVO 4L', marca: 'MAS COLOR', categoria: 'PISOS', precio: 49319, precio_desc: 34523.30, codigo_aikon: 'ROJO 120, VERDE 124, AZUL 3339, GRIS 3343, NEGRO 3347', medida: '4L' },
  { nombre: 'CUBIERTA PISO DEPORTIVO 10L', marca: 'MAS COLOR', categoria: 'PISOS', precio: 118995, precio_desc: 83296.50, codigo_aikon: 'ROJO 121, VERDE 125, AZUL 3340, GRIS 3344, NEGRO 3348', medida: '10L' },
  { nombre: 'CUBIERTA PISO DEPORTIVO 20L', marca: 'MAS COLOR', categoria: 'PISOS', precio: 232320, precio_desc: 162624.00, codigo_aikon: 'ROJO 122, VERDE 126, AZUL 3341, GRIS 3345, NEGRO 3349', medida: '20L' },
  
  // CIELORRASO
  { nombre: 'CIELORRASO 1L', marca: 'MAS COLOR', categoria: 'TECHOS, PAREDES', precio: 6881, precio_desc: 4816.70, codigo_aikon: '37', medida: '1L' },
  { nombre: 'CIELORRASO 4L', marca: 'MAS COLOR', categoria: 'TECHOS, PAREDES', precio: 22098, precio_desc: 15468.60, codigo_aikon: '38', medida: '4L' },
  { nombre: 'CIELORRASO 10L', marca: 'MAS COLOR', categoria: 'TECHOS, PAREDES', precio: 51222, precio_desc: 35855.40, codigo_aikon: '39', medida: '10L' },
  { nombre: 'CIELORRASO 20L', marca: 'MAS COLOR', categoria: 'TECHOS, PAREDES', precio: 97485, precio_desc: 68239.50, codigo_aikon: '40', medida: '20L' },
  
  // LATEX PREMIUM LAVABLE
  { nombre: 'LATEX PREMIUM LAVABLE 1L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 9104, precio_desc: 6372.80, codigo_aikon: '67', medida: '1L' },
  { nombre: 'LATEX PREMIUM LAVABLE 4L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 30999, precio_desc: 21699.30, codigo_aikon: '68', medida: '4L' },
  { nombre: 'LATEX PREMIUM LAVABLE 10L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 73415, precio_desc: 51390.50, codigo_aikon: '69', medida: '10L' },
  { nombre: 'LATEX PREMIUM LAVABLE 20L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 141667, precio_desc: 99166.90, codigo_aikon: '70', medida: '20L' },
  
  // LATEX PREMIUM INTERIOR
  { nombre: 'LATEX PREMIUM INTERIOR 1L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 7303, precio_desc: 5112.10, codigo_aikon: '51', medida: '1L' },
  { nombre: 'LATEX PREMIUM INTERIOR 4L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 23807, precio_desc: 16664.90, codigo_aikon: '52', medida: '4L' },
  { nombre: 'LATEX PREMIUM INTERIOR 10L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 55495, precio_desc: 38846.50, codigo_aikon: '53', medida: '10L' },
  { nombre: 'LATEX PREMIUM INTERIOR 20L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 106009, precio_desc: 74206.30, codigo_aikon: '54', medida: '20L' },
  
  // LATEX PREMIUM EXTERIOR
  { nombre: 'LATEX PREMIUM EXTERIOR 1L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 7884, precio_desc: 5518.80, codigo_aikon: '55', medida: '1L' },
  { nombre: 'LATEX PREMIUM EXTERIOR 4L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 26096, precio_desc: 18267.20, codigo_aikon: '56', medida: '4L' },
  { nombre: 'LATEX PREMIUM EXTERIOR 10L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 61180, precio_desc: 42826.00, codigo_aikon: '57', medida: '10L' },
  { nombre: 'LATEX PREMIUM EXTERIOR 20L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 117301, precio_desc: 82110.70, codigo_aikon: '58', medida: '20L' },
  
  // LATEX PREMIUM INT EXT COLORES - múltiples colores
  { nombre: 'LATEX PREMIUM INT EXT 1L COLORES', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 10800, precio_desc: 7560.00, codigo_aikon: 'AMARILLO 75, AZUL 79, BERMELLON 83, NARANJA 87, CELESTE 91, OCRE 95, TEJA 99, V MANZANA 103, V CEMENTO 107, NEGRO 111, CHOCOLATE 115', medida: '1L' },
  { nombre: 'LATEX PREMIUM INT EXT 4L COLORES', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 37904, precio_desc: 26532.80, codigo_aikon: 'AMARILLO 76, AZUL 80, BERMELLON 84, NARANJA 88, CELESTE 92, OCRE 96, TEJA 100, V MANZANA 104, V CEMENTO 108, NEGRO 112, CHOCOLATE 116', medida: '4L' },
  { nombre: 'LATEX PREMIUM INT EXT 10L COLORES', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 90714, precio_desc: 63499.80, codigo_aikon: 'AMARILLO 77, AZUL 81, BERMELLON 85, NARANJA 89, CELESTE 93, OCRE 97, TEJA 101, V MANZANA 105, V CEMENTO 109, NEGRO 113, CHOCOLATE 117', medida: '10L' },
  { nombre: 'LATEX PREMIUM INT EXT 20L COLORES', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 176218, precio_desc: 123352.60, codigo_aikon: 'AMARILLO 78, AZUL 82, BERMELLON 86, NARANJA 90, CELESTE 94, OCRE 98, TEJA 102, V MANZANA 106, V CEMENTO 110, NEGRO 114, CHOCOLATE 118', medida: '20L' },
  
  // BARNIZ Y ESMALTE
  { nombre: 'BARNIZ AL AGUA 1L', marca: 'MAS COLOR', categoria: 'MADERAS Y METALES, PISOS, PAREDES', precio: 12361, precio_desc: 8652.70, codigo_aikon: '143', medida: '1L' },
  { nombre: 'BARNIZ AL AGUA 4L', marca: 'MAS COLOR', categoria: 'MADERAS Y METALES, PISOS, PAREDES', precio: 42789, precio_desc: 29952.30, codigo_aikon: '144', medida: '4L' },
  { nombre: 'ESMALTE AL AGUA 1L', marca: 'MAS COLOR', categoria: 'MADERAS Y METALES, PAREDES', precio: 15387, precio_desc: 10770.90, codigo_aikon: '141', medida: '1L' },
  { nombre: 'ESMALTE AL AGUA 4L', marca: 'MAS COLOR', categoria: 'MADERAS Y METALES, PAREDES', precio: 54891, precio_desc: 38423.70, codigo_aikon: '142', medida: '4L' },
  { nombre: 'HIDROLACA POLIURETANICA PISOS 1L', marca: 'MAS COLOR', categoria: 'PISOS, MADERAS Y METALES, PAREDES', precio: 25610, precio_desc: 17927.00, codigo_aikon: '1993', medida: '1L' },
  { nombre: 'HIDROLACA POLIURETANICA PISOS 4L', marca: 'MAS COLOR', categoria: 'PISOS, MADERAS Y METALES, PAREDES', precio: 96052, precio_desc: 67236.40, codigo_aikon: '1994', medida: '4L' },
  
  // BARNIZ NEW HOUSE
  { nombre: 'BARNIZ NEW HOUSE BRILLANTE 1L', marca: 'MAS COLOR', categoria: 'MADERAS Y METALES', precio: 10194, precio_desc: 7135.80, codigo_aikon: '3323', medida: '1L' },
  { nombre: 'BARNIZ NEW HOUSE BRILLANTE 4L', marca: 'MAS COLOR', categoria: 'MADERAS Y METALES', precio: 36816, precio_desc: 25771.20, codigo_aikon: '3324', medida: '4L' },
  
  // IMPREGNANTE NEW HOUSE - múltiples colores
  { nombre: 'IMPREGNANTE NEW HOUSE BRILLANTE 1L', marca: 'MAS COLOR', categoria: 'MADERAS Y METALES', precio: 12735, precio_desc: 8914.50, codigo_aikon: 'ROBLE OSC 3258, ROBLE CLA 3263, NATURAL 3268, CRISTAL 3273, CEDRO 3278, NOGAL 3283, WENGUE 3288, CAOBA 3355', medida: '1L' },
  { nombre: 'IMPREGNANTE NEW HOUSE BRILLANTE 4L', marca: 'MAS COLOR', categoria: 'MADERAS Y METALES', precio: 47063, precio_desc: 32944.10, codigo_aikon: 'ROBLE OSC 3259, ROBLE CLA 3264, NATURAL 3269, CRISTAL 3274, CEDRO 3279, NOGAL 3284, WENGUE 3289, CAOBA 3356', medida: '4L' },
  { nombre: 'IMPREGNANTE NEW HOUSE SATINADO 1L', marca: 'MAS COLOR', categoria: 'MADERAS Y METALES', precio: 14162, precio_desc: 9913.40, codigo_aikon: 'CAOBA 3218, CRISTAL 3223, NATURAL 3228, CEDRO 3233, NOGAL 3238, WENGUE 3243, ROBLE CLA 3248, ROBLE OSC 3253', medida: '1L' },
  { nombre: 'IMPREGNANTE NEW HOUSE SATINADO 4L', marca: 'MAS COLOR', categoria: 'MADERAS Y METALES', precio: 52484, precio_desc: 36738.80, codigo_aikon: 'CAOBA 3219, CRISTAL 3224, NATURAL 3229, CEDRO 3234, NOGAL 3239, WENGUE 3244, ROBLE CLA 3249, ROBLE OSC 3254', medida: '4L' },
  
  // LATEX EXPRESSION
  { nombre: 'LATEX EXPRESSION INTERIOR 1L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 5817, precio_desc: 4071.90, codigo_aikon: '1', medida: '1L' },
  { nombre: 'LATEX EXPRESSION INTERIOR 4L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 18114, precio_desc: 12679.80, codigo_aikon: '2', medida: '4L' },
  { nombre: 'LATEX EXPRESSION INTERIOR 10L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 41484, precio_desc: 29038.80, codigo_aikon: '3', medida: '10L' },
  { nombre: 'LATEX EXPRESSION INTERIOR 20L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 78324, precio_desc: 54826.80, codigo_aikon: '4', medida: '20L' },
  { nombre: 'LATEX EXPRESSION EXTERIOR 1L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 6080, precio_desc: 4256.00, codigo_aikon: '5', medida: '1L' },
  { nombre: 'LATEX EXPRESSION EXTERIOR 4L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 19195, precio_desc: 13436.50, codigo_aikon: '6', medida: '4L' },
  { nombre: 'LATEX EXPRESSION EXTERIOR 10L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 44199, precio_desc: 30939.30, codigo_aikon: '7', medida: '10L' },
  { nombre: 'LATEX EXPRESSION EXTERIOR 20L', marca: 'MAS COLOR', categoria: 'PAREDES, TECHOS', precio: 83753, precio_desc: 58627.10, codigo_aikon: '8', medida: '20L' },
  
  // MICROCEMENTO - múltiples colores
  { nombre: 'MICROCEMENTO FACIL FIX 20KG', marca: 'MAS COLOR', categoria: 'PISOS, PAREDES', precio: 100790, precio_desc: 70553.00, codigo_aikon: 'MARFIL 1989, ARENA 1990, GRIS 1991, ROJO 1992', medida: '20KG' },
  { nombre: 'MICROCEMENTO FACIL FIX 4KG', marca: 'MAS COLOR', categoria: 'PISOS, PAREDES', precio: 25657, precio_desc: 17959.90, codigo_aikon: 'MARFIL 3139, ARENA 3350, GRIS 3351, ROJO 3352', medida: '4KG' },
  
  // ENTONADORES - múltiples colores
  { nombre: 'ENTONADORES 30CC', marca: 'MAS COLOR', categoria: 'COMPLEMENTOS, PAREDES, TECHOS', precio: 1734, precio_desc: 1213.80, codigo_aikon: 'SIENA 4309, V CLARO 4310, NEGRO 4306, VIOLETA 3882, BERMELLON 4305, OCRE 4307, AMARILLO 3585, MARRON 3586, V OSCURO 3591, NARANJA 3670, AZUL 3671', medida: '30CC' },
  { nombre: 'ENTONADORES 120CC', marca: 'MAS COLOR', categoria: 'COMPLEMENTOS, PAREDES, TECHOS', precio: 3572, precio_desc: 2500.40, codigo_aikon: 'AMARILLO 4139, AZUL 4419, BERMELLON 4416, CEDRO 4417, MARRON 4418, NARANJA 4105, NEGRO 3949, OCRE 4140, SIENA 4415, V CLARO 4141, V OSCURO 4142, VIOLETA 4420', medida: '120CC' },
  
  // RODILLOS Y PINCELETAS El Galgo
  { nombre: 'RODILLO GOLD FLOCK N7', marca: 'EL GALGO', categoria: 'COMPLEMENTOS, METALES Y MADERAS', precio: 6337, precio_desc: 4435.90, codigo_aikon: '2755', medida: 'N7' },
  { nombre: 'RODILLO GOLD FLOCK N11', marca: 'EL GALGO', categoria: 'COMPLEMENTOS, METALES Y MADERAS', precio: 7276, precio_desc: 5093.20, codigo_aikon: '2379', medida: 'N11' },
  { nombre: 'RODILLO GOLD FLOCK N16', marca: 'EL GALGO', categoria: 'COMPLEMENTOS, METALES Y MADERAS', precio: 10563, precio_desc: 7394.10, codigo_aikon: '4315', medida: 'N16' },
  { nombre: 'RODILLO MINI EPOXI N5', marca: 'EL GALGO', categoria: 'COMPLEMENTOS, METALES Y MADERAS', precio: 2566, precio_desc: 1796.20, codigo_aikon: '201', medida: 'N5' },
  { nombre: 'RODILLO MINI EPOXI N8', marca: 'EL GALGO', categoria: 'COMPLEMENTOS, METALES Y MADERAS', precio: 3201, precio_desc: 2240.70, codigo_aikon: '200', medida: 'N8' },
  { nombre: 'RODILLO MINI EPOXI N11', marca: 'EL GALGO', categoria: 'COMPLEMENTOS, METALES Y MADERAS', precio: 3787, precio_desc: 2650.90, codigo_aikon: '2090', medida: 'N11' },
  { nombre: 'RODILLO 17CM LANAR ELEFANTE', marca: 'EL GALGO', categoria: 'COMPLEMENTOS, PAREDES, TECHOS, PISOS', precio: 11452, precio_desc: 8016.40, codigo_aikon: '2061', medida: '17CM' },
  { nombre: 'PINCELETA OBRA V2 N40', marca: 'EL GALGO', categoria: 'COMPLEMENTOS, PAREDES, TECHOS, PISOS', precio: 7846, precio_desc: 5492.20, codigo_aikon: '3065', medida: 'N40' },
  { nombre: 'PINCELETA BLACK N42', marca: 'EL GALGO', categoria: 'COMPLEMENTOS, PAREDES, TECHOS, PISOS', precio: 8962, precio_desc: 6273.40, codigo_aikon: '529', medida: 'N42' },
  { nombre: 'PINCELETA BLACK N50', marca: 'EL GALGO', categoria: 'COMPLEMENTOS, PAREDES, TECHOS, PISOS', precio: 19144, precio_desc: 13400.80, codigo_aikon: '530', medida: 'N50' },
  
  // CINTA ENMASCARAR Rapifix
  { nombre: 'CINTA ENMASCARAR AZUL 18MM PINTOR', marca: 'RAPIFIX', categoria: 'COMPLEMENTOS, PAREDES, TECHOS, PISOS, METALES Y MADERAS', precio: 4096, precio_desc: 2867.20, codigo_aikon: '4526', medida: '18MM' },
  { nombre: 'CINTA ENMASCARAR AZUL 24MM PINTOR', marca: 'RAPIFIX', categoria: 'COMPLEMENTOS, PAREDES, TECHOS, PISOS, METALES Y MADERAS', precio: 4464, precio_desc: 3124.80, codigo_aikon: '4527', medida: '24MM' },
  { nombre: 'CINTA ENMASCARAR AZUL 36MM PINTOR', marca: 'RAPIFIX', categoria: 'COMPLEMENTOS, PAREDES, TECHOS, PISOS, METALES Y MADERAS', precio: 6697, precio_desc: 4687.90, codigo_aikon: '4528', medida: '36MM' },
  { nombre: 'CINTA ENMASCARAR AZUL 48MM PINTOR', marca: 'RAPIFIX', categoria: 'COMPLEMENTOS, PAREDES, TECHOS, PISOS, METALES Y MADERAS', precio: 8931, precio_desc: 6251.70, codigo_aikon: '4529', medida: '48MM' }
];

async function crearProductoConVariantes(producto) {
  try {
    console.log(`\n📦 Procesando: ${producto.nombre}`);
    
    // Parsear códigos AIKON
    const variantes = parsearCodigosAikon(producto.codigo_aikon);
    
    if (variantes.length === 0) {
      console.log('  ⚠️  No se pudieron parsear códigos AIKON');
      return { success: false, error: 'No se pudieron parsear códigos' };
    }
    
    console.log(`  Variantes detectadas: ${variantes.length}`);
    
    // Crear producto principal
    const slugProducto = generarSlug(producto.nombre);
    const categoriaId = CATEGORIAS[producto.categoria] || 40; // Default: COMPLEMENTOS (ID=40)
    
    const nuevoProducto = {
      name: producto.nombre,
      slug: slugProducto,
      brand: producto.marca,
      description: producto.nombre,
      price: parsearPrecio(producto.precio),
      discounted_price: parsearPrecio(producto.precio_desc),
      stock: 0,
      category_id: categoriaId,
      is_active: true,
      images: {}
    };
    
    const { data: productoCreado, error: errorProducto } = await supabase
      .from('products')
      .insert(nuevoProducto)
      .select()
      .single();
    
    if (errorProducto) {
      console.error(`  ❌ Error creando producto: ${errorProducto.message}`);
      return { success: false, error: errorProducto.message };
    }
    
    console.log(`  ✅ Producto creado con ID: ${productoCreado.id}`);
    
    // Crear variantes
    const variantesCreadas = [];
    for (const [index, variante] of variantes.entries()) {
      const slugVariante = generarSlug(producto.nombre, variante.color, producto.medida);
      
      const nuevaVariante = {
        product_id: productoCreado.id,
        aikon_id: variante.codigo,
        variant_slug: slugVariante,
        color_name: variante.color,
        measure: producto.medida,
        price_list: parsearPrecio(producto.precio),
        price_sale: parsearPrecio(producto.precio_desc),
        stock: 0,
        is_active: true,
        is_default: index === 0 // Primera variante es default
      };
      
      const { data: varianteCreada, error: errorVariante } = await supabase
        .from('product_variants')
        .insert(nuevaVariante)
        .select()
        .single();
      
      if (errorVariante) {
        console.error(`  ❌ Error creando variante ${variante.color || variante.codigo}: ${errorVariante.message}`);
      } else {
        console.log(`  ✅ Variante creada: ${variante.color || 'sin color'} (AIKON: ${variante.codigo})`);
        variantesCreadas.push(varianteCreada);
      }
    }
    
    return {
      success: true,
      producto: productoCreado,
      variantes: variantesCreadas
    };
  } catch (error) {
    console.error(`  ❌ Excepción: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Iniciando creación de 68 productos nuevos\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const resultados = {
    exitosos: [],
    errores: []
  };
  
  for (const producto of productosNuevos) {
    const resultado = await crearProductoConVariantes(producto);
    
    if (resultado.success) {
      resultados.exitosos.push({
        nombre: producto.nombre,
        producto_id: resultado.producto.id,
        variantes_count: resultado.variantes.length
      });
    } else {
      resultados.errores.push({
        nombre: producto.nombre,
        error: resultado.error
      });
    }
  }
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN FINAL');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Productos creados: ${resultados.exitosos.length} / ${productosNuevos.length}`);
  console.log(`Errores: ${resultados.errores.length}`);
  
  if (resultados.errores.length > 0) {
    console.log('\n❌ PRODUCTOS CON ERRORES:');
    resultados.errores.forEach(e => {
      console.log(`  - ${e.nombre}: ${e.error}`);
    });
  }
  
  console.log('═══════════════════════════════════════════════════════\n');
  
  // Guardar reporte
  const reportePath = path.join(process.cwd(), 'reports', `productos-nuevos-${Date.now()}.json`);
  fs.writeFileSync(reportePath, JSON.stringify({
    fecha: new Date().toISOString(),
    total: productosNuevos.length,
    exitosos: resultados.exitosos,
    errores: resultados.errores
  }, null, 2));
  
  console.log(`📄 Reporte guardado en: ${reportePath}\n`);
  
  return resultados;
}

if (require.main === module) {
  main()
    .then(resultados => {
      const success = resultados.errores.length === 0;
      console.log(success ? '✅ Proceso completado exitosamente\n' : '⚠️  Proceso completado con errores\n');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { crearProductoConVariantes };

