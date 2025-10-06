const fs = require('fs');

// Leer el CSV
const csvContent = fs.readFileSync('productos_pinteya.csv', 'utf-8');
const lines = csvContent.split('\n');

console.log('Total de líneas en CSV:', lines.length);
console.log('Header:', lines[0]);

// Extraer URLs de imagen (columna 15, índice 14)
const csvUrls = [];
const products = [];

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
  columns.push(current);
  
  if (columns.length >= 15) {
    const id = parseInt(columns[0]);
    const name = columns[1];
    const imageUrl = columns[14].trim();
    
    if (imageUrl && imageUrl !== 'NULL') {
      csvUrls.push(imageUrl);
      products.push({ id, name, imageUrl });
    }
  }
}

console.log('\nURLs encontradas en CSV:', csvUrls.length);
console.log('\nPrimeros 5 productos:');
products.slice(0, 5).forEach((product, i) => {
  console.log(`${i+1}. ID: ${product.id}, Nombre: ${product.name}`);
  console.log(`   URL: ${product.imageUrl}`);
});

// Guardar todas las URLs para comparación
fs.writeFileSync('csv-urls.json', JSON.stringify(csvUrls, null, 2));
console.log('\nURLs guardadas en csv-urls.json');