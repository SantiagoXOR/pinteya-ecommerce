// 🔧 Script para verificar configuración de OAuth de Google
// Verifica las URLs configuradas y sugiere actualizaciones

require('dotenv').config();

console.log('🔍 VERIFICACIÓN DE CONFIGURACIÓN OAUTH DE GOOGLE');
console.log('================================================\n');

// Variables de entorno críticas
const config = {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  NODE_ENV: process.env.NODE_ENV || 'development'
};

console.log('📋 CONFIGURACIÓN ACTUAL:');
console.log('------------------------');
console.log(`NEXTAUTH_URL: ${config.NEXTAUTH_URL || '❌ No configurado'}`);
console.log(`AUTH_GOOGLE_ID: ${config.AUTH_GOOGLE_ID ? '✅ Configurado' : '❌ No configurado'}`);
console.log(`AUTH_GOOGLE_SECRET: ${config.AUTH_GOOGLE_SECRET ? '✅ Configurado' : '❌ No configurado'}`);
console.log(`NODE_ENV: ${config.NODE_ENV}\n`);

// URLs esperadas para OAuth
const expectedUrls = {
  development: {
    origin: 'http://localhost:3000',
    callback: 'http://localhost:3000/api/auth/callback/google'
  },
  production: {
    origin: 'https://pinteya.com',
    callback: 'https://pinteya.com/api/auth/callback/google'
  }
};

const currentEnv = config.NODE_ENV === 'production' ? 'production' : 'development';
const expected = expectedUrls[currentEnv];

console.log('🎯 URLS REQUERIDAS EN GOOGLE CLOUD CONSOLE:');
console.log('-------------------------------------------');
console.log(`Entorno: ${currentEnv.toUpperCase()}`);
console.log(`\n📍 Orígenes JavaScript autorizados:`);
console.log(`   ${expected.origin}`);
console.log(`\n🔄 URIs de redirección autorizados:`);
console.log(`   ${expected.callback}`);

// Verificar coincidencia con NEXTAUTH_URL
const urlMatch = config.NEXTAUTH_URL === expected.origin;
console.log(`\n✅ Coincidencia NEXTAUTH_URL: ${urlMatch ? 'SÍ' : 'NO'}`);

if (!urlMatch) {
  console.log(`⚠️  NEXTAUTH_URL actual: ${config.NEXTAUTH_URL}`);
  console.log(`⚠️  URL esperada: ${expected.origin}`);
}

console.log('\n🔧 PASOS PARA ACTUALIZAR GOOGLE CLOUD CONSOLE:');
console.log('----------------------------------------------');
console.log('1. Ir a: https://console.cloud.google.com/apis/credentials');
console.log('2. Seleccionar el proyecto correcto');
console.log('3. Hacer clic en el ID de cliente OAuth 2.0');
console.log('4. En "Orígenes JavaScript autorizados", agregar:');
console.log(`   ${expected.origin}`);
console.log('5. En "URIs de redirección autorizados", agregar:');
console.log(`   ${expected.callback}`);
console.log('6. Guardar cambios');

// Verificar si hay URLs de desarrollo y producción
if (currentEnv === 'production') {
  console.log('\n💡 RECOMENDACIÓN:');
  console.log('Para facilitar el desarrollo, también puedes agregar:');
  console.log(`   Origen: ${expectedUrls.development.origin}`);
  console.log(`   Callback: ${expectedUrls.development.callback}`);
}

console.log('\n✅ Verificación completada');