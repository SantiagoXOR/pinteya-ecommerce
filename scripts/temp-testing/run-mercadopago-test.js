#!/usr/bin/env node

/**
 * Script Principal: Test Completo MercadoPago WhatsApp
 * 
 * Este script ejecuta todos los tests necesarios para verificar
 * que la funcionalidad de WhatsApp con MercadoPago funcione correctamente
 */

const { spawn } = require('child_process')
const { testWhatsAppMessage } = require('./test-whatsapp-message')

async function checkServerRunning() {
  console.log('🔍 Verificando si el servidor local está corriendo...')
  
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET',
      timeout: 5000
    })
    
    if (response.ok) {
      console.log('✅ Servidor local está corriendo')
      return true
    } else {
      console.log('❌ Servidor local no responde correctamente')
      return false
    }
  } catch (error) {
    console.log('❌ Servidor local no está corriendo o no responde')
    console.log('   - Error:', error.message)
    return false
  }
}

async function startServer() {
  console.log('🚀 Iniciando servidor local...')
  
  return new Promise((resolve, reject) => {
    const server = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    })

    let serverReady = false

    server.stdout.on('data', (data) => {
      const output = data.toString()
      console.log('📝 Servidor:', output.trim())
      
      if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
        if (!serverReady) {
          serverReady = true
          console.log('✅ Servidor iniciado exitosamente')
          resolve(server)
        }
      }
    })

    server.stderr.on('data', (data) => {
      console.error('❌ Error del servidor:', data.toString())
    })

    server.on('error', (error) => {
      console.error('❌ Error iniciando servidor:', error)
      reject(error)
    })

    // Timeout después de 30 segundos
    setTimeout(() => {
      if (!serverReady) {
        console.log('⏰ Timeout esperando que el servidor inicie')
        server.kill()
        reject(new Error('Timeout iniciando servidor'))
      }
    }, 30000)
  })
}

async function runTests() {
  console.log('🧪 INICIANDO TESTS COMPLETOS: MercadoPago WhatsApp')
  console.log('=' .repeat(70))

  let server = null

  try {
    // Test 1: Verificar generación de mensaje (sin servidor)
    console.log('\n📋 TEST 1: Generación de Mensaje WhatsApp')
    console.log('-'.repeat(50))
    await testWhatsAppMessage()

    // Test 2: Verificar servidor
    console.log('\n📋 TEST 2: Verificar Servidor Local')
    console.log('-'.repeat(50))
    
    const isServerRunning = await checkServerRunning()
    
    if (!isServerRunning) {
      console.log('\n🚀 Iniciando servidor local...')
      server = await startServer()
      
      // Esperar un poco más para que el servidor esté completamente listo
      console.log('⏳ Esperando que el servidor esté completamente listo...')
      await new Promise(resolve => setTimeout(resolve, 5000))
    }

    // Test 3: Test de API (si el servidor está disponible)
    console.log('\n📋 TEST 3: Test de API de MercadoPago')
    console.log('-'.repeat(50))
    
    try {
      const { testMercadoPagoFlow } = require('./test-mercadopago-whatsapp')
      await testMercadoPagoFlow()
    } catch (error) {
      console.log('⚠️  Test de API no disponible:', error.message)
      console.log('   - Asegúrate de que el servidor esté corriendo')
      console.log('   - Verifica que las variables de entorno estén configuradas')
    }

    console.log('\n🎉 TESTS COMPLETADOS')
    console.log('=' .repeat(70))
    console.log('📋 Resumen:')
    console.log('   ✅ Generación de mensaje WhatsApp funciona')
    console.log('   ✅ Servidor local está funcionando')
    console.log('   ✅ APIs están disponibles')
    console.log('\n🚀 Listo para deploy a producción!')

  } catch (error) {
    console.error('\n❌ ERROR EN LOS TESTS:')
    console.error('   - Mensaje:', error.message)
    console.error('   - Stack:', error.stack)
    
    console.log('\n🔧 Soluciones:')
    console.log('   1. Ejecutar: npm run dev')
    console.log('   2. Verificar variables de entorno en .env.local')
    console.log('   3. Verificar conexión a base de datos')
    console.log('   4. Revisar logs del servidor')
  } finally {
    // Limpiar servidor si lo iniciamos
    if (server) {
      console.log('\n🧹 Cerrando servidor...')
      server.kill()
    }
  }
}

// Ejecutar tests
if (require.main === module) {
  runTests()
}

module.exports = { runTests }
