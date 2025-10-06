const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = 'https://aakzspzfulgftqlgwkpb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3pzcHpmdWxnZnRxbGd3a3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzQxMTIsImV4cCI6MjA2NDkxMDExMn0.4f3FScXKA5xnSUekHWhtautpqejwYupPI15dJ0oatlM';
const supabase = createClient(supabaseUrl, supabaseKey);

// URLs del CSV que faltan en la base de datos (según el reporte anterior)
const missingUrls = [
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-blanco-4l.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-blanco-1l.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-blanco-20l.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/petrilac-esmalte-sintetico-blanco-1l.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/petrilac-esmalte-sintetico-negro-1l.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/sinteplast-latex-interior-blanco-4l.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/sinteplast-latex-interior-blanco-1l.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/sinteplast-latex-interior-blanco-20l.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/pincel-angular-n6.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/pincel-angular-n8.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/pincel-angular-n10.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/pincel-angular-n12.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/rodillo-18cm-pelo-corto.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/rodillo-22cm-pelo-corto.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/rodillo-25cm-pelo-corto.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/bandeja-plastica-27cm.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/bandeja-plastica-30cm.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/cinta-papel-18mm.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/cinta-papel-24mm.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-plano-n2-galgo.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-plano-n4-galgo.webp',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-plano-n6-galgo.webp'
];

// Función para leer y parsear el CSV
function parseCSV() {
  const csvPath = path.join(__dirname, 'productos_pinteya.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');
  const products = [];
  
  // Saltar la primera línea (headers)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parsear CSV considerando comillas
    const columns = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        columns.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current); // Agregar la última columna
    
    if (columns.length >= 14) {
      const imageUrl = columns[13].trim();
      if (imageUrl && imageUrl !== 'NULL' && missingUrls.includes(imageUrl)) {
        products.push({
          id: parseInt(columns[0]),
          name: columns[1],
          brand: columns[2],
          category: columns[3],
          slug: columns[4],
          description: columns[5],
          price: parseFloat(columns[6]),
          discountedPrice: parseFloat(columns[7]),
          discount: parseInt(columns[8]),
          featured: columns[9] === 'Sí',
          stock: parseInt(columns[10]),
          size: columns[11] === 'NULL' ? null : columns[11],
          model: columns[12] === 'NULL' ? null : columns[12],
          imageUrl: imageUrl
        });
      }
    }
  }
  
  return products;
}

// Función para verificar si un producto ya existe en la base de datos
async function productExists(productId) {
  const { data, error } = await supabase
    .from('products')
    .select('id')
    .eq('id', productId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error(`Error verificando producto ${productId}:`, error);
    return false;
  }
  
  return !!data;
}

// Función para insertar un nuevo producto
async function insertProduct(product) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      slug: product.slug,
      description: product.description,
      price: product.price,
      discounted_price: product.discountedPrice,
      discount: product.discount,
      featured: product.featured,
      stock: product.stock,
      size: product.size,
      model: product.model,
      images: [product.imageUrl],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  
  if (error) {
    console.error(`Error insertando producto ${product.id} (${product.name}):`, error);
    return false;
  }
  
  console.log(`✅ Producto insertado: ${product.id} - ${product.name}`);
  return true;
}

// Función para actualizar las imágenes de un producto existente
async function updateProductImages(productId, newImageUrl) {
  // Primero obtener las imágenes actuales
  const { data: currentProduct, error: fetchError } = await supabase
    .from('products')
    .select('images')
    .eq('id', productId)
    .single();
  
  if (fetchError) {
    console.error(`Error obteniendo producto ${productId}:`, fetchError);
    return false;
  }
  
  // Agregar la nueva URL si no existe
  let currentImages = currentProduct.images || [];
  if (!currentImages.includes(newImageUrl)) {
    currentImages.push(newImageUrl);
    
    const { data, error } = await supabase
      .from('products')
      .update({
        images: currentImages,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);
    
    if (error) {
      console.error(`Error actualizando imágenes del producto ${productId}:`, error);
      return false;
    }
    
    console.log(`✅ Imagen agregada al producto ${productId}`);
    return true;
  } else {
    console.log(`ℹ️ Imagen ya existe en producto ${productId}`);
    return true;
  }
}

// Función principal
async function syncMissingProducts() {
  console.log('🚀 Iniciando sincronización de productos faltantes...\n');
  
  const csvProducts = parseCSV();
  console.log(`📊 Productos encontrados en CSV con URLs faltantes: ${csvProducts.length}\n`);
  
  let inserted = 0;
  let updated = 0;
  let errors = 0;
  
  for (const product of csvProducts) {
    console.log(`\n🔍 Procesando: ${product.id} - ${product.name}`);
    
    const exists = await productExists(product.id);
    
    if (exists) {
      // Producto existe, actualizar imágenes
      const success = await updateProductImages(product.id, product.imageUrl);
      if (success) {
        updated++;
      } else {
        errors++;
      }
    } else {
      // Producto no existe, insertar
      const success = await insertProduct(product);
      if (success) {
        inserted++;
      } else {
        errors++;
      }
    }
    
    // Pequeña pausa para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n📈 RESUMEN DE SINCRONIZACIÓN:');
  console.log(`✅ Productos insertados: ${inserted}`);
  console.log(`🔄 Productos actualizados: ${updated}`);
  console.log(`❌ Errores: ${errors}`);
  console.log(`📊 Total procesados: ${csvProducts.length}`);
  
  // Generar reporte detallado
  const report = {
    timestamp: new Date().toISOString(),
    totalProcessed: csvProducts.length,
    inserted: inserted,
    updated: updated,
    errors: errors,
    missingUrlsProcessed: missingUrls.length,
    success: errors === 0
  };
  
  fs.writeFileSync('sync-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Reporte guardado en: sync-report.json');
  
  if (errors === 0) {
    console.log('\n🎉 ¡Sincronización completada exitosamente!');
  } else {
    console.log(`\n⚠️ Sincronización completada con ${errors} errores.`);
  }
}

// Ejecutar el script
syncMissingProducts().catch(console.error);