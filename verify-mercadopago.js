// ===================================
// VERIFICACIÓN DE CREDENCIALES MERCADOPAGO
// ===================================

const { MercadoPagoConfig, Preference } = require('mercadopago');

// Credenciales actualizadas
const ACCESS_TOKEN = '[MERCADOPAGO_ACCESS_TOKEN_REMOVED]';
const PUBLIC_KEY = 'APP_USR-b989b49d-2678-43ce-a048-614769c7982c';

async function verifyCredentials() {
  console.log('🔐 Verificando credenciales de MercadoPago...');
  console.log('📋 Access Token:', ACCESS_TOKEN.substring(0, 20) + '...');
  console.log('🔑 Public Key:', PUBLIC_KEY.substring(0, 20) + '...');

  try {
    // Configurar cliente
    const client = new MercadoPagoConfig({
      accessToken: ACCESS_TOKEN,
      options: {
        timeout: 5000,
      }
    });

    const preference = new Preference(client);

    // Crear preferencia de prueba
    const testPreference = {
      items: [
        {
          id: 'test-item',
          title: 'Producto de Prueba - Pinteya',
          description: 'Pintura de prueba para verificar credenciales',
          quantity: 1,
          currency_id: 'ARS',
          unit_price: 1000,
        }
      ],
      payer: {
        name: 'Test',
        surname: 'Usuario',
        email: 'test@pinteya.com',
      },
      back_urls: {
        success: 'https://pinteya.com/success',
        failure: 'https://pinteya.com/failure',
        pending: 'https://pinteya.com/pending',
      },
      auto_return: 'approved',
      statement_descriptor: 'PINTEYA',
      external_reference: `test_${Date.now()}`,
    };

    console.log('🧪 Creando preferencia de prueba...');
    
    const response = await preference.create({ body: testPreference });

    if (response.id) {
      console.log('✅ ¡CREDENCIALES VÁLIDAS!');
      console.log('📋 Preference ID:', response.id);
      console.log('🔗 Init Point:', response.init_point);
      console.log('🏪 Sandbox Init Point:', response.sandbox_init_point);
      console.log('💰 Total Amount: $1000 ARS');
      
      return {
        success: true,
        preferenceId: response.id,
        initPoint: response.init_point,
        sandboxInitPoint: response.sandbox_init_point,
      };
    } else {
      console.log('❌ Error: No se pudo crear la preferencia');
      return { success: false, error: 'No preference ID returned' };
    }

  } catch (error) {
    console.error('❌ ERROR EN CREDENCIALES:');
    console.error('📝 Mensaje:', error.message);
    console.error('🔍 Código:', error.status || 'N/A');
    console.error('📊 Detalles:', error.cause || 'N/A');
    
    return {
      success: false,
      error: error.message,
      status: error.status,
      details: error.cause,
    };
  }
}

// Función para verificar variables de entorno
function checkEnvironmentVariables() {
  console.log('\n🔧 Verificando variables de entorno...');
  
  const requiredVars = [
    'MERCADOPAGO_ACCESS_TOKEN',
    'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY',
    'MERCADOPAGO_CLIENT_ID',
    'MERCADOPAGO_CLIENT_SECRET',
  ];

  const missing = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      console.log(`✅ ${varName}: ${process.env[varName].substring(0, 20)}...`);
    }
  });

  if (missing.length > 0) {
    console.log('❌ Variables faltantes:', missing.join(', '));
    return false;
  }

  console.log('✅ Todas las variables de entorno están configuradas');
  return true;
}

// Ejecutar verificación
async function main() {
  console.log('🚀 VERIFICACIÓN DE MERCADOPAGO - PINTEYA E-COMMERCE');
  console.log('=' .repeat(60));
  
  // Verificar variables de entorno
  const envOk = checkEnvironmentVariables();
  
  if (!envOk) {
    console.log('\n⚠️  Algunas variables de entorno no están configuradas');
    console.log('📝 Asegúrate de que .env.local tenga todas las credenciales');
  }

  console.log('\n🔐 Probando credenciales directamente...');
  console.log('-' .repeat(40));
  
  // Verificar credenciales
  const result = await verifyCredentials();
  
  console.log('\n📊 RESULTADO FINAL:');
  console.log('=' .repeat(30));
  
  if (result.success) {
    console.log('🎉 ¡MERCADOPAGO CONFIGURADO CORRECTAMENTE!');
    console.log('✅ Las credenciales son válidas');
    console.log('✅ Se puede crear preferencias de pago');
    console.log('✅ Pinteya está listo para recibir pagos');
  } else {
    console.log('❌ PROBLEMA CON MERCADOPAGO');
    console.log('🔍 Revisar credenciales en .env.local');
    console.log('📞 Contactar soporte de MercadoPago si persiste');
  }
  
  return result;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { verifyCredentials, checkEnvironmentVariables };
