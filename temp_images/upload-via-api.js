const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function uploadViaAPI() {
  try {
    console.log('Iniciando subida de imagen WebP via API...');
    
    // Leer el archivo WebP
    const filePath = path.join(__dirname, 'recuplast-frentes.webp');
    const fileBuffer = fs.readFileSync(filePath);
    
    console.log(`Archivo leído: ${fileBuffer.length} bytes`);
    
    // Crear FormData
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: 'recuplast-frentes.webp',
      contentType: 'image/webp'
    });
    
    // Subir usando la API del proyecto
    const response = await fetch('http://localhost:3000/api/admin/products/41/images', {
      method: 'POST',
      body: formData,
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer admin-token' // Placeholder para auth
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en la respuesta:', response.status, errorText);
      return;
    }
    
    const result = await response.json();
    console.log('Imagen subida exitosamente:', result);
    
    return result;
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
uploadViaAPI().then(result => {
  if (result) {
    console.log('\n=== RESULTADO FINAL ===');
    console.log('Resultado:', JSON.stringify(result, null, 2));
  }
});