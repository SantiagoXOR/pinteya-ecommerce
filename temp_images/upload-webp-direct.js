const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = 'https://aakzspzfulgftqlgwkpb.supabase.co';
// Usando anon key pero con configuración especial para storage público
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFha3pzcHpmdWxnZnRxbGd3a3BiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMzQxMTIsImV4cCI6MjA2NDkxMDExMn0.4f3FScXKA5xnSUekHWhtautpqejwYupPI15dJ0oatlM';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadWebPImage() {
  try {
    console.log('Iniciando subida de imagen WebP...');
    
    // Leer el archivo WebP
    const filePath = path.join(__dirname, 'recuplast-frentes.webp');
    const fileBuffer = fs.readFileSync(filePath);
    
    console.log(`Archivo leído: ${fileBuffer.length} bytes`);
    
    // Subir a Supabase Storage con configuración especial
    const fileName = `recuplast-frentes-${Date.now()}.webp`;
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, fileBuffer, {
        contentType: 'image/webp',
        upsert: false,
        cacheControl: '3600'
      });

    if (error) {
      console.error('Error al subir imagen:', error);
      return;
    }

    console.log('Imagen subida exitosamente:', data);
    
    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);
    
    console.log('URL pública:', publicUrlData.publicUrl);
    
    return {
      path: data.path,
      fullPath: data.fullPath,
      publicUrl: publicUrlData.publicUrl
    };
    
  } catch (error) {
    console.error('Error general:', error);
  }
}

// Ejecutar la función
uploadWebPImage().then(result => {
  if (result) {
    console.log('\n=== RESULTADO FINAL ===');
    console.log('Path:', result.path);
    console.log('Full Path:', result.fullPath);
    console.log('Public URL:', result.publicUrl);
  }
});