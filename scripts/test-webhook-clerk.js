#!/usr/bin/env node

/**
 * Script para probar el webhook de Clerk localmente
 * Simula un evento user.created de Clerk
 */

const crypto = require('crypto');

// Configuración
const WEBHOOK_URL = 'http://localhost:3000/api/webhooks/clerk';
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || 'whsec_test_secret';

// Datos de prueba del usuario
const testUserData = {
  type: 'user.created',
  data: {
    id: 'user_test_' + Date.now(),
    email_addresses: [
      {
        id: 'email_test_123',
        email_address: 'test.webhook@pinteya.com'
      }
    ],
    first_name: 'Test',
    last_name: 'Webhook',
    image_url: 'https://example.com/avatar.jpg',
    created_at: Date.now(),
    updated_at: Date.now()
  }
};

/**
 * Genera headers de svix para simular Clerk
 */
function generateSvixHeaders(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const id = 'msg_' + crypto.randomBytes(12).toString('hex');
  
  // Crear el mensaje para firmar
  const signedPayload = `${id}.${timestamp}.${payload}`;
  
  // Generar firma HMAC
  const signature = crypto
    .createHmac('sha256', secret.replace('whsec_', ''))
    .update(signedPayload)
    .digest('base64');

  return {
    'svix-id': id,
    'svix-timestamp': timestamp.toString(),
    'svix-signature': `v1,${signature}`
  };
}

/**
 * Envía el webhook de prueba
 */
async function testWebhook() {
  try {
    console.log('🚀 Iniciando prueba de webhook de Clerk...\n');
    
    const payload = JSON.stringify(testUserData);
    const headers = generateSvixHeaders(payload, WEBHOOK_SECRET);
    
    console.log('📋 Datos de prueba:');
    console.log('- Usuario ID:', testUserData.data.id);
    console.log('- Email:', testUserData.data.email_addresses[0].email_address);
    console.log('- Nombre:', testUserData.data.first_name, testUserData.data.last_name);
    console.log('- Evento:', testUserData.type);
    console.log();
    
    console.log('🔐 Headers generados:');
    console.log('- svix-id:', headers['svix-id']);
    console.log('- svix-timestamp:', headers['svix-timestamp']);
    console.log('- svix-signature:', headers['svix-signature'].substring(0, 20) + '...');
    console.log();
    
    console.log('📡 Enviando webhook a:', WEBHOOK_URL);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: payload
    });
    
    const responseText = await response.text();
    
    console.log('\n📥 Respuesta del webhook:');
    console.log('- Status:', response.status, response.statusText);
    console.log('- Headers:', Object.fromEntries(response.headers.entries()));
    console.log('- Body:', responseText);
    
    if (response.ok) {
      console.log('\n✅ Webhook procesado exitosamente!');
      console.log('🔍 Verifica en Supabase que el usuario se creó en user_profiles');
    } else {
      console.log('\n❌ Error en el webhook');
    }
    
  } catch (error) {
    console.error('\n💥 Error ejecutando prueba:', error.message);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  testWebhook();
}

module.exports = { testWebhook, generateSvixHeaders };
