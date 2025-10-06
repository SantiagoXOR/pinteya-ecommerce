const https = require('https');
const http = require('http');

// URLs problemáticas identificadas en los logs
const problematicUrls = [
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/sinteplast/recuplast-frentes-4l-sinteplast.jpg',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/poximix/poximix-interior-25kg-poxipol.png',
  'https://aakzspzfulgftqlgwkpb.supabase.co/storage/v1/object/public/product-images/genericos/sellador-multiuso.png'
];

// Función para verificar una URL
function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        success: res.statusCode >= 200 && res.statusCode < 300
      });
    });

    req.on('error', (error) => {
      resolve({
        url,
        status: 'ERROR',
        statusText: error.message,
        success: false,
        error: error.code
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        status: 'TIMEOUT',
        statusText: 'Request timeout',
        success: false
      });
    });
  });
}

// Función principal
async function verifyUrls() {
  console.log('🔍 Verificando URLs problemáticas identificadas...\n');
  
  for (const url of problematicUrls) {
    console.log(`Verificando: ${url}`);
    const result = await checkUrl(url);
    
    if (result.success) {
      console.log(`✅ OK - Status: ${result.status}`);
    } else {
      console.log(`❌ FALLO - Status: ${result.status} - ${result.statusText}`);
      if (result.error) {
        console.log(`   Error code: ${result.error}`);
      }
      if (result.headers) {
        console.log(`   Content-Type: ${result.headers['content-type'] || 'N/A'}`);
      }
    }
    console.log('');
  }

  console.log('🔍 Verificación completada.');
}

// Ejecutar verificación
verifyUrls().catch(console.error);