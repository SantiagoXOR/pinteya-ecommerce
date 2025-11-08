// ===================================
// SCRIPT DE VERIFICACIÓN DE PRODUCTOS CSV VS BASE DE DATOS
// ===================================

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local') });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Función para parsear precios del CSV (formato: "2,491.00")
function parsePrice(priceStr) {
  if (!priceStr || priceStr === '-') return null;
  // Remover comillas, espacios y convertir
  const cleaned = priceStr.toString().replace(/["'\s]/g, '').replace(',', '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

// Función para parsear el CSV manualmente
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const products = [];
  
  // La última línea es el encabezado (línea 210)
  const headerLine = lines[lines.length - 1];
  const headers = headerLine.split(',').map(h => h.trim());
  
  // Parsear cada línea de producto (desde línea 1 hasta 172)
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('ID,')) continue;
    
    // Dividir por comas, pero respetando valores entre comillas
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    // Crear objeto producto
    const product = {
      id: values[0],
      nombre: values[1],
      slug: values[2],
      marca: values[3],
      categoria_id: values[4],
      categoria: values[5],
      categoria_slug: values[6],
      precio: parsePrice(values[7]),
      precio_descuento: parsePrice(values[8]),
      stock: values[9] ? parseInt(values[9]) : null,
      activo: values[10] === 'TRUE',
      descripcion: values[11],
      imagen: values[12],
      codigo_aikon: values[13],
      color: values[14],
      medida: values[15]
    };
    
    // Solo agregar si tiene código AIKON válido
    if (product.codigo_aikon && product.codigo_aikon !== '-' && product.nombre) {
      products.push(product);
    }
  }
  
  return products;
}

// Función para obtener todas las variantes de la BD
async function getVariantsFromDB() {
  console.log('📊 Consultando variantes en la base de datos...');
  
  const { data, error } = await supabase
    .from('product_variants')
    .select('*');
  
  if (error) {
    console.error('❌ Error consultando variantes:', error.message);
    return [];
  }
  
  console.log(`✅ Se encontraron ${data.length} variantes en la BD`);
  return data;
}

// Función para obtener productos principales de la BD
async function getProductsFromDB() {
  console.log('📊 Consultando productos en la base de datos...');
  
  const { data, error } = await supabase
    .from('products')
    .select('*');
  
  if (error) {
    console.error('❌ Error consultando productos:', error.message);
    return [];
  }
  
  console.log(`✅ Se encontraron ${data.length} productos en la BD`);
  return data;
}

// Función para comparar un producto del CSV con una variante de la BD
function compareProduct(csvProduct, dbVariant) {
  const differences = [];
  
  // Comparar precios (con tolerancia de 0.01 por redondeo)
  if (csvProduct.precio !== null && dbVariant.price_list !== null) {
    const priceDiff = Math.abs(csvProduct.precio - parseFloat(dbVariant.price_list));
    if (priceDiff > 0.01) {
      differences.push({
        field: 'Precio Lista',
        csv_value: csvProduct.precio,
        db_value: parseFloat(dbVariant.price_list),
        difference: priceDiff
      });
    }
  }
  
  if (csvProduct.precio_descuento !== null && dbVariant.price_sale !== null) {
    const priceDiff = Math.abs(csvProduct.precio_descuento - parseFloat(dbVariant.price_sale));
    if (priceDiff > 0.01) {
      differences.push({
        field: 'Precio Descuento',
        csv_value: csvProduct.precio_descuento,
        db_value: parseFloat(dbVariant.price_sale),
        difference: priceDiff
      });
    }
  }
  
  // Comparar stock
  if (csvProduct.stock !== null && dbVariant.stock !== null && csvProduct.stock !== dbVariant.stock) {
    differences.push({
      field: 'Stock',
      csv_value: csvProduct.stock,
      db_value: dbVariant.stock,
      difference: csvProduct.stock - dbVariant.stock
    });
  }
  
  // Comparar color
  if (csvProduct.color && csvProduct.color !== '-' && 
      dbVariant.color_name && csvProduct.color !== dbVariant.color_name) {
    differences.push({
      field: 'Color',
      csv_value: csvProduct.color,
      db_value: dbVariant.color_name
    });
  }
  
  // Comparar medida
  if (csvProduct.medida && csvProduct.medida !== '-' && 
      dbVariant.measure && csvProduct.medida !== dbVariant.measure) {
    differences.push({
      field: 'Medida',
      csv_value: csvProduct.medida,
      db_value: dbVariant.measure
    });
  }
  
  return differences;
}

