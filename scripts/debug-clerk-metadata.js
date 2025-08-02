#!/usr/bin/env node

/**
 * PINTEYA E-COMMERCE - DEBUG CLERK METADATA
 * Verifica qué metadata está recibiendo realmente la aplicación
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

console.log('🔍 DEBUG CLERK METADATA - PINTEYA E-COMMERCE');
console.log('Verificando metadata real de Clerk...\n');

// Configuración
const clerkSecretKey = process.env.CLERK_SECRET_KEY;

if (!clerkSecretKey) {
  console.error('❌ CLERK_SECRET_KEY no encontrada en .env.local');
  process.exit(1);
}

/**
 * Hace una request a la API de Clerk
 */
function makeClerkRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.clerk.com',
      port: 443,
      path: `/v1${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData ? JSON.parse(responseData) : null
          };
          resolve(result);
        } catch (error) {
          reject(new Error(`Error parsing JSON: ${error.message}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Obtiene información detallada del usuario
 */
async function getUserDetails(userId) {
  console.log(`🔍 Obteniendo detalles del usuario ${userId}...`);
  
  try {
    const response = await makeClerkRequest(`/users/${userId}`);
    
    if (response.statusCode !== 200) {
      throw new Error(`Clerk API error: ${response.statusCode} - ${JSON.stringify(response.data)}`);
    }
    
    return response.data;
  } catch (error) {
    throw new Error(`Error obteniendo detalles del usuario: ${error.message}`);
  }
}

/**
 * Busca usuario por email
 */
async function findUserByEmail(email) {
  console.log(`🔍 Buscando usuario por email: ${email}...`);
  
  try {
    const response = await makeClerkRequest(`/users?email_address=${encodeURIComponent(email)}`);
    
    if (response.statusCode !== 200) {
      throw new Error(`Clerk API error: ${response.statusCode} - ${JSON.stringify(response.data)}`);
    }
    
    if (!response.data || response.data.length === 0) {
      throw new Error(`Usuario ${email} no encontrado en Clerk`);
    }
    
    return response.data[0];
  } catch (error) {
    throw new Error(`Error buscando usuario: ${error.message}`);
  }
}

/**
 * Analiza el metadata del usuario
 */
function analyzeMetadata(user) {
  console.log('\n📊 ANÁLISIS DETALLADO DEL METADATA:');
  console.log('=====================================');
  
  console.log(`\n👤 Usuario: ${user.email_addresses[0]?.email_address}`);
  console.log(`🆔 ID: ${user.id}`);
  console.log(`📅 Creado: ${new Date(user.created_at).toLocaleString()}`);
  console.log(`🔄 Actualizado: ${new Date(user.updated_at).toLocaleString()}`);
  
  console.log('\n🔓 PUBLIC METADATA:');
  console.log('-------------------');
  if (user.public_metadata && Object.keys(user.public_metadata).length > 0) {
    console.log(JSON.stringify(user.public_metadata, null, 2));
    
    // Verificar rol específicamente
    const publicRole = user.public_metadata.role;
    console.log(`\n🎯 Rol en public_metadata: "${publicRole}" (tipo: ${typeof publicRole})`);
    
    if (publicRole === 'admin') {
      console.log('✅ Rol admin detectado correctamente en public_metadata');
    } else {
      console.log('❌ Rol admin NO detectado en public_metadata');
    }
  } else {
    console.log('❌ Public metadata está vacío o no existe');
  }
  
  console.log('\n🔒 PRIVATE METADATA:');
  console.log('--------------------');
  if (user.private_metadata && Object.keys(user.private_metadata).length > 0) {
    console.log(JSON.stringify(user.private_metadata, null, 2));
    
    // Verificar rol específicamente
    const privateRole = user.private_metadata.role;
    console.log(`\n🎯 Rol en private_metadata: "${privateRole}" (tipo: ${typeof privateRole})`);
    
    if (privateRole === 'admin') {
      console.log('✅ Rol admin detectado correctamente en private_metadata');
    } else {
      console.log('❌ Rol admin NO detectado en private_metadata');
    }
  } else {
    console.log('❌ Private metadata está vacío o no existe');
  }
  
  console.log('\n🔧 UNSAFE METADATA:');
  console.log('-------------------');
  if (user.unsafe_metadata && Object.keys(user.unsafe_metadata).length > 0) {
    console.log(JSON.stringify(user.unsafe_metadata, null, 2));
  } else {
    console.log('❌ Unsafe metadata está vacío o no existe');
  }
}

/**
 * Simula lo que vería el middleware
 */
