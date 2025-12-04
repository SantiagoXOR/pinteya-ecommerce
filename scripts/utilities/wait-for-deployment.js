#!/usr/bin/env node

/**
 * Script para esperar que el deployment se complete en Vercel
 * Pinteya E-commerce - Agosto 2025
 */

const https = require('https')

console.log('⏳ ESPERANDO DEPLOYMENT DE CORRECCIÓN CLERK...\n')

// Función para hacer request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, response => {
      let data = ''
      response.on('data', chunk => (data += chunk))
      response.on('end', () =>
        resolve({
          statusCode: response.statusCode,
          data: data,
        })
      )
    })
    request.on('error', reject)
    request.setTimeout(5000, () => {
      request.destroy()
      reject(new Error('Timeout'))
    })
  })
}

// Función para verificar si el deployment está listo
async function checkDeployment() {
  try {
    console.log('🔍 Verificando deployment...')

    // Verificar API de diagnóstico (debe funcionar sin auth)
    const response = await makeRequest('https://www.pinteya.com/api/admin/debug')

    if (response.statusCode === 200) {
      try {
        const data = JSON.parse(response.data)
        if (data.success) {
          console.log('✅ Deployment completado - API de diagnóstico funcionando')
          return true
        }
      } catch (e) {
        // Ignorar errores de parsing
      }
    }

    console.log(`⏳ Deployment en progreso... (Status: ${response.statusCode})`)
    return false
  } catch (error) {
    console.log(`⏳ Esperando deployment... (${error.message})`)
    return false
  }
}

// Función principal
async function waitForDeployment() {
  const maxAttempts = 20 // 10 minutos máximo
  const interval = 30000 // 30 segundos entre intentos

  console.log(`🚀 Commit 8dbf470 pusheado - Esperando deployment en Vercel...`)
  console.log(`⏰ Verificando cada 30 segundos (máximo 10 minutos)\n`)

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`📋 Intento ${attempt}/${maxAttempts}:`)

    const isReady = await checkDeployment()

    if (isReady) {
      console.log('\n🎉 ¡DEPLOYMENT COMPLETADO!')
      console.log('✅ La corrección de Clerk está desplegada en producción')
      console.log('\n🔗 URLs para probar:')
      console.log('   🧪 Debug: https://www.pinteya.com/admin/debug-products')
      console.log('   📦 Admin: https://www.pinteya.com/admin/products')
      console.log('\n📋 Próximo paso:')
      console.log('   1. Recargar la página de debug en tu navegador')
      console.log('   2. Hacer clic en "Probar API Productos" nuevamente')
      console.log('   3. Verificar que ahora funcione sin error 500')
      return
    }

    if (attempt < maxAttempts) {
      console.log(`⏳ Esperando ${interval / 1000} segundos antes del próximo intento...\n`)
      await new Promise(resolve => setTimeout(resolve, interval))
    }
  }

  console.log('\n⚠️  Timeout alcanzado')
  console.log('El deployment puede estar tomando más tiempo del esperado.')
  console.log('Puedes probar manualmente en unos minutos más.')
}

// Ejecutar
waitForDeployment().catch(console.error)
