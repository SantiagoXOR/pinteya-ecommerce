#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE PRUEBA - Webhook MercadoPago
 * 
 * Este script prueba el webhook de MercadoPago localmente
 * para verificar que la solución del error 403 funciona correctamente.
 */

const axios = require('axios');

// Configuración
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3000/api/payments/webhook';
const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET || 'test-secret';

// Datos de prueba para el webhook
const webhookPayload = {
  action: "payment.updated",
  api_version: "v1",
  data: {
    id: "test_payment_id_123"
  },
  date_created: "2024-01-01T00:00:00Z",
  id: 123456,
  live_mode: false,
  type: "payment",
  user_id: "123456789"
};

// Diferentes escenarios de prueba
const testScenarios = [
  {
    name: "🎯 Simulación Dashboard MercadoPago",
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'MercadoPago-Webhook-Simulator/1.0',
      'Referer': 'https://www.mercadopago.com/developers',
      'x-signature': 'ts=1640995200,v1=test_signature',
      'x-request-id': 'test-request-dashboard-123'
    },
    expectedStatus: 200,
    description: "Simula webhook desde dashboard de MercadoPago"
  },
  {
    name: "🔧 Webhook Real MercadoPago",
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'MercadoPago-Webhook/1.0',
      'x-signature': 'ts=1640995200,v1=test_signature',
      'x-request-id': 'test-request-real-456'
    },
    expectedStatus: 200,
    description: "Simula webhook real de MercadoPago"
  },
  {
    name: "🚫 Origen Sospechoso",
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'BadBot/1.0',
      'Origin': 'https://malicious-site.com',
      'x-signature': 'ts=1640995200,v1=test_signature',
      'x-request-id': 'test-request-bad-789'
    },
    expectedStatus: 403,
    description: "Debe rechazar origen sospechoso"
  },
  {
    name: "🧪 Desarrollo Local",
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'curl/7.68.0',
      'Host': 'localhost:3000',
      'x-signature': 'ts=1640995200,v1=test_signature',
      'x-request-id': 'test-request-local-999'
    },
    expectedStatus: 200,
    description: "Debe permitir en desarrollo local"
  },
  {
    name: "📱 Postman/Insomnia",
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'PostmanRuntime/7.29.0',
      'x-signature': 'ts=1640995200,v1=test_signature',
      'x-request-id': 'test-request-postman-111'
    },
    expectedStatus: 200,
    description: "Debe permitir herramientas de testing"
  }
];

// Función para ejecutar una prueba
async function runTest(scenario) {
  console.log(`\n🧪 Ejecutando: ${scenario.name}`);
  console.log(`📝 ${scenario.description}`);
  
  try {
    const response = await axios.post(WEBHOOK_URL, webhookPayload, {
      headers: scenario.headers,
      timeout: 10000,
      validateStatus: () => true // No lanzar error por status codes
    });

    const success = response.status === scenario.expectedStatus;
    const statusIcon = success ? '✅' : '❌';
    
    console.log(`${statusIcon} Status: ${response.status} (esperado: ${scenario.expectedStatus})`);
    
    if (response.data) {
      console.log(`📄 Respuesta:`, JSON.stringify(response.data, null, 2));
    }

    if (!success) {
      console.log(`⚠️  FALLO: Se esperaba status ${scenario.expectedStatus} pero se recibió ${response.status}`);
    }

    return success;
    
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`🔌 Asegúrate de que el servidor esté corriendo en ${WEBHOOK_URL}`);
    }
    return false;
  }
}

// Función principal
async function main() {
  console.log('🚀 INICIANDO PRUEBAS DEL WEBHOOK MERCADOPAGO');
  console.log('=' .repeat(50));
  console.log(`🎯 URL del webhook: ${WEBHOOK_URL}`);
  console.log(`🔐 Secret configurado: ${WEBHOOK_SECRET ? 'SÍ' : 'NO'}`);
  
  let passedTests = 0;
  let totalTests = testScenarios.length;

  for (const scenario of testScenarios) {
    const success = await runTest(scenario);
    if (success) passedTests++;
  }

  console.log('\n' + '=' .repeat(50));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log(`✅ Exitosas: ${passedTests}/${totalTests}`);
  console.log(`❌ Fallidas: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡TODAS LAS PRUEBAS PASARON! El webhook está funcionando correctamente.');
  } else {
    console.log('⚠️  Algunas pruebas fallaron. Revisa la configuración del webhook.');
  }

  console.log('\n📋 PRÓXIMOS PASOS:');
  console.log('1. Si las pruebas pasaron, prueba desde el dashboard de MercadoPago');
  console.log('2. Verifica que MERCADOPAGO_WEBHOOK_SECRET esté configurado correctamente');
  console.log('3. Revisa los logs del servidor para más detalles');
  console.log('4. Consulta SOLUCION_ERROR_403_WEBHOOK_MERCADOPAGO.md para más información');
}

// Verificar dependencias
if (typeof axios === 'undefined') {
  console.error('❌ Error: axios no está instalado');
  console.log('📦 Instala con: npm install axios');
  process.exit(1);
}

// Ejecutar pruebas
main().catch(error => {
  console.error('❌ Error ejecutando pruebas:', error.message);
  process.exit(1);
});
