// Script para comparar URLs del CSV con las de la base de datos
const fs = require('fs');

// URLs extraídas del CSV productos_pinteya.csv
const csvUrls = [
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n10-galgo.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n15-galgo.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n20-galgo.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n25-galgo.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n30-galgo.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/rodillo-22cm-lanar-elefante-galgo.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/plavipint-techos-poliuretanico-10l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/plavipint-techos-poliuretanico-20l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/membrana-performa-20l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-4l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-10l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-20l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-interior-4l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-interior-10l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-interior-20l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-1l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-4l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-10l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-20l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-muros-4l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-muros-10l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-muros-20l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-1l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-4l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-10l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-20l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-4l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-05kg-poxipol.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-125kg-poxipol.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-3kg-poxipol.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-5kg-poxipol.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-1l-petrilac.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-1l-petrilac.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/impregnante-danzke-1l-brillante-petrilac.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-1l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-4l-petrilac.webp",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/cinta-papel-blanca-18mm.webp",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/cinta-papel-blanca-24mm.webp",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/cinta-papel-blanca-36mm.webp",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/cinta-papel-blanca-48mm.webp",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-exterior-05kg-poxipol.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-exterior-125kg-poxipol.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-exterior-3kg-poxipol.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-exterior-5kg-poxipol.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-40.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-50.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-80.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-120.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/lija-al-agua-180.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/bandeja-chata.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/pinceleta-obra.png"
];

// URLs extraídas de la base de datos
const dbUrls = [
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n10-galgo.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n15-galgo.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n20-galgo.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n25-galgo.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/pincel-persianero-n30-galgo.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/galgo/rodillo-22cm-lanar-elefante-galgo.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/plavipint-techos-poliuretanico-10l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/plavipint-techos-poliuretanico-20l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/membrana-performa-20l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-4l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-10l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-frentes-20l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-interior-4l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-interior-10l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-interior-20l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-1l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-4l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-10l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/cielorraso-20l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-muros-4l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-muros-10l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/plavicon/latex-muros-20l-plavicon.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-1l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-4l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-10l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-interior-20l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-4l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-05kg-poxipol.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-05kg-poxipol.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-05kg-poxipol.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-05kg-poxipol.png",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-1l-petrilac.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-1l-petrilac.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-1l-petrilac.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/barniz-campbell-4l-petrilac.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/petrilac/sintetico-converlux-4l-petrilac.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg",
  "https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-bano-cocina-1l-sinteplast.jpg"
];

function compareUrls() {
  console.log('=== COMPARACIÓN DE URLs CSV vs BASE DE DATOS ===\n');
  
  // Crear sets para comparación eficiente
  const csvSet = new Set(csvUrls);
  const dbSet = new Set(dbUrls);
  
  // URLs que están en CSV pero NO en BD
  const missingInDb = csvUrls.filter(url => !dbSet.has(url));
  
  // URLs que están en BD pero NO en CSV
  const missingInCsv = dbUrls.filter(url => !csvSet.has(url));
  
  // URLs que coinciden
  const matching = csvUrls.filter(url => dbSet.has(url));
  
  console.log(`📊 RESUMEN:`);
  console.log(`- URLs en CSV: ${csvUrls.length}`);
  console.log(`- URLs en BD: ${dbUrls.length}`);
  console.log(`- URLs que coinciden: ${matching.length}`);
  console.log(`- URLs faltantes en BD: ${missingInDb.length}`);
  console.log(`- URLs extra en BD: ${missingInCsv.length}\n`);
  
  if (missingInDb.length > 0) {
    console.log('❌ URLs del CSV que NO están en la base de datos:');
    missingInDb.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
    console.log('');
  }
  
  if (missingInCsv.length > 0) {
    console.log('⚠️  URLs en la base de datos que NO están en el CSV:');
    missingInCsv.forEach((url, index) => {
      console.log(`${index + 1}. ${url}`);
    });
    console.log('');
  }
  
  if (missingInDb.length === 0 && missingInCsv.length === 0) {
    console.log('✅ ¡PERFECTO! Todas las URLs del CSV están correctamente reflejadas en la base de datos.');
  } else {
    console.log('🔧 Se requieren correcciones para sincronizar completamente las URLs.');
  }
  
  // Análisis de patrones
  console.log('\n📈 ANÁLISIS DE PATRONES:');
  
  // Contar URLs por carpeta en CSV
  const csvFolders = {};
  csvUrls.forEach(url => {
    const match = url.match(/product-images\/([^\/]+)\//);
    if (match) {
      const folder = match[1];
      csvFolders[folder] = (csvFolders[folder] || 0) + 1;
    }
  });
  
  console.log('URLs por carpeta en CSV:');
  Object.entries(csvFolders).forEach(([folder, count]) => {
    console.log(`  - ${folder}: ${count} URLs`);
  });
  
  return {
    csvUrls: csvUrls.length,
    dbUrls: dbUrls.length,
    matching: matching.length,
    missingInDb: missingInDb.length,
    missingInCsv: missingInCsv.length,
    missingInDbList: missingInDb,
    missingInCsvList: missingInCsv
  };
}

// Ejecutar comparación
const result = compareUrls();

// Guardar resultado en archivo
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    csvUrls: result.csvUrls,
    dbUrls: result.dbUrls,
    matching: result.matching,
    missingInDb: result.missingInDb,
    missingInCsv: result.missingInCsv
  },
  missingInDb: result.missingInDbList,
  missingInCsv: result.missingInCsvList
};

fs.writeFileSync('url-comparison-report.json', JSON.stringify(report, null, 2));
console.log('\n📄 Reporte detallado guardado en: url-comparison-report.json');