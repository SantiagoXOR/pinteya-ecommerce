#!/usr/bin/env node

/**
 * Script para crear usuarios de prueba en MercadoPago
 * Ejecutar con: node scripts/create-test-users.js
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;

console.log('🧪 CREADOR DE USUARIOS DE PRUEBA MERCADOPAGO');
console.log('='.repeat(50));

if (!ACCESS_TOKEN) {
  console.log('❌ MERCADOPAGO_ACCESS_TOKEN no encontrado');
  process.exit(1);
}

// Función para hacer requests HTTPS
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
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

// Crear usuario vendedor de prueba
async function createSellerUser() {
  console.log('\n👤 1. CREANDO USUARIO VENDEDOR DE PRUEBA...');
  
  try {
    const userData = {
      site_id: 'MLA', // Argentina
      description: 'Vendedor Test - Pinteya E-commerce'
    };

    const options = {
      hostname: 'api.mercadopago.com',
      port: 443,
      path: '/users/test',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, userData);
    
    if (response.status === 201) {
      console.log('✅ Usuario vendedor creado exitosamente');
      console.log('🆔 ID:', response.data.id);
      console.log('📧 Email:', response.data.email);
      console.log('🔑 Access Token:', response.data.access_token);
      console.log('🔓 Public Key:', response.data.public_key);
      return response.data;
    } else {
      console.log('❌ Error al crear usuario vendedor:', response.status);
      console.log('📄 Respuesta:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return null;
  }
}

// Crear usuario comprador de prueba
async function createBuyerUser() {
  console.log('\n👤 2. CREANDO USUARIO COMPRADOR DE PRUEBA...');
  
  try {
    const userData = {
      site_id: 'MLA', // Argentina
      description: 'Comprador Test - Pinteya E-commerce'
    };

    const options = {
      hostname: 'api.mercadopago.com',
      port: 443,
      path: '/users/test',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options, userData);
    
    if (response.status === 201) {
      console.log('✅ Usuario comprador creado exitosamente');
      console.log('🆔 ID:', response.data.id);
      console.log('📧 Email:', response.data.email);
      console.log('🔑 Access Token:', response.data.access_token);
      console.log('🔓 Public Key:', response.data.public_key);
      return response.data;
    } else {
      console.log('❌ Error al crear usuario comprador:', response.status);
      console.log('📄 Respuesta:', response.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return null;
  }
}

// Listar usuarios de prueba existentes
async function listTestUsers() {
  console.log('\n📋 3. LISTANDO USUARIOS DE PRUEBA EXISTENTES...');
  
  try {
    const options = {
      hostname: 'api.mercadopago.com',
      port: 443,
      path: '/users/test/search',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Usuarios de prueba encontrados:', response.data.length);
      response.data.forEach((user, index) => {
        console.log(`\n👤 Usuario ${index + 1}:`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Descripción: ${user.description}`);
        console.log(`   Fecha creación: ${user.date_created}`);
      });
      return response.data;
    } else {
      console.log('❌ Error al listar usuarios:', response.status);
      console.log('📄 Respuesta:', response.data);
      return [];
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return [];
  }
}

// Generar archivo de configuración
function generateConfigFile(seller, buyer) {
  const config = `# ===================================
# USUARIOS DE PRUEBA MERCADOPAGO
# Generado automáticamente
# ===================================

# Usuario Vendedor (para crear preferencias)
MERCADOPAGO_TEST_SELLER_ID=${seller?.id || 'PENDIENTE'}
MERCADOPAGO_TEST_SELLER_EMAIL=${seller?.email || 'PENDIENTE'}
MERCADOPAGO_TEST_SELLER_ACCESS_TOKEN=${seller?.access_token || 'PENDIENTE'}
MERCADOPAGO_TEST_SELLER_PUBLIC_KEY=${seller?.public_key || 'PENDIENTE'}

# Usuario Comprador (para realizar pagos)
MERCADOPAGO_TEST_BUYER_ID=${buyer?.id || 'PENDIENTE'}
MERCADOPAGO_TEST_BUYER_EMAIL=${buyer?.email || 'PENDIENTE'}
MERCADOPAGO_TEST_BUYER_ACCESS_TOKEN=${buyer?.access_token || 'PENDIENTE'}
MERCADOPAGO_TEST_BUYER_PUBLIC_KEY=${buyer?.public_key || 'PENDIENTE'}

# ===================================
# INSTRUCCIONES DE USO
# ===================================
# 1. Agregar estas variables a tu .env.local
# 2. Usar SELLER credentials para crear preferencias
# 3. Usar BUYER credentials para realizar pagos de prueba
# 4. Ambos usuarios están en el entorno sandbox de MercadoPago
`;

  require('fs').writeFileSync('.env.mercadopago-test-users', config);
  console.log('\n📄 Archivo de configuración generado: .env.mercadopago-test-users');
}

// Función principal
async function main() {
  console.log('\n🔍 Verificando usuarios existentes...');
  const existingUsers = await listTestUsers();
  
  let seller = null;
  let buyer = null;
  
  // Buscar si ya existen usuarios
  const existingSeller = existingUsers.find(u => u.description?.includes('Vendedor'));
  const existingBuyer = existingUsers.find(u => u.description?.includes('Comprador'));
  
  if (existingSeller) {
    console.log('\n✅ Usuario vendedor ya existe:', existingSeller.email);
    seller = existingSeller;
  } else {
    seller = await createSellerUser();
  }
  
  if (existingBuyer) {
    console.log('\n✅ Usuario comprador ya existe:', existingBuyer.email);
    buyer = existingBuyer;
  } else {
    buyer = await createBuyerUser();
  }
  
  // Generar archivo de configuración
  generateConfigFile(seller, buyer);
  
  console.log('\n🎉 PROCESO COMPLETADO!');
  console.log('='.repeat(50));
  
  if (seller && buyer) {
    console.log('✅ Usuarios de prueba configurados correctamente');
    console.log('📄 Revisa el archivo .env.mercadopago-test-users');
    console.log('🔧 Agrega las variables a tu .env.local');
    console.log('\n🧪 PRÓXIMOS PASOS:');
    console.log('1. Usar las credenciales del VENDEDOR para crear preferencias');
    console.log('2. Usar las credenciales del COMPRADOR para realizar pagos');
    console.log('3. Probar el flujo completo con estos usuarios');
  } else {
    console.log('❌ Algunos usuarios no pudieron ser creados');
    console.log('🔧 Verifica tus credenciales y conexión');
  }
}

// Ejecutar
main().catch(console.error);
