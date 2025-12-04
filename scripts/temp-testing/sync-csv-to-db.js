const fs = require('fs');

// Función para parsear el CSV
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const products = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
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
    columns.push(current);
    
    if (columns.length >= 15) {
      const product = {
        id: parseInt(columns[0]),
        name: columns[1].replace(/"/g, ''),
        brand: columns[2].replace(/"/g, ''),
        category: columns[3].replace(/"/g, ''),
        slug: columns[4].replace(/"/g, ''),
        description: columns[5].replace(/"/g, ''),
        price: parseFloat(columns[6]) || 0,
        discountPrice: parseFloat(columns[7]) || null,
        stock: parseInt(columns[8]) || 0,
        active: columns[9] === 'TRUE',
        codigoAikon: columns[10].replace(/"/g, ''),
        color: columns[11].replace(/"/g, ''),
        medida: columns[12].replace(/"/g, ''),
        terminacion: columns[13].replace(/"/g, ''),
        imageUrl: columns[14].trim()
      };
      
      if (product.imageUrl && product.imageUrl !== 'NULL') {
        products.push(product);
      }
    }
  }
  
  return products;
}

// Función principal
async function syncCSVToDB() {
  try {
    console.log('Iniciando sincronización CSV -> Base de datos...');
    
    // Leer el CSV
    const csvContent = fs.readFileSync('productos_pinteya.csv', 'utf-8');
    const csvProducts = parseCSV(csvContent);
    
    console.log(`Productos encontrados en CSV: ${csvProducts.length}`);
    
    // Obtener productos de la base de datos
    const dbProducts = [
      {"id":1,"name":"Pincel Persianero","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n10-galgo.jpg"]},
      {"id":2,"name":"Pincel Persianero","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n15-galgo.jpg"]},
      {"id":3,"name":"Pincel Persianero","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n20-galgo.jpg"]},
      {"id":4,"name":"Pincel Persianero","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n25-galgo.jpg"]},
      {"id":5,"name":"Pincel Persianero","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n30-galgo.jpg"]},
      {"id":6,"name":"Rodillo 22cm Lanar Elefante","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/rodillo-22cm-lanar-elefante-galgo.jpg"]},
      {"id":7,"name":"Plavipint Techos Poliuretánico","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/plavipint-techos-poliuretanico-10l-plavicon.jpg"]},
      {"id":8,"name":"Plavipint Techos Poliuretánico","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/plavipint-techos-poliuretanico-20l-plavicon.jpg"]},
      {"id":9,"name":"Membrana Performa","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/membrana-performa-20l-plavicon.jpg"]},
      {"id":10,"name":"Látex Frentes","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-4l-plavicon.jpg"]},
      {"id":11,"name":"Látex Frentes","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-10l-plavicon.jpg"]},
      {"id":12,"name":"Látex Frentes","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-20l-plavicon.jpg"]},
      {"id":13,"name":"Látex Interior","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-interior-4l-plavicon.jpg"]},
      {"id":14,"name":"Látex Interior","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-interior-10l-plavicon.jpg"]},
      {"id":15,"name":"Látex Interior","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-interior-20l-plavicon.jpg"]},
      {"id":16,"name":"Cielorraso","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-1l-plavicon.jpg"]},
      {"id":17,"name":"Cielorraso","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-4l-plavicon.jpg"]},
      {"id":18,"name":"Cielorraso","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-10l-plavicon.jpg"]},
      {"id":19,"name":"Cielorraso","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-20l-plavicon.jpg"]},
      {"id":20,"name":"Látex Muros","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-muros-4l-plavicon.jpg"]},
      {"id":21,"name":"Látex Muros","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-muros-10l-plavicon.jpg"]},
      {"id":22,"name":"Látex Muros","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-muros-20l-plavicon.jpg"]},
      {"id":23,"name":"Recuplast Interior","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-1l-sinteplast.jpg"]},
      {"id":24,"name":"Recuplast Interior","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-4l-sinteplast.jpg"]},
      {"id":25,"name":"Recuplast Interior","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-10l-sinteplast.jpg"]},
      {"id":26,"name":"Recuplast Interior","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-20l-sinteplast.jpg"]},
      {"id":27,"name":"Recuplast Baño y Cocina Antihumedad","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg"]},
      {"id":28,"name":"Recuplast Baño y Cocina Antihumedad","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-4l-sinteplast.jpg"]},
      {"id":29,"name":"Poximix Interior","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-05kg-poxipol.png"]},
      {"id":30,"name":"Poximix Interior","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-05kg-poxipol.png"]},
      {"id":31,"name":"Poximix Interior","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-05kg-poxipol.png"]},
      {"id":32,"name":"Poximix Interior","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-05kg-poxipol.png"]},
      {"id":33,"name":"Barniz Campbell","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-1l-petrilac.jpg"]},
      {"id":34,"name":"Sintético Converlux","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-1l-petrilac.jpg"]},
      {"id":35,"name":"Impregnante Danzke 1L Brillante","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-1l-petrilac.jpg"]},
      {"id":36,"name":"Recuplast Frentes","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg"]},
      {"id":37,"name":"Barniz Campbell","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-4l-petrilac.jpg"]},
      {"id":38,"name":"Sintético Converlux","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.jpg"]},
      {"id":39,"name":"Recuplast Frentes","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg"]},
      {"id":40,"name":"Recuplast Frentes","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg"]},
      {"id":41,"name":"Recuplast Frentes","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg"]},
      {"id":42,"name":"Recuplast Frentes","images":["https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg"]}
    ];
    
    console.log(`Productos encontrados en BD: ${dbProducts.length}`);
    
    // Crear mapas para comparación
    const csvUrlMap = new Map();
    csvProducts.forEach(product => {
      csvUrlMap.set(product.id, product.imageUrl);
    });
    
    const dbUrlMap = new Map();
    dbProducts.forEach(product => {
      if (product.images && product.images.length > 0) {
        dbUrlMap.set(product.id, product.images[0]);
      }
    });
    
    // Encontrar discrepancias
    const missingInDB = [];
    const differentUrls = [];
    const correctUrls = [];
    
    csvProducts.forEach(csvProduct => {
      const dbUrl = dbUrlMap.get(csvProduct.id);
      
      if (!dbUrl) {
        missingInDB.push({
          id: csvProduct.id,
          name: csvProduct.name,
          csvUrl: csvProduct.imageUrl
        });
      } else if (dbUrl !== csvProduct.imageUrl) {
        differentUrls.push({
          id: csvProduct.id,
          name: csvProduct.name,
          csvUrl: csvProduct.imageUrl,
          dbUrl: dbUrl
        });
      } else {
        correctUrls.push({
          id: csvProduct.id,
          name: csvProduct.name,
          url: csvProduct.imageUrl
        });
      }
    });
    
    // Productos en BD que no están en CSV
    const extraInDB = [];
    dbProducts.forEach(dbProduct => {
      if (!csvUrlMap.has(dbProduct.id)) {
        extraInDB.push({
          id: dbProduct.id,
          name: dbProduct.name,
          dbUrl: dbProduct.images[0]
        });
      }
    });
    
    // Generar reporte
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalCSVProducts: csvProducts.length,
        totalDBProducts: dbProducts.length,
        correctUrls: correctUrls.length,
        missingInDB: missingInDB.length,
        differentUrls: differentUrls.length,
        extraInDB: extraInDB.length
      },
      details: {
        correctUrls,
        missingInDB,
        differentUrls,
        extraInDB
      }
    };
    
    // Guardar reporte
    fs.writeFileSync('sync-analysis-report.json', JSON.stringify(report, null, 2));
    
    console.log('\n=== REPORTE DE SINCRONIZACIÓN ===');
    console.log(`Total productos CSV: ${report.summary.totalCSVProducts}`);
    console.log(`Total productos BD: ${report.summary.totalDBProducts}`);
    console.log(`URLs correctas: ${report.summary.correctUrls}`);
    console.log(`Faltantes en BD: ${report.summary.missingInDB}`);
    console.log(`URLs diferentes: ${report.summary.differentUrls}`);
    console.log(`Extra en BD: ${report.summary.extraInDB}`);
    
    if (missingInDB.length > 0) {
      console.log('\n--- PRODUCTOS FALTANTES EN BD ---');
      missingInDB.forEach(product => {
        console.log(`ID ${product.id}: ${product.name}`);
        console.log(`  URL: ${product.csvUrl}`);
      });
    }
    
    if (differentUrls.length > 0) {
      console.log('\n--- URLs DIFERENTES ---');
      differentUrls.forEach(product => {
        console.log(`ID ${product.id}: ${product.name}`);
        console.log(`  CSV: ${product.csvUrl}`);
        console.log(`  BD:  ${product.dbUrl}`);
      });
    }
    
    console.log('\nReporte guardado en: sync-analysis-report.json');
    
  } catch (error) {
    console.error('Error en sincronización:', error);
  }
}

// Ejecutar
syncCSVToDB();