// ===================================
// SCRIPT PARA PROBAR WEBHOOK DE CLERK
// ===================================

const https = require('https');

// Configuración del test
const config = {
  // Cambiar por tu dominio real cuando esté en producción
  webhookUrl: 'https://pinteya-ecommerce.vercel.app/api/webhooks/clerk',
  // Para desarrollo local: 'http://localhost:3000/api/webhooks/clerk'
};

// Datos de prueba simulando un evento de Clerk
const testPayload = {
  type: 'user.created',
  data: {
    id: 'user_test_123456789',
    email_addresses: [
      {
        id: 'email_test_123',
        email_address: 'test@pinteya.com'
      }
    ],
    first_name: 'Usuario',
    last_name: 'Prueba',
    image_url: 'https://example.com/avatar.jpg',
    created_at: Date.now(),
    updated_at: Date.now()
  }
};

// Headers simulando los de Clerk
const headers = {
  'Content-Type': 'application/json',
  'svix-id': 'msg_test_123456789',
  'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
  'svix-signature': 'v1,test_signature_here',
  'User-Agent': 'Svix-Webhooks/1.0'
};

console.log('🧪 Iniciando test del webhook de Clerk...');
console.log(`📡 URL: ${config.webhookUrl}`);
console.log(`📦 Payload:`, JSON.stringify(testPayload, null, 2));

// Función para hacer el request
function testWebhook() {
  const url = new URL(config.webhookUrl);
  const postData = JSON.stringify(testPayload);

  const options = {
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: url.pathname,
    method: 'POST',
    headers: {
      ...headers,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    console.log(`\n📊 Respuesta del servidor:`);
    console.log(`   Status: ${res.statusCode}`);
    console.log(`   Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`   Body: ${data}`);
      
      if (res.statusCode === 200) {
        console.log('\n✅ ¡Webhook funcionando correctamente!');
      } else if (res.statusCode === 400) {
        console.log('\n⚠️  Error 400 - Esto es esperado en el test (verificación de firma)');
        console.log('   El endpoint está respondiendo, pero la firma no es válida');
        console.log('   Esto es normal para un test simulado');
      } else {
        console.log(`\n❌ Error ${res.statusCode} - Revisar configuración`);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`\n❌ Error en la conexión: ${e.message}`);
    console.log('\n🔍 Posibles causas:');
    console.log('   - El servidor no está ejecutándose');
    console.log('   - La URL del webhook es incorrecta');
    console.log('   - Problemas de red/firewall');
  });

  req.write(postData);
  req.end();
}

// Ejecutar el test
testWebhook();

console.log('\n📝 Notas importantes:');
console.log('   - Un error 400 es normal en este test (verificación de firma)');
console.log('   - Un error 500 indica problema en el código del webhook');
console.log('   - Un error de conexión indica que el servidor no responde');
console.log('   - Para producción, cambiar la URL en la configuración');