// Función para optimizar y convertir imagen PNG a WebP
async function optimizeImageToWebP(inputPath, outputDir) {
  const filename = path.basename(inputPath, '.png');
  const outputPath = path.join(outputDir, `${filename}.webp`);
  
  try {
    await sharp(inputPath)
      .resize(1200, 1200, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 85 })
      .toFile(outputPath);
    
    const stats = fs.statSync(outputPath);
    console.log(`✅ ${filename}.webp optimizado (${(stats.size / 1024).toFixed(2)} KB)`);
    
    return outputPath;
  } catch (error) {
    console.error(`❌ Error optimizando ${filename}:`, error.message);
    return null;
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando verificación de productos CSV vs Base de Datos\n');
  
  // 1. Leer y parsear CSV
  console.log('📖 PASO 1: Leyendo CSV...');
  const csvPath = 'c:\\Users\\marti\\Desktop\\image-products\\productos_final_pinteya.xlsx - productos (2).csv';
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ No se encontró el archivo CSV en:', csvPath);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const csvProducts = parseCSV(csvContent);
  console.log(`✅ CSV parseado: ${csvProducts.length} productos encontrados\n`);
  
  // 2. Consultar base de datos
  console.log('📊 PASO 2: Consultando base de datos...');
  const dbVariants = await getVariantsFromDB();
  const dbProducts = await getProductsFromDB();
  
  // Crear mapa de código AIKON → variante
  const aikonMap = new Map();
  dbVariants.forEach(variant => {
    if (variant.aikon_id) {
      aikonMap.set(variant.aikon_id.toString(), variant);
    }
  });
  console.log(`✅ Mapa de AIKON creado: ${aikonMap.size} códigos\n`);
  
  // 3. Comparar productos
  console.log('🔍 PASO 3: Comparando productos...');
  const existingWithDifferences = [];
  const newProducts = [];
  const matchingProducts = [];
  
  csvProducts.forEach(csvProduct => {
    const aikonId = csvProduct.codigo_aikon.toString();
    const dbVariant = aikonMap.get(aikonId);
    
    if (dbVariant) {
      const differences = compareProduct(csvProduct, dbVariant);
      if (differences.length > 0) {
        existingWithDifferences.push({
          csv: csvProduct,
          db: dbVariant,
          differences
        });
      } else {
        matchingProducts.push(csvProduct);
      }
    } else {
      newProducts.push(csvProduct);
    }
  });
  
  console.log(`✅ Comparación completada:
  - Productos coincidentes: ${matchingProducts.length}
  - Productos con diferencias: ${existingWithDifferences.length}
  - Productos nuevos: ${newProducts.length}\n`);
  
  // 4. Optimizar imágenes PNG
  console.log('🖼️  PASO 4: Optimizando imágenes PNG...');
  const imageDir = 'c:\\Users\\marti\\Desktop\\image-products';
  const outputDir = path.join(imageDir, 'optimized');
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const pngImages = [
    'CINTA DE ENMASCARAR RAPIFIX.png',
    'PINCELETA BLACK EL GALGO N42.png',
    'RODILLO CUERO LANAR ELEFANTE 17CM EL GALGO.png',
    'RODILLO GOLD FLOCK.png',
    'RODILLO MINI EPOXI.png'
  ];
  
  const optimizedImages = [];
  for (const imageName of pngImages) {
    const inputPath = path.join(imageDir, imageName);
    if (fs.existsSync(inputPath)) {
      const outputPath = await optimizeImageToWebP(inputPath, outputDir);
      if (outputPath) {
        optimizedImages.push({
          original: imageName,
          optimized: path.basename(outputPath),
          path: outputPath
        });
      }
    } else {
      console.log(`⚠️  Imagen no encontrada: ${imageName}`);
    }
  }
  console.log(`✅ ${optimizedImages.length} imágenes optimizadas\n`);
  
  // 5. Preparar reporte
  console.log('📝 PASO 5: Generando reporte...\n');
  
  const report = {
    fecha: new Date().toISOString(),
    resumen: {
      total_csv: csvProducts.length,
      coincidentes: matchingProducts.length,
      con_diferencias: existingWithDifferences.length,
      nuevos: newProducts.length,
      imagenes_optimizadas: optimizedImages.length
    },
    productos_con_diferencias: existingWithDifferences.map(item => ({
      codigo_aikon: item.csv.codigo_aikon,
      nombre: item.csv.nombre,
      diferencias: item.differences
    })),
    productos_nuevos: newProducts.map(p => ({
      codigo_aikon: p.codigo_aikon,
      nombre: p.nombre,
      marca: p.marca,
      precio: p.precio,
      precio_descuento: p.precio_descuento,
      stock: p.stock,
      color: p.color,
      medida: p.medida,
      categoria: p.categoria
    })),
    imagenes_optimizadas: optimizedImages
  };
  
  // Guardar reporte
  const reportPath = path.join(process.cwd(), 'reports', `verificacion-productos-${Date.now()}.json`);
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ Reporte guardado en: ${reportPath}\n`);
  
  // Mostrar resumen en consola
  console.log('═══════════════════════════════════════════');
  console.log('📊 RESUMEN DE VERIFICACIÓN');
  console.log('═══════════════════════════════════════════');
  console.log(`Total productos en CSV: ${report.resumen.total_csv}`);
  console.log(`✅ Coincidentes (sin cambios): ${report.resumen.coincidentes}`);
  console.log(`⚠️  Con diferencias: ${report.resumen.con_diferencias}`);
  console.log(`🆕 Nuevos (no en BD): ${report.resumen.nuevos}`);
  console.log(`🖼️  Imágenes optimizadas: ${report.resumen.imagenes_optimizadas}`);
  console.log('═══════════════════════════════════════════\n');
  
  // Mostrar productos con diferencias (primeros 10)
  if (existingWithDifferences.length > 0) {
    console.log('⚠️  PRODUCTOS CON DIFERENCIAS (primeros 10):');
    console.log('─────────────────────────────────────────');
    existingWithDifferences.slice(0, 10).forEach((item, idx) => {
      console.log(`\n${idx + 1}. ${item.csv.nombre} (AIKON: ${item.csv.codigo_aikon})`);
      item.differences.forEach(diff => {
        console.log(`   - ${diff.field}: CSV=${diff.csv_value} | BD=${diff.db_value}`);
      });
    });
    if (existingWithDifferences.length > 10) {
      console.log(`\n... y ${existingWithDifferences.length - 10} más (ver reporte completo)`);
    }
    console.log('');
  }
  
  // Mostrar productos nuevos (primeros 10)
  if (newProducts.length > 0) {
    console.log('🆕 PRODUCTOS NUEVOS (primeros 10):');
    console.log('─────────────────────────────────────────');
    newProducts.slice(0, 10).forEach((product, idx) => {
      console.log(`${idx + 1}. ${product.nombre} (AIKON: ${product.codigo_aikon})`);
      console.log(`   Marca: ${product.marca} | Precio: $${product.precio} | Medida: ${product.medida}`);
    });
    if (newProducts.length > 10) {
      console.log(`\n... y ${newProducts.length - 10} más (ver reporte completo)`);
    }
    console.log('');
  }
  
  console.log('✅ Verificación completada. Revisa el reporte para detalles completos.');
  console.log(`📄 Reporte: ${reportPath}`);
  
  return { report, optimizedImages };
}

// Ejecutar
main()
  .then(({ report, optimizedImages }) => {
    console.log('\n✨ Proceso completado exitosamente');
    console.log('\n📋 PRÓXIMOS PASOS:');
    console.log('1. Revisar el reporte JSON generado');
    console.log('2. Decidir qué productos actualizar');
    console.log('3. Ejecutar script de subida de imágenes a Supabase');
    console.log('4. Actualizar/agregar productos según decisión\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Error en el proceso:', error);
    process.exit(1);
  });