function simulateMiddleware(user) {
  console.log('\n🔧 SIMULACIÓN DEL MIDDLEWARE:');
  console.log('=============================');
  
  // Simular sessionClaims?.publicMetadata?.role
  const publicRole = user.public_metadata?.role;
  const privateRole = user.private_metadata?.role;
  
  console.log(`\nCódigo del middleware:`);
  console.log(`const userRole = sessionClaims?.publicMetadata?.role as string;`);
  console.log(`\nResultado:`);
  console.log(`userRole = "${publicRole}" (tipo: ${typeof publicRole})`);
  
  console.log(`\nCondición del middleware:`);
  console.log(`if (userRole !== 'admin' && userRole !== 'moderator') {`);
  
  if (publicRole !== 'admin' && publicRole !== 'moderator') {
    console.log('❌ CONDICIÓN VERDADERA - Usuario será redirigido a /my-account');
    console.log('🔧 PROBLEMA: El middleware no detecta el rol admin');
  } else {
    console.log('✅ CONDICIÓN FALSA - Usuario tendrá acceso admin');
  }
  
  console.log('\n📋 DIAGNÓSTICO:');
  console.log('---------------');
  
  if (!publicRole) {
    console.log('❌ PROBLEMA: public_metadata.role no está configurado');
    console.log('🔧 SOLUCIÓN: Configurar role: "admin" en public_metadata');
  } else if (publicRole !== 'admin') {
    console.log(`❌ PROBLEMA: public_metadata.role es "${publicRole}" en lugar de "admin"`);
    console.log('🔧 SOLUCIÓN: Cambiar role a "admin" en public_metadata');
  } else {
    console.log('✅ public_metadata.role está configurado correctamente');
  }
  
  if (privateRole === 'admin') {
    console.log('✅ private_metadata.role está configurado correctamente');
  } else {
    console.log('⚠️  private_metadata.role no está configurado (opcional pero recomendado)');
  }
}

/**
 * Proporciona instrucciones de corrección
 */
function provideFixInstructions(user) {
  console.log('\n🛠️  INSTRUCCIONES DE CORRECCIÓN:');
  console.log('=================================');
  
  const publicRole = user.public_metadata?.role;
  
  if (!publicRole || publicRole !== 'admin') {
    console.log('\n🎯 ACCIÓN REQUERIDA: Configurar public_metadata');
    console.log('1. Ve a: https://dashboard.clerk.com');
    console.log('2. Selecciona tu aplicación');
    console.log('3. Ve a "Users" → Busca el usuario');
    console.log(`4. Haz clic en el usuario (ID: ${user.id})`);
    console.log('5. Ve a la pestaña "Metadata"');
    console.log('6. En "Public metadata" asegúrate de tener EXACTAMENTE:');
    console.log('   {');
    console.log('     "role": "admin"');
    console.log('   }');
    console.log('7. Guarda los cambios');
    console.log('8. Espera 1-2 minutos para que se propague');
    console.log('9. Haz logout y login en la aplicación');
  } else {
    console.log('✅ El metadata parece estar configurado correctamente');
    console.log('🔧 Si aún tienes problemas, intenta:');
    console.log('1. Hacer logout y login');
    console.log('2. Limpiar caché del navegador');
    console.log('3. Verificar que no hay errores en la consola del navegador');
  }
}

/**
 * Función principal
 */
async function main() {
  try {
    const email = 'santiago@xor.com.ar';
    const userId = 'user_30i3tqf6NUp8kpkwrMgVZBvogBD'; // Del output anterior
    
    console.log('🚀 Iniciando debug de metadata...\n');
    
    // Opción 1: Buscar por email
    console.log('📧 MÉTODO 1: Buscar por email');
    try {
      const userByEmail = await findUserByEmail(email);
      analyzeMetadata(userByEmail);
      simulateMiddleware(userByEmail);
      provideFixInstructions(userByEmail);
    } catch (error) {
      console.error('❌ Error buscando por email:', error.message);
      
      // Opción 2: Buscar por ID directo
      console.log('\n🆔 MÉTODO 2: Buscar por ID directo');
      try {
        const userById = await getUserDetails(userId);
        analyzeMetadata(userById);
        simulateMiddleware(userById);
        provideFixInstructions(userById);
      } catch (error2) {
        console.error('❌ Error buscando por ID:', error2.message);
        throw new Error('No se pudo obtener información del usuario por ningún método');
      }
    }
    
  } catch (error) {
    console.error('\n❌ ERROR EN EL DEBUG:', error.message);
    
    if (error.message.includes('invalid')) {
      console.log('\n🔧 PROBLEMA CON CLERK_SECRET_KEY:');
      console.log('1. Ve a: https://dashboard.clerk.com');
      console.log('2. Ve a "API Keys"');
      console.log('3. Copia la "Secret key" completa');
      console.log('4. Actualiza CLERK_SECRET_KEY en .env.local');
      console.log('5. Asegúrate de que empiece con "[STRIPE_SECRET_KEY_REMOVED]" o "sk_live_"');
    }
    
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  findUserByEmail,
  getUserDetails,
  analyzeMetadata,
  simulateMiddleware,
  makeClerkRequest
};
