#!/usr/bin/env node

/**
 * Script para probar la supresión de errores de red
 */

const { spawn } = require('child_process');
const fetch = require('node-fetch');

console.log('🧪 Testing Error Suppression System');
console.log('=====================================\n');

// Función para hacer requests que pueden fallar
async function testNetworkRequests() {
  const baseUrl = 'http://localhost:3000';
  
  const testCases = [
    {
      name: 'Valid API Request',
      url: `${baseUrl}/api/test-simple`,
      shouldSucceed: true
    },
    {
      name: 'Products API Request',
      url: `${baseUrl}/api/products?limit=1`,
      shouldSucceed: true
    },
    {
      name: 'Categories API Request', 
      url: `${baseUrl}/api/categories`,
      shouldSucceed: true
    },
    {
      name: 'Non-existent API',
      url: `${baseUrl}/api/non-existent`,
      shouldSucceed: false
    },
    {
      name: 'Admin API (should be protected)',
      url: `${baseUrl}/api/admin/products`,
      shouldSucceed: false
    }
  ];

  console.log('📡 Testing Network Requests:');
  console.log('-----------------------------\n');

  for (const testCase of testCases) {
    try {
      console.log(`🔍 Testing: ${testCase.name}`);
      console.log(`📍 URL: ${testCase.url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(testCase.url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Error-Suppression-Test/1.0'
        }
      });

      clearTimeout(timeoutId);

      console.log(`📊 Status: ${response.status}`);
      console.log(`✅ Success: ${response.ok}`);
      
      if (testCase.shouldSucceed && response.ok) {
        console.log('✅ PASS - Request succeeded as expected');
      } else if (!testCase.shouldSucceed && !response.ok) {
        console.log('✅ PASS - Request failed as expected');
      } else {
        console.log('❌ FAIL - Unexpected result');
      }

    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
      
      if (error.name === 'AbortError') {
        console.log('🔇 AbortError detected - should be suppressed in UI');
      }
      
      if (testCase.shouldSucceed) {
        console.log('❌ FAIL - Request should have succeeded');
      } else {
        console.log('✅ PASS - Request failed as expected');
      }
    }
    
    console.log(''); // Línea en blanco
  }
}

// Función para probar requests con abort
async function testAbortRequests() {
  console.log('🚫 Testing Abort Scenarios:');
  console.log('----------------------------\n');

  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🔍 Testing: Immediate Abort');
    
    const controller = new AbortController();
    
    // Abort inmediatamente
    setTimeout(() => {
      console.log('🚫 Aborting request...');
      controller.abort();
    }, 100);
    
    const response = await fetch(`${baseUrl}/api/products`, {
      signal: controller.signal
    });
    
    console.log('❌ FAIL - Request should have been aborted');
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('✅ PASS - AbortError caught correctly');
      console.log('🔇 This error should be suppressed in the UI');
    } else {
      console.log(`❌ FAIL - Unexpected error: ${error.message}`);
    }
  }
  
  console.log('');
}

// Función para verificar que el servidor está corriendo
async function checkServerStatus() {
  try {
    const response = await fetch('http://localhost:3000/api/test-simple', {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      console.log('✅ Server is running and responding');
      return true;
    } else {
      console.log(`❌ Server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Server is not responding: ${error.message}`);
    return false;
  }
}

// Función principal
async function main() {
  console.log('🔍 Checking server status...\n');
  
  const serverRunning = await checkServerStatus();
  
  if (!serverRunning) {
    console.log('❌ Server is not running. Please start the development server with:');
    console.log('   npm run dev');
    console.log('\nThen run this test again.');
    process.exit(1);
  }
  
  console.log('');
  
  await testNetworkRequests();
  await testAbortRequests();
  
  console.log('🎯 Test Summary:');
  console.log('================');
  console.log('✅ Error suppression system tested');
  console.log('🔇 AbortError and ERR_ABORTED should be suppressed in browser console');
  console.log('📊 Check browser console to verify suppression is working');
  console.log('\n💡 Tips:');
  console.log('- Open browser dev tools and check console');
  console.log('- Navigate through the app to trigger API calls');
  console.log('- Verify that ERR_ABORTED errors are not visible');
  console.log('- In development mode, suppressed errors appear as debug messages');
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = {
  testNetworkRequests,
  testAbortRequests,
  checkServerStatus
};
